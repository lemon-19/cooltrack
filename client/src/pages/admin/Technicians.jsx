import React, { useEffect, useState, useContext } from "react";
import API from "../../api/axios";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { AuthContext } from "../../context/AuthContext";
import { Commet } from "react-loading-indicators";
import { Search } from "lucide-react";

export default function Technicians() {
  const { user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTech, setSelectedTech] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "technician",
  });

  const [filters, setFilters] = useState({ search: "" });

  useEffect(() => {
    fetchTechnicians();
  }, [filters]);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/users/technicians");
      const search = filters.search.trim().toLowerCase();

      const filtered = search
        ? data.filter(
            (t) =>
              t.name.toLowerCase().includes(search) ||
              t.email.toLowerCase().includes(search)
          )
        : data;

      setTechs(filtered);
    } catch (err) {
      console.error("Failed to load technicians:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTechnicians();
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddTechnician = async (e) => {
    e.preventDefault();
    try {
      await API.post("/users", formData);
      setShowAddModal(false);
      setFormData({ name: "", email: "", password: "", role: "technician" });
      fetchTechnicians();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add technician");
    }
  };

  const handleEditTechnician = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/users/${selectedTech._id}`, formData);
      setShowEditModal(false);
      setSelectedTech(null);
      fetchTechnicians();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update technician");
    }
  };

  const handleDeleteTechnician = async (id) => {
    if (!window.confirm("Delete this technician?")) return;
    try {
      await API.delete(`/users/${id}`);
      fetchTechnicians();
    } catch (err) {
      alert("Failed to delete technician");
    }
  };

  const openEditModal = (tech) => {
    setSelectedTech(tech);
    setFormData({
      name: tech.name,
      email: tech.email,
      password: "",
      role: tech.role,
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        role={user?.role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          title="Technician Management"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center flex-wrap gap-3">
            <h1 className="text-xl font-semibold text-gray-800">
              Technicians
            </h1>
            {user?.role === "admin" && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                + Add Technician
              </button>
            )}
          </div>

          {/* Search */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white shadow-sm p-4 rounded-xl mb-6 flex flex-wrap gap-3 items-center sticky top-0 z-10"
          >
            <div className="flex items-center border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]">
              <Search size={16} className="text-gray-400 mr-2" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by name or email..."
                className="outline-none flex-1"
              />
            </div>

            <button
              type="submit"
              className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900 w-full sm:w-auto"
            >
              Apply
            </button>
          </form>

          {/* Technician List */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Commet color="#3B82F6" size="medium" />
            </div>
          ) : techs.length > 0 ? (
            <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2">
              {techs.map((t) => (
                <div
                  key={t._id}
                  className="p-4 bg-white rounded-xl shadow-sm flex justify-between items-center hover:shadow-md transition"
                >
                  <div>
                    <div className="font-semibold text-gray-800">{t.name}</div>
                    <div className="text-sm text-gray-600">{t.email}</div>
                  </div>

                  {user?.role === "admin" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => openEditModal(t)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTechnician(t._id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-10">
              No technicians found.
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {(showAddModal || showEditModal) && renderFormModal()}
    </div>
  );

  // -----------------------------
  // 💬 Modal Renderer
  // -----------------------------
  function renderFormModal() {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
          <button
            onClick={closeModals}
            className="absolute top-3 right-4 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>

          <h2 className="text-lg font-semibold mb-4">
            {showAddModal ? "Add Technician" : "Edit Technician"}
          </h2>

          <form
            onSubmit={showAddModal ? handleAddTechnician : handleEditTechnician}
            className="space-y-4"
          >
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              placeholder="Full Name"
              className="border w-full px-3 py-2 rounded-lg text-sm"
              required
            />

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleFormChange}
              placeholder="Email"
              className="border w-full px-3 py-2 rounded-lg text-sm"
              required
            />

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleFormChange}
              placeholder={
                showEditModal
                  ? "New Password (leave blank to keep existing)"
                  : "Password"
              }
              className="border w-full px-3 py-2 rounded-lg text-sm"
              required={showAddModal}
            />

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              {showAddModal ? "Add Technician" : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    );
  }
}
