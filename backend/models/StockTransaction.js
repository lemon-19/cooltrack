// models/StockTransaction.js
import mongoose from 'mongoose';

const stockTransactionSchema = new mongoose.Schema({
  // Type of transaction
  transactionType: {
    type: String,
    enum: ['purchase', 'job_usage', 'adjustment', 'return', 'transfer', 'installation'],
    required: true
  },
  
  // Reference to inventory
  inventoryType: { 
    type: String, 
    enum: ['serialized', 'grouped'],
    required: true 
  },
  inventoryItemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  itemName: String, // Denormalized
  
  // For serialized items
  serialNumber: String,
  
  // For grouped items
  unitId: String,
  
  // Change details
  quantityChange: Number, // Positive for add, negative for remove
  lengthChange: Number,
  
  // Reference (job, PO, etc.)
  referenceType: { 
    type: String, 
    enum: ['Job', 'PurchaseOrder', 'Manual'] 
  },
  referenceId: mongoose.Schema.Types.ObjectId,
  
  // Cost tracking
  unitCost: Number,
  totalValue: Number,
  
  // Metadata
  reason: String,
  notes: String,
  performedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  timestamp: { type: Date, default: Date.now }
});

stockTransactionSchema.index({ inventoryItemId: 1, timestamp: -1 });
stockTransactionSchema.index({ referenceType: 1, referenceId: 1 });
stockTransactionSchema.index({ timestamp: -1 });

export default mongoose.model('StockTransaction', stockTransactionSchema);