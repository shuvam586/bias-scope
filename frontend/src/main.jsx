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
        <Skeleton className="skeleton-image" style={{ height: 380 }} />
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
      <Skeleton className="skeleton-image" style={{ height: 160 }} />
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
            to="/sources"
            role="tab"
          >
            Sources
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
            to="/theskew"
            role="tab"
          >
            The Skew
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
  const latestArticleTime = event.articles?.length
    ? Math.max(...event.articles.map(a => new Date(a.published_at).getTime()))
    : null;
  const percentages = event.bias_percentages || { left: 0, center: 0, right: 0 };
  const dominant = event.bias_dominant || "Mixed";
  const dominantPct = dominant !== "Mixed" ? percentages[dominant.toLowerCase()] : 0;
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
          <time className="featured-time">{latestArticleTime ? time(new Date(latestArticleTime)) : time(event.updated_at || event.created_at)}</time>
        </div>
        <h2 id="featured-title" className="featured-title">{event.title}</h2>
        <p className="featured-summary">{event.summary || "Follow this developing story and read coverage from all linked sources."}</p>
        <div className="featured-meta">
          <span>
            → {event.sources_count || 0} sources
          </span>
        </div>
        <div className="featured-bias">
          <div className="featured-bias-bar">
            <span className="featured-bias-segment bias-left" style={{ width: `${percentages.left}%` }} />
            <span className="featured-bias-segment bias-center" style={{ width: `${percentages.center}%` }} />
            <span className="featured-bias-segment bias-right" />
          </div>
          <span className="featured-bias-label">{dominant}{dominantPct > 0 && ` ${dominantPct}%`}</span>
        </div>
      </div>
    </Link>
  );
}

function CompactEvent({ event }) {
  if (!event) return <EventSkeleton />;
  const hasImage = event.image && event.image !== "https://picsum.photos/400/300";
  const latestArticleTime = event.articles?.length
    ? Math.max(...event.articles.map(a => new Date(a.published_at).getTime()))
    : null;
  const percentages = event.bias_percentages || { left: 0, center: 0, right: 0 };
  const dominant = event.bias_dominant || "Mixed";
  const dominantPct = dominant !== "Mixed" ? percentages[dominant.toLowerCase()] : 0;
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
            <time className="compact-time">{latestArticleTime ? time(new Date(latestArticleTime)) : time(event.updated_at || event.created_at)}</time>
          </div>
          <h3 className="compact-title">{event.title}</h3>
        </div>
        <div className="compact-meta">
          <span>
            → {event.sources_count || 0} sources
          </span>
        </div>
        <div className="compact-bias">
          <div className="compact-bias-bar">
            <span className="compact-bias-segment bias-left" style={{ width: `${percentages.left}%` }} />
            <span className="compact-bias-segment bias-center" style={{ width: `${percentages.center}%` }} />
            <span className="compact-bias-segment bias-right" />
          </div>
          <span className="compact-bias-label">{dominant}{dominantPct > 0 && ` ${dominantPct}%`}</span>
        </div>
      </div>
    </Link>
  );
}

function OtherEvents({ events, limit }) {
  const displayEvents = limit ? events.slice(0, limit) : events;

  return (
    <section className="events-list" aria-labelledby="other-events-title">
      {displayEvents.length > 0 ? (
        <div className="events-grid">
          {displayEvents.map((e) => <CompactEvent key={e.id} event={e} />)}
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

function AdditionalEventsSection({ events, showAdditionalEvents = true }) {
  if (!showAdditionalEvents) return null;
  const leftEvents = events.slice(3, events.length);
  const rightEvents = events.slice(0, 3);

  // Right column shows only 1 event

  return (
    <section className="additional-section" aria-labelledby="additional-events-title">
      <div className="additional-grid">
        <div className="additional-left-col">
          <div className="horizontal-cards-grid">
            {leftEvents.map((e) => <HorizontalEventCard key={e.id} event={e} />)}
          </div>
        </div>
        <div className="additional-right-col">
          {rightEvents.map((e) => <FeaturedArticleCard key={e.id} event={e} />)}
        </div>
      </div>
    </section>
  );
}

function HorizontalEventCard({ event }) {
  const latestArticleTime = event.articles?.length
    ? Math.max(...event.articles.map(a => new Date(a.published_at).getTime()))
    : null;
  const percentages = event.bias_percentages || { left: 0, center: 0, right: 0 };
  const dominant = event.bias_dominant || "Mixed";
  const dominantPct = dominant !== "Mixed" ? percentages[dominant.toLowerCase()] : 0;

  return (
    <Link
      to={`/event/${event.id}`}
      className="horizontal-event-card"
      aria-label={`Read coverage of ${event.title}`}
    >
      <div className="horizontal-event-content">
        <h3 className="horizontal-event-title">{event.title}</h3>
        <div className="horizontal-event-stats">
          <div className="horizontal-event-bias-bar">
            <span className="horizontal-bias-segment bias-left" style={{ width: `${percentages.left}%` }} />
            <span className="horizontal-bias-segment bias-center" style={{ width: `${percentages.center}%` }} />
            <span className="horizontal-bias-segment bias-right" style={{ width: `${percentages.right}%` }} />
          </div>
          <span>→ {event.sources_count || 0} sources</span>
          <span>→ {dominant}{dominantPct > 0 && ` ${dominantPct}%`}</span>
          <time className="horizontal-event-time">
            {latestArticleTime ? time(new Date(latestArticleTime)) : time(event.updated_at || event.created_at)}
          </time>
        </div>
      </div>
      {event.image && (
        <img src={event.image} alt="" className="horizontal-event-image" loading="lazy" />
      )}
    </Link>
  );
}

function FeaturedArticleCard({ event }) {
  const latestArticleTime = event.articles?.length
    ? Math.max(...event.articles.map(a => new Date(a.published_at).getTime()))
    : null;
  const percentages = event.bias_percentages || { left: 0, center: 0, right: 0 };
  const dominant = event.bias_dominant || "Mixed";
  const dominantPct = dominant !== "Mixed" ? percentages[dominant.toLowerCase()] : 0;

  return (
    <Link
      to={`/event/${event.id}`}
      className="featured-article-card"
      aria-label={`Read coverage of ${event.title}`}
    >
      {event.image && (
        <img src={event.image} alt="" className="featured-article-image" loading="lazy" />
      )}
      <div className="featured-article-content">
        <div className="featured-article-meta">
          <time className="featured-article-time">
            {latestArticleTime ? time(new Date(latestArticleTime)) : time(event.updated_at || event.created_at)}
          </time>
          <span className="featured-article-bias">
            {dominant === "Left" && <span className="bias-badge left">Left</span>}
            {dominant === "Right" && <span className="bias-badge right">Right</span>}
            {dominant === "Center" && <span className="bias-badge center">Center</span>}
            {dominant === "Mixed" && <span className="bias-badge">Mixed</span>}
          </span>
        </div>
        <h3 className="featured-article-title">{event.title}</h3>
        <div className="featured-article-stats">
          <span>→ {event.sources_count || 0} sources</span>
          <span>→ {dominant}{dominantPct > 0 && ` ${dominantPct}%`}</span>
        </div>
      </div>
    </Link>
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

function TheSkewPanel({ skewEvents = [] }) {
  if (skewEvents.length === 0) {
    return (
      <aside className="theskew-panel" aria-labelledby="theskew-title">
        <h3 className="theskew-title" id="theskew-title">The Skew</h3>
        <p className="theskew-desc">
          This section highlights stories with uneven coverage across political perspectives. 
          It will show events where Left, Center, or Right-leaning sources significantly 
          over- or under-report compared to the overall media landscape.
        </p>
        <div className="theskew-empty">
          <div className="theskew-empty-icon">
            <Icon name="arrow" size={40} />
          </div>
          <h4 className="theskew-empty-title">Coming Soon</h4>
          <p className="theskew-empty-text">
            Coverage analysis requires bias classification data that is not yet available.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="theskew-panel" aria-labelledby="theskew-title">
      <div className="theskew-header">
        <h3 className="theskew-title" id="theskew-title">The Skew</h3>
      </div>
      <p className="theskew-desc">
        These stories have coverage from only one political perspective.
      </p>
      <div className="theskew-grid">
        {skewEvents.map((e) => (
          <Link key={e.id} to={`/event/${e.id}`} className="theskew-event">
            {e.image ? (
              <img src={e.image} alt="" className="theskew-event-image" loading="lazy" />
            ) : (
              <div className="theskew-event-placeholder">
                <Icon name="arrow" size={32} />
              </div>
            )}
            <div className="theskew-event-content">
              <div className="theskew-event-meta">
                <time className="theskew-event-time">
                  {(e.articles?.length ? Math.max(...e.articles.map(a => new Date(a.published_at).getTime())) : null) ? time(new Date((e.articles?.length ? Math.max(...e.articles.map(a => new Date(a.published_at).getTime())) : null))) : time(e.updated_at || e.created_at)}
                </time>
                <span className="theskew-event-bias">
                  {e.bias_percentages.left === 0 ? (
                    <span className="bias-badge right">Missing Left</span>
                  ) : (
                    <span className="bias-badge left">Missing Right</span>
                  )}
                </span>
              </div>
              <h4 className="theskew-event-title">{e.title}</h4>
              <div className="theskew-event-stats">
                <span>→ {e.sources_count || 0} sources</span>
                <span>→ {e.bias_percentages.left === 0 ? e.bias_percentages.right : e.bias_percentages.left}% {e.bias_percentages.left === 0 ? 'Right' : 'Left'}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}

function DailyDispatchPanel({ dispatchEvents = [] }) {
  if (dispatchEvents.length === 0) {
    return (
      <aside className="daily-dispatch-panel" aria-labelledby="daily-dispatch-title">
        <h3 className="daily-dispatch-title" id="daily-dispatch-title">Daily Dispatch</h3>
        <p className="daily-dispatch-desc">
          The most recent stories with full source details.
        </p>
        <div className="daily-dispatch-empty">
          <div className="daily-dispatch-empty-icon">
            <Icon name="arrow" size={40} />
          </div>
          <h4 className="daily-dispatch-empty-title">No stories yet</h4>
          <p className="daily-dispatch-empty-text">
            Check back soon for the latest updates.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="daily-dispatch-panel" aria-labelledby="daily-dispatch-title">
      <div className="daily-dispatch-header">
        <h3 className="daily-dispatch-title" id="daily-dispatch-title">Daily Dispatch</h3>
      </div>
      <p className="daily-dispatch-desc">
        Latest stories with source counts and political bias breakdown.
      </p>
      <div className="daily-dispatch-grid">
        {dispatchEvents.map((e) => (
          <Link key={e.id} to={`/event/${e.id}`} className="daily-dispatch-event">
            <div className="daily-dispatch-event-content">
              <div className="daily-dispatch-event-meta">
                <time className="daily-dispatch-event-time">
                  {(e.articles?.length
                    ? time(new Date(Math.min(...e.articles.map(a => new Date(a.published_at).getTime()))))
                    : time(e.updated_at || e.created_at))}
                </time>
                <span className="daily-dispatch-event-bias">
                  {e.bias_percentages.left > e.bias_percentages.right && e.bias_percentages.left > e.bias_percentages.center ? (
                    <span className="bias-badge left">Left</span>
                  ) : e.bias_percentages.right > e.bias_percentages.left && e.bias_percentages.right > e.bias_percentages.center ? (
                    <span className="bias-badge right">Right</span>
                  ) : (
                    <span className="bias-badge center">Center</span>
                  )}
                </span>
              </div>
              <h4 className="daily-dispatch-event-title">{e.title}</h4>
              <div className="daily-dispatch-event-stats">
                <span>→ {e.sources_count || 0} sources</span>
                <span>
                  → {(() => {
                    const p = e.bias_percentages || { left: 0, center: 0, right: 0 };
                    if (p.left >= p.center && p.left >= p.right) return `${p.left}% Left`;
                    if (p.right >= p.left && p.right >= p.center) return `${p.right}% Right`;
                    return `${p.center}% Center`;
                  })()}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}

function EventFeed({ rising = false, showAdditionalEvents = true, showLeftCol = true }) {
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

        const allSources = new Set();
        (eventsData || []).forEach(e => {
          const sources = sourcesByEvent[e.id] || new Set();
          sources.forEach(s => allSources.add(s));
        });

        // Fetch biases for all sources
        let sourceBiases = {};
        if (allSources.size > 0) {
          const { data: sourcesData, error: sourcesErr } = await supabase
            .from("sources")
            .select("id,bias")
            .in("id", Array.from(allSources));

          if (!sourcesErr && sourcesData) {
            sourceBiases = Object.fromEntries(sourcesData.map(s => [s.id, s.bias]));
          }
        }

        const processed = (eventsData || []).map((e) => {
          const articles = articlesByEvent[e.id] || [];
          const sources = sourcesByEvent[e.id] || new Set();
          
          // Calculate bias distribution for this event
          const counts = { left: 0, center: 0, right: 0, unknown: 0 };
          articles.forEach(a => {
            const bias = sourceBiases[a.source];
            if (bias === -69 || bias === null || bias === undefined) {
              counts.unknown++;
            } else if (bias >= -10 && bias <= -3.5) {
              counts.left++;
            } else if (bias > -3.5 && bias < 3.5) {
              counts.center++;
            } else if (bias >= 3.5 && bias <= 10) {
              counts.right++;
            } else {
              counts.unknown++;
            }
          });
          const totalBiased = counts.left + counts.center + counts.right;
          const percentages = totalBiased > 0 ? {
            left: Math.round((counts.left / totalBiased) * 100),
            center: Math.round((counts.center / totalBiased) * 100),
            right: Math.round((counts.right / totalBiased) * 100),
          } : { left: 0, center: 0, right: 0 };
          
          // Determine dominant bias
          let dominant = "Mixed";
          if (totalBiased > 0) {
            const max = Math.max(percentages.left, percentages.center, percentages.right);
            if (percentages.left === max) dominant = "Left";
            else if (percentages.center === max) dominant = "Center";
            else if (percentages.right === max) dominant = "Right";
          }

          const publishedTime = articles.length
            ? time(new Date(Math.min(...articles.map(a => new Date(a.published_at).getTime()))))
            : time(e.updated_at || e.created_at);

          return {
            ...e,
            articles,
            articles_count: articles.length,
            sources: Array.from(sources),
            sources_count: sources.size,
            bias_percentages: percentages,
            bias_dominant: dominant,
            publishedTime,
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
          (b.sources_count || 0) - (a.sources_count || 0) ||
          (b.articles_count || 0) - (a.articles_count || 0)
      ),
    [filtered]
  );

  const featuredEvent = sorted[0];
  const otherEvents = [...sorted.slice(1,2), ...sorted.slice(3)];
  console.log(otherEvents);

  // Find skew events: events missing left coverage (left% === 0) OR missing right coverage (right% === 0)
  const skewCandidates = sorted.filter(e => {
    const percentages = e.bias_percentages || { left: 0, center: 0, right: 0 };
    return percentages.left === 0 || percentages.right === 0;
  });
  
  // Take top 2 skew events (they're already sorted by sources/articles count)
  const skewEvents = skewCandidates.slice(0, 2);
  
  // Exclude skew events from the main grid
  const skewIds = new Set(skewEvents.map(e => e.id));
  const mainEvents = otherEvents.filter(e => !skewIds.has(e.id));

  // Select 5 most recent events from mainEvents for Daily Dispatch
  const dispatchEvents = [...mainEvents]
    .sort((a, b) => {
      const getTimestamp = (e) => {
        if (e.articles?.length) {
          return Math.min(...e.articles.map(a => new Date(a.published_at).getTime()));
        }
        return new Date(e.updated_at || e.created_at).getTime();
      };
      return getTimestamp(b) - getTimestamp(a);
    })
    .slice(0, 5);

  // Exclude dispatch events from main grid as well
  const dispatchIds = new Set(dispatchEvents.map(e => e.id));
  const finalMainEvents = mainEvents.filter(e => !dispatchIds.has(e.id));

  if (loading) {
    return (
      <div className="app-shell">
        <Header />
        <main className="main-grid" role="main">
          {showLeftCol && (
            <aside className="column left-col">
              <DailyDispatchPanel dispatchEvents={[]} />
            </aside>
          )}
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
            <TheSkewPanel skewEvents={[]} />
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
        {showLeftCol && (
          <aside className="column left-col">
            <DailyDispatchPanel dispatchEvents={dispatchEvents} />
          </aside>
        )}
        <section className="column center-col">
          <FeaturedEvent event={featuredEvent} />
          <OtherEvents events={finalMainEvents} limit={13} />
        </section>
        <aside className="column right-col">
          <PromoCard />
          <TheSkewPanel skewEvents={skewEvents} />
        </aside>
      </main>
      <AdditionalEventsSection events={finalMainEvents.slice(13)} showAdditionalEvents={showAdditionalEvents} />
    </div>
  );
}

function SkewFeed() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sourceBiases, setSourceBiases] = useState({});

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

        const allSources = new Set();
        (eventsData || []).forEach(e => {
          const sources = sourcesByEvent[e.id] || new Set();
          sources.forEach(s => allSources.add(s));
        });

        // Fetch biases for all sources FIRST
        let sourceBiasesMap = {};
        if (allSources.size > 0) {
          const { data: sourcesData, error: sourcesErr } = await supabase
            .from("sources")
            .select("id,bias")
            .in("id", Array.from(allSources));

          if (!sourcesErr && sourcesData) {
            sourceBiasesMap = Object.fromEntries(sourcesData.map(s => [s.id, s.bias]));
            setSourceBiases(sourceBiasesMap);  // Also update state for useMemo deps
          }
        }

        // NOW compute processed WITH the biases we just fetched
        const processed = (eventsData || []).map((e) => {
          const articles = articlesByEvent[e.id] || [];
          const sources = sourcesByEvent[e.id] || new Set();
          
          // Calculate bias distribution for this event
          const counts = { left: 0, center: 0, right: 0, unknown: 0 };
          articles.forEach(a => {
            const bias = sourceBiasesMap[a.source];  // Use local variable, not state
            if (bias === -69 || bias === null || bias === undefined) {
              counts.unknown++;
            } else if (bias >= -10 && bias <= -3.5) {
              counts.left++;
            } else if (bias > -3.5 && bias < 3.5) {
              counts.center++;
            } else if (bias >= 3.5 && bias <= 10) {
              counts.right++;
            } else {
              counts.unknown++;
            }
          });
          const totalBiased = counts.left + counts.center + counts.right;
          const percentages = totalBiased > 0 ? {
            left: Math.round((counts.left / totalBiased) * 100),
            center: Math.round((counts.center / totalBiased) * 100),
            right: Math.round((counts.right / totalBiased) * 100),
          } : { left: 0, center: 0, right: 0 };
          
          // Determine dominant bias
          let dominant = "Mixed";
          if (totalBiased > 0) {
            const max = Math.max(percentages.left, percentages.center, percentages.right);
            if (percentages.left === max) dominant = "Left";
            else if (percentages.center === max) dominant = "Center";
            else if (percentages.right === max) dominant = "Right";
          }

          const publishedTime = articles.length
            ? time(new Date(Math.min(...articles.map(a => new Date(a.published_at).getTime()))))
            : time(e.updated_at || e.created_at);

          return {
            ...e,
            articles,
            articles_count: articles.length,
            sources: Array.from(sources),
            sources_count: sources.size,
            bias_percentages: percentages,
            bias_dominant: dominant,
            publishedTime,
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

  // Build two lists: missingRight (no right sources) and missingLeft (no left sources)
  const missingRight = useMemo(() => 
    events
      .filter(e => {
        // Check if event has NO right-leaning sources
        const articles = e.articles || [];
        const hasRightSource = articles.some(a => {
          const bias = sourceBiases[a.source];
          return bias !== null && bias !== undefined && bias !== -69 && bias >= 3.5;
        });
        return !hasRightSource && articles.length > 0;
      })
      .sort((a, b) => (b.sources_count || 0) - (a.sources_count || 0))
      .slice(0, 4),
  [events, sourceBiases]);

  const missingLeft = useMemo(() => 
    events
      .filter(e => {
        // Check if event has NO left-leaning sources
        const articles = e.articles || [];
        const hasLeftSource = articles.some(a => {
          const bias = sourceBiases[a.source];
          return bias !== null && bias !== undefined && bias !== -69 && bias <= -3.5;
        });
        return !hasLeftSource && articles.length > 0;
      })
      .sort((a, b) => (b.sources_count || 0) - (a.sources_count || 0))
      .slice(0, 4),
  [events, sourceBiases]);

  if (loading) {
    return (
      <div className="app-shell">
        <Header />
        <main className="main-grid skew-grid" role="main">
          <section className="column center-col">
            <div className="skew-skeleton">
              <Skeleton className="skeleton-text short" />
              <Skeleton className="skeleton-text short" />
              {[...Array(4)].map((_, i) => <EventSkeleton key={i} />)}
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
        <main className="main-grid skew-grid">
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
      <main className="main-grid skew-grid" role="main">
        <div className="skew-logo-wrapper">
          <img src="/skewlogo.png" alt="BiasScope" className="skew-logo" />
        </div>
        <section className="skew-grid-content">
          {/* Missing Right column */}
          <div className="skew-column">
            <div className="skew-column-header">
              <h2 className="skew-column-title">Towards Left</h2>
            </div>
            <div className="skew-event-list">
              {missingRight.length > 0 ? (
                missingRight.map((e) => <SkewEventCard key={e.id} event={e} missingSide="left" />)
              ) : (
                <div className="skew-empty">
                  <p className="skew-empty-text">No stories missing right coverage</p>
                </div>
              )}
            </div>
          </div>

          {/* Missing Left column */}
          <div className="skew-column">
            <div className="skew-column-header">
              <h2 className="skew-column-title">Towards Right</h2>
            </div>
            <div className="skew-event-list">
              {missingLeft.length > 0 ? (
                missingLeft.map((e) => <SkewEventCard key={e.id} event={e} missingSide="right" />)
              ) : (
                <div className="skew-empty">
                  <p className="skew-empty-text">No stories missing left coverage</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// Skew Event Card Component
function SkewEventCard({ event, missingSide }) {
  const latestArticleTime = event.articles?.length
    ? Math.max(...event.articles.map(a => new Date(a.published_at).getTime()))
    : null;
  const percentages = event.bias_percentages || { left: 0, center: 0, right: 0 };
  let dominant = (percentages[missingSide]!=0 ? missingSide : "Center") || "Mixed";
  if (dominant == "left") {
    dominant = "Left";
  } else if (dominant == "right") {
    dominant = "Right";
  }
  const dominantPct = dominant !== "Mixed" ? percentages[dominant.toLowerCase()] : 0;

  return (
    <Link
      to={`/event/${event.id}`}
      className="skew-event-card"
      aria-label={`Read coverage of ${event.title}`}
    >
      {event.image && (
        <img src={event.image} alt="" className="skew-event-image" loading="lazy" />
      )}
      <div className="skew-event-content">
        <div className="skew-event-meta">
          <time className="skew-event-time">
            {latestArticleTime ? time(new Date(latestArticleTime)) : time(event.updated_at || event.created_at)}
          </time>
          <span>· {event.sources_count || 0} sources</span>
        </div>
        <h3 className="skew-event-title">{event.title}</h3>
        <div className="skew-event-stats">
          
          <div className="compact-bias">
            <div className="compact-bias-bar">
              <span className="compact-bias-segment bias-left" style={{ width: `${percentages.left}%` }} />
              <span className="compact-bias-segment bias-center" style={{ width: `${percentages.center}%` }} />
              <span className="compact-bias-segment bias-right" />
            </div>
            <span className="compact-bias-label">{dominant}{dominantPct > 0 && ` ${dominantPct}%`}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}


function EventPage() {
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
    (async () => {
      try {
        const [er, ar, cr, sr] = await Promise.all([
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
          supabase
            .from("summaries")
            .select("left,center,right")
            .eq("id", eventid)
            .single(),
        ]);

        if (er.error) throw er.error;
        const eventData = er.data;
        const articlesData = ar.data || [];
        if (ar.error) throw ar.error;

        // Compute sources from articles
        const sources = [...new Set(articlesData.map((a) => a.source).filter(Boolean))];

        // Fetch bias for each source
        let biases = {};
        if (sources.length > 0) {
          const { data: sourcesData, error: sourcesErr } = await supabase
            .from("sources")
            .select("id,bias")
            .in("id", sources);

          if (!sourcesErr && sourcesData) {
            biases = Object.fromEntries(sourcesData.map(s => [s.id, s.bias]));
          }
        }

        // Process summaries
        const summaryData = sr.data || {};
        setSummaries({
          left: summaryData.left,
          center: summaryData.center,
          right: summaryData.right,
        });

        // Attach computed fields to event
        const enrichedEvent = {
          ...eventData,
          articles_count: articlesData.length,
          sources_count: sources.length,
          sources,
        };

        setEvent(enrichedEvent);
        setArticles(articlesData);
        setSourceBiases(biases);
        if (cr.error) console.error("Claims fetch error:", cr.error.message);
        else setClaims(cr.data || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventid]);

  // Calculate bias distribution based on article counts per source
  const biasDistribution = useMemo(() => {
    const counts = { left: 0, center: 0, right: 0, unknown: 0 };
    articles.forEach(a => {
      const bias = sourceBiases[a.source];
      if (bias === -69 || bias === null || bias === undefined) {
        counts.unknown++;
      } else if (bias >= -10 && bias <= -3.5) {
        counts.left++;
      } else if (bias > -3.5 && bias < 3.5) {
        counts.center++;
      } else if (bias >= 3.5 && bias <= 10) {
        counts.right++;
      } else {
        counts.unknown++;
      }
    });
    return counts;
  }, [articles, sourceBiases]);

  const totalBiased = biasDistribution.left + biasDistribution.center + biasDistribution.right;
  const biasPercentages = totalBiased > 0 ? {
    left: Math.round((biasDistribution.left / totalBiased) * 100),
    center: Math.round((biasDistribution.center / totalBiased) * 100),
    right: Math.round((biasDistribution.right / totalBiased) * 100),
  } : { left: 0, center: 0, right: 0 };

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
                      const bias = sourceBiases[a.source];
                      let biasLabel = "unknown";
                      if (bias !== null && bias !== undefined && bias !== -69) {
                        if (bias <= -3.5) biasLabel = "left";
                        else if (bias >= 3.5) biasLabel = "right";
                        else biasLabel = "center";
                      }
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

function SourcePage() {
  const { sourceid } = useParams();
  const [articles, setArticles] = useState([]);
  const [sourceInfo, setSourceInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [articlesRes, sourceRes] = await Promise.all([
          supabase
            .from("articles")
            .select("id,title,description,source,published_at,url,cluster")
            .eq("source", sourceid)
            .order("published_at", { ascending: false })
            .limit(100),
          supabase
            .from("sources")
            .select("*")
            .eq("id", sourceid)
            .single(),
        ]);

        if (articlesRes.error) throw articlesRes.error;
        setArticles(articlesRes.data || []);
        if (!sourceRes.error) setSourceInfo(sourceRes.data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
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
            {/* {sourceInfo?.domain && (
              <div className="source-logo-wrapper">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${sourceInfo.domain}&sz=128`}
                  alt=""
                  className="source-logo-large"
                  loading="lazy"
                />
              </div>
            )} */}
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

function SourcesPage() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // Fetch all sources from the sources table
        const { data: sourcesData, error: sourcesErr } = await supabase
          .from("sources")
          .select("*");

        if (sourcesErr) throw sourcesErr;

        // Fetch article counts for each source
        const sourceNames = (sourcesData || []).map(s => s.id);
        let articleCounts = {};

        if (sourceNames.length > 0) {
          const { data: articlesData, error: articlesErr } = await supabase
            .from("articles")
            .select("source")
            .in("source", sourceNames);

          if (articlesErr) throw articlesErr;

          (articlesData || []).forEach((a) => {
            articleCounts[a.source] = (articleCounts[a.source] || 0) + 1;
          });
        }

        const sourceList = (sourcesData || [])
          .map(s => ({
            ...s,
            count: articleCounts[s.id] || 0,
          }))
          .filter(s => s.count > 0)
          .sort((a, b) => b.count - a.count);

        setSources(sourceList);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
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

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-left">
          <img src="/logo.png" alt="BiasScope" className="footer-logo" />
        </div>
        <div className="footer-center">
          <p className="footer-quote">"There are no facts, only interpretations."</p>
        </div>
        <div className="footer-right">
          <a href="https://github.com/shuvam586/bias-scope" target="_blank" rel="noopener noreferrer" className="github-link">
            <Icon name="github" size={20} />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

function App() {
  const location = useLocation();
  useEffect(() => {
    if (location.pathname.startsWith("/event")) {
      document.body.className = "page-event";
    } else if (location.pathname.startsWith("/source")) {
      document.body.className = "page-source";
    } else if (location.pathname.startsWith("/sources")) {
      document.body.className = "page-sources";
    } else {
      document.body.className = "page-home";
    }
  }, [location.pathname]);

  return (
    <>
      <Routes>
        <Route path="/" element={<EventFeed />} />
        <Route path="/theskew" element={<SkewFeed />} />
        <Route path="/sources" element={<SourcesPage />} />
        <Route path="/event/:eventid" element={<EventPage />} />
        <Route path="/source/:sourceid" element={<SourcePage />} />
      </Routes>
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);