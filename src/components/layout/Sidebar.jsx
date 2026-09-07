import { Link, useLocation } from "react-router-dom";
import { studentNavItems, officerNavItems, adminNavItems } from "../../data/navigation";
import { useClearanceForm } from "../../context/ClearanceFormContext";

// Decides which nav list (and caption, if any) to show, based on the
// route — same idea as the student-only version, just extended to
// Officer/Admin instead of hardcoding studentNavItems.
//
// "Log in" is dropped from Officer/Admin since, once you're on a
// dashboard route, it's not a task — only the student list keeps it
// (it still doubles as your build/testing screen list).
//
// No caption for Officer/Admin, per your call that these shouldn't
// carry a section label the way the student list does.
function getSection(pathname) {
  if (pathname.startsWith("/officer")) {
    return {
      role: "officer",
      caption: null,
      items: officerNavItems.filter((item) => item.key !== "login"),
    };
  }
  if (pathname.startsWith("/admin")) {
    return {
      role: "admin",
      caption: null,
      items: adminNavItems.filter((item) => item.key !== "login"),
    };
  }
  return { role: "student", caption: "Student screens", items: studentNavItems };
}

export default function Sidebar() {
  const { pathname } = useLocation();
  const { hasStarted } = useClearanceForm();
  const { role, caption, items } = getSection(pathname);

  return (
    <aside className="flex w-[250px] shrink-0 flex-col gap-5 border-r border-border bg-white px-4 py-5">
      {/* Role tabs removed on purpose — a user's role is decided by
          login, not something they should see or switch client-side.
          Officer/Admin are separate views reached by logging in
          with those accounts. The caption and nav list below switch
          automatically based on the current route. */}

      {caption && (
        <p className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-navy-soft/70">
          {caption}
        </p>
      )}

      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          // Lock-until-started only applies to the student section —
          // Officer/Admin have no equivalent "hasStarted" concept.
          // Dashboard itself is always accessible, since it's the only
          // way IN to starting the wizard.
          const isLocked = role === "student" && item.key !== "dashboard" && !hasStarted;

          const isActive =
            item.key === "clearance-request"
              ? pathname.startsWith("/clearance") &&
                !pathname.includes("progress") &&
                !pathname.includes("feedback")
              : item.key === "request-review"
              ? pathname.startsWith("/officer/request")
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