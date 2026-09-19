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
const colors = ["#e07a5f", "#2d6a8f", "#d9b44a", "#815ac0"];
function Icon({ name, size = 18 }) {
  const p = {
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
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {p[name]}
    </svg>
  );
}
function time(date) {
  if (!date) return "Recently";
  const ms = Date.now() - new Date(date);
  const h = Math.max(0, Math.floor(ms / 36e5));
  if (h < 1) {
    const m = Math.max(1, Math.floor(ms / 6e4));
    return `${m} minute${m > 1 ? "s" : ""} ago`;
  }
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}
function Header() {
  return (
    <header>
      <div className="topbar">
        <Link className="brand" to="/">
          bias<span>scope</span>
          <b>•</b>
        </Link>
        <nav>
          <NavLink end to="/">
            Top Stories
          </NavLink>
          <NavLink to="/rising">Rising Stories</NavLink>
        </nav>
        <div className="actions">
          <a
            className="profile"
            href="https://github.com/shuvam586/bias-scope"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
          >
            <Icon name="github" size={25} />
          </a>
        </div>
      </div>
    </header>
  );
}
function Mosaic({ large, image, title }) {
  return (
    <div className={`mosaic ${large ? "large" : ""}`}>
      {image ? (
        <img src={image} alt={title ? `Illustration for ${title}` : "Event illustration"} />
      ) : (
        colors.map((color, i) => <div key={i} style={{ background: color }} />)
      )}
    </div>
  );
}
function EventCard({ event, featured, wide }) {
  const count = event.articles?.[0]?.count || 0;
  return (
    <Link
      className={`event-card ${featured ? "featured" : ""} ${wide ? "wide" : ""}`}
      to={`/event/${event.id}`}
    >
      <Mosaic large={featured || wide} image={event.image} title={event.title} />
      <div className="card-content">
        <h2>{event.title || "Untitled event"}</h2>
        {(featured || wide) && (
          <p>
            {event.summary ||
              "Follow this developing story and read coverage from all linked sources."}
          </p>
        )}
        <div className="card-footer">
          <div className="article-count">
            <strong>{count}</strong> articles
          </div>
        </div>
      </div>
      
    </Link>
  );
}
function EventFeed({ rising = false }) {
  const [events, setEvents] = useState([]),
    [query, setQuery] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id,title,summary,image,created_at,articles(count)")
        .order("created_at", { ascending: false });
      if (error) setError(error.message);
      else
        setEvents(
          (data || []).sort(
            (a, b) =>
              (b.articles?.[0]?.count || 0) - (a.articles?.[0]?.count || 0),
          ),
        );
      setLoading(false);
    })();
  }, []);
  const subset = rising ? events.slice(20) : events.slice(0, 20);
  const filtered = useMemo(
    () =>
      subset.filter((e) =>
        (e.title || "").toLowerCase().includes(query.toLowerCase()),
      ),
    [subset, query],
  );
  return (
    <>
    <Header />
      <main>
        <section className="intro">
          <div>
            <div className="kicker">
              <span /> LIVE NEWS INTELLIGENCE
            </div>
            <h1>
              {rising ? (
                <>
                  Stories <em>on the rise.</em>
                </>
              ) : (
                <>
                  See the story
                  <br />
                  <em>behind the story.</em>
                </>
              )}
            </h1>
            <p>
              {rising
                ? "Events gaining attention across the news, organized by their connected coverage."
                : "Major events, organized from every angle. Follow what matters and understand how it’s being covered."}
            </p>
          </div>
          <div className="date-block">
            <span>
              {new Date()
                .toLocaleDateString(undefined, { weekday: "long" })
                .toUpperCase()}
            </span>
            <strong>{new Date().getDate()}</strong>
            <small>
              {new Date()
                .toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })
                .toUpperCase()}
            </small>
          </div>
        </section>
        <section className="toolbar">
          <div className="section-title">
            {rising ? "Rising stories" : "Today’s events"}{" "}
            <small>{filtered.length} stories</small>
          </div>
          <div className="filters">
            <label className="search-box">
              <Icon name="search" size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events"
              />
            </label>
          </div>
        </section>
        {loading ? (
          <div className="empty">Loading events…</div>
        ) : error ? (
          <div className="empty">Couldn’t load events: {error}</div>
        ) : filtered.length ? (
          <section className="event-grid">
            {filtered.map((e, i) => (
              <EventCard
                event={e}
                featured={!rising && i === 0}
                wide={i > 3 && [5, 11, 17].includes(i)}
                key={e.id}
              />
            ))}
          </section>
        ) : (
          <div className="empty">No events match your search.</div>
        )}
      </main>
    </>
  );
}
function EventPage() {
  const { eventid } = useParams();
  const [event, setEvent] = useState(),
    [articles, setArticles] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    (async () => {
      const [er, ar] = await Promise.all([
        supabase
          .from("events")
          .select("id,title,summary,created_at")
          .eq("id", eventid)
          .single(),
        supabase
          .from("articles")
          .select("id,title,description,author,published_at,source,url")
          .eq("cluster", eventid)
          .order("published_at", { ascending: false }),
      ]);
      if (er.error) setError(er.error.message);
      else {
        setEvent(er.data);
        setArticles(ar.data || []);
        if (ar.error) setError(ar.error.message);
      }
      setLoading(false);
    })();
  }, [eventid]);

  const publishedTime = articles.length ? time(articles[articles.length - 1].published_at) : null;
  const updatedTime = articles.length ? time(articles[0].published_at) : null;

  return (
    <>
    <Header />
      <main className="event-page">
        {loading ? (
          <div className="empty">Loading event coverage…</div>
        ) : error ? (
          <div className="empty">Couldn’t load this event: {error}</div>
        ) : (
          <>
            <Link className="back-link" to="/">
              <Icon name="back" size={16} /> All events
            </Link>
            <section className="event-hero">
              <div className="eyebrow">
                {publishedTime && <span>Published {publishedTime}</span>}
                {publishedTime && updatedTime && <span> · </span>}
                {updatedTime && <span>Updated {updatedTime}</span>}
              </div>
              <h1>{event.title || "Untitled event"}</h1>
              {event.summary && <p>{event.summary}</p>}
              <div className="event-total">
                <strong>{articles.length}</strong>
                <span>
                  linked articles
                  <br />
                  in this event
                </span>
              </div>
            </section>
            <section className="coverage-header">
              <h2>Coverage</h2>
              <span>{articles.length} articles, newest first</span>
            </section>
            <section className="article-list">
              {articles.length ? (
                articles.map((a) => (
                  <a
                    className="article-row"
                    key={a.id}
                    href={a.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="article-mark">
                      {(a.source || "N")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="article-meta">
                        {a.source || "Unknown source"}
                        <i /> {time(a.published_at)}
                      </div>
                      <h3>{a.title}</h3>
                    </div>
                    <Icon name="arrow" />
                  </a>
                ))
              ) : (
                <div className="empty">
                  No articles have been linked to this event yet.
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
function App() {
  const location = useLocation();
  useEffect(() => {
    document.body.className = location.pathname.startsWith("/event") ? "page-event" : "page-home";
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<EventFeed />} />
      <Route path="/rising" element={<EventFeed rising />} />
      <Route path="/event/:eventid" element={<EventPage />} />
    </Routes>
  );
}
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
