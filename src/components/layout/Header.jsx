import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Brand from "./Brand";
import ConfirmDialog from "../ui/ConfirmDialog";
import { useAuth } from "../../context/AuthContext";
import { useLiveStatus } from "../../context/LiveEventsContext";
import { IconBell } from "../icons";
import api from "../../api/client";

const AUTH_PATHS = ["/login", "/officer/login", "/admin/login"];

// Sends a logged-out user back to the right portal's login page,
// based on which section they were in — same "check the path
// prefix" idea used in Sidebar.jsx.
function getLoginPathForRole(pathname) {
  if (pathname.startsWith("/officer")) return "/officer/login";
  if (pathname.startsWith("/admin")) return "/admin/login";
  return "/login";
}

// The gold utility bar + white nav header from the mockup.
// This sits above the Sidebar on every page — added here in AppShell,
// not per-page, so no individual screen has to remember to include it.
export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, role, isAuthenticated } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const live = useLiveStatus();

  // Why the server ended the last session (idle timeout, logged out
  // elsewhere, ...) — shown once, on the login page
  const [sessionMessage, setSessionMessage] = useState(() => {
    try {
      const message = sessionStorage.getItem("sessionEndedMessage");
      sessionStorage.removeItem("sessionEndedMessage");
      return message;
    } catch {
      return null;
    }
  });

  // Any of the three login pages — not authenticated yet.
  const isAuthPage = AUTH_PATHS.includes(location.pathname);

  // Students and officers receive notifications (section 7.10)
  const notificationsPath =
    role === "student" ? "/notifications" : role === "officer" ? "/officer/notifications" : null;
  const showBell = isAuthenticated && !isAuthPage && notificationsPath;

  // Refresh the unread count on every page change, every minute, and
  // whenever the notifications page marks something as read
  useEffect(() => {
    if (!showBell) return undefined;
    let cancelled = false;
    const refresh = () =>
      api
        .get("/notifications", { params: { unread: true } })
        .then(({ data }) => !cancelled && setUnreadCount(data.unreadCount))
        .catch(() => {});
    refresh();
    const timer = setInterval(refresh, 60_000);
    window.addEventListener("notifications:changed", refresh);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("notifications:changed", refresh);
    };
  }, [showBell, location.pathname]);

  async function confirmLogout() {
    const loginPath = getLoginPathForRole(location.pathname);
    await logout(); // ends the session on the server too
    setShowLogoutConfirm(false);
    // replace: true so the just-left protected page doesn't sit in
    // history right above the login page — RequireAuth is what
    // actually blocks Back from showing protected content, this just
    // keeps the history stack tidy.
    navigate(loginPath, { replace: true });
  }

  return (
    <header className="flex flex-col">
      {/* Thin top strip */}
      <div className="h-1 bg-[#14181C]" aria-hidden="true" />

      {/* Gold utility bar
      <div className="bg-gold px-6 py-2 text-[13px] font-medium text-[#3A2C00] md:px-8">
        MUST Clearance — graduating student portal
      </div>*/}

      {/* Main header */}
      <div className="flex items-center gap-6 border-b border-border bg-white px-6 py-3.5 md:px-8">
        <Brand
          showSubtitle
          imgSize={48}
          titleClassName="text-[20px] font-bold leading-none text-teal"
        />

        {/* Navigation */}
        <div className="ml-auto flex items-center gap-5 text-[14px] font-semibold text-navy md:gap-7">
          <button type="button" className="hidden transition-colors hover:text-teal md:block">
            Help <span className="text-[11px]">▾</span>
          </button>

          <button type="button" className="hidden transition-colors hover:text-teal md:block">
            Guidelines <span className="text-[11px]">▾</span>
          </button>

          <button
            type="button"
            className="hidden text-[13px] font-normal text-navy-soft transition-colors hover:text-teal md:block"
          >
            🔍 Search
          </button>

          {isAuthenticated && !isAuthPage && live.status !== "off" && (
            <span
              className="hidden items-center gap-1.5 text-[12px] font-medium text-navy-soft md:flex"
              title={live.status === "live" ? `Live updates on (server ${live.instance})` : "Reconnecting to live updates…"}
            >
              <span
                className={[
                  "size-2 rounded-full",
                  live.status === "live" ? "bg-teal" : "animate-pulse bg-gold",
                ].join(" ")}
                aria-hidden="true"
              />
              {live.status === "live" ? "Live" : "Reconnecting"}
            </span>
          )}

          {showBell && (
            <Link
              to={notificationsPath}
              className="relative text-navy transition-colors hover:text-teal"
              aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
            >
              <IconBell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-red-text px-1 text-[10.5px] font-bold leading-[18px] text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* Login / Logout */}
          {isAuthPage ? (
            <Link
              to={location.pathname}
              className="rounded-full bg-gold px-[18px] py-[9px] text-[14px] font-bold text-[#3A2C00] transition-colors hover:bg-gold-dark"
            >
              Log in
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="rounded-full bg-gold px-[18px] py-[9px] text-[14px] font-bold text-[#3A2C00] transition-colors hover:bg-gold-dark"
            >
              🔒 Log out
            </button>
          )}
        </div>
      </div>

      {sessionMessage && (
        <div className="flex items-center justify-between gap-4 border-b border-amber-200 bg-amber-bg px-6 py-2.5 text-[13.5px] text-amber-text md:px-8">
          <span>{sessionMessage}</span>
          <button type="button" onClick={() => setSessionMessage(null)} className="font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Log out of MUST Clearance?"
        message="You'll need to sign in again to continue."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </header>
  );
}