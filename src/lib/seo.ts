import { Metadata } from "next";
import { DEFAULT_CHANNELS } from "@/data/default-channels";
import { IPTVChannel } from "@/types/iptv";

const BASE_URL = "https://iptv.usama.dev";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Returns the canonical URL slug for a channel.
 * Uses channel.id when present to ensure 100% uniqueness when channels share the same display name.
 */
export function getChannelSlug(channel: IPTVChannel): string {
  if (channel.id) {
    const idSlug = slugify(channel.id);
    if (idSlug) return idSlug;
  }
  return slugify(channel.name);
}

/**
 * Resolves a channel by slug or ID with priority:
 * 1. Exact ID match (e.g. minimax-pk-360p or nasa-tv-uhd)
 * 2. Exact getChannelSlug match
 * 3. Exact Name slug match (if multiple exist, picks the richest/highest resolution channel)
 */
export function getChannelBySlug(slug: string, allChannels: IPTVChannel[] = DEFAULT_CHANNELS): IPTVChannel | undefined {
  const lowerSlug = slug.toLowerCase().trim();

  // 1. Exact ID match
  const exactIdMatch = allChannels.find(
    (c) => c.id.toLowerCase() === lowerSlug || slugify(c.id) === lowerSlug
  );
  if (exactIdMatch) return exactIdMatch;

  // 2. Canonical getChannelSlug match
  const slugMatch = allChannels.find((c) => getChannelSlug(c) === lowerSlug);
  if (slugMatch) return slugMatch;

  // 3. Name slug match (handles generic or legacy /watch/minimax links)
  const nameMatches = allChannels.filter((c) => slugify(c.name) === lowerSlug);
  if (nameMatches.length === 1) {
    return nameMatches[0];
  }
  if (nameMatches.length > 1) {
    // Pick the highest resolution and media-rich channel among duplicates
    return nameMatches.sort((a, b) => {
      const getScore = (ch: IPTVChannel) => {
        let score = 0;
        const q = (ch.quality || "").toLowerCase();
        if (q.includes("4k") || q.includes("uhd")) score += 40;
        else if (q.includes("1080") || q.includes("fhd")) score += 30;
        else if (q.includes("720") || q.includes("hd")) score += 20;
        else score += 10;
        if (ch.logo) score += 5;
        if (ch.backdrop) score += 2;
        return score;
      };
      return getScore(b) - getScore(a);
    })[0];
  }

  return undefined;
}

export function generateChannelMetadata(channel: IPTVChannel): Metadata {
  const title = `Watch ${channel.name} Live Online - IPTV`;
  const description =
    channel.description ||
    `Stream ${channel.name} live in HD quality on IPTV. Watch ${channel.group} television online for free.`;
  const channelUrl = `${BASE_URL}/watch/${getChannelSlug(channel)}`;
  const ogImage = channel.backdrop || `${BASE_URL}/og-image.png`;

  return {
    title,
    description,
    alternates: {
      canonical: channelUrl,
    },
    openGraph: {
      title,
      description,
      url: channelUrl,
      siteName: "IPTV",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${channel.name} Live Broadcast`,
        },
      ],
      type: "video.other",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export function generateChannelJsonLd(channel: IPTVChannel) {
  const channelUrl = `${BASE_URL}/watch/${getChannelSlug(channel)}`;

  return {
    "@context": "https://schema.org",
    "@type": "BroadcastEvent",
    name: `${channel.name} Live Stream`,
    description:
      channel.description ||
      `Live TV broadcast stream of ${channel.name} on ${channel.group} network.`,
    isLiveBroadcast: true,
    startDate: new Date().toISOString(),
    url: channelUrl,
    video: {
      "@type": "VideoObject",
      name: channel.name,
      description: channel.description || `Live stream of ${channel.name}`,
      thumbnailUrl: [
        `${channelUrl}/opengraph-image`,
        ...(channel.backdrop ? [channel.backdrop] : []),
        ...(channel.logo ? [channel.logo] : []),
        `${BASE_URL}/opengraph-image`,
      ],
      uploadDate: "2024-01-01T00:00:00Z",
      contentUrl: channel.url,
      embedUrl: channelUrl,
      inLanguage: channel.language || "English",
      genre: channel.group,
    },
    broadcastOfEvent: {
      "@type": "TelevisionChannel",
      name: channel.name,
      genre: channel.group,
      inLanguage: channel.language || "English",
    },
  };
}

export function generateWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        url: BASE_URL,
        name: "IPTV",
        description:
          "Modern IPTV Progressive Web App for live television, sports, news, and cinema streaming.",
        publisher: {
          "@type": "Organization",
          name: "Usama Sarwar",
          url: "https://usama.dev",
        },
        potentialAction: [
          {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${BASE_URL}/?search={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        ],
      },
      {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: "IPTV",
        url: BASE_URL,
        logo: `${BASE_URL}/icon-512.png`,
      },
    ],
  };
}
