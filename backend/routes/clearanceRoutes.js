import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { uploadDocuments } from "../middleware/upload.js";
import {
  getMyClearance,
  submitClearance,
  resubmitClearanceStage,
} from "../controllers/clearanceController.js";

const router = express.Router();

// Every route here is for logged-in students only
router.use(authenticate, authorize("student"));

// GET /api/clearance/me — current clearance request with stages, documents and history
router.get("/me", getMyClearance);

// POST /api/clearance — submit a new clearance request (multipart/form-data)
router.post("/", uploadDocuments, submitClearance);

// POST /api/clearance/stages/:stageId/resubmit — respond to a correction/rejection
router.post("/stages/:stageId/resubmit", uploadDocuments, resubmitClearanceStage);

export default router;
