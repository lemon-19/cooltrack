import React, { useEffect, useState, useContext } from "react";
import API from "../../api/axios";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { AuthContext } from "../../context/AuthContext";
import { Commet } from "react-loading-indicators";
import { Search } from "lucide-react";

export default function Inventory() {
  const { user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    category: "",
    search: "",
  });

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditBatchModal, setShowEditBatchModal] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    unit: "",
    batchName: "",
    quantity: "",
    minThreshold: "",
  });
  const [batchForm, setBatchForm] = useState({
    batchId: "",
    batchName: "",
    quantity: "",
  });

  useEffect(() => {
    loadInventory();
  }, [filters]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const { data } = await API.get(`/inventory?${params.toString()}`);
      setItems(data);

      const uniqueCategories = [...new Set(data.map((item) => item.category))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error("Error loading inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // 🔍 Filters
  // ---------------------------
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadInventory();
  };

  // ---------------------------
  // ➕ Add Item / Batch
  // ---------------------------
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await API.post("/inventory", formData);
      setShowAddModal(false);
      setFormData({
        itemName: "",
        category: "",
        unit: "",
        batchName: "",
        quantity: "",
      });
      loadInventory();
    } catch (err) {
      console.error("Error adding item:", err);
      alert(err.response?.data?.message || "Failed to add item");
    }
  };

  // ---------------------------
  // 🧩 View / Edit / Delete
  // ---------------------------
  const openDetailsModal = (item) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const closeDetailsModal = () => {
    setSelectedItem(null);
    setModalOpen(false);
  };

  const openEditBatch = (batch) => {
    setBatchForm({
      batchId: batch._id,
      batchName: batch.batchName,
      quantity: batch.quantity,
    });
    setShowEditBatchModal(true);
  };

  const handleBatchChange = (e) => {
    setBatchForm({ ...batchForm, [e.target.name]: e.target.value });
  };

  const handleUpdateBatch = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/inventory/${selectedItem._id}/batch`, batchForm);
      setShowEditBatchModal(false);
      loadInventory();
    } catch (err) {
      console.error("Error updating batch:", err);
      alert(err.response?.data?.message || "Failed to update batch");
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm("Delete this batch?")) return;
    try {
      await API.delete(`/inventory/${selectedItem._id}/batch/${batchId}`);
      loadInventory();
    } catch (err) {
      console.error("Error deleting batch:", err);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Delete this item and all batches?")) return;
    try {
      await API.delete(`/inventory/${id}`);
      loadInventory();
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  // ---------------------------
  // 💬 UI Rendering
  // ---------------------------
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        role={user?.role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          title="Inventory Management"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center flex-wrap gap-3">
            <h1 className="text-xl font-semibold text-gray-800">Inventory</h1>

            {user?.role === "admin" && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                + Add Item
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white shadow-sm rounded-xl mb-6 p-4">
            <form
              onSubmit={handleSearchSubmit}
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by item name..."
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="border rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900"
              >
                Apply
              </button>
            </form>
          </div>

          {/* Inventory List */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Commet color="#3B82F6" size="medium" />
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((i) => (
                <div
                  key={i._id}
                  className={`p-4 rounded-xl shadow-sm hover:shadow-md transition 
          ${
            i.totalQuantity <= i.minThreshold
              ? "bg-red-50 border border-red-400 shadow-red-200"
              : "bg-white"
          }`}
                >
                  <div className="font-semibold text-gray-800">
                    {i.itemName}
                  </div>
                  <div className="text-sm text-gray-600">{i.category}</div>

                  <div className="mt-2 text-lg font-medium text-gray-700">
                    {i.totalQuantity} {i.unit}
                  </div>

                  {/* 🔴 LOW STOCK BADGE */}
                  {i.totalQuantity <= i.minThreshold && (
                    <div className="inline-block mt-2 px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full">
                      ⚠️ Low Stock
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mt-2">
                    Last updated:{" "}
                    {i.lastUpdated
                      ? new Date(i.lastUpdated).toLocaleDateString()
                      : "N/A"}
                  </div>

                  <div className="mt-3 flex justify-between items-center">
                    <button
                      onClick={() => openDetailsModal(i)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View
                    </button>
                    {user?.role === "admin" && (
                      <button
                        onClick={() => handleDeleteItem(i._id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-10">
              No inventory items found.
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {modalOpen && renderItemModal()}
      {showAddModal && renderAddItemModal()}
      {showEditBatchModal && renderEditBatchModal()}
    </div>
  );

  // ---------------------------
  // 💬 Render Helpers
  // ---------------------------

  function renderItemModal() {
    const item = selectedItem;
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
          <button
            onClick={closeDetailsModal}
            className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>

          {!item ? (
            <div className="text-center text-gray-500 py-10">
              Loading details...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-b pb-3">
                <h2 className="text-xl font-semibold text-gray-800">
                  {item.itemName}
                </h2>
                <p className="text-sm text-gray-500">{item.category}</p>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Unit:</span>
                  <p className="text-gray-600">{item.unit}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Total:</span>
                  <p className="text-gray-600">
                    {item.totalQuantity} {item.unit}
                  </p>
                </div>
              </div>

              <div className="border-t pt-3">
                <h3 className="font-medium text-gray-700 text-sm mb-2">
                  Batches
                </h3>
                {item.batches?.length > 0 ? (
                  <ul className="divide-y divide-gray-100 text-sm text-gray-600 rounded-md border border-gray-100">
                    {item.batches.map((b) => (
                      <li
                        key={b._id}
                        className="px-3 py-2 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium">{b.batchName}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(b.lastUpdated).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div>
                            {b.quantity} {item.unit}
                          </div>
                          {user?.role === "admin" && (
                            <div className="text-xs mt-1 flex gap-2 justify-end">
                              <button
                                onClick={() => openEditBatch(b)}
                                className="text-blue-600 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteBatch(b._id)}
                                className="text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No batches for this item.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderAddItemModal() {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
          <button
            onClick={() => setShowAddModal(false)}
            className="absolute top-3 right-4 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>

          <h2 className="text-lg font-semibold mb-4">Add New Item</h2>

          <form onSubmit={handleAddItem} className="space-y-4">
            <input
              type="text"
              name="itemName"
              value={formData.itemName}
              onChange={handleFormChange}
              placeholder="Item Name"
              className="border w-full px-3 py-2 rounded-lg text-sm"
              required
            />
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleFormChange}
              placeholder="Category"
              className="border w-full px-3 py-2 rounded-lg text-sm"
              required
            />
            <input
              type="text"
              name="unit"
              value={formData.unit}
              onChange={handleFormChange}
              placeholder="Unit (e.g., pcs, roll)"
              className="border w-full px-3 py-2 rounded-lg text-sm"
              required
            />
            <input
              type="text"
              name="batchName"
              value={formData.batchName}
              onChange={handleFormChange}
              placeholder="Batch Name"
              className="border w-full px-3 py-2 rounded-lg text-sm"
              required
            />
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleFormChange}
              placeholder="Quantity"
              className="border w-full px-3 py-2 rounded-lg text-sm"
              required
            />
            <input
              type="number"
              name="minThreshold"
              value={formData.minThreshold}
              onChange={handleFormChange}
              placeholder="Min Threshold (Low Stock Alert)"
              className="border w-full px-3 py-2 rounded-lg text-sm"
              required
            />

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Add Item
            </button>
          </form>
        </div>
      </div>
    );
  }

  function renderEditBatchModal() {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
          <button
            onClick={() => setShowEditBatchModal(false)}
            className="absolute top-3 right-4 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>

          <h2 className="text-lg font-semibold mb-4">Edit Batch</h2>

          <form onSubmit={handleUpdateBatch} className="space-y-4">
            <input
              type="text"
              name="batchName"
              value={batchForm.batchName}
              onChange={handleBatchChange}
              placeholder="Batch Name"
              className="border w-full px-3 py-2 rounded-lg text-sm"
              required
            />
            <input
              type="number"
              name="quantity"
              value={batchForm.quantity}
              onChange={handleBatchChange}
              placeholder="Quantity"
              className="border w-full px-3 py-2 rounded-lg text-sm"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Update Batch
            </button>
          </form>
        </div>
      </div>
    );
  }
}
