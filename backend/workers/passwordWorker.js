import { parentPort } from "worker_threads";
import bcrypt from "bcryptjs";

// Runs inside a worker THREAD (see services/passwordPool.js).
// bcrypt is deliberately slow CPU work; doing it here keeps the server's
// main thread free to answer other clients while a password is checked.
parentPort.on("message", async ({ id, op, password, hash, rounds }) => {
  try {
    const result = op === "hash" ? await bcrypt.hash(password, rounds) : await bcrypt.compare(password, hash);
    parentPort.postMessage({ id, result });
  } catch (error) {
    parentPort.postMessage({ id, error: error.message });
  }
});
