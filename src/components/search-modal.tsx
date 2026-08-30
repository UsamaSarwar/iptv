"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIPTV, formatChannelDisplayName } from "@/context/iptv-context";
import { getChannelSlug } from "@/lib/seo";
import { Search, X, Heart, Play, Tv } from "lucide-react";
import { IPTVChannel } from "@/types/iptv";


function SearchChannelItem({
  channel,
  isFav,
  isOffline,
  onSelect,
  onToggleFavorite,
}: {
  channel: IPTVChannel;
  isFav: boolean;
  isOffline: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  const [imgStatus, setImgStatus] = useState<"loading" | "loaded" | "error">(
    channel.logo ? "loading" : "error"
  );
  const { displayName, qualityTag } = formatChannelDisplayName(channel.name, channel.quality);

  return (
    <div
      onClick={onSelect}
      className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800 cursor-pointer transition-colors group"
    >
      <div className="flex items-center space-x-3 truncate">
        <div className="w-9 h-9 flex items-center justify-center shrink-0 relative">
          {imgStatus !== "loaded" && (
            <Tv
              className={`w-5 h-5 text-zinc-500 ${
                imgStatus === "loading" ? "animate-pulse" : ""
              }`}
            />
          )}

          {channel.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={channel.logo}
              alt={displayName}
              onLoad={() => setImgStatus("loaded")}
              onError={() => setImgStatus("error")}
              className={`max-h-9 max-w-9 object-contain drop-shadow-sm filter brightness-110 transition-opacity duration-150 ${
                imgStatus === "loaded" ? "opacity-100" : "opacity-0 absolute"
              }`}
            />
          )}
        </div>

        <div className="truncate">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm text-white group-hover:text-zinc-100">
              {displayName}
            </span>
            {isOffline ? (
              <span className="text-[9px] px-1.5 py-0.2 bg-zinc-800 border border-zinc-700/80 rounded text-zinc-400 font-bold">
                OFFLINE
              </span>
            ) : (
              <span className="text-[9px] px-1.5 py-0.2 bg-red-600 rounded text-white font-extrabold">
                LIVE
              </span>
            )}
            {qualityTag && (
              <span className="text-[9px] px-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-300 font-bold">
                {qualityTag}
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-400">
            {channel.group} {channel.country ? `• ${channel.country}` : ""}{" "}
            {channel.language ? `• ${channel.language}` : ""}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="p-2 rounded-lg text-zinc-400 hover:text-purple-300 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 ${
              isFav ? "fill-purple-400 text-purple-400" : ""
            }`}
          />
        </button>
        <div className="w-8 h-8 rounded-full bg-zinc-800 group-hover:bg-purple-600 text-white flex items-center justify-center shadow transition-transform group-hover:scale-105 active:scale-95">
          <Play className="w-4 h-4 fill-white ml-0.5" />
        </div>
      </div>
    </div>
  );
}

export function SearchModal() {
  const router = useRouter();
  const {
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
    channels,
    setActiveChannel,
    favorites,
    toggleFavorite,
    offlineChannelIds,
  } = useIPTV();

  // Keyboard shortcut Ctrl/Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      } else if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const compareLiveAndMedia = (a: IPTVChannel, b: IPTVChannel) => {
    const aOff = offlineChannelIds.has(a.id);
    const bOff = offlineChannelIds.has(b.id);
    if (!aOff && bOff) return -1;
    if (aOff && !bOff) return 1;

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

    return 0;
  };

  const results = searchQuery.trim()
    ? channels
        .filter((c) => {
          const query = searchQuery.toLowerCase();
          return (
            c.name.toLowerCase().includes(query) ||
            (c.country && c.country.toLowerCase().includes(query)) ||
            (c.language && c.language.toLowerCase().includes(query)) ||
            (c.group && c.group.toLowerCase().includes(query))
          );
        })
        .sort(compareLiveAndMedia)
    : [...channels].sort(compareLiveAndMedia).slice(0, 15);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => setIsSearchOpen(false)}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl shadow-black/90 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="p-4 border-b border-zinc-800 flex items-center space-x-3 bg-zinc-900/60">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search thousands of live channels, countries, genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs border border-zinc-700 px-2 py-1"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-zinc-800/60">
          {results.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No channels found for &quot;{searchQuery}&quot;.
            </div>
          ) : (
            results.map((ch) => (
              <SearchChannelItem
                key={ch.id}
                channel={ch}
                isFav={favorites.includes(ch.id)}
                isOffline={offlineChannelIds.has(ch.id)}
                onSelect={() => {
                  setActiveChannel(ch);
                  setIsSearchOpen(false);
                  const channelSlug = getChannelSlug(ch);
                  router.push(`/watch/${channelSlug}/`);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onToggleFavorite={() => toggleFavorite(ch.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
