// pages/JobsPage.jsx - FULLY RESPONSIVE VERSION
import { useEffect, useState } from "react";
import {
  Briefcase,
  Plus,
  Search,
  Eye,
  Wifi,
  WifiOff,
} from "lucide-react";
import { getJobs, getJobStats } from "../../api/jobs";
import JobModal from "../../components/JobModal";
import { useSocket } from "../../contexts/SocketContext";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  paid: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const JobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [stats, setStats] = useState(null);

  const { socket, connected } = useSocket();

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    filterData();
  }, [search, statusFilter, jobs]);

  // Socket.IO event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("job:created", (data) => {
      if (import.meta.env.DEV) console.log("🆕 New job created:", data);
      loadJobs();
      showNotification(`New job created: ${data.jobNumber}`);
    });

    socket.on("job:status-changed", (data) => {
      if (import.meta.env.DEV) console.log("📊 Job status changed:", data);
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job._id === data.jobId ? { ...job, status: data.newStatus } : job
        )
      );
      loadStats();
      showNotification(`Job status updated to ${data.newStatus.replace("_", " ")}`);
    });

    socket.on("job:materials-added", (data) => {
      if (import.meta.env.DEV) console.log("📦 Materials added to job:", data);
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job._id === data.jobId ? { ...job, materialsCount: data.materialsCount } : job
        )
      );
      showNotification(`Materials added to job`);
    });

    socket.on("job:files-updated", (data) => {
      if (import.meta.env.DEV) console.log("📎 Files uploaded:", data);
      showNotification(`${data.photos.length + data.documents.length} file(s) uploaded`);
    });

    return () => {
      socket.off("job:created");
      socket.off("job:status-changed");
      socket.off("job:materials-added");
      socket.off("job:files-updated");
    };
  }, [socket]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const jobData = await getJobs();
      setJobs(jobData.jobs);
      setFiltered(jobData.jobs);
      await loadStats();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to load jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const jobStats = await getJobStats();
      setStats(jobStats.stats);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to load stats:", error);
    }
  };

  const filterData = () => {
    let result = [...jobs];
    if (search) {
      result = result.filter(
        (j) =>
          j.jobNumber.toLowerCase().includes(search.toLowerCase()) ||
          j.customerName?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((j) => j.status === statusFilter);
    }
    setFiltered(result);
  };

  const showNotification = (message) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Job Management", { body: message });
    }
    console.log("📢", message);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Connection Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Jobs</h2>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                connected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {connected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  Live
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  Offline
                </>
              )}
            </div>
          </div>
          <p className="text-gray-600 mt-1 text-sm">
            Manage job assignments and records {connected && "• Real-time updates"}
          </p>
        </div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 w-full sm:w-auto justify-center"
          onClick={() => {
            setSelectedJob(null);
            setModalMode("add");
          }}
        >
          <Plus className="w-5 h-5" />
          Create Job
        </button>
      </div>

      {/* Stats Cards - Single column on mobile */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-600">Total Jobs</p>
            <h3 className="text-2xl font-bold">{stats.totalJobs}</h3>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-600">Pending</p>
            <h3 className="text-2xl font-bold text-yellow-600">{stats.pendingJobs}</h3>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-600">In Progress</p>
            <h3 className="text-2xl font-bold text-blue-600">{stats.inProgressJobs}</h3>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-600">Completed</p>
            <h3 className="text-2xl font-bold text-green-600">{stats.completedJobs}</h3>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              placeholder="Search by job number or customer..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-4 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Table - Desktop view */}
      <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No jobs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((j) => (
                  <tr key={j._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium">{j.jobNumber}</p>
                      <p className="text-gray-500 text-sm">{j.type}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{j.customerName}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[j.status]}`}
                      >
                        {j.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setSelectedJob(j);
                          setModalMode("view");
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Jobs Cards - Mobile view */}
      <div className="md:hidden space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm text-center py-12">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No jobs found</p>
          </div>
        ) : (
          filtered.map((j) => (
            <div
              key={j._id}
              className="bg-white rounded-xl shadow-sm p-4 space-y-3"
            >
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Job</p>
                <p className="font-medium text-gray-900">{j.jobNumber}</p>
                <p className="text-sm text-gray-600">{j.type}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Customer</p>
                <p className="text-sm text-gray-900">{j.customerName}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[j.status]}`}
                >
                  {j.status.replace("_", " ")}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Actions</p>
                <button
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setSelectedJob(j);
                    setModalMode("view");
                  }}
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">View Details</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Job Modal */}
      {modalMode && (
        <JobModal
          open={!!modalMode}
          job={selectedJob}
          onClose={() => {
            setModalMode(null);
            setSelectedJob(null);
          }}
          refreshJobs={loadJobs}
        />
      )}
    </div>
  );
};

export default JobsPage;