import { useState } from "react";

export default function FileDropzone({ label, hint, error, files, onAdd, onRemove }) {
  const inputId = "document-upload-input";
  const [isDragActive, setIsDragActive] = useState(false);

  const handleChange = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length) onAdd(picked);
    e.target.value = "";
  };

  // ── Drag-and-drop handlers ──────────────────────────────────────────
  // Browsers block drop by default, so preventDefault() is required on
  // both dragover and drop, not just drop, or the browser tries to
  // navigate to/open the dropped file instead of letting us handle it.
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length) onAdd(dropped);
  };

  return (
    <div className="flex w-full flex-col gap-1.5">
      <span className="text-[13.5px] font-medium text-navy">{label}</span>

      <label
        htmlFor={inputId}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          "flex h-[70px] w-full cursor-pointer flex-col items-center justify-center rounded-field border border-dashed text-center",
          "transition-colors duration-150",
          error
            ? "border-danger bg-white"
            : isDragActive
              ? "border-teal bg-green-bg" // visual feedback while a file is hovering over the box
              : "border-border bg-white hover:border-teal",
        ].join(" ")}
      >
        <span className="text-[13.5px] text-navy">
          {isDragActive ? "Drop to upload" : "Click to choose a file, or drag it here"}
        </span>
        <span className="text-[12px] text-muted">PDF, JPG or PNG · up to 5MB</span>
        <input
          id={inputId}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleChange}
        />
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

      {error ? <span className="text-[12px] text-danger">{error}</span> : hint && <span className="text-[12px] text-body">{hint}</span>}
    </div>
  );
}