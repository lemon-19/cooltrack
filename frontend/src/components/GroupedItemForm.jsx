// components/GroupedItemForm.jsx
import { useState, useEffect } from "react";
import { X, Package, AlertCircle } from "lucide-react";

const GroupedItemForm = ({ item = null, onSubmit, onClose, loading = false }) => {
  const isEditing = !!item;
  
  const [formData, setFormData] = useState({
    itemName: "",
    brand: "",
    category: "other",
    unit: "pcs",
    currentQuantity: "",
    minimumQuantity: "",
    supplier: "",
    purchasePrice: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    location: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});

  // Unit type configurations
  const unitTypes = [
    { value: "pcs", label: "Pieces (pcs)", isLength: false },
    { value: "meter", label: "Meters (m)", isLength: true },
    { value: "roll", label: "Rolls", isLength: true },
    { value: "kg", label: "Kilograms (kg)", isLength: false },
    { value: "liter", label: "Liters (L)", isLength: false },
  ];

  const categories = [
    { value: "copper_tube", label: "Copper Tube" },
    { value: "cable", label: "Cable" },
    { value: "screw", label: "Screw" },
    { value: "bolt", label: "Bolt" },
    { value: "insulation", label: "Insulation" },
    { value: "refrigerant", label: "Refrigerant" },
    { value: "other", label: "Other" },
  ];

  useEffect(() => {
    if (item) {
      // Determine current value based on unit type
      let currentValue = 0;
      if (item.totalValue !== undefined) {
        currentValue = item.totalValue;
      } else if (item.unit === 'meter' || item.unit === 'roll') {
        currentValue = item.currentLength || item.totalLength || 0;
      } else {
        currentValue = item.currentQuantity || item.totalQuantity || 0;
      }

      setFormData({
        itemName: item.itemName || "",
        brand: item.brand || "",
        category: item.category || "other",
        unit: item.unit || "pcs",
        currentQuantity: currentValue.toString(),
        minimumQuantity: (item.minValue || item.minimumQuantity || item.minQuantity || 0).toString(),
        supplier: item.supplier || "",
        purchasePrice: (item.purchasePrice || 0).toString(),
        purchaseDate: item.purchaseDate
          ? new Date(item.purchaseDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        location: item.location || "",
        notes: item.notes || "",
      });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.itemName.trim()) {
      newErrors.itemName = "Item name is required";
    }

    if (!formData.unit) {
      newErrors.unit = "Unit type is required";
    }

    const quantity = parseFloat(formData.currentQuantity);
    if (!formData.currentQuantity || isNaN(quantity) || quantity <= 0) {
      newErrors.currentQuantity = "Valid quantity is required (must be greater than 0)";
    }

    const price = parseFloat(formData.purchasePrice);
    if (formData.purchasePrice && (isNaN(price) || price < 0)) {
      newErrors.purchasePrice = "Price must be a valid number (0 or greater)";
    }

    const minQty = parseFloat(formData.minimumQuantity);
    if (formData.minimumQuantity && (isNaN(minQty) || minQty < 0)) {
      newErrors.minimumQuantity = "Minimum quantity must be a valid number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
      setErrors({ submit: error.message || "Failed to save item" });
    }
  };

  const isLengthBased = formData.unit === 'meter' || formData.unit === 'roll';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? "Edit Item" : "Add New Item"}
              </h2>
              <p className="text-sm text-gray-600">
                {isEditing ? "Update item details" : "Add a new item to inventory"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Alert */}
          {errors.submit && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            </div>
          )}

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Item Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                disabled={loading}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.itemName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., Copper Tube 1/4 inch"
              />
              {errors.itemName && (
                <p className="text-xs text-red-600 mt-1">{errors.itemName}</p>
              )}
            </div>

            {/* Brand and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Mueller"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Unit Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Type <span className="text-red-500">*</span>
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                disabled={loading || isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                {unitTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {isEditing && (
                <p className="text-xs text-gray-500 mt-1">
                  Unit type cannot be changed after creation
                </p>
              )}
            </div>

            {/* Quantity and Minimum */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isLengthBased ? "Length" : "Quantity"} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="currentQuantity"
                    value={formData.currentQuantity}
                    onChange={handleChange}
                    disabled={loading}
                    step="0.01"
                    min="0.01"
                    className={`w-full px-3 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.currentQuantity ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder={isLengthBased ? "150" : "100"}
                  />
                  <span className="absolute right-3 top-2 text-sm text-gray-500">
                    {formData.unit}
                  </span>
                </div>
                {errors.currentQuantity && (
                  <p className="text-xs text-red-600 mt-1">{errors.currentQuantity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum {isLengthBased ? "Length" : "Quantity"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="minimumQuantity"
                    value={formData.minimumQuantity}
                    onChange={handleChange}
                    disabled={loading}
                    step="0.01"
                    min="0"
                    className={`w-full px-3 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.minimumQuantity ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder={isLengthBased ? "50" : "20"}
                  />
                  <span className="absolute right-3 top-2 text-sm text-gray-500">
                    {formData.unit}
                  </span>
                </div>
                {errors.minimumQuantity && (
                  <p className="text-xs text-red-600 mt-1">{errors.minimumQuantity}</p>
                )}
              </div>
            </div>

            {/* Supplier and Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., ABC Supplies"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Warehouse A, Shelf 3"
                />
              </div>
            </div>

            {/* Purchase Price and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Price (per {formData.unit})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">₱</span>
                  <input
                    type="number"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    disabled={loading}
                    step="0.01"
                    min="0"
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.purchasePrice ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {errors.purchasePrice && (
                  <p className="text-xs text-red-600 mt-1">{errors.purchasePrice}</p>
                )}
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
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
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
                disabled={loading}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Additional notes or specifications..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? "Update Item" : "Add Item"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupedItemForm;