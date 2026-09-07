import { Link } from "react-router-dom";
import mustBadge from "../../assets/must-badge.png";

// Single source of truth for the "MUST Clearance" logo mark — used by
// Header.jsx (so it appears on every page via AppShell/AuthShell) and
// by LandingPage.jsx. Sizing/subtitle differ slightly between the two
// contexts, so those are configurable rather than hardcoded.
export default function Brand({
  className = "",
  showSubtitle = false,
  imgSize = 36,
  titleClassName = "text-[18px] font-bold text-teal",
}) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={mustBadge}
        alt="MUST badge"
        style={{ width: imgSize, height: imgSize }}
        className="shrink-0 object-contain"
      />
      <span className="flex flex-col">
        <span className={titleClassName}>MUST Clearance</span>
        {showSubtitle && (
          <span className="text-[11px] text-navy-soft">
            Mbarara University of Science and Technology
          </span>
        )}
      </span>
    </Link>
  );
}