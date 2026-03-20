import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import ProfileSettingsCard from "@/components/ProfileSettingsCard";

function formatDate(value) {
  if (!value) return "Unavailable";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Unavailable";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function StatCard({ label, value, accent = "#93c5fd" }) {
  return (
    <div
      style={{
        borderRadius: "18px",
        padding: "18px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.04)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
      }}
    >
      <div
        style={{
          fontSize: "0.82rem",
          color: accent,
          fontWeight: 700,
          marginBottom: "8px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "1.45rem",
          fontWeight: 800,
          color: "white",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Profile auth error:", error.message || error);
  }

  if (!user) {
    redirect("/login");
  }

  let rows = [];
  let predictionsLoadFailed = false;

  const { data: predictions, error: predictionsError } = await supabase
    .from("predictions")
    .select(
      "id, ticker, status, accuracy_score, direction_correct, predicted_price, actual_price, target_date, created_at, summary"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (predictionsError) {
    predictionsLoadFailed = true;
    console.log("Predictions could not be loaded on profile page.");
  } else {
    rows = predictions || [];
  }

  const scored = rows.filter((row) => row.status === "scored");
  const pending = rows.filter((row) => row.status !== "scored");

  const totalPredictions = rows.length;
  const scoredCount = scored.length;
  const pendingCount = pending.length;

  const averageAccuracy =
    scoredCount > 0
      ? (
          scored.reduce(
            (sum, row) => sum + Number(row.accuracy_score || 0),
            0
          ) / scoredCount
        ).toFixed(1)
      : "—";

  const directionRate =
    scoredCount > 0
      ? `${Math.round(
          (scored.filter((row) => row.direction_correct === true).length /
            scoredCount) *
            100
        )}%`
      : "—";

  const bestScore =
    scoredCount > 0
      ? Math.max(...scored.map((row) => Number(row.accuracy_score || 0))).toFixed(2)
      : "—";

  const metadata = user.user_metadata || {};
  const displayName =
    metadata.display_name ||
    metadata.full_name ||
    metadata.name ||
    user.email?.split("@")[0] ||
    "Anonymous";

  const bio =
    metadata.bio || "Building a track record one prediction at a time.";

  const favoriteTicker = metadata.favorite_ticker || "—";
  const accentColor = metadata.accent_color || "#22c55e";

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 24px 56px",
        background:
          "linear-gradient(135deg, #08112b 0%, #020817 55%, #0b2447 100%)",
        color: "white",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <section
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(10px)",
            borderRadius: "24px",
            padding: "30px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "120px minmax(0, 1fr)",
              gap: "20px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                fontWeight: 800,
                color: "white",
                background: `linear-gradient(135deg, ${accentColor}, rgba(255,255,255,0.12))`,
                boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
              }}
            >
              {initials}
            </div>

            <div>
              <div
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  borderRadius: "999px",
                  background: "rgba(34,197,94,0.14)",
                  border: "1px solid rgba(34,197,94,0.28)",
                  color: "#86efac",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  marginBottom: "14px",
                }}
              >
                Your Profile
              </div>

              <h1
                style={{
                  margin: "0 0 10px",
                  fontSize: "2.2rem",
                  fontWeight: 800,
                }}
              >
                {displayName}
              </h1>

              <p
                style={{
                  margin: "0 0 14px",
                  color: "rgba(255,255,255,0.74)",
                  lineHeight: 1.65,
                  maxWidth: "760px",
                }}
              >
                {bio}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    padding: "8px 12px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "rgba(255,255,255,0.82)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                  }}
                >
                  Favorite Ticker: {favoriteTicker}
                </span>

                <span
                  style={{
                    padding: "8px 12px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "rgba(255,255,255,0.82)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                  }}
                >
                  Member Since: {formatDate(user.created_at)}
                </span>

                <span
                  style={{
                    padding: "8px 12px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "rgba(255,255,255,0.82)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                  }}
                >
                  Last Sign In: {formatDate(user.last_sign_in_at)}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <StatCard label="Total Predictions" value={totalPredictions} accent="#93c5fd" />
          <StatCard label="Pending" value={pendingCount} accent="#fcd34d" />
          <StatCard
            label="Average Accuracy"
            value={averageAccuracy === "—" ? "—" : `${averageAccuracy}%`}
            accent="#86efac"
          />
          <StatCard label="Direction Rate" value={directionRate} accent="#c4b5fd" />
          <StatCard label="Best Score" value={bestScore} accent="#f9a8d4" />
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(320px, 0.9fr) minmax(0, 1.3fr)",
            gap: "20px",
            alignItems: "start",
          }}
        >
          <ProfileSettingsCard
            initialDisplayName={displayName}
            initialBio={metadata.bio || ""}
            initialFavoriteTicker={metadata.favorite_ticker || ""}
            initialAccentColor={accentColor}
            email={user.email || ""}
          />

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
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "18px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#93c5fd",
                    fontWeight: 700,
                    marginBottom: "6px",
                  }}
                >
                  Recent Activity
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.45rem",
                    fontWeight: 800,
                  }}
                >
                  Latest predictions
                </h2>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <LogoutButton />
              </div>
            </div>

            {predictionsLoadFailed ? (
              <div
                style={{
                  borderRadius: "16px",
                  padding: "18px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                Profile loaded, but prediction history could not be fetched yet.
              </div>
            ) : rows.length === 0 ? (
              <div
                style={{
                  borderRadius: "16px",
                  padding: "18px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                No predictions yet. Start making calls and your activity will show here.
              </div>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {rows.slice(0, 6).map((row) => (
                  <div
                    key={row.id}
                    style={{
                      borderRadius: "18px",
                      padding: "16px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) auto",
                      gap: "14px",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                          flexWrap: "wrap",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: "1rem",
                          }}
                        >
                          {row.ticker}
                        </span>

                        <span
                          style={{
                            padding: "6px 10px",
                            borderRadius: "999px",
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            background:
                              row.status === "scored"
                                ? "rgba(34,197,94,0.14)"
                                : "rgba(251,191,36,0.14)",
                            border:
                              row.status === "scored"
                                ? "1px solid rgba(34,197,94,0.28)"
                                : "1px solid rgba(251,191,36,0.28)",
                            color:
                              row.status === "scored" ? "#86efac" : "#fde68a",
                          }}
                        >
                          {row.status === "scored" ? "Scored" : "Pending"}
                        </span>
                      </div>

                      <div
                        style={{
                          color: "rgba(255,255,255,0.72)",
                          lineHeight: 1.6,
                          fontSize: "0.94rem",
                        }}
                      >
                        Target {formatMoney(row.predicted_price)} by{" "}
                        {formatDate(row.target_date)}
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                        color: "rgba(255,255,255,0.86)",
                        fontWeight: 700,
                      }}
                    >
                      {row.status === "scored"
                        ? `${Number(row.accuracy_score || 0).toFixed(2)} score`
                        : "Open"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}