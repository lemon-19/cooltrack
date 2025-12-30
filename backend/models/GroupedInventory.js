// models/GroupedInventory.js
import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema({
  unitId: { type: String, required: true },
  
  // PRIMARY VALUE - stores the actual stock amount
  // For 'pcs' items: this is the piece count
  // For 'meter/roll/kg/liter' items: this is the measurement
  value: { type: Number, required: true, min: 0 },
  
  // Purchase information
  purchasePrice: { type: Number, required: true, min: 0 },
  supplier: String,
  purchaseDate: { type: Date, default: Date.now },
  expiryDate: Date,
  batchNumber: String,
  notes: String,
  brand: String,
  location: String,
  isActive: { type: Boolean, default: true }
}, { _id: false });

const groupedInventorySchema = new mongoose.Schema({
  // Identification
  itemName: { type: String, required: true, unique: true },
  category: { 
    type: String, 
    required: true,
    enum: ['copper_tube', 'cable', 'screw', 'bolt', 'insulation', 'refrigerant', 'other']
  },
  
  // Unit type - THIS determines what 'value' represents
  unit: {
    type: String,
    enum: ['pcs', 'meter', 'roll', 'kg', 'liter'],
    required: true
  },
  
  // Specifications
  specifications: {
    size: String,
    gauge: String,
    material: String,
    other: mongoose.Schema.Types.Mixed
  },
  
  // Stock units array
  units: [unitSchema],
  
  // Auto-calculated total (in the unit specified above)
  totalValue: { type: Number, default: 0 },
  
  // Threshold for low stock alerts
  minValue: { type: Number, default: 0 },
  
  // Average pricing
  averagePurchasePrice: { type: Number, default: 0 },
  defaultSalePrice: Number,
  
  // Metadata
  lastRestocked: Date,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Virtual properties for backward compatibility
groupedInventorySchema.virtual('totalQuantity').get(function() {
  return this.unit === 'pcs' ? this.totalValue : 0;
});

groupedInventorySchema.virtual('totalLength').get(function() {
  return (this.unit === 'meter' || this.unit === 'roll') ? this.totalValue : 0;
});

groupedInventorySchema.virtual('minQuantity').get(function() {
  return this.unit === 'pcs' ? this.minValue : 0;
});

groupedInventorySchema.virtual('minLength').get(function() {
  return (this.unit === 'meter' || this.unit === 'roll') ? this.minValue : 0;
});

// Ensure virtuals are included in JSON/Object output
groupedInventorySchema.set('toJSON', { virtuals: true });
groupedInventorySchema.set('toObject', { virtuals: true });

// Auto-calculate totals before save
groupedInventorySchema.pre('save', function() {
  const activeUnits = this.units.filter(u => u.isActive);
  
  // Calculate total value (sum of all unit values)
  this.totalValue = activeUnits.reduce((sum, u) => sum + (u.value || 0), 0);
  
  // Calculate weighted average purchase price
  if (activeUnits.length > 0 && this.totalValue > 0) {
    this.averagePurchasePrice = activeUnits.reduce(
      (sum, u) => sum + (u.purchasePrice * u.value),
      0
    ) / this.totalValue;
  } else {
    this.averagePurchasePrice = 0;
  }
  
  // Update lastRestocked if we have active units
  if (activeUnits.length > 0) {
    const latestPurchaseDate = activeUnits.reduce((latest, u) => {
      return new Date(u.purchaseDate) > new Date(latest) ? u.purchaseDate : latest;
    }, activeUnits[0].purchaseDate);
    this.lastRestocked = latestPurchaseDate;
  }
  
  this.updatedAt = Date.now();
});

// Indexes
groupedInventorySchema.index({ itemName: 1 });
groupedInventorySchema.index({ category: 1 });

// Helper methods
groupedInventorySchema.methods.getLowStockStatus = function() {
  return this.totalValue < this.minValue;
};

groupedInventorySchema.methods.getDisplayValue = function() {
  return `${this.totalValue} ${this.unit}`;
};

// Helper method to get the appropriate value from usage object
groupedInventorySchema.methods.getUsageValue = function(usage) {
  if (this.unit === 'pcs') {
    return usage.quantity || 0;
  } else if (this.unit === 'meter' || this.unit === 'roll') {
    return usage.length || 0;
  } else {
    return usage.quantity || 0; // fallback for kg/liter
  }
};

export default mongoose.model('GroupedInventory', groupedInventorySchema);