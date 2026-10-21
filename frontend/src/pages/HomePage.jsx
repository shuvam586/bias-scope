import { useMemo, useState } from "react";
import Header from "../components/layout/Header";
import Icon from "../components/ui/Icon";
import EventSkeleton from "../components/ui/EventSkeleton";
import FeaturedEvent from "../components/events/FeaturedEvent";
import OtherEvents from "../components/events/OtherEvents";
import AdditionalEventsSection from "../components/events/AdditionalEventsSection";
import PromoCard from "../components/panels/PromoCard";
import TheSkewPanel from "../components/panels/TheSkewPanel";
import DailyDispatchPanel from "../components/panels/DailyDispatchPanel";
import useEvents from "../hooks/useEvents";
import { eventStartMs } from "../lib/format";

export default function HomePage() {
  const { events, loading, error } = useEvents();
  const [query] = useState("");

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
  const otherEvents = sorted.slice(1);

  const skewCandidates = sorted.filter((e) => {
    const percentages = e.bias_percentages || { left: 0, center: 0, right: 0 };
    return percentages.left === 0 || percentages.right === 0;
  });
  const skewEvents = skewCandidates.slice(0, 2);

  const skewIds = new Set(skewEvents.map((e) => e.id));
  const mainEvents = otherEvents.filter((e) => !skewIds.has(e.id));

  const dispatchEvents = [...mainEvents]
    .sort((a, b) => eventStartMs(b) - eventStartMs(a))
    .slice(0, 5);

  const dispatchIds = new Set(dispatchEvents.map((e) => e.id));
  const finalMainEvents = mainEvents.filter((e) => !dispatchIds.has(e.id));

  if (loading) {
    return (
      <div className="app-shell">
        <Header />
        <main className="main-grid" role="main">
          <aside className="column left-col">
            <DailyDispatchPanel dispatchEvents={[]} />
          </aside>
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
        <aside className="column left-col">
          <DailyDispatchPanel dispatchEvents={dispatchEvents} />
        </aside>
        <section className="column center-col">
          <FeaturedEvent event={featuredEvent} />
          <OtherEvents events={finalMainEvents} limit={13} />
        </section>
        <aside className="column right-col">
          <PromoCard />
          <TheSkewPanel skewEvents={skewEvents} />
        </aside>
      </main>
      <AdditionalEventsSection events={finalMainEvents.slice(13)} />
    </div>
  );
}
