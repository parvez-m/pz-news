// pz-news v1.0.0
import Link from "next/link";
import PaperDate from "@/components/landing/PaperDate";

const AUDIENCE = [
  { icon: "🔬", label: "Researchers",  sub: "Papers, discoveries" },
  { icon: "💻", label: "Engineers",    sub: "Tech, frameworks" },
  { icon: "🎓", label: "Students",     sub: "Courses, lectures" },
  { icon: "📊", label: "Analysts",     sub: "Markets, macro" },
  { icon: "🚀", label: "Founders",     sub: "Startups, trends" },
  { icon: "🔭", label: "Enthusiasts",  sub: "Science, space" },
  { icon: "✍️", label: "Writers",      sub: "Ideas, culture" },
];

const TICKER_ITEMS = [
  "AI Agents", "Space Commercialisation", "Longevity Research", "Climate Tech",
  "Quantum Computing", "Neurotech", "Open Source AI", "Geopolitics",
  "Indian Economy", "Lex Fridman", "Kurzgesagt", "Veritasium",
];

const PAPER_CARDS = [
  {
    color: "#6d28d9",
    who: "🔭 Space Exploration",
    title: "NASA's Artemis III crew selection finalised. First woman to walk on the Moon confirmed.",
    blurb: "After years of planning, NASA announced the four-astronaut crew for the 2026 lunar surface mission. The mission marks humanity's return to the Moon for the first time in over 50 years...",
    foot: "5 sources, deduplicated",
  },
  {
    color: "#be185d",
    who: "📊 Global Markets",
    title: "Fed signals two rate cuts in 2025 as inflation cools to 2.1%. Markets rally.",
    blurb: "Jerome Powell's statement after the March FOMC meeting was clearer than expected. The Fed now sees a credible path to easing without re-igniting inflation, sending equities to fresh highs...",
    foot: "8 sources, deduplicated",
  },
  {
    color: "#1a5e3c",
    who: "▶ Lex Fridman Podcast",
    title: "Lex Fridman's 4-hour conversation with Demis Hassabis. The key takeaways.",
    blurb: "The DeepMind founder spoke candidly about AGI timelines, protein folding, and why he believes scientific discovery is AI's true superpower...",
    foot: "YouTube, 3 related articles",
  },
];

const SOURCE_CARDS = [
  {
    n: "01",
    icon: "📰",
    title: "Topics & Keywords",
    desc: "Any subject you follow. We watch hundreds of publications, blogs, and sources worldwide.",
    chips: ["AI Agents", "Space Exploration", "Quantum Computing", "+ your own"],
  },
  {
    n: "02",
    icon: "▶️",
    title: "YouTube Channels",
    desc: "Never miss a video. Get a written and audio summary of every new upload from creators you follow.",
    chips: ["Lex Fridman", "Kurzgesagt", "Veritasium", "+ your own"],
  },
  {
    n: "03",
    icon: "📋",
    title: "YouTube Playlists",
    desc: "Track a course or lecture series. Get notified and summarised whenever new content is added.",
    chips: ["CS50 Harvard", "MIT OpenCourseWare", "Stanford ML", "+ your own"],
  },
];

const STEPS = [
  {
    n: "1",
    title: "Pick what you care about",
    desc: "Add topic keywords, paste YouTube channel or playlist URLs. Takes under 60 seconds. Change anytime.",
  },
  {
    n: "2",
    title: "We monitor everything for you",
    desc: "pz·news watches hundreds of sources and your YouTube feeds continuously — you never have to check again.",
  },
  {
    n: "3",
    title: "Duplicates and noise removed",
    desc: "When 12 outlets cover the same story, you read it once — clean, well-written, every source cited.",
  },
  {
    n: "4",
    title: "Read it or listen to it",
    desc: "Your briefing is ready every morning. Read in minutes or listen as audio on your commute — your choice.",
  },
];

const EXPLORE = [
  { icon: "🤖", name: "AI Agents",          type: "Topic" },
  { icon: "🔭", name: "Space Commerce",      type: "Topic" },
  { icon: "🧬", name: "Longevity Research",  type: "Topic" },
  { icon: "🎙️", name: "Lex Fridman",         type: "YouTube Channel" },
  { icon: "🦆", name: "Kurzgesagt",          type: "YouTube Channel" },
  { icon: "🎓", name: "CS50 Harvard",        type: "Playlist" },
  { icon: "⚛️", name: "Quantum Computing",   type: "Topic" },
  { icon: "🌍", name: "Climate Tech",        type: "Topic" },
  { icon: "💹", name: "Indian Economy",      type: "Topic" },
];

export default function LandingPage() {
  return (
    <div>

      {/* NAV */}
      <nav className="l-nav">
        <div className="logo-word">
          <span className="lo-pz">pz</span><span className="lo-dot">•</span><span className="lo-news">news</span>
        </div>
        <div className="l-nav-right">
          <Link href="/signin" className="l-nav-signin">Sign in</Link>
          <Link href="/signin" className="btn-primary" style={{ padding: "8px 16px", fontSize: 13 }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="l-hero">
        <div className="l-hero-tag">
          <div className="l-hero-tag-dot" />
          Your daily personalised briefing
        </div>
        <h1 className="l-hero-h1">
          Stay ahead on what <span className="accent">matters</span> to you.
        </h1>
        <p className="l-hero-sub">
          Pick any topic, <strong>YouTube channel</strong>, or <strong>playlist</strong>.
          Every morning, pz·news delivers one clean, deduplicated briefing —{" "}
          <strong>read it</strong> or <strong>listen</strong> on your commute.
        </p>
        <div className="l-hero-cta">
          <Link
            href="/signin"
            className="btn-primary"
            style={{ width: "100%", maxWidth: 290, justifyContent: "center", fontSize: 15, padding: 15 }}
          >
            Get started in 60 seconds →
          </Link>
          <a
            href="#how-it-works"
            className="btn-outline"
            style={{ width: "100%", maxWidth: 290, justifyContent: "center" }}
          >
            See how it works
          </a>
        </div>
        <div className="l-hero-nudges">
          <div className="l-hero-nudge"><span className="nudge-check">✓</span> Up and running in under 60 seconds</div>
          <div className="l-hero-nudge"><span className="nudge-check">✓</span> Read it or listen — your choice every day</div>
        </div>
      </section>

      {/* TICKER */}
      <div className="l-ticker-bar">
        <div className="l-ticker-inner">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <div key={i} className="l-ticker-item">
              <span>{item}</span>
              <span className="l-ticker-sep">·</span>
            </div>
          ))}
        </div>
      </div>

      {/* AUDIENCE STRIP */}
      <div className="l-audience">
        {AUDIENCE.map((a) => (
          <div key={a.label} className="l-aud-item">
            <div className="l-aud-icon">{a.icon}</div>
            <div className="l-aud-label">{a.label}</div>
            <div className="l-aud-sub">{a.sub}</div>
          </div>
        ))}
      </div>

      {/* NEWSPAPER MOCKUP */}
      <div className="l-paper">
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div className="section-eyebrow" style={{ textAlign: "center" }}>
            What your daily briefing looks like
          </div>
        </div>
        <div className="l-paper-inner">
          <div className="l-paper-head">
            <PaperDate />
            <div className="logo-word" style={{ fontSize: 22 }}>
              <span className="lo-pz">pz</span><span className="lo-dot">•</span><span className="lo-news">news</span>
            </div>
            <div className="l-paper-sub">Personalised intelligence briefing</div>
          </div>
          <div className="l-paper-body">
            <div className="l-paper-section-label">Your topics today</div>
            <div className="l-paper-cards">
              {PAPER_CARDS.map((card, i) => (
                <div
                  key={card.who}
                  className="l-paper-card"
                  style={{ borderLeftColor: card.color, animation: `fadeUp .5s ease both ${i * 0.1}s` }}
                >
                  <div className="l-paper-card-who" style={{ color: card.color }}>{card.who}</div>
                  <div className="l-paper-card-title">{card.title}</div>
                  <div className="l-paper-card-blurb">{card.blurb}</div>
                  <div className="l-paper-card-foot">
                    <span>{card.foot}</span>
                    <span style={{ color: card.color, fontWeight: 700 }}>Read →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SOURCE TYPES */}
      <section className="l-sources">
        <div className="section-eyebrow">What you can follow</div>
        <h2 className="section-title">
          Everything you care about,<br />in one place.
        </h2>
        <p className="section-sub">
          From the latest research papers to your favourite YouTube creator&apos;s newest video —
          pz·news pulls it together, removes the duplicates, and writes a briefing just for you.
        </p>
        <div className="l-src-cards">
          {SOURCE_CARDS.map((card) => (
            <div key={card.title} className="l-src-card">
              <div className="l-src-n">{card.n}</div>
              <div className="l-src-title">{card.title}</div>
              <div className="l-src-desc">{card.desc}</div>
              <div className="l-src-chips">
                {card.chips.map((chip) => (
                  <span key={chip} className="l-src-chip">{chip}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="l-how" id="how-it-works">
        <div className="section-eyebrow">How it works</div>
        <h2 className="section-title">
          From the internet&apos;s noise<br />to your daily clarity.
        </h2>
        <div className="l-steps">
          {STEPS.map((step) => (
            <div key={step.n} className="l-step">
              <div className="l-step-n">{step.n}</div>
              <div>
                <div className="l-step-t">{step.title}</div>
                <div className="l-step-d">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EXPLORE — trending topics */}
      <section className="l-explore">
        <div className="section-eyebrow">Trending on pz·news</div>
        <h2 className="section-title">See what people are following</h2>
        <div className="l-exp-grid">
          {EXPLORE.map((item) => (
            <Link key={item.name} href="/signin" className="l-exp-card">
              <span className="l-exp-icon">{item.icon}</span>
              <div className="l-exp-name">{item.name}</div>
              <div className="l-exp-desc">{item.type}</div>
              <span className="l-exp-arr">Follow →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* DIGEST PREVIEW */}
      <section className="l-preview">
        <div className="section-eyebrow" style={{ textAlign: "center" }}>What it looks like</div>
        <h2 className="section-title" style={{ textAlign: "center", marginBottom: 8 }}>Your digest, every morning.</h2>
        <p className="section-sub" style={{ textAlign: "center", margin: "0 auto 36px", maxWidth: 400 }}>
          Here is a sample of what waits for you each day. Clean, structured, and sourced from across the web.
        </p>
        <div className="l-preview-phone">
          {/* Phone top bar */}
          <div className="l-preview-topbar">
            <div className="logo-word" style={{ fontSize: 15 }}>
              <span className="lo-pz">pz</span><span className="lo-dot">•</span><span className="lo-news">news</span>
            </div>
            <div className="l-preview-avatar">P</div>
          </div>
          {/* Tab row */}
          <div className="l-preview-tabs">
            {["Digest", "Interests", "Glossary"].map((t, i) => (
              <div key={t} className={`l-preview-tab${i === 0 ? " active" : ""}`}>{t}</div>
            ))}
          </div>
          {/* Greeting */}
          <div className="l-preview-greeting">Good morning 👋</div>
          <div className="l-preview-sub">Your briefing for today</div>
          {/* Card 1 — AI Agents */}
          <div className="l-preview-card">
            <div style={{ height: 2, background: "#4f46e5" }} />
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 3, display: "inline-block", marginBottom: 7, background: "#eeecff", color: "#4f46e5" }}>AI AGENTS</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "var(--ink)", lineHeight: 1.35, marginBottom: 6 }}>OpenAI launches Operator — autonomous agents that can book, buy and manage tasks</div>
              <div style={{ fontSize: 11, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 8 }}>A significant shift from AI assistants to agents capable of taking real actions on the web on your behalf.</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 7, borderTop: "1px solid var(--rule)" }}>
                <div style={{ fontSize: 10, color: "var(--ink4)" }}>📰 5 sources</div>
                <div style={{ display: "flex", gap: 5 }}>
                  {["🎧 Listen", "🧠 Quiz"].map((a) => (
                    <div key={a} style={{ background: "var(--surface)", border: "1px solid var(--rule)", borderRadius: 5, padding: "4px 9px", fontSize: 10, fontWeight: 600, color: "var(--ink3)", fontFamily: "'Satoshi', sans-serif" }}>{a}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Card 2 — Fireship */}
          <div className="l-preview-card" style={{ marginBottom: 16 }}>
            <div style={{ height: 2, background: "#1a5e3c" }} />
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 3, display: "inline-block", marginBottom: 7, background: "#e8f5ee", color: "#1a5e3c" }}>▶ FIRESHIP</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "var(--ink)", lineHeight: 1.35, marginBottom: 6 }}>React 19 is here — what actually changed and what you need to update</div>
              <div style={{ fontSize: 11, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 8 }}>Server components stable, new compiler in beta, and several hooks deprecated.</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 7, borderTop: "1px solid var(--rule)" }}>
                <div style={{ fontSize: 10, color: "var(--ink4)" }}>📰 YouTube + 3 articles</div>
                <div style={{ display: "flex", gap: 5 }}>
                  {["🎧 Listen", "🧠 Quiz"].map((a) => (
                    <div key={a} style={{ background: "var(--surface)", border: "1px solid var(--rule)", borderRadius: 5, padding: "4px 9px", fontSize: 10, fontWeight: 600, color: "var(--ink3)", fontFamily: "'Satoshi', sans-serif" }}>{a}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="l-proof">
        <p className="l-proof-quote">
          &ldquo;I used to spend <strong>45 minutes every morning</strong> reading
          the same story across five different tabs. Now I get one clean briefing
          and I&apos;m done in under <strong>10 minutes</strong>.&rdquo;
        </p>
        <div className="l-proof-attr">
          — <strong>Vivek Ravindran</strong>, Product Manager, Bengaluru
        </div>
        <div className="l-proof-stats">
          <div className="l-proof-stat">
            <div className="l-proof-stat-n">10 min</div>
            <div className="l-proof-stat-l">Avg read</div>
          </div>
          <div className="l-proof-stat">
            <div className="l-proof-stat-n">0</div>
            <div className="l-proof-stat-l">Duplicates</div>
          </div>
          <div className="l-proof-stat">
            <div className="l-proof-stat-n">100%</div>
            <div className="l-proof-stat-l">Your interests</div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="l-fcta">
        <h2 className="l-fcta-title">Your briefing<br />is waiting.</h2>
        <p className="l-fcta-sub">
          Tell us what you care about. We&apos;ll have your first digest ready in minutes.
        </p>
        <Link href="/signin" className="btn-primary" style={{ margin: "0 auto", display: "flex", width: "fit-content" }}>
          Start for free →
        </Link>
        <div className="l-fcta-trust">
          <span className="l-fcta-ti"><span className="tck">✓</span> Up and running in 60 seconds</span>
          <span className="l-fcta-ti"><span className="tck">✓</span> Read or listen daily</span>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="l-footer">
        <div className="l-footer-inner">
          <div className="footer-left">
            <div className="logo-word" style={{ marginBottom: 6 }}>
              <span className="lo-pz">pz</span><span className="lo-dot">•</span><span className="lo-news">news</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--ink4)", lineHeight: 1.6 }}>
              Your daily personalised briefing.<br />Built by Parvez for curious minds.
            </div>
          </div>
          <div className="footer-right">
            <span style={{ fontSize: 12, color: "var(--ink4)" }}>© 2026 pz·news</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
