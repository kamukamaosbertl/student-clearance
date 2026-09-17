async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "The request could not be completed.");
  }

  return response.status === 204 ? null : response.json();
}

export function login({ login, password, role }) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ login, password, role }),
  });
}

export function logout() {
  return request("/api/auth/logout", { method: "POST" });
}

export function getCurrentUser() {
  return request("/api/auth/me");
}
