import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";

// No Figma frame exists for this screen yet — placeholder for section 7.8
// "Correction Requests" so students can view/respond to an office's request
// for corrected info without losing the rest of their submission.
export default function CorrectionFeedback() {
  return (
    <AppShell>
      <PageHeader eyebrow="Student" title="Clearance forms" />
      <Card className="w-[660px]">
        <h2 className="text-[17px] font-semibold text-navy">Correction / feedback</h2>
        <p className="text-[13px] text-body">
          Not designed in Figma yet. This will list any office's correction request with their comment, and let the
          student edit just the affected fields and resubmit that stage.
        </p>
      </Card>
    </AppShell>
  );
}
