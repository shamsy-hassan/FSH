import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ adminOnly = false }) => {
  const { user, userType, loading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  // Show a loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Debug logs to see what's happening
  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated);
  console.log('ProtectedRoute - userType:', userType);
  console.log('ProtectedRoute - user:', user);
  console.log('ProtectedRoute - adminOnly:', adminOnly);
  console.log('ProtectedRoute - isAdmin:', isAdmin);

  // Not logged in? Redirect to appropriate login page
  if (!isAuthenticated) {
    console.log('Redirecting to login - not authenticated');
    const loginPath = adminOnly ? "/admin-login" : "/user-login";
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Admin-only route but user is not admin
  if (adminOnly && !isAdmin) {
    console.log('Redirecting - admin access required');
    // Redirect to appropriate dashboard based on user type
    if (userType === "user") {
      const dashboardPath = user?.user_type === "farmer" ? "/user/dashboard" : "/supplier/dashboard";
      return <Navigate to={dashboardPath} replace />;
    }
    return <Navigate to="/user-login" replace />;
  }

  // User-only route but user is admin
  if (!adminOnly && isAdmin) {
    console.log('Redirecting admin to admin dashboard');
    return <Navigate to="/admin/dashboard" replace />;
  }

  // All checks passed, render child routes
  console.log('Access granted - rendering outlet');
  return <Outlet />;
};

export default ProtectedRoute;