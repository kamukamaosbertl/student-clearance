import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/Statusbadge";

// TODO: replace with the real signed-in officer's name and office
// once auth is wired up — for now this only computes a time-of-day
// greeting, which doesn't need a backend.
function getTimeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// TODO: replace with real data once the API is wired up.
const stats = [
  { label: "Pending review", value: 14 },
  { label: "Correction requested", value: 6 },
  { label: "Approved this semester", value: 128 },
  { label: "Rejected", value: 2 },
];

// TODO: replace with the real "needs attention" query result.
const needsAttention = [
  { student: "Atuhe Joel", regNo: "2023/BSE/031/PS", waiting: "5 days", status: "overdue", statusLabel: "Overdue" },
  { student: "Nyakato Sheila", regNo: "2023/BSE/124/PS", waiting: "4 days", status: "pending", statusLabel: "Pending" },
];

export default function Dashboard() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Officer"
        title="Dashboard"
        description={`${getTimeOfDayGreeting()} — here's your queue and recent activity.`}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-[26px] font-bold text-navy">{stat.value}</p>
            <p className="text-[13px] text-navy-soft">{stat.label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-[15px] font-semibold text-navy">Needs attention today</h3>
        <p className="mb-4 text-[13px] text-navy-soft">
          Requests sitting in your queue for more than 3 days.
        </p>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[11.5px] font-semibold uppercase tracking-wide text-navy-soft">
              <th className="py-2 pr-4 font-semibold">Student</th>
              <th className="py-2 pr-4 font-semibold">Reg. no.</th>
              <th className="py-2 pr-4 font-semibold">Waiting</th>
              <th className="py-2 pr-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {needsAttention.map((row) => (
              <tr key={row.regNo} className="border-b border-border last:border-0">
                <td className="py-3 pr-4 text-[14px] font-medium text-navy">{row.student}</td>
                <td className="py-3 pr-4 text-[14px] text-navy-soft">{row.regNo}</td>
                <td className="py-3 pr-4 text-[14px] text-navy-soft">{row.waiting}</td>
                <td className="py-3 pr-4">
                  <StatusBadge status={row.status}>{row.statusLabel}</StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AppShell>
  );
}