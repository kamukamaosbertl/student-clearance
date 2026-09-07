import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/Statusbadge";
import { officeName, pendingRequests } from "../../data/mockOfficerRequests";

export default function PendingRequests() {
  return (
    <AppShell>
      <PageHeader
        eyebrow={`Officer · ${officeName}`}
        title="Pending requests"
        description={`All clearance requests currently assigned to the ${officeName} stage.`}
      />

      <Card className="overflow-hidden p-0">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[11.5px] font-semibold uppercase tracking-wide text-navy-soft">
              <th className="px-6 py-3 font-semibold">Student</th>
              <th className="px-6 py-3 font-semibold">Programme</th>
              <th className="px-6 py-3 font-semibold">Submitted</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {pendingRequests.map((req) => (
              <tr key={req.id} className="border-b border-border last:border-0">
                <td className="px-6 py-4">
                  <p className="text-[14px] font-semibold text-navy">{req.student}</p>
                  <p className="text-[12.5px] text-navy-soft">{req.regNo}</p>
                </td>
                <td className="px-6 py-4 text-[14px] text-navy-soft">{req.programme}</td>
                <td className="px-6 py-4 text-[14px] text-navy-soft">{req.submitted}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={req.status}>{req.statusLabel}</StatusBadge>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    to={`/officer/request/${req.id}`}
                    className="text-[13.5px] font-semibold text-teal hover:underline"
                  >
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AppShell>
  );
}