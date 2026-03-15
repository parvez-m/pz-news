"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTopic, isGuest, getToken, type TopicType } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

type Step = "occupation" | "select" | "verify" | "schedule";
type SugTab = "topics" | "channels" | "playlists";
type VerifyStatus = "checking" | "ok" | "blocked" | "err";
type Schedule = "once" | "twice" | "manual";
type Occupation = "student" | "founder" | "employee" | "intern" | "jobseeker" | "other";

interface TopicEntry {
  id: string;
  type: TopicType;
  value: string;
}

interface VerifyEntry extends TopicEntry {
  status: VerifyStatus;
  error?: string;
}

// ── Data ────────────────────────────────────────────────────────────────────────

const OCCUPATIONS: { id: Occupation; icon: string; label: string }[] = [
  { id: "student",   icon: "🎓", label: "Student" },
  { id: "founder",   icon: "🚀", label: "Founder or Business owner" },
  { id: "employee",  icon: "💼", label: "Full-time employee" },
  { id: "intern",    icon: "🌱", label: "Intern" },
  { id: "jobseeker", icon: "🔍", label: "Looking for jobs" },
  { id: "other",     icon: "✨", label: "Other" },
];

const SUGGESTIONS: Record<SugTab, { label: string; type: TopicType }[]> = {
  topics: [
    { label: "Generative AI",              type: "keyword" },
    { label: "AI Agents",                  type: "keyword" },
    { label: "AI Native Development",      type: "keyword" },
    { label: "Vibe Coding",                type: "keyword" },
    { label: "Developer Experience",       type: "keyword" },
    { label: "Product Led Growth",         type: "keyword" },
    { label: "Design Systems",             type: "keyword" },
    { label: "Cloud Native Architecture",  type: "keyword" },
    { label: "Multi Agent Systems",        type: "keyword" },
  ],
  channels: [
    { label: "https://www.youtube.com/c/Fireship",          type: "youtube_channel" },
    { label: "https://www.youtube.com/c/Freecodecamp",      type: "youtube_channel" },
    { label: "https://www.youtube.com/c/ThePrimeagen",      type: "youtube_channel" },
    { label: "https://www.youtube.com/c/TraversyMedia",     type: "youtube_channel" },
    { label: "https://www.youtube.com/c/ProductSchool",     type: "youtube_channel" },
    { label: "https://www.youtube.com/c/YCombinator",       type: "youtube_channel" },
    { label: "https://www.youtube.com/c/DesignCourse",      type: "youtube_channel" },
    { label: "https://www.youtube.com/c/TwoMinutePapers",   type: "youtube_channel" },
    { label: "https://www.youtube.com/c/GoogleDevelopers",  type: "youtube_channel" },
  ],
  playlists: [
    { label: "https://www.youtube.com/playlist?list=PLhQjrBD2T381NyO-bf9n5YJZ5v1dTn8qJ", type: "youtube_playlist" },
    { label: "https://www.youtube.com/playlist?list=PLkDaE6sCZn6FNC6YRfRQc_FbeQrF8BwGI", type: "youtube_playlist" },
    { label: "https://www.youtube.com/playlist?list=PLMCXHnjXnTnttRB6Ecnf3YqT4vB6G3KxR", type: "youtube_playlist" },
    { label: "https://www.youtube.com/playlist?list=PLQ-uHSnFig5NV4Jw1c6hK0QmXkYV6H1yC", type: "youtube_playlist" },
    { label: "https://www.youtube.com/playlist?list=PL5q_lef6zVkaTyZEDVQf9W2VJkG7gH8fU", type: "youtube_playlist" },
    { label: "https://www.youtube.com/playlist?list=PLTZYG7bZ1u6qj0pYQF0EY50jYOEoTP0RF", type: "youtube_playlist" },
    { label: "https://www.youtube.com/playlist?list=PL0vfts4VzfNiX_9y6H0IYp5hN0nqD1L4k", type: "youtube_playlist" },
    { label: "https://www.youtube.com/playlist?list=PLJbE2Yu2zumCFXz3oD5pX7YhG7FQ0y9JH", type: "youtube_playlist" },
    { label: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbmMuZ3saqRIBimAKIMYkt0E", type: "youtube_playlist" },
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────────

function typeIcon(type: TopicType): string {
  if (type === "youtube_channel")  return "▶";
  if (type === "youtube_playlist") return "📋";
  return "📰";
}

function typeLabelClass(type: TopicType): string {
  if (type === "youtube_channel")  return "channel";
  if (type === "youtube_playlist") return "playlist";
  return "";
}

function sugChipClass(entry: TopicEntry | undefined): string {
  if (!entry) return "";
  if (entry.type === "youtube_channel")  return "sel-ch";
  if (entry.type === "youtube_playlist") return "sel-pl";
  return "sel";
}

function addHours(timeStr: string, hours: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = (h + hours) % 24;
  const hh = String(total).padStart(2, "0");
  const mm = String(m ?? 0).padStart(2, "0");
  return `${hh}:${mm}`;
}

function fmtTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const hr = h % 12 || 12;
  const mm = String(m ?? 0).padStart(2, "0");
  return `${hr}:${mm} ${ampm}`;
}

function CheckingSpinner() {
  return (
    <span
      className="spinner"
      style={{ borderTopColor: "var(--ink4)", borderColor: "var(--rule2)", width: 12, height: 12 }}
    />
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [guest, setGuest] = useState(false);
  const [step, setStep] = useState<Step>("occupation");
  const [sugTab, setSugTab] = useState<SugTab>("topics");

  // Step 0
  const [occupation, setOccupation] = useState<Occupation | null>(null);

  // Step 1 inputs
  const [keywordInput, setKeywordInput]   = useState("");
  const [channelInput, setChannelInput]   = useState("");
  const [playlistInput, setPlaylistInput] = useState("");
  const [entries, setEntries] = useState<TopicEntry[]>([]);

  // Step verify
  const [verifyItems, setVerifyItems] = useState<VerifyEntry[]>([]);

  // Step 3 schedule
  const [schedule, setSchedule] = useState<Schedule>("once");
  const [time1, setTime1] = useState("07:00");
  const [submitting, setSubmitting] = useState(false);

  const GUEST_LIMIT = 2;

  useEffect(() => {
    const token = getToken();
    const guestFlag = isGuest();
    if (!token && !guestFlag) { router.replace("/signin"); return; }
    setGuest(guestFlag && !token);
  }, [router]);

  // ── Entry helpers ────────────────────────────────────────────────────────────

  function addEntry(type: TopicType, raw: string) {
    const value = raw.trim();
    if (!value) return;
    if (guest && entries.filter((e) => e.type === "keyword").length >= GUEST_LIMIT && type === "keyword") return;
    if (entries.find((e) => e.type === type && e.value.toLowerCase() === value.toLowerCase())) return;
    setEntries((prev) => [...prev, { id: crypto.randomUUID(), type, value }]);
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function toggleSuggestion(label: string, type: TopicType) {
    const existing = entries.find(
      (e) => e.type === type && e.value.toLowerCase() === label.toLowerCase()
    );
    if (existing) { removeEntry(existing.id); }
    else { addEntry(type, label); }
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    type: TopicType,
    value: string,
    clear: () => void
  ) {
    if (e.key === "Enter") { e.preventDefault(); addEntry(type, value); clear(); }
  }

  // ── Verify ────────────────────────────────────────────────────────────────────

  const runVerify = useCallback(async () => {
    setStep("verify");
    const items: VerifyEntry[] = entries.map((e) => ({ ...e, status: "checking" as VerifyStatus }));
    setVerifyItems([...items]);

    if (guest) {
      await new Promise((r) => setTimeout(r, 800));
      setVerifyItems((prev) => prev.map((v) => ({ ...v, status: "ok" })));
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        await createTopic(item.type, item.value);
        items[i] = { ...item, status: "ok" };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed";
        const isBlocked = msg.toLowerCase().includes("block") || msg.toLowerCase().includes("safe");
        items[i] = { ...item, status: isBlocked ? "blocked" : "err", error: msg };
      }
      setVerifyItems([...items]);
    }
  }, [entries, guest]);

  // ── Finish ────────────────────────────────────────────────────────────────────

  async function handleFinish() {
    setSubmitting(true);
    localStorage.setItem("pz_schedule", JSON.stringify({ type: schedule, time1 }));
    if (occupation) localStorage.setItem("pz_occupation", occupation);
    router.push("/dashboard");
  }

  // ── Derived ────────────────────────────────────────────────────────────────────

  const keywords  = entries.filter((e) => e.type === "keyword");
  const channels  = entries.filter((e) => e.type === "youtube_channel");
  const playlists = entries.filter((e) => e.type === "youtube_playlist");
  const atGuestLimit = guest && keywords.length >= GUEST_LIMIT;
  const verifyDone = verifyItems.length > 0 && verifyItems.every((v) => v.status !== "checking");

  const progressPct =
    step === "occupation" ? 0 :
    step === "select"     ? 33 :
    step === "verify"     ? 66 : 100;

  const stepLabel =
    step === "occupation" ? "Step 1 of 3" :
    step === "select"     ? "Step 2 of 3" :
    step === "verify"     ? "Step 2 of 3: Verifying..." :
    "Step 3 of 3";

  function backFrom(s: Step) {
    if (s === "occupation") router.push("/signin");
    else if (s === "select")   setStep("occupation");
    else if (s === "verify")   setStep("select");
    else                       setStep("verify");
  }

  const time2 = addHours(time1, 12);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="ob-wrap">

      {/* Progress bar */}
      <div className="ob-progress">
        <div className="ob-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Nav */}
      <div className="ob-nav">
        {step === "occupation" ? (
          <Link href="/signin" className="ob-back" aria-label="Back">←</Link>
        ) : (
          <button className="ob-back" onClick={() => backFrom(step)} aria-label="Back">←</button>
        )}
        <div className="ob-step-lbl">{stepLabel}</div>
        <div style={{ width: 48 }} />
      </div>

      {/* ── STEP 0: OCCUPATION ──────────────────────────────────────── */}
      {step === "occupation" && (
        <>
          <div className="ob-body">
            <div className="ob-title">What best describes you?</div>
            <p className="ob-sub">This helps us personalise your topic suggestions. You can change this anytime.</p>
            <div className="occ-grid">
              {OCCUPATIONS.map((occ) => (
                <button
                  key={occ.id}
                  className={`occ-card${occupation === occ.id ? " on" : ""}`}
                  onClick={() => setOccupation(occ.id)}
                >
                  <span className="occ-icon">{occ.icon}</span>
                  <span className="occ-label">{occ.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="ob-footer">
            <button
              className="btn-full primary"
              disabled={!occupation}
              onClick={() => setStep("select")}
            >
              Continue →
            </button>
          </div>
        </>
      )}

      {/* ── STEP 1: SELECT ──────────────────────────────────────────── */}
      {step === "select" && (
        <>
          <div className="ob-body">
            <div className="ob-title">Add your interests</div>
            <p className="ob-sub">
              Type a topic keyword, or paste a YouTube channel or playlist URL.
            </p>

            {entries.length > 0 && (
              <div className="ob-sel-bar">
                ✓ {entries.length} {entries.length === 1 ? "interest" : "interests"} selected
                {guest && ` · ${GUEST_LIMIT - keywords.length} keyword${GUEST_LIMIT - keywords.length !== 1 ? "s" : ""} remaining`}
              </div>
            )}

            {atGuestLimit && (
              <div className="ob-guest-upgrade">
                <strong>Guest limit reached.</strong> You&apos;ve added the maximum 2 topics.{" "}
                <Link href="/signin">Sign in with Google</Link> to add up to 20 topics, channels, and playlists.
              </div>
            )}

            {/* Keywords */}
            <div className="ob-input-section">
              <div className="ob-input-label">📰 Topics <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--ink4)", fontSize: 11 }}>enter a keyword</span></div>
              <div className="ob-input-row">
                <input className="ob-input" placeholder="e.g. Quantum Computing, AI Agents…"
                  value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "keyword", keywordInput, () => setKeywordInput(""))}
                  disabled={atGuestLimit} />
                <button className="ob-add-btn"
                  onClick={() => { addEntry("keyword", keywordInput); setKeywordInput(""); }}
                  disabled={!keywordInput.trim() || atGuestLimit}>Add</button>
              </div>
              {keywords.length > 0 && (
                <div className="ob-tags">
                  {keywords.map((e) => (
                    <span key={e.id} className="ob-tag">
                      {e.value}
                      <button className="ob-tag-x" onClick={() => removeEntry(e.id)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Channels (registered only) */}
            {!guest && (
              <div className="ob-input-section">
                <div className="ob-input-label">▶ YouTube Channels <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--ink4)", fontSize: 11 }}>paste channel URL</span></div>
                <div className="ob-input-row">
                  <input className="ob-input" placeholder="e.g. https://youtube.com/@lexfridman"
                    value={channelInput} onChange={(e) => setChannelInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, "youtube_channel", channelInput, () => setChannelInput(""))} />
                  <button className="ob-add-btn"
                    onClick={() => { addEntry("youtube_channel", channelInput); setChannelInput(""); }}
                    disabled={!channelInput.trim()}>Add</button>
                </div>
                {channels.length > 0 && (
                  <div className="ob-tags">
                    {channels.map((e) => (
                      <span key={e.id} className={`ob-tag ${typeLabelClass(e.type)}`}>
                        {typeIcon(e.type)} {e.value}
                        <button className="ob-tag-x" onClick={() => removeEntry(e.id)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Playlists (registered only) */}
            {!guest && (
              <div className="ob-input-section">
                <div className="ob-input-label">📋 Playlists <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--ink4)", fontSize: 11 }}>paste playlist URL</span></div>
                <div className="ob-input-row">
                  <input className="ob-input" placeholder="e.g. https://youtube.com/playlist?list=…"
                    value={playlistInput} onChange={(e) => setPlaylistInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, "youtube_playlist", playlistInput, () => setPlaylistInput(""))} />
                  <button className="ob-add-btn"
                    onClick={() => { addEntry("youtube_playlist", playlistInput); setPlaylistInput(""); }}
                    disabled={!playlistInput.trim()}>Add</button>
                </div>
                {playlists.length > 0 && (
                  <div className="ob-tags">
                    {playlists.map((e) => (
                      <span key={e.id} className={`ob-tag ${typeLabelClass(e.type)}`}>
                        {typeIcon(e.type)} {e.value}
                        <button className="ob-tag-x" onClick={() => removeEntry(e.id)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Suggestions */}
            <div className="ob-sug-section">
              <div className="ob-sug-head">
                <div className="ob-sug-label">Suggestions</div>
                <div className="ob-sug-tabs">
                  {(["topics", ...(guest ? [] : ["channels", "playlists"])] as SugTab[]).map((tab) => (
                    <button key={tab} className={`ob-sug-tab${sugTab === tab ? " active" : ""}`} onClick={() => setSugTab(tab)}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ob-sug-chips">
                {SUGGESTIONS[sugTab].map(({ label, type }) => {
                  const matched = entries.find((e) => e.type === type && e.value.toLowerCase() === label.toLowerCase());
                  const disabled = !matched && atGuestLimit && type === "keyword";
                  return (
                    <button key={label}
                      className={`ob-sug-chip ${matched ? sugChipClass(matched) : ""}`}
                      onClick={() => !disabled && toggleSuggestion(label, type)}
                      disabled={disabled}
                      style={disabled ? { opacity: 0.4, cursor: "not-allowed" } : undefined}>
                      {matched ? "✓ " : ""}{label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="ob-footer">
            <button className="btn-full primary" disabled={entries.length === 0} onClick={runVerify}>
              Review my selections →
            </button>
          </div>
        </>
      )}

      {/* ── VERIFY ──────────────────────────────────────────────────── */}
      {step === "verify" && (
        <>
          <div className="ob-body">
            <div className="ob-verify-title">
              {verifyDone ? "Review your selections" : "Checking your interests…"}
            </div>
            <p className="ob-verify-sub">
              {verifyDone
                ? "We've checked your entries. Topics marked as excluded contain restricted keywords."
                : "Just a moment while we validate your selections."}
            </p>

            {keywords.length > 0 && (
              <div className="verify-section">
                <div className="verify-section-label">Topics & Keywords</div>
                {verifyItems.filter((v) => v.type === "keyword").map((v) => (
                  <div key={v.id} className={`v-item${v.status === "blocked" ? " blocked" : ""}`}>
                    <span className="v-icon">📰</span>
                    <span className="v-name">{v.value}</span>
                    <span className={`v-status${v.status === "ok" ? " ok" : v.status === "blocked" ? " blocked" : v.status === "err" ? " blocked" : ""}`}>
                      {v.status === "checking" && <CheckingSpinner />}
                      {v.status === "ok"       && "✓ Safe"}
                      {(v.status === "blocked" || v.status === "err") && "✗ Excluded"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {channels.length > 0 && (
              <div className="verify-section">
                <div className="verify-section-label">YouTube Channels</div>
                {verifyItems.filter((v) => v.type === "youtube_channel").map((v) => (
                  <div key={v.id} className={`v-item${v.status === "blocked" || v.status === "err" ? " blocked" : ""}`}>
                    <span className="v-icon">▶</span>
                    <span className="v-name">{v.value}</span>
                    <span className={`v-status${v.status === "ok" ? " ok" : " blocked"}`}>
                      {v.status === "checking" && <CheckingSpinner />}
                      {v.status === "ok" && "✓ Safe"}
                      {(v.status === "blocked" || v.status === "err") && "✗ Excluded"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {playlists.length > 0 && (
              <div className="verify-section">
                <div className="verify-section-label">YouTube Playlists</div>
                {verifyItems.filter((v) => v.type === "youtube_playlist").map((v) => (
                  <div key={v.id} className={`v-item${v.status === "blocked" || v.status === "err" ? " blocked" : ""}`}>
                    <span className="v-icon">📋</span>
                    <span className="v-name">{v.value}</span>
                    <span className={`v-status${v.status === "ok" ? " ok" : " blocked"}`}>
                      {v.status === "checking" && <CheckingSpinner />}
                      {v.status === "ok" && "✓ Safe"}
                      {(v.status === "blocked" || v.status === "err") && "✗ Excluded"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ob-footer">
            <button className="btn-full primary" disabled={!verifyDone} onClick={() => setStep("schedule")}>
              {verifyDone ? "Looks good, continue →" : "Verifying…"}
            </button>
          </div>
        </>
      )}

      {/* ── STEP 2: SCHEDULE ────────────────────────────────────────── */}
      {step === "schedule" && (
        <>
          <div className="ob-body">
            <div className="ob-title">When do you want your briefing?</div>
            <p className="ob-sub">Choose a schedule. You can change this anytime from your profile.</p>

            <div className="ob-sched-opts">

              {/* Once a day */}
              <button
                className={`ob-sched-opt${schedule === "once" ? " selected" : ""}`}
                onClick={() => setSchedule("once")}
              >
                <div className="ob-sched-opt-inner">
                  <div className="ob-sched-icon">🌅</div>
                  <div>
                    <div className="ob-sched-name">Once a day</div>
                    <div className="ob-sched-desc">One fresh briefing at your chosen time</div>
                  </div>
                </div>
                {schedule === "once" && (
                  <div className="ob-time-pick show">
                    <span className="ob-time-lbl">Delivery time</span>
                    <input type="time" className="ob-time-inp" value={time1}
                      onChange={(e) => setTime1(e.target.value)} />
                  </div>
                )}
              </button>

              {/* Twice a day */}
              <button
                className={`ob-sched-opt${schedule === "twice" ? " selected" : ""}`}
                onClick={() => setSchedule("twice")}
              >
                <div className="ob-sched-opt-inner">
                  <div className="ob-sched-icon">🔄</div>
                  <div>
                    <div className="ob-sched-name">Twice a day</div>
                    <div className="ob-sched-desc">Morning + evening, 12 hours apart</div>
                  </div>
                </div>
                {schedule === "twice" && (
                  <div className="ob-time-pick show">
                    <span className="ob-time-lbl">First delivery time</span>
                    <input type="time" className="ob-time-inp" value={time1}
                      onChange={(e) => setTime1(e.target.value)} />
                    <div className="ob-time-auto">
                      Second delivery: {fmtTime(time2)} (auto, 12 hrs later)
                    </div>
                  </div>
                )}
              </button>

              {/* On demand */}
              <button
                className={`ob-sched-opt${schedule === "manual" ? " selected" : ""}`}
                onClick={() => setSchedule("manual")}
              >
                <div className="ob-sched-opt-inner">
                  <div className="ob-sched-icon">👆</div>
                  <div>
                    <div className="ob-sched-name">On demand</div>
                    <div className="ob-sched-desc">I&apos;ll refresh when I want (up to 6×/day)</div>
                  </div>
                </div>
              </button>

            </div>
          </div>

          <div className="ob-footer">
            <button className="btn-full primary" disabled={submitting} onClick={handleFinish}>
              {submitting ? <><span className="spinner" /> Building your digest…</> : "Build my digest →"}
            </button>
          </div>
        </>
      )}

    </div>
  );
}
