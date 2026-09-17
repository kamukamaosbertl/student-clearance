import express from "express";
import crypto from "node:crypto";

const app = express();
const port = Number(process.env.PORT || 5000);
const isProduction = process.env.NODE_ENV === "production";
const sessions = new Map();

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = storedHash.split(":");
  const actualHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expectedHash, "hex"));
}

const users = [
  {
    id: "student-1",
    role: "student",
    login: "2023/BSE/058/PS",
    name: "Kamukama Osbert",
    passwordHash: hashPassword(process.env.DEMO_STUDENT_PASSWORD || "student123"),
  },
  {
    id: "officer-1",
    role: "officer",
    login: "finance.officer@must.ac.ug",
    name: "Finance Officer",
    passwordHash: hashPassword(process.env.DEMO_OFFICER_PASSWORD || "officer123"),
  },
  {
    id: "admin-1",
    role: "admin",
    login: "admin@must.ac.ug",
    name: "System Administrator",
    passwordHash: hashPassword(process.env.DEMO_ADMIN_PASSWORD || "admin123"),
  },
];

function publicUser(user) {
  return { id: user.id, role: user.role, login: user.login, name: user.name };
}

function parseCookies(request) {
  return Object.fromEntries(
    (request.headers.cookie || "").split(";").filter(Boolean).map((cookie) => {
      const [name, ...value] = cookie.trim().split("=");
      return [name, decodeURIComponent(value.join("="))];
    }),
  );
}

function getSessionUser(request) {
  const sessionId = parseCookies(request).clearance_session;
  const session = sessionId && sessions.get(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    if (sessionId) sessions.delete(sessionId);
    return null;
  }
  return users.find((user) => user.id === session.userId) || null;
}

function requireRole(role) {
  return (request, response, next) => {
    const user = getSessionUser(request);
    if (!user) return response.status(401).json({ message: "Authentication required." });
    if (user.role !== role) return response.status(403).json({ message: "You do not have access to this resource." });
    request.user = user;
    next();
  };
}

app.use(express.json());

app.post("/api/auth/login", (request, response) => {
  const { login, password, role } = request.body || {};
  const normalizedLogin = String(login || "").trim().toLowerCase();
  const user = users.find(
    (candidate) => candidate.role === role && candidate.login.toLowerCase() === normalizedLogin,
  );

  if (!user || !password || !verifyPassword(password, user.passwordHash)) {
    return response.status(401).json({ message: "Incorrect login details." });
  }

  const sessionId = crypto.randomBytes(32).toString("hex");
  sessions.set(sessionId, { userId: user.id, expiresAt: Date.now() + 8 * 60 * 60 * 1000 });
  response.setHeader(
    "Set-Cookie",
    `clearance_session=${sessionId}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800${isProduction ? "; Secure" : ""}`,
  );
  return response.json({ user: publicUser(user) });
});

app.post("/api/auth/logout", (request, response) => {
  const sessionId = parseCookies(request).clearance_session;
  if (sessionId) sessions.delete(sessionId);
  response.setHeader("Set-Cookie", "clearance_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0");
  return response.status(204).end();
});

app.get("/api/auth/me", (request, response) => {
  const user = getSessionUser(request);
  if (!user) return response.status(401).json({ message: "Authentication required." });
  return response.json({ user: publicUser(user) });
});

app.get("/api/student/secure-check", requireRole("student"), (request, response) => {
  response.json({ message: `Authenticated as ${request.user.name}.` });
});

app.listen(port, () => {
  console.log(`Authentication API listening on http://localhost:${port}`);
});
