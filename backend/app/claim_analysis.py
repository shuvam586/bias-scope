import logging
import sys
import re
from datetime import datetime, timezone
from pydantic import BaseModel, HttpUrl
from backend.app.db.supabase_client import get_top_k_events, get_articles_of_event, insert_claims, insert_claims_sentences
from ml.cluster import cluster_claims

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("bias-scope.claims")


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


class Claim(BaseModel):
    id: str | None = None
    event: str | None = None
    text: str
    source_count: int
    article_count: int


class ClaimSentence(BaseModel):
    id: str | None = None
    claim: str | None = None
    article: str | None = None
    source: str | None = None
    text: str
    similarity: float


def extract_claim_sentences(article_text: str, article_id: str, source_name: str) -> list[ClaimSentence]:
    """Extract individual claim-like sentences from article text."""
    sentences = re.split(r'(?<=[.!?])\s+', article_text.strip())
    
    claim_sentences = []
    for sent in sentences:
        sent = sent.strip()
        if len(sent) < 20:
            continue
        if len(sent) > 500:
            continue
            
        claim_sentences.append(ClaimSentence(
            id=None,
            claim=None,
            article=article_id,
            source=source_name,
            text=sent,
            similarity=0.0
        ))
    
    return claim_sentences


def main() -> dict:
    run_started = datetime.now(timezone.utc)
    logger.info("=" * 60)
    logger.info("PIPELINE START | Claim extraction & clustering (per-event)")
    logger.info("=" * 60)

    # Fetch top events
    logger.info("Fetching top events | k=20")
    top_events = get_top_k_events(k=20)
    logger.info("Top events fetched | count=%d", len(top_events))

    all_claims = []
    all_claim_sentences = []
    total_articles = 0
    total_events_with_articles = 0

    for event in top_events:
        event_id = event["event_id"]
        articles = get_articles_of_event(event_id=event_id)
        
        if not articles:
            logger.debug("Event %s | no articles", event_id[:8])
            continue

        total_events_with_articles += 1
        event_claim_sentences = []

        for arti in articles:
            article = Article.model_validate(arti)
            total_text = (article.title or "") + ". " + (article.description or "")
            article_id = article.id
            
            if not total_text.strip() or not article_id:
                continue

            total_articles += 1
            source_name = article.source
            claim_sentences = extract_claim_sentences(total_text, article_id, source_name)
            event_claim_sentences.extend(claim_sentences)

        if not event_claim_sentences:
            logger.info("Event %s | no claim sentences extracted", event_id[:8])
            continue

        logger.info("Event %s | articles=%d | sentences_extracted=%d", event_id[:8], len(articles), len(event_claim_sentences))

        # Cluster claim sentences for this event only
        event_cluster_started = datetime.now(timezone.utc)
        event_result = cluster_claims(event_claim_sentences)
        event_cluster_duration = (datetime.now(timezone.utc) - event_cluster_started).total_seconds()

        event_claims = event_result.get("claims", [])
        event_clustered_sentences = event_result.get("claim_sentences", [])

        # Tag claims with event_id
        for claim in event_claims:
            claim.event = event_id

        all_claims.extend(event_claims)
        all_claim_sentences.extend(event_clustered_sentences)

        logger.info("Event %s | claims=%d | duration=%.1fs", event_id[:8], len(event_claims), event_cluster_duration)

    logger.info("-" * 60)
    logger.info("EXTRACTION & CLUSTERING COMPLETE | events_with_articles=%d | articles_processed=%d | total_claims=%d | total_claim_sentences=%d",
                total_events_with_articles, total_articles, len(all_claims), len(all_claim_sentences))

    if not all_claims:
        logger.warning("No claims created. Exiting.")
        return {"claims": [], "claim_sentences": []}

    # Database operations
    logger.info("-" * 60)
    logger.info("DATABASE OPERATIONS")

    logger.info("Inserting claims | count=%d", len(all_claims))
    insert_claims(all_claims)
    logger.info("Claims inserted")

    logger.info("Inserting claim sentences | count=%d", len(all_claim_sentences))
    insert_claims_sentences(all_claim_sentences)
    logger.info("Claim sentences inserted")

    # Final summary
    total_duration = (datetime.now(timezone.utc) - run_started).total_seconds()
    logger.info("=" * 60)
    logger.info("PIPELINE COMPLETE")
    logger.info("  Duration: %.1fs", total_duration)
    logger.info("  Events processed: %d", len(top_events))
    logger.info("  Events with articles: %d", total_events_with_articles)
    logger.info("  Articles processed: %d", total_articles)
    logger.info("  Claims created: %d", len(all_claims))
    logger.info("  Claim sentences clustered: %d", len(all_claim_sentences))
    logger.info("=" * 60)

    return {"claims": all_claims, "claim_sentences": all_claim_sentences}


if __name__ == "__main__":
    result = main()
    logger.info("Summary | claims=%d | claim_sentences=%d",
                len(result.get('claims', [])), len(result.get('claim_sentences', [])))