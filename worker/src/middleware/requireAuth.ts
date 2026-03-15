import { createMiddleware } from "hono/factory";
import { verifyToken } from "../lib/jwt";
import type { Bindings, Variables } from "../types";

type Env = { Bindings: Bindings; Variables: Variables };

export const requireAuth = createMiddleware<Env>(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Missing authorization header" }, 401);
  }

  let payload;
  try {
    payload = await verifyToken(header.slice(7), c.env.JWT_SECRET);
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  // Check KV for revocation — deleted on logout
  const stored = await c.env.KV.get(`session:${payload.jti}`);
  if (!stored) {
    return c.json({ error: "Session has been revoked" }, 401);
  }

  c.set("userId", payload.sub);
  c.set("userRole", payload.role);
  c.set("jti", payload.jti);
  await next();
});

export const requireAdmin = createMiddleware<Env>(async (c, next) => {
  // Must run after requireAuth
  if (c.get("userRole") !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
});
