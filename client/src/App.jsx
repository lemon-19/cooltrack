import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Auth/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminJobs from "./pages/admin/Jobs";
import AdminInventory from "./pages/admin/Inventory";
import AdminTechnicians from "./pages/admin/Technicians";
import TechDashboard from "./pages/technician/Dashboard";
import TechJobs from "./pages/technician/Jobs";
import JobDetail from "./pages/technician/JobDetail";
import { AuthContext } from "./context/AuthContext";

function PrivateRoute({ children, role }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* admin */}
      <Route
        path="/admin/dashboard"
        element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>}
      />
      <Route
        path="/admin/jobs"
        element={<PrivateRoute role="admin"><AdminJobs /></PrivateRoute>}
      />
      <Route
        path="/admin/inventory"
        element={<PrivateRoute role="admin"><AdminInventory /></PrivateRoute>}
      />
      <Route
        path="/admin/technicians"
        element={<PrivateRoute role="admin"><AdminTechnicians /></PrivateRoute>}
      />

      {/* technician */}
      <Route
        path="/technician/dashboard"
        element={<PrivateRoute role="technician"><TechDashboard /></PrivateRoute>}
      />
      <Route
        path="/technician/jobs"
        element={<PrivateRoute role="technician"><TechJobs /></PrivateRoute>}
      />
      <Route
        path="/technician/jobs/:id"
        element={<PrivateRoute role="technician"><JobDetail /></PrivateRoute>}
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
