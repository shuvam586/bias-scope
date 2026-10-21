import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Icon from "../components/ui/Icon";
import Skeleton from "../components/ui/Skeleton";
import { fetchSourcesWithCounts } from "../api/events";

export default function SourcesPage() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const list = await fetchSourcesWithCounts();
        if (!cancelled) setSources(list);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="app-shell">
        <Header />
        <main className="event-page">
          <div className="page-header">
            <span className="page-title">Sources</span>
          </div>
          <section className="sources-grid-section" aria-labelledby="sources-title">
            <div className="column-header">
              <h2 className="column-title" id="sources-title">All Sources</h2>
              <Skeleton className="skeleton-text short" />
            </div>
            <div className="sources-grid">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="source-card">
                  <Skeleton className="source-card-logo-skeleton" />
                  <Skeleton className="skeleton-title" style={{ width: "80%" }} />
                  <Skeleton className="skeleton-text short" style={{ width: "40%" }} />
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell">
        <Header />
        <main className="event-page">
          <div className="page-header">
            <span className="page-title">Sources</span>
          </div>
          <div className="empty-state" style={{ paddingTop: 60 }}>
            <div className="empty-icon"><Icon name="arrow" size={48} /></div>
            <h3 className="empty-title">Couldn't load sources</h3>
            <p className="empty-text">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="event-page">
        <div className="page-header">
          <span className="page-title">Sources</span>
        </div>
        <section className="sources-grid-section" aria-labelledby="sources-title">
          {sources.length > 0 ? (
            <div className="sources-grid">
              {sources.map((s) => (
                <Link
                  key={s.id}
                  to={`/source/${encodeURIComponent(s.id)}`}
                  className="source-card"
                >
                  {s.domain ? (
                    <div className="source-card-logo">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${s.domain}&sz=128`}
                        alt=""
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="source-card-logo-placeholder">
                      {(s.id || "N")[0].toUpperCase()}
                    </div>
                  )}
                  <h3 className="source-card-name">{s.id}</h3>
                  <span className="source-card-count">{s.count} article{s.count !== 1 ? "s" : ""}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-title">No sources</div>
              <div className="empty-text">No sources found</div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
