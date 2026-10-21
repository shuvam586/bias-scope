import { Link } from "react-router-dom";
import { eventTime } from "../../lib/format";
import { dominantPercent } from "../../lib/bias";

export default function SkewEventCard({ event, missingSide }) {
  const percentages = event.bias_percentages || { left: 0, center: 0, right: 0 };
  let dominant = (percentages[missingSide] != 0 ? missingSide : "Center") || "Mixed";
  if (dominant == "left") {
    dominant = "Left";
  } else if (dominant == "right") {
    dominant = "Right";
  }
  const dominantPct = dominantPercent(percentages, dominant);

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
            {eventTime(event)}
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
