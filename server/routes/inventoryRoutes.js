import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { getInventory, createItem, updateItem } from "../controllers/inventoryController.js";
const router = express.Router();

router.get("/", protect, getInventory);
router.post("/", protect, adminOnly, createItem);
router.put("/:id", protect, adminOnly, updateItem);

export default router;
