"use client";

import React, { useEffect, useRef } from "react";
import { IPTVChannel } from "@/types/iptv";
import { useIPTV } from "@/context/iptv-context";
import { MainDashboard } from "@/components/main-dashboard";
import { getChannelBySlug } from "@/lib/seo";

interface ChannelWatchClientProps {
  slug: string;
  serverChannel?: IPTVChannel;
}

export function ChannelWatchClient({ slug, serverChannel }: ChannelWatchClientProps) {
  const { channels, setActiveChannel } = useIPTV();
  const initialSlugRef = useRef<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [slug]);

  useEffect(() => {
    // Only resolve channel on initial mount or when route slug prop changes
    if (initialSlugRef.current === slug) {
      return;
    }
    initialSlugRef.current = slug;

    if (channels.length > 0) {
      const match = getChannelBySlug(slug, channels);
      if (match) {
        setActiveChannel(match);
        return;
      }
    }

    if (serverChannel) {
      setActiveChannel(serverChannel);
    }
  }, [slug, serverChannel, channels, setActiveChannel]);

  return <MainDashboard initialChannel={serverChannel} />;
}

