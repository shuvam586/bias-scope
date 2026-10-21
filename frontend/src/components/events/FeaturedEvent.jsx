import { Link } from "react-router-dom";
import { eventTime } from "../../lib/format";
import { dominantPercent } from "../../lib/bias";
import EventSkeleton from "../ui/EventSkeleton";

export default function FeaturedEvent({ event }) {
  if (!event) return <EventSkeleton featured />;
  const percentages = event.bias_percentages || { left: 0, center: 0, right: 0 };
  const dominant = event.bias_dominant || "Mixed";
  const dominantPct = dominantPercent(percentages, dominant);
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
          <time className="featured-time">{eventTime(event)}</time>
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
