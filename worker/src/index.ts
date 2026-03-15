import { Hono } from "hono";
import type { Bindings, Variables } from "./types";
import authRoutes from "./routes/auth";
import topicsRoutes from "./routes/topics";
import refreshRoutes from "./routes/refresh";
import summariesRoutes from "./routes/summaries";
import glossaryRoutes from "./routes/glossary";
import quizRoutes from "./routes/quiz";
import audioRoutes from "./routes/audio";
import adminRoutes from "./routes/admin";
import { runPipeline } from "./services/pipeline";

const ALLOWED_ORIGINS = [
  "https://pz-news.vercel.app",
  "http://localhost:3000",
];

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORS middleware
app.use("*", async (c, next) => {
  const origin = c.req.header("Origin") ?? "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    c.header("Access-Control-Allow-Origin", origin);
  }
  c.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (c.req.method === "OPTIONS") return c.text("", 204);
  return next();
});

// JSON error handler
app.onError((err, c) => {
  return c.json({ error: err.message || "Internal error" }, 500);
});

app.get("/", (c) => c.json({ status: "ok", service: "pz-news-worker" }));

app.route("/api/v1/auth", authRoutes);
app.route("/api/v1/topics", topicsRoutes);
app.route("/api/v1/refresh", refreshRoutes);
app.route("/api/v1/summaries", summariesRoutes);
app.route("/api/v1/glossary", glossaryRoutes);
app.route("/api/v1/quiz", quizRoutes);
app.route("/api/v1/audio", audioRoutes);
app.route("/api/v1/admin", adminRoutes);

type QueueMessage = { jobId: string; userId: string };

export default {
  fetch: app.fetch,

  async scheduled(_event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    ctx.waitUntil(Promise.resolve());
  },

  async queue(batch: MessageBatch<QueueMessage>, env: Bindings) {
    for (const msg of batch.messages) {
      const { jobId, userId } = msg.body;
      try {
        await runPipeline(jobId, userId, env);
        msg.ack();
      } catch (err) {
        console.error(`Unhandled pipeline error for job ${jobId}:`, err);
        msg.retry();
      }
    }
  },
};
