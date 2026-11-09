import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "./AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// Live updates from the server (publish/subscribe).
//
// While someone is logged in, the browser keeps ONE long-lived HTTP
// connection open to GET /api/events. The server pushes a message whenever
// something relevant happens (a stage decided, a request resubmitted, a new
// notification) and screens refresh themselves — no polling, no reload.
//
// The stream is read with fetch() rather than EventSource because
// EventSource can't send the Authorization header. If the connection
// drops (server restarted, network blip, load balancer moved us), it
// reconnects automatically with an increasing delay.
//
// Screens listen with:  useLiveEvent("clearance.changed", () => reload())
// ─────────────────────────────────────────────────────────────────────────────

const LiveEventsContext = createContext({ status: "off", instance: null });

export function LiveEventsProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [status, setStatus] = useState("off"); // off | connecting | live | reconnecting
  const [instance, setInstance] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setStatus("off");
      return undefined;
    }

    let stopped = false;
    let controller = null;
    let retryDelay = 1000;
    let retryTimer = null;
    let connectedBefore = false;

    const dispatch = (type, data) => {
      window.dispatchEvent(new CustomEvent(`live:${type}`, { detail: data }));
      if (type === "notification") window.dispatchEvent(new Event("notifications:changed"));
    };

    async function connect() {
      const token = localStorage.getItem("token");
      if (!token || stopped) return;
      controller = new AbortController();
      setStatus((s) => (s === "live" ? "reconnecting" : "connecting"));

      try {
        const response = await fetch(`${api.defaults.baseURL}/events`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
          signal: controller.signal,
        });

        // Session ended: let the normal API check handle the logout
        if (response.status === 401) {
          api.get("/auth/me").catch(() => {});
          return;
        }
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Messages are separated by a blank line: "event: x\ndata: {...}\n\n"
          let end;
          while ((end = buffer.indexOf("\n\n")) >= 0) {
            const block = buffer.slice(0, end);
            buffer = buffer.slice(end + 2);
            const type = block.match(/^event: (.*)$/m)?.[1];
            const raw = block.match(/^data: (.*)$/m)?.[1];
            if (!type || !raw) continue; // heartbeat comment or retry hint

            let data = {};
            try {
              data = JSON.parse(raw);
            } catch {
              continue;
            }
            if (type === "hello") {
              setInstance(data.instance);
              setStatus("live");
              retryDelay = 1000;
              // Whatever we missed while disconnected: ask screens to refresh once
              if (connectedBefore) dispatch("reconnected", {});
              connectedBefore = true;
            } else {
              dispatch(type, data);
            }
          }
        }
      } catch (error) {
        if (stopped || error.name === "AbortError") return;
      }

      // Stream ended or failed: try again later
      if (!stopped) {
        setStatus("reconnecting");
        retryTimer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 30_000);
      }
    }

    connect();

    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      controller?.abort();
    };
  }, [isAuthenticated, user?.id]);

  return <LiveEventsContext.Provider value={{ status, instance }}>{children}</LiveEventsContext.Provider>;
}

export function useLiveStatus() {
  return useContext(LiveEventsContext);
}

// Runs `handler` whenever the server pushes an event of this type (and once
// after reconnecting, in case something was missed while offline)
export function useLiveEvent(type, handler) {
  useEffect(() => {
    const listener = (event) => handler(event.detail);
    window.addEventListener(`live:${type}`, listener);
    window.addEventListener("live:reconnected", listener);
    return () => {
      window.removeEventListener(`live:${type}`, listener);
      window.removeEventListener("live:reconnected", listener);
    };
  }, [type, handler]);
}
