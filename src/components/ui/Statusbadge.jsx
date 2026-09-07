// Small reusable status pill — reused across the Officer dashboard,
// pending queue, request review, and processing history screens so
// "Overdue"/"Pending"/"Approved"/etc. always look the same everywhere.
//
// If you already have a Badge/Pill component somewhere in
// components/ui, use that instead and delete this one.
const STYLES = {
  overdue: "bg-red-50 text-red-600",
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-bg text-teal-dark",
  rejected: "bg-red-50 text-red-600",
  "in-review": "bg-amber-50 text-amber-700",
  "correction-required": "bg-amber-50 text-amber-700",
  "correction-sent": "bg-amber-50 text-amber-700",
  "not-started": "bg-surface text-navy-soft",
};

export default function StatusBadge({ status, children }) {
  const style = STYLES[status] || "bg-surface text-navy-soft";
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-[12px] font-semibold ${style}`}>
      {children}
    </span>
  );
}