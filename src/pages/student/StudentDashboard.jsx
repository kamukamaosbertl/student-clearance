import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useClearanceForm } from "../../context/ClearanceFormContext";
import { currentUser } from "../../data/currentUser";
import { OFFICES } from "../../data/offices";

// This is the real "home" screen after login — matches AppShell (WITH
// the sidebar) since the student is now genuinely inside the app.
//
// It has two states, driven entirely by real Context data, not mock
// placeholders:
//   1. Nothing submitted yet  -> show a "Start clearance" prompt.
//      THIS is where a student initiates clearance now, not Login.
//   2. Something submitted    -> show live stats (approved / pending /
//      needs-correction counts) pulled from `stages`, plus quick links
//      into Progress or Correction/feedback.
export default function StudentDashboard() {
  const { stages } = useClearanceForm();

  // Registrar is excluded from these counts — it's the finalizer stage,
  // not one of the offices the student actively submits documents to.
  const trackedOffices = OFFICES.filter((o) => !o.isFinalizer);

  // "Has this student done anything yet?" — true the moment ANY office's
  // stage has moved off "not_started", which only happens after
  // ReviewStep calls submitClearance().
  const hasSubmitted = Object.values(stages).some((s) => s.status !== "not_started");

  const approvedCount = trackedOffices.filter((o) => stages[o.key]?.status === "done").length;
  const pendingCount = trackedOffices.filter((o) => stages[o.key]?.status === "pending").length;
  const correctionCount = trackedOffices.filter((o) => stages[o.key]?.status === "correction").length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Student"
        title={`Welcome back, ${currentUser.fullName.split(" ")[0]}`}
        description={`${currentUser.studentId} · ${currentUser.programme}`}
      />

      {!hasSubmitted ? (
        // ── State 1: nothing started yet ─────────────────────────────
        <Card className="w-[660px]">
          <h2 className="text-[17px] font-semibold text-navy">Start your clearance</h2>
          <p className="text-[13.5px] text-body">
            You haven't started a clearance request yet. It takes about 10 minutes to fill in,
            then each office reviews its own section.
          </p>
          {/* THIS is the actual entry point into the wizard now — the
              student initiates clearance from Dashboard, never from Login. */}
          <Link to="/clearance/personal">
            <Button className="w-fit">Start clearance request</Button>
          </Link>
        </Card>
      ) : (
        // ── State 2: a request is already in progress ────────────────
        <>
          <div className="grid w-[660px] grid-cols-3 gap-4">
            <Card className="items-start gap-1 px-5 py-4">
              <p className="text-[24px] font-bold text-navy">{approvedCount} / {trackedOffices.length}</p>
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
            <h2 className="text-[17px] font-semibold text-navy">Your clearance request</h2>

            {/* Badge changes color/text depending on whether the student
                actually needs to do something right now */}
            {correctionCount > 0 ? (
              <span className="w-fit rounded-full bg-red-bg px-2.5 py-1 text-[12.5px] font-semibold text-red-text">
                ⚠ {correctionCount} office{correctionCount > 1 ? "s need" : " needs"} a correction
              </span>
            ) : (
              <span className="w-fit rounded-full bg-green-bg px-2.5 py-1 text-[12.5px] font-semibold text-teal-dark">
                On track — no action needed right now
              </span>
            )}

            <div className="flex gap-2.5">
              <Link to="/clearance/progress">
                <Button variant="secondary">View progress</Button>
              </Link>
              {/* Only show the correction shortcut when it's actually relevant */}
              {correctionCount > 0 && (
                <Link to="/clearance/feedback">
                  <Button>Respond to correction</Button>
                </Link>
              )}
            </div>
          </Card>
        </>
      )}
    </AppShell>
  );
}