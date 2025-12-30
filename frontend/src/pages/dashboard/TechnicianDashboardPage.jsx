// src/pages/dashboard/TechnicianDashboardPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { getJobsForTechnician } from '../../api/jobs';

const TechnicianDashboardPage = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [stats, setStats] = useState({
    totalJobs: 0,
    pendingJobs: 0,
    inProgressJobs: 0,
    completedJobs: 0,
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch technician jobs and calculate stats
const fetchDashboardData = async () => {
  try {
    setLoading(true);
    const response = await getJobsForTechnician();
    const jobs = response.jobs || []; // <- ensure jobs is an array

    const calculatedStats = {
      totalJobs: jobs.length,
      pendingJobs: jobs.filter(j => j.status === 'pending').length,
      inProgressJobs: jobs.filter(j => j.status === 'in_progress').length,
      completedJobs: jobs.filter(j => j.status === 'completed' || j.status === 'paid').length,
    };

    setStats(calculatedStats);
    setRecentJobs(jobs.slice(0, 5));
  } catch (error) {
    console.error('Error fetching technician dashboard data:', error);
    setStats({
      totalJobs: 0,
      pendingJobs: 0,
      inProgressJobs: 0,
      completedJobs: 0,
    });
    setRecentJobs([]);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('job:created', fetchDashboardData);
      socket.on('job:status-changed', fetchDashboardData);

      return () => {
        socket.off('job:created', fetchDashboardData);
        socket.off('job:status-changed', fetchDashboardData);
      };
    }
  }, [socket]);

  const statCards = [
    { label: 'Total Jobs', value: stats.totalJobs, icon: Briefcase, color: 'bg-blue-500' },
    { label: 'Pending', value: stats.pendingJobs, icon: Clock, color: 'bg-yellow-500' },
    { label: 'In Progress', value: stats.inProgressJobs, icon: TrendingUp, color: 'bg-orange-500' },
    { label: 'Completed', value: stats.completedJobs, icon: CheckCircle, color: 'bg-green-500' },
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      paid: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h2>
        <p className="text-gray-600 mt-1">
          Here's an overview of your assigned jobs today
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Jobs</h3>
          <Link to="/technician/jobs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</Link>
        </div>

        {recentJobs.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No jobs assigned</p>
            <p className="text-sm text-gray-400">Wait for your manager to assign jobs</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentJobs.map(job => (
              <Link
                key={job._id}
                to={`/jobs/${job._id}`}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{job.jobNumber}</p>
                  <p className="text-sm text-gray-600">{job.customerName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                    {job.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">{new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianDashboardPage;
