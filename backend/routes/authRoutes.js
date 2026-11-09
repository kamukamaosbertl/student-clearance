import express from "express";
import rateLimit from "express-rate-limit";
import {
  login,
  staffLogin,
  me,
  logout,
  logoutAll,
  mySessions,
  changePassword,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import PgRateLimitStore from "../utils/pgRateLimitStore.js";

const router = express.Router();

// Limit repeated login attempts to slow down brute-force / credential-stuffing
// attacks. The counter is stored in PostgreSQL so the limit holds across all
// servers behind the load balancer (10 tries in total, not 10 per server).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: parseInt(process.env.LOGIN_RATE_LIMIT, 10) || 10, // per IP per window
  store: new PgRateLimitStore("login:"),
  message: {
    message: "Too many login attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/login — student login
router.post("/login", loginLimiter, login);

// POST /api/auth/staff-login — officer/admin login
router.post("/staff-login", loginLimiter, staffLogin);

// GET /api/auth/me — current user and session
router.get("/me", authenticate, me);

// POST /api/auth/logout — end this session
router.post("/logout", authenticate, logout);

// POST /api/auth/logout-all — end every session of this user
router.post("/logout-all", authenticate, logoutAll);

// GET /api/auth/sessions — this user's active sessions
router.get("/sessions", authenticate, mySessions);

// POST /api/auth/change-password
router.post("/change-password", authenticate, loginLimiter, changePassword);

export default router;
