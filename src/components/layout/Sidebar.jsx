import { Link, useLocation } from "react-router-dom";
import { studentNavItems, officerNavItems, adminNavItems } from "../../data/navigation";

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
    return { caption: null, items: officerNavItems.filter((item) => item.key !== "login") };
  }
  if (pathname.startsWith("/admin")) {
    return { caption: null, items: adminNavItems.filter((item) => item.key !== "login") };
  }
  return { caption: "Student screens", items: studentNavItems };
}

export default function Sidebar() {
  const { pathname } = useLocation();
  const { caption, items } = getSection(pathname);

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
          const isActive =
            item.key === "clearance-request"
              ? pathname.startsWith("/clearance") &&
                !pathname.includes("progress") &&
                !pathname.includes("feedback")
              : item.key === "request-review"
              ? pathname.startsWith("/officer/request")
              : pathname === item.path;

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