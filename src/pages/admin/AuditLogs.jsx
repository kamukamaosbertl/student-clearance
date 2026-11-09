import { useCallback, useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import api, { apiErrorMessage } from "../../api/client";
import { ROLE_LABELS, formatDateTime } from "../../utils/status";
import { AUDIT_FILTERS, describeAudit } from "./auditLabels";

const PAGE_SIZE = 50;

// Section 7.13 — system activity / audit trail
export default function AuditLogs() {
  const [filter, setFilter] = useState("");
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(
    async (offset = 0) => {
      setIsLoading(true);
      try {
        const { data } = await api.get("/admin/audit-logs", {
          params: { action: filter || undefined, limit: PAGE_SIZE, offset },
        });
        setLogs((prev) => (offset === 0 ? data.logs : [...prev, ...data.logs]));
        setTotal(data.total);
        setError("");
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    load(0);
  }, [load]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administrator"
        title="System activity"
        description="A record of logins, submissions, decisions and administrative changes."
      />

      <div className="flex flex-wrap gap-2">
        {AUDIT_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={[
              "rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
              filter === f.key ? "border-teal bg-teal text-white" : "border-border bg-white text-navy-soft hover:text-navy",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        {error ? (
          <p className="px-6 py-5 text-[13.5px] text-danger">{error}</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-[11.5px] font-semibold uppercase tracking-wide text-navy-soft">
                <th className="px-6 py-3 font-semibold">When</th>
                <th className="px-6 py-3 font-semibold">User</th>
                <th className="px-6 py-3 font-semibold">Action</th>
                <th className="px-6 py-3 font-semibold">IP address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-6 py-3 text-[13px] text-navy-soft">{formatDateTime(log.createdAt)}</td>
                  <td className="px-6 py-3 text-[13.5px] text-navy">
                    {log.user ? (
                      <>
                        {log.user.fullName}
                        <span className="text-navy-soft"> · {ROLE_LABELS[log.user.role]}</span>
                      </>
                    ) : (
                      <span className="text-navy-soft">{log.details?.email || log.details?.studentId || "Unknown"}</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-[13.5px] text-navy">
                    {describeAudit(log)}
                    {log.details?.comment && <span className="text-navy-soft"> — "{log.details.comment}"</span>}
                  </td>
                  <td className="px-6 py-3 text-[12.5px] text-navy-soft">{log.ipAddress || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {logs.length < total && (
        <Button variant="secondary" className="w-fit" disabled={isLoading} onClick={() => load(logs.length)}>
          {isLoading ? "Loading…" : `Load more (${total - logs.length} remaining)`}
        </Button>
      )}
    </AppShell>
  );
}
