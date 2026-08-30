export const dynamic = "force-static";

export default function robots(): {
  rules: { userAgent: string; allow: string; disallow?: string[] };
  sitemap: string;
  host: string;
} {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://iptv.usama.dev/sitemap.xml",
    host: "https://iptv.usama.dev",
  };
}
