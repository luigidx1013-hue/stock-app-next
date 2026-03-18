import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Profile auth error:", error);
  }

  if (!user) {
    redirect("/login");
  }

  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleString()
    : "Unavailable";

  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString()
    : "Unavailable";

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Profile</h1>

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          borderRadius: "12px",
          background: "#111",
          color: "white",
          maxWidth: "700px",
        }}
      >
        <div style={{ marginBottom: "14px" }}>
          <strong>Email:</strong> {user.email}
        </div>

        <div style={{ marginBottom: "14px" }}>
          <strong>User ID:</strong> {user.id}
        </div>

        <div style={{ marginBottom: "14px" }}>
          <strong>Account Created:</strong> {createdAt}
        </div>

        <div style={{ marginBottom: "14px" }}>
          <strong>Last Sign In:</strong> {lastSignIn}
        </div>

        <div style={{ marginTop: "20px" }}>
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}