import { Link } from "react-router-dom";
import mustBadge from "../assets/must-badge.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const linkClass =
    "text-white/75 transition-colors duration-200 hover:text-gold";

  return (
    <footer className="bg-teal px-6 py-12 text-white md:px-12">
      <div className="mx-auto max-w-[1160px]">

        {/* ==================== MAIN FOOTER ==================== */}
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">

          {/* ==================== BRAND ==================== */}
          <div className="max-w-[330px]">
            <Link
              to="/"
              className="group inline-flex items-center gap-3"
              aria-label="MUST Clearance home"
            >
              {/* MUST Badge */}
              <div className="flex size-12 items-center justify-center rounded-xl bg-white p-1.5">
                <img
                  src={mustBadge}
                  alt="MUST badge"
                  className="size-full object-contain"
                />
              </div>

              {/* Brand Name */}
              <div>
                <p className="text-[18px] font-bold text-white transition-colors duration-200 group-hover:text-gold">
                  MUST Clearance
                </p>

                <p className="text-[11px] leading-4 text-white/70">
                  Mbarara University of Science and Technology
                </p>
              </div>
            </Link>

            {/* Description */}
            <p className="mt-5 text-[13.5px] leading-relaxed text-white/75">
              A simple and convenient way to complete, track and manage your
              graduation clearance online.
            </p>
          </div>

          {/* ==================== QUICK LINKS ==================== */}
          <div>
            <h3 className="mb-5 text-[14px] font-semibold text-white">
              Quick Links
            </h3>

            <div className="flex flex-col gap-3 text-[13.5px]">

              <a
                href="#how-it-works"
                className={linkClass}
              >
                How it works
              </a>

              <a
                href="#features"
                className={linkClass}
              >
                Why it helps
              </a>

              <Link
                to="/login"
                className={linkClass}
              >
                Student login
              </Link>

            </div>
          </div>

          {/* ==================== NEED HELP ==================== */}
          <div>
            <h3 className="mb-5 text-[14px] font-semibold text-white">
              Need Help?
            </h3>

            <p className="max-w-[270px] text-[13.5px] leading-relaxed text-white/75">
              Having trouble with your clearance? Please contact the
              appropriate university office for assistance.
            </p>

            <Link
              to="/login"
              className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-gold transition-all duration-200 hover:gap-2"
            >
              Go to clearance
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* ==================== BOTTOM FOOTER ==================== */}
        <div className="mt-10 border-t border-white/15 pt-5">

          <div className="flex flex-col gap-3 text-[12px] text-white/60 md:flex-row md:items-center md:justify-between">

            {/* Copyright */}
            <p>
              © {currentYear} MUST Clearance. Mbarara University of Science
              and Technology.
            </p>

            {/* Back to top */}
            <a
              href="#"
              className="transition-colors duration-200 hover:text-gold"
            >
              Back to top ↑
            </a>

          </div>
        </div>

      </div>
    </footer>
  );
}