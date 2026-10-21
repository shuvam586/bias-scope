import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

export default function Header() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const dateStr = now.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="top-nav">
      <div className="nav-inner">
        <Link className="nav-brand" to="/">
          bias<span>scope</span>
          <b>•</b>
        </Link>
        <nav className="nav-tabs" role="tablist">
          <NavLink
            className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
            to="/"
            role="tab"
            aria-selected={true}
          >
            Home
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
            to="/sources"
            role="tab"
          >
            Sources
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
            to="/theskew"
            role="tab"
          >
            The Skew
          </NavLink>
        </nav>
        <div className="nav-datetime" aria-live="polite">
          <span>{dateStr}</span>
          <span>{timeStr}</span>
        </div>
      </div>
    </header>
  );
}
