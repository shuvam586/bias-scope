import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useParams,
  useLocation,
} from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import "./styles.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

function time(date) {
  if (!date) return "Recently";
  const ms = Date.now() - new Date(date);
  const h = Math.max(0, Math.floor(ms / 36e5));
  if (h < 1) {
    const m = Math.max(1, Math.floor(ms / 6e4));
    return `${m}m ago`;
  }
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function Icon({ name, size = 18 }) {
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    chevron: <path d="m8 10 4 4 4-4" />,
    back: <path d="m15 18-6-6 6-6" />,
    github: (
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    external: <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function Skeleton({ className, style, ...props }) {
  return (
    <div className={`loading-skeleton ${className || ""}`} style={style} {...props} />
  );
}

function EventSkeleton({ featured }) {
  if (featured) {
    return (
      <div className="featured-event">
        <Skeleton className="skeleton-image" style={{ height: 220 }} />
        <div className="featured-overlay">
          <Skeleton className="skeleton-text medium" style={{ width: "30%" }} />
          <Skeleton className="skeleton-title" />
          <Skeleton className="skeleton-title" style={{ width: "60%" }} />
          <Skeleton className="skeleton-text short" />
        </div>
      </div>
    );
  }
  return (
    <div className="compact-event">
      <Skeleton className="skeleton-thumb" />
      <div className="compact-content">
        <div className="compact-kicker">
          <Skeleton className="skeleton-text" style={{ width: "25%" }} />
        </div>
        <Skeleton className="skeleton-title" />
        <Skeleton className="skeleton-text short" />
      </div>
    </div>
  );
}

function StorySkeleton() {
  return (
    <div className="story-item">
      <Skeleton className="skeleton-text" style={{ width: "80%" }} />
      <Skeleton className="skeleton-text short" style={{ marginTop: 8 }} />
    </div>
  );
}

function Header() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const dateStr = now.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="top-nav">
      <div className="nav-inner">
        <Link className="nav-brand" to="/">
          bias<span>scope</span>
          <b>•</b>
        </Link>
        <nav className="nav-tabs" role="tablist">
          <NavLink
            className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
            to="/"
            role="tab"
            aria-selected={true}
          >
            Home
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
            to="/rising"
            role="tab"
          >
            For You
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
            to="/topics"
            role="tab"
          >
            Topics
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
            to="/sources"
            role="tab"
          >
            Sources
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
            to="/blindspot"
            role="tab"
          >
            Blindspot
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
            to="/analysis"
            role="tab"
          >
            Analysis
          </NavLink>
        </nav>
        <div className="nav-datetime" aria-live="polite">
          <span>{dateStr}</span>
          <span>{timeStr}</span>
        </div>
      </div>
    </header>
  );
}

function FeaturedEvent({ event }) {
  if (!event) return <EventSkeleton featured />;
  return (
    <Link
      to={`/event/${event.id}`}
      className="featured-event"
      aria-labelledby="featured-title"
    >
      {event.image ? (
        <img
          src={event.image}
          alt=""
          className="featured-image"
          loading="eager"
        />
      ) : null}
      <div className="featured-overlay">
        <div className="featured-kicker">
          <time className="featured-time">{time(event.updated_at || event.created_at)}</time>
        </div>
        <h2 id="featured-title" className="featured-title">{event.title}</h2>
        <p className="featured-summary">{event.summary || "Follow this developing story and read coverage from all linked sources."}</p>
        <div className="featured-meta">
          <span>
            → {event.articles_count || event.articles?.length || 0} articles
          </span>
          <span>
            → {event.sources_count || 0} sources
          </span>
        </div>
      </div>
    </Link>
  );
}

function CompactEvent({ event }) {
  if (!event) return <EventSkeleton />;
  const hasImage = event.image && event.image !== "https://picsum.photos/400/300";
  return (
    <Link
      to={`/event/${event.id}`}
      className={`compact-event ${!hasImage ? "no-image" : ""}`}
      aria-label={`Read coverage of ${event.title}`}
    >
      {hasImage ? <img src={event.image} alt="" className="compact-thumb" loading="lazy" /> : null}
      <div className="compact-content">
        <div className="compact-header">
          <div className="compact-kicker">
            <time className="compact-time">{time(event.updated_at || event.created_at)}</time>
          </div>
          <h3 className="compact-title">{event.title}</h3>
        </div>
        <div className="compact-meta">
          <span>
            → {event.articles_count || event.articles?.length || 0} articles
          </span>
          <span>
            → {event.sources_count || 0} sources
          </span>
        </div>
      </div>
    </Link>
  );
}

function OtherEvents({ events }) {
  return (
    <section className="events-list" aria-labelledby="other-events-title">
      <div className="column-header">
        <h3 className="column-title" id="other-events-title">More Events</h3>
      </div>
      {events.length > 0 ? (
        <div className="events-grid">
          {events.map((e) => <CompactEvent key={e.id} event={e} />)}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-title">No more events</div>
          <div className="empty-text">Check back later for updates</div>
        </div>
      )}
    </section>
  );
}

function PromoCard() {
  return (
    <aside className="promo-card">
      <h3 className="promo-title">
        <span className="promo-title-normal">See the story</span>
        <br />
        <span className="promo-title-italic">behind the story.</span>
      </h3>
      <p className="promo-desc">
        Major events, organized from every angle. Follow what matters and understand how it&apos;s being covered.
      </p>
    </aside>
  );
}

function BlindspotPanel() {
  return (
    <aside className="blindspot-panel" aria-labelledby="blindspot-title">
      <h3 className="blindspot-title" id="blindspot-title">Blindspot</h3>
      <p className="blindspot-desc">
        This section highlights stories with uneven coverage across political perspectives. 
        It will show events where Left, Center, or Right-leaning sources significantly 
        over- or under-report compared to the overall media landscape.
      </p>
      <div className="blindspot-empty">
        <div className="blindspot-empty-icon">
          <Icon name="arrow" size={40} />
        </div>
        <h4 className="blindspot-empty-title">Coming Soon</h4>
        <p className="blindspot-empty-text">
          Coverage analysis requires bias classification data that is not yet available.
        </p>
      </div>
    </aside>
  );
}

function EventFeed({ rising = false }) {
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // Fetch events with basic fields
        const { data: eventsData, error: eventsErr } = await supabase
          .from("events")
          .select("id, title, summary, image, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(50);

        if (eventsErr) throw eventsErr;

        // Fetch all articles for these events to compute counts and sources
        const eventIds = (eventsData || []).map((e) => e.id);
        let articlesByEvent = {};
        let sourcesByEvent = {};

        if (eventIds.length > 0) {
          const { data: articlesData, error: articlesErr } = await supabase
            .from("articles")
            .select("id, title, source, published_at, cluster")
            .in("cluster", eventIds);

          if (articlesErr) throw articlesErr;

          // Group articles by event (cluster)
          for (const article of articlesData || []) {
            const clusterId = article.cluster;
            if (!articlesByEvent[clusterId]) articlesByEvent[clusterId] = [];
            articlesByEvent[clusterId].push(article);
            if (!sourcesByEvent[clusterId]) sourcesByEvent[clusterId] = new Set();
            sourcesByEvent[clusterId].add(article.source);
          }
        }

        const processed = (eventsData || []).map((e) => {
          const articles = articlesByEvent[e.id] || [];
          const sources = sourcesByEvent[e.id] || new Set();
          return {
            ...e,
            articles,
            articles_count: articles.length,
            sources: Array.from(sources),
            sources_count: sources.size,
          };
        });

        setEvents(processed);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(
    () =>
      events.filter((e) =>
        (e.title || "").toLowerCase().includes(query.toLowerCase())
      ),
    [events, query]
  );

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          (b.articles_count || 0) - (a.articles_count || 0)
      ),
    [filtered]
  );

  const featuredEvent = sorted[0];
  const otherEvents = sorted.slice(1);

  if (loading) {
    return (
      <div className="app-shell">
        <Header />
        <main className="main-grid" role="main">
          <section className="column center-col">
            <EventSkeleton featured />
            <section className="events-list">
              <div className="column-header">
                <h3 className="column-title">More Events</h3>
              </div>
              {[...Array(5)].map((_, i) => <EventSkeleton key={i} />)}
            </section>
          </section>
          <aside className="column right-col">
            <PromoCard />
            <BlindspotPanel />
          </aside>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell">
        <Header />
        <main className="main-grid">
          <div className="empty-state" style={{ gridColumn: "1/-1" }}>
            <div className="empty-icon"><Icon name="arrow" size={40} /></div>
            <h3 className="empty-title">Couldn't load events</h3>
            <p className="empty-text">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="main-grid" role="main">
        <section className="column center-col">
          <FeaturedEvent event={featuredEvent} />
          <OtherEvents events={otherEvents} />
        </section>
        <aside className="column right-col">
          <PromoCard />
          <BlindspotPanel />
        </aside>
      </main>
    </div>
  );
}

function EventPage() {
  const { eventid } = useParams();
  const [event, setEvent] = useState();
  const [articles, setArticles] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [er, ar, cr] = await Promise.all([
          supabase
            .from("events")
            .select("id,title,summary,image,created_at,updated_at")
            .eq("id", eventid)
            .single(),
          supabase
            .from("articles")
            .select("id,title,description,source,published_at,url")
            .eq("cluster", eventid)
            .order("published_at", { ascending: false }),
          supabase
            .from("claims")
            .select("id,text,source_count,article_count")
            .eq("event", eventid)
            .order("article_count", { ascending: false }),
        ]);

        if (er.error) throw er.error;
        const eventData = er.data;
        const articlesData = ar.data || [];
        if (ar.error) throw ar.error;

        // Compute sources from articles
        const sources = [...new Set(articlesData.map((a) => a.source).filter(Boolean))];

        // Attach computed fields to event
        const enrichedEvent = {
          ...eventData,
          articles_count: articlesData.length,
          sources_count: sources.length,
          sources,
        };

        setEvent(enrichedEvent);
        setArticles(articlesData);
        if (cr.error) console.error("Claims fetch error:", cr.error.message);
        else setClaims(cr.data || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventid]);

  const publishedTime = articles.length ? time(articles[articles.length - 1].published_at) : null;
  const updatedTime = articles.length ? time(articles[0].published_at) : null;
  const eventBias = event?.bias || (articles[0]?.bias || "unknown");

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
            {[...Array(3)].map((_, i) => (
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
            <span className="event-source-count">
              <Icon name="arrow" size={10} />
              {event.sources_count || 0} sources
            </span>
            {publishedTime && <span>Published {publishedTime}</span>}
            {publishedTime && updatedTime && <span>·</span>}
            {updatedTime && <span>Updated {updatedTime}</span>}
          </div>
          <h1 className="event-hero-title">{event.title}</h1>
          {event.summary && <p className="event-hero-summary">{event.summary}</p>}
          <div className="event-hero-meta">
            <span>→ {event.articles_count || articles.length} articles</span>
            <span>→ {event.sources_count || 0} sources</span>
            <span>→ {event.sources?.join(", ")}</span>
          </div>
        </article>

        <section className="coverage-section" aria-labelledby="coverage-title">
          <header className="coverage-header">
            <h2 className="coverage-title" id="coverage-title">Coverage</h2>
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
                      <span>{a.source}</span>
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
                <p className="empty-text">No coverage found for this event</p>
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

function App() {
  const location = useLocation();
  useEffect(() => {
    document.body.className = location.pathname.startsWith("/event")
      ? "page-event"
      : "page-home";
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<EventFeed />} />
      <Route path="/rising" element={<EventFeed rising />} />
      <Route path="/topics" element={<EventFeed />} />
      <Route path="/sources" element={<EventFeed />} />
      <Route path="/blindspot" element={<EventFeed />} />
      <Route path="/analysis" element={<EventFeed />} />
      <Route path="/event/:eventid" element={<EventPage />} />
    </Routes>
  );
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);