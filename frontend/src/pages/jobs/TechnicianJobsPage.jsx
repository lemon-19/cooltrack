// pages/TechnicianJobsPage.jsx
import { useEffect, useState } from "react";
import {
  Briefcase,
  Search,
  Eye,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle,
  Package,
  Upload,
  FileText,
  Camera,
} from "lucide-react";
import { getJobs, getJobStats, updateJobStatus } from "../../api/jobs";
import TechnicianJobModal from "../../components/TechnicianJobModal";
import AddMaterialsModal from "../../components/AddMaterialsModal";
import UploadFilesModal from "../../components/UploadFilesModal";
import { useSocket } from "../../contexts/SocketContext";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  paid: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const TechnicianJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [materialsModalOpen, setMaterialsModalOpen] = useState(false);
  const [filesModalOpen, setFilesModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

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

    // Listen for new job assignments
    socket.on('job:created', (data) => {
      if (import.meta.env.DEV) console.log('🆕 New job assigned:', data);
      loadJobs();
      showNotification(`New job assigned: ${data.jobNumber}`);
    });

    // Listen for job updates
    socket.on('job:updated', (data) => {
      if (import.meta.env.DEV) console.log('📝 Job updated:', data);
      loadJobs();
      showNotification(`Job ${data.jobNumber} was updated`);
    });

    // Listen for job status changes
    socket.on('job:status-changed', (data) => {
      if (import.meta.env.DEV) console.log('📊 Job status changed:', data);
      
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job._id === data.jobId 
            ? { ...job, status: data.newStatus }
            : job
        )
      );
      
      loadStats();
      showNotification(`Job status updated to ${data.newStatus.replace('_', ' ')}`);
    });

    // Listen for materials added
    socket.on('job:materials-added', (data) => {
      if (import.meta.env.DEV) console.log('📦 Materials added to job:', data);
      loadJobs(); // Refresh to show updated material costs
      showNotification(`Materials added successfully`);
    });

    // Listen for file uploads
    socket.on('job:files-updated', (data) => {
      if (import.meta.env.DEV) console.log('📎 Files uploaded:', data);
      loadJobs();
      showNotification(`Files uploaded successfully`);
    });

    return () => {
      socket.off('job:created');
      socket.off('job:updated');
      socket.off('job:status-changed');
      socket.off('job:materials-added');
      socket.off('job:files-updated');
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
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const jobStats = await getJobStats();
      setStats(jobStats.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const filterData = () => {
    let result = [...jobs];

    if (search) {
      result = result.filter(
        (j) =>
          j.jobNumber?.toLowerCase().includes(search.toLowerCase()) ||
          j.customerName?.toLowerCase().includes(search.toLowerCase()) ||
          j.type?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((j) => j.status === statusFilter);
    }

    setFiltered(result);
  };

  const showNotification = (message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Job Management', { body: message });
    }
    if (import.meta.env.DEV) console.log('📢', message);
  };

  const handleStartJob = async (jobId) => {
    try {
      await updateJobStatus(jobId, 'in_progress');
      showNotification('Job started successfully');
    } catch (error) {
      console.error('Failed to start job:', error);
      alert('Failed to start job. Please try again.');
    }
  };

  const handleCompleteJob = async (jobId) => {
    try {
      await updateJobStatus(jobId, 'completed');
      showNotification('Job marked as completed');
    } catch (error) {
      console.error('Failed to complete job:', error);
      alert('Failed to complete job. Please try again.');
    }
  };

  const handleViewJob = (job) => {
    setSelectedJob(job);
    setViewModalOpen(true);
  };

  const handleAddMaterials = (job) => {
    setSelectedJob(job);
    setMaterialsModalOpen(true);
  };

  const handleUploadFiles = (job) => {
    setSelectedJob(job);
    setFilesModalOpen(true);
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
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">My Jobs</h2>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              connected 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
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
          <p className="text-gray-600 mt-1">
            View and manage your assigned jobs {connected && '• Real-time updates'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-600">Total Jobs</p>
            <h3 className="text-2xl font-bold">{stats.totalJobs}</h3>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-600">Pending</p>
            <h3 className="text-2xl font-bold text-yellow-600">
              {stats.pendingJobs}
            </h3>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-600">In Progress</p>
            <h3 className="text-2xl font-bold text-blue-600">
              {stats.inProgressJobs}
            </h3>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-600">Completed</p>
            <h3 className="text-2xl font-bold text-green-600">
              {stats.completedJobs}
            </h3>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              placeholder="Search by job number, customer, or type..."
              className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-4 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No jobs found</p>
            <p className="text-sm text-gray-400 mt-1">
              Jobs assigned to you will appear here
            </p>
          </div>
        ) : (
          filtered.map((job) => (
            <div
              key={job._id}
              className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Job Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{job.jobNumber}</h3>
                  <p className="text-sm text-gray-500">{job.type}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusColors[job.status]
                  }`}
                >
                  {job.status.replace("_", " ")}
                </span>
              </div>

              {/* Customer Info */}
              <div className="mb-4 pb-4 border-b">
                <p className="font-medium text-gray-900">{job.customerName}</p>
                <p className="text-sm text-gray-600">{job.customerPhone}</p>
                <p className="text-sm text-gray-500 mt-1">{job.customerAddress}</p>
              </div>

              {/* Job Details */}
              <div className="space-y-2 mb-4">
                {job.scheduledDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {new Date(job.scheduledDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {job.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {job.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {/* Quick Actions for Pending Jobs */}
                {job.status === 'pending' && (
                  <button
                    onClick={() => handleStartJob(job._id)}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Start Job
                  </button>
                )}

                {/* Quick Actions for In Progress Jobs */}
                {job.status === 'in_progress' && (
                  <button
                    onClick={() => handleCompleteJob(job._id)}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Complete
                  </button>
                )}

                {/* Secondary Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleViewJob(job)}
                    className="px-3 py-2 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center gap-1"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAddMaterials(job)}
                    className="px-3 py-2 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center gap-1"
                    title="Add Materials"
                    disabled={job.status === 'completed' || job.status === 'paid'}
                  >
                    <Package className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleUploadFiles(job)}
                    className="px-3 py-2 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center gap-1"
                    title="Upload Files"
                    disabled={job.status === 'completed' || job.status === 'paid'}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Materials Count */}
              {job.materialsUsed && job.materialsUsed.length > 0 && (
                <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                  <Package className="w-3 h-3 inline mr-1" />
                  {job.materialsUsed.length} material(s) used
                </div>
              )}
            </div>
          ))
        )} 
      </div>

      {/* Modals */}
      {viewModalOpen && (
        <TechnicianJobModal
          open={viewModalOpen}
          job={selectedJob}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedJob(null);
          }}
          refreshJobs={loadJobs}
        />
      )}

      {materialsModalOpen && (
        <AddMaterialsModal
          open={materialsModalOpen}
          job={selectedJob}
          onClose={() => {
            setMaterialsModalOpen(false);
            setSelectedJob(null);
          }}
          refreshJobs={loadJobs}
        />
      )}

      {filesModalOpen && (
        <UploadFilesModal
          open={filesModalOpen}
          job={selectedJob}
          onClose={() => {
            setFilesModalOpen(false);
            setSelectedJob(null);
          }}
          refreshJobs={loadJobs}
        />
      )}
    </div>
  );
};

export default TechnicianJobsPage;