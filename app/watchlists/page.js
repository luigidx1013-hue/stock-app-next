export default function WatchlistsPage() {
  return (
    <div className="container">
      <section className="page-hero">
        <div>
          <h1>Watchlists</h1>
          <p>
            Placeholder for multiple user-created watchlists. After auth is added, connect this
            page to your database and let users create named stock lists.
          </p>
        </div>
      </section>
      <div className="placeholder-card">
        <h3>Suggested schema</h3>
        <p>watchlists(id, user_id, name) and watchlist_items(id, watchlist_id, ticker).</p>
      </div>
    </div>
  );
}
