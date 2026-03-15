"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeAuthCode } from "@/lib/api";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      if (window.opener) {
        window.opener.postMessage({ type: "pz_auth_error", error: "No auth code received." }, window.location.origin);
        window.close();
      } else {
        router.replace("/signin");
      }
      return;
    }

    exchangeAuthCode(code, `${window.location.origin}/auth/callback`)
      .then(({ token }) => {
        localStorage.setItem("pz_token", token);
        if (window.opener) {
          window.opener.postMessage({ type: "pz_auth", token }, window.location.origin);
          window.close();
        } else {
          router.replace("/onboarding");
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Sign-in failed.";
        if (window.opener) {
          window.opener.postMessage({ type: "pz_auth_error", error: msg }, window.location.origin);
          window.close();
        } else {
          router.replace("/signin");
        }
      });
  }, [router, searchParams]);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", fontFamily: "Satoshi, sans-serif",
      background: "var(--paper)", color: "var(--ink3)", fontSize: 14,
    }}>
      Signing you in…
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>Loading…</div>}>
      <CallbackInner />
    </Suspense>
  );
}
