import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAssignedJobs,
  getJobById,
  updateJobStatusByTech,
  getInventoryView,
} from "../controllers/technicianController.js";

const router = express.Router();

/**
 * @route   GET /api/technician/jobs
 * @desc    Get all jobs assigned to the logged-in technician
 * @access  Private (Technician)
 */
router.get("/jobs", protect, getAssignedJobs);

/**
 * @route   GET /api/technician/jobs/:id
 * @desc    Get details of a specific assigned job
 * @access  Private (Technician)
 */
router.get("/jobs/:id", protect, getJobById);

/**
 * @route   PATCH /api/technician/jobs/:id/status
 * @desc    Update job status (Pending → Ongoing → Completed)
 * @access  Private (Technician)
 */
router.patch("/jobs/:id/status", protect, updateJobStatusByTech);

/**
 * @route   GET /api/technician/inventory
 * @desc    View inventory items (read-only)
 * @access  Private (Technician)
 */
router.get("/inventory", protect, getInventoryView);

export default router;
