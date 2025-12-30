// routes/jobRoutes.js
import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import multer from 'multer';
import { 
  getAllJobs,
  getJobStats,
  createJob,
  updateJob,
  deleteJob,
  uploadJobFiles,
  addMaterials,
  updateJobStatus,
  getJobDetails,
  getJobsForTechnician,
  removeMaterial,
  editMaterial,
  updateLabor,
  addAdditionalPayment,
  removeAdditionalPayment,
  updateRevenue,
  updateLaborRate,
  approveCosting,
  updateTechnicianPayment,
  getCostBreakdown
} from '../controllers/jobController.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Apply protect middleware to all routes below
router.use(protect);

// Statistics (must be before /:id)
router.get('/stats', getJobStats);

// Technician jobs (must be before /:id)
router.get('/technician', getJobsForTechnician);

// Get all jobs
router.get('/', getAllJobs);

// Get single job
router.get('/:id', getJobDetails);

// Create job
router.post(
  '/',
  upload.fields([
    { name: 'photos', maxCount: 10 },
    { name: 'documents', maxCount: 10 }
  ]),
  createJob
);

// Update job
router.put('/:id', updateJob);

// Delete job (admin only)
router.delete('/:id', adminOnly, deleteJob);

// Upload files to job
router.post(
  '/:jobId/files',
  upload.fields([
    { name: 'photos', maxCount: 10 },
    { name: 'documents', maxCount: 10 }
  ]),
  uploadJobFiles
);

// Add materials to job
router.post('/:jobId/materials', addMaterials);

// Update job status
router.patch('/:jobId/status', updateJobStatus);

// Material management (Technician/Admin)
router.delete('/:jobId/materials/:materialIndex', removeMaterial);
router.patch('/:jobId/materials/:materialIndex', editMaterial);

// Labor management (Technician)
router.patch('/:jobId/labor', updateLabor);

// Additional payments (Technician)
router.post('/:jobId/additional-payment', addAdditionalPayment);
router.delete('/:jobId/additional-payment/:paymentIndex', removeAdditionalPayment);

// Revenue management (Admin only)
router.patch('/:jobId/revenue', adminOnly, updateRevenue);

// Labor rate management (Admin only)
router.patch('/:jobId/labor-rate', adminOnly, updateLaborRate);

// Costing approval (Admin only)
router.post('/:jobId/approve-costing', adminOnly, approveCosting);

// Technician payment (Admin only)
router.patch('/:jobId/technician-payment', adminOnly, updateTechnicianPayment);

// Get cost breakdown
router.get('/:jobId/cost-breakdown', getCostBreakdown);

export default router;