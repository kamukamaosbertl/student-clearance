import { useCallback, useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/Statusbadge";
import api, { apiErrorMessage } from "../../api/client";
import { useLiveStatus } from "../../context/LiveEventsContext";
import { formatDateTime, timeAgo } from "../../utils/status";

function Stat({ label, value, hint }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-[13.5px] last:border-none">
      <span className="text-navy-soft">{label}</span>
      <span className="text-right font-medium text-navy">
        {value}
        {hint && <span className="block text-[11.5px] font-normal text-navy-soft">{hint}</span>}
      </span>
    </div>
  );
}

// The load balancer's status page lives next to the API: /api → /lb/status
const LB_STATUS_URL = api.defaults.baseURL.replace(/\/api\/?$/, "") + "/lb/status";

// Shows the client-server architecture at work: which server answered,
// the load balancer's view of the servers, connection and thread pools,
// the message queue and live connections.
export default function SystemStatus() {
  const [system, setSystem] = useState(null);
  const [lb, setLb] = useState(null);
  const [samples, setSamples] = useState(null);
  const [error, setError] = useState("");
  const live = useLiveStatus();

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/system");
      setSystem(data);
      setError("");
    } catch (err) {
      setError(apiErrorMessage(err));
    }
    try {
      const response = await fetch(LB_STATUS_URL);
      setLb(response.ok ? await response.json() : null);
    } catch {
      setLb(null); // not running behind the load balancer
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  // Sends 12 requests and counts which server answered each one
  async function sampleRequests() {
    const counts = {};
    await Promise.all(
      Array.from({ length: 12 }, async () => {
        const response = await api.get("/health");
        const server = response.headers["x-served-by"] || response.data.instance;
        counts[server] = (counts[server] || 0) + 1;
      })
    );
    setSamples(counts);
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administrator"
        title="System status"
        description="How the system is running: load balancing, pools, the job queue and live connections. Refreshes every 5 seconds."
      />

      {error && <Card><p className="text-[13.5px] text-danger">{error}</p></Card>}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[15px] font-semibold text-navy">Load balancer</h3>
          <Button variant="secondary" onClick={sampleRequests}>
            Send 12 test requests
          </Button>
        </div>
        {lb ? (
          <>
            <p className="text-[13px] text-navy-soft">
              Strategy: <strong>{lb.strategy}</strong> · health check every {lb.healthCheckIntervalMs / 1000} s
            </p>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-[11.5px] font-semibold uppercase tracking-wide text-navy-soft">
                  <th className="py-2 pr-4 font-semibold">Server</th>
                  <th className="py-2 pr-4 font-semibold">Health</th>
                  <th className="py-2 pr-4 font-semibold">Active</th>
                  <th className="py-2 pr-4 font-semibold">Total requests</th>
                  <th className="py-2 font-semibold">Last check</th>
                </tr>
              </thead>
              <tbody>
                {lb.servers.map((server) => (
                  <tr key={server.url} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-4 text-[13.5px] font-medium text-navy">{server.url}</td>
                    <td className="py-2.5 pr-4">
                      <StatusBadge status={server.healthy ? "active" : "inactive"}>
                        {server.healthy ? "Healthy" : `Down${server.lastError ? ` (${server.lastError})` : ""}`}
                      </StatusBadge>
                    </td>
                    <td className="py-2.5 pr-4 text-[13.5px] text-navy-soft">{server.activeRequests}</td>
                    <td className="py-2.5 pr-4 text-[13.5px] text-navy-soft">{server.totalRequests}</td>
                    <td className="py-2.5 text-[13px] text-navy-soft">{timeAgo(server.lastCheck)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className="text-[13.5px] text-navy-soft">
            Not running behind the load balancer. Start the backend with <code>npm run stack</code> to run several servers
            behind it.
          </p>
        )}
        {samples && (
          <div className="rounded-field bg-surface px-4 py-3 text-[13.5px] text-navy">
            12 requests were answered by:{" "}
            {Object.entries(samples)
              .map(([server, count]) => `${server} (${count})`)
              .join(", ")}
          </div>
        )}
      </Card>

      {system && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="text-[15px] font-semibold text-navy">This server</h3>
            <p className="text-[12.5px] text-navy-soft">The server process that answered this page's last request.</p>
            <div>
              <Stat label="Server" value={system.instance} hint={`process id ${system.pid} · Node ${system.node}`} />
              <Stat label="Running since" value={formatDateTime(system.startedAt)} hint={`${Math.round(system.uptimeSeconds / 60)} min`} />
              <Stat label="Memory" value={`${system.memoryMb} MB`} />
              <Stat
                label="Database connection pool"
                value={`${system.databasePool.using} in use / ${system.databasePool.size} open (max ${system.databasePool.max})`}
                hint={`${system.databasePool.waiting} request(s) waiting for a connection`}
              />
              <Stat
                label="Password thread pool"
                value={`${system.passwordThreads.threads} thread(s), ${system.passwordThreads.idle} idle`}
                hint={`${system.passwordThreads.queued} waiting · ${system.passwordThreads.completed} done`}
              />
            </div>
          </Card>

          <Card>
            <h3 className="text-[15px] font-semibold text-navy">Real-time & sessions</h3>
            <div>
              <Stat
                label="Your live connection"
                value={live.status === "live" ? `Live via ${live.instance}` : live.status}
              />
              <Stat
                label="Live browsers on this server"
                value={system.realtime.connectedClients}
                hint={Object.entries(system.realtime.byRole).map(([role, n]) => `${n} ${role}`).join(", ") || "none"}
              />
              <Stat
                label="Event bus (publish/subscribe)"
                value={system.eventBus.connected ? "Connected" : "Disconnected"}
                hint={`${system.eventBus.eventsReceived} event(s) received by this server`}
              />
              <Stat label="Active sessions (all servers)" value={system.sessions.active} />
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <h3 className="text-[15px] font-semibold text-navy">Job queue (background worker)</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {["queued", "running", "done", "failed"].map((key) => (
                <div key={key} className="rounded-field border border-border px-4 py-3">
                  <p className="text-[22px] font-bold text-navy">{system.queue[key]}</p>
                  <p className="text-[12.5px] capitalize text-navy-soft">{key}</p>
                </div>
              ))}
            </div>
            {system.queue.recentFailures.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-[13px] font-semibold text-navy">Recent failures</p>
                {system.queue.recentFailures.map((job) => (
                  <p key={job.id} className="text-[12.5px] text-navy-soft">
                    #{job.id} {job.type} after {job.attempts} attempts — {job.lastError}
                  </p>
                ))}
              </div>
            )}
            {system.queue.queued > 0 && system.queue.done === 0 && (
              <p className="text-[13px] text-amber-text">
                Jobs are waiting but none have been processed — is the worker running? (<code>npm run worker</code>)
              </p>
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}
