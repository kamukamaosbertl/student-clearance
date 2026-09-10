import { Link } from "react-router-dom";
import mustBadge from "../assets/must-badge.png";

// Small inline icons — kept local to this file rather than the
// shared icons module, since this is the only place they're used.
function IconMail(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconPhone(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M6.5 3.5h3l1.3 4.2-2 1.6a11 11 0 0 0 5.9 5.9l1.6-2 4.2 1.3v3a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 5 5.1a1.5 1.5 0 0 1 1.5-1.6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconGlobe(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 12h17M12 3.5c2.2 2.3 3.3 5.2 3.3 8.5s-1.1 6.2-3.3 8.5c-2.2-2.3-3.3-5.2-3.3-8.5S9.8 5.8 12 3.5Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function IconArrowUp(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const linkClass = "text-white/75 transition-colors duration-200 hover:text-gold";

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <footer className="bg-teal-dark text-white">
      <div className="mx-auto max-w-[1160px] px-6 py-12 md:px-12">
        <div className="grid gap-10 md:grid-cols-4">

          {/* Brand */}
          <div className="md:pr-6">
            <Link to="/" className="group flex items-center gap-3" aria-label="MUST Clearance home">
              <img src={mustBadge} alt="MUST badge" className="size-11 object-contain" />
              <div>
                <p className="text-[17px] font-bold text-white transition-colors duration-200 group-hover:text-gold">
                  MUST Clearance
                </p>
                <p className="text-[11px] leading-4 text-white/60">
                  Mbarara University of Science and Technology
                </p>
              </div>
            </Link>
          </div>

          {/* About */}
          <div>
            <h3 className="mb-4 text-[14px] font-semibold text-gold">About MUST Clearance</h3>
            <p className="max-w-[260px] text-[13px] leading-relaxed text-white/75">
              The official graduation clearance platform for MUST  submit once, track
              every office's decision, and finish your clearance without the queues.
            </p>
          </div>

          {/* Information */}
          <div>
            <h3 className="mb-4 text-[14px] font-semibold text-gold">Information</h3>
            <div className="flex flex-col gap-3 text-[13px]">
              <a href="#how-it-works" className={linkClass}>How it works</a>
              <a href="#features" className={linkClass}>Why it helps</a>
              <Link to="/login" className={linkClass}>Start clearance</Link>
            </div>
          </div>

          {/* Support contacts */}
          <div>
            <h3 className="mb-4 text-[14px] font-semibold text-gold">Support Contacts</h3>
            <div className="flex flex-col gap-3 text-[13px]">
              <a href="mailto:support@must.ac.ug" className={`flex items-center gap-2.5 ${linkClass}`}>
                <IconMail className="size-4 shrink-0" />
                support@must.ac.ug
              </a>
              <a href="tel:+256778135158" className={`flex items-center gap-2.5 ${linkClass}`}>
                <IconPhone className="size-4 shrink-0" />
                +256 778 135158
              </a>
              <a
                href="https://www.must.ac.ug"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2.5 ${linkClass}`}
              >
                <IconGlobe className="size-4 shrink-0" />
                MUST Website
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar — slightly darker band, matches the two-tone look
          from the reference image without needing a second color token */}
      <div className="border-t border-white/10 bg-black/10">
        <div className="mx-auto flex max-w-[1160px] flex-col-reverse items-center justify-between gap-4 px-6 py-5 md:flex-row md:px-12">
          <p className="text-[12px] text-white/60">
            © {currentYear} MUST Clearance. Mbarara University of Science and Technology.
          </p>

          <div className="flex items-center gap-5">


            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Back to top"
              className="ml-1 flex size-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-gold hover:text-[#3A2C00]"
            >
              <IconArrowUp className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}