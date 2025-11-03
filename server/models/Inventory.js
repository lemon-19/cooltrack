import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({
  batchName: String,          // e.g. "Batch #001"
  quantity: Number,
  lastUpdated: { type: Date, default: Date.now },
});

const inventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  unit: { type: String, required: true },
  totalQuantity: { type: Number, default: 0 },
  minThreshold: { type: Number, default: 10 },
  batches: [batchSchema],
  lastUpdated: { type: Date, default: Date.now },
});

export default mongoose.model("Inventory", inventorySchema);
