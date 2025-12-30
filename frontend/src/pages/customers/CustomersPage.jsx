import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Building2,
  Edit,
  Trash2,
  Phone,
  MapPin,
  AlertCircle,
  Eye,
} from "lucide-react";
import {
  getCustomers,
  deleteCustomer,
  createCustomer,
  updateCustomer,
} from "../../api/customers";
import CustomerModal from "../../components/CustomerModal";

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const [modalMode, setModalMode] = useState(null); // "add" | "edit" | "view"
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [companyOptions, setCompanyOptions] = useState([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterData();
  }, [search, companyFilter, customers]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);

      const companies = Array.from(new Set(data.map((c) => c.company || "Unknown")));
      setCompanyOptions(["all", ...companies]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let result = [...customers];
    if (search) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (companyFilter !== "all") {
      result = result.filter((c) => (c.company || "Unknown") === companyFilter);
    }
    setFiltered(result);
  };

  const handleDelete = async (id) => {
    try {
      await deleteCustomer(id);
      setCustomers(customers.filter((c) => c._id !== id));
      setDeleteId(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete customer");
    }
  };

  const handleModalSubmit = async (data) => {
    try {
      if (modalMode === "add") {
        const newCustomer = await createCustomer(data);
        setCustomers([newCustomer, ...customers]);
      } else if (modalMode === "edit") {
        const updated = await updateCustomer(selectedCustomer._id, data);
        setCustomers(
          customers.map((c) => (c._id === selectedCustomer._id ? updated : c))
        );
      }
      setModalMode(null);
      setSelectedCustomer(null);
    } catch (error) {
      alert("Operation failed: " + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
          <p className="text-gray-600 mt-1 text-sm">Manage registered customers</p>
        </div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
          onClick={() => setModalMode("add")}
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Company Filter */}
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
            >
              {companyOptions.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All Companies" : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-4">
          Showing {filtered.length} of {customers.length} customers
        </p>
      </div>

      {/* Customers Table - Desktop and Tablet view */}
      <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{c.name}</p>
                          <p className="text-sm text-gray-500">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{c.company || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" /> {c.phone || "N/A"}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> {c.address || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-2 rounded-lg text-gray-600 hover:bg-gray-50"
                          onClick={() => {
                            setSelectedCustomer(c);
                            setModalMode("view");
                          }}
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedCustomer(c);
                            setModalMode("edit");
                          }}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteId(c._id)}
                          title="Delete"
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

      {/* Customers Cards - Mobile view only */}
      <div className="sm:hidden space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No customers found</p>
          </div>
        ) : (
          filtered.map((c) => (
            <div
              key={c._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4"
            >
              {/* Customer Info */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700 text-lg">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 uppercase font-medium">Customer</p>
                  <p className="font-medium text-gray-900 truncate">{c.name}</p>
                  <p className="text-sm text-gray-600 truncate">{c.email}</p>
                </div>
              </div>

              {/* Company */}
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Company</p>
                <p className="text-sm text-gray-900 mt-1">{c.company || "—"}</p>
              </div>

              {/* Contact Info */}
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Contact</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{c.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="break-words">{c.address || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Actions</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      setSelectedCustomer(c);
                      setModalMode("view");
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-medium">View</span>
                  </button>
                  <button
                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                    onClick={() => {
                      setSelectedCustomer(c);
                      setModalMode("edit");
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-xs font-medium">Edit</span>
                  </button>
                  <button
                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                    onClick={() => setDeleteId(c._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-xs font-medium">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Customer
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to delete this customer? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteId)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit/View Modal */}
      {(modalMode === "add" || modalMode === "edit" || modalMode === "view") && (
        <CustomerModal
          mode={modalMode}
          customerData={selectedCustomer}
          onClose={() => {
            setModalMode(null);
            setSelectedCustomer(null);
          }}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
};

export default CustomersPage;