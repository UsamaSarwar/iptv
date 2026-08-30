import { Metadata } from "next";
import { generateChannelMetadata, generateChannelJsonLd, getChannelSlug } from "@/lib/seo";
import { getAllServerChannels, getServerChannelBySlug } from "@/lib/server-channels";
import { ChannelWatchClient } from "./channel-watch-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const channels = await getAllServerChannels();
  const slugs = new Set<string>();

  for (const ch of channels) {
    const slug = getChannelSlug(ch);
    if (slug) {
      slugs.add(slug);
    }
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const channel = await getServerChannelBySlug(slug);

  if (!channel) {
    const formattedTitle = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return {
      title: `Watch ${formattedTitle} Live Online - IPTV`,
      description: `Stream ${formattedTitle} live online in HD quality on IPTV.`,
    };
  }

  return generateChannelMetadata(channel);
}

export default async function WatchChannelPage({ params }: PageProps) {
  const { slug } = await params;
  const serverChannel = await getServerChannelBySlug(slug);
  const jsonLd = serverChannel ? generateChannelJsonLd(serverChannel) : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ChannelWatchClient slug={slug} serverChannel={serverChannel} />
    </>
  );
}

