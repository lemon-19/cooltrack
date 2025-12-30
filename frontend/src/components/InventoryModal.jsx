// components/InventoryModal.jsx
import { useState, useEffect } from "react";
import { X, Hash, Layers } from "lucide-react";
import {
  addSerializedItem,
  addGroupedItem,
  updateSerializedItem,
  updateGroupedItem,
} from "../api/inventory";

const InventoryModal = ({ mode, itemData, itemType, onClose, onSuccess }) => {
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isSerialized = itemType === "serialized";

  const [formData, setFormData] = useState({
    itemName: "",
    brand: "",
    model: "",
    category: "",
    supplier: "",
    purchaseDate: "",
    purchasePrice: "",
    salePrice: "",
    notes: "",
    serialNumber: "",
    status: "available",
    specifications: { capacity: "", voltage: "", refrigerant: "", other: "" },
    warrantyExpiry: "",
    currentQuantity: "",
    minimumQuantity: "",
    unit: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (itemData) {
      setFormData({
        itemName: itemData.itemName || "",
        brand: itemData.brand || "",
        model: itemData.model || "",
        category: itemData.category || "",
        supplier: itemData.supplier || "",
        purchaseDate: itemData.purchaseDate
          ? itemData.purchaseDate.split("T")[0]
          : "",
        purchasePrice: itemData.purchasePrice || "",
        salePrice: itemData.salePrice || "",
        notes: itemData.notes || "",
        serialNumber: itemData.serialNumber || "",
        status: itemData.status || "available",
        specifications: {
          capacity: itemData.specifications?.capacity || "",
          voltage: itemData.specifications?.voltage || "",
          refrigerant: itemData.specifications?.refrigerant || "",
          other: itemData.specifications?.other || "",
        },
        warrantyExpiry: itemData.warrantyExpiry
          ? itemData.warrantyExpiry.split("T")[0]
          : "",
        currentQuantity: itemData.currentQuantity || "",
        minimumQuantity: itemData.minimumQuantity || "",
        unit: itemData.unit || "",
      });
    }
  }, [itemData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("specifications.")) {
      const specField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        specifications: { ...prev.specifications, [specField]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.itemName?.trim()) newErrors.itemName = "Item name is required";
    if (!formData.category?.trim()) newErrors.category = "Category is required";
    if (!formData.brand?.trim()) newErrors.brand = "Brand is required";

    if (isSerialized) {
      if (!formData.serialNumber?.trim())
        newErrors.serialNumber = "Serial number is required";
      if (!formData.model?.trim()) newErrors.model = "Model is required";
      const purchase = parseFloat(formData.purchasePrice);
      const sale = parseFloat(formData.salePrice);
      if (!purchase || purchase <= 0)
        newErrors.purchasePrice = "Purchase price must be greater than 0";
      if (!sale || sale <= 0)
        newErrors.salePrice = "Sale price must be greater than 0";
    } else {
      if (!formData.unit?.trim()) newErrors.unit = "Unit is required";
      const quantity = parseInt(formData.currentQuantity);
      const minimum = parseInt(formData.minimumQuantity);
      if (isNaN(quantity) || quantity < 0)
        newErrors.currentQuantity = "Valid quantity is required";
      if (isNaN(minimum) || minimum < 0)
        newErrors.minimumQuantity = "Valid minimum quantity is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewMode) return onClose();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = { ...formData };

      if (isSerialized) {
        payload.purchasePrice = parseFloat(payload.purchasePrice) || 0;
        payload.salePrice = parseFloat(payload.salePrice) || 0;
        payload.model = payload.model?.trim() || "";
        payload.serialNumber = payload.serialNumber?.trim() || "";
        payload.specifications = payload.specifications || {};
        payload.status = payload.status || "available";

        delete payload.currentQuantity;
        delete payload.minimumQuantity;
        delete payload.unit;
      } else {
        payload.currentQuantity = parseInt(payload.currentQuantity) || 0;
        payload.minimumQuantity = parseInt(payload.minimumQuantity) || 0;
        payload.purchasePrice = parseFloat(payload.purchasePrice || 0);
        payload.salePrice = parseFloat(payload.salePrice || 0);

        delete payload.serialNumber;
        delete payload.status;
        delete payload.specifications;
      }

      if (isEditMode) {
        if (isSerialized) await updateSerializedItem(itemData._id, payload);
        else await updateGroupedItem(itemData._id, payload);
      } else {
        if (isSerialized) await addSerializedItem(payload);
        else await addGroupedItem(payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save item:", error);
      alert(error.response?.data?.message || error.message || "Failed to save item");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {isSerialized ? (
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Hash className="w-5 h-5 text-blue-600" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-purple-600" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isViewMode
                  ? "View Item"
                  : isEditMode
                  ? "Edit Item"
                  : `Add ${isSerialized ? "Serialized" : "Grouped"} Item`}
              </h2>
              <p className="text-sm text-gray-600">
                {isSerialized ? "Unique serialized item" : "Grouped materials"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Common Fields */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Item Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    errors.itemName ? "border-red-500" : "border-gray-300"
                  } ${isViewMode ? "bg-gray-50" : ""}`}
                  placeholder="Enter item name"
                />
                {errors.itemName && (
                  <p className="text-xs text-red-500 mt-1">{errors.itemName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Enter brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model{" "}
                  {isSerialized && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    errors.model ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., RAS-13BKCV"
                />
                {errors.model && (
                  <p className="text-xs text-red-500 mt-1">{errors.model}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    errors.category ? "border-red-500" : "border-gray-300"
                  } ${isViewMode ? "bg-gray-50" : ""}`}
                >
                  <option value="">Select category</option>
                  {isSerialized ? (
                    <>
                      <option value="aircon">Air Conditioner</option>
                      <option value="compressor">Compressor</option>
                      <option value="motor">Motor</option>
                      <option value="other">Other</option>
                    </>
                  ) : (
                    <>
                      <option value="copper_tube">Copper Tube</option>
                      <option value="cable">Cable</option>
                      <option value="screw">Screw</option>
                      <option value="bolt">Bolt</option>
                      <option value="insulation">Insulation</option>
                      <option value="refrigerant">Refrigerant</option>
                      <option value="other">Other</option>
                    </>
                  )}
                </select>
                {errors.category && (
                  <p className="text-xs text-red-500 mt-1">{errors.category}</p>
                )}
              </div>
            </div>
          </div>

          {/* Serialized or Grouped Fields */}
          {isSerialized ? (
            <>
              {/* Serialized Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Serialization Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Serial Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="serialNumber"
                      value={formData.serialNumber}
                      onChange={handleChange}
                      disabled={isViewMode || isEditMode}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                        errors.serialNumber
                          ? "border-red-500"
                          : "border-gray-300"
                      } ${isViewMode || isEditMode ? "bg-gray-50" : ""}`}
                      placeholder="Enter serial number"
                    />
                    {errors.serialNumber && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.serialNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="available">Available</option>
                      <option value="installed">Installed</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="retired">Retired</option>
                    </select>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-gray-900 mb-3 mt-4">
                  Specifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity
                    </label>
                    <input
                      type="text"
                      name="specifications.capacity"
                      value={formData.specifications.capacity}
                      onChange={handleChange}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="e.g., 1.5HP"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Voltage
                    </label>
                    <input
                      type="text"
                      name="specifications.voltage"
                      value={formData.specifications.voltage}
                      onChange={handleChange}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="e.g., 220V"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Refrigerant
                    </label>
                    <input
                      type="text"
                      name="specifications.refrigerant"
                      value={formData.specifications.refrigerant}
                      onChange={handleChange}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="e.g., R32, R410A"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Other Specs
                    </label>
                    <input
                      type="text"
                      name="specifications.other"
                      value={formData.specifications.other}
                      onChange={handleChange}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Other specifications"
                    />
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-gray-900 mb-3 mt-4">
                  Pricing & Warranty
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="purchasePrice"
                      value={formData.purchasePrice}
                      onChange={handleChange}
                      disabled={isViewMode}
                      min="0"
                      step="0.01"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                        errors.purchasePrice
                          ? "border-red-500"  
                          : "border-gray-300"
                      }`}
                    />
                    {errors.purchasePrice && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.purchasePrice}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sale Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="salePrice"
                      value={formData.salePrice}
                      onChange={handleChange}
                      disabled={isViewMode}
                      min="0"
                      step="0.01"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                        errors.salePrice ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.salePrice && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.salePrice}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Warranty Expiry
                    </label>
                    <input
                      type="date"
                      name="warrantyExpiry"
                      value={formData.warrantyExpiry}
                      onChange={handleChange}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Grouped Item Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Quantity Management
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="currentQuantity"
                      value={formData.currentQuantity}
                      onChange={handleChange}
                      disabled={isViewMode}
                      min="0"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                        errors.currentQuantity
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.currentQuantity && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.currentQuantity}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="minimumQuantity"
                      value={formData.minimumQuantity}
                      onChange={handleChange}
                      disabled={isViewMode}
                      min="0"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                        errors.minimumQuantity
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.minimumQuantity && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.minimumQuantity}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                        errors.unit ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select unit</option>
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="meter">Meter (m)</option>
                      <option value="roll">Roll</option>
                      <option value="kg">Kilogram (kg)</option>
                      <option value="liter">Liter (L)</option>
                    </select>
                    {errors.unit && (
                      <p className="text-xs text-red-500 mt-1">{errors.unit}</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Purchase Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Purchase Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Supplier name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={isViewMode}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="Additional notes or comments..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {isViewMode ? "Close" : "Cancel"}
            </button>
            {!isViewMode && (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Saving..."
                  : isEditMode
                  ? "Update Item"
                  : "Add Item"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryModal;
