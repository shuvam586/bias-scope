import Skeleton from "./Skeleton";

export default function EventSkeleton({ featured }) {
  if (featured) {
    return (
      <div className="featured-event">
        <Skeleton className="skeleton-image" style={{ height: 380 }} />
        <div className="featured-overlay">
          <Skeleton className="skeleton-text medium" style={{ width: "30%" }} />
          <Skeleton className="skeleton-title" />
          <Skeleton className="skeleton-title" style={{ width: "60%" }} />
          <Skeleton className="skeleton-text short" />
        </div>
      </div>
    );
  }
  return (
    <div className="compact-event">
      <Skeleton className="skeleton-image" style={{ height: 160 }} />
      <div className="compact-content">
        <div className="compact-kicker">
          <Skeleton className="skeleton-text" style={{ width: "25%" }} />
        </div>
        <Skeleton className="skeleton-title" />
        <Skeleton className="skeleton-text short" />
      </div>
    </div>
  );
}
