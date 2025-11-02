import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { getLogs } from "../controllers/logController.js";
const router = express.Router();

router.get("/", protect, adminOnly, getLogs);

export default router;
