import Brand from "./Brand";

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
        <Brand
          showSubtitle
          imgSize={38}
          titleClassName="text-[20px] font-bold leading-none text-teal"
        />

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