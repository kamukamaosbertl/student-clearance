export default function Textarea({ label, hint, error, className = "", ...textareaProps }) {
  return (
    <label className={["flex flex-col gap-1.5", className].join(" ")}>
      <span className="text-[13.5px] font-medium text-navy">{label}</span>
      <textarea
        rows={3}
        aria-invalid={Boolean(error)}
        className={[
          "w-full resize-none rounded-field border bg-white px-2.5 py-2.5 text-[13.5px] text-navy placeholder:text-muted outline-none transition-colors duration-150 focus:border-teal",
          // VALIDATION DISPLAY: this field is optional in the current flow (see ClearanceDetailsStep),
          // so `error` is rarely passed — kept here for consistency / future required-notes cases.
          error ? "border-danger focus:border-danger" : "border-border",
        ].join(" ")}
        {...textareaProps}
      />
      {error ? <span className="text-[12px] text-danger">{error}</span> : hint && <span className="text-[12px] text-body">{hint}</span>}
    </label>
  );
}