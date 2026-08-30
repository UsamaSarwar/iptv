"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useIPTV, splitCategories, formatCategories, formatChannelDisplayName } from "@/context/iptv-context";
import { getChannelSlug } from "@/lib/seo";
import { X, Search, Heart, Radio, Tv } from "lucide-react";
import { IPTVChannel } from "@/types/iptv";

function DrawerChannelItem({
  channel,
  isPlaying,
  isFav,
  isOffline,
  onSelect,
  onToggleFav,
}: {
  channel: IPTVChannel;
  isPlaying: boolean;
  isFav: boolean;
  isOffline: boolean;
  onSelect: () => void;
  onToggleFav: () => void;
}) {
  const [imgStatus, setImgStatus] = useState<"loading" | "loaded" | "error">(
    channel.logo ? "loading" : "error"
  );
  const { displayName, qualityTag } = formatChannelDisplayName(channel.name, channel.quality);

  return (
    <div
      onClick={onSelect}
      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
        isPlaying
          ? "bg-purple-950/40 border border-purple-500 text-white"
          : "bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 text-zinc-300 hover:text-white"
      }`}
    >
      <div className="flex items-center space-x-3 truncate">
        <div className="w-8 h-8 flex items-center justify-center shrink-0 relative">
          {imgStatus !== "loaded" && (
            <Tv className={`w-4 h-4 text-zinc-500 ${imgStatus === "loading" ? "animate-pulse" : ""}`} />
          )}

          {channel.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={channel.logo}
              alt={displayName}
              onLoad={() => setImgStatus("loaded")}
              onError={() => setImgStatus("error")}
              className={`max-h-8 max-w-8 object-contain ${
                imgStatus === "loaded" ? "opacity-100" : "opacity-0 absolute"
              }`}
            />
          )}
        </div>

        <div className="truncate">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-xs truncate">{displayName}</span>
            {isOffline ? (
              <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700/80 text-zinc-400">
                OFFLINE
              </span>
            ) : (
              <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-red-600 text-white">
                LIVE
              </span>
            )}
            {qualityTag && (
              <span className="text-[9px] px-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-300 font-bold">
                {qualityTag}
              </span>
            )}
          </div>
          <span className="text-[10px] text-zinc-400 block truncate">
            {formatCategories(channel.group)}
            {channel.country ? ` • ${channel.country}` : ""}
            {channel.language && channel.language !== "Multi-Audio" ? ` • ${channel.language}` : ""}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-1 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav();
          }}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-purple-300 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-purple-400 text-purple-400" : ""}`} />
        </button>
        {isPlaying && <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping mr-1" />}
      </div>
    </div>
  );
}

export function ChannelDrawer() {
  const router = useRouter();
  const {
    isChannelGuideOpen,
    setIsChannelGuideOpen,
    channels,
    activeChannel,
    setActiveChannel,
    categories,
    favorites,
    toggleFavorite,
    offlineChannelIds,
  } = useIPTV();

  const [filterGroup, setFilterGroup] = useState<string>("All");
  const [guideQuery, setGuideQuery] = useState("");

  if (!isChannelGuideOpen) return null;

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

  const filteredChannels = channels
    .filter((channel) => {
      const channelCategories = splitCategories(channel.group);
      const matchesGroup =
        filterGroup === "All"
          ? true
          : filterGroup === "Favorites"
          ? favorites.includes(channel.id)
          : channelCategories.includes(filterGroup);

      const matchesQuery =
        channel.name.toLowerCase().includes(guideQuery.toLowerCase()) ||
        (channel.country && channel.country.toLowerCase().includes(guideQuery.toLowerCase())) ||
        (channel.group && channel.group.toLowerCase().includes(guideQuery.toLowerCase()));

      return matchesGroup && matchesQuery;
    })
    .sort(compareLiveAndMedia);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full flex flex-col shadow-2xl shadow-black/90 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/70">
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-bold text-white text-base">Live Channel Guide</h3>
              <p className="text-[11px] text-zinc-400">{filteredChannels.length} Channels Available</p>
            </div>
          </div>
          <button
            onClick={() => setIsChannelGuideOpen(false)}
            className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="p-3 border-b border-zinc-800/80 space-y-2 bg-zinc-950">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter channels..."
              value={guideQuery}
              onChange={(e) => setGuideQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Categories Pill Slider */}
          <div className="flex space-x-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setFilterGroup("All")}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterGroup === "All"
                  ? "bg-purple-600 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterGroup("Favorites")}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center space-x-1 whitespace-nowrap transition-colors cursor-pointer ${
                filterGroup === "Favorites"
                  ? "bg-purple-600 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <Heart className="w-3 h-3 fill-current" />
              <span>Favorites ({favorites.length})</span>
            </button>

            {categories
              .filter((c) => c !== "All" && c !== "Favorites")
              .map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterGroup(cat)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    filterGroup === cat
                      ? "bg-purple-600 text-white"
                      : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
          </div>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredChannels.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              No matching live channels found.
            </div>
          ) : (
            filteredChannels.map((ch) => (
              <DrawerChannelItem
                key={ch.id}
                channel={ch}
                isPlaying={activeChannel?.id === ch.id}
                isFav={favorites.includes(ch.id)}
                isOffline={offlineChannelIds.has(ch.id)}
                onSelect={() => {
                  setActiveChannel(ch);
                  setIsChannelGuideOpen(false);
                  const channelSlug = getChannelSlug(ch);
                  router.push(`/watch/${channelSlug}`);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onToggleFav={() => toggleFavorite(ch.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
