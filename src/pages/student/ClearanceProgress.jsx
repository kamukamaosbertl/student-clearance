import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";

// No Figma frame exists for this screen yet — it's a placeholder so the
// sidebar link (which the Figma file does include) goes somewhere real.
// Build against section 7.9 "Status Tracking" and the transaction-state
// diagram (NOT STARTED → SUBMITTED → IN REVIEW → ... ) from the project plan.
export default function ClearanceProgress() {
  return (
    <AppShell>
      <PageHeader eyebrow="Student" title="Clearance forms" />
      <Card className="w-[660px]">
        <h2 className="text-[17px] font-semibold text-navy">Clearance progress</h2>
        <p className="text-[13px] text-body">
          Not designed in Figma yet. This will show each office's stage (Finance, Library, Department, Student
          Affairs, Registrar) and its status — Pending, Under Review, Approved, Rejected, or Correction Required.
        </p>
      </Card>
    </AppShell>
  );
}
