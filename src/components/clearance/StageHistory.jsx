import { EVENT_LABELS, formatDateTime } from "../../utils/status";

// Timeline of everything that happened on one office's stage, including
// officer comments and the student's messages (the feedback thread).
export default function StageHistory({ events, hideSystem = true }) {
  const visible = (events || []).filter((e) => !hideSystem || e.action !== "queued");

  if (visible.length === 0) {
    return <p className="text-[13px] text-navy-soft">No activity yet.</p>;
  }

  return (
    <ol className="flex flex-col gap-3">
      {visible.map((event) => (
        <li key={event.id} className="flex flex-col gap-0.5 border-l-2 border-border pl-3">
          <span className="text-[13px] font-semibold text-navy">
            {EVENT_LABELS[event.action] || event.action}
            {event.actor && event.actor.role !== "student" && (
              <span className="font-normal text-navy-soft"> · {event.actor.fullName}</span>
            )}
          </span>
          <span className="text-[11.5px] text-navy-soft">{formatDateTime(event.createdAt)}</span>
          {event.comment && (
            <p className="mt-1 rounded-field bg-surface px-3 py-2 text-[13px] text-navy">"{event.comment}"</p>
          )}
        </li>
      ))}
    </ol>
  );
}
