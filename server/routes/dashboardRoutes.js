import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getDashboardOverview,
  getJobsByMonth,
  getLowStockItems,
  getRecentLogs,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/overview", protect, adminOnly, getDashboardOverview);
router.get("/jobs-by-month", protect, adminOnly, getJobsByMonth);
router.get("/low-stock", protect, adminOnly, getLowStockItems);
router.get("/logs", protect, adminOnly, getRecentLogs);

export default router;
