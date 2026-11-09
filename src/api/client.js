import axios from "axios";

// No default Content-Type here on purpose: axios sets "application/json"
// for plain objects by itself, and for FormData (file uploads) the browser
// must set "multipart/form-data" with its boundary. A fixed JSON header
// made axios convert FormData uploads into JSON and drop the files.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach the token to every request if one exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the server says the session is no longer valid (expired token,
// deactivated account), clear it and send the user back to the start.
// Login requests are excluded so a wrong password just shows an error.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthCall = url.startsWith("/auth/login") || url.startsWith("/auth/staff-login") || url.startsWith("/auth/logout");
    if (error.response?.status === 401 && !isAuthCall && localStorage.getItem("token")) {
      endLocalSession(error.response.data?.message);
    }
    return Promise.reject(error);
  }
);

// The server ended the session (logout elsewhere, idle timeout, admin,
// password change): forget it here, remember why, and go to the right
// login page. The Header shows the reason once.
export function endLocalSession(message) {
  let role = null;
  try {
    role = JSON.parse(localStorage.getItem("user") || "null")?.role;
  } catch {
    /* ignore */
  }
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  try {
    sessionStorage.setItem("sessionEndedMessage", message || "Your session has ended. Please log in again.");
  } catch {
    /* ignore */
  }
  window.location.assign(role === "officer" ? "/officer/login" : role === "admin" ? "/admin/login" : "/login");
}

// Human-readable message from an API error
export function apiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error?.response) return "Unable to reach the server. Please check your connection and try again.";
  return error.response.data?.message || fallback;
}

// Opens a supporting document in a new tab. Documents need the auth
// header, so they are fetched as a blob instead of linked directly.
export async function openDocument(documentId) {
  // Open the tab synchronously (inside the click) so popup blockers allow it
  const tab = window.open("", "_blank");
  try {
    const response = await api.get(`/documents/${documentId}`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    if (tab) tab.location.href = url;
    else window.location.assign(url);
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    tab?.close();
    throw error;
  }
}

// Downloads a file (e.g. a CSV report) that requires authentication
export async function downloadFile(path, fileName) {
  const response = await api.get(path, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export default api;
