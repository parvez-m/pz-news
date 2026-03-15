import { Hono } from "hono";
import { requireAuth } from "../middleware/requireAuth";
import { generateQuiz } from "../services/quizGenerator";
import type { Bindings, Variables } from "../types";
import type { QuizQuestion } from "../services/quizGenerator";

type QuizRow = {
  id: string;
  topic_id: string;
  questions: string; // JSON in D1
  score: number | null;
  completed_at: number | null;
  created_at: number;
};

function parseQuestions(raw: string): QuizQuestion[] {
  try { return JSON.parse(raw) as QuizQuestion[]; }
  catch { return []; }
}

/** Strip correct_index so answers aren't leaked before submission */
function redactAnswers(
  questions: QuizQuestion[]
): Omit<QuizQuestion, "correct_index">[] {
  return questions.map(({ question, options }) => ({ question, options }));
}

const quiz = new Hono<{ Bindings: Bindings; Variables: Variables }>();

quiz.use("/*", requireAuth);

/**
 * GET /api/v1/quiz?topic_id=
 * Returns the latest quiz for a topic. 404 if none exists yet.
 */
quiz.get("/", async (c) => {
  const userId  = c.get("userId");
  const topicId = c.req.query("topic_id");

  if (!topicId) return c.json({ error: "topic_id is required" }, 400);

  const row = await c.env.DB.prepare(
    `SELECT id, topic_id, questions, score, completed_at, created_at
     FROM quiz_sets WHERE topic_id = ? AND user_id = ?
     ORDER BY created_at DESC LIMIT 1`
  )
    .bind(topicId, userId)
    .first<QuizRow>();

  if (!row) return c.json({ error: "No quiz found for this topic" }, 404);

  const questions = parseQuestions(row.questions);
  return c.json({
    quiz: {
      ...row,
      questions: row.completed_at ? questions : redactAnswers(questions),
    },
  });
});

/**
 * POST /api/v1/quiz/generate
 * Body: { topic_id: string }
 *
 * Generates a new quiz from all saved summaries for the topic.
 * Returns 400 if no summaries exist yet for that topic.
 */
quiz.post("/generate", async (c) => {
  const userId = c.get("userId");
  const body   = await c.req.json<{ topic_id?: string }>();
  const topicId = body.topic_id?.trim();

  if (!topicId) return c.json({ error: "topic_id is required" }, 400);

  // Verify the topic belongs to this user
  const topic = await c.env.DB.prepare(
    `SELECT id FROM topics WHERE id = ? AND user_id = ? AND is_active = 1`
  )
    .bind(topicId, userId)
    .first<{ id: string }>();

  if (!topic) return c.json({ error: "Topic not found" }, 404);

  // Fetch all summaries for this topic
  const { results: summaries } = await c.env.DB.prepare(
    `SELECT title, intro, bullets, closing FROM summary_documents
     WHERE topic_id = ? AND user_id = ?
     ORDER BY published_at DESC LIMIT 10`
  )
    .bind(topicId, userId)
    .all<{ title: string; intro: string; bullets: string; closing: string }>();

  if (summaries.length === 0) {
    return c.json({ error: "No summaries found for this topic — refresh first" }, 400);
  }

  // Combine summaries into a single text block for the quiz generator
  const combinedText = summaries
    .map((s, i) => {
      const bullets = (() => { try { return (JSON.parse(s.bullets) as string[]).join("; "); } catch { return s.bullets; } })();
      return `Article ${i + 1}:\nTitle: ${s.title}\n${s.intro}\nKey points: ${bullets}\n${s.closing}`;
    })
    .join("\n\n---\n\n");

  let questions: QuizQuestion[];
  try {
    questions = await generateQuiz(combinedText, c.env.ANTHROPIC_API_KEY);
  } catch (err) {
    console.error("Quiz generation failed:", err);
    return c.json({ error: "Failed to generate quiz, try again later" }, 502);
  }

  const quizId = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO quiz_sets (id, user_id, topic_id, questions) VALUES (?, ?, ?, ?)`
  )
    .bind(quizId, userId, topicId, JSON.stringify(questions))
    .run();

  return c.json({
    quiz: {
      id: quizId,
      topic_id: topicId,
      questions: redactAnswers(questions),
      score: null,
      completed_at: null,
      created_at: Math.floor(Date.now() / 1000),
    },
  }, 201);
});

/**
 * POST /api/v1/quiz/:id/submit
 * Body: { answers: number[] }  — one index per question
 *
 * Scores the submission, persists score + completed_at,
 * and returns the full questions with correct_index revealed.
 */
quiz.post("/:id/submit", async (c) => {
  const userId = c.get("userId");
  const quizId = c.req.param("id");

  const row = await c.env.DB.prepare(
    `SELECT id, topic_id, questions, score, completed_at
     FROM quiz_sets WHERE id = ? AND user_id = ?`
  )
    .bind(quizId, userId)
    .first<QuizRow>();

  if (!row) return c.json({ error: "Quiz not found" }, 404);
  if (row.completed_at !== null) {
    return c.json({ error: "Quiz already submitted" }, 409);
  }

  const body = await c.req.json<{ answers: number[] }>();
  if (!Array.isArray(body.answers)) {
    return c.json({ error: "answers must be an array of integers" }, 400);
  }

  const questions = parseQuestions(row.questions);

  if (body.answers.length !== questions.length) {
    return c.json(
      { error: `Expected ${questions.length} answers, got ${body.answers.length}` },
      400
    );
  }

  const score = body.answers.reduce(
    (total, answer, i) => total + (answer === questions[i].correct_index ? 1 : 0),
    0
  );

  await c.env.DB.prepare(
    `UPDATE quiz_sets SET score = ?, completed_at = unixepoch() WHERE id = ?`
  )
    .bind(score, quizId)
    .run();

  return c.json({
    quiz: {
      id: quizId,
      topic_id: row.topic_id,
      questions, // correct_index now revealed
      score,
      total: questions.length,
      completed_at: Math.floor(Date.now() / 1000),
    },
  });
});

export default quiz;
