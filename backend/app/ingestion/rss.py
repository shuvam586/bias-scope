import requests
import trafilatura
import feedparser as fp
from datetime import datetime 
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

def extract_article_text(article_url: str) -> str | None:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/140.0 Safari/537.36"
        )
    }

    try:
        response = requests.get(
            article_url,
            headers=headers,
            timeout=15,
        )

        response.raise_for_status()

        text = trafilatura.extract(
            response.text,
            url=article_url,
            favor_recall=True,
        )

        return text

    except requests.RequestException as e:
        print(f"Failed to fetch {article_url}: {e}")
        return None

    except Exception as e:
        print(f"Failed to extract {article_url}: {e}")
        return None

def fetch_feed(outlet: str, source_name: str = "unknown", google_news = False) -> list[Article]:
    feed = fp.parse(outlet)

    # print(outlet, "\n")

    articles_list = []

    for entry in feed.entries:

        og_desc = entry.get("summary")
        full_desc = extract_article_text(entry.get("link"))

        if full_desc is not None:
            better_desc = full_desc
        else:
            if ">" in og_desc:
                rightmostgreaterthansymbollmao = len(og_desc)-1-og_desc[:-1].find(">")
                better_desc = og_desc[rightmostgreaterthansymbollmao+1:]
            else:
                better_desc = og_desc

        try:
            better_date = datetime.strptime(entry.get("published"),"%a, %d %b %Y %H:%M:%S %z")
        except:
            try:
                better_date = datetime.fromisoformat(entry.get("published"),"%a, %d %b %Y %H:%M:%S %z")
            except:
                try:
                    better_date = datetime.strptime(entry.get("published"),"%a, %d %b %Y %H:%M:%S GMT")
                except:
                    better_date = datetime.now()

        better_title = entry.get("title")
        
        if (google_news):
            better_title = better_title[::-1].split("- ")[1][::-1]
            better_desc = better_title

        article = Article(
            id=None,
            title=better_title,
            url=entry.get("link"),
            description=better_desc,
            author=entry.get("author"),
            published_at=better_date,
            source=source_name,
            cluster=None
        )

        articles_list.append(article)

        # print(dir(entry.author))

    # print(*articles_list, sep="\n\n")

    return articles_list

# print(fetch_feed(
#     outlet="https://news.google.com/rss/search?q=site%3Atelegraphindia.com&hl=en-IN&gl=IN&ceid=IN:en"
# )[0].published_at)

# print()

# print(fetch_feed(
#     outlet="https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml"
# )[0])