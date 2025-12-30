// routes/authRoutes.js
// REPLACE the existing authRoutes.js with this updated version

import express from 'express';
import { 
  login, 
  register, 
  getCurrentUser, 
  changePassword 
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/me', protect, getCurrentUser);
router.put('/change-password', protect, changePassword);

export default router;