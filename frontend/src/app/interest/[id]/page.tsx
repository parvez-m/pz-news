"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  getToken,
  isGuest,
  getTopics,
  getSummaries,
  type Topic,
  type Summary,
} from "@/lib/api";

// ── Helpers ────────────────────────────────────────────────────────────────────

const PALETTE = [
  { color: "#6d28d9", bg: "#f5f3ff" },
  { color: "#be185d", bg: "#fdf2f8" },
  { color: "#1a5e3c", bg: "#e8f5ee" },
  { color: "#1d4ed8", bg: "#eff6ff" },
  { color: "#2e6b4a", bg: "#edf5f0" },
  { color: "#b45309", bg: "#fffbeb" },
  { color: "#0f766e", bg: "#f0fdfa" },
  { color: "#7c3aed", bg: "#ede9fe" },
];

function parseMaybeJSON(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return []; } }
  return [];
}

function topicName(t: Topic) { return t.display_name ?? t.value; }

function topicIcon(type: Topic["type"]) {
  if (type === "youtube_channel")  return "▶";
  if (type === "youtube_playlist") return "📋";
  return "📰";
}

function timeAgo(publishedAt: number): string {
  const diffH = Math.floor((Date.now() / 1000 - publishedAt) / 3600);
  if (diffH < 1)   return "< 1h ago";
  if (diffH === 1) return "1h ago";
  if (diffH < 24)  return `${diffH}h ago`;
  const days = Math.floor(diffH / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

function daysAgoBucket(publishedAt: number): number {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const pubDate    = new Date(publishedAt * 1000); pubDate.setHours(0, 0, 0, 0);
  return Math.round((todayStart.getTime() - pubDate.getTime()) / 86400000);
}

function dayLabel(d: number) {
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

// ── Detail overlay (reused from dashboard pattern) ────────────────────────────

function DetailOverlay({
  summary,
  color,
  bg,
  topicLabel,
  onClose,
}: {
  summary: Summary;
  color: string;
  bg: string;
  topicLabel: string;
  onClose: () => void;
}) {
  const bullets  = parseMaybeJSON(summary.bullets);
  const sources  = parseMaybeJSON(summary.source_urls);
  const keyTerms = parseMaybeJSON(summary.key_terms);

  return (
    <div className="det-overlay">
      <div className="det-header">
        <button className="det-back" onClick={onClose}>←</button>
        <span className="det-topic-badge" style={{ background: bg, color }}>{topicLabel}</span>
      </div>

      <div className="det-scroll">
        <div className="det-body">
          <div style={{ height: 4, background: color, margin: "-22px -20px 22px" }} />
          <div className="det-title">{summary.title}</div>
          <div className="det-byline">
            <span className="det-byline-item">🕐 {timeAgo(summary.published_at)}</span>
            <span className="det-byline-item">📰 {sources.length} source{sources.length !== 1 ? "s" : ""}</span>
            {summary.sentiment !== "neutral" && (
              <span className="det-byline-item">{summary.sentiment === "positive" ? "📈 Positive" : "📉 Negative"}</span>
            )}
          </div>
          <div className="det-intro">{summary.intro}</div>
          {bullets.length > 0 && (
            <>
              <div className="det-section-label">Key Points</div>
              <ul className="det-bullets">
                {bullets.map((b, i) => (
                  <li key={i}>
                    <div className="det-bullet-dot" style={{ background: color }} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {summary.closing && <div className="det-closing">{summary.closing}</div>}
          {keyTerms.length > 0 && (
            <>
              <div className="det-divider" />
              <div className="det-section-label">Key Terms</div>
              <div className="det-terms">{keyTerms.map((t) => <span key={t} className="det-term">{t}</span>)}</div>
            </>
          )}
          {sources.length > 0 && (
            <>
              <div className="det-divider" />
              <div className="det-section-label">{sources.length} Source{sources.length !== 1 ? "s" : ""}</div>
              <div className="det-sources">
                {sources.map((url, i) => {
                  let display = url;
                  try { display = new URL(url).hostname.replace("www.", ""); } catch {}
                  return (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="det-src-row">
                      <div style={{ width: 22, height: 22, borderRadius: 5, background: "var(--rule)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {display.charAt(0).toUpperCase()}
                      </div>
                      {display}
                    </a>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="det-fixed-bar">
        <button className="det-action primary"><span className="a-icon">🎧</span>Listen</button>
        <button className="det-action"><span className="a-icon">🧠</span>Quiz</button>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function InterestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: topicId } = use(params);
  const router = useRouter();

  const [topic,     setTopic]     = useState<Topic | null>(null);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [detail,    setDetail]    = useState<Summary | null>(null);
  const [palette,   setPalette]   = useState(PALETTE[0]);

  useEffect(() => {
    if (!getToken() && !isGuest()) { router.replace("/signin"); return; }

    (async () => {
      try {
        const [topicsRes, summariesRes] = await Promise.all([
          getTopics(),
          getSummaries({ topic_id: topicId, limit: 50 }),
        ]);
        const found = topicsRes.find((t) => t.id === topicId);
        if (!found) { router.replace("/dashboard"); return; }

        const idx = topicsRes.findIndex((t) => t.id === topicId);
        setPalette(PALETTE[idx % PALETTE.length]);
        setTopic(found);
        setSummaries(summariesRes.summaries.sort((a, b) => b.published_at - a.published_at));
      } catch {
        router.replace("/dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [topicId, router]);

  if (loading || !topic) {
    return (
      <div style={{ background: "var(--w)", minHeight: "100vh" }}>
        <div style={{ padding: "13px 20px", borderBottom: "1px solid var(--rule)", display: "flex", alignItems: "center", gap: 12 }}>
          <div className="skel" style={{ width: 34, height: 34, borderRadius: "var(--r)" }} />
          <div className="skel" style={{ height: 14, width: 120 }} />
        </div>
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--rule)" }}>
          <div className="skel" style={{ height: 26, width: "60%", marginBottom: 8 }} />
          <div className="skel" style={{ height: 12, width: "40%" }} />
        </div>
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: "var(--w)", borderRadius: "var(--r2)", border: "1px solid var(--rule)", padding: 15 }}>
              <div className="skel" style={{ height: 16, width: "85%", marginBottom: 8 }} />
              <div className="skel" style={{ height: 13, width: "100%", marginBottom: 5 }} />
              <div className="skel" style={{ height: 13, width: "70%", marginBottom: 10 }} />
              <div className="skel" style={{ height: 10, width: "30%" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Group summaries by day bucket
  const grouped = new Map<number, Summary[]>();
  for (const s of summaries) {
    const d = daysAgoBucket(s.published_at);
    const arr = grouped.get(d) ?? [];
    arr.push(s);
    grouped.set(d, arr);
  }
  const sortedDays = [...grouped.keys()].sort((a, b) => a - b);

  const totalSources = summaries.reduce(
    (n, s) => n + parseMaybeJSON(s.source_urls).length, 0
  );

  return (
    <>
      {detail && (
        <DetailOverlay
          summary={detail}
          color={palette.color}
          bg={palette.bg}
          topicLabel={topicName(topic)}
          onClose={() => setDetail(null)}
        />
      )}

      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>

        {/* Header */}
        <div className="int-det-header">
          <button className="det-back" onClick={() => router.back()}>←</button>
          <span className="det-topic-badge" style={{ background: palette.bg, color: palette.color }}>
            {topicIcon(topic.type)} {topicName(topic)}
          </span>
        </div>

        {/* Hero */}
        <div className="int-det-hero">
          <div className="int-det-name">{topicName(topic)}</div>
          <div className="int-det-meta">
            <span className="int-det-stat">📰 {summaries.length} article{summaries.length !== 1 ? "s" : ""}</span>
            <span className="int-det-stat">🔗 {totalSources} source{totalSources !== 1 ? "s" : ""}</span>
            {summaries.length > 0 && (
              <span className="int-det-stat">🕐 Last: {timeAgo(summaries[0].published_at)}</span>
            )}
          </div>
        </div>

        {/* Feed */}
        <div className="int-det-feed">
          {summaries.length === 0 ? (
            <div className="db-empty" style={{ marginTop: 8 }}>
              <div className="db-empty-icon">📭</div>
              <div className="db-empty-title">No articles yet</div>
              <div className="db-empty-sub">Go back to the dashboard and hit Refresh to fetch content for this topic.</div>
            </div>
          ) : (
            sortedDays.map((d) => (
              <div key={d}>
                <div className="int-date-header">{dayLabel(d)}</div>
                {(grouped.get(d) ?? []).map((s) => {
                  const bullets = parseMaybeJSON(s.bullets);
                  const sources = parseMaybeJSON(s.source_urls);
                  return (
                    <div
                      key={s.id}
                      style={{
                        background: "var(--w)",
                        border: "1px solid var(--rule)",
                        borderRadius: "var(--r2)",
                        marginBottom: 10,
                        overflow: "hidden",
                        boxShadow: "var(--sh1)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onClick={() => setDetail(s)}
                    >
                      <div style={{ height: 3, background: palette.color }} />
                      <div style={{ padding: "13px 15px" }}>
                        <div style={{ fontFamily: "var(--font-serif), serif", fontSize: 16, fontWeight: 400, lineHeight: 1.3, color: "var(--ink)", marginBottom: 8 }}>
                          {s.title}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 8 }}>
                          {s.intro.length > 130 ? s.intro.slice(0, 130) + "…" : s.intro}
                        </div>
                        {bullets.length > 0 && (
                          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 3, marginBottom: 10 }}>
                            {bullets.slice(0, 2).map((b, i) => (
                              <li key={i} style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.5, display: "flex", gap: 7 }}>
                                <span style={{ width: 4, height: 4, borderRadius: "50%", background: palette.color, flexShrink: 0, marginTop: 6, display: "inline-block" }} />
                                {b}
                              </li>
                            ))}
                          </ul>
                        )}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 9, borderTop: "1px solid var(--rule)" }}>
                          <span style={{ fontSize: 11, color: "var(--ink4)" }}>
                            📰 {sources.length} source{sources.length !== 1 ? "s" : ""} · {timeAgo(s.published_at)}
                          </span>
                          <button
                            className="nc-action"
                            onClick={(e) => { e.stopPropagation(); window.alert("Audio coming soon"); }}
                          >
                            🎧 Listen
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

      </div>
    </>
  );
}
