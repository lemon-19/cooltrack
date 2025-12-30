import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users as UsersIcon,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Wrench,
  AlertCircle,
  Phone,
} from "lucide-react";
import axiosInstance from "../../api/axios";
import UserModal from "../../components/UserModal";
import { useToast } from "../../contexts/ToastContext";
import ConfirmDialog from "../../components/ConfirmDialog";
import Skeleton from "../../components/Skeleton";

const UsersPage = () => {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [modalMode, setModalMode] = useState(null); // "add" | "edit" | "view"
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/users");
      setUsers(data.users);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) =>
        statusFilter === "active" ? user.isActive : !user.isActive
      );
    }

    setFilteredUsers(filtered);
  };

  const handleToggleStatus = async (userId) => {
    try {
      const { data } = await axiosInstance.patch(`/users/${userId}/toggle-status`);
      setUsers(users.map((u) => (u._id === userId ? { ...u, isActive: data.user.isActive } : u)));
      addToast({ message: data.message, type: 'success' });
    } catch (error) {
      addToast({ message: error.response?.data?.message || "Failed to update user status", type: 'error' });
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setDeleting(true);
      const { data } = await axiosInstance.delete(`/users/${userId}`);
      setUsers(users.filter((u) => u._id !== userId));
      setDeleteConfirm(null);
      addToast({ message: data.message, type: 'success' });
    } catch (error) {
      addToast({ message: error.response?.data?.message || "Failed to delete user", type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleModalSubmit = async (form) => {
    try {
      if (modalMode === "add") {
        const { data } = await axiosInstance.post("/users", form);
        setUsers([data.user, ...users]);
        addToast({ message: "User created successfully", type: 'success' });
      } else if (modalMode === "edit") {
        const { data } = await axiosInstance.put(`/users/${selectedUser._id}`, form);
        setUsers(users.map((u) => (u._id === selectedUser._id ? data.user : u)));
        addToast({ message: "User updated successfully", type: 'success' });
      }
      setModalMode(null);
      setSelectedUser(null);
    } catch (error) {
      addToast({ message: error.response?.data?.message || "Operation failed", type: 'error' });
    }
  };

  const getRoleBadge = (role) => (
    role === "admin" ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        <Shield className="w-3 h-3" />
        Admin
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <Wrench className="w-3 h-3" />
        Technician
      </span>
    )
  );

  const getStatusBadge = (isActive) => (
    isActive ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <UserCheck className="w-3 h-3" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <UserX className="w-3 h-3" />
        Inactive
      </span>
    )
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1 text-sm">Manage system users and permissions</p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
          onClick={() => setModalMode("add")}
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="technician">Technician</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-4">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      </div>

      {/* Users Table - Desktop and Tablet view */}
      <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center font-semibold text-blue-600">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.isActive)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(user._id)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.isActive ? 'hover:bg-red-50 text-red-600' : 'hover:bg-green-50 text-green-600'
                          }`}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setModalMode("edit");
                          }}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setModalMode("view");
                          }}
                          className="p-2 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors"
                          title="View"
                        >
                          <UsersIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(user._id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
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

      {/* Users Cards - Mobile view only */}
      <div className="sm:hidden space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-12">
            <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4"
            >
              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 uppercase font-medium">User</p>
                  <p className="font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                </div>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Role</p>
                  {getRoleBadge(user.role)}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Status</p>
                  {getStatusBadge(user.isActive)}
                </div>
              </div>

              {/* Contact & Joined */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Contact</p>
                  <div className="flex items-center gap-1 text-sm text-gray-700 mt-1">
                    <Phone className="w-3 h-3 shrink-0" />
                    <span className="truncate">{user.phone || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Joined</p>
                  <p className="text-sm text-gray-700 mt-1">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Actions</p>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                      user.isActive
                        ? 'text-red-700 bg-red-50 hover:bg-red-100'
                        : 'text-green-700 bg-green-50 hover:bg-green-100'
                    }`}
                    onClick={() => handleToggleStatus(user._id)}
                  >
                    {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    <span className="text-xs font-medium">
                      {user.isActive ? 'Disable' : 'Enable'}
                    </span>
                  </button>
                  <button
                    className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      setSelectedUser(user);
                      setModalMode("view");
                    }}
                  >
                    <UsersIcon className="w-4 h-4" />
                    <span className="text-xs font-medium">View</span>
                  </button>
                  <button
                    className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                    onClick={() => {
                      setSelectedUser(user);
                      setModalMode("edit");
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-xs font-medium">Edit</span>
                  </button>
                  <button
                    className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                    onClick={() => setDeleteConfirm(user._id)}
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

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete User"
        message={`Are you sure you want to delete this user? This action cannot be undone.`}
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleting}
        onConfirm={() => handleDeleteUser(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Add/Edit/View Modal */}
      {(modalMode === "add" || modalMode === "edit" || modalMode === "view") && (
        <UserModal
          mode={modalMode}
          userData={selectedUser}
          onClose={() => {
            setModalMode(null);
            setSelectedUser(null);
          }}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
};

export default UsersPage;