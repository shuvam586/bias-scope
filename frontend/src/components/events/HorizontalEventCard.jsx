import { Link } from "react-router-dom";
import { eventTime } from "../../lib/format";
import { dominantPercent } from "../../lib/bias";

export default function HorizontalEventCard({ event }) {
  const percentages = event.bias_percentages || { left: 0, center: 0, right: 0 };
  const dominant = event.bias_dominant || "Mixed";
  const dominantPct = dominantPercent(percentages, dominant);

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
            {eventTime(event)}
          </time>
        </div>
      </div>
      {event.image && (
        <img src={event.image} alt="" className="horizontal-event-image" loading="lazy" />
      )}
    </Link>
  );
}
