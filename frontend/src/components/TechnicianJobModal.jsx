// components/TechnicianJobModal.jsx - UPDATED VERSION (Fixed labor cost display)
import { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Phone,
  User,
  Clock,
  Package,
  FileText,
  Image as ImageIcon,
  DollarSign,
  Calculator,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { 
  updateJobStatus, 
  updateLabor, 
  addAdditionalPayment,
  removeAdditionalPayment,
  getJobById
} from "../api/jobs";
import { formatCurrency } from "../utils/format";
import { getSettings } from "../api/settings";
import { useToast } from "../contexts/ToastContext";
import ConfirmDialog from "./ConfirmDialog";

export default function TechnicianJobModal({
  open,
  job,
  onClose,
  refreshJobs,
}) {
  const { addToast } = useToast();
  const [updating, setUpdating] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [notes, setNotes] = useState(job?.technicianNotes || "");
  const [activeTab, setActiveTab] = useState("details");
  const [laborHours, setLaborHours] = useState(job?.laborHours || 0);
  const [laborRate, setLaborRate] = useState(0);
  const [additionalPayments, setAdditionalPayments] = useState([]);
  const [newPayment, setNewPayment] = useState({ description: "", amount: 0 });
  const [settings, setSettings] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load fresh job details
  const loadJobDetails = async () => {
    if (!job) return;

    try {
      setRefreshing(true);
      const details = await getJobById(job._id);
      setJobDetails(details.job);
      setAdditionalPayments(details.job.additionalCosts || []);
      setLaborHours(details.job.laborHours || 0);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to load job details:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (open && job) {
      loadJobDetails();
      loadSettings();
    }
  }, [open, job]);

  const loadSettings = async () => {
    try {
      const settingsData = await getSettings();
      setSettings(settingsData.settings);

      // Get labor rate for this job type
      const jobTypeRate =
        settingsData.settings?.laborRates?.ratesByJobType?.find(
          (r) => r.jobType === job.type
        );
      const rate =
        jobTypeRate?.hourlyRate ||
        settingsData.settings?.laborRates?.defaultHourlyRate ||
        0;
      setLaborRate(rate);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to load settings:", error);
    }
  };

  const handleUpdateNotes = async () => {
    try {
      setUpdating(true);
      await updateJobStatus(job._id, job.status, { technicianNotes: notes });
      alert("Notes updated successfully");
      refreshJobs();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to update notes:", error);
      alert("Failed to update notes");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateLabor = async () => {
    try {
      setUpdating(true);
      const hours = Number(laborHours) || 0;
      if (isNaN(hours) || hours < 0) throw new Error("Invalid hours");
      await updateLabor(job._id, { hours });

      // Refresh job details immediately
      await loadJobDetails();

      addToast({ message: "Labor hours updated successfully", type: 'success' });
      refreshJobs();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to update labor:", error);
      addToast({ message: error.response?.data?.message || "Failed to update labor hours", type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleAddAdditionalPayment = async () => {
    if (!newPayment.description || newPayment.amount <= 0) {
      addToast({ message: "Please enter a description and valid amount", type: 'warning' });
      return;
    }

    try {
      setUpdating(true);
      await addAdditionalPayment(job._id, {
        description: newPayment.description,
        amount: parseFloat(newPayment.amount),
      });
      setNewPayment({ description: "", amount: 0 });

      // Refresh job details immediately
      await loadJobDetails();

      addToast({ message: "Additional payment added successfully", type: 'success' });
      refreshJobs();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to add payment:", error);
      addToast({ message: "Failed to add payment", type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveAdditionalPayment = async (index) => {
    try {
      setUpdating(true);
      await removeAdditionalPayment(job._id, index);

      // Refresh job details immediately
      await loadJobDetails();

      addToast({ message: "Payment removed successfully", type: 'success' });
      refreshJobs();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to remove payment:", error);
      addToast({ message: "Failed to remove payment", type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleCompleteJob = async () => {
    // Check if costing approval is required
    if (
      settings?.requireCostApproval &&
      !jobDetails?.costingApproval?.isApproved
    ) {
      addToast({ message: "Costing must be approved by admin before completing the job", type: 'warning' });
      return;
    }

    setConfirmComplete(true);
  };

  const confirmJobCompletion = async () => {
    try {
      setUpdating(true);
      await updateJobStatus(job._id, "completed");
      addToast({ message: "Job marked as completed", type: 'success' });
      refreshJobs();
      onClose();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to complete job:", error);
      addToast({ message: error.response?.data?.message || "Failed to complete job", type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    paid: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };

  // Calculate technician payment based on settings
  const calculateTechnicianPayment = () => {
    if (!settings || !jobDetails) return 0;

    const { technicianPayment } = settings;
    const { laborHours, totalRevenue, profit } = jobDetails;

    switch (technicianPayment.defaultCalculationType) {
      case "fixed":
        return technicianPayment.defaultFixedAmount || 0;
      case "hourly":
        const rate = settings.laborRates?.defaultHourlyRate || 0;
        return (laborHours || 0) * rate;
      case "percentage_revenue":
        return (
          ((totalRevenue || 0) * (technicianPayment.defaultPercentage || 0)) /
          100
        );
      case "percentage_profit":
        return (
          ((profit || 0) * (technicianPayment.defaultPercentage || 0)) / 100
        );
      default:
        return 0;
    }
  };

  const technicianPayment = calculateTechnicianPayment();
  const currentJob = jobDetails || job;

  if (!open || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl relative max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold">Job Details - {job.jobNumber}</h2>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                statusColors[job.status]
              }`}
            >
              {job.status.replace("_", " ").toUpperCase()}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {job.type}
            </span>
            {settings?.requireCostApproval &&
              !currentJob?.costingApproval?.isApproved && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Awaiting Approval
                </span>
              )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex px-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "details"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab("materials")}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "materials"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Materials
            </button>
            <button
              onClick={() => setActiveTab("costing")}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "costing"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-1" />
              Costing
            </button>
            <button
              onClick={() => setActiveTab("files")}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "files"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Files
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "notes"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Notes
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {refreshing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2 mb-4">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-sm text-blue-700">Refreshing data...</span>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{job.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{job.customerPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium">{job.customerAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Job Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-medium">{job.type}</p>
                  </div>
                  {job.scheduledDate && (
                    <div>
                      <p className="text-sm text-gray-600">Scheduled Date</p>
                      <p className="font-medium">
                        {new Date(job.scheduledDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {job.startedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Started At</p>
                      <p className="font-medium">
                        {job.startedAt ? new Date(job.startedAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  )}
                  {job.completedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Completed At</p>
                      <p className="font-medium">
                        {job.completedAt ? new Date(job.completedAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {job.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {job.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Materials Tab */}
          {activeTab === "materials" && currentJob && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Materials Used
              </h3>

              {currentJob.materialsUsed &&
              currentJob.materialsUsed.length > 0 ? (
                <div className="space-y-3">
                  {currentJob.materialsUsed.map((material, index) => {
                    let displayValue = "";
                    if (material.inventoryType === "serialized") {
                      displayValue = `SN: ${material.serialNumber}`;
                    } else {
                      switch (material.unit) {
                        case "pcs":
                          displayValue = `Qty: ${material.quantity || 0} pcs`;
                          break;
                        case "meter":
                        case "roll":
                          displayValue = `Length: ${material.lengthUsed || 0} ${
                            material.unit
                          }`;
                          break;
                        case "kg":
                        case "liter":
                          displayValue = `Qty: ${material.quantity || 0} ${
                            material.unit
                          }`;
                          break;
                        default:
                          displayValue = `${
                            material.quantity || material.lengthUsed || 0
                          } ${material.unit}`;
                      }
                    }

                    return (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {material.itemName}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {displayValue}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatCurrency(material.totalCost || 0)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(material.unitCost || 0)} /{" "}
                              {material.unit}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Total Cost */}
                  <div className="bg-blue-50 rounded-lg p-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">
                        Total Material Cost
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(currentJob.totalMaterialCost || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No materials added yet</p>
                </div>
              )}
            </div>
          )}

          {/* Costing Tab - TECHNICIAN VIEW */}
          {activeTab === "costing" && currentJob && (
            <div className="space-y-6">
              {/* Labor Section */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Labor Hours
                </h3>
                <div className="flex items-center gap-4 mb-3">
                  <input
                    type="number"
                    value={laborHours}
                    onChange={(e) =>
                      setLaborHours(
                        e.target.value ? parseFloat(e.target.value) : 0
                      )
                    }
                    min="0"
                    step="0.5"
                    className="border rounded-lg p-2.5 w-32"
                    placeholder="Hours"
                  />
                  <button
                    onClick={handleUpdateLabor}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updating ? "Updating..." : "Update Hours"}
                  </button>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 space-y-1">
                  <p className="text-sm text-blue-700">
                    {(() => {
                      const hours = currentJob.laborHours || 0;
                      // prefer settings-derived rate if available
                      const jobTypeRate =
                        settings?.laborRates?.ratesByJobType?.find(
                          (r) => r.jobType === currentJob?.type
                        );
                      let derivedRate =
                        jobTypeRate?.hourlyRate ??
                        settings?.laborRates?.defaultHourlyRate ??
                        laborRate ??
                        0;
                      // Fallback: if no settings/rate available but job has saved laborCost, derive rate
                      if ((!derivedRate || derivedRate === 0) && currentJob?.laborHours) {
                        const hrs = Number(currentJob.laborHours) || 0;
                        if (hrs > 0 && currentJob.laborCost) {
                          derivedRate = (Number(currentJob.laborCost) || 0) / hrs;
                        }
                      }
                      return `Current: ${hours} hours × ₱${derivedRate}/hour`;
                    })()}
                  </p>
                  <p className="text-lg font-bold text-blue-900">
                    Labor Cost:{" "}
                    {formatCurrency(
                      currentJob.laborCost ??
                        (currentJob.laborHours ?? 0) *
                          (settings?.laborRates?.ratesByJobType?.find(
                            (r) => r.jobType === currentJob?.type
                          )?.hourlyRate ??
                            settings?.laborRates?.defaultHourlyRate ??
                            laborRate ??
                            0)
                    )}
                  </p>
                </div>
              </div>

              {/* Additional Payments Section */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Additional Payments
                </h3>

                {/* Add New Payment */}
                <div className="flex gap-3 mb-4">
                  <input
                    type="text"
                    value={newPayment.description}
                    onChange={(e) =>
                      setNewPayment({
                        ...newPayment,
                        description: e.target.value,
                      })
                    }
                    placeholder="Description"
                    className="flex-1 border rounded-lg p-2.5"
                  />
                  <input
                    type="number"
                    value={newPayment.amount}
                    onChange={(e) =>
                      setNewPayment({
                        ...newPayment,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                    step="0.01"
                    placeholder="Amount"
                    className="w-32 border rounded-lg p-2.5"
                  />
                  <button
                    onClick={handleAddAdditionalPayment}
                    disabled={updating}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>

                {/* Payments List */}
                {additionalPayments.length > 0 ? (
                  <div className="space-y-2">
                    {additionalPayments.map((payment, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{payment.description}</p>
                          <p className="text-sm text-gray-500">
                            Added by technician
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold">
                            {formatCurrency(payment.amount || 0)}
                          </span>
                          <button
                            onClick={() => handleRemoveAdditionalPayment(index)}
                            className="text-red-500 hover:text-red-700"
                            disabled={updating}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No additional payments added
                  </p>
                )}
              </div>

              {/* Cost Summary - READ ONLY for Technician */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Cost Summary
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Material Cost:</span>
                    <span className="font-medium">
                      {formatCurrency(currentJob.totalMaterialCost || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Labor Cost:</span>
                    <span className="font-medium">
                      {formatCurrency(currentJob.laborCost || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600 font-semibold">
                      Total Cost:
                    </span>
                    <span className="font-bold">
                      {formatCurrency(currentJob.totalCost || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Revenue Summary - READ ONLY for Technician */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Revenue Summary
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Revenue:</span>
                    <span className="font-medium">
                      {formatCurrency(currentJob.totalRevenue || 0)}
                    </span>
                  </div>
                  {additionalPayments.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Additional Revenue:</span>
                      <span className="font-medium">
                        {formatCurrency(additionalPayments.reduce((sum, p) => sum + (p.amount || 0), 0))}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600 font-semibold">
                      Total Revenue:
                    </span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(
                        (currentJob.totalRevenue || 0) + additionalPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Technician Payment Estimate */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">
                  Your Estimated Payment
                </h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-blue-700">
                      Based on{" "}
                      {settings?.technicianPayment?.defaultCalculationType ||
                        "hourly"}{" "}
                      calculation
                    </p>
                    <p className="text-sm text-blue-600">
                      {settings?.technicianPayment?.defaultCalculationType ===
                        "fixed" &&
                        `Fixed: ${formatCurrency(settings.technicianPayment.defaultFixedAmount)}`}
                      {settings?.technicianPayment?.defaultCalculationType ===
                        "hourly" &&
                        `${currentJob.laborHours || 0} hrs × ₱${
                          settings.laborRates?.defaultHourlyRate || 0
                        }`}
                      {settings?.technicianPayment?.defaultCalculationType ===
                        "percentage_revenue" &&
                        `${
                          settings.technicianPayment.defaultPercentage || 0
                        }% of revenue`}
                      {settings?.technicianPayment?.defaultCalculationType ===
                        "percentage_profit" &&
                        `${
                          settings.technicianPayment.defaultPercentage || 0
                        }% of profit`}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-blue-700">
                    {formatCurrency(technicianPayment)}
                  </span>
                </div>
              </div>

              {/* Costing Approval Status */}
              <div
                className={`border rounded-lg p-4 ${
                  currentJob.costingApproval?.isApproved
                    ? "bg-green-50 border-green-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {currentJob.costingApproval?.isApproved ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          Costing Approved
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800">
                          Awaiting Costing Approval
                        </span>
                      </>
                    )}
                  </div>
                  {currentJob.costingApproval?.isApproved && (
                    <div className="text-sm text-green-700">
                      Approved:{" "}
                      {new Date(
                        currentJob.costingApproval.approvedAt
                      ).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {currentJob.costingApproval?.notes && (
                  <p className="text-sm mt-2 text-gray-600">
                    {currentJob.costingApproval.notes}
                  </p>
                )}

                {!currentJob.costingApproval?.isApproved && (
                  <p className="text-sm text-yellow-600 mt-2">
                    Admin needs to approve costing before you can complete this
                    job
                  </p>
                )}
              </div>

              {/* Complete Job Button */}
              {job.status === "in_progress" && (
                <button
                  onClick={handleCompleteJob}
                  disabled={
                    updating ||
                    (settings?.requireCostApproval &&
                      !currentJob.costingApproval?.isApproved)
                  }
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  {updating ? "Processing..." : "Mark Job as Completed"}
                </button>
              )}
            </div>
          )}

          {/* Files Tab */}
          {activeTab === "files" && (
            <div className="space-y-6">
              {/* Photos */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Photos
                </h3>
                {job.photoUrls && job.photoUrls.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {job.photoUrls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={url}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No photos uploaded yet</p>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documents
                </h3>
                {job.documentUrls && job.documentUrls.length > 0 ? (
                  <div className="space-y-2">
                    {job.documentUrls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-gray-500" />
                        <span className="text-sm text-gray-700">
                          Document {index + 1}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No documents uploaded yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Technician Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about the job progress, issues encountered, or recommendations..."
                  rows={8}
                  className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={job.status === "completed" || job.status === "paid"}
                />
              </div>

              {job.adminNotes && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Admin Notes (Read Only)
                  </label>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {job.adminNotes}
                  </p>
                </div>
              )}

              <button
                onClick={handleUpdateNotes}
                disabled={
                  updating ||
                  job.status === "completed" ||
                  job.status === "paid"
                }
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "Saving..." : "Save Notes"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-white text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirm Complete Dialog */}
      <ConfirmDialog
        isOpen={confirmComplete}
        title="Complete Job"
        message="Are you sure you want to mark this job as completed? This action cannot be undone."
        variant="info"
        confirmText="Complete"
        cancelText="Cancel"
        isLoading={updating}
        onConfirm={confirmJobCompletion}
        onCancel={() => setConfirmComplete(false)}
      />
    </div>
  );
}
