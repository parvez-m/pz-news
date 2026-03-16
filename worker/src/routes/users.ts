import { Hono } from "hono";
import { requireAuth } from "../middleware/requireAuth";
import type { Bindings, Variables } from "../types";

const users = new Hono<{ Bindings: Bindings; Variables: Variables }>();

users.use("/*", requireAuth);

/**
 * GET /api/v1/users/me
 * Returns the authenticated user's profile.
 */
users.get("/me", async (c) => {
  const userId = c.get("userId");

  const user = await c.env.DB.prepare(
    `SELECT id, email, name, avatar_url, occupation, role FROM users WHERE id = ?`
  )
    .bind(userId)
    .first<{
      id: string;
      email: string;
      name: string | null;
      avatar_url: string | null;
      occupation: string | null;
      role: string;
    }>();

  if (!user) return c.json({ error: "User not found" }, 404);

  return c.json(user);
});

/**
 * PATCH /api/v1/users/me
 * Updates name or occupation.
 */
users.patch("/me", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ name?: string; occupation?: string }>();

  const fields: string[] = [];
  const values: unknown[] = [];

  if (body.name !== undefined) { fields.push("name = ?"); values.push(body.name); }
  if (body.occupation !== undefined) { fields.push("occupation = ?"); values.push(body.occupation); }

  if (fields.length === 0) return c.json({ error: "Nothing to update" }, 400);

  values.push(userId);
  await c.env.DB.prepare(
    `UPDATE users SET ${fields.join(", ")} WHERE id = ?`
  ).bind(...values).run();

  return c.json({ success: true });
});

export default users;
