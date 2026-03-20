"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ACCENT_OPTIONS = [
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#f97316",
  "#ec4899",
  "#eab308",
];

export default function ProfileSettingsCard({
  initialDisplayName = "",
  initialBio = "",
  initialFavoriteTicker = "",
  initialAccentColor = "#22c55e",
  email = "",
}) {
  const supabase = createClient();

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [favoriteTicker, setFavoriteTicker] = useState(initialFavoriteTicker);
  const [accentColor, setAccentColor] = useState(initialAccentColor);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: displayName.trim(),
        bio: bio.trim(),
        favorite_ticker: favoriteTicker.trim().toUpperCase(),
        accent_color: accentColor,
      },
    });

    if (error) {
      console.error(error);
      setMessage("Could not save profile changes.");
      setSaving(false);
      return;
    }

    setMessage("Profile updated. Refresh the page to see the latest server-rendered values.");
    setSaving(false);
  }

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.04)",
        borderRadius: "24px",
        padding: "24px",
        boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
      }}
    >
      <div
        style={{
          fontSize: "0.85rem",
          color: "#86efac",
          fontWeight: 700,
          marginBottom: "6px",
        }}
      >
        Customization
      </div>

      <h2
        style={{
          margin: "0 0 18px",
          fontSize: "1.45rem",
          fontWeight: 800,
          color: "white",
        }}
      >
        Edit your profile
      </h2>

      <form onSubmit={handleSave}>
        <div style={{ display: "grid", gap: "14px" }}>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#cbd5e1",
                fontWeight: 700,
                fontSize: "0.92rem",
              }}
            >
              Email
            </label>
            <input
              value={email}
              disabled
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.03)",
                color: "rgba(255,255,255,0.55)",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#cbd5e1",
                fontWeight: 700,
                fontSize: "0.92rem",
              }}
            >
              Display Name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How your name appears"
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.05)",
                color: "white",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#cbd5e1",
                fontWeight: 700,
                fontSize: "0.92rem",
              }}
            >
              Bio / Tagline
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short line about your investing style"
              rows={4}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.05)",
                color: "white",
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#cbd5e1",
                fontWeight: 700,
                fontSize: "0.92rem",
              }}
            >
              Favorite Ticker
            </label>
            <input
              value={favoriteTicker}
              onChange={(e) => setFavoriteTicker(e.target.value.toUpperCase())}
              placeholder="NVDA"
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.05)",
                color: "white",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                color: "#cbd5e1",
                fontWeight: 700,
                fontSize: "0.92rem",
              }}
            >
              Accent Color
            </label>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              {ACCENT_OPTIONS.map((color) => {
                const selected = accentColor === color;

                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAccentColor(color)}
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "999px",
                      border: selected
                        ? "2px solid white"
                        : "1px solid rgba(255,255,255,0.16)",
                      background: color,
                      cursor: "pointer",
                      boxShadow: selected
                        ? "0 0 0 3px rgba(255,255,255,0.12)"
                        : "none",
                    }}
                  />
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: "8px",
              padding: "14px 18px",
              borderRadius: "14px",
              border: "none",
              background: saving ? "#166534" : "#22c55e",
              color: "white",
              fontWeight: 800,
              cursor: saving ? "default" : "pointer",
              boxShadow: "0 10px 24px rgba(34,197,94,0.22)",
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {message ? (
            <div
              style={{
                color: message.includes("updated") ? "#86efac" : "#fca5a5",
                fontWeight: 600,
                lineHeight: 1.5,
              }}
            >
              {message}
            </div>
          ) : null}
        </div>
      </form>
    </div>
  );
}