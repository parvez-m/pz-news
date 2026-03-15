import { Hono } from "hono";
import { requireAuth } from "../middleware/requireAuth";
import { isKeywordSafe } from "../services/contentSafety";
import type { Bindings, Variables } from "../types";

const TOPIC_LIMIT: Record<string, number> = {
  guest: 2,
  user: 20,
  admin: 20,
};

const VALID_TYPES = ["keyword", "youtube_channel", "youtube_playlist"] as const;
type TopicType = (typeof VALID_TYPES)[number];

type Topic = {
  id: string;
  user_id: string;
  type: TopicType;
  value: string;
  display_name: string | null;
  is_active: number;
  created_at: number;
};

const topics = new Hono<{ Bindings: Bindings; Variables: Variables }>();

topics.use("/*", requireAuth);

/**
 * GET /api/v1/topics
 * Returns all active topics for the authenticated user.
 */
topics.get("/", async (c) => {
  const userId = c.get("userId");

  const { results } = await c.env.DB.prepare(
    `SELECT id, type, value, display_name, is_active, created_at
     FROM topics
     WHERE user_id = ? AND is_active = 1
     ORDER BY created_at DESC`
  )
    .bind(userId)
    .all<Omit<Topic, "user_id">>();

  return c.json({ topics: results });
});

/**
 * POST /api/v1/topics
 * Body: { type: TopicType, value: string, display_name?: string }
 *
 * Enforces per-role topic limits and runs a Haiku safety check
 * for keyword topics before inserting into D1.
 */
topics.post("/", async (c) => {
  const userId = c.get("userId");
  const userRole = c.get("userRole");

  const body = await c.req.json<{
    type: TopicType;
    value: string;
    display_name?: string;
  }>();

  // Validate type
  if (!VALID_TYPES.includes(body.type)) {
    return c.json(
      { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
      400
    );
  }

  // Validate value
  const value = body.value?.trim();
  if (!value) {
    return c.json({ error: "value is required" }, 400);
  }

  // Enforce topic limit
  const limit = TOPIC_LIMIT[userRole] ?? 2;
  const countRow = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM topics WHERE user_id = ? AND is_active = 1`
  )
    .bind(userId)
    .first<{ count: number }>();

  if ((countRow?.count ?? 0) >= limit) {
    return c.json(
      { error: `Topic limit reached (max ${limit} for your account)` },
      403
    );
  }

  // Safety check — keywords only
  if (body.type === "keyword") {
    // 1. Fast KV check for admin-blocked keywords (normalized)
    const blocked = await c.env.KV.get(`blocked:keyword:${value.toLowerCase()}`);
    if (blocked !== null) {
      return c.json(
        { error: "This topic was flagged as unsafe and cannot be added" },
        422
      );
    }

    // 2. Claude Haiku classification for everything else
    const safe = await isKeywordSafe(value, c.env.ANTHROPIC_API_KEY);
    if (!safe) {
      return c.json(
        { error: "This topic was flagged as unsafe and cannot be added" },
        422
      );
    }
  }

  const id = crypto.randomUUID();
  const displayName = body.display_name?.trim() || null;

  await c.env.DB.prepare(
    `INSERT INTO topics (id, user_id, type, value, display_name)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(id, userId, body.type, value, displayName)
    .run();

  const topic = await c.env.DB.prepare(
    `SELECT id, type, value, display_name, is_active, created_at
     FROM topics WHERE id = ?`
  )
    .bind(id)
    .first<Omit<Topic, "user_id">>();

  return c.json({ topic }, 201);
});

/**
 * PATCH /api/v1/topics/:id
 * Body: { is_archived: 0 | 1 }
 * Pauses (is_archived=1) or resumes (is_archived=0) a topic.
 */
topics.patch("/:id", async (c) => {
  const userId  = c.get("userId");
  const topicId = c.req.param("id");

  const existing = await c.env.DB.prepare(
    `SELECT id FROM topics WHERE id = ? AND user_id = ? AND is_active = 1`
  )
    .bind(topicId, userId)
    .first<{ id: string }>();

  if (!existing) {
    return c.json({ error: "Topic not found" }, 404);
  }

  const body = await c.req.json<{ is_archived?: number }>();
  const isArchived = body.is_archived === 1 ? 1 : 0;

  await c.env.DB.prepare(
    `UPDATE topics SET is_archived = ? WHERE id = ?`
  )
    .bind(isArchived, topicId)
    .run();

  return c.json({ success: true });
});

/**
 * DELETE /api/v1/topics/:id
 * Soft-deletes the topic (sets is_active = 0).
 * Returns 404 if the topic doesn't belong to the authenticated user.
 */
topics.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const topicId = c.req.param("id");

  const existing = await c.env.DB.prepare(
    `SELECT id FROM topics WHERE id = ? AND user_id = ?`
  )
    .bind(topicId, userId)
    .first<{ id: string }>();

  if (!existing) {
    return c.json({ error: "Topic not found" }, 404);
  }

  await c.env.DB.prepare(
    `UPDATE topics SET is_active = 0 WHERE id = ?`
  )
    .bind(topicId)
    .run();

  return c.json({ success: true });
});

export default topics;
