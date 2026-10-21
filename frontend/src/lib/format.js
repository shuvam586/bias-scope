export function time(date) {
  if (!date) return "Recently";
  const ms = Date.now() - new Date(date);
  const h = Math.max(0, Math.floor(ms / 36e5));
  if (h < 1) {
    const m = Math.max(1, Math.floor(ms / 6e4));
    return `${m}m ago`;
  }
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function latestArticleMs(articles) {
  if (!articles?.length) return null;
  return Math.max(...articles.map((a) => new Date(a.published_at).getTime()));
}

export function earliestArticleMs(articles) {
  if (!articles?.length) return null;
  return Math.min(...articles.map((a) => new Date(a.published_at).getTime()));
}

export function eventTime(event) {
  const t = latestArticleMs(event?.articles);
  return t ? time(new Date(t)) : time(event?.updated_at || event?.created_at);
}

export function eventStartTime(event) {
  const t = earliestArticleMs(event?.articles);
  return t ? time(new Date(t)) : time(event?.updated_at || event?.created_at);
}

export function eventStartMs(event) {
  const t = earliestArticleMs(event?.articles);
  return t ?? new Date(event?.updated_at || event?.created_at || 0).getTime();
}
