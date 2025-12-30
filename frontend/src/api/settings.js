// api/settings.js - CREATE THIS NEW FILE
import api from "./axios";

/**
 * Get all settings
 * GET /api/settings
 */
export const getSettings = async () => {
  const res = await api.get("/settings");
  return res.data;
};

/**
 * Update settings (Admin only)
 * PUT /api/settings
 */
export const updateSettings = async (settingsData) => {
  const res = await api.put("/settings", settingsData);
  return res.data;
};

/**
 * Get labor rate for job type
 * GET /api/settings/labor-rate/:jobType
 */
export const getLaborRateForJobType = async (jobType) => {
  const res = await api.get(`/settings/labor-rate/${jobType}`);
  return res.data;
};

/**
 * Get default revenue for job type
 * GET /api/settings/default-revenue/:jobType
 */
export const getDefaultRevenueForJobType = async (jobType) => {
  const res = await api.get(`/settings/default-revenue/${jobType}`);
  return res.data;
};

/**
 * Update labor rate for job type (Admin only)
 * PUT /api/settings/labor-rate/:jobType
 */
export const updateLaborRateForJobType = async (jobType, hourlyRate) => {
  const res = await api.put(`/settings/labor-rate/${jobType}`, { hourlyRate });
  return res.data;
};

/**
 * Update default revenue for job type (Admin only)
 * PUT /api/settings/default-revenue/:jobType
 */
export const updateDefaultRevenueForJobType = async (jobType, amount) => {
  const res = await api.put(`/settings/default-revenue/${jobType}`, { amount });
  return res.data;
};

/**
 * Update technician payment defaults (Admin only)
 * PUT /api/settings/technician-payment-defaults
 */
export const updateTechnicianPaymentDefaults = async (paymentData) => {
  const res = await api.put("/settings/technician-payment-defaults", paymentData);
  return res.data;
};