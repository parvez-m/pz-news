import { Hono } from "hono";
import { signToken } from "../lib/jwt";
import { requireAuth } from "../middleware/requireAuth";
import type { Bindings, Variables } from "../types";

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

type GoogleTokenInfo = {
  sub: string;
  email: string;
  name: string;
  picture: string;
  aud: string;
  exp: string;
  error_description?: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

/**
 * POST /api/v1/auth/google
 * Body: { code: string; redirect_uri: string }  ← Authorization Code flow
 *    or { id_token: string }                     ← legacy ID-token flow
 *
 * Verifies the user with Google, upserts in D1,
 * issues an app JWT, and stores the session in KV.
 */
auth.post("/google", async (c) => {
  const body = await c.req.json<{
    code?: string;
    redirect_uri?: string;
    id_token?: string;
  }>();

  let idToken: string;

  if (body.code) {
    // ── Authorization Code flow ───────────────────────────────────────────
    if (!body.redirect_uri) {
      return c.json({ error: "redirect_uri is required with code" }, 400);
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: body.code,
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: body.redirect_uri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json<GoogleTokenResponse>();

    if (!tokenRes.ok || !tokens.id_token) {
      return c.json(
        { error: tokens.error_description ?? tokens.error ?? "Failed to exchange auth code" },
        401
      );
    }

    idToken = tokens.id_token;
  } else if (body.id_token) {
    // ── Legacy ID-token flow ──────────────────────────────────────────────
    idToken = body.id_token;
  } else {
    return c.json({ error: "code or id_token is required" }, 400);
  }

  // Verify id_token with Google's tokeninfo endpoint
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
  );
  const google = await res.json<GoogleTokenInfo>();

  if (!res.ok) {
    return c.json({ error: "Invalid Google token", detail: google.error_description }, 401);
  }

  if (google.aud !== c.env.GOOGLE_CLIENT_ID) {
    return c.json({ error: "Token audience mismatch" }, 401);
  }

  // Upsert user — Google sub is stable per account, used as our user id
  await c.env.DB.prepare(
    `INSERT INTO users (id, email, name, avatar_url)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name       = excluded.name,
       avatar_url = excluded.avatar_url`
  )
    .bind(google.sub, google.email, google.name ?? null, google.picture ?? null)
    .run();

  const user = await c.env.DB.prepare(
    `SELECT id, role FROM users WHERE id = ?`
  )
    .bind(google.sub)
    .first<{ id: string; role: string }>();

  if (!user) {
    return c.json({ error: "Failed to load user after upsert" }, 500);
  }

  const { token, jti, expiresIn } = await signToken(
    { sub: user.id, role: user.role },
    c.env.JWT_SECRET
  );

  await c.env.KV.put(`session:${jti}`, user.id, { expirationTtl: expiresIn });

  return c.json({ token, expires_in: expiresIn });
});

/**
 * POST /api/v1/auth/logout
 */
auth.post("/logout", requireAuth, async (c) => {
  await c.env.KV.delete(`session:${c.get("jti")}`);
  return c.json({ success: true });
});

export default auth;
