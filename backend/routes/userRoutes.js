import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getTechnicians // <-- IMPORT THIS
} from '../controllers/userController.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

router.get('/', getUsers);

// Technicians route
router.get('/technicians', getTechnicians); // adminOnly already applied

router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/toggle-status', toggleUserStatus);



export default router;
