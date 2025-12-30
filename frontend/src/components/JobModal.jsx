// components/JobModal.jsx - UPDATED VERSION (Fixes all issues)
import { useState, useEffect } from "react";
import { 
  X, Calendar, DollarSign, Clock, FileText, 
  Image as ImageIcon, Package, CheckCircle, Settings, AlertCircle 
} from "lucide-react";
import { createJob, updateJob, updateRevenue, approveCosting, updateLaborRate, getJobById } from "../api/jobs";
import { formatCurrency } from "../utils/format";
import { getTechnicians } from "../api/users";
import { getCustomers } from "../api/customers";
import { getSettings } from "../api/settings";
import { useToast } from "../contexts/ToastContext";
import ConfirmDialog from "./ConfirmDialog";

export default function JobModal({ open, onClose, job, refreshJobs }) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("basic");
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    type: "installation",
    description: "",
    status: "pending",
    assignedTo: "",
    scheduledDate: "",
    laborHours: 0,
    laborCost: 0,
    totalRevenue: 0,
    technicianNotes: "",
    adminNotes: "",
  });

  const [technicians, setTechnicians] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [settings, setSettings] = useState(null);
  const [laborRate, setLaborRate] = useState(0);
  const [overrideLaborCost, setOverrideLaborCost] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [jobDetails, setJobDetails] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load fresh job details
  const loadJobDetails = async () => {
    if (!job) return;
    
    try {
      setRefreshing(true);
      const response = await getJobById(job._id);
      setJobDetails(response.job);
      
      // Update form with latest data
      setForm(prev => ({
        ...prev,
        laborHours: response.job.laborHours || 0,
        laborCost: response.job.laborCost || 0,
        totalRevenue: response.job.totalRevenue || 0,
      }));
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to load job details:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    async function loadData() {
      try {
        setLoadingData(true);
        const techData = await getTechnicians();
        setTechnicians(techData.technicians || []);
        const customerData = await getCustomers();
        setCustomers(Array.isArray(customerData) ? customerData : customerData.customers || []);
        const settingsData = await getSettings();
        setSettings(settingsData.settings);
      } catch (err) {
        if (import.meta.env.DEV) console.error(err);
        addToast({ message: "Failed to load data.", type: 'error' });
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
    loadJobDetails();
  }, [open, job]);

  useEffect(() => {
    if (!open) return;

    if (job) {
      setForm({
        customerId: job.customerId?._id || job.customerId || "",
        type: job.type || "installation",
        description: job.description || "",
        status: job.status || "pending",
        assignedTo: job.assignedTo?._id || job.assignedTo || "",
        scheduledDate: job.scheduledDate ? new Date(job.scheduledDate).toISOString().split("T")[0] : "",
        laborHours: job.laborHours || 0,
        laborCost: job.laborCost || 0,
        totalRevenue: job.totalRevenue || 0,
        technicianNotes: job.technicianNotes || "",
        adminNotes: job.adminNotes || "",
      });
      
      // Load labor rate based on job type
      if (settings) {
        const jobTypeRate = settings.laborRates?.ratesByJobType?.find(
          r => r.jobType === job.type
        );
        setLaborRate(jobTypeRate?.hourlyRate || settings.laborRates?.defaultHourlyRate || 0);
      }
    } else {
      setForm({
        customerId: "",
        type: "installation",
        description: "",
        status: "pending",
        assignedTo: "",
        scheduledDate: "",
        laborHours: 0,
        laborCost: 0,
        totalRevenue: 0,
        technicianNotes: "",
        adminNotes: "",
      });
      
      // Load default revenue for new jobs
      if (settings) {
        const defaultRev = settings.defaultRevenue?.find(r => r.jobType === "installation");
        if (defaultRev) {
          setForm(prev => ({ ...prev, totalRevenue: defaultRev.amount }));
        }
      }
    }
  }, [job, open, settings]);

  // Update default revenue when job type changes
  useEffect(() => {
    if (!settings || job) return; // Only for new jobs
    
    const defaultRev = settings.defaultRevenue?.find(r => r.jobType === form.type);
    if (defaultRev) {
      setForm(prev => ({ ...prev, totalRevenue: defaultRev.amount }));
    }
    
    // Update labor rate
    const jobTypeRate = settings.laborRates?.ratesByJobType?.find(
      r => r.jobType === form.type
    );
    setLaborRate(jobTypeRate?.hourlyRate || settings.laborRates?.defaultHourlyRate || 0);
  }, [form.type, settings, job]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm({ ...form, [name]: type === "number" ? parseFloat(value) || 0 : value });
  };

  const handleSubmit = async () => {
    if (!form.customerId) {
      addToast({ message: "Please select a customer", type: 'warning' });
      return;
    }
    if (!form.type) {
      addToast({ message: "Please select a job type", type: 'warning' });
      return;
    }

    try {
      setLoading(true);
      if (job) await updateJob(job._id, form);
      else await createJob(form);
      addToast({ message: job ? "Job updated successfully" : "Job created successfully", type: 'success' });
      refreshJobs();
      onClose();
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      addToast({ message: err.response?.data?.message || "Failed to save job.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRevenue = async () => {
    const revenueValue = parseFloat(form.totalRevenue);
    
    if (isNaN(revenueValue)) {
      addToast({ message: "Please enter a valid revenue amount", type: 'warning' });
      return;
    }

    if (revenueValue < 0) {
      addToast({ message: "Revenue cannot be negative", type: 'warning' });
      return;
    }

    try {
      setLoading(true);
      await updateRevenue(job._id, { baseRevenue: revenueValue });
      
      // Refresh job details immediately
      await loadJobDetails();
      
      addToast({ message: "Revenue updated successfully", type: 'success' });
      refreshJobs();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to update revenue:", error);
      addToast({ message: error.response?.data?.message || "Failed to update revenue", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLaborRate = async () => {
    try {
      setLoading(true);
      await updateLaborRate(job._id, { 
        ratePerHour: laborRate,
        overrideTotalCost: overrideLaborCost || undefined
      });
      
      // Refresh job details immediately
      await loadJobDetails();
      
      addToast({ message: "Labor rate updated successfully", type: 'success' });
      refreshJobs();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to update labor rate:", error);
      addToast({ message: error.response?.data?.message || "Failed to update labor rate", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCosting = () => {
    setConfirmApprove(true);
  };

  const confirmCostingApproval = async () => {
    try {
      setLoading(true);
      await approveCosting(job._id, { notes: approvalNotes });
      
      // Refresh job details immediately
      await loadJobDetails();
      
      addToast({ message: "Costing approved successfully", type: 'success' });
      refreshJobs();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to approve costing:", error);
      addToast({ message: error.response?.data?.message || "Failed to approve costing", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const currentJob = jobDetails || job;
  const needsApproval = currentJob && !currentJob.costingApproval?.isApproved && 
                        currentJob.status !== 'pending' && 
                        settings?.requireCostApproval;

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    paid: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl relative max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold">{job ? `Job #${job.jobNumber}` : "Create New Job"}</h2>
          {currentJob && (
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[currentJob.status]}`}>
                {currentJob.status.replace("_", " ").toUpperCase()}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {currentJob.type}
              </span>
              {needsApproval && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Needs Approval
                </span>
              )}
              {currentJob.costingApproval?.isApproved && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Approved
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex px-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab("basic")}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "basic" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Basic Info
            </button>
            {currentJob && (
              <>
                <button
                  onClick={() => setActiveTab("materials")}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === "materials" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Materials
                </button>
                <button
                  onClick={() => setActiveTab("costing")}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap relative ${
                    activeTab === "costing" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Costing
                  {needsApproval && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("files")}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === "files" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Files
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === "notes" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Notes
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {refreshing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-sm text-blue-700">Refreshing data...</span>
            </div>
          )}

          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Customer</label>
                <select
                  name="customerId"
                  value={form.customerId}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loadingData}
                >
                  <option value="">{loadingData ? "Loading..." : "Select a customer"}</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>{c.name} - {c.phone}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Job Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="installation">Installation</option>
                  <option value="repair">Repair</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inspection">Inspection</option>
                </select>
                {!job && settings && (
                  <p className="text-xs text-gray-500 mt-1">
                    Default revenue: {formatCurrency(settings.defaultRevenue?.find(r => r.jobType === form.type)?.amount || 0)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Assigned Technician</label>
                <select
                  name="assignedTo"
                  value={form.assignedTo}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loadingData}
                >
                  <option value="">
                    {loadingData ? "Loading technicians..." : "Unassigned"}
                  </option>
                  {technicians.map((tech) => (
                    <option key={tech._id} value={tech._id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          {/* Materials Tab */}
          {activeTab === "materials" && currentJob && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" /> Materials Used
              </h3>
              {currentJob.materialsUsed && currentJob.materialsUsed.length > 0 ? (
                <div className="space-y-3">
                  {currentJob.materialsUsed.map((material, index) => {
                    let displayValue = material.inventoryType === "serialized"
                      ? `SN: ${material.serialNumber}`
                      : material.unit === "pcs"
                      ? `Qty: ${material.quantity || 0} pcs`
                      : material.unit === "meter" || material.unit === "roll"
                      ? `Length: ${material.lengthUsed || 0} ${material.unit}`
                      : `${material.quantity || material.lengthUsed || 0} ${material.unit}`;

                    return (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 flex justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{material.itemName}</p>
                          <p className="text-sm text-gray-600">{displayValue}</p>
                          <p className="text-xs text-gray-500">
                            Added by: {material.addedBy?.name || "Technician"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(material.totalCost || 0)}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(material.unitCost || 0)} / {material.unit}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">No materials added</p>
              )}
            </div>
          )}

          {/* Costing Tab - ADMIN VIEW */}
          {activeTab === "costing" && currentJob && (
            <div className="space-y-6">
              {/* Approval Alert */}
              {needsApproval && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900">Costing Approval Required</h4>
                      <p className="text-sm text-red-700 mt-1">
                        This job needs costing approval before the technician can complete it.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue Management */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Revenue Management
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="number"
                    name="totalRevenue"
                    value={form.totalRevenue}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="border rounded-lg p-2.5 text-sm w-48"
                    placeholder="Base Revenue"
                  />
                  <button
                    onClick={handleUpdateRevenue}
                    disabled={loading}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Updating..." : "Update Revenue"}
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  Default for {form.type}: ₱{
                    formatCurrency(settings?.defaultRevenue?.find(r => r.jobType === form.type)?.amount || 0)
                  }
                </p>
              </div>

              {/* Labor Cost Management */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Labor Cost Settings
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 w-32">Hourly Rate:</label>
                    <input
                      type="number"
                      value={laborRate}
                      onChange={(e) => setLaborRate(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="border rounded-lg p-2.5 text-sm w-48"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 w-32">Override Total:</label>
                    <input
                      type="number"
                      value={overrideLaborCost || ""}
                      onChange={(e) => setOverrideLaborCost(e.target.value ? parseFloat(e.target.value) : null)}
                      min="0"
                      step="0.01"
                      className="border rounded-lg p-2.5 text-sm w-48"
                      placeholder="Leave empty for auto-calc"
                    />
                  </div>
                  <button
                    onClick={handleUpdateLaborRate}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Updating..." : "Update Labor Cost"}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {(() => {
                    const hours = currentJob.laborHours || 0;
                    const jobTypeRate = settings?.laborRates?.ratesByJobType?.find(r => r.jobType === currentJob?.type);
                    let derivedRate = jobTypeRate?.hourlyRate ?? settings?.laborRates?.defaultHourlyRate ?? laborRate ?? 0;
                    if ((!derivedRate || derivedRate === 0) && currentJob?.laborHours) {
                      const hrs = Number(currentJob.laborHours) || 0;
                      if (hrs > 0 && currentJob.laborCost) {
                        derivedRate = (Number(currentJob.laborCost) || 0) / hrs;
                      }
                    }
                    return `Current: ${hours} hours × ₱${derivedRate}/hour = ${formatCurrency(hours * derivedRate)}`;
                  })()}
                </p>
              </div>

              {/* Cost Summary */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Cost Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Material Cost:</span>
                    <span className="font-medium">{formatCurrency(currentJob.totalMaterialCost || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Labor Cost:</span>
                    <span className="font-medium">{formatCurrency(currentJob.laborCost || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600 font-semibold">Total Cost:</span>
                    <span className="font-bold">{formatCurrency(currentJob.totalCost || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Profit Analysis */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Profit Analysis</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Revenue:</span>
                    <span className="font-medium text-green-600">{formatCurrency(currentJob.totalRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="font-medium">{formatCurrency(currentJob.totalCost || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600 font-semibold">Profit:</span>
                    <span className={`font-bold ${currentJob.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(currentJob.profit || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profit Margin:</span>
                    <span className={`font-medium ${currentJob.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {currentJob.totalRevenue ? ((currentJob.profit / currentJob.totalRevenue) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Approval Section */}
              {currentJob.status !== 'paid' && !currentJob.costingApproval?.isApproved && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">Cost Approval</h3>
                  <div className="space-y-3">
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Add approval notes (optional)..."
                      rows={3}
                      className="w-full border rounded-lg p-2.5 text-sm resize-none"
                    />
                    <button
                      onClick={handleApproveCosting}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {loading ? "Processing..." : "Approve Costing"}
                    </button>
                  </div>
                </div>
              )}

              {/* Approval Status */}
              {currentJob.costingApproval?.isApproved && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Costing Approved</h3>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>Approved: {currentJob.costingApproval?.approvedAt ? new Date(currentJob.costingApproval.approvedAt).toLocaleString() : 'N/A'}</p>
                    {currentJob.costingApproval.notes && (
                      <p className="mt-2 text-gray-700">Notes: {currentJob.costingApproval.notes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Files Tab */}
          {activeTab === "files" && job && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" /> Photos
                </h3>
                {job.photoUrls && job.photoUrls.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {job.photoUrls.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden border hover:opacity-80 transition-opacity">
                        <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                ) : <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">No photos uploaded</p>}
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Documents
                </h3>
                {job.documentUrls && job.documentUrls.length > 0 ? (
                  <div className="space-y-2">
                    {job.documentUrls.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <span className="text-sm text-gray-700">Document {idx + 1}</span>
                      </a>
                    ))}
                  </div>
                ) : <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">No documents uploaded</p>}
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === "notes" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2"><FileText className="w-4 h-4 inline mr-1" /> Technician Notes</label>
                <textarea 
                  name="technicianNotes" 
                  value={form.technicianNotes} 
                  onChange={handleChange} 
                  rows={5} 
                  className="w-full border rounded-lg p-2.5 text-sm resize-none" 
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FileText className="w-4 h-4 inline mr-1" /> Admin Notes</label>
                <textarea 
                  name="adminNotes" 
                  value={form.adminNotes} 
                  onChange={handleChange} 
                  rows={5} 
                  className="w-full border rounded-lg p-2.5 text-sm resize-none" 
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t gap-3 bg-gray-50">
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-white text-sm font-medium" disabled={loading}>Cancel</button>
          <button onClick={handleSubmit} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading || loadingData}>
            {loading ? "Saving..." : job ? "Update Job" : "Create Job"}
          </button>
        </div>
      </div>

      {/* Confirm Costing Approval Dialog */}
      <ConfirmDialog
        isOpen={confirmApprove}
        title="Approve Costing"
        message={jobDetails?.profit < 0 && !settings?.allowNegativeProfit 
          ? "This job shows negative profit. Are you sure you want to approve?" 
          : "Are you sure you want to approve this costing?"
        }
        variant={jobDetails?.profit < 0 && !settings?.allowNegativeProfit ? "warning" : "info"}
        confirmText="Approve"
        cancelText="Cancel"
        isLoading={loading}
        onConfirm={confirmCostingApproval}
        onCancel={() => setConfirmApprove(false)}
      />
    </div>
  );
}