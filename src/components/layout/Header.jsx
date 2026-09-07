import { Link, useLocation, useNavigate } from "react-router-dom";
import mustBadge from "../../assets/must-badge.png";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  // Login is a page before authentication.
  const isLoginPage = location.pathname === "/login";

  const handleLogout = () => {
    // TODO: clear authentication/session data here
    navigate("/login");
  };

  return (
    <header className="flex flex-col">
      {/* Thin top strip */}
      <div className="h-1 bg-[#14181C]" aria-hidden="true" />

      {/* Gold utility bar */}
      <div className="bg-gold px-6 py-2 text-[13px] font-medium text-[#3A2C00] md:px-8">
        MUST Clearance — graduating student portal
      </div>

      {/* Main header */}
      <div className="flex items-center gap-6 border-b border-border bg-white px-6 py-3.5 md:px-8">
        
        {/* MUST branding */}
        <Link
          to="/"
          className="flex items-center gap-3"
          aria-label="MUST Clearance home"
        >
          <img
            src={mustBadge}
            alt="MUST badge"
            className="size-[48px] shrink-0 object-contain"
          />

          <div>
            <p className="text-[20px] font-bold leading-none text-teal">
              MUST Clearance
            </p>

            <p className="mt-1 text-[11px] text-navy-soft">
              Mbarara University of Science and Technology
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <div className="ml-auto flex items-center gap-5 text-[14px] font-semibold text-navy md:gap-7">
          
          <button
            type="button"
            className="hidden transition-colors hover:text-teal md:block"
          >
            Help <span className="text-[11px]">▾</span>
          </button>

          <button
            type="button"
            className="hidden transition-colors hover:text-teal md:block"
          >
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