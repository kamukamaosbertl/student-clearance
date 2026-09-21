import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

// Minimal client-side session state — no real backend yet, so this
// just tracks "is someone logged in, and as which role" for the
// current browser tab.
// TODO: replace with real session/token checks once the backend
// exists (e.g. reading a stored token, verifying it with the API).
export function AuthProvider({ children }) {
  const [role, setRole] = useState(null); // null | "student" | "officer" | "admin"

  function login(nextRole) {
    setRole(nextRole);
  }

  function logout() {
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ role, isAuthenticated: role !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}