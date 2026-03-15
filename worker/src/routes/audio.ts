import { Hono } from "hono";
import { requireAuth } from "../middleware/requireAuth";
import type { Bindings, Variables } from "../types";

type AudioAssetRow = {
  id: string;
  summary_id: string;
  r2_key: string;
  duration_seconds: number | null;
  created_at: number;
};

const audio = new Hono<{ Bindings: Bindings; Variables: Variables }>();

audio.use("/*", requireAuth);

/**
 * POST /api/v1/audio/:summary_id
 *
 * Generates an MP3 via ElevenLabs for the given summary and stores it in R2.
 * Idempotent — returns the existing asset if audio was already generated.
 */
audio.post("/:summary_id", async (c) => {
  const userId = c.get("userId");
  const summaryId = c.req.param("summary_id");

  // Verify ownership
  const summary = await c.env.DB.prepare(
    `SELECT id, title, summary_text FROM summary_documents WHERE id = ? AND user_id = ?`
  )
    .bind(summaryId, userId)
    .first<{ id: string; title: string; summary_text: string }>();

  if (!summary) return c.json({ error: "Summary not found" }, 404);

  // Return existing asset (idempotent)
  const existing = await c.env.DB.prepare(
    `SELECT id, summary_id, r2_key, duration_seconds, created_at
     FROM audio_assets WHERE summary_id = ? AND user_id = ?`
  )
    .bind(summaryId, userId)
    .first<AudioAssetRow>();

  if (existing) {
    return c.json({ audio: existing, stream_url: streamUrl(c.req.url, existing.id) });
  }

  // Build the text to speak: title + bullets
  const speakText = `${summary.title}.\n\n${summary.summary_text}`;

  // Call ElevenLabs TTS
  const ttsRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${c.env.ELEVENLABS_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": c.env.ELEVENLABS_API_KEY,
        "content-type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: speakText,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.5 },
      }),
    }
  );

  if (!ttsRes.ok) {
    const detail = await ttsRes.text();
    console.error("ElevenLabs error:", detail);
    return c.json({ error: "Audio generation failed" }, 502);
  }

  const audioBuffer = await ttsRes.arrayBuffer();
  const assetId = crypto.randomUUID();
  const r2Key = `audio/${userId}/${summaryId}/${assetId}.mp3`;

  // Upload to R2
  await c.env.R2.put(r2Key, audioBuffer, {
    httpMetadata: { contentType: "audio/mpeg" },
  });

  // Persist metadata
  await c.env.DB.prepare(
    `INSERT INTO audio_assets (id, user_id, summary_id, r2_key)
     VALUES (?, ?, ?, ?)`
  )
    .bind(assetId, userId, summaryId, r2Key)
    .run();

  const asset: AudioAssetRow = {
    id: assetId,
    summary_id: summaryId,
    r2_key: r2Key,
    duration_seconds: null,
    created_at: Math.floor(Date.now() / 1000),
  };

  return c.json(
    { audio: asset, stream_url: streamUrl(c.req.url, assetId) },
    201
  );
});

/**
 * GET /api/v1/audio/:id
 *
 * Returns audio asset metadata and a stream_url for playback.
 */
audio.get("/:id", async (c) => {
  const userId = c.get("userId");
  const assetId = c.req.param("id");

  const asset = await c.env.DB.prepare(
    `SELECT id, summary_id, r2_key, duration_seconds, created_at
     FROM audio_assets WHERE id = ? AND user_id = ?`
  )
    .bind(assetId, userId)
    .first<AudioAssetRow>();

  if (!asset) return c.json({ error: "Audio asset not found" }, 404);

  return c.json({ audio: asset, stream_url: streamUrl(c.req.url, assetId) });
});

/**
 * GET /api/v1/audio/:id/stream
 *
 * Streams the MP3 directly from R2. Requires auth (same JWT check above).
 */
audio.get("/:id/stream", async (c) => {
  const userId = c.get("userId");
  const assetId = c.req.param("id");

  const asset = await c.env.DB.prepare(
    `SELECT r2_key FROM audio_assets WHERE id = ? AND user_id = ?`
  )
    .bind(assetId, userId)
    .first<{ r2_key: string }>();

  if (!asset) return c.json({ error: "Audio asset not found" }, 404);

  const object = await c.env.R2.get(asset.r2_key);
  if (!object) return c.json({ error: "Audio file not found in storage" }, 404);

  return new Response(object.body, {
    headers: {
      "content-type": "audio/mpeg",
      "cache-control": "private, max-age=3600",
    },
  });
});

/** Constructs an absolute stream URL from the current request URL */
function streamUrl(requestUrl: string, assetId: string): string {
  const url = new URL(requestUrl);
  return `${url.origin}/api/v1/audio/${assetId}/stream`;
}

export default audio;
