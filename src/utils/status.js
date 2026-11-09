// Labels and formatting shared by the student, officer and admin screens.
// Status keys match the backend (section 10.0 stage states).

export const STAGE_LABELS = {
  waiting: "Waiting",
  pending: "Pending",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  correction_required: "Correction required",
  resubmitted: "Resubmitted",
  not_required: "Not required",
};

export const APPLICATION_LABELS = {
  draft: "Draft",
  in_progress: "In progress",
  completed: "Completed",
  rejected: "Rejected",
};

export const DECISION_LABELS = {
  approved: "Approved",
  rejected: "Rejected",
  correction_requested: "Correction requested",
};

// Wording for entries in a stage's history
export const EVENT_LABELS = {
  submitted: "Submitted by student",
  skipped: "Marked not applicable",
  queued: "Reached the office",
  opened: "Opened by officer",
  approved: "Approved",
  rejected: "Rejected",
  correction_requested: "Correction requested",
  resubmitted: "Resubmitted by student",
};

// Stages the officer can still act on
export const ACTIONABLE = ["pending", "under_review", "resubmitted"];

// Stages that need the student to respond
export const NEEDS_STUDENT = ["correction_required", "rejected"];

export const ROLE_LABELS = { student: "Student", officer: "Officer", admin: "Administrator" };

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function timeAgo(value) {
  if (!value) return "";
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
