import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Guards routes that require authentication and optional admin role.
// Frontend guard is a UX convenience only — the backend always re-verifies.
function ProtectedRoute({ adminOnly = false }) {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;

  return <Outlet />;
}

export default ProtectedRoute;
