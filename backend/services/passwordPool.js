import os from "os";
import { Worker } from "worker_threads";

// ─────────────────────────────────────────────────────────────────────────────
// Thread pool for password hashing (course L4 "Server concurrency models:
// Thread pool — create a pool, allocate threads to queries as needed, return
// the thread to the pool when the query is served, queue other queries when
// all threads are busy").
//
// Node runs JavaScript on one main thread. bcrypt takes ~70 ms of pure CPU
// per password; done on the main thread, 20 students logging in at once
// would freeze the server for over a second. Here a FIXED number of worker
// threads does that work in parallel while the main thread keeps serving
// other requests.
// ─────────────────────────────────────────────────────────────────────────────

const WORKER_FILE = new URL("../workers/passwordWorker.js", import.meta.url);
const POOL_SIZE = Math.max(1, parseInt(process.env.PASSWORD_THREADS, 10) || Math.min(2, os.availableParallelism?.() || 2));
const BCRYPT_ROUNDS = 10;

const idle = []; // threads waiting for work
const all = new Set(); // every thread in the pool
const queue = []; // tasks waiting for a free thread
const pending = new Map(); // task id -> { resolve, reject }
let nextId = 1;
let completed = 0;
let shuttingDown = false;

function spawnThread() {
  const worker = new Worker(WORKER_FILE);
  worker.currentTask = null;

  worker.on("message", ({ id, result, error }) => {
    const task = pending.get(id);
    pending.delete(id);
    worker.currentTask = null;
    completed++;
    if (task) error ? task.reject(new Error(error)) : task.resolve(result);
    release(worker);
  });

  // A crashed thread is replaced, and its task fails instead of hanging
  worker.on("error", (error) => {
    if (worker.currentTask) {
      pending.get(worker.currentTask)?.reject(error);
      pending.delete(worker.currentTask);
    }
  });
  worker.on("exit", () => {
    all.delete(worker);
    const index = idle.indexOf(worker);
    if (index >= 0) idle.splice(index, 1);
    if (!shuttingDown) release(spawnThread());
  });

  all.add(worker);
  return worker;
}

// Give a free thread the next queued task, or put it back in the pool
function release(worker) {
  const next = queue.shift();
  if (next) {
    worker.currentTask = next.id;
    worker.postMessage(next);
  } else {
    idle.push(worker);
  }
}

function run(message) {
  if (all.size === 0) {
    for (let i = 0; i < POOL_SIZE; i++) idle.push(spawnThread());
  }

  return new Promise((resolve, reject) => {
    const task = { id: nextId++, ...message };
    pending.set(task.id, { resolve, reject });
    const worker = idle.shift();
    if (worker) {
      worker.currentTask = task.id;
      worker.postMessage(task);
    } else {
      queue.push(task); // all threads busy: wait in the queue
    }
  });
}

export const hashPassword = (password) => run({ op: "hash", password, rounds: BCRYPT_ROUNDS });
export const verifyPassword = (password, hash) => run({ op: "compare", password, hash });

export function passwordPoolStats() {
  return { threads: all.size, size: POOL_SIZE, idle: idle.length, queued: queue.length, completed };
}

export async function shutdownPasswordPool() {
  shuttingDown = true;
  await Promise.all([...all].map((worker) => worker.terminate()));
}
