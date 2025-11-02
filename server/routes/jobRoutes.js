import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { getJobs, createJob, updateJobStatus, getJobById } from "../controllers/jobController.js";
const router = express.Router();

router.get("/", protect, getJobs);
router.get("/:id", protect, getJobById);
router.post("/", protect, adminOnly, createJob);
router.patch("/:id/status", protect, updateJobStatus);

export default router;
