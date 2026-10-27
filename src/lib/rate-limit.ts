import { connectDB } from "./db";
import { RateLimitModel } from "./models";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const tracker = new Map<string, RateLimitRecord>();

export async function checkRateLimit(
  ip: string,
  limit = 5,
  windowMs = 10 * 60 * 1000
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();

  try {
    const hasMongo = await connectDB();
    if (hasMongo) {
      const resetTime = now + windowMs;
      const expiresAt = new Date(resetTime);

      const doc = await RateLimitModel.findOneAndUpdate(
        { key: ip, resetTime: { $gt: now } },
        { $inc: { count: 1 } },
        { new: true }
      ).lean();

      if (doc) {
        if (doc.count > limit) {
          return { allowed: false, remaining: 0 };
        }
        return { allowed: true, remaining: Math.max(0, limit - doc.count) };
      }

      // Either expired or not found, upsert new window
      await RateLimitModel.findOneAndUpdate(
        { key: ip },
        { $set: { count: 1, resetTime, expiresAt } },
        { upsert: true }
      );
      return { allowed: true, remaining: limit - 1 };
    }
  } catch (err) {
    console.warn("MongoDB rate limit fallback to memory:", err);
  }

  // Memory fallback (local dev or transient Mongo error)
  const record = tracker.get(ip);
  if (!record || now > record.resetTime) {
    tracker.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count };
}

