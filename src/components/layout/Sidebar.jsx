import { Link, useLocation } from "react-router-dom";
import { studentNavItems } from "../../data/navigation";

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="flex w-[250px] shrink-0 flex-col gap-5 border-r border-border bg-white px-4 py-5">
      {/* Role tabs removed on purpose — a student's role is decided by
          login, not something they should see or switch client-side.
          Officer/Admin will be separate views reached by logging in
          with those accounts, not a toggle here. */}

      <p className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-navy-soft/70">
        Student screens
      </p>

      <nav className="flex flex-col gap-0.5">
        {studentNavItems.map((item) => {
          const isActive =
            item.key === "clearance-request"
              ? pathname.startsWith("/clearance") &&
                !pathname.includes("progress") &&
                !pathname.includes("feedback")
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