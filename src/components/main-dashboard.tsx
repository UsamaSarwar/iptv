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
import { Coffee, Heart, Tv, ExternalLink, Code } from "lucide-react";
import { GithubIcon, BuyMeACoffeeIcon } from "@/components/icons";

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
              <VideoPlayer key={activeChannel.id} channel={activeChannel} />
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
      <footer className="w-full py-12 mt-16 border-t border-zinc-800/80 bg-zinc-950/60 backdrop-blur-sm relative z-20">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-8 text-xs text-zinc-400">
          {/* Main Footer Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-zinc-800/80">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center space-x-2.5">
                <Tv className="w-6 h-6 text-purple-400 shrink-0" />
                <div className="flex items-baseline space-x-1.5">
                  <span className="font-orbitron text-lg font-black tracking-wider text-white">
                    IPTV
                  </span>
                  <span className="text-[9px] font-bold text-purple-400 tracking-wider">
                    LIVE
                  </span>
                </div>
              </div>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Free & open-source live television web player. Stream 5,000+ public global broadcast channels with zero tracking, instant playback, and no ads.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Buy Us a Coffee */}
              <a
                href="https://buymeacoffee.com/usamasarwar"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95 shrink-0 border border-black/50"
                style={{ backgroundColor: "#BD5FFF" }}
                title="Support us on Buy Me a Coffee!"
              >
                <BuyMeACoffeeIcon className="w-4 h-4 text-white" />
                <span className="font-semibold text-white text-xs tracking-wide">
                  Buy us a coffee
                </span>
              </a>

              {/* GitHub Repository */}
              <a
                href="https://github.com/UsamaSarwar/iptv"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/40 text-zinc-200 hover:text-white font-semibold text-xs shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                <GithubIcon className="w-4 h-4" />
                <span>GitHub Repository</span>
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 pt-2">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Open Source</h4>
              <ul className="space-y-2 text-zinc-400">
                <li>
                  <a
                    href="https://github.com/UsamaSarwar/iptv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-purple-300 transition-colors inline-flex items-center space-x-1"
                  >
                    <span>Source Code</span>
                    <ExternalLink className="w-3 h-3 text-zinc-600" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/UsamaSarwar/iptv/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-purple-300 transition-colors"
                  >
                    MIT License
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/UsamaSarwar/iptv/blob/main/CONTRIBUTING.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-purple-300 transition-colors"
                  >
                    Contributing
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/UsamaSarwar/iptv/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-purple-300 transition-colors"
                  >
                    Report an Issue
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Community & Data</h4>
              <ul className="space-y-2 text-zinc-400">
                <li>
                  <a
                    href="https://github.com/iptv-org/iptv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-purple-300 transition-colors inline-flex items-center space-x-1"
                  >
                    <span>iptv-org Catalog</span>
                    <ExternalLink className="w-3 h-3 text-zinc-600" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://buymeacoffee.com/usamasarwar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-amber-300 transition-colors inline-flex items-center space-x-1 font-medium text-amber-400/90"
                  >
                    <Coffee className="w-3 h-3" />
                    <span>Support Creator</span>
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Legal & Privacy</h4>
              <ul className="space-y-2 text-zinc-400">
                <li>
                  <Link href="/terms" className="hover:text-purple-300 transition-colors">
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-purple-300 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3 col-span-2 sm:col-span-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Developer</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Created & maintained with <Heart className="w-3 h-3 inline text-red-500 fill-red-500" /> by{" "}
                <a
                  href="https://usama.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                >
                  Usama Sarwar
                </a>.
              </p>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-500 text-center sm:text-left">
            <span>© {new Date().getFullYear()} IPTV. Released under the MIT License.</span>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/UsamaSarwar/iptv"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-300 transition-colors inline-flex items-center space-x-1"
              >
                <Code className="w-3.5 h-3.5" />
                <span>Open Source</span>
              </a>
              <span>•</span>
              <a
                href="https://buymeacoffee.com/usamasarwar"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-400 transition-colors inline-flex items-center space-x-1"
              >
                <Coffee className="w-3.5 h-3.5 text-amber-400" />
                <span>Donate</span>
              </a>
            </div>
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
