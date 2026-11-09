// Small reusable status pill — reused across the student, officer and admin
// screens so the same state always looks the same everywhere.
// `status` accepts the backend's stage/application states as well as the
// older hyphenated keys.
const STYLES = {
  overdue: "bg-red-50 text-red-600",
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-bg text-teal-dark",
  completed: "bg-green-bg text-teal-dark",
  active: "bg-green-bg text-teal-dark",
  rejected: "bg-red-50 text-red-600",
  inactive: "bg-red-50 text-red-600",
  under_review: "bg-blue-50 text-blue-700",
  "in-review": "bg-blue-50 text-blue-700",
  in_progress: "bg-blue-50 text-blue-700",
  resubmitted: "bg-purple-50 text-purple-700",
  correction_required: "bg-amber-bg text-amber-text",
  correction_requested: "bg-amber-bg text-amber-text",
  "correction-required": "bg-amber-bg text-amber-text",
  "correction-sent": "bg-amber-bg text-amber-text",
  waiting: "bg-surface text-navy-soft",
  not_required: "bg-surface text-navy-soft",
  "not-started": "bg-surface text-navy-soft",
};

export default function StatusBadge({ status, children }) {
  const style = STYLES[status] || "bg-surface text-navy-soft";
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold ${style}`}>
      {children}
    </span>
  );
}
