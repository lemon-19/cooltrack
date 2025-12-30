// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * @param children - component(s) to render if authorized
 * @param adminOnly - true if only admins can access
 * @param role - restrict access to a specific role (e.g., 'technician')
 */
const ProtectedRoute = ({ children, adminOnly = false, role = null }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin-only route
  if (adminOnly && user.role !== 'admin') {
    // Redirect non-admin users to their dashboard
    return <Navigate to={user.role === 'technician' ? '/technician/dashboard' : '/dashboard'} replace />;
  }

  // Role-specific route
  if (role && user.role !== role) {
    // Redirect to correct dashboard based on role
    return <Navigate to={user.role === 'admin' ? '/dashboard' : '/technician/dashboard'} replace />;
  }

  // Authorized
  return children;
};

export default ProtectedRoute;
