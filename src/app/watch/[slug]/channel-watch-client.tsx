"use client";

import React, { useEffect } from "react";
import { IPTVChannel } from "@/types/iptv";
import { useIPTV } from "@/context/iptv-context";
import { MainDashboard } from "@/components/main-dashboard";
import { getChannelBySlug, getChannelSlug, slugify } from "@/lib/seo";

interface ChannelWatchClientProps {
  slug: string;
  serverChannel?: IPTVChannel;
}

export function ChannelWatchClient({ slug, serverChannel }: ChannelWatchClientProps) {
  const { channels, setActiveChannel, activeChannel } = useIPTV();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [slug]);



  useEffect(() => {
    // 1. If activeChannel already matches current route slug, preserve it
    if (activeChannel) {
      const activeSlug = getChannelSlug(activeChannel);
      const activeNameSlug = slugify(activeChannel.name);
      if (
        activeSlug.toLowerCase() === slug.toLowerCase() ||
        activeChannel.id.toLowerCase() === slug.toLowerCase() ||
        activeNameSlug.toLowerCase() === slug.toLowerCase()
      ) {
        return;
      }
    }

    // 2. Resolve channel from client state / IndexedDB
    if (channels.length > 0) {
      const clientMatch = getChannelBySlug(slug, channels);
      if (clientMatch) {
        if (activeChannel?.id !== clientMatch.id) {
          setActiveChannel(clientMatch);
        }
        return;
      }
    }

    // 3. Fallback: If server provided channel matching route, use it
    if (serverChannel) {
      if (activeChannel?.id !== serverChannel.id) {
        setActiveChannel(serverChannel);
      }
    }
  }, [slug, serverChannel, channels, activeChannel, setActiveChannel]);

  return <MainDashboard initialChannel={serverChannel} />;
}

