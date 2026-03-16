export default function ProfilePage() {
  return (
    <div className="container">
      <section className="page-hero">
        <div>
          <h1>Profile</h1>
          <p>
            Placeholder for account settings, plan information, notification preferences, and
            theme choices once authentication is set up.
          </p>
        </div>
      </section>
      <div className="placeholder-card">
        <h3>Next step</h3>
        <p>Wire this to Supabase Auth or Clerk after milestone 1 is running cleanly.</p>
      </div>
    </div>
  );
}
