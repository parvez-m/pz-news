import { Hono } from "hono";
import { requireAuth } from "../middleware/requireAuth";
import type { Bindings, Variables } from "../types";

type GlossaryTerm = {
  id: string;
  term: string;
  definition: string;
  source_summary_id: string | null;
  created_at: number;
};

const glossary = new Hono<{ Bindings: Bindings; Variables: Variables }>();

glossary.use("/*", requireAuth);

/**
 * GET /api/v1/glossary
 *
 * Lists all glossary terms for the authenticated user, A-Z.
 * Supports optional ?q= search against the term name.
 */
glossary.get("/", async (c) => {
  const userId = c.get("userId");
  const q = c.req.query("q")?.trim();

  const rows = q
    ? await c.env.DB.prepare(
        `SELECT id, term, definition, source_summary_id, created_at
         FROM glossary_terms
         WHERE user_id = ? AND term LIKE ?
         ORDER BY term ASC`
      )
        .bind(userId, `%${q}%`)
        .all<GlossaryTerm>()
    : await c.env.DB.prepare(
        `SELECT id, term, definition, source_summary_id, created_at
         FROM glossary_terms
         WHERE user_id = ?
         ORDER BY term ASC`
      )
        .bind(userId)
        .all<GlossaryTerm>();

  return c.json({ terms: rows.results ?? [] });
});

/**
 * POST /api/v1/glossary
 * Body: { term: string, definition: string }
 *
 * Manually adds a glossary term. Silently ignores duplicates
 * (same term for same user) via ON CONFLICT DO NOTHING.
 */
glossary.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ term: string; definition: string }>();

  const term = body.term?.trim();
  const definition = body.definition?.trim();

  if (!term) return c.json({ error: "term is required" }, 400);
  if (!definition) return c.json({ error: "definition is required" }, 400);

  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO glossary_terms (id, user_id, term, definition)
     VALUES (?, ?, ?, ?)
     ON CONFLICT DO NOTHING`
  )
    .bind(id, userId, term, definition)
    .run();

  const saved = await c.env.DB.prepare(
    `SELECT id, term, definition, source_summary_id, created_at
     FROM glossary_terms
     WHERE user_id = ? AND term = ?`
  )
    .bind(userId, term)
    .first<GlossaryTerm>();

  return c.json({ term: saved }, 201);
});

export default glossary;
