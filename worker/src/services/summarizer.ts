import type { RawSource } from "./fetcher";

type AnthropicMessage = { role: "user" | "assistant"; content: string };

async function callClaude(
  model: string,
  maxTokens: number,
  messages: AnthropicMessage[],
  apiKey: string
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json<{
    content: Array<{ type: string; text: string }>;
  }>();
  return data.content?.[0]?.text ?? "";
}

// ── Haiku preprocessing ───────────────────────────────────────────────────────

/**
 * Cleans raw article text using Claude Haiku.
 * Removes ads, author bios, navigation text, and boilerplate.
 * Returns clean prose (max 300 words).
 */
export async function preprocessContent(
  rawContent: string,
  apiKey: string
): Promise<string> {
  if (!rawContent.trim()) return "";

  return callClaude(
    "claude-haiku-4-5-20251001",
    400,
    [
      {
        role: "user",
        content: `You are a content cleaner. Given the following raw article text, extract only the factual content. Remove ads, navigation text, author bios, and boilerplate. Return clean prose only. Max 300 words.\n\nArticle:\n${rawContent}`,
      },
    ],
    apiKey
  );
}

// ── Sonnet summarization ──────────────────────────────────────────────────────

export type SummaryResult = {
  title: string;
  bullets: string[];
  key_terms: string[];
  sentiment: "neutral" | "positive" | "negative";
};

/**
 * Synthesizes a structured daily briefing for a topic using Claude Sonnet.
 * Follows the exact prompt format specified in CLAUDE.md.
 */
export async function summarizeTopic(
  topic: string,
  cleanedArticles: string[],
  apiKey: string
): Promise<SummaryResult> {
  const articlesText = cleanedArticles
    .map((a, i) => `[${i + 1}] ${a}`)
    .join("\n\n");

  const raw = await callClaude(
    "claude-sonnet-4-6",
    1024,
    [
      {
        role: "user",
        content: `You are a briefing writer. Given the following cleaned articles about "${topic}", write a structured daily briefing.\n\nFormat your response as JSON:\n{\n  "title": "Brief headline for this topic update",\n  "bullets": ["key point 1", "key point 2", "key point 3"],\n  "key_terms": ["term1", "term2"],\n  "sentiment": "neutral | positive | negative"\n}\n\nArticles:\n${articlesText}`,
      },
    ],
    apiKey
  );

  // Strip markdown code fences if present
  const jsonText = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  try {
    return JSON.parse(jsonText) as SummaryResult;
  } catch {
    // Fallback if Sonnet doesn't return valid JSON
    return {
      title: `Update: ${topic}`,
      bullets: [raw.slice(0, 300)],
      key_terms: [],
      sentiment: "neutral",
    };
  }
}

// ── Glossary extraction ───────────────────────────────────────────────────────

export type GlossaryTerm = { term: string; definition: string };

/**
 * Extracts glossary terms from a summary document using Claude Haiku.
 * Returns up to 5 terms with concise definitions.
 */
export async function extractGlossaryTerms(
  summaryText: string,
  keyTerms: string[],
  apiKey: string
): Promise<GlossaryTerm[]> {
  if (keyTerms.length === 0) return [];

  const raw = await callClaude(
    "claude-haiku-4-5-20251001",
    512,
    [
      {
        role: "user",
        content: `Given the following summary and list of key terms, provide a brief one-sentence definition for each term as it is used in this context. Return JSON array: [{"term": "...", "definition": "..."}]. Max 5 terms.\n\nSummary:\n${summaryText}\n\nTerms: ${keyTerms.join(", ")}`,
      },
    ],
    apiKey
  );

  const jsonText = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  try {
    const parsed = JSON.parse(jsonText);
    return Array.isArray(parsed) ? (parsed as GlossaryTerm[]) : [];
  } catch {
    return [];
  }
}

// ── Convenience re-export ─────────────────────────────────────────────────────

export type { RawSource };
