import { Link } from "react-router-dom";
import { eventTime } from "../../lib/format";
import { dominantPercent } from "../../lib/bias";
import EventSkeleton from "../ui/EventSkeleton";

export default function CompactEvent({ event }) {
  if (!event) return <EventSkeleton />;
  const hasImage = event.image && event.image !== "https://picsum.photos/400/300";
  const percentages = event.bias_percentages || { left: 0, center: 0, right: 0 };
  const dominant = event.bias_dominant || "Mixed";
  const dominantPct = dominantPercent(percentages, dominant);
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
            <time className="compact-time">{eventTime(event)}</time>
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
