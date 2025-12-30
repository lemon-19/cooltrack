// src/App.jsx (UPDATED)
// Main application component with routing - Added registration and users routes

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import UsersPage from './pages/users/UsersPage';
// Import other pages as you create them
import CustomersPage from './pages/customers/CustomersPage';
import JobsPage from './pages/jobs/JobsPage';
import InventoryPage from './pages/inventory/InventoryPage';
import SettingsPage from './pages/settings/SettingsPage';

// Technician Pages
import TechnicianJobsPage from './pages/jobs/TechnicianJobsPage';
import TechnicianDashboardPage from './pages/dashboard/TechnicianDashboardPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute adminOnly> 
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Admin Only Routes */}
            <Route
              path="/users"
              element={
                <ProtectedRoute adminOnly>
                  <Layout>
                    <UsersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Uncomment as you create these pages */}
            <Route
              path="/customers"
              element={
                <ProtectedRoute adminOnly>
                  <Layout>
                    <CustomersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/jobs"
              element={
                <ProtectedRoute adminOnly>
                  <Layout>
                    <JobsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory"
              element={
                <ProtectedRoute adminOnly>
                  <Layout>
                    <InventoryPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route 
              path="/settings" 
              element={
                <ProtectedRoute adminOnly>
                  <Layout>
                    <SettingsPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Technician Only Route */}
            <Route
              path="/technician/dashboard"
              element={
                <ProtectedRoute role="technician">
                  <Layout>
                    <TechnicianDashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/technician/jobs"
              element={
                <ProtectedRoute role="technician">
                  <Layout>
                    <TechnicianJobsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />


            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404 Not Found */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;