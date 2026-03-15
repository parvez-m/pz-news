export type RawSource = {
  source_url: string;
  title: string;
  raw_content: string;
};

// ── NewsAPI ───────────────────────────────────────────────────────────────────

type NewsApiArticle = {
  title: string;
  url: string;
  description: string | null;
  content: string | null;
};

async function fetchNewsApi(
  keyword: string,
  apiKey: string
): Promise<RawSource[]> {
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(keyword)}&apiKey=${apiKey}&pageSize=10&sortBy=publishedAt&language=en`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`NewsAPI error for "${keyword}": ${res.status}`);
    return [];
  }
  const data = await res.json<{ articles: NewsApiArticle[] }>();
  return (data.articles ?? [])
    .filter((a) => a.title && a.url)
    .map((a) => ({
      source_url: a.url,
      title: a.title,
      raw_content: [a.description, a.content].filter(Boolean).join("\n").slice(0, 2000),
    }));
}

// ── Google News RSS (no key required) ────────────────────────────────────────

function extractRssTag(item: string, tag: string): string {
  const m = item.match(
    new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`)
  );
  return m?.[1]?.trim() ?? "";
}

async function fetchGoogleNewsRss(keyword: string): Promise<RawSource[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, { headers: { "User-Agent": "pz-news/1.0" } });
  if (!res.ok) return [];

  const xml = await res.text();
  const sources: RawSource[] = [];
  const itemRx = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRx.exec(xml)) !== null) {
    const item = match[1];
    const title = extractRssTag(item, "title");
    const link = extractRssTag(item, "link");
    const description = extractRssTag(item, "description");
    if (title && link) {
      sources.push({ source_url: link, title, raw_content: description.slice(0, 2000) });
    }
  }
  return sources.slice(0, 10);
}

// ── YouTube Data API v3 ───────────────────────────────────────────────────────

type YouTubeSnippet = { title: string; description: string };
type YouTubeSearchItem = { id: { videoId: string }; snippet: YouTubeSnippet };
type YouTubePlaylistItem = { snippet: YouTubeSnippet & { resourceId: { videoId: string } } };

function videoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

async function fetchYouTubeChannel(
  channelId: string,
  apiKey: string
): Promise<RawSource[]> {
  const url =
    `https://www.googleapis.com/youtube/v3/search` +
    `?channelId=${channelId}&type=video&order=date&maxResults=10` +
    `&part=snippet&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`YouTube channel error for "${channelId}": ${res.status}`);
    return [];
  }
  const data = await res.json<{ items: YouTubeSearchItem[] }>();
  return (data.items ?? []).map((item) => ({
    source_url: videoUrl(item.id.videoId),
    title: item.snippet.title,
    raw_content: item.snippet.description.slice(0, 2000),
  }));
}

async function fetchYouTubePlaylist(
  playlistId: string,
  apiKey: string
): Promise<RawSource[]> {
  const url =
    `https://www.googleapis.com/youtube/v3/playlistItems` +
    `?playlistId=${playlistId}&maxResults=10&part=snippet&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`YouTube playlist error for "${playlistId}": ${res.status}`);
    return [];
  }
  const data = await res.json<{ items: YouTubePlaylistItem[] }>();
  return (data.items ?? []).map((item) => ({
    source_url: videoUrl(item.snippet.resourceId.videoId),
    title: item.snippet.title,
    raw_content: item.snippet.description.slice(0, 2000),
  }));
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchForTopic(
  type: string,
  value: string,
  env: { NEWS_API_KEY: string; YOUTUBE_API_KEY: string }
): Promise<RawSource[]> {
  switch (type) {
    case "keyword": {
      const [newsApi, rss] = await Promise.allSettled([
        fetchNewsApi(value, env.NEWS_API_KEY),
        fetchGoogleNewsRss(value),
      ]);
      return [
        ...(newsApi.status === "fulfilled" ? newsApi.value : []),
        ...(rss.status === "fulfilled" ? rss.value : []),
      ];
    }
    case "youtube_channel":
      return fetchYouTubeChannel(value, env.YOUTUBE_API_KEY);
    case "youtube_playlist":
      return fetchYouTubePlaylist(value, env.YOUTUBE_API_KEY);
    default:
      return [];
  }
}
