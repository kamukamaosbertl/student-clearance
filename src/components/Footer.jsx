import { Link } from "react-router-dom";
import mustBadge from "../assets/must-badge.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const linkClass =
    "text-navy-soft transition-colors duration-200 hover:text-gold";

  return (
    <footer className="border-t border-border bg-surface px-6 py-10 md:px-12">
      <div className="mx-auto max-w-[1160px]">

        {/* Main footer */}
        <div className="grid gap-8 md:grid-cols-4">

          {/* Brand */}
          <div className="md:pr-6">
            <Link
              to="/"
              className="group flex items-center gap-3"
              aria-label="MUST Clearance home"
            >
              <img
                src={mustBadge}
                alt="MUST badge"
                className="size-11 object-contain"
              />

              <div>
                <p className="text-[17px] font-bold text-teal transition-colors duration-200 group-hover:text-gold">
                  MUST Clearance
                </p>

                <p className="text-[11px] leading-4 text-navy-soft">
                  Mbarara University of Science and Technology
                </p>
              </div>
            </Link>

            <p className="mt-4 max-w-[280px] text-[13px] leading-relaxed text-navy-soft">
              A simple and convenient way to complete, track and manage your
              graduation clearance online.
            </p>
          </div>

          {/* Information */}
          <div>
            <h3 className="mb-4 text-[14px] font-semibold text-teal">
              Information
            </h3>

            <div className="flex flex-col gap-3 text-[13px]">
              <a href="#how-it-works" className={linkClass}>
                How it works
              </a>

              <a href="#features" className={linkClass}>
                Why it helps
              </a>

              <Link to="/login" className={linkClass}>
                Start clearance
              </Link>
            </div>
          </div>

          {/* Helpful Links */}
          <div>
            <h3 className="mb-4 text-[14px] font-semibold text-teal">
              Helpful Links
            </h3>

            <div className="flex flex-col gap-3 text-[13px]">
              <Link to="/login" className={linkClass}>
                Student login
              </Link>

              <a href="#how-it-works" className={linkClass}>
                Clearance process
              </a>

              <a href="#features" className={linkClass}>
                System features
              </a>
            </div>
          </div>

          {/* Help */}
          <div>
            <h3 className="mb-4 text-[14px] font-semibold text-teal">
              Need Help?
            </h3>

            <p className="max-w-[250px] text-[13px] leading-relaxed text-navy-soft">
              Having trouble with your clearance? Please contact the
              appropriate university office for assistance.
            </p>

            <Link
              to="/login"
              className="mt-4 inline-block text-[13px] font-semibold text-teal transition-colors duration-200 hover:text-gold"
            >
              Go to clearance →
            </Link>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-8 border-t border-border pt-5">
          <div className="flex flex-col gap-3 text-[12px] text-navy-soft md:flex-row md:items-center md:justify-between">

            <p>
              © {currentYear} MUST Clearance. Mbarara University of Science
              and Technology.
            </p>

            <div className="flex gap-5">
              <a href="#how-it-works" className={linkClass}>
                How it works
              </a>

              <a href="#features" className={linkClass}>
                Features
              </a>

              <Link to="/login" className={linkClass}>
                Login
              </Link>
            </div>

          </div>
        </div>

      </div>
    </footer>
  );
}