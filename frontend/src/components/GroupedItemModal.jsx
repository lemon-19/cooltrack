// components/GroupedItemModal.jsx
import { useState, useEffect } from "react";
import {
  X,
  Package,
  TrendingDown,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Info,
  Clock,
  User,
  FileText,
} from "lucide-react";
import { getGroupedItemHistory } from "../api/inventory";

const GroupedItemModal = ({ item, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details"); // "details" | "history"

  useEffect(() => {
    loadHistory();
  }, [item]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getGroupedItemHistory(item.itemName);
      setHistory(data.history || []);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get current value based on unit type
  const getCurrentValue = () => {
    if (item.totalValue !== undefined) {
      return item.totalValue;
    }
    // Fallback to old structure
    if (item.unit === 'meter' || item.unit === 'roll') {
      return item.currentLength || item.totalLength || 0;
    }
    return item.currentQuantity || item.totalQuantity || 0;
  };

  const getMinValue = () => {
    // Try all possible field names in order of preference
    return item.minValue || 
           item.minimumQuantity || 
           item.minQuantity || 
           item.minLength || 
           0;
  };

  const currentValue = getCurrentValue();
  const minValue = getMinValue();
  const isLowStock = currentValue <= minValue;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return String(dateString);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "added":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "removed":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case "adjusted":
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "added":
        return "bg-green-50 text-green-700 border-green-200";
      case "removed":
        return "bg-red-50 text-red-700 border-red-200";
      case "adjusted":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // Format value change for history
  const formatValueChange = (record) => {
    const unit = record.unit || item.unit;
    
    // Use the appropriate change value
    let change = 0;
    if (unit === 'meter' || unit === 'roll') {
      change = record.lengthChange || 0;
    } else {
      change = record.quantityChange || 0;
    }

    // If we have valueChange, use that instead
    if (record.valueChange !== undefined) {
      change = record.valueChange;
    }

    return {
      change,
      unit,
      display: `${change > 0 ? '+' : ''}${change} ${unit}`
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">{item.itemName}</h2>
              <p className="text-sm text-gray-600">{item.brand || "No brand specified"}</p>
              {isLowStock && (
                <div className="flex items-center gap-1.5 mt-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Low Stock Alert</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            className={`px-4 py-3 font-medium transition-colors relative ${
              activeTab === "details"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button
            className={`px-4 py-3 font-medium transition-colors relative ${
              activeTab === "history"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab("history")}
          >
            History
            {history.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs">
                {history.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === "details" ? (
            <div className="space-y-6">
              {/* Stock Status */}
              <div
                className={`p-4 rounded-lg border-2 ${
                  isLowStock
                    ? "bg-red-50 border-red-200"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Current Stock</span>
                  <span
                    className={`text-2xl font-bold ${
                      isLowStock ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {currentValue} {item.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Minimum Required</span>
                  <span className="font-medium text-gray-900">
                    {minValue} {item.unit}
                  </span>
                </div>
                <div className="mt-3 h-2 bg-white rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isLowStock ? "bg-red-500" : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        minValue > 0 ? (currentValue / minValue) * 100 : 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Item Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Item Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">
                      Category
                    </p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {item.category?.replace('_', ' ') || "—"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">Unit</p>
                    <p className="text-sm font-medium text-gray-900 uppercase">{item.unit}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">
                      Location
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {item.location || "—"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">
                      Supplier
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {item.supplier || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Units Breakdown (if available) */}
              {item.units && item.units.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Stock Units ({item.units.filter(u => u.isActive).length} active)
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {item.units
                      .filter(u => u.isActive)
                      .map((unit, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg text-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">
                                {unit.value || unit.quantity || unit.length || 0} {item.unit}
                              </p>
                              {unit.brand && (
                                <p className="text-xs text-gray-600">Brand: {unit.brand}</p>
                              )}
                              {unit.supplier && (
                                <p className="text-xs text-gray-600">Supplier: {unit.supplier}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {formatDate(unit.purchaseDate)}
                              </p>
                              <p className="text-xs font-medium text-gray-700">
                                ₱{(unit.purchasePrice || 0).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Purchase Information */}
              {(item.purchaseDate || item.purchasePrice) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Purchase Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.purchaseDate && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <p className="text-xs text-gray-500 uppercase font-medium">
                            Purchase Date
                          </p>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(item.purchaseDate)}
                        </p>
                      </div>
                    )}
                    {item.purchasePrice !== undefined && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase font-medium mb-1">
                          Average Purchase Price
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          ₱{item.purchasePrice.toFixed(2)} per {item.unit}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {item.notes && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-900">Notes</h3>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {item.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-blue-600" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No history records found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((record, index) => {
                    const valueInfo = formatValueChange(record);
                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${getActionColor(record.action)}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 mt-0.5">
                            {getActionIcon(record.action)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-medium text-gray-900 capitalize">
                                {record.action}
                              </p>
                              <span className="text-xs text-gray-600 whitespace-nowrap">
                                {formatDateTime(record.timestamp)}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <p className="text-gray-700">
                                <span className="font-medium">Change:</span>{" "}
                                {valueInfo.display}
                              </p>
                              {record.performedBy && (
                                <div className="flex items-center gap-1.5 text-gray-600 mt-2">
                                  <User className="w-3.5 h-3.5" />
                                  <span>{record.performedBy}</span>
                                </div>
                              )}
                              {record.jobReference && (
                                <p className="text-gray-600">
                                  <span className="font-medium">Job:</span>{" "}
                                  {record.jobReference}
                                </p>
                              )}
                              {record.reason && (
                                <p className="text-gray-600">
                                  <span className="font-medium">Reason:</span> {record.reason}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupedItemModal;