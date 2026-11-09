import fs from "fs";
import net from "net";
import tls from "tls";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

// ─────────────────────────────────────────────────────────────────────────────
// Email sender written directly on TCP sockets (course L5 "Sockets": the
// client flow is socket → connect → send/recv → close).
//
// SMTP is a text protocol: the client sends a command line, the server
// answers with a 3-digit code. This client speaks just enough of it:
//   connect → 220 greeting → EHLO → [STARTTLS] → [AUTH LOGIN] →
//   MAIL FROM → RCPT TO → DATA → message → "." → QUIT
//
// Configuration (.env):
//   SMTP_HOST, SMTP_PORT (465 = TLS from the start, 587 = STARTTLS, 25/1025 = plain)
//   SMTP_USER, SMTP_PASS, MAIL_FROM
// Gmail: SMTP_HOST=smtp.gmail.com, SMTP_PORT=465, an "app password" as SMTP_PASS.
//
// Without SMTP_HOST, emails are written to backend/logs/outbox.log instead,
// so the system works offline and you can still show the emails it sends.
// ─────────────────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTBOX = path.resolve(process.env.OUTBOX_FILE || path.join(__dirname, "..", "logs", "outbox.log"));
const TIMEOUT_MS = 20_000;

export const mailTransport = () => (process.env.SMTP_HOST ? "smtp" : "outbox");

// Reads one complete SMTP reply (possibly several "250-..." lines ending
// with "250 ...") from the socket
function createReader(socket) {
  let buffer = "";
  let waiting = null;

  const tryResolve = () => {
    if (!waiting) return;
    const lines = buffer.split("\r\n");
    for (let i = 0; i < lines.length - 1; i++) {
      if (/^\d{3} /.test(lines[i])) {
        const reply = lines.slice(0, i + 1);
        buffer = lines.slice(i + 1).join("\r\n");
        const { resolve } = waiting;
        waiting = null;
        resolve({ code: parseInt(reply[i].slice(0, 3), 10), lines: reply });
        return;
      }
    }
  };

  const onData = (chunk) => {
    buffer += chunk.toString("utf8");
    tryResolve();
  };
  socket.on("data", onData);

  return {
    next() {
      return new Promise((resolve, reject) => {
        waiting = { resolve, reject };
        tryResolve();
      });
    },
    detach() {
      socket.off("data", onData);
    },
    fail(error) {
      waiting?.reject(error);
      waiting = null;
    },
  };
}

function openSocket({ host, port, secure }) {
  return new Promise((resolve, reject) => {
    const socket = secure
      ? tls.connect({ host, port, servername: host }, () => resolve(socket))
      : net.connect({ host, port }, () => resolve(socket));
    socket.setTimeout(TIMEOUT_MS, () => socket.destroy(new Error("SMTP connection timed out")));
    socket.once("error", reject);
  });
}

async function smtpSend({ to, subject, text }) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || `no-reply@${os.hostname()}`;

  let socket = await openSocket({ host, port, secure: port === 465 });
  let reader = createReader(socket);
  socket.on("error", (error) => reader.fail(error));

  const send = (line) => socket.write(`${line}\r\n`);
  const expect = async (codes, command) => {
    const reply = await reader.next();
    if (!codes.includes(reply.code)) {
      throw new Error(`SMTP ${command || "reply"} failed: ${reply.lines.join(" | ")}`);
    }
    return reply;
  };

  try {
    await expect([220], "greeting");
    send(`EHLO ${os.hostname()}`);
    let ehlo = await expect([250], "EHLO");

    // Upgrade the plain TCP connection to TLS (port 587)
    if (port !== 465 && ehlo.lines.some((l) => /STARTTLS/i.test(l))) {
      send("STARTTLS");
      await expect([220], "STARTTLS");
      reader.detach();
      socket = await new Promise((resolve, reject) => {
        const secured = tls.connect({ socket, servername: host }, () => resolve(secured));
        secured.once("error", reject);
      });
      reader = createReader(socket);
      socket.on("error", (error) => reader.fail(error));
      send(`EHLO ${os.hostname()}`);
      ehlo = await expect([250], "EHLO");
    }

    if (process.env.SMTP_USER) {
      send("AUTH LOGIN");
      await expect([334], "AUTH");
      send(Buffer.from(process.env.SMTP_USER).toString("base64"));
      await expect([334], "AUTH user");
      send(Buffer.from(process.env.SMTP_PASS || "").toString("base64"));
      await expect([235], "AUTH password");
    }

    send(`MAIL FROM:<${from.replace(/.*<|>.*/g, "")}>`);
    await expect([250], "MAIL FROM");
    send(`RCPT TO:<${to}>`);
    await expect([250, 251], "RCPT TO");
    send("DATA");
    await expect([354], "DATA");

    // Lines starting with "." are doubled so they aren't read as the end marker
    const body = text.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
    const message = [
      `From: MUST Clearance <${from.replace(/.*<|>.*/g, "")}>`,
      `To: <${to}>`,
      `Subject: ${subject.replace(/[\r\n]/g, " ")}`,
      `Date: ${new Date().toUTCString()}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8",
      "",
      body,
      ".",
    ].join("\r\n");
    socket.write(`${message}\r\n`);
    await expect([250], "message");

    send("QUIT");
    await reader.next().catch(() => {});
  } finally {
    socket.end();
  }
}

function writeToOutbox({ to, subject, text }) {
  fs.mkdirSync(path.dirname(OUTBOX), { recursive: true });
  const entry = `${"=".repeat(60)}\n${new Date().toISOString()}\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`;
  fs.appendFileSync(OUTBOX, entry);
}

export async function sendMail(message) {
  if (mailTransport() === "smtp") return smtpSend(message);
  return writeToOutbox(message);
}
