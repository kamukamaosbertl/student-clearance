// The gold utility bar + white nav header from the mockup.
// This sits above the Sidebar on every page — added here in AppShell,
// not per-page, so no individual screen has to remember to include it.
export default function Header() {
  return (
    <header className="flex flex-col">
      {/* thin black strip, purely cosmetic, matches the MUST-VLE reference */}
      <div className="h-1 bg-[#14181C]" aria-hidden="true" />

      <div className="bg-gold px-6 py-2 text-[13px] font-medium text-[#3A2C00]">
        MUST Clearance — graduating student portal
      </div>

      <div className="flex items-center gap-6 border-b border-border bg-white px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          {/* placeholder crest — swap for the real MUST logo image later */}
          <div
            className="size-[38px] shrink-0 rounded-full"
            style={{ background: "conic-gradient(from 180deg, #1B6B45, #E8A93E, #1B6B45)" }}
            aria-hidden="true"
          />
          <div>
            <p className="text-[20px] font-bold leading-none text-teal">MUST Clearance</p>
            <p className="text-[11px] text-navy-soft">Mbarara University of Science and Technology</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-7 text-[14px] font-semibold text-navy">
          <span>Help ▾</span>
          <span>Guidelines ▾</span>
          <span className="text-[13px] font-normal text-navy-soft">🔍 Search</span>
          <button
            type="button"
            className="rounded-full bg-gold px-[18px] py-[9px] text-[14px] font-bold text-[#3A2C00] hover:bg-gold-dark"
          >
            🔒 Log out
          </button>
        </div>
      </div>
    </header>
  );
}