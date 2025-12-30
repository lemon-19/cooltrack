// models/Customer.js
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  
  // Additional info
  company: String,
  notes: String,
  
  // Analytics
  totalJobs: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });

export default mongoose.model('Customer', customerSchema);