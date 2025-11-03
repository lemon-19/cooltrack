import Job from "../models/Job.js";
import Inventory from "../models/Inventory.js";
import User from "../models/User.js";
import Log from "../models/Log.js";

/**
 * 📊 Dashboard Overview
 * Returns totals for jobs, inventory, users, and low-stock alerts.
 */
export const getDashboardOverview = async (req, res) => {
  try {
    const [totalJobs, pendingJobs, completedJobs] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ status: "Pending" }),
      Job.countDocuments({ status: "Completed" }),
    ]);

    const [lowStock, totalItems, totalUsers] = await Promise.all([
      Inventory.countDocuments({ $expr: { $lte: ["$totalQuantity", "$minThreshold"] } }),
      Inventory.countDocuments(),
      User.countDocuments(),
    ]);

    res.json({
      totalJobs,
      pendingJobs,
      completedJobs,
      lowStock,
      totalItems,
      totalUsers,
    });
  } catch (err) {
    console.error("Dashboard overview error:", err);
    res.status(500).json({ message: "Error fetching dashboard data" });
  }
};

/**
 * 📈 Jobs per Month (for charts)
 */
export const getJobsByMonth = async (req, res) => {
  try {
    const jobsByMonth = await Job.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$dateCreated" },
            month: { $month: "$dateCreated" },
          },
          total: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Format for frontend chart: [{month: "Jan 2025", total: 10}, ...]
    const formatted = jobsByMonth.map((j) => {
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      return {
        month: `${monthNames[j._id.month - 1]} ${j._id.year}`,
        total: j.total,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("JobsByMonth error:", err);
    res.status(500).json({ message: "Error fetching jobs by month" });
  }
};

/**
 * 🧰 Low-stock items list (for alerts)
 */
export const getLowStockItems = async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ["$totalQuantity", "$minThreshold"] },
    }).select("itemName category totalQuantity minThreshold unit");

    res.json(lowStockItems);
  } catch (err) {
    console.error("LowStockItems error:", err);
    res.status(500).json({ message: "Error fetching low stock items" });
  }
};

/**
 * 🕒 Recent activity logs
 */
export const getRecentLogs = async (req, res) => {
  try {
    const logs = await Log.find()
      .populate("userId", "name role")
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    // Rename timestamp → createdAt for frontend consistency
    const formattedLogs = logs.map((log) => ({
      ...log,
      createdAt: log.timestamp, // 👈 frontend expects this
    }));

    res.json(formattedLogs);
  } catch (err) {
    console.error("RecentLogs error:", err);
    res.status(500).json({ message: "Error fetching recent logs" });
  }
};
