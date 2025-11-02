import mongoose from "mongoose";

const subGroupSchema = new mongoose.Schema({
  subName: String,
  quantity: Number,
  lastUpdated: Date,
});

const groupSchema = new mongoose.Schema({
  groupName: String,
  totalQuantity: Number,
  subGroups: [subGroupSchema],
});

const inventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  totalQuantity: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true },
  minThreshold: { type: Number, default: 10 },
  groups: [groupSchema],
  lastUpdated: { type: Date, default: Date.now },
});

export default mongoose.model("Inventory", inventorySchema);
