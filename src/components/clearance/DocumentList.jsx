import { useState } from "react";
import { openDocument, apiErrorMessage } from "../../api/client";
import { formatDate, formatSize } from "../../utils/status";

// List of uploaded supporting documents with a "View" button that opens
// the file through the authenticated API.
export default function DocumentList({ documents, emptyText = "No documents submitted." }) {
  const [error, setError] = useState("");

  if (!documents || documents.length === 0) {
    return <p className="text-[13px] text-navy-soft">{emptyText}</p>;
  }

  async function handleView(id) {
    setError("");
    try {
      await openDocument(id);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not open the document."));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-2.5">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[13.5px] text-navy">{doc.fileName}</span>
            <span className="text-[11.5px] text-navy-soft">
              {formatSize(doc.fileSize)} · {formatDate(doc.uploadedAt)}
              {doc.documentType === "correction" && " · sent with a correction"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleView(doc.id)}
            className="shrink-0 text-[13px] font-semibold text-teal hover:underline"
          >
            View
          </button>
        </div>
      ))}
      {error && <p className="text-[12.5px] text-danger">{error}</p>}
    </div>
  );
}
