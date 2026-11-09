# MUST Clearance — Client-Server Concepts in the Project

How the concepts from **SWE4107 Client Server Programming for Applications** are applied in the Workflow-Driven Student Clearance Management System. For each concept: what it is, where it is in the code, and how to show it working.

## Architecture

```
                                    ┌──────────────┐
  Browser (React)  ──── HTTP ────►  │ Load balancer│  port 5000 (npm run stack)
  • presentation logic              │  round-robin │  or Nginx in Docker
  • client-side validation          │ health checks│
  • live updates (SSE)              └──────┬───────┘
                                ┌──────────┼──────────┐
                                ▼          ▼          ▼
                            API server  API server  API server     ← identical, stateless
                            :5001       :5002       :5003            (or cluster workers)
                                │          │          │
                                └────┬─────┴────┬─────┘
                                     ▼          ▼
                              ┌────────────┐  ┌────────────┐
                              │ PostgreSQL │◄─┤   Worker   │  ← job queue consumer
                              │ data, sessions, queue,     │     (email, reminders)
                              │ rate limits, LISTEN/NOTIFY │
                              └────────────┘
```

Three tiers (L2): **presentation** (React), **application / business logic** (Express API servers), **data** (PostgreSQL). The middle tier is *replicated* behind a load balancer for scalability.

## Concept map

| # | Course concept | Lecture | Where in the project | How to demonstrate |
|---|---|---|---|---|
| 1 | Client/server model, request/response over HTTP | L1, L2 | React client calls the REST API (`frontend/src/api/client.js` → `backend/routes/*`) | Any page; browser DevTools → Network |
| 2 | Client-side vs server-side processing | L1 | Client: form validation (`frontend/src/utils/validators.js`). Server: the same rules enforced again (`backend/utils/validators.js`) plus business rules | Submit an invalid phone number with DevTools; the server still rejects it |
| 3 | Three-tier / n-tier architecture | L2 | React → Express → PostgreSQL; middle tier replicated (`scripts/stack.js`, `docker-compose.yml`) | `npm run stack` |
| 4 | Thin client | L2 | The browser only presents and validates. All rules, data and security are on the server | — |
| 5 | Middleware | L3, L9 | Express middleware chain: request id → CORS → rate limit → `authenticate` → `authorize` → upload checks (`backend/server.js`, `backend/middleware/`) | `backend/server.js` |
| 6 | SQL-oriented data-access middleware (like ODBC/JDBC) | L2, L3 | Sequelize ORM (`backend/models/`), which turns JavaScript calls into SQL | `backend/models/` |
| 7 | Request/reply (synchronous, RPC-style) | L3, L9, RPC | REST endpoints: the client calls a remote "procedure" (`POST /api/officer/requests/:id/decision`) and waits for the reply | Officer decision |
| 8 | **Publish/subscribe (event-based middleware)** | L3, L9 | `backend/services/eventBus.js`: publishers call `pg_notify`, every server LISTENs. `backend/services/realtime.js` pushes events to browsers | Officer approves → the student's page updates without reloading; the header shows **● Live** |
| 9 | **Message-Oriented Middleware (message queue)** | L9 | `jobs` table + `backend/services/jobQueue.js` (producer) + `backend/worker.js` (consumer). Asynchronous and persistent, with retries | Admin → **System status** → Job queue; `backend/logs/outbox.log` |
| 10 | Asynchronous vs synchronous communication | L4 | Decisions are synchronous (the officer waits for the result); emails are asynchronous (queued, sent later by the worker) | — |
| 11 | **Sockets (TCP stream sockets)** | L5, Sockets | `backend/services/mailer.js`: an SMTP client written directly on `net`/`tls` sockets (connect → send/recv → close). Live updates are one long-lived TCP stream per browser | Set `SMTP_*` in `.env` to send real email |
| 12 | **Concurrent server, fork(), pre-forking** | L4, fork.pdf | `backend/cluster.js`: the primary process forks N worker processes that share port 5000, and replaces any that die | `npm run start:cluster`, then kill a worker process |
| 13 | **Thread pool** | L4 | `backend/services/passwordPool.js` + `backend/workers/passwordWorker.js`: a fixed pool of threads for bcrypt; extra tasks wait in a queue | Admin → **System status** → Password thread pool |
| 14 | Concurrency & asynchronous I/O (`select`) | L4, U1-ch3 | Node's event loop (epoll/select underneath) serves thousands of connections on one thread; slow I/O never blocks other clients | `npm run test:scaling` (300 simultaneous requests) |
| 15 | **Connection pooling** | Flask slides | `backend/config/database.js`: a pool of reusable PostgreSQL connections (`DB_POOL_MAX`) | System status → Database connection pool |
| 16 | **Sessions (server-side)** | L1 "manage sessions" | `sessions` table + `backend/services/sessionService.js`. Logout, logout of all devices, idle timeout, admin can end sessions | Admin → **Active sessions** → End session; that browser is logged out with a message |
| 17 | **Load balancing / horizontal scaling** | L1 benefits #4 | `backend/loadbalancer/lb.js` (round-robin or least-connections, active health checks, failover, retries); `deploy/nginx.conf` for production | `npm run stack`; System status → **Send 12 test requests** |
| 18 | Fault tolerance ("dependability on server") | L1 disadvantages | Health checks take dead servers out; `stack.js` restarts crashed servers; the cluster primary re-forks workers; graceful shutdown | `npm run test:scaling` section 7 kills a server mid-test |
| 19 | Stateless servers / shared state | — | Sessions, rate limits, queue and events all live in PostgreSQL, so any server can answer any request (no sticky sessions) | Scaling test section 2 |
| 20 | Concurrency control | L2 (file-server problems) | Database transactions + row locks (`FOR UPDATE`) in `backend/services/workflowService.js`; `SKIP LOCKED` in the queue; atomic upsert for rate limits | Two officers deciding the same request → the second gets "already recorded" |
| 21 | Long-duration transaction processing | Learning outcome 7 | The clearance workflow: states, pause/resume on correction, completed stages never repeated (`workflowService.js`) | Full student → offices → Registrar flow |
| 22 | Client/server security | L2 | Password hashing, signed tokens + server-side sessions, role-based access, shared login rate limit, upload content checks, audit log, HTTPS via Nginx | Admin → System activity |
| 23 | Naming / location transparency | Course outline | Clients use one address (the load balancer); they never know which server answered (only the `X-Served-By` header reveals it) | DevTools → response headers |
| 24 | Caching | — | `backend/utils/cache.js`: per-server cache of the office list, invalidated on every server through the event bus | — |
| 25 | Event listeners (client) | EventListeners | React `onClick`/`onChange`/`onSubmit` handlers; `window` custom events (`live:*`, `notifications:changed`) | `frontend/src/context/LiveEventsContext.jsx` |
| 26 | Deployment mechanisms | Learning outcome 8 | (a) `npm start` single process; (b) `npm run start:cluster`; (c) `npm run stack` multi-server + load balancer; (d) Docker Compose with Nginx and replicas | See "Ways to run it" below |

## Ways to run it

| Mode | Command (in `backend/`) | What you get |
|---|---|---|
| Development | `npm run dev` | One server on port 5000 |
| Concurrent (fork) | `npm run start:cluster` | One process per CPU core sharing port 5000 |
| Scaled out | `npm run stack` | 3 API servers (5001–5003) + worker + load balancer on 5000 |
| Scaled out, 5 servers | `npm run stack -- 5` | 5 API servers |
| Containers | `docker compose up --build` (project root) | Nginx + 3 API replicas + worker + PostgreSQL on http://localhost:8080 |

In every mode, also run `npm run worker` (`stack` starts it for you) so queued emails and reminders are processed.

## Tests

| Command | What it checks |
|---|---|
| `npm run test:e2e` | 63 checks of the clearance workflow (§20 of the plan) |
| `npm run test:scaling` | 25 checks while `npm run stack` is running: load distribution, shared sessions, shared rate limit, live push across servers, message queue, 300 simultaneous requests, failover when a server dies |

Run both on a fresh database (`npm run setup`): first `test:e2e`, then `test:scaling`.
