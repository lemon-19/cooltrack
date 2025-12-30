// models/Job.js
import mongoose from 'mongoose';

const materialUsedSchema = new mongoose.Schema({
  // Reference to inventory
  inventoryType: { 
    type: String, 
    enum: ['serialized', 'grouped'],
    required: true 
  },
  inventoryItemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    refPath: 'materialsUsed.inventoryModel'
  },
  inventoryModel: {
    type: String,
    enum: ['SerializedInventory', 'GroupedInventory']
  },
  
  // Item details (denormalized for speed)
  itemName: { type: String, required: true },
  
  // For serialized items
  serialNumber: String,
  
  // For grouped items
  unitId: String, // Reference to specific unit used
  
  // Usage details
  unit: { 
    type: String, 
    enum: ['pcs', 'meter', 'roll', 'kg', 'liter'],
    required: true 
  },
  quantity: Number, // For pcs/each
  lengthUsed: Number, // For meter-based items
  
  // Pricing
  unitCost: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  
  // Metadata
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ADD THIS
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const costingApprovalSchema = new mongoose.Schema({
  isApproved: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  notes: String,
  profitAtApproval: Number,
  totalCostAtApproval: Number,
  totalRevenueAtApproval: Number
}, { _id: false });

const jobSchema = new mongoose.Schema({
  // Job identification
  jobNumber: { type: String, required: true, unique: true },
  
  // Customer info
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true 
  },
  customerName: String, // Denormalized
  customerAddress: String,
  customerPhone: String,
  
  // Job details
  type: {
    type: String,
    enum: ['installation', 'repair', 'maintenance', 'inspection'],
    required: true
  },
  description: String,
  
  // Assignment
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'paid'],
    default: 'pending'
  },
  
  // Dates
  scheduledDate: Date,
  startedAt: Date,
  completedAt: Date,
  paidAt: Date,
  
  // Materials used
  materialsUsed: [materialUsedSchema],
  totalMaterialCost: { type: Number, default: 0 },
  
  // Labor
  laborHours: { type: Number, default: 0 },
  laborCost: { type: Number, default: 0 },
  
  // Additional costs
  additionalCosts: [{
    description: String,
    amount: Number
  }],
  
  // Total costing
  totalCost: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },

  costingApproval: costingApprovalSchema,
  
  // Documentation
  photoUrls: [String], // Firebase Storage URLs
  documentUrls: [String],
  
  // Notes
  technicianNotes: String,
  adminNotes: String,
  customerFeedback: String,
  
  // Metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-calculate totals before save
jobSchema.pre('save', function () {
  // Material total
  this.totalMaterialCost = (this.materialsUsed || [])
    .reduce((sum, m) => sum + (m.totalCost || 0), 0);

  // Additional costs
  const additionalTotal = (this.additionalCosts || [])
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  // ✅ DO NOT calculate laborCost here
  this.totalCost =
    this.totalMaterialCost +
    (this.laborCost || 0) +
    additionalTotal;

  this.profit = (this.totalRevenue || 0) - this.totalCost;
  this.updatedAt = Date.now();
});





jobSchema.index({ jobNumber: 1 });
jobSchema.index({ customerId: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ assignedTo: 1 });
jobSchema.index({ createdAt: -1 });

export default mongoose.model('Job', jobSchema);