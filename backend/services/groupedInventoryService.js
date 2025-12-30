// services/groupedInventoryService.js
import GroupedInventory from '../models/GroupedInventory.js';
import StockTransaction from '../models/StockTransaction.js';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

class GroupedInventoryService {
  
  /**
   * Helper: Convert old-style usage/unitData to value based on unit type
   */
  _extractValue(data, unit) {
    if (unit === 'pcs') {
      return data.quantity || 0;
    } else if (unit === 'meter' || unit === 'roll') {
      return data.length || 0;
    } else if (unit === 'kg' || unit === 'liter') {
      return data.quantity || 0;
    }
    return 0;
  }

  /**
   * Add new stock unit
   */
  async addStock(itemName, unitData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find existing item (case-insensitive)
      let item = await GroupedInventory.findOne({ 
        itemName: new RegExp(`^${itemName}$`, "i") 
      }).session(session);

      // Determine unit type
      const unit = item ? item.unit : unitData.unit;
      
      if (!unit) {
        throw new Error('Unit type is required');
      }

      // Extract the appropriate value based on unit type
      const value = this._extractValue(unitData, unit);

      if (value <= 0) {
        throw new Error(`Invalid ${unit} value: must be greater than 0`);
      }

      // Generate unique unitId
      const unitId = nanoid(10);

      // Prepare the new unit object
      const newUnit = {
        unitId,
        value, // This is the KEY change - one field for all units
        brand: unitData.brand || "",
        purchasePrice: unitData.purchasePrice || 0,
        supplier: unitData.supplier || "",
        location: unitData.location || "",
        purchaseDate: unitData.purchaseDate ? new Date(unitData.purchaseDate) : new Date(),
        expiryDate: unitData.expiryDate ? new Date(unitData.expiryDate) : undefined,
        batchNumber: unitData.batchNumber || "",
        notes: unitData.notes || "",
        isActive: true
      };

      // If item doesn't exist, create it
      if (!item) {
        item = new GroupedInventory({
          itemName,
          category: unitData.category || 'other',
          unit: unit,
          minValue: unitData.minimumQuantity || 0,
          specifications: unitData.specifications || {},
          units: [newUnit]
        });
      } else {
        // Update minValue if provided
        if (unitData.minimumQuantity !== undefined) {
          item.minValue = unitData.minimumQuantity;
        }
        item.units.push(newUnit);
      }

      // Save the grouped inventory (triggers pre-save hook)
      await item.save({ session });

      // Record stock transaction
      await StockTransaction.create([{
        transactionType: "purchase",
        inventoryType: "grouped",
        inventoryItemId: item._id,
        itemName: item.itemName,
        unitId: unitId,
        quantityChange: unit === 'pcs' ? value : 0,
        lengthChange: (unit === 'meter' || unit === 'roll') ? value : 0,
        unitCost: unitData.purchasePrice || 0,
        totalValue: (unitData.purchasePrice || 0) * value,
        referenceType: "Manual",
        reason: "Stock purchase",
        performedBy: userId
      }], { session });

      await session.commitTransaction();

      // Emit event via socket if available
      if (global.io) {
        global.io.to(`inventory:${item._id}`).emit("inventory:stock-added", {
          itemName: item.itemName,
          totalValue: item.totalValue,
          unit: item.unit
        });
      }

      console.log(`✅ Added ${value} ${unit} of ${itemName}`);
      return item;

    } catch (error) {
      await session.abortTransaction();
      throw new Error(`Failed to add grouped stock: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Use stock (FIFO - oldest first)
   */
  async useStock(itemName, usage, jobId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log('\n🔍 useStock called:');
      console.log('   Item:', itemName);
      console.log('   Usage:', usage);
      
      const item = await GroupedInventory.findOne({ 
        itemName: new RegExp(`^${itemName}$`, 'i') 
      }).session(session);
      
      if (!item) {
        throw new Error(`Item "${itemName}" not found in inventory`);
      }

      // Extract requested amount based on unit type
      const requestedAmount = this._extractValue(usage, item.unit);

      console.log('   Unit:', item.unit);
      console.log('   Requested:', requestedAmount, item.unit);
      console.log('   Available:', item.totalValue, item.unit);

      // Validation
      if (requestedAmount <= 0) {
        throw new Error(`Requested amount must be greater than 0`);
      }

      if (requestedAmount > item.totalValue) {
        throw new Error(
          `Insufficient stock for ${itemName}. ` +
          `Available: ${item.totalValue} ${item.unit}, ` +
          `Requested: ${requestedAmount} ${item.unit}`
        );
      }

      // Get active units sorted by oldest first (FIFO)
      const activeUnits = item.units
        .filter(u => u.isActive && u.value > 0)
        .sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate));

      if (activeUnits.length === 0) {
        throw new Error(`No active units available for ${itemName}`);
      }

      console.log('   Active units:', activeUnits.length);

      let remaining = requestedAmount;
      const usedUnits = [];
      let totalCost = 0;

      // Deduct from units using FIFO
      for (const unit of activeUnits) {
        if (remaining <= 0) break;

        const availableInUnit = unit.value;
        const useAmount = Math.min(availableInUnit, remaining);

        console.log(`   Using ${useAmount} ${item.unit} from unit ${unit.unitId}`);

        // Deduct the amount
        unit.value -= useAmount;

        // Calculate cost
        const unitCost = unit.purchasePrice || 0;
        const cost = unitCost * useAmount;
        totalCost += cost;

        // Mark unit as inactive if depleted
        if (unit.value === 0) {
          unit.isActive = false;
          console.log(`   Unit ${unit.unitId} depleted, marking inactive`);
        }

        // Track used units
        usedUnits.push({
          unitId: unit.unitId,
          amount: useAmount,
          cost: cost,
          unitCost: unitCost
        });

        remaining -= useAmount;

        // Create stock transaction for this unit
        await StockTransaction.create([{
          transactionType: 'job_usage',
          inventoryType: 'grouped',
          inventoryItemId: item._id,
          itemName: item.itemName,
          unitId: unit.unitId,
          quantityChange: item.unit === 'pcs' ? -useAmount : 0,
          lengthChange: (item.unit === 'meter' || item.unit === 'roll') ? -useAmount : 0,
          unitCost: unitCost,
          totalValue: cost,
          referenceType: 'Job',
          referenceId: jobId,
          reason: 'Used in job',
          performedBy: userId
        }], { session });
      }

      // Final check
      if (remaining > 0) {
        throw new Error(
          `Could not fulfill complete request for ${itemName}. ` +
          `Still need: ${remaining} ${item.unit}`
        );
      }

      // Save the updated item (triggers pre-save hook to recalculate totals)
      await item.save({ session });

      console.log('   ✅ Stock deducted successfully');
      console.log('   New total value:', item.totalValue, item.unit);
      console.log('   Total cost:', totalCost);

      await session.commitTransaction();

      // Calculate average unit cost
      const averageUnitCost = totalCost / requestedAmount;

      // Emit socket event
      if (global.io) {
        global.io.to(`inventory:${item._id}`).emit('inventory:used', {
          itemName: item.itemName,
          totalValue: item.totalValue,
          unit: item.unit,
          usedUnits
        });
      }

      return {
        item,
        usedUnits,
        totalCost,
        averageUnitCost
      };

    } catch (error) {
      await session.abortTransaction();
      console.error('❌ useStock error:', error.message);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Check availability
   */
  async checkAvailability(itemName, required) {
    const item = await GroupedInventory.findOne({ 
      itemName: new RegExp(`^${itemName}$`, 'i') 
    });
    
    if (!item) {
      return { available: false, message: 'Item not found' };
    }
    
    const requiredAmount = this._extractValue(required, item.unit);
    
    if (requiredAmount > item.totalValue) {
      return { 
        available: false, 
        message: `Insufficient stock. Need: ${requiredAmount} ${item.unit}, Available: ${item.totalValue} ${item.unit}` 
      };
    }
    
    return { available: true, item };
  }

  /**
   * Get low stock items
   */
  async getLowStockItems() {
    const items = await GroupedInventory.find({
      $expr: { $lte: ['$totalValue', '$minValue'] }
    });
    
    return items;
  }

  /**
   * Get all grouped inventory items with optional filtering
   */
  async getAllItems(filters = {}) {
    try {
      const query = {};
      
      if (filters.category) {
        query.category = filters.category;
      }
      
      if (filters.lowStock === 'true') {
        query.$expr = { $lte: ['$totalValue', '$minValue'] };
      }
      
      const items = await GroupedInventory.find(query)
        .sort({ itemName: 1 })
        .lean();
      
      // Transform items to match frontend expectations
      const transformedItems = items.map(item => ({
        _id: item._id,
        itemName: item.itemName,
        brand: item.units?.[0]?.brand || '',
        category: item.category,
        supplier: item.units?.[0]?.supplier || '',
        purchaseDate: item.units?.[0]?.purchaseDate || null,
        purchasePrice: item.averagePurchasePrice || 0,
        location: item.units?.[0]?.location || '',
        notes: item.notes || '',
        currentValue: item.totalValue || 0,
        minimumQuantity: item.minValue || 0,
        unit: item.unit || 'pcs',
        totalValue: item.totalValue,
        units: item.units || []
      }));
      
      return transformedItems;
    } catch (error) {
      throw new Error(`Failed to get grouped items: ${error.message}`);
    }
  }

  /**
   * Get single grouped item by name
   */
  async getItemByName(itemName) {
    try {
      const item = await GroupedInventory.findOne({ 
        itemName: new RegExp(`^${itemName}$`, 'i') 
      }).lean();
      
      if (!item) return null;
      
      return {
        _id: item._id,
        itemName: item.itemName,
        brand: item.units?.[0]?.brand || '',
        category: item.category,
        supplier: item.units?.[0]?.supplier || '',
        purchaseDate: item.units?.[0]?.purchaseDate || null,
        purchasePrice: item.averagePurchasePrice || 0,
        location: item.units?.[0]?.location || '',
        notes: item.notes || '',
        currentValue: item.totalValue || 0,
        minimumQuantity: item.minValue || 0,
        minValue: item.minValue || 0, // Add this for consistency
        unit: item.unit || 'pcs',
        totalValue: item.totalValue,
        units: item.units || []
      };
    } catch (error) {
      throw new Error(`Failed to get item: ${error.message}`);
    }
  }

  /**
   * Get usage history for grouped item
   */
  async getItemHistory(itemName) {
    try {
      const item = await GroupedInventory.findOne({ 
        itemName: new RegExp(`^${itemName}$`, 'i') 
      });
      
      if (!item) {
        throw new Error('Item not found');
      }
      
      const transactions = await StockTransaction.find({
        inventoryItemId: item._id
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('performedBy', 'name email')
        .lean();
      
      const history = transactions.map(tx => ({
        action: tx.transactionType === 'purchase' ? 'added' : 
                tx.transactionType === 'job_usage' ? 'removed' : 'adjusted',
        quantityChange: tx.quantityChange,
        lengthChange: tx.lengthChange,
        valueChange: Math.abs(tx.quantityChange || tx.lengthChange || 0),
        unit: item.unit,
        timestamp: tx.createdAt,
        performedBy: tx.performedBy?.name || 'System',
        jobReference: tx.referenceType === 'Job' ? tx.referenceId : null,
        reason: tx.reason
      }));
      
      return history;
    } catch (error) {
      throw new Error(`Failed to get item history: ${error.message}`);
    }
  }

  /**
   * Update grouped item
   */
  async updateItem(itemId, updateData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const item = await GroupedInventory.findById(itemId).session(session);
      if (!item) {
        throw new Error('Item not found');
      }
      
      // Update main item fields
      if (updateData.itemName) item.itemName = updateData.itemName;
      if (updateData.category) item.category = updateData.category;
      if (updateData.unit) item.unit = updateData.unit;
      if (updateData.minimumQuantity !== undefined) item.minValue = updateData.minimumQuantity;
      if (updateData.specifications) item.specifications = updateData.specifications;
      
      // Update the most recent unit's metadata if unitData provided
      if (updateData.unitData && item.units.length > 0) {
        const latestUnit = item.units[item.units.length - 1];
        
        if (updateData.unitData.brand !== undefined) latestUnit.brand = updateData.unitData.brand;
        if (updateData.unitData.supplier !== undefined) latestUnit.supplier = updateData.unitData.supplier;
        if (updateData.unitData.location !== undefined) latestUnit.location = updateData.unitData.location;
        if (updateData.unitData.notes !== undefined) latestUnit.notes = updateData.unitData.notes;
        if (updateData.unitData.purchasePrice !== undefined) latestUnit.purchasePrice = updateData.unitData.purchasePrice;
        
        // Handle value adjustment if provided (quantity or length)
        const newValue = this._extractValue(updateData.unitData, item.unit);
        if (newValue !== undefined && newValue > 0) {
          const oldValue = latestUnit.value;
          const valueChange = newValue - oldValue;
          
          latestUnit.value = newValue;
          
          // Create transaction for adjustment
          await StockTransaction.create([{
            transactionType: 'adjustment',
            inventoryType: 'grouped',
            inventoryItemId: item._id,
            itemName: item.itemName,
            unitId: latestUnit.unitId,
            quantityChange: item.unit === 'pcs' ? valueChange : 0,
            lengthChange: (item.unit === 'meter' || item.unit === 'roll') ? valueChange : 0,
            unitCost: latestUnit.purchasePrice,
            totalValue: latestUnit.purchasePrice * Math.abs(valueChange),
            referenceType: 'Manual',
            reason: 'Manual adjustment via inventory management',
            performedBy: userId
          }], { session });
        }
      }
      
      await item.save({ session });
      await session.commitTransaction();
      
      // Emit socket event
      if (global.io) {
        global.io.to(`inventory:${item._id}`).emit('inventory:updated', {
          itemName: item.itemName,
          totalValue: item.totalValue,
          unit: item.unit
        });
      }
      
      return item;
    } catch (error) {
      await session.abortTransaction();
      throw new Error(`Failed to update item: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Delete grouped item
   */
  async deleteItem(itemId) {
    try {
      const item = await GroupedInventory.findById(itemId);
      if (!item) {
        throw new Error('Item not found');
      }
      
      // Check if item has active units
      const hasActiveUnits = item.units.some(u => u.isActive && u.value > 0);
      if (hasActiveUnits) {
        throw new Error('Cannot delete item with active stock. Please use all stock first.');
      }
      
      await item.deleteOne();
      
      // Emit socket event
      if (global.io) {
        global.io.emit('inventory:deleted', {
          itemId: item._id,
          itemName: item.itemName
        });
      }
      
      return { message: 'Item deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete item: ${error.message}`);
    }
  }

  /**
 * Return stock (reverse of useStock) - for when materials are removed from job
 */
async returnStock(itemName, returnData, unitId, userId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log('\n🔄 returnStock called:');
    console.log('   Item:', itemName);
    console.log('   Return data:', returnData);
    console.log('   Unit ID:', unitId);
    
    const item = await GroupedInventory.findOne({ 
      itemName: new RegExp(`^${itemName}$`, 'i') 
    }).session(session);
    
    if (!item) {
      throw new Error(`Item "${itemName}" not found in inventory`);
    }

    const returnAmount = this._extractValue(returnData, item.unit);

    console.log('   Unit:', item.unit);
    console.log('   Return amount:', returnAmount, item.unit);

    if (returnAmount <= 0) {
      throw new Error('Return amount must be greater than 0');
    }

    // Find the unit to return to
    const unit = item.units.find(u => u.unitId === unitId);
    
    if (!unit) {
      throw new Error(`Unit ${unitId} not found`);
    }

    console.log(`   Found unit ${unitId}, current value: ${unit.value}`);

    // Add back the returned amount
    unit.value += returnAmount;
    unit.isActive = true;

    console.log(`   New value: ${unit.value}`);

    // Create stock transaction
    await StockTransaction.create([{
      transactionType: 'return',
      inventoryType: 'grouped',
      inventoryItemId: item._id,
      itemName: item.itemName,
      unitId: unit.unitId,
      quantityChange: item.unit === 'pcs' ? returnAmount : 0,
      lengthChange: (item.unit === 'meter' || item.unit === 'roll') ? returnAmount : 0,
      unitCost: unit.purchasePrice,
      totalValue: unit.purchasePrice * returnAmount,
      referenceType: 'Manual',
      reason: 'Returned from job',
      performedBy: userId
    }], { session });

    await item.save({ session });
    await session.commitTransaction();

    console.log(`✅ Returned ${returnAmount} ${item.unit} of ${itemName}`);
    console.log(`   New total value: ${item.totalValue} ${item.unit}`);

    // Emit socket event
    if (global.io) {
      global.io.to(`inventory:${item._id}`).emit('inventory:returned', {
        itemName: item.itemName,
        totalValue: item.totalValue,
        unit: item.unit,
        returnedAmount: returnAmount
      });
    }

    return item;

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ returnStock error:', error.message);
    throw error;
  } finally {
    session.endSession();
  }
}
}

export default new GroupedInventoryService();