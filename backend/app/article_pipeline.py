import sys
import random
import logging
from datetime import datetime, timezone
from pydantic import BaseModel, HttpUrl
from ml.cluster import cluster_articles
from backend.app.ingestion.rss import fetch_feed
from backend.app.ingestion.sources import SOURCES
from backend.app.db.supabase_client import insert_articles, insert_clusters, clear_db

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("news.pipeline")


class Article(BaseModel):
    id: str | None
    title: str
    url: HttpUrl
    description: str | None = None
    author: str | None = None
    published_at: datetime | None = None
    source: str
    cluster: str | None


class Event(BaseModel):
    id: str | None
    title: str
    summary: str | None = None
    image: str


def get_image_from_link(url: str) -> str:
    try:
        import requests
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10).text, "html.parser")
        return soup.find("meta", property="og:image")["content"]
    except Exception:
        return f"https://picsum.photos/seed/{random.randint(1, 1000)}/400/300"


def main() -> None:
    run_started = datetime.now(timezone.utc)
    logger.info("=" * 60)
    logger.info("PIPELINE START | news ingestion")
    logger.info("=" * 60)

    all_articles = []
    total_feeds = sum(len(s["feeds"]) for s in SOURCES.values())
    logger.info("Fetching articles | sources=%d | feeds=%d", len(SOURCES), total_feeds)

    # Fetch articles from all sources
    for source_key, source in SOURCES.items():
        source_name = source["name"]
        source_started = datetime.now(timezone.utc)
        feed_count = len(source["feeds"])
        articles_for_source = 0

        logger.info("[%s] Fetching from %d feed(s)", source_name, feed_count)

        for feed_url in source["feeds"]:
            try:
                new_articles = fetch_feed(feed_url, source_name, source.get("googlenews", False))
                articles_for_source += len(new_articles)
                all_articles.extend(new_articles)
                logger.info("  [feed] %s | articles=%d", feed_url, len(new_articles))
            except Exception as e:
                logger.error("  [feed] %s | FAILED: %s", feed_url, e)

        elapsed = (datetime.now(timezone.utc) - source_started).total_seconds()
        logger.info("[%s] Completed | articles=%d | duration=%.1fs", source_name, articles_for_source, elapsed)

    logger.info("-" * 60)
    logger.info("FETCH COMPLETE | total_articles=%d", len(all_articles))

    if not all_articles:
        logger.warning("No articles fetched. Exiting.")
        return

    # Deduplicate by title
    seen_titles = set()
    unique_articles = []
    for a in all_articles:
        if a.title not in seen_titles:
            seen_titles.add(a.title)
            unique_articles.append(a)
    deduped_count = len(all_articles) - len(unique_articles)
    if deduped_count:
        logger.info("Deduplicated | removed=%d | remaining=%d", deduped_count, len(unique_articles))

    # Cluster articles
    logger.info("Clustering articles | count=%d", len(unique_articles))
    cluster_started = datetime.now(timezone.utc)
    results = cluster_articles(unique_articles)
    cluster_duration = (datetime.now(timezone.utc) - cluster_started).total_seconds()

    events = results["events"]
    clustered_articles = results["articles"]
    logger.info("Clustering done | events=%d | articles=%d | duration=%.1fs", len(events), len(clustered_articles), cluster_duration)

    # Fetch images for events
    logger.info("Fetching event images | events=%d", len(events))
    images_fetched = 0
    for event in events:
        for article in clustered_articles:
            if article.cluster == event.id:
                try:
                    event.image = get_image_from_link(str(article.url))
                    images_fetched += 1
                    logger.debug("  [image] event=%s | source=%s", event.id[:8], article.source)
                except Exception as e:
                    logger.warning("  [image] event=%s | FAILED: %s", event.id[:8], e)
                break
    logger.info("Images fetched | success=%d | failed=%d", images_fetched, len(events) - images_fetched)

    # Database operations
    logger.info("-" * 60)
    logger.info("DATABASE OPERATIONS")

    logger.info("Clearing database...")
    clear_db()
    logger.info("Database cleared")

    logger.info("Inserting clusters | count=%d", len(events))
    insert_clusters(events)
    logger.info("Clusters inserted")

    logger.info("Inserting articles | count=%d", len(clustered_articles))
    insert_articles(clustered_articles)
    logger.info("Articles inserted")

    # Final summary
    total_duration = (datetime.now(timezone.utc) - run_started).total_seconds()
    logger.info("=" * 60)
    logger.info("PIPELINE COMPLETE")
    logger.info("  Duration: %.1fs", total_duration)
    logger.info("  Sources: %d", len(SOURCES))
    logger.info("  Articles fetched: %d", len(all_articles))
    logger.info("  Articles after dedup: %d", len(unique_articles))
    logger.info("  Events created: %d", len(events))
    logger.info("  Articles clustered: %d", len(clustered_articles))
    # logger.info("  Images fetched: %d", images_fetched)
    logger.info("=" * 60)


if __name__ == "__main__":
    main()