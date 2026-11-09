import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import sequelize from "./config/database.js";
import "./models/index.js";
import authRoutes from "./routes/authRoutes.js";
import clearanceRoutes from "./routes/clearanceRoutes.js";
import officerRoutes from "./routes/officerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import commonRoutes from "./routes/commonRoutes.js";
import { removeUploadedFiles } from "./middleware/upload.js";

// Refuse to start without a JWT secret instead of issuing broken tokens
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set. Add it to backend/.env (see .env.example).");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Needed for correct client IPs in the audit log / rate limiter behind a proxy
if (process.env.TRUST_PROXY) app.set("trust proxy", process.env.TRUST_PROXY);
app.disable("x-powered-by");

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "100kb" }));

// Basic security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

// General API rate limit (logins have their own stricter limit)
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please slow down." },
  })
);

// Authentication routes
app.use("/api/auth", authRoutes);

// Student clearance workflow
app.use("/api/clearance", clearanceRoutes);

// Officer work queue and decisions
app.use("/api/officer", officerRoutes);

// Administrator management, monitoring, reports and audit trail
app.use("/api/admin", adminRoutes);

// Offices, notifications, documents (any logged-in user)
app.use("/api", commonRoutes);

app.get("/", (req, res) => {
  res.send("MUST Clearance backend is running!");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error-handling middleware. Express 5 forwards errors thrown in async
// handlers here automatically.
app.use((err, req, res, next) => {
  // Files uploaded with a request that failed are not kept
  removeUploadedFiles(req.files);

  const status = err.status || 500;
  if (status >= 500) console.error(err.stack);

  res.status(status).json({
    // Don't leak internal error details to the client
    message: status >= 500 ? "Internal server error" : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
});

// Connect to PostgreSQL, then start the server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to PostgreSQL:", error.message);
    process.exit(1);
  }
};

startServer();
