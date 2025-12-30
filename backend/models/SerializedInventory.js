// models/SerializedInventory.js
import mongoose from 'mongoose';

const serializedInventorySchema = new mongoose.Schema({
  // Identification
  serialNumber: { type: String, required: true, unique: true },
  itemName: { type: String, required: true }, // e.g., "Split Type Aircon"
  brand: { type: String, required: true },
  model: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['aircon', 'compressor', 'motor', 'other']
  },
  
  // Specifications
  specifications: {
    capacity: String, // e.g., "1.5HP"
    voltage: String,
    refrigerant: String,
    other: mongoose.Schema.Types.Mixed
  },
  
  // Pricing
  purchasePrice: { type: Number, required: true },
  salePrice: { type: Number, required: true },
  
  // Status tracking
  status: {
    type: String,
    enum: ['available', 'installed', 'maintenance', 'retired'],
    default: 'available'
  },
  
  // Current location/assignment
  currentJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  currentCustomerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  installedDate: Date,
  
  // Purchase info
  supplier: String,
  purchaseDate: Date,
  warrantyExpiry: Date,
  
  // Maintenance history
  maintenanceHistory: [{
    date: Date,
    description: String,
    cost: Number,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }
  }],
  
  // Documents
  invoiceUrl: String,
  warrantyDocUrl: String,
  photoUrls: [String],
  
  // Metadata
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

serializedInventorySchema.index({ serialNumber: 1 });
serializedInventorySchema.index({ status: 1 });
serializedInventorySchema.index({ category: 1, status: 1 });

export default mongoose.model('SerializedInventory', serializedInventorySchema);  