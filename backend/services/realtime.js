import { subscribe } from "./eventBus.js";
import { INSTANCE_ID } from "../utils/instance.js";

// ─────────────────────────────────────────────────────────────────────────────
// Real-time push to browsers with Server-Sent Events (SSE).
//
// The browser opens GET /api/events and keeps the HTTP connection (a TCP
// stream socket) open. Instead of the client asking "anything new?" every
// few seconds (polling), the SERVER pushes a message the moment something
// happens — the publish/subscribe model from the middleware lectures.
//
// Each server process keeps its own list of connected browsers. Events from
// any server arrive through the event bus (eventBus.js), and are written to
// the browsers that should see them:
//   audience.userIds   — specific users (a student, notified officers)
//   audience.officeIds — every officer of these offices (Department officers
//                        only for students of their department)
//   audience.roles     — e.g. all administrators
// ─────────────────────────────────────────────────────────────────────────────

const clients = new Map();
let nextClientId = 1;
let sent = 0;

const HEARTBEAT_MS = 25_000; // keeps proxies and load balancers from closing an idle stream

function write(client, type, data) {
  client.res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  sent++;
}

function matches(audience = {}, client) {
  if (audience.userIds?.includes(client.userId)) return true;
  if (client.role === "officer" && audience.officeIds?.includes(client.officeId)) {
    // Department officers only get events about students of their own
    // academic department (other offices see every student)
    const scope = audience.departmentScope;
    if (!scope || client.officeId !== scope.officeId || !client.department || !scope.department) return true;
    return scope.department.toLowerCase() === client.department.toLowerCase();
  }
  if (audience.roles?.includes(client.role)) return true;
  return false;
}

// Deliver events from the bus to the right browsers on THIS server
subscribe((event) => {
  if (!event.data?.audience) return;
  const { audience, ...data } = event.data;
  for (const client of clients.values()) {
    if (matches(audience, client)) write(client, event.type, data);
  }
});

// GET /api/events — keeps the response open and streams events
export function eventsHandler(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // tell Nginx not to buffer the stream
  });
  res.write("retry: 5000\n\n"); // browser reconnects after 5 s if the connection drops

  const client = {
    id: nextClientId++,
    res,
    userId: req.user.id,
    role: req.user.role,
    officeId: req.user.officeId,
    department: req.user.department,
    connectedAt: new Date(),
  };
  clients.set(client.id, client);
  write(client, "hello", { instance: INSTANCE_ID, clientId: client.id });

  const heartbeat = setInterval(() => res.write(": ping\n\n"), HEARTBEAT_MS);

  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(client.id);
  });
}

// Close every stream (used during graceful shutdown — browsers reconnect,
// and the load balancer sends them to another server)
export function closeAllStreams() {
  for (const client of clients.values()) {
    client.res.end();
  }
  clients.clear();
}

export function realtimeStats() {
  const byRole = {};
  for (const c of clients.values()) byRole[c.role] = (byRole[c.role] || 0) + 1;
  return { connectedClients: clients.size, byRole, eventsSent: sent };
}
