//routes/customerRoutes.js
import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';

const router = express.Router();
router.use(protect);

router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.post('/', adminOnly, createCustomer);
router.put('/:id', adminOnly, updateCustomer);
router.delete('/:id', adminOnly, deleteCustomer);

export default router;
