// controllers/inventoryController.js
import groupedInventoryService from '../services/groupedInventoryService.js';
import serializedInventoryService from '../services/serializedInventoryService.js';

// ============================================================================
// GROUPED INVENTORY ENDPOINTS
// ============================================================================

/**
 * GET /api/inventory/grouped/all
 * Get all grouped inventory items
 */
export const getAllGroupedItems = async (req, res) => {
  try {
    const items = await groupedInventoryService.getAllItems(req.query);
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/inventory/grouped/:itemName
 * Get single grouped item by name
 */
export const getGroupedItemByName = async (req, res) => {
  try {
    const item = await groupedInventoryService.getItemByName(req.params.itemName);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/inventory/grouped/:itemName/history
 * Get usage history for grouped item
 */
export const getGroupedItemHistory = async (req, res) => {
  try {
    const history = await groupedInventoryService.getItemHistory(req.params.itemName);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/inventory/grouped/add
 * Add stock to grouped inventory
 */
export const addGroupedStock = async (req, res) => {
  try {
    const item = await groupedInventoryService.addStock(
      req.body.itemName,
      req.body.unitData,
      req.user._id
    );
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * POST /api/inventory/grouped/use
 * Use/consume grouped stock
 */
export const useGroupedStock = async (req, res) => {
  try {
    const { itemName, usage, jobId } = req.body;
    const result = await groupedInventoryService.useStock(
      itemName,
      usage,
      jobId,
      req.user._id
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * PUT /api/inventory/grouped/:id
 * Update grouped inventory item
 */
export const updateGroupedItem = async (req, res) => {
  try {
    const item = await groupedInventoryService.updateItem(
      req.params.id,
      req.body,
      req.user._id
    );
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * DELETE /api/inventory/grouped/:id
 * Delete grouped inventory item
 */
export const deleteGroupedItem = async (req, res) => {
  try {
    await groupedInventoryService.deleteItem(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ============================================================================
// SERIALIZED INVENTORY ENDPOINTS
// ============================================================================

/**
 * GET /api/inventory/serialized/all
 * Get all serialized inventory items
 */
export const getAllSerializedItems = async (req, res) => {
  try {
    const items = await serializedInventoryService.getAllItems(req.query);
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/inventory/serialized/:serialNumber
 * Get single serialized item by serial number
 */
export const getSerializedItemBySerial = async (req, res) => {
  try {
    const item = await serializedInventoryService.getItemBySerial(req.params.serialNumber);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/inventory/serialized/:serialNumber/history
 * Get history for serialized item
 */
export const getSerializedItemHistory = async (req, res) => {
  try {
    const history = await serializedInventoryService.getItemHistory(req.params.serialNumber);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/inventory/serialized
 * Add new serialized item
 */
export const addSerializedItem = async (req, res) => {
  try {
    const item = await serializedInventoryService.addItem(req.body, req.user._id);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * POST /api/inventory/serialized/install
 * Install/assign serialized item to job
 */
export const installSerializedItem = async (req, res) => {
  try {
    const { serialNumber, jobId, customerId } = req.body;
    const item = await serializedInventoryService.installItem(
      serialNumber,
      jobId,
      customerId,
      req.user._id
    );
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * PUT /api/inventory/serialized/:id
 * Update serialized item
 */
export const updateSerializedItem = async (req, res) => {
  try {
    const item = await serializedInventoryService.updateItem(
      req.params.id,
      req.body,
      req.user._id
    );
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * DELETE /api/inventory/serialized/:id
 * Delete serialized item
 */
export const deleteSerializedItem = async (req, res) => {
  try {
    await serializedInventoryService.deleteItem(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};