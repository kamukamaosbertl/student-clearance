export default function Select({
  label,
  sourceLabel,
  required = false,
  hint,
  error,
  className = "",
  children,
  ...selectProps
}) {
  return (
    <label className={["flex flex-col gap-1.5", className].join(" ")}>
      <span className="flex items-center gap-1.5 text-[13.5px]">
        <span className="font-medium text-navy">{label}</span>
        {required && <span className="text-danger">*</span>}
        {sourceLabel && <span className="text-[11px] text-muted">{sourceLabel}</span>}
      </span>

      {/* relative wrapper so the arrow icon can sit on top of the select */}
      <div className="relative">
        <select
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${label}-error` : undefined}
          className={[
            "h-10 w-full appearance-none rounded-field border bg-white px-2.5 pr-9 text-[13.5px] text-navy outline-none",
            "transition-colors duration-150 focus:border-teal",
            error ? "border-danger focus:border-danger" : "border-border",
          ].join(" ")}
          {...selectProps}
        >
          {children}
        </select>

        {/* custom arrow — replaces the native one removed by appearance-none */}
        <svg
          className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {error ? (
        <span id={`${label}-error`} className="text-[12px] text-danger">
          {error}
        </span>
      ) : (
        hint && <span className="text-[12px] text-body">{hint}</span>
      )}
    </label>
  );
}