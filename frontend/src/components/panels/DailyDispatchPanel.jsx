import { Link } from "react-router-dom";
import Icon from "../ui/Icon";
import { eventStartTime } from "../../lib/format";

export default function DailyDispatchPanel({ dispatchEvents = [] }) {
  if (dispatchEvents.length === 0) {
    return (
      <aside className="daily-dispatch-panel" aria-labelledby="daily-dispatch-title">
        <h3 className="daily-dispatch-title" id="daily-dispatch-title">Daily Dispatch</h3>
        <p className="daily-dispatch-desc">
          The most recent stories with full source details.
        </p>
        <div className="daily-dispatch-empty">
          <div className="daily-dispatch-empty-icon">
            <Icon name="arrow" size={40} />
          </div>
          <h4 className="daily-dispatch-empty-title">No stories yet</h4>
          <p className="daily-dispatch-empty-text">
            Check back soon for the latest updates.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="daily-dispatch-panel" aria-labelledby="daily-dispatch-title">
      <div className="daily-dispatch-header">
        <h3 className="daily-dispatch-title" id="daily-dispatch-title">Daily Dispatch</h3>
      </div>
      <p className="daily-dispatch-desc">
        Latest stories with source counts and political bias breakdown.
      </p>
      <div className="daily-dispatch-grid">
        {dispatchEvents.map((e) => (
          <Link key={e.id} to={`/event/${e.id}`} className="daily-dispatch-event">
            <div className="daily-dispatch-event-content">
              <div className="daily-dispatch-event-meta">
                <time className="daily-dispatch-event-time">
                  {eventStartTime(e)}
                </time>
                <span className="daily-dispatch-event-bias">
                  {e.bias_percentages.left > e.bias_percentages.right && e.bias_percentages.left > e.bias_percentages.center ? (
                    <span className="bias-badge left">Left</span>
                  ) : e.bias_percentages.right > e.bias_percentages.left && e.bias_percentages.right > e.bias_percentages.center ? (
                    <span className="bias-badge right">Right</span>
                  ) : (
                    <span className="bias-badge center">Center</span>
                  )}
                </span>
              </div>
              <h4 className="daily-dispatch-event-title">{e.title}</h4>
              <div className="daily-dispatch-event-stats">
                <span>→ {e.sources_count || 0} sources</span>
                <span>
                  → {(() => {
                    const p = e.bias_percentages || { left: 0, center: 0, right: 0 };
                    if (p.left >= p.center && p.left >= p.right) return `${p.left}% Left`;
                    if (p.right >= p.left && p.right >= p.center) return `${p.right}% Right`;
                    return `${p.center}% Center`;
                  })()}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
