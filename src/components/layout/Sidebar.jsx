import { Link, useLocation } from "react-router-dom";
import { studentNavItems } from "../../data/navigation";
import { useClearanceForm } from "../../context/ClearanceFormContext";

export default function Sidebar() {
  const { pathname } = useLocation();
  const { hasStarted } = useClearanceForm();

  return (
    <aside className="flex w-[250px] shrink-0 flex-col gap-5 border-r border-border bg-white px-4 py-5">
      <p className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-navy-soft/70">
        Student screens
      </p>

      <nav className="flex flex-col gap-0.5">
        {studentNavItems.map((item) => {
          // NEW: everything except Dashboard is locked until the student
          // has actually reached the wizard at least once — set via
          // startClearance() in PersonalInfoStep. Dashboard itself is
          // always accessible, since it's the only way IN to starting.
          const isLocked = item.key !== "dashboard" && !hasStarted;

          const isActive =
            item.key === "clearance-request"
              ? pathname.startsWith("/clearance") &&
                !pathname.includes("progress") &&
                !pathname.includes("feedback")
              : pathname === item.path;

          if (isLocked) {
            // Rendered as a non-clickable, greyed row with a lock icon —
            // visible so the student knows the screen exists, but can't
            // be clicked into before they've started clearance.
            return (
              <span
                key={item.key}
                title="Start your clearance request first"
                className="flex cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2.5 text-[14px] text-navy-soft/40"
              >
                <svg viewBox="0 0 16 16" fill="none" className="size-3.5 shrink-0" aria-hidden="true">
                  <rect x="3" y="7" width="10" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                {item.label}
              </span>
            );
          }

          return (
            <Link
              key={item.key}
              to={item.path}
              className={[
                "group relative flex items-center gap-2 rounded-lg px-3 py-2.5 text-[14px]",
                "transition-all duration-150 ease-out",
                isActive
                  ? "bg-green-bg font-semibold text-teal-dark"
                  : "text-navy-soft hover:translate-x-0.5 hover:bg-surface hover:text-navy",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-teal",
                  "transition-all duration-200 ease-out",
                  isActive ? "opacity-100" : "opacity-0",
                ].join(" ")}
                aria-hidden="true"
              />
              <span
                className={[
                  "size-1.5 rounded-full transition-colors duration-150",
                  isActive ? "bg-teal" : "bg-border-strong group-hover:bg-navy-soft",
                ].join(" ")}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}