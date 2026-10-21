import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/layout/Header";
import Icon from "../components/ui/Icon";
import Skeleton from "../components/ui/Skeleton";
import { fetchSourceArticles } from "../api/events";
import { time } from "../lib/format";

export default function SourcePage() {
  const { sourceid } = useParams();
  const [articles, setArticles] = useState([]);
  const [sourceInfo, setSourceInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchSourceArticles(sourceid);
        if (cancelled) return;
        setArticles(data.articles);
        setSourceInfo(data.sourceInfo);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sourceid]);

  if (loading) {
    return (
      <div className="app-shell">
        <Header />
        <main className="event-page">
          <div className="page-header">
            <button className="back-btn" onClick={() => window.history.back()}><Icon name="back" size={14} /> Back</button>
            <span className="page-title">Source</span>
          </div>
          <section className="coverage-section">
            <div className="coverage-header"><Skeleton className="skeleton-text short" /></div>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="skeleton-text" style={{ padding: "14px 20px", margin: "0 20px", borderBottom: "1px solid var(--border)" }} />
            ))}
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
            <button className="back-btn" onClick={() => window.history.back()}><Icon name="back" size={14} /> Back</button>
            <span className="page-title">Source</span>
          </div>
          <div className="empty-state" style={{ paddingTop: 60 }}>
            <div className="empty-icon"><Icon name="arrow" size={48} /></div>
            <h3 className="empty-title">Couldn't load source</h3>
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
          <button className="back-btn" onClick={() => window.history.back()}><Icon name="back" size={14} /> Back</button>
          <div className="source-header-info">
            <span className="page-title">Source Detail</span>
          </div>
        </div>
        <section className="coverage-section" aria-labelledby="coverage-title">
          <header className="coverage-header">
            <div className="source-header-title">
              {sourceInfo?.domain && (
                <div className="source-logo-wrapper">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${sourceInfo.domain}&sz=128`}
                    alt=""
                    className="source-logo-large"
                    loading="lazy"
                  />
                </div>
              )}
              <h1 className="coverage-title" id="coverage-title">{sourceid}</h1>
            </div>
            <span className="coverage-count">{articles.length} articles</span>
          </header>
          <div className="article-list">
            {articles.length > 0 ? (
              articles.map((a) => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="article-row"
                >
                  <div className="article-source-badge">
                    {(a.source || "N")[0].toUpperCase()}
                  </div>
                  <div className="article-content">
                    <div className="article-meta">
                      <time>{time(a.published_at)}</time>
                    </div>
                    <h3 className="article-title">{a.title}</h3>
                  </div>
                  <button className="article-external" aria-label="Open article">
                    <Icon name="external" size={16} />
                  </button>
                </a>
              ))
            ) : (
              <div className="empty-state" style={{ padding: 32, borderTop: "1px solid var(--border)" }}>
                <div className="empty-icon"><Icon name="arrow" size={32} /></div>
                <h3 className="empty-title">No articles</h3>
                <p className="empty-text">No articles found for this source</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
