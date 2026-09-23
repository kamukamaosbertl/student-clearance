import express from "express";
import rateLimit from "express-rate-limit";
import { login, staffLogin } from "../controllers/authController.js";

const router = express.Router();

// Limit repeated login attempts to slow down brute-force / credential-stuffing attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login requests per window
  message: {
    message: "Too many login attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login route
// POST /api/auth/login
router.post("/login", loginLimiter, login);

// Staff (officer/admin) login route
// POST /api/auth/staff-login
router.post("/staff-login", loginLimiter, staffLogin);

export default router;