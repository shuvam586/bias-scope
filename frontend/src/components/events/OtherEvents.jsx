import CompactEvent from "./CompactEvent";

export default function OtherEvents({ events, limit }) {
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
