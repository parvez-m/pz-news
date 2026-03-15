"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, isGuest, clearSession } from "@/lib/api";

// ── Helpers ──────────────────────────────────────────────────────────────────

const OCC_LABELS: Record<string, string> = {
  student:   "Student",
  founder:   "Founder / Business owner",
  employee:  "Full-time employee",
  intern:    "Intern",
  jobseeker: "Looking for jobs",
  other:     "Other",
};

function scheduleLabel(): string {
  try {
    const raw = localStorage.getItem("pz_schedule");
    if (!raw) return "On demand";
    const s = JSON.parse(raw) as { type: string; time1?: string };
    const fmtTime = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      const ampm = h < 12 ? "AM" : "PM";
      const hr = h % 12 || 12;
      return `${hr}:${String(m ?? 0).padStart(2, "0")} ${ampm}`;
    };
    if (s.type === "once")   return `Once a day at ${fmtTime(s.time1 ?? "07:00")}`;
    if (s.type === "twice")  return `Twice a day starting ${fmtTime(s.time1 ?? "07:00")}`;
    return "On demand";
  } catch { return "On demand"; }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const [guest, setGuest] = useState(false);
  const [name,  setName]  = useState("P");
  const [occ,   setOcc]   = useState("");
  const [sched, setSched] = useState("");

  useEffect(() => {
    const token     = getToken();
    const guestFlag = isGuest();
    if (!token && !guestFlag) { router.replace("/signin"); return; }
    setGuest(guestFlag && !token);

    // Pull name from token payload (JWT) or use default
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.name)  setName(payload.name);
      } catch { /* use default */ }
    }

    const savedOcc = localStorage.getItem("pz_occupation");
    if (savedOcc) setOcc(OCC_LABELS[savedOcc] ?? savedOcc);

    setSched(scheduleLabel());
  }, [router]);

  function handleSignOut() {
    clearSession();
    router.push("/signin");
  }

  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "P";

  return (
    <div className="pf-wrap">

      {/* Header */}
      <div className="pf-hdr">
        <button className="det-back" onClick={() => router.back()}>←</button>
        <div className="pf-hdr-title">Profile</div>
      </div>

      {/* Body */}
      <div className="pf-body">

        {/* Avatar + identity */}
        <div className="pf-avatar">{initials}</div>
        <div className="pf-name">{guest ? "Guest" : name}</div>
        {!guest && (
          <div className="pf-email" style={{ marginBottom: 4 }}>
            {/* Email shown if available */}
          </div>
        )}
        {occ && <div className="pf-occ">{occ}</div>}

        {/* Account section */}
        {!guest && (
          <>
            <div className="pf-sec-title">Account</div>
            <div className="pf-row" onClick={() => window.alert("Switch account coming soon")}>
              <span className="pf-row-icon">🔄</span>
              <div>
                <div className="pf-row-label">Switch account</div>
                <div className="pf-row-sub">Sign in with a different Google account</div>
              </div>
              <span className="pf-row-arr">›</span>
            </div>
            <div className="pf-row danger" onClick={() => window.alert("Delete account — coming soon in settings")}>
              <span className="pf-row-icon">🗑️</span>
              <div>
                <div className="pf-row-label">Delete account</div>
                <div className="pf-row-sub">Remove all your data permanently</div>
              </div>
              <span className="pf-row-arr">›</span>
            </div>
          </>
        )}

        {/* Preferences */}
        <div className="pf-sec-title">Preferences</div>
        <div className="pf-row" onClick={() => window.alert("Schedule settings coming soon")}>
          <span className="pf-row-icon">🕐</span>
          <div>
            <div className="pf-row-label">Briefing schedule</div>
            <div className="pf-row-sub">{sched}</div>
          </div>
          <span className="pf-row-arr">›</span>
        </div>
        {!guest && (
          <div className="pf-row" onClick={() => window.alert("Occupation updated")}>
            <span className="pf-row-icon">💼</span>
            <div>
              <div className="pf-row-label">What I do</div>
              <div className="pf-row-sub">{occ || "Update your occupation"}</div>
            </div>
            <span className="pf-row-arr">›</span>
          </div>
        )}

        {/* About */}
        <div className="pf-sec-title">About pz·news</div>

        {/* AI disclaimer — mandatory, always visible */}
        <div className="pf-disclaimer">
          <div className="pf-disc-title">⚠ AI-generated content notice</div>
          <div className="pf-disc-body">
            All briefings on pz·news are generated by AI and summarised from third-party sources.
            Content may contain errors, omissions, or outdated information.{" "}
            <strong>Do not use pz·news as a source of record or cite it in your work.</strong>
            <br /><br />
            pz·news is designed to give you a quick orientation on topics you follow. If something
            interests you, explore the original sources linked in each briefing for accurate and
            detailed information.
          </div>
        </div>

        <div className="pf-row" style={{ marginTop: 8 }} onClick={() => window.alert("Privacy policy coming soon")}>
          <span className="pf-row-icon">🔒</span>
          <div>
            <div className="pf-row-label">Privacy policy</div>
            <div className="pf-row-sub">How we handle your data</div>
          </div>
          <span className="pf-row-arr">›</span>
        </div>

        <div className="pf-row" onClick={handleSignOut}>
          <span className="pf-row-icon">👋</span>
          <div>
            <div className="pf-row-label">Sign out</div>
          </div>
          <span className="pf-row-arr">›</span>
        </div>

        <div style={{ height: 32 }} />
      </div>
    </div>
  );
}
