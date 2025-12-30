// api/jobs.js (COMPLETE VERSION)
import api from "./axios";

// ==========================================
// GET REQUESTS
// ==========================================

/**
 * Get all jobs (admin sees all, technician sees assigned)
 * GET /api/jobs
 */
export const getJobs = async () => {
  const res = await api.get("/jobs");
  return res.data;
};

/**
 * Get job statistics
 * GET /api/jobs/stats
 */
export const getJobStats = async () => {
  const res = await api.get("/jobs/stats");
  return res.data;
};

/**
 * Get jobs assigned to logged-in technician
 * GET /api/jobs/technician
 */
export const getJobsForTechnician = async () => {
  const res = await api.get("/jobs/technician");
  return res.data;
};

/**
 * Get single job details by ID
 * GET /api/jobs/:id
 */
export const getJobById = async (id) => {
  const res = await api.get(`/jobs/${id}`);
  return res.data;
};

// ==========================================
// POST REQUESTS (Create)
// ==========================================

/**
 * Create a new job
 * POST /api/jobs
 * @param {Object} data - Job data
 * @param {FormData} files - Optional files (photos, documents)
 */
export const createJob = async (data, files = null) => {
  if (files) {
    // If files are provided, use FormData
    const formData = new FormData();
    
    // Append all job data
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    
    // Append files if they exist
    if (files.photos) {
      files.photos.forEach(photo => formData.append('photos', photo));
    }
    if (files.documents) {
      files.documents.forEach(doc => formData.append('documents', doc));
    }
    
    const res = await api.post("/jobs", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data;
  } else {
    // No files, send as JSON
    const res = await api.post("/jobs", data);
    return res.data;
  }
};

/**
 * Upload files to existing job
 * POST /api/jobs/:jobId/files
 */
export const uploadJobFiles = async (jobId, files) => {
  const formData = new FormData();

  if (files.photos) {
    files.photos.forEach((file) => formData.append("photos", file));
  }

  if (files.documents) {
    files.documents.forEach((file) => formData.append("documents", file));
  }

  const res = await api.post(`/jobs/${jobId}/files`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};


// ==========================================
// PUT/PATCH REQUESTS (Update)
// ==========================================

/**
 * Update job basic information
 * PUT /api/jobs/:id
 */
export const updateJob = async (id, data) => {
  const res = await api.put(`/jobs/${id}`, data);
  return res.data;
};

/**
 * Update job status
 * PATCH /api/jobs/:jobId/status
 */
export const updateJobStatus = async (jobId, status, updateData = {}) => {
  const res = await api.patch(`/jobs/${jobId}/status`, { status, updateData });
  return res.data;
};

// ==========================================
// DELETE REQUESTS
// ==========================================

/**
 * Delete a job
 * DELETE /api/jobs/:id
 */
export const deleteJob = async (id) => {
  const res = await api.delete(`/jobs/${id}`);
  return res.data;
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get jobs by status
 * @param {string} status - Job status to filter by
 */
export const getJobsByStatus = async (status) => {
  const res = await api.get(`/jobs?status=${status}`);
  return res.data;
};

/**
 * Get jobs by customer
 * @param {string} customerId - Customer ID
 */
export const getJobsByCustomer = async (customerId) => {
  const res = await api.get(`/jobs?customerId=${customerId}`);
  return res.data;
};

/**
 * Update labor hours (Technician)
 * PATCH /api/jobs/:jobId/labor
 */
export const updateJobLabor = async (jobId, hours) => {
  const res = await api.patch(`/jobs/${jobId}/labor`, { hours });
  return res.data;
};

/**
 * Add additional payment (Technician)
 * POST /api/jobs/:jobId/additional-payment
 */
export const addAdditionalPayment = async (jobId, description, amount) => {
  const res = await api.post(`/jobs/${jobId}/additional-payment`, {
    description,
    amount
  });
  return res.data;
};

/**
 * Remove additional payment (Technician)
 * DELETE /api/jobs/:jobId/additional-payment/:paymentIndex
 */
export const removeAdditionalPayment = async (jobId, paymentIndex) => {
  const res = await api.delete(`/jobs/${jobId}/additional-payment/${paymentIndex}`);
  return res.data;
};

/**
 * Remove material from job (Technician/Admin)
 * DELETE /api/jobs/:jobId/materials/:materialIndex
 */
export const removeJobMaterial = async (jobId, materialIndex) => {
  const res = await api.delete(`/jobs/${jobId}/materials/${materialIndex}`);
  return res.data;
};

/**
 * Edit material in job (Technician/Admin)
 * PATCH /api/jobs/:jobId/materials/:materialIndex
 */
export const editJobMaterial = async (jobId, materialIndex, updatedMaterial) => {
  const res = await api.patch(`/jobs/${jobId}/materials/${materialIndex}`, updatedMaterial);
  return res.data;
};

/**
 * Update base revenue (Admin only)
 * PATCH /api/jobs/:jobId/revenue
 */
export const updateJobRevenue = async (jobId, baseRevenue) => {
  const res = await api.patch(`/jobs/${jobId}/revenue`, { baseRevenue });
  return res.data;
};

/**
 * Update labor rate (Admin only)
 * PATCH /api/jobs/:jobId/labor-rate
 */
export const updateJobLaborRate = async (jobId, ratePerHour, overrideTotalCost = null) => {
  const res = await api.patch(`/jobs/${jobId}/labor-rate`, {
    ratePerHour,
    overrideTotalCost
  });
  return res.data;
};

/**
 * Approve costing (Admin only)
 * POST /api/jobs/:jobId/approve-costing
 */
export const approveJobCosting = async (jobId, notes = '') => {
  const res = await api.post(`/jobs/${jobId}/approve-costing`, { notes });
  return res.data;
};


/**
 * Get cost breakdown for job
 * GET /api/jobs/:jobId/cost-breakdown
 */
export const getJobCostBreakdown = async (jobId) => {
  const res = await api.get(`/jobs/${jobId}/cost-breakdown`);
  return res.data;
};


/**
 * Add materials to a job
 * @param {string} jobId - Job ID
 * @param {object} materialsData - { materials: [...] }
 */
export const addJobMaterials = async (jobId, materialsData) => {
  const response = await api.post(`/jobs/${jobId}/materials`, materialsData);
  return response.data;
};

/**
 * Remove a material from a job
 * @param {string} jobId - Job ID
 * @param {number} materialIndex - Index of material in materialsUsed array
 */
export const removeMaterial = async (jobId, materialIndex) => {
  const response = await api.delete(`/jobs/${jobId}/materials/${materialIndex}`);
  return response.data;
};

/**
 * Edit a material in a job
 * @param {string} jobId - Job ID
 * @param {number} materialIndex - Index of material in materialsUsed array
 * @param {object} updatedMaterial - Updated material data (e.g., { unitCost: 100 })
 */
export const editMaterial = async (jobId, materialIndex, updatedMaterial) => {
  const response = await api.patch(`/jobs/${jobId}/materials/${materialIndex}`, updatedMaterial);
  return response.data;
};

// ==========================================
// NEW LABOR MANAGEMENT FUNCTIONS
// ==========================================

/**
 * Update labor hours for a job (Technician)
 * @param {string} jobId - Job ID
 * @param {object} laborData - { hours: number }
 */
export const updateLabor = async (jobId, laborData) => {
  console.log('API: Updating labor for job', jobId, 'with data:', laborData);
  const response = await api.patch(`/jobs/${jobId}/labor`, laborData);
  console.log('API Response:', response.data);
  return response.data;
};

/**
 * Update labor rate (Admin only)
 * @param {string} jobId - Job ID
 * @param {object} rateData - { ratePerHour?: number, overrideTotalCost?: number }
 */
export const updateLaborRate = async (jobId, rateData) => {
  const response = await api.patch(`/jobs/${jobId}/labor-rate`, rateData);
  return response.data;
};

// ==========================================
// NEW REVENUE MANAGEMENT FUNCTIONS
// ==========================================



/**
 * Update base revenue (Admin only)
 * @param {string} jobId - Job ID
 * @param {object} revenueData - { baseRevenue: number }
 */
export const updateRevenue = async (jobId, revenueData) => {
  const response = await api.patch(`/jobs/${jobId}/revenue`, revenueData);
  return response.data;
};

// ==========================================
// NEW ADMIN FUNCTIONS
// ==========================================

/**
 * Approve job costing (Admin only)
 * @param {string} jobId - Job ID
 * @param {object} approvalData - { notes?: string }
 */
export const approveCosting = async (jobId, approvalData = {}) => {
  const response = await api.post(`/jobs/${jobId}/approve-costing`, approvalData);
  return response.data;
};

/**
 * Update technician payment settings (Admin only)
 * @param {string} jobId - Job ID
 * @param {object} paymentData - { calculationType, fixedAmount, percentage, overrideAmount, removeOverride }
 */
export const updateTechnicianPayment = async (jobId, paymentData) => {
  const response = await api.patch(`/jobs/${jobId}/technician-payment`, paymentData);
  return response.data;
};

/**
 * Get cost breakdown for a job
 * @param {string} jobId - Job ID
 */
export const getCostBreakdown = async (jobId) => {
  const response = await api.get(`/jobs/${jobId}/cost-breakdown`);
  return response.data;
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Calculate expected technician payment
 * @param {object} job - Job object
 * @returns {number} Expected payment amount
 */
export const calculateTechnicianPayment = (job) => {
  if (!job) return 0;

  // Check if there's an override
  if (job.technicianPayment?.isOverridden && job.technicianPayment?.overriddenAmount) {
    return job.technicianPayment.overriddenAmount;
  }

  const calculationType = job.technicianPayment?.calculationType || 'hourly';
  
  switch (calculationType) {
    case 'fixed':
      return job.technicianPayment?.fixedAmount || 0;
    
    case 'hourly':
      return (job.laborHours || 0) * (job.technicianPayment?.hourlyRate || 0);
    
    case 'percentage_revenue':
      const revenuePercentage = (job.technicianPayment?.percentage || 0) / 100;
      return (job.totalRevenue || 0) * revenuePercentage;
    
    case 'percentage_profit':
      const profitPercentage = (job.technicianPayment?.percentage || 0) / 100;
      return Math.max(0, (job.profit || 0) * profitPercentage);
    
    default:
      return 0;
  }
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  // keep for backwards compatibility but delegate to util when available
  if (!amount && amount !== 0) return '₱0';
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Check if job is editable by technician
 * @param {object} job - Job object
 * @returns {boolean} Whether technician can edit
 */
export const canTechnicianEdit = (job) => {
  if (!job) return false;
  return job.status !== 'completed' && job.status !== 'paid' && job.status !== 'cancelled';
};

/**
 * Get status color class
 * @param {string} status - Job status
 * @returns {string} Tailwind CSS class
 */
export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    paid: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};