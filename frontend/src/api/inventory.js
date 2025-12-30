// src/api/inventory.js
import api from './axios';

/**
 * Get all serialized inventory items
 */
export const getSerializedInventory = async (filters = {}) => {
  try {
    const res = await api.get('/inventory/serialized/all', { params: filters });
    return res.data;
  } catch (error) {
    console.error('Error fetching serialized inventory:', error);
    return { items: [] };
  }
};

/**
 * Get single serialized item by serial number
 */
export const getSerializedItemById = async (serialNumber) => {
  try {
    const res = await api.get(`/inventory/serialized/${serialNumber}`);
    return res.data;
  } catch (error) {
    console.error('Error fetching serialized item:', error);
    return null;
  }
};

/**
 * Get serialized item history
 */
export const getSerializedItemHistory = async (serialNumber) => {
  try {
    const res = await api.get(`/inventory/serialized/${serialNumber}/history`);
    return res.data;
  } catch (error) {
    console.error('Error fetching serialized item history:', error);
    return [];
  }
};

/**
 * Get all grouped inventory items
 */
export const getGroupedInventory = async (filters = {}) => {
  try {
    const res = await api.get('/inventory/grouped/all', { params: filters });
    return res.data;
  } catch (error) {
    console.error('Error fetching grouped inventory:', error);
    return { items: [] };
  }
};

/**
 * Get single grouped item by name
 */
export const getGroupedItemById = async (itemName) => {
  try {
    const res = await api.get(`/inventory/grouped/${encodeURIComponent(itemName)}`);
    return res.data;
  } catch (error) {
    console.error('Error fetching grouped item:', error);
    return null;
  }
};

/**
 * Get grouped item usage history
 */
export const getGroupedItemHistory = async (itemName) => {
  try {
    const res = await api.get(`/inventory/grouped/${encodeURIComponent(itemName)}/history`);
    return res.data;
  } catch (error) {
    console.error('Error fetching grouped item history:', error);
    return [];
  }
};

/**
 * Add serialized inventory item
 */
export const addSerializedItem = async (data) => {
  try {
    const payload = {
      ...data,
      purchasePrice: parseFloat(data.purchasePrice),
      salePrice: parseFloat(data.salePrice),
    };

    if (!payload.salePrice || isNaN(payload.salePrice)) {
      throw new Error("salePrice is required");
    }
    if (!payload.model || !payload.model.trim()) {
      throw new Error("model is required");
    }

    const token = localStorage.getItem("token");
    const res = await api.post("/inventory/serialized", payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  } catch (error) {
    console.error("Failed to add serialized item:", error);
    throw error;
  }
};

/**
 * Helper function to prepare unitData based on unit type
 */
const prepareUnitData = (data) => {
  const unitData = {
    brand: data.brand,
    category: data.category,
    supplier: data.supplier,
    purchaseDate: data.purchaseDate,
    purchasePrice: parseFloat(data.purchasePrice) || 0,
    location: data.location,
    notes: data.notes,
    minimumQuantity: parseFloat(data.minimumQuantity) || 0,
    unit: data.unit,
  };

  // Add the appropriate field based on unit type
  if (data.unit === 'meter' || data.unit === 'roll') {
    // For length-based items, use length field
    unitData.length = parseFloat(data.currentQuantity) || 0;
  } else {
    // For piece-based items (pcs, kg, liter), use quantity field
    unitData.quantity = parseFloat(data.currentQuantity) || 0;
  }

  return unitData;
};

/**
 * Add grouped inventory item
 */
export const addGroupedItem = async (data) => {
  try {
    const token = localStorage.getItem('token');
    
    // Validate required fields
    if (!data.itemName || !data.itemName.trim()) {
      throw new Error('Item name is required');
    }
    if (!data.unit) {
      throw new Error('Unit type is required');
    }
    if (!data.currentQuantity || parseFloat(data.currentQuantity) <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const payload = {
      itemName: data.itemName.trim(),
      unitData: prepareUnitData(data),
    };

    console.log('Adding grouped item:', payload);

    const res = await api.post('/inventory/grouped/add', payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  } catch (error) {
    console.error('Failed to add grouped item:', error);
    throw error;
  }
};

/**
 * Update serialized item
 */
export const updateSerializedItem = async (id, data) => {
  try {
    const token = localStorage.getItem('token');
    const res = await api.put(`/inventory/serialized/${id}`, data, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  } catch (error) {
    console.error('Failed to update serialized item:', error);
    throw error;
  }
};

/**
 * Update grouped item
 */
export const updateGroupedItem = async (id, data) => {
  try {
    const token = localStorage.getItem('token');
    
    // Validate required fields
    if (!data.itemName || !data.itemName.trim()) {
      throw new Error('Item name is required');
    }
    if (!data.unit) {
      throw new Error('Unit type is required');
    }

    const payload = {
      itemName: data.itemName.trim(),
      category: data.category,
      unit: data.unit,
      minimumQuantity: parseFloat(data.minimumQuantity) || 0,
      unitData: prepareUnitData(data),
    };

    console.log('Updating grouped item:', payload);

    const res = await api.put(`/inventory/grouped/${id}`, payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  } catch (error) {
    console.error('Failed to update grouped item:', error);
    throw error;
  }
};

/**
 * Delete serialized item
 */
export const deleteSerializedItem = async (id) => {
  try {
    const token = localStorage.getItem('token');
    const res = await api.delete(`/inventory/serialized/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  } catch (error) {
    console.error('Failed to delete serialized item:', error);
    throw error;
  }
};

/**
 * Delete grouped item
 */
export const deleteGroupedItem = async (id) => {
  try {
    const token = localStorage.getItem('token');
    const res = await api.delete(`/inventory/grouped/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  } catch (error) {
    console.error('Failed to delete grouped item:', error);
    throw error;
  }
};

/**
 * Use grouped stock (for jobs)
 */
export const useGroupedStock = async (itemName, usage, jobId) => {
  try {
    const token = localStorage.getItem('token');
    
    // Prepare usage object with both quantity and length fields
    // Backend will extract the appropriate one based on unit type
    const usagePayload = {
      quantity: usage.quantity || 0,
      length: usage.length || 0,
    };

    console.log('Using grouped stock:', { itemName, usage: usagePayload, jobId });

    const res = await api.post(
      '/inventory/grouped/use',
      { itemName, usage: usagePayload, jobId },
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    return res.data;
  } catch (error) {
    console.error('Failed to use grouped stock:', error);
    throw error;
  }
};

/**
 * Install serialized item (assign to job)
 */
export const installSerializedItem = async (serialNumber, jobId, customerId) => {
  try {
    const token = localStorage.getItem('token');
    const res = await api.post(
      '/inventory/serialized/install',
      { serialNumber, jobId, customerId },
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    return res.data;
  } catch (error) {
    console.error('Failed to install serialized item:', error);
    throw error;
  }
};

/**
 * Helper function to format display value with unit
 */
export const formatInventoryValue = (item) => {
  if (!item) return '0';
  
  const value = item.totalValue || item.currentQuantity || 0;
  const unit = item.unit || 'pcs';
  
  return `${value} ${unit}`;
};

/**
 * Helper function to check if item is length-based
 */
export const isLengthBasedUnit = (unit) => {
  return unit === 'meter' || unit === 'roll';
};