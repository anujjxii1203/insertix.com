import { EventEmitter } from "events";

class LiveEventsEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }
}

export const liveEvents = new LiveEventsEmitter();

export function notifyUpdate(type: "projects" | "team" | "testimonials" | "leads" | "settings") {
  liveEvents.emit("update", { type: `${type}-updated`, timestamp: Date.now() });
}
