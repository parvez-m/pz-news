export type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  QUEUE: Queue;
  ENVIRONMENT: string;
  GOOGLE_CLIENT_ID: string;
  JWT_SECRET: string;
  ANTHROPIC_API_KEY: string;
  NEWS_API_KEY: string;
  YOUTUBE_API_KEY: string;
  AI: Ai;
  R2: R2Bucket;
  ELEVENLABS_API_KEY: string;
  ELEVENLABS_VOICE_ID: string;
};

export type Variables = {
  userId: string;
  userRole: string;
  jti: string;
};

export type JWTPayload = {
  sub: string;   // user id
  role: string;
  jti: string;   // token id — used for KV-based revocation
  exp: number;
};
