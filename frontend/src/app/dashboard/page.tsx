"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getToken,
  isGuest,
  getTopics,
  getSummaries,
  getGlossary,
  triggerRefresh,
  getRefreshStatus,
  deleteTopic,
  archiveTopic,
  type Topic,
  type Summary,
  type GlossaryTerm,
} from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

type MainTab = "digest" | "interests" | "glossary" | "quiz";
type DigestSubTab = "today" | "topics" | "channels" | "playlists";
type RefreshState = "idle" | "triggering" | "running" | "done" | "failed";

// ── Color palette ──────────────────────────────────────────────────────────────

const PALETTE = [
  { color: "#4f46e5", bg: "#eeecff" },
  { color: "#be123c", bg: "#fff1f4" },
  { color: "#1a5e3c", bg: "#e8f5ee" },
  { color: "#1d4ed8", bg: "#eff4ff" },
  { color: "#b45309", bg: "#fefce8" },
  { color: "#0d7490", bg: "#ecfeff" },
  { color: "#334155", bg: "#f1f5f9" },
  { color: "#6d28d9", bg: "#ede9fe" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseMaybeJSON(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

function topicColor(idx: number) { return PALETTE[idx % PALETTE.length]; }

function topicName(t: Topic): string { return t.display_name ?? t.value; }

function topicIcon(type: Topic["type"]): string {
  if (type === "youtube_channel")  return "▶";
  if (type === "youtube_playlist") return "📋";
  return "📰";
}

function daysAgo(publishedAt: number): number {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const pubDate    = new Date(publishedAt * 1000); pubDate.setHours(0, 0, 0, 0);
  return Math.round((todayStart.getTime() - pubDate.getTime()) / 86400000);
}

function dayLabel(d: number): string {
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

function timeAgo(publishedAt: number): string {
  const diffH = Math.floor((Date.now() / 1000 - publishedAt) / 3600);
  if (diffH < 1)  return "< 1h ago";
  if (diffH === 1) return "1h ago";
  if (diffH < 24) return `${diffH}h ago`;
  const days = Math.floor(diffH / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div style={{ background: "var(--w)", borderRadius: "var(--r2)", border: "1px solid var(--rule)", padding: 15, boxShadow: "var(--sh1)" }}>
      <div className="skel" style={{ height: 10, width: "28%", marginBottom: 10 }} />
      <div className="skel" style={{ height: 19, width: "88%", marginBottom: 8 }} />
      <div className="skel" style={{ height: 13, width: "100%", marginBottom: 5 }} />
      <div className="skel" style={{ height: 13, width: "80%", marginBottom: 12 }} />
      <div className="skel" style={{ height: 10, width: "36%" }} />
    </div>
  );
}

// ── Detail overlay ─────────────────────────────────────────────────────────────

function DetailOverlay({
  summary,
  topicColor: tc,
  topicBg,
  topicLabel,
  onClose,
}: {
  summary: Summary;
  topicColor: string;
  topicBg: string;
  topicLabel: string;
  onClose: () => void;
}) {
  const bullets   = parseMaybeJSON(summary.bullets);
  const sources   = parseMaybeJSON(summary.source_urls);
  const keyTerms  = parseMaybeJSON(summary.key_terms);

  return (
    <div className="det-overlay">
      <div className="det-header">
        <button className="det-back" onClick={onClose}>←</button>
        <span className="det-topic-badge" style={{ background: topicBg, color: tc }}>{topicLabel}</span>
      </div>

      <div className="det-scroll">
        <div className="det-body">
          {/* Colour bar */}
          <div style={{ height: 4, background: tc, margin: "-22px -20px 22px" }} />

          <div className="det-title">{summary.title}</div>

          <div className="det-byline">
            <span className="det-byline-item">🕐 {timeAgo(summary.published_at)}</span>
            <span className="det-byline-item">📰 {sources.length} source{sources.length !== 1 ? "s" : ""}</span>
            {summary.sentiment !== "neutral" && (
              <span className="det-byline-item">
                {summary.sentiment === "positive" ? "📈 Positive" : "📉 Negative"}
              </span>
            )}
          </div>

          {/* Intro */}
          <div className="det-intro">{summary.intro}</div>

          {/* Key points */}
          {bullets.length > 0 && (
            <>
              <div className="det-section-label">Key Points</div>
              <ul className="det-bullets">
                {bullets.map((b, i) => (
                  <li key={i}>
                    <div className="det-bullet-dot" style={{ background: tc }} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Closing */}
          {summary.closing && (
            <div className="det-closing">{summary.closing}</div>
          )}

          {/* Key terms */}
          {keyTerms.length > 0 && (
            <>
              <div className="det-divider" />
              <div className="det-section-label">Key Terms</div>
              <div className="det-terms">
                {keyTerms.map((term) => (
                  <span key={term} className="det-term">{term}</span>
                ))}
              </div>
            </>
          )}

          {/* Sources */}
          {sources.length > 0 && (
            <>
              <div className="det-divider" />
              <div className="det-section-label">{sources.length} Source{sources.length !== 1 ? "s" : ""}</div>
              <div className="det-sources">
                {sources.map((url, i) => {
                  let display = url;
                  try { display = new URL(url).hostname.replace("www.", ""); } catch {}
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="det-src-row"
                    >
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

      {/* Fixed bottom bar — Listen + Quiz only */}
      <div className="det-fixed-bar">
        <button className="det-action primary" onClick={() => window.alert("Audio feature coming soon")}>
          <span className="a-icon">🎧</span>
          Listen
        </button>
        <button className="det-action" onClick={() => window.alert("Quiz feature coming soon")}>
          <span className="a-icon">🧠</span>
          Quiz
        </button>
      </div>
    </div>
  );
}

// ── News card ──────────────────────────────────────────────────────────────────

function NewsCard({
  summary,
  color,
  bg,
  topicLabel,
  onOpen,
}: {
  summary: Summary;
  color: string;
  bg: string;
  topicLabel: string;
  onOpen: () => void;
}) {
  const bullets = parseMaybeJSON(summary.bullets);
  const sources = parseMaybeJSON(summary.source_urls);

  return (
    <div className="news-card" onClick={onOpen}>
      <div className="news-card-bar" style={{ background: color }} />
      <div className="news-card-inner">
        <div className="news-card-meta">
          <span className="news-card-topic" style={{ background: bg, color }}>{topicLabel}</span>
          <span className="news-card-time">{timeAgo(summary.published_at)}</span>
        </div>
        <div className="news-card-title">{summary.title}</div>
        <div className="news-card-intro">
          {summary.intro.length > 140 ? summary.intro.slice(0, 140) + "…" : summary.intro}
        </div>
        {bullets.slice(0, 2).length > 0 && (
          <ul className="news-card-bullets">
            {bullets.slice(0, 2).map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        )}
        <div className="news-card-foot">
          <span className="news-card-src">{sources.length} source{sources.length !== 1 ? "s" : ""}</span>
          <div className="news-card-actions">
            <button className="nc-action" onClick={(e) => { e.stopPropagation(); onOpen(); }}>Read →</button>
            <button className="nc-action" onClick={(e) => e.stopPropagation()}>🎧 Listen</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Interest card ──────────────────────────────────────────────────────────────

function InterestCard({
  topic,
  color,
  bg,
  articleCount,
  lastUpdated,
  onPause,
  onDelete,
  onView,
}: {
  topic: Topic;
  color: string;
  bg: string;
  articleCount: number;
  lastUpdated: string;
  onPause: () => void;
  onDelete: () => void;
  onView: () => void;
}) {
  const archived = topic.is_archived === 1;
  return (
    <div className={`int-card${archived ? " archived" : ""}`}>
      <div className="int-card-top">
        <div className="int-icon" style={{ background: bg }}>
          {topicIcon(topic.type)}
        </div>
        <div className="int-name-row">
          <span className="int-name">{topicName(topic)}</span>
          <span className="int-count-badge" style={{ background: bg, color }}>{articleCount}</span>
          {archived && <span className="int-paused-badge">Paused</span>}
        </div>
      </div>
      <div className="int-brief">
        {topic.type === "keyword"          ? `Tracking news for "${topicName(topic)}"` :
         topic.type === "youtube_channel"  ? `YouTube channel summaries` :
                                             `YouTube playlist summaries`}
      </div>
      <div className="int-card-foot">
        <span className="int-last-update">Updated {lastUpdated}</span>
        <div className="int-card-actions">
          <button className="int-action-btn" onClick={onPause}>
            {archived ? "Resume" : "Pause"}
          </button>
          <button className="int-action-btn danger" onClick={onDelete}>Delete</button>
          <button className="int-view-btn" onClick={onView}>View →</button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [guest, setGuest] = useState(false);

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]       = useState<MainTab>("digest");
  const [digestSubTab, setDigestSubTab] = useState<DigestSubTab>("today");

  // ── Data ───────────────────────────────────────────────────────────────────
  const [topics,        setTopics]        = useState<Topic[]>([]);
  const [summaries,     setSummaries]     = useState<Summary[]>([]);
  const [glossary,      setGlossary]      = useState<GlossaryTerm[]>([]);
  const [loadingData,   setLoadingData]   = useState(true);

  // ── Refresh ────────────────────────────────────────────────────────────────
  const [refreshState,  setRefreshState]  = useState<RefreshState>("idle");
  const [refreshJobId,  setRefreshJobId]  = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Detail overlay ─────────────────────────────────────────────────────────
  const [detail, setDetail] = useState<Summary | null>(null);

  // ── Glossary filter ────────────────────────────────────────────────────────
  const [glosFilter, setGlosFilter] = useState<string>("all");

  // ── Group expand state ─────────────────────────────────────────────────────
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    const guestFlag = isGuest();
    if (!token && !guestFlag) {
      router.replace("/signin");
      return;
    }
    setGuest(guestFlag && !token);
  }, [router]);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [topicsRes, summariesRes, glossaryRes] = await Promise.allSettled([
        getTopics(),
        getSummaries({ limit: 50 }),
        getGlossary(),
      ]);
      if (topicsRes.status    === "fulfilled") setTopics(topicsRes.value);
      if (summariesRes.status === "fulfilled") setSummaries(summariesRes.value.summaries);
      if (glossaryRes.status  === "fulfilled") setGlossary(glossaryRes.value);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Refresh polling ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!refreshJobId || refreshState !== "running") return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await getRefreshStatus(refreshJobId);
        if (res.status === "done") {
          clearInterval(pollRef.current!);
          setRefreshState("done");
          setRefreshJobId(null);
          loadData();
        } else if (res.status === "failed") {
          clearInterval(pollRef.current!);
          setRefreshState("failed");
          setRefreshJobId(null);
        }
      } catch {
        clearInterval(pollRef.current!);
        setRefreshState("failed");
      }
    }, 2500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [refreshJobId, refreshState, loadData]);

  // ── Trigger refresh ────────────────────────────────────────────────────────
  async function handleRefresh() {
    if (refreshState === "triggering" || refreshState === "running") return;
    setRefreshState("triggering");
    try {
      const { job_id } = await triggerRefresh();
      setRefreshJobId(job_id);
      setRefreshState("running");
    } catch (err) {
      setRefreshState("failed");
      setTimeout(() => setRefreshState("idle"), 3000);
    }
  }

  // ── Topic palette map ──────────────────────────────────────────────────────
  const topicPalette = new Map(
    topics.map((t, i) => [t.id, topicColor(i)])
  );

  // ── Derived data ───────────────────────────────────────────────────────────
  const summaryByTopic = new Map<string, Summary[]>();
  for (const s of summaries) {
    const arr = summaryByTopic.get(s.topic_id) ?? [];
    arr.push(s);
    summaryByTopic.set(s.topic_id, arr);
  }

  const todaySummaries = summaries.filter(
    (s) => daysAgo(s.published_at) === 0
  );

  const lastUpdatedSummary = summaries.reduce<Summary | null>((best, s) =>
    !best || s.published_at > best.published_at ? s : best, null
  );

  const refreshBusy = refreshState === "triggering" || refreshState === "running";

  const activeTopics = topics.filter((t) => t.is_active === 1);
  const topicsByType = {
    keyword:          activeTopics.filter((t) => t.type === "keyword"),
    youtube_channel:  activeTopics.filter((t) => t.type === "youtube_channel"),
    youtube_playlist: activeTopics.filter((t) => t.type === "youtube_playlist"),
  };

  // ── Glossary topics (for filter pills) ────────────────────────────────────
  const glossaryTopicIds = [...new Set(glossary.map((g) => g.topic_id))];
  const glossaryTopics   = glossaryTopicIds
    .map((id) => topics.find((t) => t.id === id))
    .filter(Boolean) as Topic[];

  const filteredGlossary =
    glosFilter === "all"
      ? glossary
      : glossary.filter((g) => g.topic_id === glosFilter);

  // ── Handle topic actions ───────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm("Delete this interest and all its summaries?")) return;
    try {
      await deleteTopic(id);
      setTopics((prev) => prev.filter((t) => t.id !== id));
      setSummaries((prev) => prev.filter((s) => s.topic_id !== id));
      setGlossary((prev) => prev.filter((g) => g.topic_id !== id));
    } catch { /* silently fail */ }
  }

  async function handlePause(id: string, currentlyArchived: boolean) {
    try {
      await archiveTopic(id, !currentlyArchived);
      setTopics((prev) =>
        prev.map((t) => t.id === id ? { ...t, is_archived: currentlyArchived ? 0 : 1 } : t)
      );
    } catch { /* silently fail */ }
  }

  function toggleGroup(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Render digest sub-tab content ──────────────────────────────────────────

  function renderDetail(s: Summary) {
    const palette = topicPalette.get(s.topic_id) ?? PALETTE[0];
    const topic   = topics.find((t) => t.id === s.topic_id);
    return (
      <DetailOverlay
        summary={s}
        topicColor={palette.color}
        topicBg={palette.bg}
        topicLabel={topic ? topicName(topic) : ""}
        onClose={() => setDetail(null)}
      />
    );
  }

  function renderTodayDigest() {
    if (loadingData) {
      return (
        <>
          <div style={{ marginBottom: 16 }}>
            <div className="skel" style={{ height: 22, width: "55%", marginBottom: 6 }} />
            <div className="skel" style={{ height: 14, width: "80%", marginBottom: 12 }} />
            <div className="skel" style={{ height: 36, width: 200 }} />
          </div>
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </>
      );
    }

    const greetingBlock = (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "var(--font-serif), serif", fontSize: 19, fontWeight: 400, letterSpacing: "-0.3px", marginBottom: 3 }}>
          {greeting()} 👋
        </div>
        <div style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 10 }}>
          Here&apos;s your personalised news for {formatDate()}
        </div>
        <button
          style={{ background: "var(--paper)", border: "1.5px solid var(--rule2)", borderRadius: "var(--r)", padding: "9px 16px", fontSize: 13, fontWeight: 600, color: "var(--ink2)", display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer", transition: "all .2s", fontFamily: "'Satoshi', sans-serif" }}
          onClick={() => window.alert("Full digest audio coming soon")}
        >
          🎧 Listen to today&apos;s full digest
        </button>
      </div>
    );

    if (todaySummaries.length === 0) {
      return (
        <>
          {greetingBlock}
          <div className="db-empty">
            <div className="db-empty-icon">📭</div>
            <div className="db-empty-title">No new updates today</div>
            <div className="db-empty-sub">
              {topics.length === 0
                ? "Add some interests first, then hit Refresh."
                : "Check back after your next refresh, or browse past news in Topics, Channels, and Playlists."}
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        {greetingBlock}
        {todaySummaries.map((s) => {
          const palette = topicPalette.get(s.topic_id) ?? PALETTE[0];
          const topic   = topics.find((t) => t.id === s.topic_id);
          return (
            <NewsCard
              key={s.id}
              summary={s}
              color={palette.color}
              bg={palette.bg}
              topicLabel={topic ? topicName(topic) : ""}
              onOpen={() => setDetail(s)}
            />
          );
        })}
      </>
    );
  }

  function renderGroupedDigest(type: Topic["type"]) {
    const typeTopics = topics.filter(
      (t) => t.type === type && t.is_active === 1 && t.is_archived === 0
    );
    const typeLabel = type === "youtube_channel" ? "channels" : type === "youtube_playlist" ? "playlists" : "topics";

    if (!loadingData && typeTopics.length === 0) {
      return (
        <div className="db-empty">
          <div className="db-empty-icon">🔍</div>
          <div className="db-empty-title">No {typeLabel} added yet</div>
          <div className="db-empty-sub">Go to Interests to add some.</div>
        </div>
      );
    }

    return (
      <>
        {loadingData && [1, 2].map((i) => <CardSkeleton key={i} />)}
        {typeTopics.map((topic) => {
          const palette    = topicPalette.get(topic.id) ?? PALETTE[0];
          const news       = summaryByTopic.get(topic.id) ?? [];
          const todayCount = news.filter((s) => daysAgo(s.published_at) === 0).length;
          const isOpen     = expanded.has(topic.id);

          // Group news by day bucket
          const grouped = new Map<number, Summary[]>();
          for (const s of [...news].sort((a, b) => b.published_at - a.published_at)) {
            const d = daysAgo(s.published_at);
            const arr = grouped.get(d) ?? [];
            arr.push(s);
            grouped.set(d, arr);
          }

          return (
            <div key={topic.id} className="group-card">
              <div className="group-header" onClick={() => toggleGroup(topic.id)}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: palette.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
                  {topicIcon(topic.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{topicName(topic)}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: palette.bg, color: palette.color }}>{news.length}</span>
                    {todayCount > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: "var(--grn-l)", color: "var(--grn)" }}>{todayCount} new</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink4)" }}>
                    {news.length === 0 ? "No articles yet" : `${news.length} article${news.length !== 1 ? "s" : ""}`}
                  </div>
                </div>
                <span className={`group-chevron${isOpen ? " open" : ""}`}>⌄</span>
              </div>

              {isOpen && (
                <div style={{ borderTop: "1px solid var(--rule)" }}>
                  {news.length === 0 ? (
                    <div style={{ padding: "16px", textAlign: "center", fontSize: 13, color: "var(--ink4)" }}>
                      No articles yet. Hit Refresh to fetch content.
                    </div>
                  ) : (
                    [...grouped.entries()]
                      .sort(([a], [b]) => a - b)
                      .map(([d, items]) => (
                        <div key={d}>
                          <div className="date-header">{dayLabel(d)}</div>
                          {items.map((s, i) => (
                            <div
                              key={s.id}
                              className="group-news-row"
                              style={i === items.length - 1 && d === [...grouped.keys()].at(-1) ? { borderBottom: "none" } : {}}
                              onClick={() => setDetail(s)}
                            >
                              <div className="group-news-title">{s.title}</div>
                              <div className="group-news-intro">
                                {s.intro.length > 110 ? s.intro.slice(0, 110) + "…" : s.intro}
                              </div>
                              <div className="group-news-foot">
                                <span className="group-news-meta">
                                  📰 {parseMaybeJSON(s.source_urls).length} sources · {timeAgo(s.published_at)}
                                </span>
                                <button
                                  className="nc-action"
                                  style={{ fontSize: 11 }}
                                  onClick={(e) => { e.stopPropagation(); window.alert("Audio coming soon"); }}
                                >
                                  🎧 Listen
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </>
    );
  }

  // ── Render interests tab ───────────────────────────────────────────────────

  function renderInterests() {
    if (loadingData) {
      return <>{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</>;
    }

    if (topics.length === 0) {
      return (
        <div className="db-empty">
          <div className="db-empty-icon">⭐</div>
          <div className="db-empty-title">No interests yet</div>
          <div className="db-empty-sub">
            <Link href="/onboarding" style={{ color: "var(--red)", fontWeight: 600 }}>Add your first interests →</Link>
          </div>
        </div>
      );
    }

    const sections: [string, Topic["type"]][] = [
      ["📰 Topics", "keyword"],
      ["▶ Channels", "youtube_channel"],
      ["📋 Playlists", "youtube_playlist"],
    ];

    return (
      <div className="interests-panel">
        {sections.map(([label, type]) => {
          const sectionTopics = topics.filter((t) => t.type === type);
          if (sectionTopics.length === 0) return null;
          return (
            <div key={type}>
              <div className="int-section-label">{label}</div>
              {sectionTopics.map((topic, idx) => {
                const palette = topicPalette.get(topic.id) ?? topicColor(idx);
                const news    = summaryByTopic.get(topic.id) ?? [];
                const last    = news.length > 0 ? timeAgo(Math.max(...news.map((s) => s.published_at))) : "Never";
                return (
                  <InterestCard
                    key={topic.id}
                    topic={topic}
                    color={palette.color}
                    bg={palette.bg}
                    articleCount={news.length}
                    lastUpdated={last}
                    onPause={() => handlePause(topic.id, topic.is_archived === 1)}
                    onDelete={() => handleDelete(topic.id)}
                    onView={() => router.push(`/interest/${topic.id}`)}
                  />
                );
              })}
            </div>
          );
        })}

        {/* Add more link */}
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <Link href="/onboarding" style={{ fontSize: 13, color: "var(--red)", fontWeight: 600 }}>
            + Add more interests
          </Link>
        </div>
      </div>
    );
  }

  // ── Render glossary tab ────────────────────────────────────────────────────

  function renderGlossary() {
    return (
      <div className="glossary-panel">
        <div style={{ fontFamily: "var(--font-serif), serif", fontSize: 20, fontWeight: 400, marginBottom: 4 }}>Glossary</div>
        <div style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 12 }}>Terms extracted from your briefings.</div>

        {glossaryTopics.length > 0 && (
          <div className="glos-filters">
            <button
              className={`glos-filter-btn${glosFilter === "all" ? " active" : ""}`}
              onClick={() => setGlosFilter("all")}
            >
              All
            </button>
            {glossaryTopics.map((t) => (
              <button
                key={t.id}
                className={`glos-filter-btn${glosFilter === t.id ? " active" : ""}`}
                onClick={() => setGlosFilter(t.id)}
              >
                {topicName(t)}
              </button>
            ))}
          </div>
        )}

        {loadingData ? (
          [1, 2, 3].map((i) => <CardSkeleton key={i} />)
        ) : filteredGlossary.length === 0 ? (
          <div className="db-empty">
            <div className="db-empty-icon">📖</div>
            <div className="db-empty-title">No terms yet</div>
            <div className="db-empty-sub">Key terms are extracted automatically when you refresh.</div>
          </div>
        ) : (
          filteredGlossary.map((g) => {
            const topic = topics.find((t) => t.id === g.topic_id);
            return (
              <div key={g.id} className="glos-card">
                <div className="glos-term">{g.term}</div>
                <div className="glos-def">{g.definition}</div>
                {topic && <div className="glos-source">From: {topicName(topic)}</div>}
              </div>
            );
          })
        )}
      </div>
    );
  }

  // ── Render quiz tab ────────────────────────────────────────────────────────

  function renderQuiz() {
    const quizableTopics = topics.filter((t) => t.is_active === 1 && t.is_archived === 0);
    return (
      <div className="quiz-select-panel">
        <div className="quiz-sel-title">Quiz yourself</div>
        <div className="quiz-sel-sub">
          Choose an interest. Questions are drawn from all saved news for that topic.
        </div>
        {loadingData ? (
          [1, 2].map((i) => <CardSkeleton key={i} />)
        ) : quizableTopics.length === 0 ? (
          <div className="db-empty">
            <div className="db-empty-icon">🧠</div>
            <div className="db-empty-title">No interests yet</div>
            <div className="db-empty-sub">Add interests and refresh to get quizzable content.</div>
          </div>
        ) : (
          quizableTopics.map((t, idx) => {
            const palette = topicPalette.get(t.id) ?? topicColor(idx);
            const news    = summaryByTopic.get(t.id) ?? [];
            return (
              <div
                key={t.id}
                className="quiz-int-card"
                onClick={() => router.push(`/quiz/${t.id}`)}
              >
                <div className="quiz-int-icon" style={{ background: palette.bg }}>
                  {topicIcon(t.type)}
                </div>
                <div>
                  <div className="quiz-int-name">{topicName(t)}</div>
                  <div className="quiz-int-meta">{news.length} article{news.length !== 1 ? "s" : ""} in pool</div>
                </div>
                <div className="quiz-int-arr">→</div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  // Refresh button label
  const refreshLabel =
    refreshState === "triggering" ? "Starting…" :
    refreshState === "running"    ? "Fetching…" :
    refreshState === "failed"     ? "Failed" :
    "↻ Refresh";

  // Tab counts
  const tabCounts: Record<MainTab, number> = {
    digest:    todaySummaries.length,
    interests: activeTopics.length,
    glossary:  glossary.length,
    quiz:      0,
  };

  const lastUpdatedLabel = lastUpdatedSummary
    ? `today ${new Date(lastUpdatedSummary.published_at * 1000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
    : "never";

  return (
    <>
      {/* Detail overlay (rendered above everything) */}
      {detail && renderDetail(detail)}

      <div className="db-wrap">

        {/* ── Header ── */}
        <div className="db-header">
          <div className="db-top">
            <div className="logo-word" style={{ fontSize: 17 }}>
              <span className="lo-pz">pz</span><span className="lo-dot">•</span><span className="lo-news">news</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {guest && <div className="db-guest-badge">Guest</div>}
              <button
                className="db-avatar"
                onClick={() => router.push("/profile")}
                title="Profile"
              >
                {guest ? "G" : "P"}
              </button>
            </div>
          </div>

          <div className="db-tabs">
            {(["digest", "interests", "glossary", "quiz"] as MainTab[]).map((tab) => (
              <button
                key={tab}
                className={`db-tab${activeTab === tab ? " active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tabCounts[tab] > 0 && (
                  <span className="db-tab-ct">{tabCounts[tab]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Digest meta + sub-tabs (only on digest) ── */}
        {activeTab === "digest" && (
          <>
            <div className="db-digest-meta">
              <div className="db-meta-text">
                Updated <strong>{lastUpdatedLabel}</strong>
                {!guest && <> · <strong>{6 - 0} refreshes</strong> left</>}
              </div>
              <button
                className="btn-refresh"
                onClick={handleRefresh}
                disabled={refreshBusy || (guest && topics.length === 0)}
              >
                {refreshBusy && (
                  <span className="spinner" style={{ width: 11, height: 11, borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} />
                )}
                {refreshLabel}
              </button>
            </div>

            <div className="db-sub-tabs">
              {(["today", "topics", "channels", "playlists"] as DigestSubTab[]).map((sub) => (
                <button
                  key={sub}
                  className={`db-sub-tab${digestSubTab === sub ? " active" : ""}`}
                  onClick={() => setDigestSubTab(sub)}
                >
                  {sub === "today" ? "Today's Digest" :
                   sub === "topics" ? "Topics" :
                   sub === "channels" ? "Channels" : "Playlists"}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Main feed ── */}
        <div className="db-feed">
          {activeTab === "digest" && digestSubTab === "today"     && renderTodayDigest()}
          {activeTab === "digest" && digestSubTab === "topics"    && renderGroupedDigest("keyword")}
          {activeTab === "digest" && digestSubTab === "channels"  && renderGroupedDigest("youtube_channel")}
          {activeTab === "digest" && digestSubTab === "playlists" && renderGroupedDigest("youtube_playlist")}
          {activeTab === "interests" && renderInterests()}
          {activeTab === "glossary"  && renderGlossary()}
          {activeTab === "quiz"      && renderQuiz()}
        </div>

        {/* ── Bottom nav ── */}
        <div className="db-bottom-nav">
          {([
            { tab: "digest",    icon: "📰", label: "Digest"    },
            { tab: "interests", icon: "⭐", label: "Interests" },
            { tab: "glossary",  icon: "📖", label: "Glossary"  },
            { tab: "quiz",      icon: "🧠", label: "Quiz"      },
          ] as { tab: MainTab; icon: string; label: string }[]).map(({ tab, icon, label }) => (
            <button
              key={tab}
              className={`db-nav-btn${activeTab === tab ? " active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              <span className="db-nav-icon">{icon}</span>
              <span className="db-nav-label">{label}</span>
            </button>
          ))}
        </div>

      </div>
    </>
  );
}
