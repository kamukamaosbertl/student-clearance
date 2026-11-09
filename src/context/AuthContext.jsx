import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

// Login state. The server keeps the real session (see backend
// services/sessionService.js); the browser only stores the token that
// points to it, plus a copy of the user for showing names and roles.
// role/isAuthenticated are derived from user.
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

      // Refresh the stored profile in the background (role, office or
      // name may have been changed by an administrator). An expired token
      // is handled by the 401 interceptor in api/client.js.
      api
        .get("/auth/me")
        .then(({ data }) => {
          localStorage.setItem("user", JSON.stringify(data.user));
          setUser(data.user);
        })
        .catch(() => {});
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

  // Ends the session ON THE SERVER (so the token can't be reused), then
  // clears it from this browser. The local part runs even if the server
  // can't be reached.
  async function logout() {
    try {
      if (localStorage.getItem("token")) await api.post("/auth/logout");
    } catch {
      /* session already ended or server unreachable */
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  // Ends every session of this user, on every device
  async function logoutEverywhere() {
    try {
      await api.post("/auth/logout-all");
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }
  }

  const value = {
    user,
    role: user?.role ?? null,
    isAuthenticated: user !== null,
    isLoading,
    login,
    staffLogin,
    logout,
    logoutEverywhere,
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