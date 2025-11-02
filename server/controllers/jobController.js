import Job from "../models/Job.js";
import { deductStock } from "./inventoryController.js";
import Log from "../models/Log.js";

export const getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      search,
      startDate,
      endDate,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const query = {};

    // 🔍 Role-based filter
    if (req.user.role !== "admin") {
      query.assignedTo = req.user._id;
    }

    // 📋 Status and Type filters
    if (status) query.status = status;
    if (type) query.type = type;

    // 📆 Date range filter
    if (startDate || endDate) {
      query.dateCreated = {};
      if (startDate) query.dateCreated.$gte = new Date(startDate);
      if (endDate) query.dateCreated.$lte = new Date(endDate);
    }

    // 🧠 Search filter
    if (search) {
      const searchRegex = new RegExp(search, "i"); // case-insensitive
      query.$or = [
        { clientName: searchRegex },
        { clientAddress: searchRegex },
        { contact: searchRegex },
      ];
    }

    // 🧾 Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // 📦 Fetch jobs with filters, pagination, and sorting
    const jobs = await Job.find(query)
      .populate("assignedTo", "name")
      .sort({ [sortBy]: order === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Job.countDocuments(query);

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      results: jobs,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createJob = async (req, res) => {
  const job = new Job(req.body);
  await job.save();
  res.json(job);
};

export const updateJobStatus = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });

  job.status = req.body.status || job.status;
  job.remarks = req.body.remarks || job.remarks;

  if (job.status === "Completed") {
    await deductStock(job.materialsUsed);
    await Log.create({ action: "Job Completed", userId: req.user._id });
  }

  await job.save();
  res.json(job);
};

export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("assignedTo", "name email")
      .populate("materialsUsed.itemId", "name stock unit");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
  } catch (error) {
    console.error("Error fetching job details:", error);
    res.status(500).json({ message: "Server error" });
  }
};
