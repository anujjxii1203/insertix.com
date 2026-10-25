import { Router, Request, Response } from "express";
import { liveEvents } from "../config/events";

const router = Router();

// GET /api/events
router.get("/", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  const onUpdate = (data: any) => {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch {
      // client disconnected
    }
  };

  liveEvents.on("update", onUpdate);

  // Heartbeat ping every 25s
  const heartbeat = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    liveEvents.off("update", onUpdate);
  });
});

export default router;
