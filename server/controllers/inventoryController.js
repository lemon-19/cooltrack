import Inventory from "../models/Inventory.js";

/**
 * 📦 Get all inventory items (with optional search & filter)
 * Query examples:
 *   /api/inventory?category=Refrigerant
 *   /api/inventory?search=copper
 */
export const getInventory = async (req, res) => {
  try {
    const { category, search } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (search) filter.itemName = { $regex: search, $options: "i" }; // case-insensitive search

    const items = await Inventory.find(filter).sort({ itemName: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Error fetching inventory", error: err });
  }
};

/**
 * ➕ Add new item or batch (already provided)
 */
export const addOrUpdateItem = async (req, res) => {
  try {
    const { itemName, category, unit, batchName, quantity } = req.body;

    let item = await Inventory.findOne({ itemName });

    if (!item) {
      // Create new item if not found
      item = new Inventory({
        itemName,
        category,
        unit,
        totalQuantity: quantity,
        batches: [{ batchName, quantity }],
      });
    } else {
      // Update existing item
      const existingBatch = item.batches.find(
        (b) => b.batchName === batchName
      );

      if (existingBatch) {
        existingBatch.quantity = quantity;
        existingBatch.lastUpdated = new Date();
      } else {
        item.batches.push({ batchName, quantity });
      }

      // Update total
      item.totalQuantity = item.batches.reduce((sum, b) => sum + b.quantity, 0);
      item.lastUpdated = new Date();
    }

    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Error updating inventory", error: err });
  }
};

/**
 * ✏️ Update an existing batch inside an item
 * Body: { batchId, batchName, quantity }
 */
export const updateBatch = async (req, res) => {
  try {
    const { id } = req.params; // inventory item ID
    const { batchId, batchName, quantity } = req.body;

    const item = await Inventory.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const batch = item.batches.id(batchId);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    if (batchName) batch.batchName = batchName;
    if (quantity !== undefined) batch.quantity = quantity;
    batch.lastUpdated = new Date();

    // Recalculate total
    item.totalQuantity = item.batches.reduce((sum, b) => sum + b.quantity, 0);
    item.lastUpdated = new Date();

    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Error updating batch", error: err });
  }
};

/**
 * ❌ Delete a batch inside an item
 * DELETE /api/inventory/:id/batch/:batchId
 */
export const deleteBatch = async (req, res) => {
  try {
    const { id, batchId } = req.params;

    const item = await Inventory.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const batch = item.batches.id(batchId);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    batch.deleteOne();

    // Recalculate total
    item.totalQuantity = item.batches.reduce((sum, b) => sum + b.quantity, 0);
    item.lastUpdated = new Date();

    await item.save();
    res.json({ message: "Batch deleted", item });
  } catch (err) {
    res.status(500).json({ message: "Error deleting batch", error: err });
  }
};

/**
 * ❌ Delete an entire inventory item
 */
export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Inventory.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting item", error: err });
  }
};

// 🧮 Deduct stock when used in a job
export const deductStock = async (usedItems = []) => {
  try {
    for (const used of usedItems) {
      const { itemId, quantity } = used;
      const item = await Inventory.findById(itemId);

      if (!item) continue;

      let remaining = quantity;

      // Sort batches oldest first (FIFO)
      item.batches.sort((a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated));

      for (const batch of item.batches) {
        if (remaining <= 0) break;

        if (batch.quantity > remaining) {
          batch.quantity -= remaining;
          remaining = 0;
        } else {
          remaining -= batch.quantity;
          batch.quantity = 0;
        }
      }

      // Update total quantity
      item.totalQuantity = item.batches.reduce((sum, b) => sum + b.quantity, 0);
      item.lastUpdated = new Date();

      await item.save();
    }

    console.log("✅ Inventory updated successfully after job usage.");
  } catch (err) {
    console.error("❌ Error deducting stock:", err);
  }
};
