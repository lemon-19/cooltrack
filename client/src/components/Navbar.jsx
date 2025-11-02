import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Menu } from "lucide-react";

export default function Navbar({ title, onMenuClick }) {
  const { user } = useContext(AuthContext);

  return (
    <nav className="sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side: Menu + Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          </div>

          {/* Right side: User info */}
          {user && (
            <div className="text-right">
              <p className="text-gray-800 font-semibold leading-tight">
                {user.name}
              </p>
              <p className="text-gray-500 text-sm font-medium">
                {user.role}
              </p>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
