// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'technician'], 
    default: 'technician' 
  },
  phone: String,
  address: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Helper method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Helper method to check if user is technician
userSchema.methods.isTechnician = function() {
  return this.role === 'technician';
};

export default mongoose.model('User', userSchema);