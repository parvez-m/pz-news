/**
 * Uses Claude Haiku to classify whether a topic keyword is safe
 * for a general news briefing platform before it is saved.
 *
 * Blocked categories (from CLAUDE.md): sexual explicit content, hate speech,
 * religious propaganda, political propaganda, extremism / terrorism,
 * self-harm, illegal activity.
 */
export async function isKeywordSafe(
  keyword: string,
  anthropicApiKey: string
): Promise<boolean> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 10,
      messages: [
        {
          role: "user",
          content: `Is the following topic keyword safe for a general news briefing platform?\nReply with only: SAFE or BLOCKED\nTopic: ${keyword}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    // Fail open — don't block users if the safety check itself fails
    console.error("Content safety check failed:", await response.text());
    return true;
  }

  const data = await response.json<{
    content: Array<{ type: string; text: string }>;
  }>();

  const text = data.content?.[0]?.text?.trim().toUpperCase() ?? "";
  return text === "SAFE";
}
