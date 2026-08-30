"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useIPTV, splitCategories, normalizeCountry, normalizeLanguage, normalizeCategory, formatChannelDisplayName } from "@/context/iptv-context";
import { Navbar } from "@/components/navbar";
import { HeroBillboard } from "@/components/hero-billboard";
import { ChannelRow } from "@/components/channel-row";
import { ChannelCard } from "@/components/channel-card";
import { VideoPlayer } from "@/components/video-player";
import { PlaylistModal } from "@/components/playlist-modal";
import { ChannelDrawer } from "@/components/channel-drawer";
import { SearchModal } from "@/components/search-modal";
import { CountryPromptModal } from "@/components/country-prompt-modal";
import { useTVNavigation } from "@/lib/use-tv-navigation";
import { IPTVChannel } from "@/types/iptv";

interface MainDashboardProps {
  isHomePage?: boolean;
  initialChannel?: IPTVChannel;
}

export function MainDashboard({ isHomePage = false, initialChannel }: MainDashboardProps) {
  const {
    channels,
    activeChannel: contextActiveChannel,
    selectedCategory,
    selectedCountry,
    selectedLanguage,
    selectedResolution,
    favorites,
    watchHistory,
    offlineChannelIds,
  } = useIPTV();

  const activeChannel = contextActiveChannel || initialChannel || null;

  // Enable Smart TV remote D-Pad & spatial keyboard navigation
  useTVNavigation({
    enabled: !activeChannel,
  });

  // Helper comparator:
  // 1. Live channels first, Offline channels last
  // 2. Logo + Backdrop (Tier 2) > Logo only (Tier 1) > No Logo (Tier 0)
  // 3. Featured flag tiebreaker
  const compareByLiveAndMedia = React.useCallback((a: IPTVChannel, b: IPTVChannel) => {
    // 1. Live vs Offline
    const aOff = offlineChannelIds.has(a.id);
    const bOff = offlineChannelIds.has(b.id);
    if (!aOff && bOff) return -1;
    if (aOff && !bOff) return 1;

    // 2. Media Richness Tier: Logo & Backdrop (2) > Logo (1) > None (0)
    const getMediaTier = (ch: IPTVChannel) => {
      const hasLogo = Boolean(ch.logo && ch.logo.trim());
      const hasBackdrop = Boolean(ch.backdrop && ch.backdrop.trim());
      if (hasLogo && hasBackdrop) return 2;
      if (hasLogo) return 1;
      return 0;
    };

    const tierA = getMediaTier(a);
    const tierB = getMediaTier(b);
    if (tierB !== tierA) return tierB - tierA;

    // 3. Featured tiebreaker
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;

    return 0;
  }, [offlineChannelIds]);

  // Filter channels based on country, language, and resolution selection if active
  const filteredChannels = useMemo(() => {
    const selCountryNorm = selectedCountry.toLowerCase();
    const selLangNorm = selectedLanguage.toLowerCase();
    const selResNorm = selectedResolution.toLowerCase();

    return channels.filter((c) => {
      const matchCountry =
        selectedCountry === "All" ||
        (c.country &&
          (c.country.toLowerCase() === selCountryNorm ||
            normalizeCountry(c.country).toLowerCase() === selCountryNorm));

      const matchLanguage =
        selectedLanguage === "All" ||
        (c.language &&
          (c.language.toLowerCase() === selLangNorm ||
            normalizeLanguage(c.language).some(
              (l) => l.toLowerCase() === selLangNorm
            )));

      const { qualityTag } = formatChannelDisplayName(c.name, c.quality);
      const chRes = (qualityTag || c.quality || "HD").toLowerCase();
      const matchResolution =
        selectedResolution === "All" ||
        chRes === selResNorm;

      return matchCountry && matchLanguage && matchResolution;
    });
  }, [channels, selectedCountry, selectedLanguage, selectedResolution]);

  // Featured Hero Channels for auto-rotating billboard (channels with backdrop or logos)
  const featuredChannels = useMemo(() => {
    const channelsWithMedia = filteredChannels.filter(
      (c) => Boolean((c.backdrop && c.backdrop.trim()) || (c.logo && c.logo.trim()))
    );

    if (channelsWithMedia.length > 0) {
      const sorted = [...channelsWithMedia].sort((a, b) => {
        const liveDiff = compareByLiveAndMedia(a, b);
        if (liveDiff !== 0) return liveDiff;
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
      return sorted.slice(0, 10);
    }

    const globalWithMedia = channels.filter(
      (c) => Boolean((c.backdrop && c.backdrop.trim()) || (c.logo && c.logo.trim()))
    );
    const sortedGlobal = [...globalWithMedia].sort((a, b) => {
      const liveDiff = compareByLiveAndMedia(a, b);
      if (liveDiff !== 0) return liveDiff;
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
    return sortedGlobal.slice(0, 10);
  }, [channels, filteredChannels, compareByLiveAndMedia]);

  // Favorite Channels
  const favoriteChannels = useMemo(() => {
    const list = filteredChannels.filter((c) => favorites.includes(c.id));
    return list.sort(compareByLiveAndMedia);
  }, [filteredChannels, favorites, compareByLiveAndMedia]);

  // Recently Watched Channels
  const recentChannels = useMemo(() => {
    return watchHistory
      .map((id) => filteredChannels.find((c) => c.id === id))
      .filter((c): c is typeof filteredChannels[0] => Boolean(c));
  }, [filteredChannels, watchHistory]);

  // Group channels by category (handling multi-category semicolon splits) and sort:
  // 1. Categories sorted by total channel count descending (most channels on top)
  // 2. Channels within each category sorted by LIVE first, then Logo+Backdrop > Logo > No logo, and OFFLINE last
  const sortedCategoryRows = useMemo(() => {
    const map = new Map<string, typeof filteredChannels>();
    filteredChannels.forEach((c) => {
      const groups = splitCategories(c.group);
      groups.forEach((cat) => {
        if (!map.has(cat)) map.set(cat, []);
        if (!map.get(cat)!.some((existing) => existing.id === c.id)) {
          map.get(cat)!.push(c);
        }
      });
    });

    return Array.from(map.entries())
      .map(([catName, catChannels]) => {
        const sortedChannels = [...catChannels].sort(compareByLiveAndMedia);
        return [catName, sortedChannels] as [string, typeof filteredChannels];
      })
      .sort((a, b) => {
        if (b[1].length !== a[1].length) return b[1].length - a[1].length;
        return a[0].localeCompare(b[0]);
      });
  }, [filteredChannels, compareByLiveAndMedia]);

  // Filtered list when specific category selected (sorted LIVE first, logo+backdrop > logo > no logo, OFFLINE last)
  const filteredChannelsForSelected = useMemo(() => {
    let list: typeof filteredChannels = [];
    if (selectedCategory === "Favorites") list = favoriteChannels;
    else if (selectedCategory === "All") list = filteredChannels;
    else {
      const selCatNorm = selectedCategory.toLowerCase();
      list = filteredChannels.filter((c) =>
        splitCategories(c.group).some(
          (cat) => cat.toLowerCase() === selCatNorm || normalizeCategory(cat).toLowerCase() === selCatNorm
        )
      );
    }

    return [...list].sort(compareByLiveAndMedia);
  }, [selectedCategory, favoriteChannels, filteredChannels, compareByLiveAndMedia]);

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen bg-[#09090b] text-zinc-100 pb-24 sm:pb-16 relative overflow-hidden selection:bg-purple-600 selection:text-white flex flex-col justify-between"
    >
      {/* Background Subtle Ambient Glow Orbs */}
      <div className="fixed top-0 left-1/4 w-150 h-150 bg-zinc-800/10 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-10 w-125 h-125 bg-zinc-800/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Navigation Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* If on a dedicated watch page, ALWAYS render the VideoPlayer */}
        {!isHomePage ? (
          <div className="w-full">
            {activeChannel ? (
              <VideoPlayer channel={activeChannel} />
            ) : (
              <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 pt-16 sm:pt-20">
                <div className="aspect-video w-full rounded-2xl bg-zinc-900/80 border border-zinc-800 animate-pulse flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <span className="w-5 h-5 rounded-full bg-purple-500/40 animate-ping" />
                  </div>
                  <p className="text-xs text-zinc-400 font-medium">Loading channel stream...</p>
                </div>
              </div>
            )}

            {/* Discover More Channels below watch section */}
            <div className="w-full max-w-[1920px] mx-auto space-y-4 pt-8 border-t border-zinc-800/60">
              <div className="px-3 sm:px-6 lg:px-8 xl:px-10">
                <h3 className="text-lg sm:text-xl font-black text-white">Explore More Channels</h3>
              </div>
              {sortedCategoryRows.map(([categoryName, catChannels]) => (
                <ChannelRow
                  key={categoryName}
                  title={categoryName}
                  channels={catChannels}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {selectedCategory === "All" && (
              <>
                {/* Top Spotlight Billboard with 5s Auto-Fade Rotation */}
                {featuredChannels.length > 0 && <HeroBillboard channels={featuredChannels} />}

                <div className="-mt-16 relative z-20 pointer-events-none space-y-4 w-full *:pointer-events-auto">
                  {/* Active Filter Badge */}
                  {(selectedCountry !== "All" || selectedLanguage !== "All" || selectedResolution !== "All") && (
                    <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-wrap gap-2" suppressHydrationWarning>
                      <div className="inline-flex items-center space-x-2 text-xs bg-zinc-900/90 border border-zinc-800/90 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md">
                        <div className="flex items-center space-x-1.5 font-medium text-zinc-200">
                          {selectedCountry !== "All" && (
                            <span className="text-zinc-100 font-semibold">{selectedCountry}</span>
                          )}
                          {selectedCountry !== "All" && selectedLanguage !== "All" && <span className="text-zinc-600">•</span>}
                          {selectedLanguage !== "All" && (
                            <span className="text-zinc-100 font-semibold">{selectedLanguage}</span>
                          )}
                          {(selectedCountry !== "All" || selectedLanguage !== "All") && selectedResolution !== "All" && <span className="text-zinc-600">•</span>}
                          {selectedResolution !== "All" && (
                            <span className="text-zinc-100 font-semibold">{selectedResolution}</span>
                          )}
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono leading-none">
                          {filteredChannels.length}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Recently Watched */}
                  {recentChannels.length > 0 && (
                    <ChannelRow
                      title="Continue Watching"
                      channels={recentChannels}
                    />
                  )}

                  {/* Favorites Row */}
                  {favoriteChannels.length > 0 && (
                    <ChannelRow
                      title="My Favorites"
                      channels={favoriteChannels}
                    />
                  )}

                  {/* Dynamic Category Rows Sorted By Channel Count */}
                  {sortedCategoryRows.map(([categoryName, catChannels]) => (
                    <ChannelRow
                      key={categoryName}
                      title={categoryName}
                      channels={catChannels}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Filtered Category View */}
            {selectedCategory !== "All" && (
              <div className="w-full px-4 sm:px-6 lg:px-8 pt-24">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {selectedCategory === "Favorites" ? "Favorite Channels" : selectedCategory}
                  </h1>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium">
                    {selectedCategory === "Favorites"
                      ? `${favoriteChannels.length} saved`
                      : `${filteredChannelsForSelected.length} channels`}
                  </span>
                  {selectedCountry !== "All" && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-purple-300 font-medium">
                      {selectedCountry}
                    </span>
                  )}
                </div>

                {filteredChannelsForSelected.length === 0 ? (
                  <div className="p-12 text-center text-zinc-500 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
                    No channels found for &quot;{selectedCategory}&quot; in &quot;{selectedCountry}&quot;.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 w-full">
                    {filteredChannelsForSelected.map((channel) => (
                      <ChannelCard key={channel.id} channel={channel} isGrid={true} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer Credits */}
      <footer className="w-full py-8 mt-12 border-t border-zinc-800/80 relative z-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center space-x-2 text-center sm:text-left">
            <span className="font-orbitron font-black tracking-wider text-gray-300 text-sm">IPTV</span>
            <span>•</span>
            <span className="whitespace-nowrap">Live Television Streaming</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center">
            <div className="flex items-center space-x-3">
              <Link
                href="/terms"
                className="text-gray-400 hover:text-purple-300 transition-colors whitespace-nowrap"
              >
                Terms of Use
              </Link>
              <span className="text-zinc-600">•</span>
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-purple-300 transition-colors whitespace-nowrap"
              >
                Privacy Policy
              </Link>
            </div>
            <span className="hidden sm:inline text-zinc-600">•</span>
            <span className="whitespace-nowrap">
              Powered by{" "}
              <a
                href="https://usama.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 font-semibold no-underline transition-colors"
              >
                Usama Sarwar
              </a>
            </span>
          </div>
        </div>
      </footer>

      {/* Overlays & Drawers */}
      <PlaylistModal />
      <ChannelDrawer />
      <SearchModal />
      <CountryPromptModal />
    </div>
  );
}
