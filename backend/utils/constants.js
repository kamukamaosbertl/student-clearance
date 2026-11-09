// Stage states from section 10.0 of the project plan
export const STAGE_STATUS = Object.freeze({
  WAITING: "waiting", // earlier offices have not finished yet
  PENDING: "pending", // in the office's work queue
  UNDER_REVIEW: "under_review", // an officer has opened it
  APPROVED: "approved",
  REJECTED: "rejected",
  CORRECTION_REQUIRED: "correction_required",
  RESUBMITTED: "resubmitted", // student answered a correction / rejection
  NOT_REQUIRED: "not_required", // optional office that does not apply
});

// States in which an officer can record a decision
export const ACTIONABLE_STATUSES = [
  STAGE_STATUS.PENDING,
  STAGE_STATUS.UNDER_REVIEW,
  STAGE_STATUS.RESUBMITTED,
];

// States that let the workflow move on to the next office
export const COMPLETED_STATUSES = [STAGE_STATUS.APPROVED, STAGE_STATUS.NOT_REQUIRED];

// States in which the student is expected to respond
export const STUDENT_ACTION_STATUSES = [
  STAGE_STATUS.CORRECTION_REQUIRED,
  STAGE_STATUS.REJECTED,
];

export const APPLICATION_STATUS = Object.freeze({
  DRAFT: "draft",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  REJECTED: "rejected",
});

// Officer decisions accepted by POST /api/officer/requests/:id/decision
export const DECISIONS = Object.freeze({
  APPROVE: "approve",
  REJECT: "reject",
  CORRECTION: "correction",
});

// Requests waiting longer than this show up as "needs attention"
export const OVERDUE_DAYS = 3;

// Upload rules — kept in step with frontend/src/utils/validators.js
export const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES_PER_REQUEST = 20;
