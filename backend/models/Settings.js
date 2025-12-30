// models/Settings.js - CREATE THIS NEW FILE
import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  // Labor rate settings
  laborRates: {
    defaultHourlyRate: { type: Number, default: 0 },
    ratesByJobType: [{
      jobType: { 
        type: String, 
        enum: ['installation', 'repair', 'maintenance', 'inspection'] 
      },
      hourlyRate: Number
    }]
  },
  
  // Default revenue by job type
  defaultRevenue: [{
    jobType: { 
      type: String, 
      enum: ['installation', 'repair', 'maintenance', 'inspection'] 
    },
    amount: Number
  }],
  
  // Technician payment settings
  technicianPayment: {
    defaultCalculationType: { 
      type: String, 
      enum: ['fixed', 'hourly', 'percentage_revenue', 'percentage_profit'],
      default: 'hourly'
    },
    defaultFixedAmount: Number,
    defaultPercentage: Number
  },
  
  // General settings
  allowNegativeProfit: { type: Boolean, default: false },
  requireCostApproval: { type: Boolean, default: true },
  
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

export default mongoose.model('Settings', settingsSchema);