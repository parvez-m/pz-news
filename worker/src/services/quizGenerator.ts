export type QuizQuestion = {
  question: string;
  options: string[];
  correct_index: number;
};

/**
 * Generates 5 multiple-choice quiz questions from a summary
 * using Claude Haiku. Returns the raw question array.
 */
export async function generateQuiz(
  summaryText: string,
  apiKey: string
): Promise<QuizQuestion[]> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Given the following summary, generate 5 multiple-choice quiz questions to test comprehension. Each question must have exactly 4 options with one correct answer.\n\nReturn only a JSON array with no extra text:\n[{"question": "...", "options": ["A", "B", "C", "D"], "correct_index": 0}]\n\nSummary:\n${summaryText}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status}`);
  }

  const data = await res.json<{
    content: Array<{ type: string; text: string }>;
  }>();

  const raw = data.content?.[0]?.text ?? "";
  const jsonText = raw
    .replace(/^```(?:json)?\n?/, "")
    .replace(/\n?```$/, "")
    .trim();

  const parsed = JSON.parse(jsonText);
  if (!Array.isArray(parsed)) throw new Error("Quiz response was not an array");
  return parsed as QuizQuestion[];
}
