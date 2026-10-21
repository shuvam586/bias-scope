import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/layout/Header";
import Icon from "../components/ui/Icon";
import Skeleton from "../components/ui/Skeleton";
import { fetchEventDetail } from "../api/events";
import { articleBiasLabel, computeBiasCounts, toPercentages } from "../lib/bias";
import { time } from "../lib/format";

export default function EventPage() {
  const { eventid } = useParams();
  const [event, setEvent] = useState();
  const [articles, setArticles] = useState([]);
  const [claims, setClaims] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [sourceBiases, setSourceBiases] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("articles");
  const [showAllArticles, setShowAllArticles] = useState(false);
  const [summaryTab, setSummaryTab] = useState("left");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchEventDetail(eventid);
        if (cancelled) return;
        setEvent(data.event);
        setArticles(data.articles);
        setClaims(data.claims);
        setSummaries(data.summaries);
        setSourceBiases(data.sourceBiases);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventid]);

  const biasDistribution = useMemo(
    () => computeBiasCounts(articles, sourceBiases),
    [articles, sourceBiases]
  );
  const biasPercentages = toPercentages(biasDistribution);

  const publishedTime = articles.length ? time(articles[articles.length - 1].published_at) : null;
  const updatedTime = articles.length ? time(articles[0].published_at) : null;

  const filteredClaims = claims
    .filter((c) => c.article_count > 1 && c.source_count > 1)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="app-shell">
        <Header />
        <main className="event-page">
          <div className="page-header">
            <button className="back-btn"><Icon name="back" size={14} /> Back</button>
            <span className="page-title">Event Detail</span>
          </div>
          <article className="event-hero">
            <Skeleton className="skeleton-image" style={{ height: 320 }} />
            <Skeleton className="skeleton-title" />
            <Skeleton className="skeleton-text medium" />
          </article>
          <section className="coverage-section">
            <div className="coverage-header"><Skeleton className="skeleton-text short" /></div>
            <div className="coverage-tabs">
              <Skeleton className="skeleton-tab" />
              <Skeleton className="skeleton-tab" />
            </div>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="skeleton-text" style={{ padding: "14px 20px", margin: "0 20px", borderBottom: "1px solid var(--border)" }} />
            ))}
          </section>
          <section className="summary-section">
            <div className="summary-header"><Skeleton className="skeleton-text short" /></div>
            <div className="summary-tabs">
              <Skeleton className="skeleton-tab" />
              <Skeleton className="skeleton-tab" />
              <Skeleton className="skeleton-tab" />
            </div>
            <Skeleton className="skeleton-text" style={{ padding: "20px", height: 100 }} />
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
            <span className="page-title">Event Detail</span>
          </div>
          <div className="empty-state" style={{ paddingTop: 60 }}>
            <div className="empty-icon"><Icon name="arrow" size={48} /></div>
            <h3 className="empty-title">Couldn't load event</h3>
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
          <span className="page-title">Event Detail</span>
        </div>
        <article className="event-hero">
          {event.image ? (
            <img src={event.image} alt="" className="event-hero-img" loading="eager" />
          ) : null}
          <div className="event-hero-header">
            <div className="event-hero-bias" aria-label="Bias distribution">
              <span className="bias-bar">
                <span className="bias-segment bias-left" style={{ width: `${biasPercentages.left}%` }}>
                  {biasPercentages.left > 0 && <span className="bias-segment-text">Left {biasPercentages.left}%</span>}
                </span>
                <span className="bias-segment bias-center" style={{ width: `${biasPercentages.center}%` }}>
                  {biasPercentages.center > 0 && <span className="bias-segment-text">Center {biasPercentages.center}%</span>}
                </span>
                <span className="bias-segment bias-right">
                  {biasPercentages.right > 0 && <span className="bias-segment-text">Right {biasPercentages.right}%</span>}
                </span>
              </span>
            </div>
            <div className="event-hero-meta-line">
              {event.sources_count || 0} sources
              {(event.articles_count || articles.length) && (event.sources_count || 0) && <span>·</span>}
              {event.articles_count || articles.length} articles
              {(event.articles_count || articles.length) && publishedTime && <span>·</span>}
              {publishedTime && <span>Published {publishedTime}</span>}
              {publishedTime && updatedTime && <span>·</span>}
              {updatedTime && <span>Updated {updatedTime}</span>}
            </div>
          </div>
          <h1 className="event-hero-title">{event.title}</h1>
          {event.summary && <p className="event-hero-summary">{event.summary}</p>}
          <div className="event-hero-meta">
            <span>
              → {event.sources?.slice(0, 4).join(", ")}
              {event.sources_count > 4 && <span> +{event.sources_count - 4} more</span>}
            </span>
            <div className="event-tags">
              <span className="event-tag">Breaking</span>
              <span className="event-tag">India</span>
            </div>
          </div>
        </article>

        <section className="summary-section" aria-labelledby="summary-title">
          <nav className="summary-tabs" role="tablist">
            {["left", "center", "right"].map((side) => (
              <button
                key={side}
                role="tab"
                aria-selected={summaryTab === side}
                className={`summary-tab ${summaryTab === side ? "active" : ""}`}
                onClick={() => setSummaryTab(side)}
              >
                {side.charAt(0).toUpperCase() + side.slice(1)}
              </button>
            ))}
          </nav>
          <div className="summary-content-panel" role="tabpanel">
            <div className={`summary-side summary-${summaryTab}`}>
              {summaries[summaryTab] ? (
                <div className="summary-content">
                  {summaries[summaryTab].split("\n").map((point, i) => (
                    point.trim() && (
                      <p key={i} className="summary-point">
                        <span className="summary-bullet">•</span>
                        {point.trim().replace(/^[•\s]+/, "")}
                      </p>
                    )
                  ))}
                </div>
              ) : (
                <p className="summary-empty">Not enough articles to generate a summary yet</p>
              )}
            </div>
          </div>
        </section>

        <section className="coverage-section" aria-labelledby="coverage-title">
          <header className="coverage-header">
            <h2 className="coverage-title" id="coverage-title">Coverage</h2>
            <span className="coverage-count">{articles.length} articles</span>
          </header>

          <nav className="coverage-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === "sources"}
              className={`coverage-tab ${activeTab === "sources" ? "active" : ""}`}
              onClick={() => setActiveTab("sources")}
            >
              Sources
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "articles"}
              className={`coverage-tab ${activeTab === "articles" ? "active" : ""}`}
              onClick={() => setActiveTab("articles")}
            >
              Articles
            </button>
          </nav>

          <div className="coverage-content" role="tabpanel">
            {activeTab === "sources" && (
              <div className="sources-list">
                {articles.length > 0 ? (
                  Object.entries(
                    articles.reduce((acc, article) => {
                      const source = article.source || "Unknown";
                      acc[source] = (acc[source] || 0) + 1;
                      return acc;
                    }, {})
                  )
                    .sort(([, a], [, b]) => b - a)
                    .map(([source, count]) => (
                      <div key={source} className="source-row">
                        <div className="source-badge-main">
                          {(source || "N")[0].toUpperCase()}
                        </div>
                        <div className="source-info">
                          <span className="source-name">{source}</span>
                          <span className="source-count">{count} article{count !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="empty-state" style={{ padding: 32, borderTop: "1px solid var(--border)" }}>
                    <div className="empty-icon"><Icon name="arrow" size={32} /></div>
                    <h3 className="empty-title">No sources</h3>
                    <p className="empty-text">No coverage found for this event</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "articles" && (
              <div className="article-list">
                {articles.length > 0 ? (
                  <>
                    {(showAllArticles ? articles : articles.slice(0, 7)).map((a) => {
                      const biasLabel = articleBiasLabel(sourceBiases[a.source]);
                      return (
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
                              <span>{a.source}</span>
                              <time>{time(a.published_at)}</time>
                              <span className={`article-bias ${biasLabel}`}>{biasLabel}</span>
                            </div>
                            <h3 className="article-title">{a.title}</h3>
                          </div>
                          <button className="article-external" aria-label="Open article">
                            <Icon name="external" size={16} />
                          </button>
                        </a>
                      );
                    })
                    }
                    {!showAllArticles && articles.length > 7 && (
                      <button className="show-more-btn" onClick={() => setShowAllArticles(true)}>
                        Show more
                      </button>
                    )}
                    {showAllArticles && (
                      <button className="show-more-btn" onClick={() => setShowAllArticles(false)}>
                        Show less
                      </button>
                    )}
                  </>
                ) : (
                  <div className="empty-state" style={{ padding: 32, borderTop: "1px solid var(--border)" }}>
                    <div className="empty-icon"><Icon name="arrow" size={32} /></div>
                    <h3 className="empty-title">No articles</h3>
                    <p className="empty-text">No coverage found for this event</p>
                  </div>
                )
                }
              </div>
            )}

          </div>
        </section>

        {filteredClaims.length > 0 && (
          <section className="claims-section" aria-labelledby="claims-title">
            <header className="claims-header">
              <h2 className="claims-title" id="claims-title">Key Claims</h2>
            </header>
            <div className="claims-list">
              {filteredClaims.map((claim) => (
                <div key={claim.id} className="claim-card">
                  <p className="claim-text">{claim.text}</p>
                  <div className="claim-meta">
                    <span>{claim.article_count} articles</span>
                    <span>{claim.source_count} sources</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
