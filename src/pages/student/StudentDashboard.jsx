import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/Statusbadge";
import { useClearanceForm } from "../../context/ClearanceFormContext";
import { useAuth } from "../../context/AuthContext";
import { APPLICATION_LABELS, NEEDS_STUDENT, formatDate } from "../../utils/status";

// The student's home screen after login. Two states, both driven by the
// student's real clearance request from the server:
//   1. No request yet -> "Start clearance" prompt (the only entry point
//      into the wizard).
//   2. Request exists -> live counts per office plus quick links.
export default function StudentDashboard() {
  const { user } = useAuth();
  const { application, hasLoaded, loadError } = useClearanceForm();

  const stages = application?.stages || [];
  // Offices that actually apply to this student (optional offices the
  // student skipped are left out of the counts)
  const tracked = stages.filter((s) => s.status !== "not_required");
  const approvedCount = tracked.filter((s) => s.status === "approved").length;
  const pendingCount = tracked.filter((s) => ["pending", "under_review", "resubmitted"].includes(s.status)).length;
  const correctionCount = tracked.filter((s) => NEEDS_STUDENT.includes(s.status)).length;
  const currentStage = tracked.find((s) => s.status !== "approved");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Student dashboard"
        title={`Welcome, ${user?.fullName?.split(" ")[0] || "student"}`}
        description="Track your graduation clearance and see what needs your attention."
      />

      {!hasLoaded ? (
        <Card className="w-[660px]">
          <p className="text-[13.5px] text-body">Loading your clearance request…</p>
        </Card>
      ) : loadError ? (
        <Card className="w-[660px]">
          <p className="text-[13.5px] text-danger">{loadError}</p>
        </Card>
      ) : !application ? (
        <Card className="w-[660px]">
          <h2 className="text-[17px] font-semibold text-navy">Start your clearance</h2>
          <p className="text-[13.5px] text-body">
            You haven't started a clearance request yet. It takes about 10 minutes to fill in,
            then each office reviews its own section in turn.
          </p>
          <Link to="/clearance/personal">
            <Button className="w-fit">Start clearance request</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid w-[660px] grid-cols-3 gap-4">
            <Card className="items-start gap-1 px-5 py-4">
              <p className="text-[24px] font-bold text-navy">{approvedCount} / {tracked.length}</p>
              <p className="text-[12.5px] text-body">Offices approved</p>
            </Card>
            <Card className="items-start gap-1 px-5 py-4">
              <p className="text-[24px] font-bold text-navy">{pendingCount}</p>
              <p className="text-[12.5px] text-body">Awaiting review</p>
            </Card>
            <Card className="items-start gap-1 px-5 py-4">
              <p className="text-[24px] font-bold text-navy">{correctionCount}</p>
              <p className="text-[12.5px] text-body">Needs your action</p>
            </Card>
          </div>

          <Card className="w-[660px]">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-semibold text-navy">Your clearance request</h2>
              <StatusBadge status={application.status}>{APPLICATION_LABELS[application.status]}</StatusBadge>
            </div>
            <p className="text-[13px] text-body">
              Submitted {formatDate(application.startedAt)} · Academic year {application.academicYear}
              {application.completedAt && ` · Completed ${formatDate(application.completedAt)}`}
            </p>

            {application.status === "completed" ? (
              <span className="w-fit rounded-full bg-green-bg px-2.5 py-1 text-[12.5px] font-semibold text-teal-dark">
                ✓ Clearance complete — every office has cleared you
              </span>
            ) : correctionCount > 0 ? (
              <span className="w-fit rounded-full bg-red-bg px-2.5 py-1 text-[12.5px] font-semibold text-red-text">
                ⚠ {currentStage?.office.name} needs a response from you
              </span>
            ) : (
              <span className="w-fit rounded-full bg-green-bg px-2.5 py-1 text-[12.5px] font-semibold text-teal-dark">
                On track — currently with {currentStage?.office.name || "the offices"}
              </span>
            )}

            <div className="flex gap-2.5">
              <Link to="/clearance/progress">
                <Button variant="secondary">View progress</Button>
              </Link>
              {correctionCount > 0 && (
                <Link to="/clearance/feedback">
                  <Button>Respond to {currentStage?.office.name}</Button>
                </Link>
              )}
            </div>
          </Card>
        </>
      )}
    </AppShell>
  );
}
