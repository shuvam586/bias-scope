import logging
import sys
import json
import time
import openai
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from backend.app.db.supabase_client import get_all_events, get_articles_with_source_bias, upsert_event_summary
from backend.app.ingestion.sources import SOURCES

load_dotenv()

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("bias-scope.summary")

# LLM Configuration
GROQ_MODEL = "openai/gpt-oss-20b"
openai_client = openai.OpenAI(
    api_key=os.getenv("NVIDIA_API_KEY"),
    base_url="https://integrate.api.nvidia.com/v1",
)

# Bias thresholds
LEFT_MAX = -3.5
CENTER_MIN = -3.5
CENTER_MAX = 3.5
RIGHT_MIN = 3.5

# Build source -> bias mapping from SOURCES dict
SOURCE_BIAS_MAP = {s["name"]: s["bias"] for s in SOURCES.values()}


def format_articles_for_prompt(articles: list[dict]) -> str:
    """Format articles into a string for the LLM prompt."""
    if not articles:
        return "No articles available."
    
    parts = []
    for i, article in enumerate(articles, 1):
        title = article.get("title", "")
        description = article.get("description", "")
        source = article.get("source", "")
        bias = article.get("sources", {}).get("bias") if isinstance(article.get("sources"), dict) else None
        
        # Try to get bias from SOURCE_BIAS_MAP if not in joined data
        if bias is None:
            bias = SOURCE_BIAS_MAP.get(source)
        
        text = f"{i}. [{source}] {title}"
        if description:
            text += f" — {description}"
        if bias is not None:
            text += f" (bias: {bias})"
        parts.append(text)
    
    return "\n".join(parts)


def get_bias_division(bias: float | None) -> str | None:
    """Classify bias into left, center, or right. Returns None if unknown."""
    if bias is None:
        return None
    if bias <= LEFT_MAX and bias>=-10:
        return "left"
    elif bias <= CENTER_MAX:
        return "center"
    elif bias >= RIGHT_MIN:
        return "right"
    return None


def generate_event_summary(event_id: str, event_title: str, articles: list[dict]) -> dict:
    """Generate summaries for all three divisions for a single event in one LLM call."""
    # Group articles by bias division
    divisions = {"left": [], "center": [], "right": []}
    
    for article in articles:
        source = article.get("source", "")
        # Get bias from joined sources table or fallback to SOURCE_BIAS_MAP
        bias = None
        if isinstance(article.get("sources"), dict):
            bias = article["sources"].get("bias")
        if bias is None:
            bias = SOURCE_BIAS_MAP.get(source)
        
        division = get_bias_division(bias)
        if division:
            divisions[division].append(article)
        else:
            logger.debug("Article %s has unknown bias (source: %s, bias: %s)", 
                        article.get("id", "unknown"), source, bias)
    
    # Log division counts
    logger.info("Event %s | left=%d center=%d right=%d articles", 
                event_id[:8], len(divisions["left"]), len(divisions["center"]), len(divisions["right"]))
    
    # If no articles in any division, return empty
    if not any(divisions.values()):
        return {"left": None, "center": None, "right": None}
    
    # Format all divisions for single prompt
    articles_by_division = {}
    for div in ["left", "center", "right"]:
        articles_by_division[div] = format_articles_for_prompt(divisions[div])
    
    # Single LLM call for all three divisions
    prompt = f"""You are a news summarization system for Biasscope. Your task is to summarize coverage of a single news event separately for left-leaning, center-leaning, and right-leaning news outlets.

You will receive articles grouped into three divisions: `left`, `center`, and `right`.

For each division, generate 4–6 concise, informative bullet points that summarize the most important information reported by the articles in that division. Generate fewer bullets if the available information does not support 4–6 distinct points.

### Instructions

1. Summarize each division independently. Use only articles assigned to that division. Never mix information from one division into another division's summary.
2. Synthesize information across articles within the same division. Do not summarize each article separately.
3. Prioritize major developments, key facts, relevant background, important dates, figures, people, organizations, and consequences.
4. Each bullet must convey one distinct, meaningful factual point. Avoid repetition and overlapping bullets.
5. Use concise, neutral, clear journalistic language. Each bullet should generally be one or two sentences.
6. Include specific details and numbers when supported by the articles.
7. Do not introduce facts, assumptions, explanations, or outside knowledge that are not supported by the supplied articles.
8. Preserve attribution for allegations, disputed claims, and statements made by specific people or organizations. Do not present allegations as established facts.
9. If articles within a division conflict, represent the disagreement accurately rather than silently choosing one version.
10. Do not infer political bias, criticize outlets, or compare divisions. The task is to summarize what each division reports, not to explain why its coverage differs.
11. Avoid filler, generic introductions, editorial commentary, and conclusions that merely repeat the bullets.
12. If a division has less than 3 articles, return an empty array.

### Output format

Return valid JSON only, with no Markdown fences or additional prose. Follow this exact structure:

{{
  "left": {{
    "bullets": [
      "First factual point.",
      "Second factual point."
    ]
  }},
  "center": {{
    "bullets": [
      "First factual point.",
      "Second factual point."
    ]
  }},
  "right": {{
    "bullets": [
      "First factual point.",
      "Second factual point."
    ]
  }}
}}

Each `bullets` field must be an array of strings. Do not include headlines, article IDs, source lists, or any additional fields.

### Articles by Division

**LEFT DIVISION:**
{articles_by_division["left"]}

**CENTER DIVISION:**
{articles_by_division["center"]}

**RIGHT DIVISION:**
{articles_by_division["right"]}"""

    messages = [
        {
            "role": "system",
            "content": prompt
        },
        {
            "role": "user",
            "content": "Generate summaries for all three divisions. Return JSON with left, center, and right keys."
        }
    ]

    try:
        response = openai_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_completion_tokens=1024,
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        time.sleep(3)  # Rate limit
        
        logger.info("Total tokens (event %s): %d", event_id[:8], response.usage.total_tokens)
        
        result = json.loads(response.choices[0].message.content.strip())
        
        summaries = {}
        for division in ["left", "center", "right"]:
            bullets = result.get(division, {}).get("bullets", [])
            summaries[division] = "\n".join(f"• {b}" for b in bullets) if bullets else None
        
        return summaries
        
    except Exception as e:
        logger.error("LLM call failed for event %s: %s", event_id[:8], e)
        return {"left": None, "center": None, "right": None}


def main() -> dict:
    run_started = datetime.now(timezone.utc)
    logger.info("=" * 60)
    logger.info("PIPELINE START | Event summary generation (per-event)")
    logger.info("=" * 60)

    # Fetch all events
    logger.info("Fetching all events")
    events = get_all_events()
    logger.info("Events fetched | count=%d", len(events))

    total_events_processed = 0
    total_events_with_articles = 0
    total_summaries_created = 0

    for event in events:
        event_id = event["id"]
        event_title = event.get("title", "Untitled Event")
        
        # Get articles with source bias
        articles = get_articles_with_source_bias(event_id)
        
        if not articles:
            logger.debug("Event %s | no articles", event_id[:8])
            continue

        total_events_with_articles += 1
        
        # Generate summaries for this event
        logger.info("Processing event %s | title: %s | articles=%d", 
                    event_id[:8], event_title[:60], len(articles))
        
        summaries = generate_event_summary(event_id, event_title, articles)
        
        # Save to database
        left_summary = summaries.get("left")
        center_summary = summaries.get("center")
        right_summary = summaries.get("right")
        
        upsert_event_summary(event_id, left_summary, center_summary, right_summary)
        
        if any([left_summary, center_summary, right_summary]):
            total_summaries_created += 1
            logger.info("Event %s | summaries saved (left=%s, center=%s, right=%s)",
                        event_id[:8], 
                        "yes" if left_summary else "no",
                        "yes" if center_summary else "no",
                        "yes" if right_summary else "no")
        
        total_events_processed += 1

    # Final summary
    total_duration = (datetime.now(timezone.utc) - run_started).total_seconds()
    logger.info("=" * 60)
    logger.info("PIPELINE COMPLETE")
    logger.info("  Duration: %.1fs", total_duration)
    logger.info("  Events processed: %d", total_events_processed)
    logger.info("  Events with articles: %d", total_events_with_articles)
    logger.info("  Events with summaries: %d", total_summaries_created)
    logger.info("=" * 60)

    return {
        "events_processed": total_events_processed,
        "events_with_articles": total_events_with_articles,
        "summaries_created": total_summaries_created
    }


if __name__ == "__main__":
    result = main()
    logger.info("Summary | events_processed=%d | events_with_articles=%d | summaries_created=%d",
                result.get('events_processed', 0), 
                result.get('events_with_articles', 0),
                result.get('summaries_created', 0))