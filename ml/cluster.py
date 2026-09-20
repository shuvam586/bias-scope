import os
import re
import hdbscan
import numpy as np
import pandas as pd

from pathlib import Path
from datetime import datetime
from uuid import uuid4
from dotenv import load_dotenv
from supabase import create_client
from pydantic import BaseModel, HttpUrl
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

load_dotenv()


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

MODEL_NAME = "all-MiniLM-L6-v2"

HDBSCAN_MIN_CLUSTER_SIZE = 2
HDBSCAN_MIN_SAMPLES = 1

SEMANTIC_WEIGHT = 0.90
TIME_WEIGHT = 0.10

TIME_DECAY_DAYS = 30

model = SentenceTransformer(MODEL_NAME)


def clean_text(text):
    text = re.sub(r"<[^>]+>", " ", str(text))
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)
    text = re.sub(r"\s+", " ", text)

    # print("Text Cleaned")
    return text.strip()


def cluster_articles(articles: list[Article]) -> dict:
    if not articles:
        return {
            "articles": [],
            "events": []
        }

    articles = [a.model_dump(mode="json") for a in articles]

    df = pd.DataFrame(articles)

    required_columns = [
        "id",
        "title",
        "published_at",
        "source"
    ]

    for column in required_columns:
        if column not in df.columns:
            raise ValueError(
                f"Article data is missing column: {column}"
            )

    print("Columns perfecto!!")

    df = df.dropna(
        subset=["title", "published_at"]
    )

    df["title"] = (
        df["title"]
        .astype(str)
        .apply(clean_text)
        .str.strip()
    )

    df["published_at"] = pd.to_datetime(
        df["published_at"],
        errors="coerce",
        format="mixed",
        utc=True
    )

    df = df.dropna(
        subset=["published_at"]
    )

    df = df[df["title"].str.strip() != ""]

    df = df.reset_index(drop=True)

    df = df.drop_duplicates(
        subset=["title"]
    )

    df = df.reset_index(drop=True)

    if len(df) == 0:
        return {
            "articles": [],
            "events": []
        }

    article_embeddings = []

    for _, row in df.iterrows():
        embedding = model.encode(
            row["title"],
            show_progress_bar=False
        )

        article_embeddings.append(embedding)

    article_embeddings = np.array(
        article_embeddings
    )

    semantic_similarity = cosine_similarity(
        article_embeddings
    )

    dates = df["published_at"].values
    number_of_articles = len(df)

    temporal_similarity = np.zeros(
        (
            number_of_articles,
            number_of_articles
        )
    )

    for i in range(number_of_articles):
        for j in range(number_of_articles):

            days_difference = abs(
                (dates[i] - dates[j])
                .astype("timedelta64[D]")
                .astype(int)
            )

            temporal_similarity[i][j] = np.exp(
                -days_difference /
                TIME_DECAY_DAYS
            )

    combined_similarity = (
        SEMANTIC_WEIGHT * semantic_similarity
        + TIME_WEIGHT * temporal_similarity
    )

    combined_distance = (
        1 - combined_similarity
    )

    combined_distance = np.clip(
        combined_distance,
        0,
        1
    )

    np.fill_diagonal(
        combined_distance,
        0
    )

    # HDBSCAN requires float64 for precomputed metric
    combined_distance = combined_distance.astype(np.float64)

    hdbscan_model = hdbscan.HDBSCAN(
        min_cluster_size=HDBSCAN_MIN_CLUSTER_SIZE,
        min_samples=HDBSCAN_MIN_SAMPLES,
        metric="precomputed"
    )

    hdbscan_labels = (
        hdbscan_model.fit_predict(
            combined_distance
        )
    )

    next_cluster = (
        hdbscan_labels.max() + 1
    )

    for i in range(len(hdbscan_labels)):
        if hdbscan_labels[i] == -1:
            hdbscan_labels[i] = next_cluster
            next_cluster += 1

    df["raw_cluster"] = hdbscan_labels

    cluster_order = (
        df.groupby("raw_cluster")["published_at"]
        .min()
        .sort_values()
        .index
        .tolist()
    )

    cluster_number_map = {
        old_cluster: new_cluster
        for new_cluster, old_cluster
        in enumerate(
            cluster_order,
            start=1
        )
    }

    df["cluster_number"] = (
        df["raw_cluster"]
        .map(cluster_number_map)
    )

    cluster_names = {}

    for cluster_number in sorted(
        df["cluster_number"].unique()
    ):

        cluster_indices = (
            df.index[
                df["cluster_number"]
                == cluster_number
            ].tolist()
        )

        cluster_embeddings = (
            article_embeddings[
                cluster_indices
            ]
        )

        centroid = np.mean(
            cluster_embeddings,
            axis=0
        )

        centroid_similarity = cosine_similarity(
            cluster_embeddings,
            centroid.reshape(1, -1)
        ).flatten()

        best_position = np.argmax(
            centroid_similarity
        )

        best_index = (
            cluster_indices[best_position]
        )

        cluster_names[
            cluster_number
        ] = df.loc[
            best_index,
            "title"
        ]

    df["cluster_name"] = (
        df["cluster_number"]
        .map(cluster_names)
    )

    event_ids = {
        cluster_number: str(uuid4())
        for cluster_number
        in df["cluster_number"].unique()
    }

    events = []

    for cluster_number in sorted(event_ids):

        event_id = event_ids[
            cluster_number
        ]

        events.append(
            Event(
                id=event_id,
                title=cluster_names[
                    cluster_number
                ],
                summary=None,
                image="https://picsum.photos/400/300"
            )
        )

    processed_articles = []

    for _, row in df.iterrows():

        event_id = event_ids[
            row["cluster_number"]
        ]

        processed_articles.append(
            Article(
                id=row["id"],
                title=row["title"],
                url=row["url"],
                description=None if pd.isna(row["description"]) else row["description"],
                author=None if pd.isna(row["author"]) else row["author"],
                published_at=row["published_at"],
                source=row["source"],
                cluster=event_id
            )
        )

        print(
            "Title:",
            row["title"]
        )

        print(
            "Event ID:",
            event_id
        )

        print(
            "Event:",
            row["cluster_name"]
        )
        
        print()

    return {
        "articles": processed_articles,
        "events": events
    }


# articles = get_articles()
# print("Articles fetched: ", len(articles))

# results = cluster_articles(articles)
# print(results)


CLAIM_HDBSCAN_MIN_CLUSTER_SIZE = 2
CLAIM_HDBSCAN_MIN_SAMPLES = 1


def cluster_claims(claim_sentences: list[ClaimSentence]) -> dict:
    """
    Cluster claim sentences by semantic similarity.
    Returns dict with 'claims' (list of Claim) and 'claim_sentences' (list of ClaimSentence with cluster assignments).
    """
    if not claim_sentences:
        return {"claims": [], "claim_sentences": []}

    # Convert to dict for DataFrame
    sentences_data = [cs.model_dump(mode="json") for cs in claim_sentences]
    df = pd.DataFrame(sentences_data)

    # Clean text
    df["text"] = df["text"].astype(str).apply(clean_text).str.strip()
    df = df[df["text"].str.len() > 0].reset_index(drop=True)

    if len(df) == 0:
        return {"claims": [], "claim_sentences": []}

    # Generate embeddings for all claim sentences
    embeddings = []
    for _, row in df.iterrows():
        emb = model.encode(row["text"], show_progress_bar=False)
        embeddings.append(emb)
    embeddings = np.array(embeddings)

    # Semantic similarity only (no temporal component for claims)
    semantic_similarity = cosine_similarity(embeddings)
    combined_distance = 1 - semantic_similarity
    combined_distance = np.clip(combined_distance, 0, 1)
    np.fill_diagonal(combined_distance, 0)

    # HDBSCAN requires float64 for precomputed metric
    combined_distance = combined_distance.astype(np.float64)

    # HDBSCAN clustering
    hdbscan_model = hdbscan.HDBSCAN(
        min_cluster_size=CLAIM_HDBSCAN_MIN_CLUSTER_SIZE,
        min_samples=CLAIM_HDBSCAN_MIN_SAMPLES,
        metric="precomputed"
    )
    labels = hdbscan_model.fit_predict(combined_distance)

    # Assign noise points (-1) to their own clusters
    next_cluster = labels.max() + 1 if len(labels) > 0 else 0
    for i in range(len(labels)):
        if labels[i] == -1:
            labels[i] = next_cluster
            next_cluster += 1

    df["cluster_id"] = labels

    # Create Claim objects from clusters
    claims = []
    claim_id_map = {}

    for cluster_id in sorted(df["cluster_id"].unique()):
        cluster_mask = df["cluster_id"] == cluster_id
        cluster_indices = df.index[cluster_mask].tolist()
        cluster_embeddings = embeddings[cluster_indices]

        # Centroid
        centroid = np.mean(cluster_embeddings, axis=0)
        centroid_similarities = cosine_similarity(cluster_embeddings, centroid.reshape(1, -1)).flatten()

        # Representative sentence (closest to centroid)
        best_pos = np.argmax(centroid_similarities)
        best_idx = cluster_indices[best_pos]
        representative_text = df.loc[best_idx, "text"]

        # Collect unique sources and articles
        cluster_df = df[cluster_mask]
        unique_sources = set()
        unique_articles = set()
        
        # Need to get source info from original claim_sentences
        for idx in cluster_indices:
            orig_cs = claim_sentences[idx]
            if orig_cs.article:
                unique_articles.add(orig_cs.article)
                unique_sources.add(orig_cs.source)

        claim_id = str(uuid4())
        claim_id_map[cluster_id] = claim_id

        claims.append(Claim(
            id=claim_id,
            event=None,  # Could be linked later if needed
            text=representative_text,
            source_count=len(unique_sources),
            article_count=len(unique_articles)
        ))

    # Update claim_sentences with cluster assignments and similarities
    updated_claim_sentences = []
    for idx, row in df.iterrows():
        cluster_id = row["cluster_id"]
        claim_id = claim_id_map[cluster_id]
        
        # Calculate similarity to cluster centroid
        cluster_mask = df["cluster_id"] == cluster_id
        cluster_indices = df.index[cluster_mask].tolist()
        cluster_embeddings = embeddings[cluster_indices]
        centroid = np.mean(cluster_embeddings, axis=0)
        sim = cosine_similarity(embeddings[idx].reshape(1, -1), centroid.reshape(1, -1))[0, 0]

        orig_cs = claim_sentences[idx]
        updated_claim_sentences.append(ClaimSentence(
            id=orig_cs.id,
            claim=claim_id,
            article=orig_cs.article,
            text=orig_cs.text,
            similarity=float(sim)
        ))

    return {
        "claims": claims,
        "claim_sentences": updated_claim_sentences
    }