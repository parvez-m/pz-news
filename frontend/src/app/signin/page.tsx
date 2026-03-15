"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.5-1.45-.79-3-.79-4.59s.29-3.14.79-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    </svg>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<"google" | "guest" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const msgHandlerRef = useRef<((e: MessageEvent) => void) | null>(null);

  useEffect(() => {
    return () => {
      if (msgHandlerRef.current) {
        window.removeEventListener("message", msgHandlerRef.current);
      }
    };
  }, []);

  function handleGoogleClick() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
    const redirectUri = `${window.location.origin}/auth/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      prompt: "select_account",
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    const popup = window.open(url, "google-signin", "width=500,height=600,popup=1");
    if (!popup) {
      setError("Pop-up was blocked. Please allow pop-ups for this site and try again.");
      return;
    }

    setLoading("google");
    setError(null);

    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "pz_auth") {
        window.removeEventListener("message", handler);
        msgHandlerRef.current = null;
        localStorage.setItem("pz_token", e.data.token);
        router.push("/onboarding");
      } else if (e.data?.type === "pz_auth_error") {
        window.removeEventListener("message", handler);
        msgHandlerRef.current = null;
        setError(e.data.error ?? "Sign-in failed. Please try again.");
        setLoading(null);
      }
    };

    msgHandlerRef.current = handler;
    window.addEventListener("message", handler);

    const poll = setInterval(() => {
      if (popup.closed) {
        clearInterval(poll);
        if (msgHandlerRef.current) {
          window.removeEventListener("message", msgHandlerRef.current);
          msgHandlerRef.current = null;
        }
        setLoading((prev) => (prev === "google" ? null : prev));
      }
    }, 500);
  }

  function continueAsGuest() {
    setLoading("guest");
    localStorage.removeItem("pz_token");
    localStorage.setItem("pz_guest", "true");
    router.push("/onboarding");
  }

  const busy = loading !== null;

  return (
    <>
      <div className="si-wrap">
        <div className="si-bar">
          <Link href="/" className="si-back" aria-label="Back to home">←</Link>
          <div className="logo-word" style={{ fontSize: 17 }}>
            <span className="lo-pz">pz</span><span className="lo-dot">•</span><span className="lo-news">news</span>
          </div>
        </div>

        <div className="si-body">
          <div className="si-card fade-up">
            <div style={{ fontSize: 40, marginBottom: 16 }}>
              <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="10" r="5" stroke="var(--a)" strokeWidth="1.5"/>
                <path d="M4 24c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="var(--a)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="si-title">Welcome to pz·news</div>
            <p className="si-sub">
              Sign in to build your personalised daily briefing across topics,
              YouTube channels, and playlists.
            </p>

            {error && <div className="si-error">{error}</div>}

            <button className="btn-google" onClick={handleGoogleClick} disabled={busy}>
              {loading === "google" ? (
                <>
                  <span className="spinner" style={{ borderTopColor: "var(--ink3)", borderColor: "var(--rule2)" }} />
                  Signing in…
                </>
              ) : (
                <>
                  <GoogleIcon />
                  Continue with Google
                </>
              )}
            </button>

            <div className="si-divider">or</div>

            <button className="btn-guest" onClick={() => setGuestModalOpen(true)} disabled={busy}>
              👤 Continue as Guest
            </button>

            <p className="si-terms">
              By continuing you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>

      <div
        className={`modal-overlay${guestModalOpen ? " open" : ""}`}
        onClick={(e) => { if (e.target === e.currentTarget) setGuestModalOpen(false); }}
      >
        <div className="modal-sheet">
          <div className="modal-handle" />
          <div className="modal-title">Continue as Guest?</div>
          <div className="modal-sub">Guest mode gives you a taste of pz·news. Here&apos;s what&apos;s included:</div>
          <div className="modal-limits">
            <div className="modal-lim-item"><span>📰</span> Up to 2 topics (no channels or playlists)</div>
            <div className="modal-lim-item"><span>🔄</span> 3 total refreshes · session lasts 24 hours</div>
            <div className="modal-lim-item"><span>🎧</span> No audio · No quiz · No history</div>
          </div>
          <div className="modal-upg">
            <strong>Signing up with Google takes under a minute</strong> and unlocks topics, channels, playlists, audio briefings, quizzes, and persistent history.
          </div>
          <div className="modal-btns">
            <button
              className="btn-full primary"
              onClick={() => { setGuestModalOpen(false); handleGoogleClick(); }}
              disabled={busy}
            >
              Sign up with Google instead →
            </button>
            <button
              className="btn-flat"
              onClick={() => { setGuestModalOpen(false); continueAsGuest(); }}
              disabled={busy}
            >
              Continue as Guest anyway
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
