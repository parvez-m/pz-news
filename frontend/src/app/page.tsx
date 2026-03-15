// pz-news v1.0.0
import Link from "next/link";
import PaperDate from "@/components/landing/PaperDate";

const AUDIENCE = [
  { icon: "💻", label: "Developers",  sub: "Frameworks, releases" },
  { icon: "📊", label: "Analysts",    sub: "Markets, macro" },
  { icon: "🚀", label: "Founders",    sub: "Startups, funding" },
  { icon: "🔬", label: "Researchers", sub: "Papers, breakthroughs" },
  { icon: "🔭", label: "Enthusiasts", sub: "Space, science" },
  { icon: "🎓", label: "Students",    sub: "Courses, lectures" },
  { icon: "🎙️", label: "Creators",    sub: "Trends, culture" },
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
    iconBg: "#e8f5ee",
    icon: "📰",
    title: "Topics & Keywords",
    desc: "Follow any subject. We monitor hundreds of news sources, blogs, and publications and summarise what's new. No repetitions, no noise.",
    chips: ["Generative AI", "AI Agents", "AI Native Development", "Vibe Coding", "Developer Experience", "Product Led Growth"],
  },
  {
    iconBg: "#e8f5ee",
    icon: "▶️",
    title: "YouTube Channels",
    desc: "Never miss a video from creators you love. Get a written summary of every new upload. Skip the 30-minute video, read the 2-minute brief.",
    chips: ["Fireship", "freeCodeCamp", "ThePrimeagen", "Traversy Media", "Y Combinator", "Google Developers"],
  },
  {
    iconBg: "#edf5f0",
    icon: "📋",
    title: "YouTube Playlists",
    desc: "Following a course or lecture series? Track playlists and get updated whenever new content is added, summarised in plain language.",
    chips: ["CS50x 2024", "Deep Learning Specialization", "Full Stack Open", "ML Specialization", "Design Course"],
  },
];

const STEPS = [
  {
    n: "1",
    title: "You pick your interests",
    desc: 'Add keywords like "Generative AI" or "Developer Experience", paste YouTube channel or playlist URLs. Takes under a minute.',
  },
  {
    n: "2",
    title: "We fetch everything for you",
    desc: "pz·news monitors hundreds of sources and YouTube across all your topics, continuously. So you never have to.",
  },
  {
    n: "3",
    title: "Duplicates and noise are removed",
    desc: "When 12 outlets cover the same story, you read it once. A clean, well-written summary with sources cited.",
  },
  {
    n: "4",
    title: "Your briefing is ready",
    desc: "A newspaper-style digest waits every morning. Read in 10 minutes or listen to the full audio summary on your commute.",
  },
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
          Pick any <strong>topic</strong>, <strong>YouTube channel</strong>, or <strong>playlist</strong>.
        </p>
        <div className="l-hero-cta">
          <Link
            href="/signin"
            className="btn-primary"
            style={{ width: "100%", maxWidth: 290, justifyContent: "center", fontSize: 15, padding: 15 }}
          >
            Build my daily briefing →
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
          <div className="l-hero-nudge"><span className="nudge-check">✓</span> Read it or listen. Your choice, every day</div>
        </div>
      </section>

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
          Everything you care about,<br />in one place
        </h2>
        <p className="section-sub">
          From breaking news to your favourite YouTube creator&apos;s latest video.
          pz·news pulls it all into one clean daily read.
        </p>
        <div className="l-src-cards">
          {SOURCE_CARDS.map((card) => (
            <div key={card.title} className="l-src-card">
              <div className="l-src-icon" style={{ background: card.iconBg }}>{card.icon}</div>
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
          From the internet&apos;s noise<br />to your daily clarity
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

      {/* DIGEST PREVIEW */}
      <section className="l-preview" style={{ padding: "52px 20px", background: "var(--paper)", borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)" }}>
        <div className="section-eyebrow" style={{ textAlign: "center" }}>What it looks like</div>
        <h2 className="section-title" style={{ textAlign: "center", marginBottom: 8 }}>Your digest, every morning.</h2>
        <p className="section-sub" style={{ textAlign: "center", margin: "0 auto 36px", maxWidth: 400 }}>
          Clean, structured, and sourced from across the web.
        </p>
        <div style={{
          maxWidth: 360, margin: "0 auto",
          background: "var(--white)", border: "1px solid var(--rule)",
          borderRadius: 14, overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,.12),0 2px 6px rgba(0,0,0,.05)",
        }}>
          {/* Phone top bar */}
          <div style={{
            background: "var(--white)", padding: "12px 16px",
            borderBottom: "1px solid var(--rule)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div className="logo-word" style={{ fontSize: 15 }}>
              <span className="lo-pz">pz</span><span className="lo-dot">•</span><span className="lo-news">news</span>
            </div>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "var(--a)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700,
            }}>P</div>
          </div>
          {/* Tab row */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--rule)", padding: "0 16px" }}>
            {["Digest", "Interests", "Glossary"].map((t, i) => (
              <div key={t} style={{
                padding: "8px 12px",
                fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" as const,
                color: i === 0 ? "var(--a)" : "var(--ink4)",
                borderBottom: i === 0 ? "2px solid var(--a)" : "2px solid transparent",
                fontFamily: "'Satoshi', sans-serif",
              }}>{t}</div>
            ))}
          </div>
          {/* Greeting */}
          <div style={{ padding: "12px 16px 4px", fontSize: 14, fontWeight: 700, color: "var(--ink)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Good morning 👋</div>
          <div style={{ padding: "0 16px 10px", fontSize: 11, color: "var(--ink3)" }}>Your briefing for today</div>
          {/* Card 1 — AI Agents */}
          <div style={{ margin: "0 16px 10px", background: "var(--white)", border: "1px solid var(--rule)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ height: 2, background: "#4f46e5" }} />
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" as const, padding: "2px 7px", borderRadius: 3, display: "inline-block", marginBottom: 7, background: "#eeecff", color: "#4f46e5" }}>AI AGENTS</div>
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
          <div style={{ margin: "0 16px 16px", background: "var(--white)", border: "1px solid var(--rule)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ height: 2, background: "#1a5e3c" }} />
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" as const, padding: "2px 7px", borderRadius: 3, display: "inline-block", marginBottom: 7, background: "#e8f5ee", color: "#1a5e3c" }}>▶ FIRESHIP</div>
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
          and I&apos;m done in <strong>10 minutes</strong>.&rdquo;
        </p>
        <div className="l-proof-attr">
          Vivek Ravindran, Product Manager, Bengaluru
        </div>
        <div className="l-proof-stats">
          <div className="l-proof-stat">
            <div className="l-proof-stat-n">10 min</div>
            <div className="l-proof-stat-l">avg. read time</div>
          </div>
          <div className="l-proof-stat">
            <div className="l-proof-stat-n">0</div>
            <div className="l-proof-stat-l">duplicates</div>
          </div>
          <div className="l-proof-stat">
            <div className="l-proof-stat-n">100%</div>
            <div className="l-proof-stat-l">your interests</div>
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
