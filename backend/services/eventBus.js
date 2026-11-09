import pg from "pg";
import sequelize, { connectionConfig } from "../config/database.js";
import { INSTANCE_ID } from "../utils/instance.js";

// ─────────────────────────────────────────────────────────────────────────────
// Event bus — publish/subscribe middleware (course L3/L9: "Event-based
// middleware: publishers publish events, subscribers express interest, the
// event service notifies interested subscribers").
//
// Built on PostgreSQL LISTEN/NOTIFY, so it needs nothing extra to install:
//   publish():   SELECT pg_notify('clearance_events', '<json>')
//   subscribe(): every server process keeps ONE connection that LISTENs on
//                the channel and passes each event to its handlers.
//
// Why it's needed: with several servers behind the load balancer, a student
// may be connected (for live updates) to server A while the officer who
// approves their stage is talking to server B. B publishes the event, the
// database delivers it to every server, and A pushes it to the student.
//
// Publishing inside a database transaction means the event is only
// delivered if the transaction commits — subscribers never hear about a
// change that was rolled back.
// ─────────────────────────────────────────────────────────────────────────────

export const CHANNEL = "clearance_events";
const MAX_PAYLOAD = 7900; // PostgreSQL limit is 8000 bytes

const handlers = new Set();
let client = null;
let connected = false;
let stopping = false;
let reconnectDelay = 1000;
let received = 0;

export async function publish(type, data = {}, transaction) {
  const payload = JSON.stringify({ type, data, origin: INSTANCE_ID, at: Date.now() });
  if (Buffer.byteLength(payload) > MAX_PAYLOAD) {
    console.warn(`Event ${type} is too large to publish (${payload.length} bytes)`);
    return;
  }
  await sequelize.query("SELECT pg_notify(:channel, :payload)", {
    replacements: { channel: CHANNEL, payload },
    transaction,
  });
}

export function subscribe(handler) {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

async function connect() {
  client = new pg.Client({ ...connectionConfig, application_name: `must-clearance-events:${INSTANCE_ID}`.slice(0, 63) });

  client.on("notification", (message) => {
    received++;
    let event;
    try {
      event = JSON.parse(message.payload);
    } catch {
      return;
    }
    for (const handler of handlers) {
      try {
        handler(event);
      } catch (error) {
        console.error("Event handler error:", error.message);
      }
    }
  });

  // If the listening connection drops, reconnect with back-off
  const onDisconnect = () => {
    if (!connected && client === null) return;
    connected = false;
    client = null;
    if (!stopping) {
      setTimeout(() => connect().catch(() => {}), reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
    }
  };
  client.on("error", onDisconnect);
  client.on("end", onDisconnect);

  try {
    await client.connect();
    await client.query(`LISTEN ${CHANNEL}`);
    connected = true;
    reconnectDelay = 1000;
  } catch (error) {
    console.error("Event bus connection failed:", error.message);
    onDisconnect();
  }
}

export async function startEventBus() {
  stopping = false;
  if (!client) await connect();
}

export async function stopEventBus() {
  stopping = true;
  connected = false;
  const c = client;
  client = null;
  await c?.end().catch(() => {});
}

export function eventBusStatus() {
  return { connected, channel: CHANNEL, eventsReceived: received, subscribers: handlers.size };
}
