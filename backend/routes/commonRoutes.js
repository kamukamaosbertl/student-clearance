import express from "express";
import { authenticate } from "../middleware/auth.js";
import { listOffices } from "../controllers/clearanceController.js";
import { getNotifications, readOne, readAll } from "../controllers/notificationController.js";
import { downloadDocument } from "../controllers/documentController.js";

// Routes shared by every logged-in role
const router = express.Router();

// GET /api/offices — clearance offices in workflow order
router.get("/offices", authenticate, listOffices);

// Notifications (section 7.10)
router.get("/notifications", authenticate, getNotifications);
router.patch("/notifications/read-all", authenticate, readAll);
router.patch("/notifications/:id/read", authenticate, readOne);

// GET /api/documents/:id — view a supporting document (permission-checked)
router.get("/documents/:id", authenticate, downloadDocument);

export default router;
