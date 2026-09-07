import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Textarea from "../../components/ui/Textarea";
import { officeName, pendingRequests } from "../../data/mockOfficerRequests";

const DECISION_LABELS = {
  approve: "Approved",
  reject: "Rejected",
  correction: "Correction requested",
};

export default function RequestReview() {
  const { id } = useParams();
 
  // Falls back to the first mock record if the id in the URL isn't
  // found — remove that fallback once this reads from a real API,
  // where a missing id should show a proper "not found" state.
  const request = useMemo(
    () => pendingRequests.find((r) => r.id === id) || pendingRequests[0],
    [id]
  );

  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [decidedAction, setDecidedAction] = useState(null);

  function handleDecision(action) {
    if (action !== "approve" && !comment.trim()) {
      setCommentError("Add a comment so the student knows what to fix.");
      return;
    }
    setCommentError("");
    // TODO: call the real approve/reject/request-correction endpoint here.
    console.log("Officer decision:", { requestId: request.id, action, comment });
    setDecidedAction(action);
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={`Officer · ${officeName}`}
        title={`${request.student} — ${request.regNo}`}
        description={`${request.programme} · Submitted ${request.submitted}`}
      />

      <Card>
        <h3 className="mb-3 text-[15px] font-semibold text-navy">Submitted documents</h3>
        {request.documents.length === 0 ? (
          <p className="text-[13.5px] text-navy-soft">No documents submitted yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {request.documents.map((doc) => (
              <div
                key={doc.name}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5"
              >
                <span className="text-[13.5px] text-navy">
                  {doc.name} · {doc.size}
                </span>
                <button type="button" className="text-[13px] font-semibold text-teal hover:underline">
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {request.note && (
        <Card>
          <h3 className="mb-2 text-[15px] font-semibold text-navy">Notes from student</h3>
          <p className="text-[13.5px] italic text-navy-soft">"{request.note}"</p>
        </Card>
      )}

      <Card>
        <h3 className="text-[15px] font-semibold text-navy">Decision</h3>
        <p className="mb-4 text-[13.5px] text-navy-soft">
          Approve, reject, or ask the student to correct something before you decide.
        </p>

        {decidedAction ? (
          <div className="rounded-xl bg-green-bg px-4 py-4 text-center">
            <p className="text-[14px] font-semibold text-teal-dark">
              Decision recorded: {DECISION_LABELS[decidedAction]}
            </p>
          </div>
        ) : (
          <>
            <Textarea
              label="Comment"
              hint="Shown to student if you reject or request correction"
              placeholder="e.g. Outstanding book fine of UGX 15,000"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              error={commentError}
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" onClick={() => handleDecision("approve")}>
                Approve stage
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="!border-gold !bg-gold !text-[#3A2C00] hover:!bg-gold-dark"
                onClick={() => handleDecision("correction")}
              >
                Request correction
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="!border-red-400 !text-red-600 hover:!bg-red-50"
                onClick={() => handleDecision("reject")}
              >
                Reject
              </Button>
            </div>
          </>
        )}
      </Card>
    </AppShell>
  );
}