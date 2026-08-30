import { BASE_URL, getSitemapUrls } from "@/lib/sitemap-urls";
import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();
  const urls = await getSitemapUrls();

  return urls.map((url) => {
    if (url === BASE_URL) {
      return {
        url,
        lastModified: currentDate,
        changeFrequency: "always" as const,
        priority: 1.0,
      };
    }

    if (url.endsWith("/terms") || url.endsWith("/privacy")) {
      return {
        url,
        lastModified: currentDate,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      };
    }

    if (url.includes("/watch/")) {
      return {
        url,
        lastModified: currentDate,
        changeFrequency: "daily" as const,
        priority: 0.7,
      };
    }

    // Category / country browse routes
    return {
      url,
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 0.8,
    };
  });
}
