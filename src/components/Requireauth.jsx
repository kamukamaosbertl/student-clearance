import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrap any protected route's element with this. If the visitor isn't
// authenticated as the expected role — including someone who just
// logged out and hit the browser's Back button — they're bounced to
// the landing page instead of seeing the protected page's content.
export default function RequireAuth({ role, children }) {
  const { role: currentRole, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || currentRole !== role) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}