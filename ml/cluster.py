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