import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Brand from "./Brand";
import ConfirmDialog from "../ui/ConfirmDialog";
import { useAuth } from "../../context/AuthContext";

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
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Any of the three login pages — not authenticated yet.
  const isAuthPage = AUTH_PATHS.includes(location.pathname);

  function confirmLogout() {
    const loginPath = getLoginPathForRole(location.pathname);
    logout();
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