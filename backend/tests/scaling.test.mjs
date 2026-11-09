// Tests the client-server / scalability features through the load balancer:
//   load balancing, shared server-side sessions, shared rate limiting,
//   real-time events across servers, the message queue, concurrency under
//   load, and failover when a server dies.
//
// Start the system first, on the same computer:   npm run stack
// Then, in another terminal:                       npm run test:scaling
// (Needs a database where student 2023/BSE/005/PS has no clearance yet,
// e.g. right after `npm run setup`.)

import dotenv from "dotenv";
dotenv.config();
import sequelize from "../config/database.js";

const BASE = process.env.LB_URL || "http://localhost:5000";
const API = `${BASE}/api`;
let failures = 0;
const check = (cond, label) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) failures++;
};
const section = (title) => console.log(`\n── ${title}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(method, path, { token, json, form, headers = {} } = {}) {
  const h = { ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  let body;
  if (json) {
    h["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }
  if (form) body = form;
  const res = await fetch(API + path, { method, headers: h, body });
  const type = res.headers.get("content-type") || "";
  const data = type.includes("json") ? await res.json() : await res.text();
  return { status: res.status, data, servedBy: res.headers.get("x-served-by") };
}

const login = async (studentId, password) => (await call("POST", "/auth/login", { json: { studentId, password } })).data;
const staffLogin = async (email, password) => (await call("POST", "/auth/staff-login", { json: { email, password } })).data;

// Reads Server-Sent Events from /api/events into an array
function openEventStream(token) {
  const events = [];
  const controller = new AbortController();
  const ready = (async () => {
    const res = await fetch(`${API}/events`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    (async () => {
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let index;
          while ((index = buffer.indexOf("\n\n")) >= 0) {
            const block = buffer.slice(0, index);
            buffer = buffer.slice(index + 2);
            const type = block.match(/^event: (.*)$/m)?.[1];
            const data = block.match(/^data: (.*)$/m)?.[1];
            if (type && data) events.push({ type, data: JSON.parse(data) });
          }
        }
      } catch {
        /* aborted */
      }
    })();
    return res.headers.get("x-served-by");
  })();
  return { events, ready, close: () => controller.abort() };
}

const pdf = () => new Blob([Buffer.from("%PDF-1.4\n%test\n%%EOF")], { type: "application/pdf" });

// ─────────────────────────────────────────────────────────────────────────────
section("1. Load balancing");
const served = {};
await Promise.all(
  Array.from({ length: 30 }, async () => {
    const r = await call("GET", "/health");
    served[r.servedBy] = (served[r.servedBy] || 0) + 1;
  })
);
console.log("      30 requests were answered by:", served);
check(Object.keys(served).length >= 2, "requests are spread over several servers");
const lbStatus = await (await fetch(`${BASE}/lb/status`)).json();
check(lbStatus.servers.every((s) => s.healthy), `load balancer reports ${lbStatus.servers.length} healthy servers (${lbStatus.strategy})`);

// ─────────────────────────────────────────────────────────────────────────────
section("2. Server-side sessions shared by all servers");
const s5 = await login("2023/BSE/005/PS", "Student@005");
check(Boolean(s5.token && s5.session?.id), "login creates a server-side session");
const seenBy = new Set();
for (let i = 0; i < 6; i++) {
  const r = await call("GET", "/auth/me", { token: s5.token });
  if (r.status === 200) seenBy.add(r.servedBy);
}
check(seenBy.size >= 2, `the same session works on ${seenBy.size} different servers (no sticky sessions)`);

const second = await login("2023/BSE/005/PS", "Student@005");
let r = await call("GET", "/auth/sessions", { token: s5.token });
check(r.data.sessions?.length >= 2, "user can list their active sessions (2 logins)");

r = await call("POST", "/auth/logout", { token: second.token });
check(r.status === 200, "logout ends the session on the server");
const afterLogout = await Promise.all([1, 2, 3].map(() => call("GET", "/auth/me", { token: second.token })));
check(afterLogout.every((x) => x.status === 401), "the logged-out token is rejected by EVERY server");
check(afterLogout[0].data.code === "SESSION_ENDED", "client is told the session ended");
check((await call("GET", "/auth/me", { token: s5.token })).status === 200, "the other session is unaffected");

const admin = await staffLogin("admin@must.ac.ug", "Admin@2026");
const throwaway = await login("2023/BSE/006/PS", "Student@006");
r = await call("GET", "/admin/sessions", { token: admin.token });
const target = r.data.sessions.find((s) => s.user?.studentId === "2023/BSE/006/PS");
check(Boolean(target), "admin sees every active session");
r = await call("DELETE", `/admin/sessions/${target.id}`, { token: admin.token });
check(r.status === 200 && (await call("GET", "/auth/me", { token: throwaway.token })).status === 401, "admin can end someone's session");

// ─────────────────────────────────────────────────────────────────────────────
section("3. Shared rate limit across servers");
const attempts = [];
for (let i = 0; i < 12; i++) {
  attempts.push(await call("POST", "/auth/login", { json: { studentId: "2023/BSE/099/PS", password: "wrong" } }));
}
const blocked = attempts.findIndex((a) => a.status === 429);
const spread = new Set(attempts.map((a) => a.servedBy));
console.log(`      attempts went to ${spread.size} servers; first blocked attempt: #${blocked + 1}`);
check(blocked >= 0 && blocked <= 10, "brute-force attempts are blocked even though they hit different servers");
// Clear the counters so you can keep logging in from this computer
await sequelize.query(`DELETE FROM rate_limits WHERE "key" LIKE 'login:%'`);

// ─────────────────────────────────────────────────────────────────────────────
section("4. Real-time push across servers (publish/subscribe)");
const studentStream = openEventStream(s5.token);
const streamServer = await studentStream.ready;
await sleep(300);
check(studentStream.events[0]?.type === "hello", `student's live stream is open on ${streamServer}`);

const form = new FormData();
form.append("email", "student5@must.ac.ug");
form.append("phone", "0700123456");
form.append("yearOfStudy", "Final year");
form.append("graduationYear", "2026");
form.append("reason", "Final graduation clearance");
for (const slug of ["finance", "library", "department"]) form.append(slug, pdf(), `${slug}.pdf`);
r = await call("POST", "/clearance", { token: s5.token, form });
check(r.status === 201, `student submitted clearance (handled by ${r.servedBy})`);
const financeStage = r.data.application.stages.find((s) => s.office.slug === "finance");

const fin = await staffLogin("finance.officer@must.ac.ug", "Finance@2026");
const finStream = openEventStream(fin.token);
await finStream.ready;
await sleep(300);

let decision;
for (let i = 0; i < 3; i++) {
  // Find a server different from the student's stream server to make the decision
  decision = await call("POST", `/officer/requests/${financeStage.id}/decision`, {
    token: fin.token,
    json: { action: "correction", comment: "Please attach the bank slip." },
  });
  if (decision.status === 200) break;
}
check(decision.status === 200, `Finance requested a correction (handled by ${decision.servedBy})`);
await sleep(800);
const gotChange = studentStream.events.some((e) => e.type === "clearance.changed");
const gotNotification = studentStream.events.some((e) => e.type === "notification" && /correction/i.test(e.data.title));
check(gotChange && gotNotification, `student was pushed the update live${decision.servedBy !== streamServer ? " — across different servers" : ""}`);

const fix = new FormData();
fix.append("files", pdf(), "slip.pdf");
fix.append("message", "Attached.");
await call("POST", `/clearance/stages/${financeStage.id}/resubmit`, { token: s5.token, form: fix });
await sleep(800);
check(finStream.events.some((e) => e.type === "clearance.changed"), "Finance officer's queue was pushed the resubmission live");
studentStream.close();
finStream.close();

// ─────────────────────────────────────────────────────────────────────────────
section("5. Message queue (asynchronous email)");
await sleep(2500);
r = await call("GET", "/admin/system", { token: admin.token });
check(r.status === 200 && r.data.queue.done > 0, `worker processed ${r.data.queue.done} queued job(s); ${r.data.queue.queued} waiting, ${r.data.queue.failed} failed`);
check(r.data.eventBus.connected, `event bus connected on ${r.data.instance}`);

// ─────────────────────────────────────────────────────────────────────────────
section("6. Concurrency under load");
const N = 300;
let t0 = Date.now();
const results = await Promise.all(Array.from({ length: N }, () => call("GET", "/offices", { token: s5.token })));
let ms = Date.now() - t0;
const ok = results.filter((x) => x.status === 200).length;
const perServer = {};
results.forEach((x) => (perServer[x.servedBy] = (perServer[x.servedBy] || 0) + 1));
console.log(`      ${N} simultaneous requests in ${ms} ms (${Math.round((N / ms) * 1000)} req/s):`, perServer);
check(ok === N, `all ${N} simultaneous requests succeeded`);

t0 = Date.now();
const logins = await Promise.all(
  ["001", "002", "003", "004", "007", "008", "009", "010"].map((n) => login(`2023/BSE/${n}/PS`, `Student@${n}`))
);
ms = Date.now() - t0;
check(logins.every((l) => l.token), `8 simultaneous logins (password checks in the thread pools) in ${ms} ms`);
await sequelize.query(`DELETE FROM rate_limits WHERE "key" LIKE 'login:%'`);

// ─────────────────────────────────────────────────────────────────────────────
section("7. Failover — a server dies");
const health = await call("GET", "/health");
const victim = health.data;
console.log(`      stopping ${victim.instance} (pid ${victim.pid})…`);
process.kill(victim.pid, "SIGKILL");

const duringOutage = await Promise.all(Array.from({ length: 20 }, () => call("GET", "/offices", { token: s5.token })));
const outageServers = new Set(duringOutage.map((x) => x.servedBy));
check(duringOutage.every((x) => x.status === 200), "all 20 requests still succeeded while one server was down");
check(!outageServers.has(victim.instance), `traffic went only to the remaining servers: ${[...outageServers].join(", ")}`);
const statusDuring = await (await fetch(`${BASE}/lb/status`)).json();
check(statusDuring.servers.some((s) => !s.healthy), "load balancer marked the dead server as down");

console.log("      waiting for the server to be restarted and pass its health check…");
let back = false;
for (let i = 0; i < 20 && !back; i++) {
  await sleep(1000);
  const st = await (await fetch(`${BASE}/lb/status`)).json();
  back = st.servers.every((s) => s.healthy);
}
check(back, "the restarted server was added back into rotation automatically");

await sequelize.close();
console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
