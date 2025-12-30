// pages/InventoryPage.jsx - Updated with GroupedItemForm
import { useEffect, useState } from "react";
import {
  Package,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Hash,
  Layers,
  AlertCircle,
  Filter,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  getSerializedInventory,
  getGroupedInventory,
  deleteSerializedItem,
  deleteGroupedItem,
  addGroupedItem,
  updateGroupedItem,
} from "../../api/inventory";
import InventoryModal from "../../components/InventoryModal";
import GroupedItemModal from "../../components/GroupedItemModal";
import GroupedItemForm from "../../components/GroupedItemForm";

const statusColors = {
  available: "bg-green-100 text-green-700",
  in_use: "bg-blue-100 text-blue-700",
  maintenance: "bg-yellow-100 text-yellow-700",
  retired: "bg-gray-100 text-gray-700",
  in_stock: "bg-green-100 text-green-700",
};

const InventoryPage = () => {
  const [activeTab, setActiveTab] = useState("serialized"); // "serialized" | "grouped"
  const [serializedItems, setSerializedItems] = useState([]);
  const [groupedItems, setGroupedItems] = useState([]);
  const [filteredSerialized, setFilteredSerialized] = useState([]);
  const [filteredGrouped, setFilteredGrouped] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteType, setDeleteType] = useState(null);

  const [modalMode, setModalMode] = useState(null); // "add" | "edit" | "view"
  const [selectedItem, setSelectedItem] = useState(null);
  const [showGroupedModal, setShowGroupedModal] = useState(false);
  const [selectedGroupedItem, setSelectedGroupedItem] = useState(null);
  
  // New state for grouped item form
  const [showGroupedForm, setShowGroupedForm] = useState(false);
  const [editingGroupedItem, setEditingGroupedItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [serializedCategories, setSerializedCategories] = useState([]);
  const [groupedCategories, setGroupedCategories] = useState([]);
  const [stats, setStats] = useState({
    totalSerialized: 0,
    totalGrouped: 0,
    lowStock: 0,
    inUse: 0,
  });

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    filterData();
  }, [search, statusFilter, categoryFilter, serializedItems, groupedItems, activeTab]);

  // Reset category filter when switching tabs
  useEffect(() => {
    setCategoryFilter("all");
  }, [activeTab]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const [serialized, grouped] = await Promise.all([
        getSerializedInventory(),
        getGroupedInventory(),
      ]);

      setSerializedItems(serialized.items || []);
      setGroupedItems(grouped.items || []);

      // Extract unique categories for each type separately
      const serializedCats = [
        ...new Set((serialized.items || []).map((item) => item.category).filter(Boolean))
      ];
      const groupedCats = [
        ...new Set((grouped.items || []).map((item) => item.category).filter(Boolean))
      ];
      
      setSerializedCategories(["all", ...serializedCats]);
      setGroupedCategories(["all", ...groupedCats]);

      // Calculate stats with proper value handling
      const lowStockItems = (grouped.items || []).filter((item) => {
        const currentValue = item.totalValue || item.currentQuantity || 0;
        const minValue = item.minValue || item.minimumQuantity || 0;
        return currentValue <= minValue;
      }).length;

      const inUseItems = (serialized.items || []).filter(
        (item) => item.status === "in_use"
      ).length;

      setStats({
        totalSerialized: serialized.items?.length || 0,
        totalGrouped: grouped.items?.length || 0,
        lowStock: lowStockItems,
        inUse: inUseItems,
      });
    } catch (error) {
      console.error("Failed to load inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    if (activeTab === "serialized") {
      let result = [...serializedItems];

      if (search) {
        result = result.filter(
          (item) =>
            item.serialNumber?.toLowerCase().includes(search.toLowerCase()) ||
            item.itemName?.toLowerCase().includes(search.toLowerCase()) ||
            item.brand?.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (statusFilter !== "all") {
        result = result.filter((item) => {
          const normalizedStatus =
            item.status === "in_stock" ? "available" : item.status;
          return normalizedStatus === statusFilter;
        });
      }

      if (categoryFilter !== "all") {
        result = result.filter((item) => item.category === categoryFilter);
      }

      setFilteredSerialized(result);
    } else {
      let result = [...groupedItems];
      if (search) {
        result = result.filter(
          (item) =>
            item.itemName?.toLowerCase().includes(search.toLowerCase()) ||
            item.brand?.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (categoryFilter !== "all") {
        result = result.filter((item) => item.category === categoryFilter);
      }
      setFilteredGrouped(result);
    }
  };

  const handleDelete = async () => {
    try {
      if (deleteType === "serialized") {
        await deleteSerializedItem(deleteId);
        setSerializedItems(serializedItems.filter((item) => item._id !== deleteId));
      } else {
        await deleteGroupedItem(deleteId);
        setGroupedItems(groupedItems.filter((item) => item._id !== deleteId));
      }
      setDeleteId(null);
      setDeleteType(null);
      loadInventory(); // Refresh stats
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete item");
    }
  };

  // Handle grouped item form submission
  const handleGroupedFormSubmit = async (formData) => {
    try {
      setFormLoading(true);
      
      if (editingGroupedItem) {
        // Update existing item
        await updateGroupedItem(editingGroupedItem._id, formData);
      } else {
        // Add new item
        await addGroupedItem(formData);
      }
      
      // Close form and refresh
      setShowGroupedForm(false);
      setEditingGroupedItem(null);
      await loadInventory();
    } catch (error) {
      console.error("Failed to save grouped item:", error);
      throw error; // Let the form handle the error display
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Add button click
  const handleAddClick = () => {
    if (activeTab === "grouped") {
      setEditingGroupedItem(null);
      setShowGroupedForm(true);
    } else {
      setSelectedItem(null);
      setModalMode("add");
    }
  };

  // Handle Edit button click for grouped items
  const handleEditGroupedClick = (item) => {
    setEditingGroupedItem(item);
    setShowGroupedForm(true);
  };

  // Get display value for grouped items
  const getGroupedDisplayValue = (item) => {
    const value = item.totalValue || item.currentQuantity || 0;
    return value;
  };

  const getGroupedMinValue = (item) => {
    return item.minValue || item.minimumQuantity || 0;
  };

  const isLowStock = (item) => {
    const current = getGroupedDisplayValue(item);
    const min = getGroupedMinValue(item);
    return current <= min;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  const currentItems = activeTab === "serialized" ? filteredSerialized : filteredGrouped;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-gray-600 mt-1 text-sm">
            Track serialized items and grouped materials
          </p>
        </div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 w-full sm:w-auto justify-center"
          onClick={handleAddClick}
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Hash className="w-4 h-4" />
            <p className="text-sm">Serialized</p>
          </div>
          <h3 className="text-2xl font-bold">{stats.totalSerialized}</h3>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Layers className="w-4 h-4" />
            <p className="text-sm">Grouped</p>
          </div>
          <h3 className="text-2xl font-bold">{stats.totalGrouped}</h3>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <TrendingDown className="w-4 h-4" />
            <p className="text-sm">Low Stock</p>
          </div>
          <h3 className="text-2xl font-bold text-red-600">{stats.lowStock}</h3>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <p className="text-sm">In Use</p>
          </div>
          <h3 className="text-2xl font-bold text-blue-600">{stats.inUse}</h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-1 flex gap-1">
        <button
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === "serialized"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
          onClick={() => setActiveTab("serialized")}
        >
          <Hash className="w-4 h-4" />
          <span className="hidden sm:inline">Serialized Items</span>
          <span className="sm:hidden">Serialized</span>
        </button>
        <button
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === "grouped"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
          onClick={() => setActiveTab("grouped")}
        >
          <Layers className="w-4 h-4" />
          <span className="hidden sm:inline">Grouped Materials</span>
          <span className="sm:hidden">Grouped</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              placeholder="Search items..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {activeTab === "serialized" && (
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-4 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="in_use">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
          )}

          <div className={activeTab === "serialized" ? "" : "md:col-start-2"}>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {(activeTab === "serialized" ? serializedCategories : groupedCategories).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat.replace('_', ' ').charAt(0).toUpperCase() + cat.replace('_', ' ').slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-4">
          Showing {currentItems.length} items
        </p>
      </div>

      {/* Serialized Items Table - Desktop */}
      {activeTab === "serialized" && (
        <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden">
          {filteredSerialized.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No serialized items found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Serial Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Item Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSerialized.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{item.serialNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{item.itemName}</p>
                        <p className="text-sm text-gray-500">{item.brand || "—"}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {item.category || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            statusColors[item.status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.status === "in_stock" ? "Available" : item.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                            onClick={() => {
                              setSelectedItem(item);
                              setModalMode("view");
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedItem(item);
                              setModalMode("edit");
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setDeleteId(item._id);
                              setDeleteType("serialized");
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Grouped Items Table - Desktop */}
      {activeTab === "grouped" && (
        <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden">
          {filteredGrouped.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No grouped items found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Item Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                      Minimum
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGrouped.map((item) => {
                    const lowStock = isLowStock(item);
                    const currentValue = getGroupedDisplayValue(item);
                    const minValue = getGroupedMinValue(item);
                    
                    return (
                      <tr
                        key={item._id}
                        className={`hover:bg-gray-50 transition-colors ${
                          lowStock ? "bg-red-50" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{item.itemName}</p>
                          <p className="text-sm text-gray-500">{item.brand || "—"}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                          {item.category?.replace('_', ' ') || "—"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`font-bold ${
                              lowStock ? "text-red-600" : "text-gray-900"
                            }`}
                          >
                            {currentValue}
                          </span>
                          <span className="text-sm text-gray-500 ml-1 uppercase">
                            {item.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-700">
                          {minValue} <span className="uppercase">{item.unit}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                              onClick={() => {
                                setSelectedGroupedItem(item);
                                setShowGroupedModal(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                              onClick={() => handleEditGroupedClick(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setDeleteId(item._id);
                                setDeleteType("grouped");
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {currentItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No items found</p>
          </div>
        ) : activeTab === "serialized" ? (
          filteredSerialized.map((item) => (
            <div key={item._id} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Serial Number</p>
                <p className="font-medium text-gray-900">{item.serialNumber}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Item Details</p>
                <p className="font-medium text-gray-900">{item.itemName}</p>
                <p className="text-sm text-gray-600">{item.brand || "—"}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Category</p>
                  <p className="text-sm text-gray-900">{item.category || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      statusColors[item.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {item.status?.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Actions</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-700 bg-gray-50 hover:bg-gray-100"
                    onClick={() => {
                      setSelectedItem(item);
                      setModalMode("view");
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-medium">View</span>
                  </button>
                  <button
                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100"
                    onClick={() => {
                      setSelectedItem(item);
                      setModalMode("edit");
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-xs font-medium">Edit</span>
                  </button>
                  <button
                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100"
                    onClick={() => {
                      setDeleteId(item._id);
                      setDeleteType("serialized");
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-xs font-medium">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          filteredGrouped.map((item) => {
            const lowStock = isLowStock(item);
            const currentValue = getGroupedDisplayValue(item);
            const minValue = getGroupedMinValue(item);
            
            return (
              <div
                key={item._id}
                className={`bg-white rounded-xl shadow-sm p-4 space-y-3 ${
                  lowStock ? "border-2 border-red-300" : ""
                }`}
              >
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Item Details</p>
                  <p className="font-medium text-gray-900">{item.itemName}</p>
                  <p className="text-sm text-gray-600">{item.brand || "—"}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Category</p>
                    <p className="text-sm text-gray-900 capitalize">
                      {item.category?.replace('_', ' ') || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Stock</p>
                    <p
                      className={`text-lg font-bold ${
                        lowStock ? "text-red-600" : "text-gray-900"
                      }`}
                    >
                      {currentValue} <span className="uppercase text-sm">{item.unit}</span>
                    </p>
                    <p className="text-xs text-gray-500">Min: {minValue}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-2">Actions</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-700 bg-gray-50 hover:bg-gray-100"
                      onClick={() => {
                        setSelectedGroupedItem(item);
                        setShowGroupedModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-xs font-medium">View</span>
                    </button>
                    <button
                      className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100"
                      onClick={() => handleEditGroupedClick(item)}
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-xs font-medium">Edit</span>
                    </button>
                    <button
                      className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100"
                      onClick={() => {
                        setDeleteId(item._id);
                        setDeleteType("grouped");
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-xs font-medium">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Item</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to delete this item? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setDeleteId(null);
                      setDeleteType(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Serialized Item Add/Edit Modal */}
      {modalMode && activeTab === "serialized" && (
        <InventoryModal
          mode={modalMode}
          itemData={selectedItem}
          itemType="serialized"
          onClose={() => {
            setModalMode(null);
            setSelectedItem(null);
          }}
          onSuccess={loadInventory}
        />
      )}

      {/* Grouped Item Add/Edit Form */}
      {showGroupedForm && (
        <GroupedItemForm
          item={editingGroupedItem}
          onSubmit={handleGroupedFormSubmit}
          onClose={() => {
            setShowGroupedForm(false);
            setEditingGroupedItem(null);
          }}
          loading={formLoading}
        />
      )}

      {/* Grouped Item Details Modal */}
      {showGroupedModal && selectedGroupedItem && (
        <GroupedItemModal
          item={selectedGroupedItem}
          onClose={() => {
            setShowGroupedModal(false);
            setSelectedGroupedItem(null);
          }}
        />
      )}
    </div>
  );
};

export default InventoryPage;