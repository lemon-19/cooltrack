// routes/settingsRoutes.js - CREATE THIS NEW FILE
import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getSettings,
  updateSettings,
  getLaborRateForJobType,
  getDefaultRevenueForJobType,
  updateLaborRateForJobType,
  updateDefaultRevenueForJobType,
  updateTechnicianPaymentDefaults
} from '../controllers/settingsController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ==========================================
// PUBLIC ROUTES (for authenticated users)
// ==========================================

// Get settings (all authenticated users)
router.get('/', getSettings);

// Get labor rate for job type
router.get('/labor-rate/:jobType', getLaborRateForJobType);

// Get default revenue for job type
router.get('/default-revenue/:jobType', getDefaultRevenueForJobType);

// ==========================================
// ADMIN ONLY ROUTES
// ==========================================

// Update all settings (admin only)
router.put('/', adminOnly, updateSettings);

// Update labor rate for specific job type (admin only)
router.put('/labor-rate/:jobType', adminOnly, updateLaborRateForJobType);

// Update default revenue for specific job type (admin only)
router.put('/default-revenue/:jobType', adminOnly, updateDefaultRevenueForJobType);

// Update technician payment defaults (admin only)
router.put('/technician-payment-defaults', adminOnly, updateTechnicianPaymentDefaults);

export default router;