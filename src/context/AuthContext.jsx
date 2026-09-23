import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

// Real session state backed by the backend's /api/auth/login endpoint.
// The token and user are persisted in localStorage so the session
// survives a page refresh; role/isAuthenticated are derived from user.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    setIsLoading(false);
  }, []);

  // Student login (studentId + password) — calls /api/auth/login
  async function login(studentId, password) {
    const response = await api.post("/auth/login", { studentId, password });
    const { token, user: userData } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    return userData;
  }

  // Officer/Admin login (email + password) — calls /api/auth/staff-login
  async function staffLogin(email, password) {
    const response = await api.post("/auth/staff-login", { email, password });
    const { token, user: userData } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    return userData;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  const value = {
    user,
    role: user?.role ?? null,
    isAuthenticated: user !== null,
    isLoading,
    login,
    staffLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}