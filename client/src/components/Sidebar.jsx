import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Wrench,
  Users,
  User,
  Snowflake,
  X,
  LogOut,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";

export default function Sidebar({ role, isOpen, onClose }) {
  const location = useLocation();
  const { logout } = useContext(AuthContext);

  const menuItems =
    role === "admin"
      ? [
          { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
          { name: "Jobs", icon: Wrench, path: "/admin/jobs" },
          { name: "Inventory", icon: Package, path: "/admin/inventory" },
          { name: "Technicians", icon: Users, path: "/admin/technicians" },
          { name: "Users", icon: User, path: "/admin/users" },
        ]
      : [
          { name: "Dashboard", icon: LayoutDashboard, path: "/technician/dashboard" },
          { name: "Jobs", icon: Wrench, path: "/technician/jobs" },
          { name: "Inventory (Read-only)", icon: Package, path: "/technician/inventory" },
        ];

  return (
    <>
      {/* Overlay (mobile only) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static top-0 left-0 h-screen md:h-auto w-60 bg-gray-50 flex flex-col z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Header section */}
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-linear-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center shadow">
              <Snowflake className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">
              CoolTrack
            </h1>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-linear-to-r from-cyan-500 to-blue-500 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    active ? "text-white" : "text-cyan-500"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
