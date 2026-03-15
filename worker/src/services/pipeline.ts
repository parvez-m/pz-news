import { fetchForTopic } from "./fetcher";
import { generateEmbeddings, dedup } from "./dedup";
import {
  preprocessContent,
  summarizeTopic,
  extractGlossaryTerms,
} from "./summarizer";
import type { Bindings } from "../types";

type Topic = {
  id: string;
  type: string;
  value: string;
  display_name: string | null;
};

/**
 * Runs the full refresh pipeline for a single job:
 *
 *  1. Mark job as 'running'
 *  2. Fetch raw content for each topic
 *  3. Embed + deduplicate across all sources
 *  4. Preprocess survivors with Claude Haiku
 *  5. Summarize each topic group with Claude Sonnet
 *  6. Extract glossary terms
 *  7. Mark job as 'done' (or 'failed' on error)
 */
export async function runPipeline(
  jobId: string,
  userId: string,
  env: Bindings
): Promise<void> {
  await setJobStatus(env.DB, jobId, "running");

  try {
    // 1. Load user's active topics
    const { results: topics } = await env.DB.prepare(
      `SELECT id, type, value, display_name FROM topics WHERE user_id = ? AND is_active = 1`
    )
      .bind(userId)
      .all<Topic>();

    if (topics.length === 0) {
      await setJobStatus(env.DB, jobId, "done");
      return;
    }

    // 2. Fetch raw content for every topic in parallel
    const fetchResults = await Promise.allSettled(
      topics.map((topic) =>
        fetchForTopic(topic.type, topic.value, env).then((sources) => ({
          topic,
          sources,
        }))
      )
    );

    // Flatten and store raw sources; build a map from topicId → sources
    const topicSources: Map<string, Array<{ id: string; raw_content: string; source_url: string; title: string }>> =
      new Map();

    for (const result of fetchResults) {
      if (result.status === "rejected") continue;
      const { topic, sources } = result.value;

      const stored: Array<{ id: string; raw_content: string; source_url: string; title: string }> = [];

      for (const src of sources) {
        const sourceId = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO topic_sources (id, topic_id, refresh_job_id, source_url, title, raw_content)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
          .bind(sourceId, topic.id, jobId, src.source_url, src.title, src.raw_content)
          .run();

        stored.push({ id: sourceId, raw_content: src.raw_content, source_url: src.source_url, title: src.title });
      }

      topicSources.set(topic.id, stored);
    }

    // 3. Embed + deduplicate per topic
    for (const topic of topics) {
      const sources = topicSources.get(topic.id) ?? [];
      if (sources.length === 0) continue;

      // Generate embeddings (text = title + content)
      const texts = sources.map((s) => `${s.title}\n${s.raw_content}`.slice(0, 512));
      let embeddings: number[][] = [];
      try {
        embeddings = await generateEmbeddings(texts, env.AI);
      } catch (e) {
        console.error(`Embedding failed for topic ${topic.id}:`, e);
        // Continue without dedup — use all sources
        embeddings = sources.map(() => []);
      }

      // Persist embedding vectors back to topic_sources
      for (let i = 0; i < sources.length; i++) {
        if (embeddings[i]?.length) {
          await env.DB.prepare(
            `UPDATE topic_sources SET embedding_vector = ? WHERE id = ?`
          )
            .bind(JSON.stringify(embeddings[i]), sources[i].id)
            .run();
        }
      }

      // Select unique representatives
      const hasEmbeddings = embeddings.every((e) => e.length > 0);
      const unique = hasEmbeddings ? dedup(sources, embeddings) : sources;

      // 4. Preprocess each unique source with Haiku
      const cleanedArticles: string[] = [];
      for (const src of unique) {
        try {
          const cleaned = await preprocessContent(src.raw_content, env.ANTHROPIC_API_KEY);
          cleanedArticles.push(cleaned);
        } catch (e) {
          console.error(`Haiku preprocessing failed for source ${src.id}:`, e);
          cleanedArticles.push(src.raw_content.slice(0, 300));
        }
      }

      if (cleanedArticles.length === 0) continue;

      // 5. Summarize with Claude Sonnet
      const topicLabel = topic.display_name ?? topic.value;
      let summary;
      try {
        summary = await summarizeTopic(topicLabel, cleanedArticles, env.ANTHROPIC_API_KEY);
      } catch (e) {
        console.error(`Sonnet summarization failed for topic ${topic.id}:`, e);
        continue;
      }

      const summaryId = crypto.randomUUID();
      const summaryText = summary.bullets.join("\n");
      const sourceUrls = unique.map((s) => s.source_url);

      await env.DB.prepare(
        `INSERT INTO summary_documents (id, user_id, refresh_job_id, topic_id, title, summary_text, source_urls)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          summaryId,
          userId,
          jobId,
          topic.id,
          summary.title,
          summaryText,
          JSON.stringify(sourceUrls)
        )
        .run();

      // 6. Extract and upsert glossary terms
      try {
        const terms = await extractGlossaryTerms(summaryText, summary.key_terms, env.ANTHROPIC_API_KEY);
        for (const { term, definition } of terms) {
          await env.DB.prepare(
            `INSERT INTO glossary_terms (id, user_id, term, definition, source_summary_id)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT DO NOTHING`
          )
            .bind(crypto.randomUUID(), userId, term, definition, summaryId)
            .run();
        }
      } catch (e) {
        console.error(`Glossary extraction failed for summary ${summaryId}:`, e);
      }
    }

    await setJobStatus(env.DB, jobId, "done");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Pipeline failed for job ${jobId}:`, message);
    await setJobStatus(env.DB, jobId, "failed", message);
  }
}

async function setJobStatus(
  db: D1Database,
  jobId: string,
  status: string,
  errorText?: string
): Promise<void> {
  if (status === "done" || status === "failed") {
    await db
      .prepare(
        `UPDATE refresh_jobs SET status = ?, completed_at = unixepoch(), error_text = ? WHERE id = ?`
      )
      .bind(status, errorText ?? null, jobId)
      .run();
  } else {
    await db
      .prepare(`UPDATE refresh_jobs SET status = ? WHERE id = ?`)
      .bind(status, jobId)
      .run();
  }
}
