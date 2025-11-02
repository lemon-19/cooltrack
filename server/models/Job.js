import mongoose from "mongoose";

const materialUsedSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory", required: true },
  itemName: String,
  quantity: Number,
  unit: String,
});

const jobSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  clientAddress: { type: String, required: true },
  contact: String,
  type: { type: String, enum: ["Installation", "Repair", "Maintenance"], required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  materialsUsed: [materialUsedSchema],
  status: { type: String, enum: ["Pending", "Ongoing", "Completed"], default: "Pending" },
  remarks: String,
  dateCreated: { type: Date, default: Date.now },
  dateCompleted: Date,
}, { timestamps: true });

export default mongoose.model("Job", jobSchema);
