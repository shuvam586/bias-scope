import { supabase } from "./supabase";
import { computeBiasCounts, dominantSide, toPercentages } from "../lib/bias";
import { earliestArticleMs, time } from "../lib/format";

export async function fetchEventsWithBias({ limit = 50 } = {}) {
  const { data: eventsData, error: eventsErr } = await supabase
    .from("events")
    .select("id, title, summary, image, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (eventsErr) throw eventsErr;

  const eventIds = (eventsData || []).map((e) => e.id);
  const articlesByEvent = {};
  const sourcesByEvent = {};

  if (eventIds.length > 0) {
    const { data: articlesData, error: articlesErr } = await supabase
      .from("articles")
      .select("id, title, source, published_at, cluster")
      .in("cluster", eventIds);

    if (articlesErr) throw articlesErr;

    for (const article of articlesData || []) {
      const clusterId = article.cluster;
      (articlesByEvent[clusterId] ||= []).push(article);
      (sourcesByEvent[clusterId] ||= new Set()).add(article.source);
    }
  }

  const allSources = new Set();
  (eventsData || []).forEach((e) => {
    (sourcesByEvent[e.id] || new Set()).forEach((s) => allSources.add(s));
  });

  let sourceBiases = {};
  if (allSources.size > 0) {
    const { data: sourcesData, error: sourcesErr } = await supabase
      .from("sources")
      .select("id,bias")
      .in("id", Array.from(allSources));

    if (!sourcesErr && sourcesData) {
      sourceBiases = Object.fromEntries(sourcesData.map((s) => [s.id, s.bias]));
    }
  }

  const events = (eventsData || []).map((e) => {
    const articles = articlesByEvent[e.id] || [];
    const sources = sourcesByEvent[e.id] || new Set();
    const percentages = toPercentages(computeBiasCounts(articles, sourceBiases));

    return {
      ...e,
      articles,
      articles_count: articles.length,
      sources: Array.from(sources),
      sources_count: sources.size,
      bias_percentages: percentages,
      bias_dominant: dominantSide(percentages),
      publishedTime: articles.length
        ? time(new Date(earliestArticleMs(articles)))
        : time(e.updated_at || e.created_at),
    };
  });

  return { events, sourceBiases };
}

export async function fetchEventDetail(id) {
  const [er, ar, cr, sr] = await Promise.all([
    supabase
      .from("events")
      .select("id,title,summary,image,created_at,updated_at")
      .eq("id", id)
      .single(),
    supabase
      .from("articles")
      .select("id,title,description,source,published_at,url")
      .eq("cluster", id)
      .order("published_at", { ascending: false }),
    supabase
      .from("claims")
      .select("id,text,source_count,article_count")
      .eq("event", id)
      .order("article_count", { ascending: false }),
    supabase
      .from("summaries")
      .select("left,center,right")
      .eq("id", id)
      .single(),
  ]);

  if (er.error) throw er.error;
  const eventData = er.data;
  const articlesData = ar.data || [];
  if (ar.error) throw ar.error;

  const sources = [...new Set(articlesData.map((a) => a.source).filter(Boolean))];

  let sourceBiases = {};
  if (sources.length > 0) {
    const { data: sourcesData, error: sourcesErr } = await supabase
      .from("sources")
      .select("id,bias")
      .in("id", sources);

    if (!sourcesErr && sourcesData) {
      sourceBiases = Object.fromEntries(sourcesData.map((s) => [s.id, s.bias]));
    }
  }

  const summaryData = sr.data || {};
  const summaries = {
    left: summaryData.left,
    center: summaryData.center,
    right: summaryData.right,
  };

  const event = {
    ...eventData,
    articles_count: articlesData.length,
    sources_count: sources.length,
    sources,
  };

  let claims = [];
  if (cr.error) console.error("Claims fetch error:", cr.error.message);
  else claims = cr.data || [];

  return { event, articles: articlesData, claims, summaries, sourceBiases };
}

export async function fetchSourceArticles(sourceid) {
  const [articlesRes, sourceRes] = await Promise.all([
    supabase
      .from("articles")
      .select("id,title,description,source,published_at,url,cluster")
      .eq("source", sourceid)
      .order("published_at", { ascending: false })
      .limit(100),
    supabase.from("sources").select("*").eq("id", sourceid).single(),
  ]);

  if (articlesRes.error) throw articlesRes.error;

  return {
    articles: articlesRes.data || [],
    sourceInfo: sourceRes.error ? null : sourceRes.data,
  };
}

export async function fetchSourcesWithCounts() {
  const { data: sourcesData, error: sourcesErr } = await supabase
    .from("sources")
    .select("*");

  if (sourcesErr) throw sourcesErr;

  const sourceNames = (sourcesData || []).map((s) => s.id);
  const articleCounts = {};

  if (sourceNames.length > 0) {
    const { data: articlesData, error: articlesErr } = await supabase
      .from("articles")
      .select("source")
      .in("source", sourceNames);

    if (articlesErr) throw articlesErr;

    (articlesData || []).forEach((a) => {
      articleCounts[a.source] = (articleCounts[a.source] || 0) + 1;
    });
  }

  return (sourcesData || [])
    .map((s) => ({ ...s, count: articleCounts[s.id] || 0 }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
}
