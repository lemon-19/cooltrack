import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getInventory,
  addOrUpdateItem,
  updateBatch,
  deleteBatch,
  deleteItem,
  deductStock
} from "../controllers/inventoryController.js";

const router = express.Router();

// 📦 Get all or filtered inventory
router.get("/", protect, getInventory);

// ➕ Add or update an item
router.post("/", protect, adminOnly, addOrUpdateItem);

// ✏️ Update a batch in an item
router.put("/:id/batch", protect, adminOnly, updateBatch);

// ❌ Delete a batch
router.delete("/:id/batch/:batchId", protect, adminOnly, deleteBatch);

// ❌ Delete an item
router.delete("/:id", protect, adminOnly, deleteItem);

export default router;
