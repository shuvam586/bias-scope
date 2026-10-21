import { Link } from "react-router-dom";
import Icon from "../ui/Icon";
import { eventTime } from "../../lib/format";

export default function TheSkewPanel({ skewEvents = [] }) {
  if (skewEvents.length === 0) {
    return (
      <aside className="theskew-panel" aria-labelledby="theskew-title">
        <h3 className="theskew-title" id="theskew-title">The Skew</h3>
        <p className="theskew-desc">
          This section highlights stories with uneven coverage across political perspectives. 
          It will show events where Left, Center, or Right-leaning sources significantly 
          over- or under-report compared to the overall media landscape.
        </p>
        <div className="theskew-empty">
          <div className="theskew-empty-icon">
            <Icon name="arrow" size={40} />
          </div>
          <h4 className="theskew-empty-title">Coming Soon</h4>
          <p className="theskew-empty-text">
            Coverage analysis requires bias classification data that is not yet available.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="theskew-panel" aria-labelledby="theskew-title">
      <div className="theskew-header">
        <h3 className="theskew-title" id="theskew-title">The Skew</h3>
      </div>
      <p className="theskew-desc">
        These stories have coverage from only one political perspective.
      </p>
      <div className="theskew-grid">
        {skewEvents.map((e) => (
          <Link key={e.id} to={`/event/${e.id}`} className="theskew-event">
            {e.image ? (
              <img src={e.image} alt="" className="theskew-event-image" loading="lazy" />
            ) : (
              <div className="theskew-event-placeholder">
                <Icon name="arrow" size={32} />
              </div>
            )}
            <div className="theskew-event-content">
              <div className="theskew-event-meta">
                <time className="theskew-event-time">
                  {eventTime(e)}
                </time>
                <span className="theskew-event-bias">
                  {e.bias_percentages.left === 0 ? (
                    <span className="bias-badge right">Missing Left</span>
                  ) : (
                    <span className="bias-badge left">Missing Right</span>
                  )}
                </span>
              </div>
              <h4 className="theskew-event-title">{e.title}</h4>
              <div className="theskew-event-stats">
                <span>→ {e.sources_count || 0} sources</span>
                <span>→ {e.bias_percentages.left === 0 ? e.bias_percentages.right : e.bias_percentages.left}% {e.bias_percentages.left === 0 ? 'Right' : 'Left'}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
