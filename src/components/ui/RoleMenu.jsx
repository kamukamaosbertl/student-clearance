import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Button from "./Button";

// ── Small inline icons, matching the hand-written style already used
// in LandingPage.jsx — no icon library installed.
function IconGraduation(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 3 2 8l10 5 10-5-10-5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M6 10.5V16c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5v-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M21 9v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconBriefcase(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="8" width="18" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3 13h18" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function IconShieldUser(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 15c.5-1.4 1.6-2 3-2s2.5.6 3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const roles = [
  {
    label: "Student",
    text: "Submit and track your clearance",
    to: "/login",
    icon: IconGraduation,
  },
  {
    label: "Officer",
    text: "Review requests assigned to your office",
    to: "/officer/login",
    icon: IconBriefcase,
  },
  {
    label: "Admin",
    text: "Manage accounts and monitor transactions",
    to: "/admin/login",
    icon: IconShieldUser,
  },
];

/**
 * Dropdown that lets the visitor pick which portal they want to log
 * into — Student / Officer / Admin — then routes them straight to
 * that role's login page. Drop this in anywhere the old
 * `<Link to="/login"><Button>Log in</Button></Link>` used to sit.
 */
export default function RoleMenu({ className = "" }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Log in
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-20 w-[280px] overflow-hidden rounded-2xl border border-border bg-white shadow-lg"
        >
          <p className="px-4 pt-3.5 pb-2 text-[11px] font-bold uppercase tracking-wide text-navy-soft">
            Log in as
          </p>
          {roles.map(({ label, text, to, icon: Icon }) => (
            <Link
              key={label}
              to={to}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-bg text-teal-dark">
                <Icon className="size-4.5" />
              </span>
              <span>
                <span className="block text-[14px] font-semibold text-navy">{label}</span>
                <span className="block text-[12px] text-navy-soft">{text}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}