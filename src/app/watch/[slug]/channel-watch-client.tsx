"use client";

import React, { useEffect } from "react";
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });

    // When route slug changes: resolve and set the active channel
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

