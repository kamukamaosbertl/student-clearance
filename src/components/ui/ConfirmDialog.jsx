import Button from "./Button";

// Generic "are you sure?" modal — reusable anywhere a destructive or
// hard-to-undo action needs confirmation first (logout today; things
// like reject/delete elsewhere later). Renders nothing when closed.
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-xl animate-page">
        <h2 id="confirm-dialog-title" className="text-[17px] font-semibold text-navy">
          {title}
        </h2>
        {message && <p className="mt-2 text-[13.5px] text-navy-soft">{message}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}