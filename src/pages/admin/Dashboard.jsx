import { useAuth } from "../../context/AuthContext";

// Placeholder admin dashboard so the login flow is testable end-to-end.
// Flesh this out with account management, monitoring, and reports
// per the project's build order (Admin screens come last).
export default function AdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-semibold text-navy mb-2">
          Admin Dashboard
        </h1>
        <p className="text-navy-soft mb-6">
          Welcome, {user?.fullName || "Administrator"}.
        </p>

        <div className="text-sm text-navy-soft mb-6">
          <p>Email: {user?.email}</p>
          <p>Role: {user?.role}</p>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 bg-navy text-white rounded hover:opacity-90"
        >
          Log out
        </button>
      </div>
    </div>
  );
}