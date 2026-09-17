import express from "express";
import crypto from "node:crypto";
import {
  closeDatabase,
  createSession,
  deleteExpiredSessions,
  deleteSession,
  findSessionUser,
  findUser,
  initializeDatabase,
  verifyPassword,
} from "./database.js";

const app = express();
const port = Number(process.env.PORT || 5000);
const isProduction = process.env.NODE_ENV === "production";

function parseCookies(request) {
  return Object.fromEntries(
    (request.headers.cookie || "").split(";").filter(Boolean).map((cookie) => {
      const [name, ...value] = cookie.trim().split("=");
      return [name, decodeURIComponent(value.join("="))];
    }),
  );
}

function requireRole(role) {
  return async (request, response, next) => {
    const user = await findSessionUser(parseCookies(request).clearance_session);
    if (!user) return response.status(401).json({ message: "Authentication required." });
    if (user.role !== role) return response.status(403).json({ message: "You do not have access to this resource." });
    request.user = user;
    next();
  };
}

app.use(express.json());

app.post("/api/auth/login", async (request, response) => {
  const { login, password, role } = request.body || {};
  const normalizedLogin = String(login || "").trim().toLowerCase();
  const user = await findUser(role, normalizedLogin);

  if (!user || !password || !verifyPassword(password, user.passwordHash)) {
    return response.status(401).json({ message: "Incorrect login details." });
  }

  const sessionId = crypto.randomBytes(32).toString("hex");
  await createSession(user.id, sessionId, new Date(Date.now() + 8 * 60 * 60 * 1000));
  response.setHeader(
    "Set-Cookie",
    `clearance_session=${sessionId}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800${isProduction ? "; Secure" : ""}`,
  );
  return response.json({ user: { id: user.id, role: user.role, login: user.login, name: user.name } });
});

app.post("/api/auth/logout", async (request, response) => {
  await deleteSession(parseCookies(request).clearance_session);
  response.setHeader("Set-Cookie", "clearance_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0");
  return response.status(204).end();
});

app.get("/api/auth/me", async (request, response) => {
  const user = await findSessionUser(parseCookies(request).clearance_session);
  if (!user) return response.status(401).json({ message: "Authentication required." });
  return response.json({ user });
});

app.get("/api/student/secure-check", requireRole("student"), (request, response) => {
  response.json({ message: `Authenticated as ${request.user.name}.` });
});

initializeDatabase().then(async () => {
  await deleteExpiredSessions();
  app.listen(port, () => {
    console.log(`Authentication API listening on http://localhost:${port}`);
  });
}).catch((error) => {
  console.error("Unable to initialize PostgreSQL:", error.message);
  process.exit(1);
});

process.on("SIGINT", async () => {
  await closeDatabase();
  process.exit(0);
});
