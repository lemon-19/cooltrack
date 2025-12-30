// src/pages/dashboard/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  Plus, 
  Users,
  Package,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axiosInstance from '../../api/axios';
import { formatCurrency } from '../../utils/format';
import CustomerModal from '../../components/CustomerModal';
import JobModal from '../../components/JobModal';

const DashboardPage = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [stats, setStats] = useState({
    totalJobs: 0,
    pendingJobs: 0,
    inProgressJobs: 0,
    completedJobs: 0,
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    totalCustomers: 0
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit' | 'view'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [jobModalOpen, setJobModalOpen] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch jobs
      const { data: jobsData } = await axiosInstance.get('/jobs');
      const jobs = jobsData.jobs || [];

      // Calculate stats
      const calculatedStats = {
        totalJobs: jobs.length,
        pendingJobs: jobs.filter(j => j.status === 'pending').length,
        inProgressJobs: jobs.filter(j => j.status === 'in_progress').length,
        completedJobs: jobs.filter(j => j.status === 'completed' || j.status === 'paid').length,
        totalRevenue: jobs.reduce((sum, j) => sum + (j.totalRevenue || 0), 0),
        totalCost: jobs.reduce((sum, j) => sum + (j.totalCost || 0), 0),
        totalProfit: jobs.reduce((sum, j) => sum + (j.profit || 0), 0),
        totalCustomers: 0
      };

      // Fetch customers (admin only)
      if (user.role === 'admin') {
        try {
          const { data: customersData } = await axiosInstance.get('/customers');
          calculatedStats.totalCustomers = customersData.length || 0;
        } catch (error) {
          // Customers endpoint not yet available in this deployment
        }
      }

      setStats(calculatedStats);
      setRecentJobs(jobs.slice(0, 5));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({
        totalJobs: 0,
        pendingJobs: 0,
        inProgressJobs: 0,
        completedJobs: 0,
        totalRevenue: 0,
        totalCustomers: 0
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

  // Modal handlers
  const openAddCustomerModal = () => {
    setSelectedCustomer(null);
    setModalMode('add');
    setModalOpen(true);
  };

  const openEditCustomerModal = (customer) => {
    setSelectedCustomer(customer);
    setModalMode('edit');
    setModalOpen(true);
  };

  const openViewCustomerModal = (customer) => {
    setSelectedCustomer(customer);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleModalSubmit = async (data) => {
    try {
      if (modalMode === 'add') {
        await axiosInstance.post('/customers', data);
      } else if (modalMode === 'edit') {
        await axiosInstance.put(`/customers/${selectedCustomer._id}`, data);
      }
      setModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      console.error('Error saving customer:', err);
    }
  };

  const statCards = [
    { label: 'Total Jobs', value: stats.totalJobs, icon: Briefcase, color: 'bg-blue-500', change: '+12%' },
    { label: 'Pending', value: stats.pendingJobs, icon: Clock, color: 'bg-yellow-500' },
    { label: 'In Progress', value: stats.inProgressJobs, icon: TrendingUp, color: 'bg-orange-500' },
    { label: 'Completed', value: stats.completedJobs, icon: CheckCircle, color: 'bg-green-500', change: '+8%' },
  ];

  if (user.role === 'admin') {
    statCards.push(
      { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'bg-purple-500', change: '+23%' },
      { label: 'Total Cost', value: formatCurrency(stats.totalCost), icon: Package, color: 'bg-red-500' },
      { label: 'Total Profit', value: formatCurrency(stats.totalProfit), icon: TrendingUp, color: 'bg-emerald-500' },
      { label: 'Customers', value: stats.totalCustomers, icon: Users, color: 'bg-indigo-500', change: '+5%' }
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      paid: 'bg-purple-100 text-purple-800'
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
          Here's what's happening with your {user.role === 'admin' ? 'business' : 'jobs'} today
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {statCards.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  {stat.change && <p className="text-xs text-green-600 mt-2">{stat.change} from last month</p>}
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setJobModalOpen(true)}
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group w-full text-left"
          >
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Create New Job</p>
              <p className="text-sm text-gray-500">Start a new service job</p>
            </div>
          </button>

          {user.role === 'admin' && (
            <>
              {/* Add Customer opens modal */}
              <button
                onClick={openAddCustomerModal}
                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
              >
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Plus className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Add Customer</p>
                  <p className="text-sm text-gray-500">Register new customer</p>
                </div>
              </button>

              <Link
                to="/inventory"
                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
              >
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Manage Inventory</p>
                  <p className="text-sm text-gray-500">View stock levels</p>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Jobs</h3>
          <Link to="/jobs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</Link>
        </div>

        {recentJobs.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No jobs found</p>
            <p className="text-sm text-gray-400">Create your first job to get started</p>
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

      {/* Customer Modal */}
      {modalOpen && (
        <CustomerModal
          mode={modalMode}
          customerData={selectedCustomer}
          onClose={() => setModalOpen(false)}
          onSubmit={handleModalSubmit}
        />
      )}

      {/* Job Modal (Quick create) */}
      {jobModalOpen && (
        <JobModal
          open={jobModalOpen}
          onClose={() => { setJobModalOpen(false); fetchDashboardData(); }}
          job={null}
          refreshJobs={fetchDashboardData}
        />
      )}
    </div>
  );
};

export default DashboardPage;
