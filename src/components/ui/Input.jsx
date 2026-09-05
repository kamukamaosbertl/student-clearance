export default function Input({
  label,
  sourceLabel, // e.g. "from account" / "from record" - shown next to label, read-only fields only
  required = false,
  hint,
  error,       // ← validation message. When set: border turns red and this replaces `hint`.
  readOnly = false,
  className = "",
  ...inputProps
}) {
  return (
    <label className={["flex flex-col gap-1.5", className].join(" ")}>
      <span className="flex items-center gap-1.5 text-[13.5px]">
        <span className="font-medium text-navy">{label}</span>
        {required && <span className="text-danger">*</span>}
        {sourceLabel && <span className="text-[11px] text-muted">{sourceLabel}</span>}
      </span>
      <input
        readOnly={readOnly}
        // aria-invalid + aria-describedby wire the error message to screen readers
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${label}-error` : undefined}
        className={[
          "h-10 w-full rounded-field border px-2.5 text-[13.5px] outline-none",
          readOnly
            ? "bg-surface text-body cursor-default border-border"
            : "bg-white text-navy placeholder:text-muted focus:border-teal",
          // VALIDATION DISPLAY: red border when `error` is truthy, overrides the default border color above
          error && !readOnly ? "border-danger focus:border-danger" : !readOnly && "border-border",
        ].join(" ")}
        {...inputProps}
      />
      {/* VALIDATION DISPLAY: error message takes priority over the normal hint text */}
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
