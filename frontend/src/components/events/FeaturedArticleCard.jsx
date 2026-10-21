import { Link } from "react-router-dom";
import { eventTime } from "../../lib/format";
import { dominantPercent } from "../../lib/bias";

export default function FeaturedArticleCard({ event }) {
  const percentages = event.bias_percentages || { left: 0, center: 0, right: 0 };
  const dominant = event.bias_dominant || "Mixed";
  const dominantPct = dominantPercent(percentages, dominant);

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
            {eventTime(event)}
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
