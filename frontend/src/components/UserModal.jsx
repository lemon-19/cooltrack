import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Shield,
  Wrench,
  Phone,
  AlertCircle,
} from "lucide-react";
import { validators } from "../utils/validation";

const UserModal = ({ mode, userData, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "technician",
    phone: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (userData) {
      setForm({
        name: userData.name || "",
        email: userData.email || "",
        role: userData.role || "technician",
        phone: userData.phone || "",
      });
    }
  }, [userData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    const emailError = validators.email(form.email);
    if (emailError) newErrors.email = emailError;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    onSubmit(form);
  };

  const isView = mode === "view";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === "add" && "Add User"}
            {mode === "edit" && "Edit User"}
            {mode === "view" && "User Details"}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => { handleChange(e); setErrors({ ...errors, name: null }); }}
                disabled={isView}
                aria-label="Full Name"
                aria-required="true"
                aria-invalid={!!errors.name}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => { handleChange(e); setErrors({ ...errors, email: null }); }}
                disabled={isView}
                aria-label="Email Address"
                aria-required="true"
                aria-invalid={!!errors.email}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.email}</p>}
          </div>

          {/* Role */}
          <div className="flex items-center gap-2">
            {form.role === "admin" ? <Shield className="w-5 h-5 text-gray-400" /> : <Wrench className="w-5 h-5 text-gray-400" />}
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              disabled={isView}
              aria-label="User Role"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 appearance-none"
            >
              <option value="admin">Admin</option>
              <option value="technician">Technician</option>
            </select>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange}
              disabled={isView}
              aria-label="Phone Number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
            />
          </div>

          {/* Actions */}
          {!isView && (
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {mode === "add" ? "Add User" : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UserModal;
