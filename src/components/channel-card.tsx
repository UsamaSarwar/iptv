"use client";

import React, { useState } from "react";
import { IPTVChannel } from "@/types/iptv";
import { useIPTV, formatCategories, formatChannelDisplayName } from "@/context/iptv-context";
import { getChannelSlug } from "@/lib/seo";
import { Play, Heart, Tv } from "lucide-react";
import Link from "next/link";

interface ChannelCardProps {
  channel: IPTVChannel;
  isGrid?: boolean;
}

export function ChannelCard({ channel, isGrid = false }: ChannelCardProps) {
  const {
    setActiveChannel,
    toggleFavorite,
    favorites,
    activeChannel,
    offlineChannelIds,
  } = useIPTV();
  const isFav = favorites.includes(channel.id);
  const isCurrentlyPlaying = activeChannel?.id === channel.id;
  const isOffline = offlineChannelIds.has(channel.id);

  const [imgStatus, setImgStatus] = useState<"loading" | "loaded" | "error">(
    channel.logo ? "loading" : "error"
  );
  const { displayName, qualityTag } = formatChannelDisplayName(channel.name, channel.quality);

  const channelSlug = getChannelSlug(channel);

  // Clean neutral dark card background
  const cardGradient =
    "linear-gradient(145deg, rgba(24, 24, 27, 0.7) 0%, rgba(14, 14, 16, 0.95) 100%)";

  return (
    <Link
      href={`/watch/${channelSlug}/`}
      onClick={() => {
        setActiveChannel(channel);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:z-30 hover:shadow-2xl hover:shadow-black/80 bg-zinc-900/60 border border-zinc-800/80 hover:border-purple-500/50 p-4 flex flex-col justify-between select-none ${
        isGrid ? "w-full min-h-34" : "flex-none w-64 sm:w-72 md:w-80 min-h-34"
      }`}
      style={{
        background: cardGradient,
      }}
    >
      {/* Background Graphic: Explicit Backdrop or Logo as ambient cover */}
      {channel.backdrop ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
          style={{ backgroundImage: `url('${channel.backdrop}')` }}
        />
      ) : channel.logo ? (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Ambient enlarged watermark backdrop of channel logo */}
          <div
            className="absolute -right-4 -bottom-4 w-32 h-32 bg-contain bg-center bg-no-repeat opacity-[0.06] group-hover:opacity-[0.16] group-hover:scale-110 filter blur-[0.5px] transition-all duration-500"
            style={{ backgroundImage: `url('${channel.logo}')` }}
          />
          <div className="absolute inset-0 bg-linear-to-br from-zinc-800/10 via-transparent to-black/40 pointer-events-none" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-zinc-800/10 via-transparent to-black/40 pointer-events-none" />
      )}

      {/* Currently Playing Ring */}
      {isCurrentlyPlaying && (
        <div className="absolute inset-0 border-2 border-purple-500 rounded-xl z-20 pointer-events-none shadow-[inset_0_0_15px_rgba(139,92,246,0.3)]" />
      )}

      {/* Top Row: Channel Logo, Clean Display Name, and Category Info */}
      <div className="relative z-10 flex items-start justify-between space-x-3">
        <div className="flex items-center space-x-3 min-w-0">
          {/* Natural logo without rigid square wrapper to seamlessly support all aspect ratios */}
          <div className="w-12 h-10 flex items-center justify-center shrink-0 relative">
            {imgStatus !== "loaded" && (
              <Tv
                className={`w-6 h-6 text-zinc-500 ${
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
                className={`max-h-10 max-w-12 object-contain drop-shadow-md filter brightness-110 transition-transform duration-200 group-hover:scale-105 ${
                  imgStatus === "loaded" ? "opacity-100" : "opacity-0 absolute"
                }`}
              />
            )}
          </div>

          <div className="min-w-0">
            <h3
              className="text-sm font-bold text-zinc-100 truncate group-hover:text-purple-300 transition-colors"
              title={displayName}
            >
              {displayName}
            </h3>
            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
              {formatCategories(channel.group)}
              {channel.country ? ` • ${channel.country}` : ""}
              {channel.language && channel.language !== "Multi-Audio"
                ? ` • ${channel.language}`
                : ""}
            </p>
          </div>
        </div>

        {/* Favorite Action Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(channel.id);
          }}
          className="p-1.5 rounded-full hover:bg-zinc-800 text-white transition-colors shrink-0 cursor-pointer"
          title={isFav ? "Remove Favorite" : "Add Favorite"}
        >
          <Heart
            className={`w-4 h-4 ${
              isFav ? "fill-purple-400 text-purple-400" : "text-zinc-500 hover:text-purple-300"
            }`}
          />
        </button>
      </div>

      {/* Bottom Row: Stream Badges and Play Button */}
      <div className="relative z-10 flex items-center justify-between mt-3.5 pt-2.5 border-t border-zinc-800/60">
        <div className="flex items-center space-x-1.5 min-w-0">
          {isOffline ? (
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-zinc-800/90 border border-zinc-700/80 text-zinc-400 shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              <span>OFFLINE</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-red-600 text-white shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>LIVE</span>
            </span>
          )}

          {qualityTag && (
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-zinc-800 border border-zinc-700 text-zinc-300">
              {qualityTag}
            </span>
          )}
        </div>

        {/* Play Action Trigger */}
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-zinc-400 group-hover:text-white transition-colors">
          <span className="text-xs font-medium hidden sm:inline group-hover:inline transition-opacity">
            Watch
          </span>
          <div className="w-7 h-7 rounded-full bg-zinc-800 group-hover:bg-purple-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-all shrink-0">
            <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
