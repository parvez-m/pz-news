import { Hono } from "hono";
import { requireAuth } from "../middleware/requireAuth";
import type { Bindings, Variables } from "../types";

type SummaryRow = {
  id: string;
  refresh_job_id: string;
  topic_id: string | null;
  title: string;
  summary_text: string;
  source_urls: string; // JSON string in D1
  created_at: number;
};

type SummaryOut = Omit<SummaryRow, "source_urls"> & {
  source_urls: string[];
};

function parseSourceUrls(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const PAGE_SIZE = 20;

const summaries = new Hono<{ Bindings: Bindings; Variables: Variables }>();

summaries.use("/*", requireAuth);

/**
 * GET /api/v1/summaries
 *
 * Returns paginated summaries for the authenticated user, newest first.
 *
 * Query params:
 *   page      integer >= 1, default 1
 *   limit     integer 1–50, default 20
 *   topic_id  optional filter by topic
 */
summaries.get("/", async (c) => {
  const userId = c.get("userId");

  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query("limit") ?? String(PAGE_SIZE), 10)));
  const topicId = c.req.query("topic_id");
  const offset = (page - 1) * limit;

  const baseWhere = topicId
    ? "WHERE user_id = ? AND topic_id = ?"
    : "WHERE user_id = ?";
  const binds = topicId ? [userId, topicId] : [userId];

  const [rows, countRow] = await Promise.all([
    c.env.DB.prepare(
      `SELECT id, refresh_job_id, topic_id, title, summary_text, source_urls, created_at
       FROM summary_documents
       ${baseWhere}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(...binds, limit, offset)
      .all<SummaryRow>(),

    c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM summary_documents ${baseWhere}`
    )
      .bind(...binds)
      .first<{ total: number }>(),
  ]);

  const total = countRow?.total ?? 0;

  const items: SummaryOut[] = (rows.results ?? []).map((row) => ({
    ...row,
    source_urls: parseSourceUrls(row.source_urls),
  }));

  return c.json({
    summaries: items,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
      has_next: offset + limit < total,
    },
  });
});

/**
 * GET /api/v1/summaries/:id
 *
 * Returns a single summary. 404 if it doesn't belong to the requesting user.
 */
summaries.get("/:id", async (c) => {
  const userId = c.get("userId");
  const summaryId = c.req.param("id");

  const row = await c.env.DB.prepare(
    `SELECT id, refresh_job_id, topic_id, title, summary_text, source_urls, created_at
     FROM summary_documents
     WHERE id = ? AND user_id = ?`
  )
    .bind(summaryId, userId)
    .first<SummaryRow>();

  if (!row) return c.json({ error: "Summary not found" }, 404);

  const summary: SummaryOut = {
    ...row,
    source_urls: parseSourceUrls(row.source_urls),
  };

  return c.json({ summary });
});

export default summaries;
