import { useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/Statusbadge";
import DocumentList from "../../components/clearance/DocumentList";
import StageHistory from "../../components/clearance/StageHistory";
import { useClearanceForm } from "../../context/ClearanceFormContext";
import { APPLICATION_LABELS, STAGE_LABELS, NEEDS_STUDENT, formatDate } from "../../utils/status";

// Real stage data from GET /api/clearance/me (section 7.9 "Status
// Tracking"). Offices are shown in workflow order (section 9.0):
// Finance → Library → Department/Faculty → Student Affairs → Registrar.

// Dot colour for each stage state
function StageDot({ status }) {
  const styles = {
    approved: "border-teal bg-teal",
    pending: "border-gold bg-gold",
    under_review: "border-gold bg-gold",
    resubmitted: "border-gold bg-gold",
    correction_required: "border-amber-text bg-amber-text",
    rejected: "border-red-text bg-red-text",
    not_required: "border-border-strong bg-surface",
    waiting: "border-border-strong bg-white",
  };
  return (
    <span
      className={[
        "absolute -left-[7px] top-0.5 size-3.5 rounded-full border-2 transition-colors duration-200",
        styles[status] ?? styles.waiting,
      ].join(" ")}
      aria-hidden="true"
    />
  );
}

// One line explaining where the stage is
function stageNote(stage, previous) {
  switch (stage.status) {
    case "approved":
      return `Approved · ${formatDate(stage.decidedAt)}${stage.comment ? ` — "${stage.comment}"` : ""}`;
    case "pending":
      return `In ${stage.office.name}'s queue since ${formatDate(stage.queuedAt)}`;
    case "under_review":
      return "An officer is reviewing your submission";
    case "resubmitted":
      return `Resubmitted ${formatDate(stage.queuedAt)} · awaiting review`;
    case "correction_required":
    case "rejected":
      return stage.comment || "The office needs a response from you.";
    case "not_required":
      return "Not applicable — no documents were submitted for this office";
    default:
      return stage.office.requiresDocuments
        ? `Waiting for ${previous?.office.name || "the previous office"}`
        : "Final stage — starts when every other office has cleared you";
  }
}

export default function ClearanceProgress() {
  const { application, hasLoaded } = useClearanceForm();
  const [openStageId, setOpenStageId] = useState(null);

  const stages = application?.stages || [];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Student"
        title="Clearance progress"
        description="Your request moves through the offices in order. Completed stages stay completed."
      />

      <Card className="w-[660px]">
        {!hasLoaded ? (
          <p className="text-[13.5px] text-body">Loading…</p>
        ) : !application ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-[13.5px] text-body">You haven't submitted a clearance request yet.</p>
            <Link
              to="/clearance/personal"
              className="text-[13.5px] font-semibold text-teal transition-colors hover:text-teal-dark"
            >
              Start your clearance request →
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-body">
                Submitted {formatDate(application.startedAt)} · {application.academicYear}
              </p>
              <StatusBadge status={application.status}>{APPLICATION_LABELS[application.status]}</StatusBadge>
            </div>

            {application.status === "completed" && (
              <div className="rounded-field bg-green-bg px-4 py-3 text-[13.5px] font-semibold text-teal-dark">
                🎓 Clearance completed on {formatDate(application.completedAt)}. You're cleared for graduation.
              </div>
            )}

            <ol className="relative flex flex-col gap-6 pl-4">
              {stages.map((stage, index) => {
                const isOpen = openStageId === stage.id;
                return (
                  <li key={stage.id} className="relative pl-4">
                    {index < stages.length - 1 && (
                      <span
                        className="absolute -left-[1px] top-4 h-[calc(100%+0.5rem)] w-[1.5px] bg-border"
                        aria-hidden="true"
                      />
                    )}
                    <StageDot status={stage.status} />

                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[14.5px] font-semibold text-navy">{stage.office.name}</h3>
                      <StatusBadge status={stage.status}>{STAGE_LABELS[stage.status]}</StatusBadge>
                    </div>
                    <p className="mt-0.5 text-[13px] text-body">{stageNote(stage, stages[index - 1])}</p>

                    <div className="mt-1 flex gap-4">
                      {NEEDS_STUDENT.includes(stage.status) && (
                        <Link to="/clearance/feedback" className="text-[12.5px] font-semibold text-teal hover:underline">
                          Respond →
                        </Link>
                      )}
                      {(stage.documents.length > 0 || stage.events.length > 1) && (
                        <button
                          type="button"
                          onClick={() => setOpenStageId(isOpen ? null : stage.id)}
                          className="text-[12.5px] font-semibold text-navy-soft hover:text-navy"
                        >
                          {isOpen
                            ? "Hide details"
                            : stage.documents.length > 0
                            ? `Details (${stage.documents.length} document${stage.documents.length === 1 ? "" : "s"})`
                            : "Details"}
                        </button>
                      )}
                    </div>

                    {isOpen && (
                      <div className="mt-3 flex flex-col gap-4 rounded-field border border-border p-4">
                        <DocumentList documents={stage.documents} />
                        <StageHistory events={stage.events} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </Card>
    </AppShell>
  );
}
