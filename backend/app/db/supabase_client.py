import os
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client
from pydantic import BaseModel, HttpUrl


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

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def insert_articles(articles: list[Article]):

    queue = []

    print(f"inserting {len(articles)} articles")

    for index, arti in enumerate(articles):
        queue.append(arti.model_dump(mode="json", exclude_none=True))

        if ((index+1)%10==0):
            response = supabase.table("articles").insert(queue).execute()
            queue = []

    if (len(queue)!=0):
        response = supabase.table("articles").insert(queue).execute()


def insert_clusters(events: list[Event]):

    allEvents = []

    for index, eve in enumerate(events):
        allEvents.append(eve.model_dump(mode="json", exclude_none=True))

    response = supabase.table("events").insert(allEvents).execute()

def insert_claims(claims: list[Claim]):

    allClaims = []

    for index, eve in enumerate(claims):
        allClaims.append(eve.model_dump(mode="json", exclude_none=True))

    response = supabase.table("claims").insert(allClaims).execute()

def insert_claims_sentences(claims: list[ClaimSentence]):

    allClaimsSentences = []

    for index, eve in enumerate(claims):
        allClaimsSentences.append(eve.model_dump(mode="json", exclude_none=True))

    response = supabase.table("claims_sentences").insert(allClaimsSentences).execute()

def get_top_k_events(k = 20):

    result = (
    supabase
    .rpc("get_top_events", {"limit_count": k})
    .execute()
    )

    return result.data

def get_articles_of_event(event_id) -> list[Article]:
    response = supabase.table("articles").select("*").eq("cluster", event_id).execute()

    try:
        return response.data
    except:
        return []

def clear_db():
    supabase.table("claims_sentences").delete().gte("id", "00000000-0000-0000-0000-000000000000").execute()
    supabase.table("claims").delete().gte("id", "00000000-0000-0000-0000-000000000000").execute()
    supabase.table("articles").delete().gte("id", "00000000-0000-0000-0000-000000000000").execute()
    supabase.table("events").delete().gte("id", "00000000-0000-0000-0000-000000000000").execute()