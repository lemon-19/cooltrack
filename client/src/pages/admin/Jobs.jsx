import React, { useEffect, useState, useContext } from "react";
import API from "../../api/axios";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { AuthContext } from "../../context/AuthContext";
import { Commet } from "react-loading-indicators";
import { Search } from "lucide-react";

export default function Jobs() {
  const { user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [technicians, setTechnicians] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    search: "",
  });

  // Modals
  const [jobDetails, setJobDetails] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    clientAddress: "",
    contact: "",
    type: "",
    assignedTo: "",
    status: "Pending",
  });

  // Fetch jobs on load or filter change
  useEffect(() => {
    fetchJobs();
    fetchTechnicians();
  }, [page, filters]);

  // Fetch technicians
  const fetchTechnicians = async () => {
    try {
      const { data } = await API.get("/users/technicians");
      setTechnicians(data);
    } catch (err) {
      console.error("Failed to load technicians:", err);
    }
  };

  // Fetch Jobs
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit,
        ...filters,
      });
      const { data } = await API.get(`/jobs?${params.toString()}`);
      setJobs(data.results || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter input
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  // Job details modal
  const openJobDetails = async (jobId) => {
    try {
      setSelectedJob(jobId);
      setModalOpen(true);
      const { data } = await API.get(`/jobs/${jobId}`);
      setJobDetails(data);
    } catch (err) {
      console.error(err);
    }
  };

  const closeDetailsModal = () => {
    setModalOpen(false);
    setSelectedJob(null);
    setJobDetails(null);
  };

  // Add/Edit job
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddJob = async (e) => {
    e.preventDefault();
    try {
      await API.post("/jobs", formData);
      setShowAddModal(false);
      setFormData({
        clientName: "",
        clientAddress: "",
        contact: "",
        type: "",
        status: "Pending",
      });
      fetchJobs();
    } catch (err) {
      console.error("Error adding job:", err);
      alert(err.response?.data?.message || "Failed to add job");
    }
  };

  const handleEditJob = async (e) => {
    e.preventDefault();
    try {
      await API.patch(`/jobs/${selectedJob}/status`, {
        status: formData.status,
        remarks: formData.remarks,
      });
      setShowEditModal(false);
      fetchJobs();
    } catch (err) {
      console.error("Error updating job:", err);
      alert(err.response?.data?.message || "Failed to update job");
    }
  };

  const openEditModal = (job) => {
    setSelectedJob(job._id);
    setFormData({
      status: job.status,
      remarks: job.remarks || "",
    });
    setShowEditModal(true);
  };

  const closeFormModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedJob(null);
  };

  // -----------------------------
  // 🖼️ UI RENDER
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
          title="Job Management"
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center flex-wrap gap-3">
            <h1 className="text-xl font-semibold text-gray-800">Job Orders</h1>

            {user?.role === "admin" && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                + Add Job
              </button>
            )}
          </div>

          {/* Filters (Collapsible) */}
          <div className="bg-white shadow-sm rounded-xl mb-6 sticky top-0 z-10">
            {/* Header / Toggle */}
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className="w-full flex justify-between items-center px-4 py-3 rounded-t-xl text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              <span className="flex justify-center items-center gap-2"><Search size={15}/> Filters</span>
              <span
                className={`transform transition-transform duration-200 ${
                  showFilters ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </button>

            {/* Collapsible Body */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                showFilters ? "max-h-[400px] p-4" : "max-h-0 p-0"
              }`}
            >
              <form
                onSubmit={handleSearchSubmit}
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:flex lg:items-center lg:gap-3"
              >
                {/* Search */}
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search by client name, address, or contact..."
                  className="border rounded-lg px-3 py-2 text-sm w-full md:col-span-2"
                />

                {/* Status */}
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="border rounded-lg px-3 py-2 text-sm w-full"
                >
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>

                {/* Type */}
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="border rounded-lg px-3 py-2 text-sm w-full"
                >
                  <option value="">All Types</option>
                  <option value="Installation">Installation</option>
                  <option value="Repair">Repair</option>
                  <option value="Maintenance">Maintenance</option>
                </select>

                {/* Button */}
                <button
                  type="submit"
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900 w-full"
                >
                  Apply
                </button>
              </form>
            </div>
          </div>

          {/* 🧾 Scrollable Job List */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Commet color="#3B82F6" size="medium" text="" textColor="" />
            </div>
          ) : jobs.length > 0 ? (
            <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2">
              {jobs.map((j) => (
                <div
                  key={j._id}
                  className="p-4 bg-white rounded-xl shadow-sm flex justify-between items-center hover:shadow-md transition"
                >
                  <div>
                    <div className="font-semibold text-gray-800">
                      {j.clientName} — {j.type}
                    </div>
                    <div className="text-sm text-gray-600">
                      {j.clientAddress}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-medium px-3 py-1 rounded-full ${
                        j.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : j.status === "Ongoing"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {j.status}
                    </span>

                    <div className="text-xs text-gray-500 mt-1">
                      {j.dateCompleted
                        ? new Date(j.dateCompleted).toLocaleDateString()
                        : "Not Completed"}
                    </div>

                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        onClick={() => openJobDetails(j._id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View
                      </button>

                      {user?.role === "admin" && (
                        <button
                          onClick={() => openEditModal(j)}
                          className="text-xs text-gray-600 hover:underline"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-10">
              No jobs found.
            </div>
          )}

          {/* Pagination */}
          <div className="mt-6 flex justify-center items-center space-x-3">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                page === 1
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-white border shadow-sm hover:bg-gray-100"
              }`}
            >
              Previous
            </button>

            <span className="text-gray-600">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                page === totalPages
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-white border shadow-sm hover:bg-gray-100"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </main>

      {/* Modals */}
      {modalOpen && renderJobDetailsModal()}
      {(showAddModal || showEditModal) && renderFormModal()}
    </div>
  );

  // -----------------------------
  // 💬 Render Helpers (modals)
  // -----------------------------
  function renderJobDetailsModal() {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative border border-gray-100">
          <button
            onClick={closeDetailsModal}
            className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>

          {!jobDetails ? (
            <div className="text-center text-gray-500 py-10">
              Loading details...
            </div>
          ) : (
            <div className="space-y-5">
              <div className="border-b pb-3">
                <h2 className="text-xl font-semibold text-gray-800">
                  {jobDetails.clientName}
                </h2>
                <p className="text-sm text-gray-500">{jobDetails.type}</p>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Address:</span>
                  <p className="text-gray-600">{jobDetails.clientAddress}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Contact:</span>
                  <p className="text-gray-600">{jobDetails.contact}</p>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <p
                    className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                      jobDetails.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : jobDetails.status === "Ongoing"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {jobDetails.status}
                  </p>
                </div>

                <div>
                  <span className="font-medium text-gray-700">
                    Assigned To:
                  </span>
                  <p className="text-gray-600">
                    {jobDetails.assignedTo?.name || "Unassigned"}
                  </p>
                </div>
              </div>

              <div className="border-t pt-3">
                <span className="font-medium text-gray-700 text-sm">
                  Remarks
                </span>
                <p className="text-gray-600 text-sm mt-1 whitespace-pre-line">
                  {jobDetails.remarks || "No remarks available."}
                </p>
              </div>

              <div className="border-t pt-3">
                <h3 className="font-medium text-gray-700 text-sm mb-2">
                  Materials Used
                </h3>
                {jobDetails.materialsUsed?.length > 0 ? (
                  <ul className="divide-y divide-gray-100 text-sm text-gray-600 rounded-md border border-gray-100">
                    {jobDetails.materialsUsed.map((m, idx) => (
                      <li
                        key={idx}
                        className="px-3 py-2 flex justify-between items-center"
                      >
                        <span>{m.itemName || m.itemId?.name}</span>
                        <span className="text-gray-500">
                          {m.quantity} {m.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No materials used.</p>
                )}
              </div>

              <div className="border-t pt-3 text-xs text-gray-500">
                <div>
                  Created:{" "}
                  {new Date(jobDetails.dateCreated).toLocaleDateString()}
                </div>
                {jobDetails.dateCompleted && (
                  <div>
                    Completed:{" "}
                    {new Date(jobDetails.dateCompleted).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderFormModal() {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
          <button
            onClick={closeFormModals}
            className="absolute top-3 right-4 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>

          <h2 className="text-lg font-semibold mb-4">
            {showAddModal ? "Add New Job" : "Update Job Status"}
          </h2>

          <form
            onSubmit={showAddModal ? handleAddJob : handleEditJob}
            className="space-y-4"
          >
            {showAddModal ? (
              <>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleFormChange}
                  placeholder="Client Name"
                  className="border w-full px-3 py-2 rounded-lg text-sm"
                  required
                />
                <input
                  type="text"
                  name="clientAddress"
                  value={formData.clientAddress}
                  onChange={handleFormChange}
                  placeholder="Client Address"
                  className="border w-full px-3 py-2 rounded-lg text-sm"
                  required
                />
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleFormChange}
                  placeholder="Contact"
                  className="border w-full px-3 py-2 rounded-lg text-sm"
                  required
                />
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  className="border w-full px-3 py-2 rounded-lg text-sm"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Installation">Installation</option>
                  <option value="Repair">Repair</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleFormChange}
                  className="border w-full px-3 py-2 rounded-lg text-sm"
                  required
                >
                  <option value="">Assign Technician</option>
                  {technicians.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="border w-full px-3 py-2 rounded-lg text-sm"
                >
                  <option value="Pending">Pending</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleFormChange}
                  placeholder="Remarks (optional)"
                  className="border w-full px-3 py-2 rounded-lg text-sm"
                />
              </>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              {showAddModal ? "Add Job" : "Update Job"}
            </button>
          </form>
        </div>
      </div>
    );
  }
}
