import { Hono } from "hono";
import { requireAuth, requireAdmin } from "../middleware/requireAuth";
import type { Bindings, Variables } from "../types";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: number;
};

type JobRow = {
  id: string;
  user_id: string;
  user_email: string | null;
  status: string;
  triggered_at: number;
  completed_at: number | null;
  error_text: string | null;
};

const admin = new Hono<{ Bindings: Bindings; Variables: Variables }>();

admin.use("/*", requireAuth, requireAdmin);

// ── Users ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/users
 *
 * Lists all users, newest first.
 * Query params: page (default 1), limit (default 50, max 100)
 */
admin.get("/users", async (c) => {
  const page  = Math.max(1, parseInt(c.req.query("page")  ?? "1",  10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10)));
  const offset = (page - 1) * limit;

  const [rows, countRow] = await Promise.all([
    c.env.DB.prepare(
      `SELECT id, email, name, avatar_url, role, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(limit, offset)
      .all<UserRow>(),

    c.env.DB.prepare(`SELECT COUNT(*) as total FROM users`)
      .first<{ total: number }>(),
  ]);

  const total = countRow?.total ?? 0;

  return c.json({
    users: rows.results ?? [],
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
      has_next: offset + limit < total,
    },
  });
});

// ── Jobs ──────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/jobs
 *
 * Lists all refresh jobs across all users, newest first.
 * Joins with users to include the requester's email for quick inspection.
 * Query params: page, limit, status (optional filter)
 */
admin.get("/jobs", async (c) => {
  const page   = Math.max(1, parseInt(c.req.query("page")  ?? "1",  10));
  const limit  = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10)));
  const status = c.req.query("status"); // optional filter
  const offset = (page - 1) * limit;

  const whereClause = status ? "WHERE rj.status = ?" : "";
  const binds = status
    ? [status, limit, offset]
    : [limit, offset];

  const countBinds = status ? [status] : [];

  const [rows, countRow] = await Promise.all([
    c.env.DB.prepare(
      `SELECT rj.id, rj.user_id, u.email AS user_email,
              rj.status, rj.triggered_at, rj.completed_at, rj.error_text
       FROM refresh_jobs rj
       LEFT JOIN users u ON u.id = rj.user_id
       ${whereClause}
       ORDER BY rj.triggered_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(...binds)
      .all<JobRow>(),

    c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM refresh_jobs rj ${whereClause}`
    )
      .bind(...countBinds)
      .first<{ total: number }>(),
  ]);

  const total = countRow?.total ?? 0;

  return c.json({
    jobs: rows.results ?? [],
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
      has_next: offset + limit < total,
    },
  });
});

// ── Topic moderation ──────────────────────────────────────────────────────────

/**
 * POST /api/v1/admin/topics/block
 * Body: { keyword: string }
 *
 * Stores the normalised keyword in KV under `blocked:keyword:{keyword}`.
 * Also soft-deletes every existing active topic that matches the keyword
 * so current users lose access immediately.
 */
admin.post("/topics/block", async (c) => {
  const body = await c.req.json<{ keyword: string }>();
  const keyword = body.keyword?.trim();

  if (!keyword) return c.json({ error: "keyword is required" }, 400);

  const normalised = keyword.toLowerCase();
  const kvKey = `blocked:keyword:${normalised}`;

  // Idempotent — check if already blocked
  const existing = await c.env.KV.get(kvKey);
  if (existing !== null) {
    return c.json({ message: "Keyword was already blocked", keyword: normalised });
  }

  // Persist block in KV (no TTL — permanent until manually removed)
  await c.env.KV.put(kvKey, "1");

  // Soft-delete all matching active topics across all users
  const { meta } = await c.env.DB.prepare(
    `UPDATE topics SET is_active = 0
     WHERE type = 'keyword'
       AND is_active = 1
       AND LOWER(value) = ?`
  )
    .bind(normalised)
    .run();

  return c.json({
    success: true,
    keyword: normalised,
    topics_deactivated: meta.changes ?? 0,
  });
});

export default admin;
