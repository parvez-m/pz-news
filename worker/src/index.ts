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

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

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
    // Daily digest pre-generation for all active users (cron: 0 2 * * *)
    // TODO: query all users with active topics and enqueue refresh jobs
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
