import Job from "../models/Job.js";
import Inventory from "../models/Inventory.js";
import Log from "../models/Log.js";

/**
 * 🧾 Get all jobs assigned to the logged-in technician
 */
export const getAssignedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ assignedTo: req.user._id })
      .sort({ createdAt: -1 })
      .populate("assignedTo", "name role");
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch jobs", error });
  }
};

/**
 * 📋 Get one specific job detail (for technician)
 */
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      assignedTo: req.user._id,
    }).populate("assignedTo", "name role");

    if (!job) return res.status(404).json({ message: "Job not found or not assigned to you" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: "Failed to get job detail", error });
  }
};

/**
 * 🔄 Update job status (Pending → Ongoing → Completed)
 * Technician can only update their own assigned jobs
 */
export const updateJobStatusByTech = async (req, res) => {
  try {
    const { status, remarks, proofImage } = req.body;

    const job = await Job.findOne({ _id: req.params.id, assignedTo: req.user._id });
    if (!job) return res.status(404).json({ message: "Job not found or not assigned to you" });

    // Allow status transitions only
    const validStatus = ["Pending", "Ongoing", "Completed"];
    if (!validStatus.includes(status)) return res.status(400).json({ message: "Invalid status" });

    job.status = status;
    if (remarks) job.remarks = remarks;
    if (proofImage) job.proofImage = proofImage; // optional proof photo
    if (status === "Completed") job.dateCompleted = new Date();

    await job.save();

    // Add to logs
    await Log.create({
      action: `Technician updated job status to ${status}`,
      userId: req.user._id,
    });

    res.json({ message: "Job status updated", job });
  } catch (error) {
    res.status(500).json({ message: "Failed to update job status", error });
  }
};

/**
 * 📦 View current inventory (read-only)
 */
export const getInventoryView = async (req, res) => {
  try {
    const inventory = await Inventory.find().select("itemName category totalQuantity unit minThreshold");
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch inventory", error });
  }
};
