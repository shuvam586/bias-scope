import requests
from bs4 import BeautifulSoup
from datetime import datetime
from pydantic import BaseModel, HttpUrl
from ml.cluster import cluster_articles
from backend.app.ingestion.rss import fetch_feed
from backend.app.ingestion.sources import SOURCES
from backend.app.db.supabase_client import insert_articles, insert_clusters, clear_db

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

def get_image_from_link(url): 
    try:
        soup = BeautifulSoup( requests.get(url, headers={"User-Agent": "Mozilla/5.0"}).text, "html.parser")
        return soup.find("meta", property="og:image")["content"]
    except:
        return "https://picsum.photos/400/300"

allArticles = []

print("Fetching News Articles:\n")

for source in SOURCES.values():
    print(source["name"])

    for f in source["feeds"]:
        newArticles = fetch_feed(f, source["name"])
        print(len(newArticles), f)
        allArticles.extend(newArticles)

    print()
    
results = cluster_articles(allArticles)

events = results["events"]
articles = results["articles"]

for event in events:
    for article in articles:
        if article.cluster==event.id:
            event.image = get_image_from_link(article.url)
            print(f"fetched image for event {event.id}")
            break

clear_db()

insert_clusters(events)
insert_articles(articles)