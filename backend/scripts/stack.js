import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// ─────────────────────────────────────────────────────────────────────────────
// Starts the whole scaled-out system on one computer (works on Windows):
//
//   npm run stack                 → 3 API servers + 1 worker + load balancer
//   npm run stack -- 5            → 5 API servers
//
//   API server 1   http://localhost:5001  ┐
//   API server 2   http://localhost:5002  ├─  load balancer  http://localhost:5000  ←  React app
//   API server 3   http://localhost:5003  ┘
//   Worker         (processes the job queue)
//
// The React app keeps using http://localhost:5000/api, so nothing changes on
// the frontend. Ctrl+C stops everything.
// ─────────────────────────────────────────────────────────────────────────────

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const count = Math.max(1, parseInt(process.argv[2], 10) || parseInt(process.env.STACK_SERVERS, 10) || 3);
const COLORS = [36, 35, 33, 34, 32, 91, 96, 95];

const children = [];

let stopping = false;

// If a server crashes it is restarted after 3 seconds — while it's gone,
// the load balancer sends its traffic to the other servers
function start(name, script, env, color) {
  const child = spawn(process.execPath, [script], {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const prefix = `\x1b[${color}m[${name}]\x1b[0m `;
  const relay = (stream, target) =>
    stream.on("data", (chunk) =>
      chunk
        .toString()
        .split(/\r?\n/)
        .filter(Boolean)
        .forEach((line) => target.write(prefix + line + "\n"))
    );
  relay(child.stdout, process.stdout);
  relay(child.stderr, process.stderr);
  child.on("exit", (code, signal) => {
    console.log(`${prefix}exited (${signal || code})`);
    children.splice(children.indexOf(child), 1);
    if (!stopping) {
      console.log(`${prefix}restarting in 3 s…`);
      setTimeout(() => !stopping && start(name, script, env, color), 3000);
    }
  });
  children.push(child);
  return child;
}

const backends = [];
for (let i = 1; i <= count; i++) {
  const port = 5000 + i;
  backends.push(`http://localhost:${port}`);
  start(`api-${i}`, "server.js", { PORT: String(port), INSTANCE_ID: `api-${i}`, TRUST_PROXY: "1" }, COLORS[(i - 1) % COLORS.length]);
}

start("worker", "worker.js", { INSTANCE_ID: "worker-1" }, 32);
// Give the servers a moment to start before the balancer's first health check
setTimeout(() => start("lb", "loadbalancer/lb.js", { LB_BACKENDS: backends.join(",") }, 97), 1500);

const stop = () => {
  if (stopping) return;
  stopping = true;
  console.log("\nStopping all processes…");
  children.forEach((child) => child.kill("SIGTERM"));
  setTimeout(() => process.exit(0), 5000).unref();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
