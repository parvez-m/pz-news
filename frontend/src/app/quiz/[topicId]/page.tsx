"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  getToken,
  isGuest,
  getTopics,
  getTopicQuiz,
  generateTopicQuiz,
  submitQuiz,
  type Topic,
  type Quiz,
  type QuizQuestion,
} from "@/lib/api";

// ── Helpers ────────────────────────────────────────────────────────────────────

function topicName(t: Topic) { return t.display_name ?? t.value; }

// ── Loading screen ─────────────────────────────────────────────────────────────

function LoadingScreen({ label }: { label: string }) {
  return (
    <div style={{ background: "var(--w)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40 }}>
      <span className="spinner" style={{ width: 28, height: 28, borderTopColor: "var(--red)", borderColor: "var(--rule)", borderWidth: 3 }} />
      <div style={{ fontSize: 14, color: "var(--ink3)" }}>{label}</div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function QuizPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = use(params);
  const router = useRouter();

  const [topic,     setTopic]     = useState<Topic | null>(null);
  const [quiz,      setQuiz]      = useState<Quiz | null>(null);
  const [phase,     setPhase]     = useState<"loading" | "generating" | "ready" | "done" | "error">("loading");
  const [error,     setError]     = useState<string | null>(null);

  // Active question index
  const [qIdx,      setQIdx]      = useState(0);
  // User's selected answer for each question (null = not yet answered)
  const [answers,   setAnswers]   = useState<(number | null)[]>([]);
  // Whether the current question has been revealed (answer shown)
  const [revealed,  setRevealed]  = useState(false);

  // Final submitted result
  const [result, setResult] = useState<{ score: number; total: number; questions: QuizQuestion[] } | null>(null);

  useEffect(() => {
    if (!getToken() && !isGuest()) { router.replace("/signin"); return; }
    if (isGuest()) { router.replace("/dashboard"); return; } // guests can't quiz

    (async () => {
      try {
        const topics = await getTopics();
        const found  = topics.find((t) => t.id === topicId);
        if (!found) { router.replace("/dashboard"); return; }
        setTopic(found);

        // Try to load an existing incomplete quiz first
        let existing: Quiz | null = null;
        try {
          existing = await getTopicQuiz(topicId);
          // Only reuse if not yet completed
          if (existing.completed_at !== null) existing = null;
        } catch { /* 404 = no quiz yet, that's fine */ }

        if (existing) {
          setQuiz(existing);
          setAnswers(new Array(existing.questions.length).fill(null));
          setPhase("ready");
        } else {
          // Generate fresh
          setPhase("generating");
          const fresh = await generateTopicQuiz(topicId);
          setQuiz(fresh);
          setAnswers(new Array(fresh.questions.length).fill(null));
          setPhase("ready");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load quiz");
        setPhase("error");
      }
    })();
  }, [topicId, router]);

  if (phase === "loading")    return <LoadingScreen label="Loading quiz…" />;
  if (phase === "generating") return <LoadingScreen label="Generating questions from your briefings…" />;

  if (phase === "error" || !quiz || !topic) {
    return (
      <div style={{ background: "var(--w)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div className="qv-header">
          <button className="det-back" onClick={() => router.back()}>←</button>
          <span className="qv-topic-name">Quiz</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>😕</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
            {error ?? "No quiz available"}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 24 }}>
            {error?.includes("No summaries")
              ? "Refresh your digest first to get some articles, then come back."
              : "Something went wrong. Please try again."}
          </div>
          <button className="btn-full primary" style={{ maxWidth: 280 }} onClick={() => router.push("/dashboard")}>
            Back to digest
          </button>
        </div>
      </div>
    );
  }

  const questions = quiz.questions;

  // ── Score screen ─────────────────────────────────────────────────────────────

  if (phase === "done" && result) {
    const pct = Math.round((result.score / result.total) * 100);
    const label =
      result.score === result.total ? "🎉 Perfect!" :
      pct >= 60  ? "👍 Good job!" : "📖 Keep reading!";

    return (
      <div style={{ background: "var(--w)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div className="qv-header">
          <button className="det-back" onClick={() => router.back()}>←</button>
          <span className="qv-topic-name">{topicName(topic)}</span>
        </div>
        <div className="qv-body">
          <div className="qv-result">
            <div className="qv-score">{result.score}/{result.total}</div>
            <div className="qv-score-label">{label}</div>

            {/* Review answers */}
            <div style={{ textAlign: "left", marginBottom: 28 }}>
              {result.questions.map((q, qi) => {
                const userAns  = answers[qi] ?? -1;
                const correct  = q.correct_index ?? 0;
                const isRight  = userAns === correct;
                return (
                  <div key={qi} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--rule)" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isRight ? "var(--grn)" : "#dc2626", marginBottom: 4 }}>
                      {isRight ? "✓" : "✗"} Q{qi + 1}
                    </div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 400, color: "var(--ink)", marginBottom: 8, lineHeight: 1.4 }}>
                      {q.question}
                    </div>
                    {q.options.map((opt, oi) => {
                      const isCorrectOpt = oi === correct;
                      const isUserOpt    = oi === userAns;
                      return (
                        <div key={oi} style={{
                          padding: "7px 12px",
                          borderRadius: "var(--r)",
                          marginBottom: 4,
                          fontSize: 13,
                          background: isCorrectOpt ? "var(--grn-l)" : isUserOpt && !isRight ? "#fef2f2" : "var(--bg)",
                          color: isCorrectOpt ? "var(--grn)" : isUserOpt && !isRight ? "#dc2626" : "var(--ink3)",
                          fontWeight: isCorrectOpt || isUserOpt ? 600 : 400,
                        }}>
                          {["A", "B", "C", "D"][oi]}. {opt}
                          {isCorrectOpt && " ✓"}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="qv-result-actions">
              <button
                className="btn-full primary"
                onClick={async () => {
                  setPhase("generating");
                  setQIdx(0);
                  setRevealed(false);
                  setResult(null);
                  try {
                    const fresh = await generateTopicQuiz(topicId);
                    setQuiz(fresh);
                    setAnswers(new Array(fresh.questions.length).fill(null));
                    setPhase("ready");
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed");
                    setPhase("error");
                  }
                }}
              >
                Try again
              </button>
              <button
                className="btn-full"
                style={{ background: "var(--bg)", border: "1.5px solid var(--rule2)", color: "var(--ink2)", marginTop: 8 }}
                onClick={() => router.push("/dashboard")}
              >
                Back to digest
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Active quiz ───────────────────────────────────────────────────────────────

  const q          = questions[qIdx];
  const LABELS     = ["A", "B", "C", "D"];
  const userAnswer = answers[qIdx];
  const isLast     = qIdx === questions.length - 1;

  async function handleAnswer(optIdx: number) {
    if (revealed) return;
    const newAnswers = [...answers];
    newAnswers[qIdx]  = optIdx;
    setAnswers(newAnswers);
    setRevealed(true);

    // Auto-advance after short delay
    setTimeout(async () => {
      if (isLast) {
        // Submit all answers
        const finalAnswers = newAnswers.map((a) => a ?? 0);
        try {
          const res = await submitQuiz(quiz!.id, finalAnswers);
          setResult({
            score: res.quiz.score ?? 0,
            total: res.quiz.total ?? questions.length,
            questions: res.quiz.questions,
          });
          setPhase("done");
        } catch {
          // Fallback: score locally if submission fails
          const score = finalAnswers.filter((a, i) => a === (questions[i].correct_index ?? -1)).length;
          setResult({ score, total: questions.length, questions });
          setPhase("done");
        }
      } else {
        setQIdx((prev) => prev + 1);
        setRevealed(false);
      }
    }, 950);
  }

  return (
    <div style={{ background: "var(--w)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div className="qv-header">
        <button className="det-back" onClick={() => router.back()}>←</button>
        <span className="qv-topic-name">{topicName(topic)}</span>
      </div>

      {/* Body */}
      <div className="qv-body fade-up">

        {/* Progress segments */}
        <div className="qv-progress">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`qv-seg${i < qIdx ? " done" : i === qIdx ? " active" : ""}`}
            />
          ))}
        </div>

        <div className="qv-q-count">Question {qIdx + 1} of {questions.length}</div>
        <div className="qv-question">{q.question}</div>

        <div className="qv-opts">
          {q.options.map((opt, oi) => {
            let cls = "qv-opt";
            if (revealed) {
              // correct_index is not in the redacted response — colour based on what user picked
              // We'll highlight the user's answer, then on submit we get the real correct ones
              if (oi === userAnswer) cls += " wrong"; // tentatively mark wrong; overridden below if right
              // We can't know the correct one yet (it's redacted) — just highlight selected
              // Actually just highlight user's pick and auto-advance. Score revealed at end.
              // Simplest: just highlight the chosen option, no correct/wrong until submit
            }
            // Override: just show "selected" highlight, not correct/wrong (we don't have the key yet)
            let style: React.CSSProperties = {};
            if (revealed && oi === userAnswer) {
              style = { background: "var(--bg2)", borderColor: "var(--ink3)", color: "var(--ink)" };
            }
            return (
              <button
                key={oi}
                className="qv-opt"
                style={style}
                disabled={revealed}
                onClick={() => handleAnswer(oi)}
              >
                <span className="qv-opt-label" style={revealed && oi === userAnswer ? { background: "var(--ink)", borderColor: "var(--ink)", color: "#fff" } : {}}>
                  {LABELS[oi]}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {revealed && (
          <div style={{ marginTop: 20, fontSize: 13, color: "var(--ink4)", textAlign: "center", animation: "fadeUp 0.3s ease both" }}>
            {isLast ? "Submitting…" : "Next question in a moment…"}
          </div>
        )}

      </div>
    </div>
  );
}
