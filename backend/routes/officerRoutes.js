import express from "express";
import { authenticate, authorize, requireOffice } from "../middleware/auth.js";
import {
  getDashboard,
  listRequests,
  getRequest,
  decide,
  getHistory,
} from "../controllers/officerController.js";

const router = express.Router();

// Officers only, and only once they are assigned to an office
router.use(authenticate, authorize("officer"), requireOffice);

// GET /api/officer/dashboard — queue stats and requests needing attention
router.get("/dashboard", getDashboard);

// GET /api/officer/requests?status=all|actionable|approved|... — work queue
router.get("/requests", listRequests);

// GET /api/officer/requests/:stageId — request details (marks it under review)
router.get("/requests/:stageId", getRequest);

// POST /api/officer/requests/:stageId/decision — { action: approve|reject|correction, comment }
router.post("/requests/:stageId/decision", decide);

// GET /api/officer/history — decisions made by this officer
router.get("/history", getHistory);

export default router;
