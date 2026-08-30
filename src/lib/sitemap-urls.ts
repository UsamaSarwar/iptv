import { getAllServerChannels } from "@/lib/server-channels";
import { getChannelSlug } from "@/lib/seo";

export const SITE_HOST = "iptv.usama.dev";
export const BASE_URL = `https://${SITE_HOST}`;

/**
 * Builds the full list of public URLs that should be in the sitemap / IndexNow.
 */
export async function getSitemapUrls(): Promise<string[]> {
  const allChannels = await getAllServerChannels();

  const staticPages = [BASE_URL, `${BASE_URL}/terms`, `${BASE_URL}/privacy`];

  const channelPages = allChannels.map(
    (channel) => `${BASE_URL}/watch/${getChannelSlug(channel)}/`
  );

  return [...staticPages, ...channelPages];
}
