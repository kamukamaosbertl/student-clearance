import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import { useClearanceForm } from "../../context/ClearanceFormContext";

// TODO: once a backend exists, this array should come from a real API call
// (GET /clearance-requests/:id/stages, per section 7.9 "Status Tracking" and
// 11.2 of the project plan) instead of being hardcoded here. The five
// offices and their fixed order match section 9.0's workflow diagram:
// Finance → Library → Department/Faculty → Student Affairs → Registrar.
//
// Each stage's `status` is one of the transaction states from section 10.0:
// "pending" | "active" | "done" | "correction" | "rejected"
const mockStages = [
  {
    office: "Finance",
    status: "done",
    note: "Approved · 26 Aug 2026",
  },
  {
    office: "Library",
    status: "correction",
    note: "Please clear outstanding book fine of UGX 15,000 before resubmitting.",
  },
  {
    office: "Department / Faculty",
    status: "pending",
    note: "Waiting for Library",
  },
  {
    office: "Student Affairs",
    status: "pending",
    note: "Waiting for Department",
  },
  {
    office: "Academic Registrar",
    status: "pending",
    note: "Final stage",
  },
];

// One badge per non-neutral state — "pending" and "done" don't need a
// badge, the dot/checkmark on the left already communicates them clearly.
function StatusBadge({ status }) {
  if (status === "correction") {
    return (
      <span className="rounded-full bg-amber-bg px-2.5 py-0.5 text-[11.5px] font-semibold text-amber-text">
        Correction required
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="rounded-full bg-red-bg px-2.5 py-0.5 text-[11.5px] font-semibold text-red-text">
        Rejected
      </span>
    );
  }
  return null;
}

function StageDot({ status }) {
  const styles = {
    done: "border-teal bg-teal",
    active: "border-gold bg-gold",
    correction: "border-amber-text bg-amber-text",
    rejected: "border-red-text bg-red-text",
    pending: "border-border-strong bg-white",
  };
  return (
    <span
      className={[
        "absolute -left-[7px] top-0.5 size-3.5 rounded-full border-2 transition-colors duration-200",
        styles[status] ?? styles.pending,
      ].join(" ")}
      aria-hidden="true"
    />
  );
}

export default function ClearanceProgress() {
  const { formData } = useClearanceForm();
  const hasSubmitted = Boolean(formData.details.reason); // crude "has this student submitted anything" check for now

  return (
    <AppShell>
      <PageHeader
        eyebrow="Student"
        title="Clearance progress"
        description="Your request moves through five offices in order. Completed stages stay completed."
      />

      <Card className="w-[660px]">
        {!hasSubmitted ? (
          // Nothing submitted yet — point the student back to the wizard
          // instead of showing five empty "pending" rows, which would look
          // broken rather than just "not started."
          <div className="flex flex-col items-start gap-3">
            <p className="text-[13.5px] text-body">
              You haven't submitted a clearance request yet.
            </p>
            <Link
              to="/clearance/personal"
              className="text-[13.5px] font-semibold text-teal transition-colors hover:text-teal-dark"
            >
              Start your clearance request →
            </Link>
          </div>
        ) : (
          <ol className="relative flex flex-col gap-6 pl-4">
            {mockStages.map((stage, index) => (
              <li key={stage.office} className="relative pl-4">
                {/* connecting line to the next stage — omitted after the last item */}
                {index < mockStages.length - 1 && (
                  <span
                    className="absolute -left-[1px] top-4 h-[calc(100%+0.5rem)] w-[1.5px] bg-border"
                    aria-hidden="true"
                  />
                )}
                <StageDot status={stage.status} />

                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[14.5px] font-semibold text-navy">{stage.office}</h3>
                  <StatusBadge status={stage.status} />
                </div>
                <p className="mt-0.5 text-[13px] text-body">{stage.note}</p>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </AppShell>
  );
}