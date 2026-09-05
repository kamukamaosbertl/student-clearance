export default function FileDropzone({ label, hint, error, files, onAdd, onRemove }) {
  const inputId = "document-upload-input";

  const handleChange = (e) => {
    const picked = Array.from(e.target.files || []);
    // VALIDATION HOOK: file-level checks (type/size) run in the parent
    // (DocumentsStep.jsx) inside onAdd, not here — this component stays
    // dumb/presentational and just reports what the user picked.
    if (picked.length) onAdd(picked);
    e.target.value = ""; // allow re-selecting the same file
  };

  return (
    <div className="flex w-full flex-col gap-1.5">
      <span className="text-[13.5px] font-medium text-navy">{label}</span>

      <label
        htmlFor={inputId}
        className={[
          "flex h-[70px] w-full cursor-pointer flex-col items-center justify-center rounded-field border border-dashed text-center hover:border-teal",
          // VALIDATION DISPLAY: red dashed border when the last add/submit attempt produced a file error
          error ? "border-danger bg-white" : "border-border bg-white",
        ].join(" ")}
      >
        <span className="text-[13.5px] text-navy">Click to choose a file, or drag it here</span>
        <span className="text-[12px] text-muted">PDF, JPG or PNG · up to 5MB</span>
        <input id={inputId} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleChange} />
      </label>

      {files.length > 0 && (
        <ul className="flex flex-col gap-0 overflow-hidden rounded-field border border-border">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className={["flex items-center justify-between px-2.5 py-1.5 text-[13.5px]", index !== 0 && "border-t border-border"].join(" ")}
            >
              <span className="text-navy">
                {file.name} · {Math.round(file.size / 1024)} KB
              </span>
              <button type="button" onClick={() => onRemove(index)} className="text-[13px] text-danger hover:underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* VALIDATION DISPLAY: shows either a rejected-file message (bad type/size) or the
          "attach at least one document" message — parent decides which string to pass in */}
      {error ? <span className="text-[12px] text-danger">{error}</span> : hint && <span className="text-[12px] text-body">{hint}</span>}
    </div>
  );
}
