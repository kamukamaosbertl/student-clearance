import { Link, useLocation, useNavigate } from "react-router-dom";
import Brand from "./Brand";
import { useAuth } from "../../context/AuthContext";

// The gold utility bar + white nav header from the mockup.
// This sits above the Sidebar on every page — added here in AppShell,
// not per-page, so no individual screen has to remember to include it.
export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Login is a page before authentication.
  const isLoginPage = location.pathname === "/login";

  const handleLogout = async () => {
    await logout().catch(() => {});
    navigate("/login");
  };

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
          {isLoginPage ? (
            <Link
              to="/login"
              className="rounded-full bg-gold px-[18px] py-[9px] text-[14px] font-bold text-[#3A2C00] transition-colors hover:bg-gold-dark"
            >
              Log in
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-gold px-[18px] py-[9px] text-[14px] font-bold text-[#3A2C00] transition-colors hover:bg-gold-dark"
            >
              🔒 Log out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}