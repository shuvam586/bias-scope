import { useMemo } from "react";
import Header from "../components/layout/Header";
import Icon from "../components/ui/Icon";
import Skeleton from "../components/ui/Skeleton";
import EventSkeleton from "../components/ui/EventSkeleton";
import SkewEventCard from "../components/events/SkewEventCard";
import useEvents from "../hooks/useEvents";
import { isMissingSide } from "../lib/bias";

export default function SkewPage() {
  const { events, sourceBiases, loading, error } = useEvents();

  const missingRight = useMemo(
    () =>
      events
        .filter((e) => isMissingSide(e, sourceBiases, "right"))
        .sort((a, b) => (b.sources_count || 0) - (a.sources_count || 0))
        .slice(0, 4),
    [events, sourceBiases]
  );

  const missingLeft = useMemo(
    () =>
      events
        .filter((e) => isMissingSide(e, sourceBiases, "left"))
        .sort((a, b) => (b.sources_count || 0) - (a.sources_count || 0))
        .slice(0, 4),
    [events, sourceBiases]
  );

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
