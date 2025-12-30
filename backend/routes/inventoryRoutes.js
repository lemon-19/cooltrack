// routes/inventoryRoutes.js
import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  // Grouped inventory
  getAllGroupedItems,
  getGroupedItemByName,
  getGroupedItemHistory,
  addGroupedStock,
  useGroupedStock,
  updateGroupedItem,
  deleteGroupedItem,
  
  // Serialized inventory
  getAllSerializedItems,
  getSerializedItemBySerial,
  getSerializedItemHistory,
  addSerializedItem,
  installSerializedItem,
  updateSerializedItem,
  deleteSerializedItem,
} from '../controllers/inventoryController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// ============================================================================
// GROUPED INVENTORY ROUTES
// ============================================================================

// GET all grouped items
router.get('/grouped/all', getAllGroupedItems);

// GET single grouped item by name
router.get('/grouped/:itemName', getGroupedItemByName);

// GET grouped item history
router.get('/grouped/:itemName/history', getGroupedItemHistory);

// POST add stock to grouped inventory (admin only)
router.post('/grouped/add', adminOnly, addGroupedStock);

// POST use/consume grouped stock
router.post('/grouped/use', useGroupedStock);

// PUT update grouped item (admin only)
router.put('/grouped/:id', adminOnly, updateGroupedItem);

// DELETE grouped item (admin only)
router.delete('/grouped/:id', adminOnly, deleteGroupedItem);

// Legacy route for backwards compatibility
router.post('/grouped', adminOnly, addGroupedStock);

// ============================================================================
// SERIALIZED INVENTORY ROUTES
// ============================================================================

// GET all serialized items
router.get('/serialized/all', getAllSerializedItems);

// GET single serialized item by serial number
router.get('/serialized/:serialNumber', getSerializedItemBySerial);

// GET serialized item history
router.get('/serialized/:serialNumber/history', getSerializedItemHistory);

// POST add new serialized item (admin only)
router.post('/serialized', adminOnly, addSerializedItem);

// POST install/assign serialized item
router.post('/serialized/install', installSerializedItem);

// PUT update serialized item (admin only)
router.put('/serialized/:id', adminOnly, updateSerializedItem);

// DELETE serialized item (admin only)
router.delete('/serialized/:id', adminOnly, deleteSerializedItem);

export default router;