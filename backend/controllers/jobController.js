// controllers/jobController.js (COMPLETE VERSION WITH SOCKET.IO)
import jobService from '../services/jobService.js';
import Job from '../models/Job.js';
import Customer from '../models/Customer.js';
import { bucket } from '../services/firebase.js';
import { nanoid } from 'nanoid';
import Settings from '../models/Settings.js';

// Helper: Upload files to Firebase Storage
async function uploadFilesToFirebase(files, folder) {
  const urls = [];

  for (const file of files) {
    const fileName = `${folder}/${nanoid(10)}_${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(file.buffer, {
      metadata: { contentType: file.mimetype },
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    urls.push(publicUrl);
  }

  return urls;
}

// ==========================================
// GET ALL JOBS
// ==========================================
export async function getAllJobs(req, res) {
  try {
    const userId = req.user._id || req.userId;
    const userRole = req.user.role;

    let jobs;
    
    if (userRole === 'admin') {
      // Admin sees all jobs
      jobs = await Job.find()
        .populate('customerId', 'name phone address')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 });
    } else {
      // Technician sees only assigned jobs
      jobs = await Job.find({ assignedTo: userId })
        .populate('customerId', 'name phone address')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 });
    }

    res.status(200).json({ 
      success: true, 
      count: jobs.length,
      jobs 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// ==========================================
// GET JOB STATISTICS
// ==========================================
export async function getJobStats(req, res) {
  try {
    const userId = req.user._id || req.userId;
    const userRole = req.user.role;

    let query = {};
    if (userRole !== 'admin') {
      query.assignedTo = userId;
    }

    const jobs = await Job.find(query);

    const stats = {
      totalJobs: jobs.length,
      pendingJobs: jobs.filter(j => j.status === 'pending').length,
      inProgressJobs: jobs.filter(j => j.status === 'in_progress').length,
      completedJobs: jobs.filter(j => j.status === 'completed' || j.status === 'paid').length,
      cancelledJobs: jobs.filter(j => j.status === 'cancelled').length,
      totalRevenue: jobs.reduce((sum, j) => sum + (j.totalRevenue || 0), 0),
      totalCost: jobs.reduce((sum, j) => sum + (j.totalCost || 0), 0),
      totalProfit: jobs.reduce((sum, j) => sum + (j.profit || 0), 0)
    };

    res.status(200).json({ success: true, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// ==========================================
// CREATE NEW JOB
// ==========================================
export async function createJob(req, res) {
  try {
    const { customerId, type, description, assignedTo, status, scheduledDate, 
            laborHours, laborCost, totalRevenue, technicianNotes, adminNotes } = req.body;
    const userId = req.user._id || req.userId;

    // 1️⃣ Create the job in DB using the service
    const jobData = {
      customerId,
      type,
      description,
      assignedTo,
      status,
      scheduledDate,
      laborHours,
      laborCost,
      totalRevenue,
      technicianNotes,
      adminNotes
    };

    const job = await jobService.createJob(jobData, userId);

    // 2️⃣ Upload photos if any
    if (req.files?.photos?.length > 0) {
      const photoUrls = await uploadFilesToFirebase(req.files.photos, `jobs/${job._id}/photos`);
      job.photoUrls = photoUrls;
    }

    // 3️⃣ Upload documents if any
    if (req.files?.documents?.length > 0) {
      const documentUrls = await uploadFilesToFirebase(req.files.documents, `jobs/${job._id}/documents`);
      job.documentUrls = documentUrls;
    }

    await job.save();

    // 4️⃣ Populate the job for response
    await job.populate('customerId', 'name phone address');
    await job.populate('assignedTo', 'name');

    // 5️⃣ Emit Socket.IO event for real-time updates
    global.io?.emit('job:created', {
      jobId: job._id,
      jobNumber: job.jobNumber,
      customerName: job.customerName,
      assignedTo: job.assignedTo?.name || null,
      type: job.type,
      status: job.status
    });

    res.status(201).json({ success: true, job });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// ==========================================
// UPDATE JOB (Basic info, not status)
// ==========================================
export async function updateJob(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id || req.userId;

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'customerId', 'type', 'description', 'status', 
      'assignedTo', 'scheduledDate', 'laborHours', 
      'laborCost', 'totalRevenue', 'technicianNotes', 'adminNotes'
    ];

    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        job[field] = updateData[field];
      }
    });

    await job.save();

    // Populate for response
    await job.populate('customerId', 'name phone address');
    await job.populate('assignedTo', 'name');

    // Emit socket event for real-time update
    global.io?.emit('job:updated', {
      jobId: job._id,
      jobNumber: job.jobNumber,
      updatedBy: userId,
      updatedFields: Object.keys(updateData)
    });

    res.status(200).json({ success: true, job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// ==========================================
// DELETE JOB
// ==========================================
export async function deleteJob(req, res) {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const jobNumber = job.jobNumber;

    // Update customer's job count
    await Customer.findByIdAndUpdate(job.customerId, {
      $inc: { totalJobs: -1 }
    });

    await job.deleteOne();

    // Emit socket event for real-time update
    global.io?.emit('job:deleted', {
      jobId: id,
      jobNumber: jobNumber
    });

    res.status(200).json({ 
      success: true, 
      message: 'Job deleted successfully' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// ==========================================
// UPLOAD FILES TO EXISTING JOB
// ==========================================
export async function uploadJobFiles(req, res) {
  try {
    const { jobId } = req.params;
    const userId = req.user._id || req.userId;

    const uploaded = await jobService.uploadFiles(jobId, req.files, userId);

    res.status(200).json({ success: true, uploaded });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// ==========================================
// ADD MATERIALS TO JOB
// ==========================================
// controllers/jobController.js - Updated addMaterials

// controllers/jobController.js - REPLACE your addMaterials function with this

export const addMaterials = async (req, res) => {
  try {
    console.log('\n=== ADD MATERIALS REQUEST ===');
    console.log('Job ID:', req.params.jobId);
    console.log('User:', req.user?.name, '(ID:', req.user?._id, ')');
    console.log('User Role:', req.user?.role);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { jobId } = req.params;
    const { materials } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;
    
    if (!jobId) {
      console.log('❌ No job ID');
      return res.status(400).json({ 
        success: false, 
        message: 'Job ID is required' 
      });
    }
    
    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      console.log('❌ Invalid materials');
      return res.status(400).json({ 
        success: false, 
        message: 'Materials array is required and must not be empty' 
      });
    }
    
    if (!userId) {
      console.log('❌ No user ID');
      return res.status(400).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }
    
    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Authorization check: technician can only add to their assigned jobs
    if (userRole === 'technician') {
      const isAssigned = job.assignedTo && job.assignedTo.toString() === userId.toString();
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to add materials to this job'
        });
      }
    }
    
    console.log('✅ Validation passed, calling service...');
    
    // Pass userId to service for tracking
    const updatedJob = await jobService.addMaterials(jobId, materials, userId);
    
    console.log('✅ Success! Materials added:', updatedJob.materialsUsed.length);
    
    res.status(200).json({ 
      success: true, 
      job: updatedJob,
      message: `Successfully added ${materials.length} material(s)`
    });
    
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error('Stack:', err.stack);
    
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to add materials'
    });
  }
};

// ==========================================
// UPDATE JOB STATUS
// ==========================================
export const updateJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, updateData } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;
    
    // Get settings to check workflow requirements
    const settings = await Settings.findOne();
    
    // If technician is trying to complete the job
    if (status === 'completed' && userRole === 'technician') {
      const job = await Job.findById(jobId);
      
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }
      
      // Check if technician is assigned to this job
      const isAssigned = job.assignedTo && 
                        job.assignedTo.toString() === userId.toString();
      
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to complete this job'
        });
      }
      
      // Check if costing approval is required before completion
      if (settings?.requireCostApproval && 
          !job.costingApproval?.isApproved) {
        return res.status(400).json({
          success: false,
          message: 'Costing must be approved by admin before completing the job'
        });
      }
    }
    
    // Proceed with status update
    const job = await jobService.updateStatus(jobId, status, userId, updateData);

    res.status(200).json({ success: true, job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// GET JOB DETAILS
// ==========================================
export const getJobDetails = async (req, res) => {
  try {
    const job = await jobService.getJobDetails(req.params.id);
    res.status(200).json({ success: true, job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// GET JOBS FOR TECHNICIAN
// ==========================================
export const getJobsForTechnician = async (req, res) => {
  try {
    const userId = req.user._id || req.userId;
    const jobs = await jobService.getJobsForTechnician(userId);
    res.status(200).json({ success: true, count: jobs.length, jobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// UPDATE LABOR (Technician)
// ==========================================
export const updateLabor = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { hours } = req.body;
    const userId = req.user._id;

    if (hours === undefined || hours < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid hours required'
      });
    }

    const job = await jobService.updateLabor(jobId, { hours }, userId);

    res.json({
      success: true,
      job,
      message: 'Labor hours updated successfully'
    });
  } catch (error) {
    console.error('Update labor error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// ADD ADDITIONAL PAYMENT (Technician)
// ==========================================
export const addAdditionalPayment = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { description, amount } = req.body;
    const userId = req.user._id;

    const job = await jobService.addAdditionalPayment(
      jobId,
      { description, amount },
      userId
    );

    res.json({
      success: true,
      job,
      message: 'Additional payment added successfully'
    });
  } catch (error) {
    console.error('Add additional payment error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// REMOVE ADDITIONAL PAYMENT (Technician)
// ==========================================
export const removeAdditionalPayment = async (req, res) => {
  try {
    const { jobId, paymentIndex } = req.params;
    const userId = req.user._id;

    const job = await jobService.removeAdditionalPayment(
      jobId,
      parseInt(paymentIndex),
      userId
    );

    res.json({
      success: true,
      job,
      message: 'Additional payment removed successfully'
    });
  } catch (error) {
    console.error('Remove additional payment error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// UPDATE REVENUE (Admin only)
// ==========================================
export const updateRevenue = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { baseRevenue } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log('Update revenue request:', { jobId, baseRevenue, userId, userRole });

    // Validation
    if (baseRevenue === undefined || baseRevenue === null) {
      return res.status(400).json({
        success: false,
        message: 'Revenue amount is required'
      });
    }

    const revenueNum = parseFloat(baseRevenue);
    if (isNaN(revenueNum) || revenueNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid revenue amount required (must be a number >= 0)'
      });
    }

    // Call service
    const job = await jobService.updateRevenue(
      jobId, 
      { baseRevenue: revenueNum }, 
      userId, 
      userRole
    );

    res.json({
      success: true,
      job,
      message: 'Revenue updated successfully'
    });
  } catch (error) {
    console.error('Update revenue error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// UPDATE LABOR RATE (Admin only)
// ==========================================
export const updateLaborRate = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { ratePerHour, overrideTotalCost } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const job = await jobService.updateLaborRate(
      jobId,
      { ratePerHour, overrideTotalCost },
      userId,
      userRole
    );

    res.json({
      success: true,
      job,
      message: 'Labor rate updated successfully'
    });
  } catch (error) {
    console.error('Update labor rate error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// APPROVE COSTING (Admin only)
// ==========================================
export const approveCosting = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { notes } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const job = await jobService.approveCosting(
      jobId,
      { notes },
      userId,
      userRole
    );

    res.json({
      success: true,
      job,
      message: 'Costing approved successfully'
    });
  } catch (error) {
    console.error('Approve costing error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// UPDATE TECHNICIAN PAYMENT (Admin only)
// ==========================================
export const updateTechnicianPayment = async (req, res) => {
  try {
    const { jobId } = req.params;
    const paymentData = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const job = await jobService.updateTechnicianPayment(
      jobId,
      paymentData,
      userId,
      userRole
    );

    res.json({
      success: true,
      job,
      message: 'Technician payment updated successfully'
    });
  } catch (error) {
    console.error('Update technician payment error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


// ==========================================
// REMOVE MATERIAL (Technician/Admin)
// ==========================================
export const removeMaterial = async (req, res) => {
  try {
    const { jobId, materialIndex } = req.params;
    const userId = req.user._id;

    const job = await jobService.removeMaterial(
      jobId,
      parseInt(materialIndex),
      userId
    );

    res.json({
      success: true,
      job,
      message: 'Material removed successfully'
    });
  } catch (error) {
    console.error('Remove material error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// EDIT MATERIAL (Technician/Admin)
// ==========================================
export const editMaterial = async (req, res) => {
  try {
    const { jobId, materialIndex } = req.params;
    const updatedMaterial = req.body;
    const userId = req.user._id;

    const job = await jobService.editMaterial(
      jobId,
      parseInt(materialIndex),
      updatedMaterial,
      userId
    );

    res.json({
      success: true,
      job,
      message: 'Material updated successfully'
    });
  } catch (error) {
    console.error('Edit material error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


// ==========================================
// GET COST BREAKDOWN
// ==========================================
export const getCostBreakdown = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const breakdown = job.getCostBreakdown();

    res.json({
      success: true,
      breakdown
    });
  } catch (error) {
    console.error('Get cost breakdown error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};