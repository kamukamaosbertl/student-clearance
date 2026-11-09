import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getOverview,
  exportApplicationsCsv,
  listApplications,
  getApplication,
  listUsers,
  createUser,
  updateUser,
  resetPassword,
  listOfficesAdmin,
  updateOffice,
  listAuditLogs,
  listSessions,
  endSession,
  logoutUserEverywhere,
  systemStatus,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(authenticate, authorize("admin"));

// Dashboard & reports
router.get("/overview", getOverview);
router.get("/reports/applications.csv", exportApplicationsCsv);

// Clearance monitoring
router.get("/applications", listApplications);
router.get("/applications/:id", getApplication);

// User management
router.get("/users", listUsers);
router.post("/users", createUser);
router.patch("/users/:id", updateUser);
router.post("/users/:id/reset-password", resetPassword);

// System configuration
router.get("/offices", listOfficesAdmin);
router.patch("/offices/:id", updateOffice);

// Sessions
router.get("/sessions", listSessions);
router.delete("/sessions/:id", endSession);
router.post("/users/:id/logout-all", logoutUserEverywhere);

// System status (which server answered, pools, queue, live connections)
router.get("/system", systemStatus);

// Audit trail
router.get("/audit-logs", listAuditLogs);

export default router;
