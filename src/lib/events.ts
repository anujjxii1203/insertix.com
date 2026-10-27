import { EventEmitter } from "events";

class LiveEventsBus extends EventEmitter {}

const globalForEvents = globalThis as unknown as {
  insertixLiveBus: LiveEventsBus | undefined;
};

export const liveEvents = globalForEvents.insertixLiveBus ?? new LiveEventsBus();
liveEvents.setMaxListeners(100);

if (process.env.NODE_ENV !== "production") {
  globalForEvents.insertixLiveBus = liveEvents;
}

export function notifyUpdate(type: "projects" | "team" | "testimonials" | "leads" | "settings") {
  liveEvents.emit("update", { type: `${type}-updated`, timestamp: Date.now() });
}
