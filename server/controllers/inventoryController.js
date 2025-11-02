import Inventory from "../models/Inventory.js";

export const getInventory = async (req, res) => {
  const items = await Inventory.find();
  res.json(items);
};

export const createItem = async (req, res) => {
  const item = new Inventory(req.body);
  await item.save();
  res.json(item);
};

export const updateItem = async (req, res) => {
  const updated = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
};

export const deductStock = async (materials) => {
  for (const mat of materials) {
    const item = await Inventory.findById(mat.itemId);
    if (!item) continue;
    item.totalQuantity -= mat.quantity;
    item.lastUpdated = new Date();
    await item.save();
  }
};
