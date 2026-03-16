export default function DashboardPage() {
  return (
    <div className="container">
      <section className="page-hero">
        <div>
          <h1>Dashboard</h1>
          <p>
            Placeholder for user-specific data. This is where saved searches, recent analyses,
            alerts, and watchlists should live once auth and database are connected.
          </p>
        </div>
      </section>

      <div className="placeholder-grid">
        <div className="placeholder-card"><h3>Recent Searches</h3><p>Store ticker history by user.</p></div>
        <div className="placeholder-card"><h3>Saved Ideas</h3><p>Pin bullish or bearish setups.</p></div>
        <div className="placeholder-card"><h3>Market Snapshot</h3><p>Add personalized summaries here.</p></div>
      </div>
    </div>
  );
}
