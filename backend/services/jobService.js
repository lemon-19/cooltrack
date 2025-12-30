// services/jobService.js
import Job from "../models/Job.js";
import GroupedInventory from '../models/GroupedInventory.js';
import SerializedInventory from '../models/SerializedInventory.js';
import Settings from '../models/Settings.js';
import Customer from "../models/Customer.js";
import serializedInventoryService from "./serializedInventoryService.js";
import groupedInventoryService from "./groupedInventoryService.js";
import mongoose from "mongoose";
import { bucket } from "./firebase.js";
import { nanoid } from "nanoid";

class JobService {
  // Upload photos/documents to Firebase Storage
  async uploadFiles(jobId, files, userId) {
    const job = await Job.findById(jobId);
    if (!job) throw new Error("Job not found");

    const uploadedUrls = { photos: [], documents: [] };

    for (const type of ["photos", "documents"]) {
      if (files[type]) {
        for (const file of files[type]) {
          const fileName = `jobs/${jobId}/${type}/${nanoid(10)}_${
            file.originalname
          }`;
          const fileUpload = bucket.file(fileName);

          await fileUpload.save(file.buffer, {
            metadata: { contentType: file.mimetype },
          });

          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
          uploadedUrls[type].push(publicUrl);
        }

        // Update job document
        job[`${type}Urls`] = [...job[`${type}Urls`], ...uploadedUrls[type]];
      }
    }

    await job.save();

    // Emit Socket.IO event
    global.io?.to(`job:${jobId}`).emit("job:files-updated", {
      jobId,
      photos: uploadedUrls.photos,
      documents: uploadedUrls.documents,
    });

    return uploadedUrls;
  }

  // Generate job number
  async generateJobNumber() {
    const year = new Date().getFullYear();
    const lastJob = await Job.findOne().sort({ createdAt: -1 });

    if (!lastJob) {
      return `JOB-${year}-00001`;
    }

    const lastNumber = parseInt(lastJob.jobNumber.split("-")[2]);
    const newNumber = String(lastNumber + 1).padStart(5, "0");

    return `JOB-${year}-${newNumber}`;
  }

  // Create job
  async createJob(jobData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const customer = await Customer.findById(jobData.customerId).session(
        session
      );
      if (!customer) throw new Error("Customer not found");

      const lastJob = await Job.findOne()
        .sort({ createdAt: -1 })
        .session(session);
      const year = new Date().getFullYear();
      const lastNumber = lastJob
        ? parseInt(lastJob.jobNumber.split("-")[2])
        : 0;
      const jobNumber = `JOB-${year}-${String(lastNumber + 1).padStart(
        5,
        "0"
      )}`;

      // FIX: Handle assignedTo as array and provide defaults
      const job = new Job({
        jobNumber,
        customerId: jobData.customerId,
        type: jobData.type,
        description: jobData.description || "",
        status: jobData.status || "pending",
        scheduledDate: jobData.scheduledDate || null,

        // Convert assignedTo to array if it exists
        assignedTo: jobData.assignedTo || null,

        // Denormalized customer data
        customerName: customer.name,
        customerAddress: customer.address,
        customerPhone: customer.phone,

        // Costing fields with defaults
        laborHours: jobData.laborHours || 0,
        laborCost: jobData.laborCost || 0,
        totalRevenue: jobData.totalRevenue || 0,

        // Notes with defaults
        technicianNotes: jobData.technicianNotes || "",
        adminNotes: jobData.adminNotes || "",

        // Initialize arrays
        materialsUsed: [],
        additionalCosts: [],
        photoUrls: [],
        documentUrls: [],

        // Metadata
        createdBy: userId,
      });

      await job.save({ session });

      customer.totalJobs += 1;
      await customer.save({ session });

      await session.commitTransaction();

      // Emit to all admins or dashboard
      global.io?.to("dashboard").emit("job:created", {
        jobId: job._id,
        jobNumber: job.jobNumber,
        customer: customer.name,
      });

      return job;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

// Service function
// Add materials to job
async addMaterials(jobId, materials, userId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const job = await Job.findById(jobId).session(session);
    if (!job) {
      throw new Error('Job not found');
    }

    // REMOVE THE USER AUTHORIZATION CHECK FROM HERE
    // Authorization is now handled in the controller
    
    // ... rest of existing addMaterials logic ...
    
    for (let i = 0; i < materials.length; i++) {
      const material = materials[i];
      let materialData;

      if (material.inventoryType === 'serialized') {
        await serializedInventoryService.installItem(
          material.serialNumber,
          jobId,
          job.customerId,
          userId
        );

        const { item, history } = await serializedInventoryService.getItemHistory(
          material.serialNumber
        );

        materialData = {
          inventoryType: 'serialized',
          inventoryItemId: item._id,
          inventoryModel: 'SerializedInventory',
          itemName: item.itemName,
          serialNumber: material.serialNumber,
          unit: 'pcs',
          quantity: 1,
          unitCost: item.salePrice || 0,
          totalCost: item.salePrice || 0,
          addedBy: userId, // Track who added this material
        };

      } else if (material.inventoryType === 'grouped') {
        if (!material.itemName) {
          throw new Error('Item name is required for grouped materials');
        }

        const providedValue =
          material.valueUsed !== undefined && material.valueUsed !== null
            ? parseFloat(material.valueUsed)
            : undefined;

        const providedQuantity =
          material.quantity !== undefined && material.quantity !== null
            ? parseFloat(material.quantity)
            : undefined;

        const providedLength =
          material.lengthUsed !== undefined && material.lengthUsed !== null
            ? parseFloat(material.lengthUsed)
            : undefined;

        if (
          (providedValue === undefined || isNaN(providedValue)) &&
          (providedQuantity === undefined || isNaN(providedQuantity)) &&
          (providedLength === undefined || isNaN(providedLength))
        ) {
          throw new Error(
            'Please specify amount used for grouped materials (valueUsed | quantity | lengthUsed).'
          );
        }

        const itemInfo = await groupedInventoryService.getItemByName(material.itemName);
        if (!itemInfo) {
          throw new Error(`Grouped item not found: ${material.itemName}`);
        }

        const usage = { quantity: 0, length: 0 };

        if (itemInfo.unit === 'pcs') {
          usage.quantity =
            providedQuantity !== undefined && !isNaN(providedQuantity)
              ? providedQuantity
              : providedValue !== undefined && !isNaN(providedValue)
              ? providedValue
              : 0;
        } else if (itemInfo.unit === 'meter' || itemInfo.unit === 'roll') {
          usage.length =
            providedLength !== undefined && !isNaN(providedLength)
              ? providedLength
              : providedValue !== undefined && !isNaN(providedValue)
              ? providedValue
              : 0;
        } else {
          usage.quantity =
            providedQuantity !== undefined && !isNaN(providedQuantity)
              ? providedQuantity
              : providedValue !== undefined && !isNaN(providedValue)
              ? providedValue
              : 0;
        }

        const result = await groupedInventoryService.useStock(
          material.itemName,
          usage,
          jobId,
          userId
        );

        materialData = {
          inventoryType: 'grouped',
          inventoryItemId: result.item._id,
          inventoryModel: 'GroupedInventory',
          itemName: result.item.itemName,
          unitId: result.usedUnits[0]?.unitId || null,
          unit: result.item.unit,
          quantity: 0,
          lengthUsed: 0,
          unitCost: result.averageUnitCost || 0,
          totalCost: result.totalCost || 0,
          addedBy: userId, // Track who added this material
        };

        if (result.item.unit === 'pcs') {
          materialData.quantity = usage.quantity;
        } else if (result.item.unit === 'meter' || result.item.unit === 'roll') {
          materialData.lengthUsed = usage.length;
        } else {
          materialData.quantity = usage.quantity;
        }
      } else {
        throw new Error(`Invalid inventory type: ${material.inventoryType}`);
      }

      job.materialsUsed.push(materialData);
    }

    await job.save({ session });
    await session.commitTransaction();

    if (global.io) {
      global.io.emit('job:materials-added', {
        jobId: job._id,
        jobNumber: job.jobNumber,
        materialsCount: materials.length,
      });
    }

    return job;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}


  // Update job status
  async updateStatus(jobId, status, userId, updateData = {}) {
    const job = await Job.findById(jobId);

    if (!job) {
      throw new Error("Job not found");
    }

    const oldStatus = job.status;
    job.status = status;

    // Update timestamps based on status
    if (status === "in_progress" && !job.startedAt) {
      job.startedAt = new Date();
    }

    if (status === "completed" && !job.completedAt) {
      job.completedAt = new Date();
    }

    if (status === "paid" && !job.paidAt) {
      job.paidAt = new Date();

      // Update customer revenue
      const customer = await Customer.findById(job.customerId);
      if (customer) {
        customer.totalRevenue += job.totalRevenue;
        await customer.save();
      }
    }

    // Apply any additional updates
    Object.assign(job, updateData);

    await job.save();

    // Emit notification event for status changes
    if (status === "completed") {
      global.io?.emit("job:completed", {
        jobId: job._id,
        jobNumber: job.jobNumber,
        status: status,
      });
    } else {
      global.io?.emit("job:status-changed", {
        jobId: job._id,
        jobNumber: job.jobNumber,
        oldStatus,
        newStatus: status,
        updatedBy: userId,
      });
    }

    return job;
  }

  // Get jobs for technician
  async getJobsForTechnician(technicianId, filters = {}) {
    const query = {
      assignedTo: technicianId,
      ...filters,
    };

    return await Job.find(query)
      .populate("customerId", "name phone address")
      .populate("assignedTo", "name")
      .sort({ scheduledDate: 1, createdAt: -1 });
  }

  // Get job with full details
async getJobDetails(jobId) {
  try {
    const job = await Job.findById(jobId)
      .populate("customerId", "name email phone address")
      .populate("assignedTo", "name phone email")
      .populate("createdBy", "name");

    if (!job) {
      throw new Error("Job not found");
    }

    // Get material details - Simplified version
    const materialDetails = [];
    
    for (const material of job.materialsUsed) {
      let details = null;
      
      if (material.inventoryType === "serialized") {
        try {
          details = await SerializedInventory.findOne({
            serialNumber: material.serialNumber
          }).select('-maintenanceHistory -photoUrls -documentUrls');
        } catch (error) {
          console.error(`Failed to fetch serialized item ${material.serialNumber}:`, error);
        }
      } else {
        try {
          details = await GroupedInventory.findById(material.inventoryItemId)
            .select('itemName category unit specifications');
        } catch (error) {
          console.error(`Failed to fetch grouped item ${material.inventoryItemId}:`, error);
        }
      }
      
      materialDetails.push({
        ...material.toObject(),
        details
      });
    }

    return {
      ...job.toObject(),
      materialDetails,
    };
  } catch (error) {
    console.error("Error in getJobDetails:", error);
    throw error;
  }
}

    // ==========================================
  // NEW METHOD: Update labor details (Technician)
  // ==========================================
// services/jobService.js - Update the updateLabor function to calculate cost
async updateLabor(jobId, laborData, userId) {
  try {
    const job = await Job.findById(jobId);
    if (!job) throw new Error('Job not found');

    // Authorization
    if (!job.assignedTo || job.assignedTo.toString() !== userId.toString()) {
      throw new Error('Not authorized to update this job');
    }

    // Status check
    if (['completed', 'paid'].includes(job.status)) {
      throw new Error('Cannot update labor on completed or paid job');
    }

    if (laborData.hours !== undefined) {
      const hours = Number(laborData.hours);
      if (isNaN(hours) || hours < 0) {
        throw new Error('Hours must be a valid number >= 0');
      }

      // ✅ Set hours
      job.laborHours = hours;

      // ✅ Get labor rate
      const settings = await Settings.findOne();
      let rate = 0;

      if (settings) {
        const jobTypeRate = settings.laborRates?.ratesByJobType?.find(
          r => r.jobType === job.type
        );
        rate =
          jobTypeRate?.hourlyRate ??
          settings.laborRates?.defaultHourlyRate ??
          0;
      }

      // ✅ ALWAYS recalculate labor cost
      job.laborCost = Number(hours * rate) || 0;
      // Ensure mongoose knows this primitive field changed
      job.markModified && job.markModified('laborCost');

      // Labor cost calculated and updated
    }

    // ✅ Recalculate totals
    await this.calculateAndUpdateJobCosts(job);

    await job.save();

    // Return the fresh job instance (ensures saved values are returned)
    return await Job.findById(job._id);
  } catch (error) {
    console.error('Error in updateLabor:', error);
    throw error;
  }
}


    // ==========================================
  // NEW METHOD: Add additional payment (Technician)
  // ==========================================
  async addAdditionalPayment(jobId, paymentData, userId) {
    try {
      const job = await Job.findById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      if (!job.canTechnicianEdit(userId)) {
        throw new Error('You are not authorized to add payments for this job');
      }

      if (!paymentData.description || !paymentData.amount) {
        throw new Error('Description and amount are required');
      }

      if (paymentData.amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      job.revenue.additionalPayments.push({
        description: paymentData.description,
        amount: paymentData.amount,
        addedBy: userId,
        addedAt: new Date()
      });

      await job.save();

      global.io?.emit('job:additional-payment-added', {
        jobId: job._id,
        jobNumber: job.jobNumber,
        totalRevenue: job.revenue.totalRevenue
      });

      return job;
    } catch (error) {
      throw new Error(`Failed to add additional payment: ${error.message}`);
    }
  }

    // ==========================================
  // NEW METHOD: Remove additional payment (Technician)
  // ==========================================
  async removeAdditionalPayment(jobId, paymentIndex, userId) {
    try {
      const job = await Job.findById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      if (!job.canTechnicianEdit(userId)) {
        throw new Error('You are not authorized to remove payments for this job');
      }

      if (paymentIndex < 0 || paymentIndex >= job.revenue.additionalPayments.length) {
        throw new Error('Invalid payment index');
      }

      job.revenue.additionalPayments.splice(paymentIndex, 1);
      await job.save();

      return job;
    } catch (error) {
      throw new Error(`Failed to remove additional payment: ${error.message}`);
    }
  }


    // ==========================================
  // NEW METHOD: Update base revenue (Admin only)
  // ==========================================
async updateRevenue(jobId, revenueData, userId, userRole) {
  try {
    console.log('Service: Updating revenue for job', jobId, 'with data:', revenueData);
    
    // Check user role
    if (userRole !== 'admin') {
      throw new Error('Only admins can update revenue');
    }

    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    // Check if job status allows editing
    if (job.status === 'completed' || job.status === 'paid') {
      throw new Error('Cannot update revenue on completed or paid job');
    }

    // Validate and update revenue
    if (revenueData.baseRevenue !== undefined) {
      const newRevenue = parseFloat(revenueData.baseRevenue);
      
      if (isNaN(newRevenue)) {
        throw new Error('Revenue must be a valid number');
      }
      
      if (newRevenue < 0) {
        throw new Error('Revenue cannot be negative');
      }
      
      // Update the totalRevenue field
      job.totalRevenue = newRevenue;
      
      // Recalculate profit
      const totalCost = job.totalCost || 0;
      job.profit = newRevenue - totalCost;
      
      console.log(`Updated revenue: ${newRevenue}, Profit: ${job.profit}, Total Cost: ${totalCost}`);
    }

    // Save the job
    await job.save();

    // Emit notification for labor update
    global.io?.emit("job:labor-updated", {
      jobId: job._id,
      jobNumber: job.jobNumber,
      hours: job.laborHours,
      laborCost: job.laborCost,
    });
    
    console.log('Job saved successfully with new revenue:', job.totalRevenue);

    // Emit socket event
    if (global.io) {
      global.io.emit('job:revenue-updated', {
        jobId: job._id,
        jobNumber: job.jobNumber,
        totalRevenue: job.totalRevenue,
        profit: job.profit
      });
    }

    return job;
  } catch (error) {
    console.error('Error in updateRevenue service:', error);
    throw error;
  }
}

  // ==========================================
  // NEW METHOD: Update labor rate (Admin only)
  // ==========================================
  async updateLaborRate(jobId, rateData, userId, userRole) {
    try {
      if (userRole !== 'admin') {
        throw new Error('Only admins can update labor rate');
      }

      const job = await Job.findById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      if (rateData.ratePerHour !== undefined) {
        // store as primitive laborCost using current laborHours
        const rate = Number(rateData.ratePerHour) || 0;
        job.laborCost = Number((job.laborHours || 0) * rate) || 0;
        job.markModified && job.markModified('laborCost');
        job.labor = job.labor || {};
        job.labor.ratePerHour = rate;
        job.labor.isOverridden = false;
      }

      if (rateData.overrideTotalCost !== undefined) {
        const override = Number(rateData.overrideTotalCost) || 0;
        // Set primary laborCost field so calculations work consistently
        job.laborCost = override;
        job.markModified && job.markModified('laborCost');
        job.labor = job.labor || {};
        job.labor.totalLaborCost = override;
        job.labor.isOverridden = true;
        job.labor.overriddenBy = userId;
      }

      await job.save();

      return job;
    } catch (error) {
      throw new Error(`Failed to update labor rate: ${error.message}`);
    }
  }

  // ==========================================
  // NEW METHOD: Approve costing (Admin only)
  // ==========================================
async approveCosting(jobId, approvalData, userId, userRole) {
  try {
    // Check user role
    if (userRole !== 'admin') {
      throw new Error('Only admins can approve costing');
    }

    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    // Check if costing is already approved
    if (job.costingApproval?.isApproved) {
      throw new Error('Costing is already approved');
    }

    // Get settings to check if negative profit is allowed
    let settings;
    try {
      settings = await Settings.findOne();
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Continue without settings
    }

    // Check profit if negative profit not allowed
    if (settings && !settings.allowNegativeProfit && job.profit < 0) {
      throw new Error('Cannot approve job with negative profit');
    }

    // Update costing approval
    job.costingApproval = {
      isApproved: true,
      approvedBy: userId,
      approvedAt: new Date(),
      notes: approvalData.notes || '',
      profitAtApproval: job.profit || 0,
      totalCostAtApproval: job.totalCost || 0,
      totalRevenueAtApproval: job.totalRevenue || 0
    };

    // Save the job
    await job.save();

    // Emit socket event
    if (global.io) {
      global.io.emit('job:costing-approved', {
        jobId: job._id,
        jobNumber: job.jobNumber,
        approvedBy: userId,
        profit: job.profit
      });
    }

    return job;
  } catch (error) {
    throw error;
  }
}

  // ==========================================
  // NEW METHOD: Update technician payment settings (Admin only)
  // ==========================================
  async updateTechnicianPayment(jobId, paymentData, userId, userRole) {
    try {
      if (userRole !== 'admin') {
        throw new Error('Only admins can update technician payment settings');
      }

      const job = await Job.findById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      if (paymentData.calculationType) {
        job.technicianPayment.calculationType = paymentData.calculationType;
      }

      if (paymentData.fixedAmount !== undefined) {
        job.technicianPayment.fixedAmount = paymentData.fixedAmount;
      }

      if (paymentData.percentage !== undefined) {
        job.technicianPayment.percentage = paymentData.percentage;
      }

      if (paymentData.overrideAmount !== undefined) {
        job.technicianPayment.isOverridden = true;
        job.technicianPayment.overriddenAmount = paymentData.overrideAmount;
        job.technicianPayment.overriddenBy = userId;
      } else if (paymentData.removeOverride) {
        job.technicianPayment.isOverridden = false;
        job.technicianPayment.overriddenAmount = null;
        job.technicianPayment.overriddenBy = null;
      }

      await job.save();

      return job;
    } catch (error) {
      throw new Error(`Failed to update technician payment: ${error.message}`);
    }
  }

    // ==========================================
  // NEW METHOD: Remove material (Technician/Admin)
  // ==========================================
  async removeMaterial(jobId, materialIndex, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const job = await Job.findById(jobId).session(session);
      if (!job) {
        throw new Error('Job not found');
      }

      const user = await User.findById(userId);
      const canEdit = user.role === 'admin' || job.canTechnicianEdit(userId);
      
      if (!canEdit) {
        throw new Error('You are not authorized to remove materials from this job');
      }

      if (materialIndex < 0 || materialIndex >= job.materialsUsed.length) {
        throw new Error('Invalid material index');
      }

      const material = job.materialsUsed[materialIndex];

      // Return stock to inventory
      if (material.inventoryType === 'grouped') {
        // Add the stock back (you'll need to implement this in groupedInventoryService)
        await groupedInventoryService.returnStock(
          material.itemName,
          {
            quantity: material.quantity || 0,
            length: material.lengthUsed || 0
          },
          material.unitId,
          userId
        );
      } else if (material.inventoryType === 'serialized') {
        // Return serialized item
        await serializedInventoryService.returnItem(
          material.serialNumber,
          userId,
          'Material removed from job'
        );
      }

      job.materialsUsed.splice(materialIndex, 1);
      await job.save({ session });

      await session.commitTransaction();

      global.io?.emit('job:material-removed', {
        jobId: job._id,
        jobNumber: job.jobNumber,
        materialIndex
      });

      return job;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ==========================================
  // NEW METHOD: Edit material (Technician/Admin)
  // ==========================================
  async editMaterial(jobId, materialIndex, updatedMaterial, userId) {
    try {
      const job = await Job.findById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      const user = await User.findById(userId);
      const canEdit = user.role === 'admin' || job.canTechnicianEdit(userId);
      
      if (!canEdit) {
        throw new Error('You are not authorized to edit materials for this job');
      }

      if (materialIndex < 0 || materialIndex >= job.materialsUsed.length) {
        throw new Error('Invalid material index');
      }

      const material = job.materialsUsed[materialIndex];

      // Update allowed fields
      if (updatedMaterial.unitCost !== undefined) {
        material.unitCost = updatedMaterial.unitCost;
        material.totalCost = material.unitCost * (material.quantity || material.lengthUsed || 1);
      }

      if (updatedMaterial.quantity !== undefined && material.unit === 'pcs') {
        material.quantity = updatedMaterial.quantity;
        material.totalCost = material.unitCost * material.quantity;
      }

      if (updatedMaterial.lengthUsed !== undefined && 
          (material.unit === 'meter' || material.unit === 'roll')) {
        material.lengthUsed = updatedMaterial.lengthUsed;
        material.totalCost = material.unitCost * material.lengthUsed;
      }

      await job.save();

      global.io?.emit('job:material-updated', {
        jobId: job._id,
        jobNumber: job.jobNumber,
        materialIndex
      });

      return job;
    } catch (error) {
      throw error;
    }
  }

  // services/jobService.js - Add this helper function
async calculateAndUpdateJobCosts(job) {
  try {
    // Calculate material cost
    job.totalMaterialCost = (job.materialsUsed || []).reduce(
      (sum, m) => sum + (m.totalCost || 0), 0
    );
    
    // Calculate additional costs
    const additionalTotal = (job.additionalCosts || []).reduce(
      (sum, c) => sum + (c.amount || 0), 0
    );
    
    // Calculate total cost
    job.totalCost = job.totalMaterialCost + job.laborCost + additionalTotal;
    
    // Calculate profit
    job.profit = (job.totalRevenue || 0) - job.totalCost;
    
    // Mark fields as modified
    job.markModified && job.markModified('totalMaterialCost');
    job.markModified && job.markModified('laborCost');
    job.markModified && job.markModified('totalCost');
    job.markModified && job.markModified('profit');
    
    return job;
  } catch (error) {
    console.error('Error calculating job costs:', error);
    throw error;
  }
}

}

export default new JobService();


