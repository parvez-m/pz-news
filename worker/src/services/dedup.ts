const SIMILARITY_THRESHOLD = 0.85;
const EMBEDDING_MODEL = "@cf/baai/bge-small-en-v1.5";

type WithEmbedding<T> = T & { embedding: number[] };

function dot(a: number[], b: number[]): number {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

function norm(a: number[]): number {
  return Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
}

function cosineSimilarity(a: number[], b: number[]): number {
  const n = norm(a) * norm(b);
  return n === 0 ? 0 : dot(a, b) / n;
}

/**
 * Generates embeddings for a batch of texts using Cloudflare Workers AI.
 * Returns one embedding vector per input text, in the same order.
 */
export async function generateEmbeddings(
  texts: string[],
  ai: Ai
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const result = await ai.run(EMBEDDING_MODEL as Parameters<Ai["run"]>[0], {
    text: texts,
  } as Parameters<Ai["run"]>[1]);

  // Workers AI returns { shape, data } where data is number[][]
  const data = (result as { data: number[][] }).data;
  return data;
}

/**
 * Deduplicates items by embedding-based cosine similarity.
 *
 * Groups items where similarity > SIMILARITY_THRESHOLD and keeps
 * one representative per group (the first encountered).
 * Returns the surviving items with their embeddings attached.
 */
export function dedup<T extends { raw_content: string }>(
  items: T[],
  embeddings: number[][]
): WithEmbedding<T>[] {
  const withEmbeddings: WithEmbedding<T>[] = items.map((item, i) => ({
    ...item,
    embedding: embeddings[i],
  }));

  const kept: WithEmbedding<T>[] = [];

  for (const candidate of withEmbeddings) {
    const isDuplicate = kept.some(
      (existing) =>
        cosineSimilarity(candidate.embedding, existing.embedding) >=
        SIMILARITY_THRESHOLD
    );
    if (!isDuplicate) kept.push(candidate);
  }

  return kept;
}
