"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { IPTVChannel } from "@/types/iptv";
import { ChannelCard } from "./channel-card";
import { useIPTV } from "@/context/iptv-context";
import { ChevronLeft, ChevronRight, ArrowRight, Loader2 } from "lucide-react";

interface ChannelRowProps {
  title: string;
  channels: IPTVChannel[];
  subtitle?: string;
}

const CHUNK_SIZE = 20;

export function ChannelRow({ title, channels, subtitle }: ChannelRowProps) {
  const { setSelectedCategory } = useIPTV();
  const rowRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Progressive auto-loading: render 20 channels initially, load next 20 as user scrolls near end
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);

  const displayChannels = useMemo(() => {
    return channels.slice(0, visibleCount);
  }, [channels, visibleCount]);

  const hasMore = visibleCount < channels.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => {
      if (prev >= channels.length) return prev;
      return Math.min(prev + CHUNK_SIZE, channels.length);
    });
  }, [channels.length]);

  const checkScrollability = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // Allow slight tolerance (2px)
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2 || hasMore);

    // Auto-load next batch when user scrolls near the end (within 360px)
    if (scrollLeft + clientWidth >= scrollWidth - 360) {
      loadMore();
    }
  }, [hasMore, loadMore]);

  // Sentinel intersection observer for silky-smooth edge loading
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = rowRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { root: container, rootMargin: "0px 300px 0px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, displayChannels.length]);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    checkScrollability();

    el.addEventListener("scroll", checkScrollability, { passive: true });
    window.addEventListener("resize", checkScrollability);

    return () => {
      el.removeEventListener("scroll", checkScrollability);
      window.removeEventListener("resize", checkScrollability);
    };
  }, [displayChannels, checkScrollability]);

  if (!channels || channels.length === 0) return null;

  const handleScroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      if (direction === "right" && hasMore) {
        loadMore();
      }
      const scrollAmount = direction === "left" ? -480 : 480;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkScrollability, 350);
    }
  };

  const handleOpenCategory = () => {
    if (title === "Continue Watching") return;
    setSelectedCategory(title);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="relative group/row my-6 sm:my-8 px-4 sm:px-6 lg:px-8">
      {/* Row Header */}
      <div className="flex items-baseline justify-between mb-3">
        <button
          type="button"
          onClick={handleOpenCategory}
          className="flex items-center space-x-2 text-left cursor-pointer group/title select-none"
        >
          <div className="w-1.5 h-4 sm:h-5 bg-purple-500 rounded-full shadow-sm shadow-purple-500" />
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white group-hover/title:text-purple-300 transition-colors">
            {title}
          </h2>
          <span className="text-xs font-semibold text-purple-400/70 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/40">
            {channels.length}
          </span>
          {title !== "Continue Watching" && (
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover/title:text-purple-400 group-hover/title:translate-x-1 transition-all opacity-0 group-hover/row:opacity-100 hidden sm:inline" />
          )}
        </button>

        {subtitle && <span className="text-xs text-gray-400 hidden sm:inline">{subtitle}</span>}
      </div>

      {/* Scrollable Container with Navigation Chevrons */}
      <div className="relative">
        {/* Left Scroll Button - only renders when can scroll left */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-30 w-10 h-10 rounded-full bg-black/85 hover:bg-purple-600 border border-purple-500/40 text-white flex items-center justify-center shadow-2xl opacity-0 group-hover/row:opacity-100 transition-all duration-300 cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Channels List */}
        <div
          ref={rowRef}
          className="flex space-x-3 sm:space-x-4 overflow-x-auto no-scrollbar py-4 -my-2 px-1.5 scroll-smooth items-center"
        >
          {displayChannels.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} />
          ))}

          {/* Invisible Sentinel Element to trigger smooth pre-fetching */}
          {hasMore && (
            <div ref={sentinelRef} className="flex-none w-8 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-purple-500/40 animate-spin" />
            </div>
          )}

          {/* View All Card at end of row if category has more than initial chunk */}
          {!hasMore && channels.length > CHUNK_SIZE && title !== "Continue Watching" && (
            <button
              type="button"
              onClick={handleOpenCategory}
              className="flex-none w-48 sm:w-56 min-h-34 rounded-xl border border-dashed border-zinc-700/80 hover:border-purple-500 bg-zinc-900/40 hover:bg-zinc-800/60 p-4 flex flex-col items-center justify-center space-y-2 text-center text-zinc-400 hover:text-white transition-all cursor-pointer group/more select-none"
            >
              <div className="w-10 h-10 rounded-full bg-purple-950/60 border border-purple-700/50 flex items-center justify-center text-purple-300 group-hover/more:scale-110 group-hover/more:bg-purple-600 group-hover/more:text-white transition-all">
                <ArrowRight className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-zinc-200 group-hover/more:text-purple-300">
                View All {channels.length}
              </span>
              <span className="text-[11px] text-zinc-500">
                Browse full &quot;{title}&quot; catalog
              </span>
            </button>
          )}
        </div>

        {/* Right Scroll Button - only renders when can scroll right */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-30 w-10 h-10 rounded-full bg-black/85 hover:bg-purple-600 border border-purple-500/40 text-white flex items-center justify-center shadow-2xl opacity-0 group-hover/row:opacity-100 transition-all duration-300 cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
