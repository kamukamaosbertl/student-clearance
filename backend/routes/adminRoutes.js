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

// Audit trail
router.get("/audit-logs", listAuditLogs);

export default router;
