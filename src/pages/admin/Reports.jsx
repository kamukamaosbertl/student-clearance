import { useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import api, { apiErrorMessage, downloadFile } from "../../api/client";

// Section 7.12 — clearance reports for management
export default function Reports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    api
      .get("/admin/overview")
      .then((res) => setData(res.data))
      .catch((err) => setError(apiErrorMessage(err)));
  }, []);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadFile("/admin/reports/applications.csv", `clearance-report-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      setError(apiErrorMessage(err, "The report could not be downloaded."));
    } finally {
      setIsDownloading(false);
    }
  }

  const total = data?.applications.total || 0;
  const pct = (n) => (total ? `${Math.round((n / total) * 100)}%` : "—");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administrator"
        title="Reports"
        description="Clearance totals and how quickly each office is processing requests."
      />

      {error && <Card><p className="text-[13.5px] text-danger">{error}</p></Card>}

      {data && (
        <>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-navy">Clearance requests</h3>
              <Button variant="secondary" onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? "Preparing…" : "Download full report (CSV)"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                ["Total", data.applications.total, ""],
                ["In progress", data.applications.in_progress, pct(data.applications.in_progress)],
                ["Completed", data.applications.completed, pct(data.applications.completed)],
                ["Rejected", data.applications.rejected, pct(data.applications.rejected)],
              ].map(([label, value, share]) => (
                <div key={label} className="rounded-field border border-border px-4 py-3">
                  <p className="text-[22px] font-bold text-navy">{value}</p>
                  <p className="text-[12.5px] text-navy-soft">
                    {label}
                    {share && ` · ${share}`}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <h3 className="px-6 pt-5 text-[15px] font-semibold text-navy">Office performance</h3>
            <table className="mt-3 w-full text-left">
              <thead>
                <tr className="border-b border-border text-[11.5px] font-semibold uppercase tracking-wide text-navy-soft">
                  <th className="px-6 py-3 font-semibold">Office</th>
                  <th className="px-6 py-3 font-semibold">In queue</th>
                  <th className="px-6 py-3 font-semibold">Correction sent</th>
                  <th className="px-6 py-3 font-semibold">Approved</th>
                  <th className="px-6 py-3 font-semibold">Rejected</th>
                  <th className="px-6 py-3 font-semibold">Not required</th>
                  <th className="px-6 py-3 font-semibold">Avg. days to approve</th>
                </tr>
              </thead>
              <tbody>
                {data.offices.map((row) => (
                  <tr key={row.office.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-3 text-[14px] font-medium text-navy">{row.office.name}</td>
                    <td className="px-6 py-3 text-[14px] text-navy-soft">{row.inQueue}</td>
                    <td className="px-6 py-3 text-[14px] text-navy-soft">{row.correctionRequired}</td>
                    <td className="px-6 py-3 text-[14px] text-navy-soft">{row.approved}</td>
                    <td className="px-6 py-3 text-[14px] text-navy-soft">{row.rejected}</td>
                    <td className="px-6 py-3 text-[14px] text-navy-soft">{row.notRequired}</td>
                    <td className="px-6 py-3 text-[14px] text-navy-soft">{row.averageDecisionDays ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </AppShell>
  );
}
