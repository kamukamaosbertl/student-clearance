import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Textarea from "../../components/ui/Textarea";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import StatusBadge from "../../components/ui/Statusbadge";
import DocumentList from "../../components/clearance/DocumentList";
import StageHistory from "../../components/clearance/StageHistory";
import api, { apiErrorMessage } from "../../api/client";
import { useLiveEvent } from "../../context/LiveEventsContext";
import { STAGE_LABELS, formatDate, formatDateTime } from "../../utils/status";

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-[13.5px] last:border-none">
      <span className="text-navy-soft">{label}</span>
      <span className="text-right font-medium text-navy">{value || "—"}</span>
    </div>
  );
}

// Sections 7.6–7.8 — review one student's stage and record a decision.
// The :id in the URL is the clearance stage id.
export default function RequestReview() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loadError, setLoadError] = useState("");

  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [serverError, setServerError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [lastDecision, setLastDecision] = useState("");

  // Opening the request also marks it "under review" on the server
  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/officer/requests/${id}`);
      setRequest(data.request);
      setLoadError("");
    } catch (err) {
      setLoadError(apiErrorMessage(err, "This request could not be loaded."));
    }
  }, [id]);

  // If the student resubmits while the officer has this page open, it updates
  useLiveEvent("clearance.changed", load);

  useEffect(() => {
    setRequest(null);
    setComment("");
    setLastDecision("");
    load();
  }, [load]);

  async function submitDecision(action) {
    if (action !== "approve" && !comment.trim()) {
      setCommentError("Add a comment so the student knows what to fix.");
      return;
    }
    setCommentError("");
    setServerError("");
    setIsSaving(true);
    try {
      await api.post(`/officer/requests/${id}/decision`, { action, comment });
      setLastDecision(action);
      setComment("");
      await load();
    } catch (err) {
      setServerError(apiErrorMessage(err, "The decision could not be saved."));
    } finally {
      setIsSaving(false);
      setConfirmReject(false);
    }
  }

  if (loadError) {
    return (
      <AppShell>
        <PageHeader eyebrow="Officer" title="Request not available" />
        <Card>
          <p className="text-[13.5px] text-danger">{loadError}</p>
          <Link to="/officer/queue" className="text-[13.5px] font-semibold text-teal hover:underline">
            ← Back to pending requests
          </Link>
        </Card>
      </AppShell>
    );
  }

  if (!request) {
    return (
      <AppShell>
        <PageHeader eyebrow="Officer" title="Loading request…" />
      </AppShell>
    );
  }

  const { student, application } = request;

  return (
    <AppShell>
      <PageHeader
        eyebrow={`Officer · ${request.office.name}`}
        title={`${student.fullName} — ${student.studentId}`}
        description={`${student.programme || "Programme not recorded"} · Submitted ${formatDate(application.startedAt)}`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-navy">Student information</h3>
            <StatusBadge status={request.status}>{STAGE_LABELS[request.status]}</StatusBadge>
          </div>
          <div>
            <InfoRow label="Faculty" value={student.faculty} />
            <InfoRow label="Department" value={student.department} />
            <InfoRow label="Email" value={application.contactEmail} />
            <InfoRow label="Phone" value={application.phone} />
            <InfoRow label="Year of study" value={application.yearOfStudy} />
            <InfoRow label="Expected graduation" value={application.graduationYear} />
            <InfoRow label="Reason" value={application.reason} />
          </div>
        </Card>

        <Card>
          <h3 className="text-[15px] font-semibold text-navy">Clearance workflow</h3>
          <ol className="flex flex-col gap-2">
            {request.workflow.map((step) => (
              <li key={step.slug} className="flex items-center justify-between text-[13.5px]">
                <span className={step.slug === request.office.slug ? "font-semibold text-navy" : "text-navy-soft"}>
                  {step.office}
                  {step.slug === request.office.slug && " (you)"}
                </span>
                <StatusBadge status={step.status}>{STAGE_LABELS[step.status]}</StatusBadge>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card>
        <h3 className="text-[15px] font-semibold text-navy">Submitted documents</h3>
        <DocumentList
          documents={request.documents}
          emptyText={
            request.office.slug === "registrar"
              ? "The Registrar stage has no documents — review the other offices' decisions above."
              : "No documents submitted."
          }
        />
      </Card>

      {application.notes && (
        <Card>
          <h3 className="text-[15px] font-semibold text-navy">Notes from student</h3>
          <p className="text-[13.5px] italic text-navy-soft">"{application.notes}"</p>
        </Card>
      )}

      <Card>
        <h3 className="text-[15px] font-semibold text-navy">Activity</h3>
        <StageHistory events={request.events} />
      </Card>

      <Card>
        <h3 className="text-[15px] font-semibold text-navy">Decision</h3>

        {!request.canDecide ? (
          <div
            className={[
              "rounded-xl px-4 py-4 text-center",
              request.status === "approved" ? "bg-green-bg" : "bg-amber-bg",
            ].join(" ")}
          >
            <p className="text-[14px] font-semibold text-navy">
              {lastDecision ? "Decision recorded: " : "Current status: "}
              {STAGE_LABELS[request.status]}
              {request.decidedAt && ` · ${formatDateTime(request.decidedAt)}`}
            </p>
            {request.comment && <p className="mt-1 text-[13px] text-navy-soft">"{request.comment}"</p>}
            {request.status === "correction_required" && (
              <p className="mt-1 text-[12.5px] text-navy-soft">
                It will come back to your queue when the student resubmits.
              </p>
            )}
          </div>
        ) : (
          <>
            <p className="text-[13.5px] text-navy-soft">
              Approve, reject, or ask the student to correct something before you decide.
            </p>
            <Textarea
              label="Comment"
              hint="Required when you reject or request a correction — the student sees it"
              placeholder="e.g. Outstanding book fine of UGX 15,000"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              error={commentError}
            />

            {serverError && <p className="text-[13px] text-danger">{serverError}</p>}

            <div className="flex flex-wrap gap-3">
              <Button type="button" disabled={isSaving} onClick={() => submitDecision("approve")}>
                {request.office.slug === "registrar" ? "Finalize clearance" : "Approve stage"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isSaving}
                className="!border-gold !bg-gold !text-[#3A2C00] hover:!bg-gold-dark"
                onClick={() => submitDecision("correction")}
              >
                Request correction
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isSaving}
                className="!border-red-400 !text-red-600 hover:!bg-red-50"
                onClick={() => {
                  if (!comment.trim()) {
                    setCommentError("Add a comment explaining why the stage is rejected.");
                    return;
                  }
                  setConfirmReject(true);
                }}
              >
                Reject
              </Button>
            </div>
          </>
        )}
      </Card>

      <ConfirmDialog
        open={confirmReject}
        title="Reject this clearance stage?"
        message="The student's whole clearance will be marked as rejected until they respond."
        confirmLabel="Reject stage"
        cancelLabel="Cancel"
        onConfirm={() => submitDecision("reject")}
        onCancel={() => setConfirmReject(false)}
      />
    </AppShell>
  );
}
