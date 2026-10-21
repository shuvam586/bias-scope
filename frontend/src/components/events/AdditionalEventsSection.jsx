import HorizontalEventCard from "./HorizontalEventCard";
import FeaturedArticleCard from "./FeaturedArticleCard";

export default function AdditionalEventsSection({ events }) {
  const leftEvents = events.slice(3, events.length);
  const rightEvents = events.slice(0, 3);

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
