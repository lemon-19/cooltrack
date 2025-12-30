// controllers/settingsController.js - CREATE THIS NEW FILE
import Settings from '../models/Settings.js';

// ==========================================
// GET SETTINGS
// ==========================================
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // Create default settings if none exist
    if (!settings) {
      settings = await Settings.create({
        laborRates: {
          defaultHourlyRate: 0,
          ratesByJobType: []
        },
        defaultRevenue: [],
        technicianPayment: {
          defaultCalculationType: 'hourly',
          defaultFixedAmount: 0,
          defaultPercentage: 0
        },
        allowNegativeProfit: false,
        requireCostApproval: true
      });
    }

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// UPDATE SETTINGS (Admin only)
// ==========================================
export const updateSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings(updateData);
    } else {
      Object.assign(settings, updateData);
    }

    settings.updatedAt = new Date();
    settings.updatedBy = userId;

    await settings.save();

    // Emit socket event
    global.io?.emit('settings:updated', {
      updatedBy: userId,
      timestamp: new Date()
    });

    res.json({
      success: true,
      settings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// GET LABOR RATE FOR JOB TYPE
// ==========================================
export const getLaborRateForJobType = async (req, res) => {
  try {
    const { jobType } = req.params;

    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.json({
        success: true,
        rate: 0
      });
    }

    const jobTypeRate = settings.laborRates.ratesByJobType.find(
      r => r.jobType === jobType
    );

    const rate = jobTypeRate 
      ? jobTypeRate.hourlyRate 
      : settings.laborRates.defaultHourlyRate;

    res.json({
      success: true,
      rate
    });
  } catch (error) {
    console.error('Get labor rate error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// GET DEFAULT REVENUE FOR JOB TYPE
// ==========================================
export const getDefaultRevenueForJobType = async (req, res) => {
  try {
    const { jobType } = req.params;

    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.json({
        success: true,
        revenue: 0
      });
    }

    const jobTypeRevenue = settings.defaultRevenue.find(
      r => r.jobType === jobType
    );

    const revenue = jobTypeRevenue ? jobTypeRevenue.amount : 0;

    res.json({
      success: true,
      revenue
    });
  } catch (error) {
    console.error('Get default revenue error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// UPDATE LABOR RATE FOR JOB TYPE (Admin only)
// ==========================================
export const updateLaborRateForJobType = async (req, res) => {
  try {
    const { jobType } = req.params;
    const { hourlyRate } = req.body;
    const userId = req.user._id;

    if (hourlyRate === undefined || hourlyRate < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid hourly rate required'
      });
    }

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }

    // Find existing rate for this job type
    const existingRateIndex = settings.laborRates.ratesByJobType.findIndex(
      r => r.jobType === jobType
    );

    if (existingRateIndex >= 0) {
      settings.laborRates.ratesByJobType[existingRateIndex].hourlyRate = hourlyRate;
    } else {
      settings.laborRates.ratesByJobType.push({
        jobType,
        hourlyRate
      });
    }

    settings.updatedAt = new Date();
    settings.updatedBy = userId;

    await settings.save();

    res.json({
      success: true,
      settings,
      message: 'Labor rate updated successfully'
    });
  } catch (error) {
    console.error('Update labor rate for job type error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// UPDATE DEFAULT REVENUE FOR JOB TYPE (Admin only)
// ==========================================
export const updateDefaultRevenueForJobType = async (req, res) => {
  try {
    const { jobType } = req.params;
    const { amount } = req.body;
    const userId = req.user._id;

    if (amount === undefined || amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount required'
      });
    }

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }

    // Find existing revenue for this job type
    const existingRevenueIndex = settings.defaultRevenue.findIndex(
      r => r.jobType === jobType
    );

    if (existingRevenueIndex >= 0) {
      settings.defaultRevenue[existingRevenueIndex].amount = amount;
    } else {
      settings.defaultRevenue.push({
        jobType,
        amount
      });
    }

    settings.updatedAt = new Date();
    settings.updatedBy = userId;

    await settings.save();

    res.json({
      success: true,
      settings,
      message: 'Default revenue updated successfully'
    });
  } catch (error) {
    console.error('Update default revenue for job type error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// UPDATE TECHNICIAN PAYMENT DEFAULTS (Admin only)
// ==========================================
export const updateTechnicianPaymentDefaults = async (req, res) => {
  try {
    const { 
      defaultCalculationType, 
      defaultFixedAmount, 
      defaultPercentage 
    } = req.body;
    const userId = req.user._id;

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }

    if (defaultCalculationType) {
      settings.technicianPayment.defaultCalculationType = defaultCalculationType;
    }

    if (defaultFixedAmount !== undefined) {
      settings.technicianPayment.defaultFixedAmount = defaultFixedAmount;
    }

    if (defaultPercentage !== undefined) {
      settings.technicianPayment.defaultPercentage = defaultPercentage;
    }

    settings.updatedAt = new Date();
    settings.updatedBy = userId;

    await settings.save();

    res.json({
      success: true,
      settings,
      message: 'Technician payment defaults updated successfully'
    });
  } catch (error) {
    console.error('Update technician payment defaults error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};