import { sign, verify } from "hono/jwt";
import type { JWTPayload } from "../types";

const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function signToken(
  payload: Pick<JWTPayload, "sub" | "role">,
  secret: string
): Promise<{ token: string; jti: string; expiresIn: number }> {
  const jti = crypto.randomUUID();
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const token = await sign({ ...payload, jti, exp }, secret);
  return { token, jti, expiresIn: TTL_SECONDS };
}

export async function verifyToken(
  token: string,
  secret: string
): Promise<JWTPayload> {
  return verify(token, secret, "HS256") as Promise<JWTPayload>;
}
