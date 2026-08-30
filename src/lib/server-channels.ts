import fs from "node:fs";
import path from "node:path";
import { IPTVChannel } from "@/types/iptv";
import { DEFAULT_CHANNELS } from "@/data/default-channels";
import { parseM3U } from "@/lib/m3u-parser";
import { getChannelSlug, getChannelBySlug } from "@/lib/seo";

// High-value curated playlist feeds for rich catalog and SEO indexing
const SERVER_PLAYLIST_SOURCES = [
  {
    name: "IPTV-org English Channels",
    url: "https://iptv-org.github.io/iptv/languages/eng.m3u",
  },
  {
    name: "IPTV-org Movies & Cinema",
    url: "https://iptv-org.github.io/iptv/categories/movies.m3u",
  },
  {
    name: "IPTV-org Sports Broadcasts",
    url: "https://iptv-org.github.io/iptv/categories/sports.m3u",
  },
  {
    name: "IPTV-org Music & Concerts",
    url: "https://iptv-org.github.io/iptv/categories/music.m3u",
  },
  {
    name: "IPTV-org News",
    url: "https://iptv-org.github.io/iptv/categories/news.m3u",
  },
  {
    name: "IPTV-org Documentary",
    url: "https://iptv-org.github.io/iptv/categories/documentary.m3u",
  },
  {
    name: "IPTV-org Kids",
    url: "https://iptv-org.github.io/iptv/categories/kids.m3u",
  },
  {
    name: "IPTV-org Animation",
    url: "https://iptv-org.github.io/iptv/categories/animation.m3u",
  },
  {
    name: "IPTV-org Entertainment",
    url: "https://iptv-org.github.io/iptv/categories/entertainment.m3u",
  },
  {
    name: "IPTV-org Pakistan",
    url: "https://iptv-org.github.io/iptv/countries/pk.m3u",
  },
  {
    name: "IPTV-org USA",
    url: "https://iptv-org.github.io/iptv/countries/us.m3u",
  },
  {
    name: "IPTV-org UK",
    url: "https://iptv-org.github.io/iptv/countries/uk.m3u",
  },
  {
    name: "IPTV-org Canada",
    url: "https://iptv-org.github.io/iptv/countries/ca.m3u",
  },
  {
    name: "IPTV-org India",
    url: "https://iptv-org.github.io/iptv/countries/in.m3u",
  },
  {
    name: "IPTV-org Germany",
    url: "https://iptv-org.github.io/iptv/countries/de.m3u",
  },
  {
    name: "IPTV-org France",
    url: "https://iptv-org.github.io/iptv/countries/fr.m3u",
  },
  {
    name: "IPTV-org Australia",
    url: "https://iptv-org.github.io/iptv/countries/au.m3u",
  },
];

let cachedChannels: IPTVChannel[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours server cache

/**
 * Fetch and parse a single M3U source with safe timeout and Next.js revalidation
 */
async function fetchSourceSafely(url: string): Promise<IPTVChannel[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IPTVBot/1.0; +https://iptv.usama.dev)",
      },
      cache: "force-cache",
    });

    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const text = await res.text();
    return parseM3U(text);
  } catch (err) {
    console.warn(`[server-channels] Failed to fetch source ${url}:`, err);
    return [];
  }
}

/**
 * Loads all default + dynamic API/M3U playlist channels, deduplicates them, and caches them
 */
export async function getAllServerChannels(): Promise<IPTVChannel[]> {
  const now = Date.now();
  if (cachedChannels && now < cacheExpiry) {
    return cachedChannels;
  }

  // 1. Try reading pre-built static snapshot from public/channels-snapshot.json
  try {
    const snapshotPath = path.resolve(process.cwd(), "public/channels-snapshot.json");
    if (fs.existsSync(snapshotPath)) {
      const raw = fs.readFileSync(snapshotPath, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data.channels) && data.channels.length > 0) {
        cachedChannels = data.channels;
        cacheExpiry = now + CACHE_TTL_MS;
        return cachedChannels!;
      }
    }
  } catch (err) {
    console.warn("[server-channels] Failed to read static snapshot from disk:", err);
  }

  // 2. Fallback: Fetch all configured sources in parallel
  const results = await Promise.allSettled(
    SERVER_PLAYLIST_SOURCES.map((source) => fetchSourceSafely(source.url))
  );

  const dynamicChannels: IPTVChannel[] = [];
  results.forEach((result) => {
    if (result.status === "fulfilled" && Array.isArray(result.value)) {
      dynamicChannels.push(...result.value);
    }
  });

  const combined = [...DEFAULT_CHANNELS, ...dynamicChannels];

  // Strict deduplication by normalized stream URL and unique channel slug
  const seenUrls = new Set<string>();
  const seenSlugs = new Set<string>();
  const uniqueChannels: IPTVChannel[] = [];

  for (const ch of combined) {
    const normUrl = (ch.url || "").trim().toLowerCase();
    const slug = getChannelSlug(ch);

    if (!slug) continue;
    if (normUrl && seenUrls.has(normUrl)) continue;
    if (seenSlugs.has(slug)) continue;

    if (normUrl) seenUrls.add(normUrl);
    seenSlugs.add(slug);
    uniqueChannels.push(ch);
  }

  cachedChannels = uniqueChannels.length > 0 ? uniqueChannels : DEFAULT_CHANNELS;
  cacheExpiry = now + CACHE_TTL_MS;

  return cachedChannels;
}

/**
 * Resolves a channel by its URL slug across all default and dynamically fetched channels
 */
export async function getServerChannelBySlug(slug: string): Promise<IPTVChannel | undefined> {
  const channels = await getAllServerChannels();
  return getChannelBySlug(slug, channels);
}
