import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/Statusbadge";
import { officeName, processingHistory } from "../../data/mockOfficerRequests";

export default function ProcessingHistory() {
  return (
    <AppShell>
      <PageHeader
        eyebrow={`Officer · ${officeName}`}
        title="Processing history"
        description="Every decision you've made, most recent first."
      />

      <Card className="overflow-hidden p-0">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[11.5px] font-semibold uppercase tracking-wide text-navy-soft">
              <th className="px-6 py-3 font-semibold">Student</th>
              <th className="px-6 py-3 font-semibold">Decision</th>
              <th className="px-6 py-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {processingHistory.map((entry, i) => (
              <tr key={`${entry.student}-${i}`} className="border-b border-border last:border-0">
                <td className="px-6 py-4 text-[14px] font-semibold text-navy">{entry.student}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={entry.decision}>{entry.decisionLabel}</StatusBadge>
                </td>
                <td className="px-6 py-4 text-[13.5px] text-navy-soft">{entry.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AppShell>
  );
}