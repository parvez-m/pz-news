import { Hono } from "hono";
import { requireAuth } from "../middleware/requireAuth";
import type { Bindings, Variables } from "../types";

// KV key for rate-limit counters (CLAUDE.md spec)
// Guest:      refresh_count:{userId}             (lifetime, no date)
// Registered: refresh_count:{userId}:{YYYY-MM-DD} (resets daily)
function rateLimitKey(userId: string, role: string): string {
  if (role === "guest") return `refresh_count:${userId}`;
  const today = new Date().toISOString().slice(0, 10);
  return `refresh_count:${userId}:${today}`;
}

const REFRESH_LIMIT: Record<string, number> = {
  guest: 3,
  user: 6,
  admin: 6,
};

const refresh = new Hono<{ Bindings: Bindings; Variables: Variables }>();

refresh.use("/*", requireAuth);

/**
 * POST /api/v1/refresh
 *
 * Checks rate limits, creates a refresh_job record, pushes the job
 * to the Cloudflare Queue, and returns the job ID immediately.
 * The actual pipeline runs asynchronously in the queue consumer.
 */
refresh.post("/", async (c) => {
  const userId = c.get("userId");
  const userRole = c.get("userRole");

  // Ensure user has at least one active topic
  const topicCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM topics WHERE user_id = ? AND is_active = 1`
  )
    .bind(userId)
    .first<{ count: number }>();

  if (!topicCount || topicCount.count === 0) {
    return c.json({ error: "Add at least one topic before refreshing" }, 422);
  }

  // Enforce rate limit via KV
  const kvKey = rateLimitKey(userId, userRole);
  const limit = REFRESH_LIMIT[userRole] ?? 3;
  const current = parseInt((await c.env.KV.get(kvKey)) ?? "0", 10);

  if (current >= limit) {
    return c.json(
      {
        error: `Refresh limit reached (${limit} per ${userRole === "guest" ? "session" : "day"})`,
      },
      429
    );
  }

  // Create job record
  const jobId = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO refresh_jobs (id, user_id, status) VALUES (?, ?, 'pending')`
  )
    .bind(jobId, userId)
    .run();

  // Increment rate-limit counter
  // Guests: no TTL (session-lifetime). Registered: 26 h TTL to cover timezone drift.
  const ttl = userRole === "guest" ? undefined : { expirationTtl: 26 * 60 * 60 };
  await c.env.KV.put(kvKey, String(current + 1), ttl);

  // Push to queue — pipeline runs in queue consumer
  await c.env.QUEUE.send({ jobId, userId });

  return c.json({ jobId, status: "pending" }, 202);
});

/**
 * GET /api/v1/refresh/status/:id
 *
 * Polls the status of a refresh job. Only the job owner can query it.
 */
refresh.get("/status/:id", async (c) => {
  const userId = c.get("userId");
  const jobId = c.req.param("id");

  const job = await c.env.DB.prepare(
    `SELECT id, status, triggered_at, completed_at, error_text
     FROM refresh_jobs
     WHERE id = ? AND user_id = ?`
  )
    .bind(jobId, userId)
    .first<{
      id: string;
      status: string;
      triggered_at: number;
      completed_at: number | null;
      error_text: string | null;
    }>();

  if (!job) return c.json({ error: "Job not found" }, 404);

  return c.json({ job });
});

export default refresh;
