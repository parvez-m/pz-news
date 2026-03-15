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
    title: "NASA's Artemis III crew selection finalised — first woman to walk on the Moon confirmed",
    blurb: "After years of planning, NASA announced the four-astronaut crew for the 2026 lunar surface mission. The mission marks humanity's return to the Moon for the first time in over 50 years...",
    foot: "5 sources · deduplicated",
  },
  {
    color: "#be185d",
    who: "📊 Global Markets",
    title: "Fed signals two rate cuts in 2025 as inflation cools to 2.1% — markets rally",
    blurb: "Jerome Powell's statement after the March FOMC meeting was clearer than expected. The Fed now sees a credible path to easing without re-igniting inflation, sending equities to fresh highs...",
    foot: "8 sources · deduplicated",
  },
  {
    color: "#c84521",
    who: "▶ Lex Fridman Podcast",
    title: "Lex Fridman's 4-hour conversation with Demis Hassabis — the key takeaways",
    blurb: "The DeepMind founder spoke candidly about AGI timelines, protein folding, and why he believes scientific discovery — not chat — is AI's true superpower...",
    foot: "YouTube · 3 related articles",
  },
];

const SOURCE_CARDS = [
  {
    iconBg: "#fdf2ee",
    icon: "📰",
    title: "Topics & Keywords",
    desc: "Follow any subject. We monitor hundreds of news sources, blogs, and publications and summarise what's new — no repetitions, no noise.",
    chips: ["Space Exploration", "Climate Change", "Behavioural Economics", "Generative AI", "Startup Funding", "Quantum Computing", "Node.js"],
  },
  {
    iconBg: "#fff5f5",
    icon: "▶️",
    title: "YouTube Channels",
    desc: "Never miss a video from creators you love. Get a written summary of every new upload — skip the 30-minute video, read the 2-minute brief.",
    chips: ["Lex Fridman", "Kurzgesagt", "Fireship", "MKBHD", "Veritasium", "Y Combinator"],
  },
  {
    iconBg: "#edf5f0",
    icon: "📋",
    title: "YouTube Playlists",
    desc: "Following a course or lecture series? Track playlists and get updated whenever new content is added, summarised in plain language.",
    chips: ["CS50 Harvard", "MIT OpenCourseWare", "3Blue1Brown", "freeCodeCamp", "TED Talks Science"],
  },
];

const STEPS = [
  {
    n: "1",
    title: "You pick your interests",
    desc: 'Add keywords like "Space Exploration" or "Behavioural Economics", paste YouTube channel or playlist URLs. Takes under a minute.',
  },
  {
    n: "2",
    title: "We fetch everything for you",
    desc: "pz·news monitors hundreds of sources and YouTube across all your topics, continuously — so you never have to.",
  },
  {
    n: "3",
    title: "Duplicates and noise are removed",
    desc: "When 12 outlets cover the same story, you read it once — as a clean, well-written summary with sources cited.",
  },
  {
    n: "4",
    title: "Your briefing is ready",
    desc: "A newspaper-style digest waits every morning. Read in 5 minutes. Or listen to the full audio summary on your commute.",
  },
];

const EXPLORE_CARDS = [
  { icon: "🔭", name: "Space Exploration", desc: "NASA, SpaceX, ISRO..." },
  { icon: "📊", name: "Global Markets",    desc: "Fed, equities, macro..." },
  { icon: "🧬", name: "Biotech & Health",  desc: "Research, clinical trials..." },
  { icon: "🤖", name: "Generative AI",     desc: "LLMs, research, products..." },
  { icon: "🎙️", name: "Lex Fridman",       desc: "YouTube Channel" },
  { icon: "📐", name: "3Blue1Brown",       desc: "YouTube Playlist" },
];

export default function LandingPage() {
  return (
    <div>

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav className="l-nav">
        <div className="logo-word">
          pz<span className="lo-dot">•</span>news
        </div>
        <div className="l-nav-right">
          <Link href="/signin" className="l-nav-signin">Sign in</Link>
          <Link href="/signin" className="btn-primary" style={{ padding: "8px 16px", fontSize: 13 }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="l-hero">
        <div className="l-hero-tag">
          <div className="l-hero-tag-dot" />
          Your daily personalised briefing
        </div>
        <h1 className="l-hero-h1">
          Stay ahead on<br />what <em>matters</em><br />to you.
        </h1>
        <p className="l-hero-sub">
          Pick any topic, <strong>YouTube channel</strong>, or <strong>playlist</strong>.
          Every day, pz·news delivers a clean, deduplicated summary —{" "}
          <strong>read it like a newspaper</strong> or{" "}
          <strong>listen to the full audio brief</strong> — whichever fits your day.
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
        <div className="l-trust">
          <span className="l-trust-dot">●</span>
          Free to start · No credit card · Takes 60 seconds
        </div>
      </section>

      {/* ── AUDIENCE STRIP ───────────────────────────────────────── */}
      <div className="l-audience">
        {AUDIENCE.map((a) => (
          <div key={a.label} className="l-aud-item">
            <div className="l-aud-icon">{a.icon}</div>
            <div className="l-aud-label">{a.label}</div>
            <div className="l-aud-sub">{a.sub}</div>
          </div>
        ))}
      </div>

      {/* ── NEWSPAPER MOCKUP ─────────────────────────────────────── */}
      <div className="l-paper">
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div className="section-eyebrow" style={{ textAlign: "center" }}>
            What your daily briefing looks like
          </div>
        </div>
        <div className="l-paper-inner">
          <div className="l-paper-head">
            <PaperDate />
            <div className="logo-word" style={{ fontSize: 22 }}>pz<span className="lo-dot">•</span>news</div>
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

      {/* ── SOURCE TYPES ─────────────────────────────────────────── */}
      <section className="l-sources">
        <div className="section-eyebrow">What you can follow</div>
        <h2 className="section-title">
          Everything you care about,<br />in one place
        </h2>
        <p className="section-sub">
          From breaking news to your favourite YouTube creator&apos;s latest video —
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

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
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

      {/* ── TOPIC EXPLORER ───────────────────────────────────────── */}
      <section className="l-explore">
        <div className="section-eyebrow">Popular right now</div>
        <h2 className="section-title">See what people are following</h2>
        <div className="l-exp-grid">
          {EXPLORE_CARDS.map((card) => (
            <Link key={card.name} href="/signin" className="l-exp-card">
              <div className="l-exp-icon">{card.icon}</div>
              <div className="l-exp-name">{card.name}</div>
              <div className="l-exp-desc">{card.desc}</div>
              <span className="l-exp-arr">Follow →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIAL ──────────────────────────────────────────── */}
      <section className="l-proof">
        <p className="l-proof-quote">
          &ldquo;I used to spend <strong>45 minutes every morning</strong> reading
          the same story across five different tabs. Now I get one clean briefing
          and I&apos;m done in under 10 minutes.&rdquo;
        </p>
        <div className="l-proof-attr">
          — <strong>Vivek Ravindran</strong>, Product Manager, Bengaluru
        </div>
        <div className="l-proof-stats">
          <div className="l-proof-stat">
            <div className="l-proof-stat-n">5 min</div>
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

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section className="l-fcta">
        <h2 className="l-fcta-title">Your briefing<br />is waiting.</h2>
        <p className="l-fcta-sub">
          Tell us what you care about. We&apos;ll have your first digest ready in minutes.
        </p>
        <Link href="/signin" className="btn-primary" style={{ margin: "0 auto", display: "flex", width: "fit-content" }}>
          Start for free →
        </Link>
        <div className="l-trust" style={{ marginTop: 14 }}>
          <span className="l-trust-dot">●</span>
          Free · No credit card · 60 seconds
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="l-footer">© 2025 pz·news — Built for curious minds</footer>

    </div>
  );
}
