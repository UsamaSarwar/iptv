"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { IPTVChannel } from "@/types/iptv";
import { useIPTV, formatCategories, formatChannelDisplayName } from "@/context/iptv-context";
import { getChannelSlug } from "@/lib/seo";
import { Play, Info, Heart, ChevronLeft, ChevronRight, X, Tag, Globe, Radio, Tv } from "lucide-react";
import Link from "next/link";

interface HeroBillboardProps {
  channel?: IPTVChannel;
  channels?: IPTVChannel[];
}

export function HeroBillboard({ channel, channels }: HeroBillboardProps) {
  const { setActiveChannel, toggleFavorite, favorites } = useIPTV();

  // Filter for channels with valid cover backdrops or logos
  const channelList = useMemo(() => {
    const list = channels && channels.length > 0 ? channels : channel ? [channel] : [];
    return list.filter((c) => Boolean((c.backdrop && c.backdrop.trim()) || (c.logo && c.logo.trim())));
  }, [channels, channel]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timerResetKey, setTimerResetKey] = useState(0);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const activeIndex = currentIndex % Math.max(1, channelList.length);
  const currentChannel = channelList[activeIndex];

  const goToIndex = useCallback((nextIdx: number) => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex(nextIdx);
      setIsFading(false);
    }, 120);
    setTimerResetKey((k) => k + 1);
  }, []);

  const handleSelectIndex = useCallback(
    (idx: number) => {
      if (idx === activeIndex) return;
      goToIndex(idx);
    },
    [activeIndex, goToIndex]
  );

  const handleNext = useCallback(() => {
    if (channelList.length <= 1) return;
    goToIndex((currentIndex + 1) % channelList.length);
  }, [channelList.length, currentIndex, goToIndex]);

  const handlePrev = useCallback(() => {
    if (channelList.length <= 1) return;
    goToIndex((currentIndex - 1 + channelList.length) % channelList.length);
  }, [channelList.length, currentIndex, goToIndex]);

  // Touch swipe gesture handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      setIsPaused(false);
      if (touchStartXRef.current === null || touchStartYRef.current === null) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartXRef.current;
      const deltaY = touchEndY - touchStartYRef.current;

      touchStartXRef.current = null;
      touchStartYRef.current = null;

      // Minimum swipe threshold of 40px with horizontal swipe intent dominance
      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        if (deltaX < 0) {
          // Swipe Left -> Next
          handleNext();
        } else {
          // Swipe Right -> Prev
          handlePrev();
        }
      }
    },
    [handleNext, handlePrev]
  );

  const handleTouchCancel = useCallback(() => {
    setIsPaused(false);
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  }, []);

  // 5-second automatic rotation timer
  useEffect(() => {
    if (isPaused || channelList.length <= 1) return;

    const timer = setInterval(() => {
      goToIndex((currentIndex + 1) % channelList.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, channelList.length, timerResetKey, goToIndex]);

  if (!currentChannel) return null;

  const isFav = favorites.includes(currentChannel.id);
  const heroImage = currentChannel.backdrop || currentChannel.logo;
  const channelSlug = getChannelSlug(currentChannel);
  const { displayName, qualityTag } = formatChannelDisplayName(
    currentChannel.name,
    currentChannel.quality
  );

  return (
    <div
      suppressHydrationWarning
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      className="group/hero relative w-full h-[58vh] sm:h-[70vh] min-h-110 sm:min-h-125 max-h-187.5 overflow-hidden select-none touch-pan-y"
    >
      {/* Background Hero Banner with Deep Purple Vignette Overlays & Smooth Fade */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out scale-105 ${
          isFading ? "opacity-30" : "opacity-100"
        }`}
        style={{ backgroundImage: `url('${heroImage}')` }}
      >
        {/* Layered Netflix-style Vignette & Gradients */}
        <div className="absolute inset-0 bg-linear-to-r from-[#09090b] via-[#09090b]/85 to-transparent w-full md:w-3/4 z-10" />
        <div className="absolute inset-0 bg-linear-to-t from-[#09090b] via-transparent to-[#09090b]/70 z-10" />
        <div className="absolute inset-0 bg-purple-950/10 mix-blend-overlay z-10" />
      </div>

      {/* Featured Channel Meta Content with Transition Fade */}
      <div
        className={`relative z-20 w-full px-6 sm:px-12 lg:px-16 xl:px-20 h-full flex flex-col justify-center pt-20 sm:pt-6 pb-20 sm:pb-8 transition-opacity duration-500 ease-in-out ${
          isFading ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
        }`}
      >
        <div className="max-w-2xl space-y-3 sm:space-y-4">
          {/* Live & Badge Indicators */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-y-1">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase bg-red-600/90 text-white shadow-lg">
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-white animate-live-pulse" />
              <span>LIVE NOW</span>
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-zinc-900/80 border border-zinc-700/80 text-zinc-200">
              {formatCategories(currentChannel.group)}
            </span>

            {qualityTag && (
              <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-zinc-800 border border-zinc-700 text-zinc-300">
                {qualityTag}
              </span>
            )}

            {currentChannel.country && (
              <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider bg-zinc-900/80 border border-zinc-700 text-purple-300">
                {currentChannel.country}
              </span>
            )}
          </div>

          {/* Channel Name */}
          <h1 className="text-2.5xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-md leading-[1.2] sm:leading-[1.2] pb-1.5 line-clamp-2">
            {displayName}
          </h1>

          {/* Description */}
          <p className="text-xs sm:text-base text-zinc-300 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow">
            {currentChannel.description ||
              `Watch ${displayName} live broadcast in HD quality on IPTV.`}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 pt-1 sm:pt-2">
            {/* Watch Live Button with dynamic route */}
            <Link
              href={`/watch/${channelSlug}/`}
              onClick={() => {
                setActiveChannel(currentChannel);
                window.scrollTo({ top: 0, behavior: "instant" });
              }}
              className="flex items-center space-x-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-base shadow-xl hover:shadow-purple-500/40 transition-all duration-200 cursor-pointer transform hover:scale-105 active:scale-95 shrink-0"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white" />
              <span>Watch Live</span>
            </Link>

            {/* Favorite Toggle */}
            <button
              type="button"
              onClick={() => toggleFavorite(currentChannel.id)}
              className={`p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0 aspect-square ${
                isFav
                  ? "bg-purple-600/30 border-purple-500 text-purple-300"
                  : "bg-black/40 hover:bg-black/70 border-zinc-700/60 text-white hover:border-purple-400"
              }`}
              title={isFav ? "Remove from Favorites" : "Add to Favorites"}
              aria-label={isFav ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform active:scale-125 ${
                  isFav ? "fill-purple-400 text-purple-400" : ""
                }`}
              />
            </button>

            {/* Channel Information Modal Button */}
            <button
              type="button"
              onClick={() => setIsInfoModalOpen(true)}
              className="p-2.5 sm:p-3 rounded-xl bg-black/40 hover:bg-black/70 border border-zinc-700/60 hover:border-purple-400 text-white transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0 aspect-square"
              title="Channel Information"
              aria-label="Channel Information"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300 hover:text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Minimalist Bottom Slide Navigation Capsule (Hidden on Mobile, Displayed on Desktop/Tablet) */}
      {channelList.length > 1 && (
        <div className="hidden sm:flex absolute right-4 sm:right-8 bottom-5 sm:bottom-6 z-50 pointer-events-auto items-center bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/10 px-2 py-1 rounded-full transition-colors shadow-lg">
          {/* Previous Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePrev();
            }}
            className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer flex items-center justify-center"
            title="Previous channel"
            aria-label="Previous channel"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Dots Indicator with accessible click hitboxes */}
          <div className="flex items-center px-1">
            {channelList.slice(0, 10).map((ch, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  type="button"
                  key={ch.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectIndex(idx);
                  }}
                  className="p-1.5 flex items-center justify-center cursor-pointer group/dot"
                  title={ch.name}
                  aria-label={`Go to ${ch.name}`}
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? "w-4 bg-purple-500 shadow-xs"
                        : "w-1.5 bg-white/30 group-hover/dot:bg-white/70"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNext();
            }}
            className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer flex items-center justify-center"
            title="Next channel"
            aria-label="Next channel"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Relevant Channel Information Modal */}
      {isInfoModalOpen && currentChannel && (
        <div
          onClick={() => setIsInfoModalOpen(false)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-5 sm:p-6 text-white space-y-4 animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 flex items-center justify-center shrink-0 relative bg-zinc-900 rounded-xl border border-zinc-800 p-1">
                  {currentChannel.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentChannel.logo}
                      alt={displayName}
                      className="max-h-10 max-w-10 object-contain drop-shadow-sm"
                    />
                  ) : (
                    <Tv className="w-6 h-6 text-zinc-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-white">{displayName}</h3>
                    {qualityTag && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 border border-zinc-700/60 text-zinc-300">
                        {qualityTag}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 font-medium">{currentChannel.network || "Live Broadcast"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInfoModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
              {currentChannel.description || `Stream ${displayName} live online in HD quality on IPTV.`}
            </p>

            {/* Metadata Badges Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                <Tag className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-gray-400 block">Category</span>
                  <span className="font-medium truncate block">{formatCategories(currentChannel.group)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                <Globe className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-gray-400 block">Country</span>
                  <span className="font-medium truncate block">{currentChannel.country || "Global Broadcast"}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                <Radio className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-gray-400 block">Language</span>
                  <span className="font-medium truncate block">{currentChannel.language || "Multi-Audio"}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                <Tv className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-gray-400 block">Quality</span>
                  <span className="font-medium text-emerald-400 block">{qualityTag || "HD"}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-3">
              <Link
                href={`/watch/${channelSlug}/`}
                onClick={() => {
                  setActiveChannel(currentChannel);
                  setIsInfoModalOpen(false);
                  window.scrollTo({ top: 0, behavior: "instant" });
                }}
                className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Watch Live Now</span>
              </Link>
              <button
                type="button"
                onClick={() => toggleFavorite(currentChannel.id)}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
                  isFav
                    ? "bg-purple-600/20 border-purple-500/40 text-purple-300"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
                title={isFav ? "Remove Favorite" : "Add Favorite"}
              >
                <Heart className={`w-4 h-4 ${isFav ? "fill-purple-400 text-purple-400" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
