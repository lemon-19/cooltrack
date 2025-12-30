// services/serializedInventoryService.js
import SerializedInventory from '../models/SerializedInventory.js';
import StockTransaction from '../models/StockTransaction.js';
import mongoose from 'mongoose';

class SerializedInventoryService {
  
  // ============================================================================
  // EXISTING METHODS (Your original code - if you have them)
  // ============================================================================
  
  /**
   * Add new serialized item
   */
  async addItem(itemData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if serial number already exists
      const existing = await SerializedInventory.findOne({ 
        serialNumber: itemData.serialNumber 
      }).session(session);
      
      if (existing) {
        throw new Error('Serial number already exists');
      }

      const newItem = new SerializedInventory({
          serialNumber: itemData.serialNumber,
          itemName: itemData.itemName,
          brand: itemData.brand,
          model: itemData.model,              // <-- add this
          category: itemData.category,
          supplier: itemData.supplier,
          purchaseDate: itemData.purchaseDate ? new Date(itemData.purchaseDate) : new Date(),
          purchasePrice: itemData.purchasePrice,
          salePrice: itemData.salePrice,      // <-- add this
          warrantyExpiry: itemData.warrantyExpiry ? new Date(itemData.warrantyExpiry) : null,
          specifications: itemData.specifications || {},
          notes: itemData.notes,
          status: itemData.status || 'available',
          jobId: null,
          customerId: null
      });


      await newItem.save({ session });

      // Create transaction record
      await StockTransaction.create([{
        transactionType: 'purchase',
        inventoryType: 'serialized',
        inventoryItemId: newItem._id,
        itemName: newItem.itemName,
        serialNumber: newItem.serialNumber,
        quantityChange: 1,
        lengthChange: 0,
        unitCost: itemData.purchasePrice || 0,
        totalValue: itemData.purchasePrice || 0,
        referenceType: 'Manual',
        reason: 'Initial stock entry',
        performedBy: userId
      }], { session });

      await session.commitTransaction();

      // Emit socket event
      if (global.io) {
        global.io.emit('inventory:serialized-added', {
          serialNumber: newItem.serialNumber,
          itemName: newItem.itemName,
          status: newItem.status
        });
      }

      return newItem;

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Install/assign serialized item to job
   */
  async installItem(serialNumber, jobId, customerId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const item = await SerializedInventory.findOne({ serialNumber }).session(session);
      
      if (!item) {
        throw new Error('Item not found');
      }
      
      if (item.status !== 'available') {
        throw new Error(`Item is not available. Current status: ${item.status}`);
      }

      const previousStatus = item.status;
      item.status = 'installed';
      item.jobId = jobId;
      item.customerId = customerId;
      item.installDate = new Date();

      await item.save({ session });

      // Create transaction record
      await StockTransaction.create([{
        transactionType: 'installation',
        inventoryType: 'serialized',
        inventoryItemId: item._id,
        itemName: item.itemName,
        serialNumber: item.serialNumber,
        quantityChange: 0,
        lengthChange: 0,
        unitCost: item.purchasePrice || 0,
        totalValue: 0,
        referenceType: 'Job',
        referenceId: jobId,
        reason: 'Installed for job',
        performedBy: userId,
        metadata: { previousStatus, newStatus: 'installed', customerId }
      }], { session });

      await session.commitTransaction();

      // Emit socket events
      if (global.io) {
        global.io.emit('inventory:serialized-installed', {
          serialNumber: item.serialNumber,
          itemName: item.itemName,
          jobId,
          customerId
        });

        global.io.to(`job:${jobId}`).emit('job:equipment-installed', {
          serialNumber: item.serialNumber,
          itemName: item.itemName
        });
      }

      return item;

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ============================================================================
  // NEW METHODS FOR INVENTORY MANAGEMENT UI
  // ============================================================================

  /**
   * Get all serialized inventory items with optional filtering
   */
  async getAllItems(filters = {}) {
    try {
      const query = {};
      
      // Apply filters if provided
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.category) {
        query.category = filters.category;
      }
      
      if (filters.available === 'true') {
        query.status = 'available';
      }
      
      const items = await SerializedInventory.find(query)
        .sort({ serialNumber: 1 })
        .lean(); // remove populate temporarily
      
      return items;
    } catch (error) {
      throw new Error(`Failed to get serialized items: ${error.message}`);
    }
  }

  /**
   * Get single serialized item by serial number
   */
  async getItemBySerial(serialNumber) {
    try {
      const item = await SerializedInventory.findOne({ serialNumber })
        .populate('jobId', 'jobNumber')
        .populate('customerId', 'name')
        .lean();
      
      return item;
    } catch (error) {
      throw new Error(`Failed to get item: ${error.message}`);
    }
  }

  /**
   * Get history for serialized item
   */
  async getItemHistory(serialNumber) {
  try {
    const item = await SerializedInventory.findOne({ serialNumber });
    
    if (!item) {
      throw new Error('Item not found');
    }
    
    // Get transactions for this item
    const transactions = await StockTransaction.find({
      inventoryItemId: item._id
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('performedBy', 'name email')
      .populate('referenceId')
      .lean();
    
    // Transform transactions to history format
    const history = transactions.map(tx => {
      let action = 'other';
      if (tx.transactionType === 'purchase') action = 'added';
      else if (tx.transactionType === 'installation') action = 'installed';
      else if (tx.transactionType === 'maintenance') action = 'maintenance';
      else if (tx.transactionType === 'return') action = 'returned';
      
      return {
        action,
        transactionType: tx.transactionType,
        timestamp: tx.createdAt,
        performedBy: tx.performedBy?.name || 'System',
        jobReference: tx.referenceType === 'Job' ? tx.referenceId : null,
        reason: tx.reason,
        previousStatus: tx.metadata?.previousStatus || null,
        newStatus: tx.metadata?.newStatus || null,
        notes: tx.metadata?.notes || null
      };
    });

    return { item, history }; // ✅ Return both
  } catch (error) {
    throw new Error(`Failed to get item history: ${error.message}`);
  }
}


  /**
   * Update serialized item
   */
  async updateItem(itemId, updateData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const item = await SerializedInventory.findById(itemId).session(session);
      if (!item) {
        throw new Error('Item not found');
      }
      
      const previousStatus = item.status;
      
      // Update fields (except serialNumber which should be immutable)
      if (updateData.itemName !== undefined) item.itemName = updateData.itemName;
      if (updateData.brand !== undefined) item.brand = updateData.brand;
      if (updateData.category !== undefined) item.category = updateData.category;
      if (updateData.supplier !== undefined) item.supplier = updateData.supplier;
      if (updateData.purchaseDate !== undefined) item.purchaseDate = updateData.purchaseDate;
      if (updateData.purchasePrice !== undefined) item.purchasePrice = updateData.purchasePrice;
      if (updateData.location !== undefined) item.location = updateData.location;
      if (updateData.notes !== undefined) item.notes = updateData.notes;
      if (updateData.assignedTo !== undefined) item.assignedTo = updateData.assignedTo;
      
      // Handle status changes
      if (updateData.status && updateData.status !== previousStatus) {
        item.status = updateData.status;
        
        // If status changes from installed to something else, clear job/customer
        if (previousStatus === 'installed' && updateData.status !== 'installed') {
          item.jobId = null;
          item.customerId = null;
        }
        
        // Create transaction for status change
        await StockTransaction.create([{
          transactionType: 'status_change',
          inventoryType: 'serialized',
          inventoryItemId: item._id,
          itemName: item.itemName,
          serialNumber: item.serialNumber,
          quantityChange: 0,
          lengthChange: 0,
          unitCost: 0,
          totalValue: 0,
          referenceType: 'Manual',
          reason: `Status changed from ${previousStatus} to ${updateData.status}`,
          performedBy: userId,
          metadata: { previousStatus, newStatus: updateData.status }
        }], { session });
      }
      
      await item.save({ session });
      await session.commitTransaction();
      
      // Emit socket event
      if (global.io) {
        global.io.emit('inventory:serialized-updated', {
          serialNumber: item.serialNumber,
          itemName: item.itemName,
          status: item.status,
          previousStatus
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
   * Delete serialized item
   */
  async deleteItem(itemId) {
    try {
      const item = await SerializedInventory.findById(itemId);
      if (!item) {
        throw new Error('Item not found');
      }
      
      // Check if item is currently in use
      if (item.status === 'installed') {
        throw new Error('Cannot delete item that is currently in use. Please change status first.');
      }
      
      const serialNumber = item.serialNumber;
      await item.deleteOne();
      
      // Emit socket event
      if (global.io) {
        global.io.emit('inventory:serialized-deleted', {
          serialNumber,
          itemName: item.itemName
        });
      }
      
      return { message: 'Item deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete item: ${error.message}`);
    }
  }

  /**
   * Check if serial number is available
   */
  async isSerialNumberAvailable(serialNumber) {
    const item = await SerializedInventory.findOne({ serialNumber });
    return !item;
  }

  /**
   * Get items by status
   */
  async getItemsByStatus(status) {
    try {
      const items = await SerializedInventory.find({ status })
        .sort({ serialNumber: 1 })
        .lean();
      
      return items;
    } catch (error) {
      throw new Error(`Failed to get items by status: ${error.message}`);
    }
  }

  /**
   * Return item from job (change status from installed to available)
   */
  async returnItem(serialNumber, userId, reason = 'Job completed') {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const item = await SerializedInventory.findOne({ serialNumber }).session(session);
      
      if (!item) {
        throw new Error('Item not found');
      }
      
      if (item.status !== 'installed') {
        throw new Error(`Item is not in use. Current status: ${item.status}`);
      }

      const previousJobId = item.jobId;
      const previousCustomerId = item.customerId;
      
      item.status = 'available';
      item.jobId = null;
      item.customerId = null;

      await item.save({ session });

      // Create transaction record
      await StockTransaction.create([{
        transactionType: 'return',
        inventoryType: 'serialized',
        inventoryItemId: item._id,
        itemName: item.itemName,
        serialNumber: item.serialNumber,
        quantityChange: 0,
        lengthChange: 0,
        unitCost: 0,
        totalValue: 0,
        referenceType: 'Job',
        referenceId: previousJobId,
        reason,
        performedBy: userId,
        metadata: { 
          previousStatus: 'installed', 
          newStatus: 'available',
          previousJobId,
          previousCustomerId
        }
      }], { session });

      await session.commitTransaction();

      // Emit socket events
      if (global.io) {
        global.io.emit('inventory:serialized-returned', {
          serialNumber: item.serialNumber,
          itemName: item.itemName,
          previousJobId
        });

        if (previousJobId) {
          global.io.to(`job:${previousJobId}`).emit('job:equipment-returned', {
            serialNumber: item.serialNumber,
            itemName: item.itemName
          });
        }
      }

      return item;

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export default new SerializedInventoryService();