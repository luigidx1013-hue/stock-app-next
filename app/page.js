import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <section className="page-hero">
        <div>
          <h1>Turn your stock tool into a real app</h1>
          <p>
            This starter keeps your existing analyzer, but restructures it into a multi-section
            Next.js app so you can add auth, watchlists, saved searches, and a mobile app later.
          </p>
        </div>
      </section>

      <div className="placeholder-grid">
        <div className="placeholder-card">
          <h3>Analyzer</h3>
          <p>Your current stock model rebuilt as a dedicated app section.</p>
          <Link href="/analyzer" className="primary-button">Open analyzer</Link>
        </div>
        <div className="placeholder-card">
          <h3>Dashboard</h3>
          <p>Ready for saved searches, quick actions, and personal watchlists.</p>
        </div>
        <div className="placeholder-card">
          <h3>Profile + auth</h3>
          <p>Next step after this starter: add Supabase or Clerk for login and persistence.</p>
        </div>
      </div>
    </div>
  );
}
