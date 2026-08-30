/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Hls from "hls.js";
import { useIPTV, formatCategories, splitCategories, formatChannelDisplayName, normalizeResolutionTag } from "@/context/iptv-context";
import { IPTVChannel } from "@/types/iptv";
import { useRouter } from "next/navigation";
import { getChannelSlug } from "@/lib/seo";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  X,
  SkipForward,
  SkipBack,
  Heart,
  Tv,
  List,
  AlertCircle,
  RefreshCw,
  Info,
  Globe,
  MapPin,
  Tag,
  Video,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity,
  Share2,
  Check,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Languages,
  PictureInPicture2,
  Timer,
  Moon,
  Hash,
} from "lucide-react";

function SidebarChannelItem({
  item,
  isActive,
  isOffline,
  activeCountry,
  isFav,
  onToggleFav,
  onSelect,
}: {
  item: IPTVChannel;
  isActive: boolean;
  isOffline: boolean;
  activeCountry?: string;
  isFav: boolean;
  onToggleFav: (e: React.MouseEvent) => void;
  onSelect: () => void;
}) {
  const [imgStatus, setImgStatus] = useState<"loading" | "loaded" | "error">(
    item.logo ? "loading" : "error"
  );
  const { displayName, qualityTag } = formatChannelDisplayName(item.name, item.quality);

  return (
    <div
      onClick={onSelect}
      className={`group flex items-center justify-between space-x-3 p-2.5 rounded-xl transition-all duration-200 cursor-pointer border ${
        isActive
          ? "bg-zinc-800/90 border-purple-500/60 shadow-md"
          : "bg-zinc-900/70 hover:bg-zinc-800/80 border-zinc-800/80 hover:border-zinc-700"
      }`}
    >
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        {/* Natural Logo without Wrapper Box */}
        <div className="w-11 h-9 flex items-center justify-center shrink-0 relative">
          {imgStatus !== "loaded" && (
            <Tv className="w-5 h-5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
          )}
          {item.logo && (
            <img
              src={item.logo}
              alt={displayName}
              onLoad={() => setImgStatus("loaded")}
              onError={() => setImgStatus("error")}
              className={`max-h-9 max-w-11 object-contain drop-shadow-sm transition-transform group-hover:scale-105 ${
                imgStatus === "loaded" ? "opacity-100" : "opacity-0 absolute"
              }`}
            />
          )}
        </div>

        {/* Metadata */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-1.5">
            <h4 className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
              {displayName}
            </h4>
          </div>
          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
            {formatCategories(item.group)} • {item.country || "Global"}
            {item.language ? ` • ${item.language}` : ""}
          </p>
          <div className="flex items-center space-x-1 mt-1 flex-wrap gap-1">
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
              <span className="text-[8px] font-semibold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                {qualityTag}
              </span>
            )}
            {item.country && activeCountry && item.country.toLowerCase() === activeCountry.toLowerCase() && (
              <span className="text-[8px] font-medium px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                {item.country}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Favorite Button on Right */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFav(e);
        }}
        className={`p-2 rounded-lg transition-all cursor-pointer shrink-0 flex items-center justify-center ${
          isFav
            ? "text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20"
            : "text-zinc-500 hover:text-white hover:bg-zinc-800"
        }`}
        title={isFav ? "Remove from Favorites" : "Add to Favorites"}
        aria-label={isFav ? "Remove from Favorites" : "Add to Favorites"}
      >
        <Heart
          className={`w-4 h-4 transition-transform active:scale-125 ${
            isFav ? "fill-purple-400 text-purple-400" : ""
          }`}
        />
      </button>
    </div>
  );
}

interface VideoPlayerProps {
  channel?: IPTVChannel | null;
}

export function VideoPlayer({ channel }: VideoPlayerProps = {}) {
  const router = useRouter();
  const {
    activeChannel: contextActiveChannel,
    setActiveChannel,
    isPlaying,
    setIsPlaying,
    toggleFavorite,
    favorites,
    playNextChannel,
    playPrevChannel,
    setIsChannelGuideOpen,
    markChannelOffline,
    markChannelVerifiedLive,
    offlineChannelIds,
    channels,
  } = useIPTV();

  const activeChannel = channel || contextActiveChannel || null;

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedLogoUrls, setFailedLogoUrls] = useState<Set<string>>(() => new Set());
  const [detectedResolution, setDetectedResolution] = useState<string | null>(null);
  const [isInfoExpanded, setIsInfoExpanded] = useState(true);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [bufferAhead, setBufferAhead] = useState<number>(0);
  const [bufferMode, setBufferMode] = useState<"smooth" | "low-latency">("smooth");
  const [hasFetchedFrame, setHasFetchedFrame] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState<"all" | "category" | "country" | "language">("all");
  const [isPipAvailable] = useState<boolean>(() => {
    if (typeof document !== "undefined") {
      return Boolean(document.pictureInPictureEnabled);
    }
    return false;
  });
  const [, setIsPipActive] = useState(false);
  const [sleepTimerDeadline, setSleepTimerDeadline] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = useCallback(() => {
    setErrorMessage(null);
    setIsLoading(true);
    setHasFetchedFrame(false);
    setRetryCount((prev) => prev + 1);
  }, []);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const playerWrapperRef = useRef<HTMLDivElement>(null);

  const isFav = activeChannel ? favorites.includes(activeChannel.id) : false;
  const hasValidLogo = Boolean(activeChannel?.logo && !failedLogoUrls.has(activeChannel.logo));

  // Smooth scroll video player into direct viewport view whenever active channel changes
  useEffect(() => {
    if (activeChannel && typeof window !== "undefined") {
      playerWrapperRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeChannel]);

  // Synchronize fullscreen state with browser events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Keep URL in sync with active channel
  useEffect(() => {
    if (activeChannel) {
      const channelSlug = getChannelSlug(activeChannel);
      if (!window.location.pathname.startsWith(`/watch/${channelSlug}`)) {
        window.history.replaceState(null, "", `/watch/${channelSlug}`);
      }
    }
  }, [activeChannel]);

  // Picture in picture handler
  const togglePip = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
      } else {
        await videoRef.current.requestPictureInPicture();
        setIsPipActive(true);
      }
    } catch (err) {
      console.warn("PiP error:", err);
    }
  }, []);

  const startSleepTimer = useCallback((mins: number) => {
    const deadline = Date.now() + mins * 60 * 1000;
    setSleepTimerDeadline(deadline);
    setSleepTimerRemaining(mins * 60);
    setIsSleepModalOpen(false);
  }, []);

  const cancelSleepTimer = useCallback(() => {
    setSleepTimerDeadline(null);
    setSleepTimerRemaining(null);
    setIsSleepModalOpen(false);
  }, []);

  // Sleep Timer countdown & auto-stop effect
  useEffect(() => {
    if (!sleepTimerDeadline) return;

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.round((sleepTimerDeadline - Date.now()) / 1000));
      setSleepTimerRemaining(diff);

      if (diff <= 0) {
        clearInterval(interval);
        if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
        setActiveChannel(null);
        setSleepTimerDeadline(null);
        setSleepTimerRemaining(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerDeadline, setActiveChannel, setIsPlaying]);

  // Format sleep timer display mm:ss
  const formatSleepRemaining = useCallback((seconds: number | null) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }, []);

  // Track video buffer progress in real time
  const updateBufferMetrics = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.buffered || video.buffered.length === 0) {
      setBufferAhead(0);
      return;
    }
    const current = video.currentTime;
    let ahead = 0;
    for (let i = 0; i < video.buffered.length; i++) {
      const start = video.buffered.start(i);
      const end = video.buffered.end(i);
      if (current >= start && current <= end) {
        ahead = end - current;
        break;
      }
    }
    setBufferAhead(Math.max(0, parseFloat(ahead.toFixed(1))));
  }, []);

  // Initialize and attach HLS stream with deep buffering & instant start
  useEffect(() => {
    if (!activeChannel || !videoRef.current) return;

    const video = videoRef.current;
    setIsLoading(true);
    setHasFetchedFrame(false);
    setErrorMessage(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = activeChannel.url;
    setDetectedResolution(null);

    let isStreamResolved = false;

    // Safety watchdog: Allow reasonable buffering time before classifying stream as offline
    const watchdogTimeout = setTimeout(() => {
      if (!isStreamResolved) {
        setIsLoading(false);
        setHasFetchedFrame(false);
        setErrorMessage("Stream is offline or broadcast has no active data.");
        markChannelOffline(activeChannel.id);
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      }
    }, 12000);

    const updateDimensions = () => {
      if (video.videoWidth && video.videoHeight) {
        const h = video.videoHeight;
        if (h >= 2160) setDetectedResolution("4K");
        else if (h >= 1080) setDetectedResolution("1080p");
        else if (h >= 720) setDetectedResolution("720p");
        else if (h >= 576) setDetectedResolution("576p");
        else if (h >= 480) setDetectedResolution("480p");
        else if (h >= 360) setDetectedResolution("360p");
        else if (h > 0) setDetectedResolution(`${h}p`);
      }
    };

    const handleFirstFrame = () => {
      isStreamResolved = true;
      clearTimeout(watchdogTimeout);
      setHasFetchedFrame(true);
      setIsLoading(false);
      setErrorMessage(null);
      markChannelVerifiedLive(activeChannel.id);
    };

    video.addEventListener("loadedmetadata", updateDimensions);
    video.addEventListener("loadeddata", handleFirstFrame);
    video.addEventListener("canplay", handleFirstFrame);
    video.addEventListener("resize", updateDimensions);
    video.addEventListener("progress", updateBufferMetrics);
    video.addEventListener("timeupdate", updateBufferMetrics);

    let isEffectCleanedUp = false;

    if (Hls.isSupported()) {
      const isSmooth = bufferMode === "smooth";
      const hls = new Hls({
        enableWorker: true,
        progressive: true,
        startFragPrefetch: true,
        capLevelToPlayerSize: true,
        backBufferLength: isSmooth ? 60 : 20,
        maxBufferLength: isSmooth ? 60 : 30,
        maxMaxBufferLength: isSmooth ? 120 : 60,
        maxBufferSize: isSmooth ? 80 * 1000 * 1000 : 40 * 1000 * 1000,
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 5,
        liveSyncDurationCount: isSmooth ? 4 : 3,
        liveMaxLatencyDurationCount: isSmooth ? 10 : 6,
        liveDurationInfinity: true,
        enableSoftwareAES: true,
        lowLatencyMode: !isSmooth,
        abrEwmaFastLive: 1.5,
        abrEwmaSlowLive: 6.0,
        abrBandWidthFactor: 0.9,
        abrBandWidthUpFactor: 0.7,
        fragLoadingTimeOut: 8000,
        manifestLoadingTimeOut: 8000,
        fragLoadingMaxRetry: 2,
        manifestLoadingMaxRetry: 2,
        fragLoadingRetryDelay: 500,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      const attemptPlay = () => {
        if (isEffectCleanedUp) return;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (!isEffectCleanedUp) {
                setIsPlaying(true);
              }
            })
            .catch((err: unknown) => {
              if (isEffectCleanedUp) return;
              // Ignore AbortError caused by normal pause or channel switches
              if (err instanceof Error && err.name === "AbortError") {
                return;
              }
              // Only fallback to muted autoplay on NotAllowedError (browser autoplay policy)
              if (err instanceof Error && err.name === "NotAllowedError") {
                video.muted = true;
                setIsMuted(true);
                video
                  .play()
                  .then(() => {
                    if (!isEffectCleanedUp) {
                      setIsPlaying(true);
                    }
                  })
                  .catch((mutedErr: unknown) => {
                    if (mutedErr instanceof Error && mutedErr.name === "AbortError") {
                      return;
                    }
                    setIsPlaying(false);
                  });
              } else {
                setIsPlaying(false);
              }
            });
        }
      };

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        if (data.levels && data.levels.length > 0) {
          const firstLevel = data.levels[data.firstLevel || 0];
          if (firstLevel && firstLevel.height) {
            const h = firstLevel.height;
            if (h >= 2160) setDetectedResolution("4K");
            else if (h >= 1080) setDetectedResolution("1080p");
            else if (h >= 720) setDetectedResolution("720p");
            else if (h >= 576) setDetectedResolution("576p");
            else if (h >= 480) setDetectedResolution("480p");
            else if (h >= 360) setDetectedResolution("360p");
            else setDetectedResolution(`${h}p`);
          }
        }
        attemptPlay();
      });

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        isStreamResolved = true;
        clearTimeout(watchdogTimeout);
        setHasFetchedFrame(true);
        setIsLoading(false);
        setErrorMessage(null);
        markChannelVerifiedLive(activeChannel.id);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = hls.levels[data.level];
        if (level && level.height) {
          const h = level.height;
          if (h >= 2160) setDetectedResolution("4K");
          else if (h >= 1080) setDetectedResolution("1080p");
          else if (h >= 720) setDetectedResolution("720p");
          else if (h >= 576) setDetectedResolution("576p");
          else if (h >= 480) setDetectedResolution("480p");
          else if (h >= 360) setDetectedResolution("360p");
          else setDetectedResolution(`${h}p`);
        }
      });

      hls.on(Hls.Events.BUFFER_APPENDED, updateBufferMetrics);

      let consecutiveErrors = 0;

      hls.on(Hls.Events.ERROR, (event, data) => {
        consecutiveErrors += 1;
        const code = data.response?.code;
        if (code === 403 || code === 404 || code === 500 || code === 502 || code === 503 || consecutiveErrors >= 2) {
          isStreamResolved = true;
          clearTimeout(watchdogTimeout);
          setHasFetchedFrame(false);
          setIsLoading(false);
          setErrorMessage(code ? `Stream error (HTTP ${code}).` : "Stream is offline or unavailable.");
          markChannelOffline(activeChannel.id);
          hls.destroy();
          return;
        }
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              isStreamResolved = true;
              clearTimeout(watchdogTimeout);
              setHasFetchedFrame(false);
              setIsLoading(false);
              setErrorMessage("Stream unreachable.");
              markChannelOffline(activeChannel.id);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      const attemptNativePlay = () => {
        if (isEffectCleanedUp) return;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (!isEffectCleanedUp) setIsPlaying(true);
            })
            .catch((err: unknown) => {
              if (isEffectCleanedUp) return;
              if (err instanceof Error && err.name === "AbortError") return;
              if (err instanceof Error && err.name === "NotAllowedError") {
                video.muted = true;
                setIsMuted(true);
                video
                  .play()
                  .then(() => {
                    if (!isEffectCleanedUp) setIsPlaying(true);
                  })
                  .catch((mutedErr: unknown) => {
                    if (mutedErr instanceof Error && mutedErr.name === "AbortError") return;
                    setIsPlaying(false);
                  });
              } else {
                setIsPlaying(false);
              }
            });
        }
      };
      video.addEventListener("loadedmetadata", attemptNativePlay);
      const handleNativeError = () => {
        isStreamResolved = true;
        clearTimeout(watchdogTimeout);
        setIsLoading(false);
        setHasFetchedFrame(false);
        setErrorMessage("Native stream playback failed.");
        markChannelOffline(activeChannel.id);
      };
      video.addEventListener("error", handleNativeError);
    }

    return () => {
      isEffectCleanedUp = true;
      clearTimeout(watchdogTimeout);
      video.removeEventListener("loadedmetadata", updateDimensions);
      video.removeEventListener("loadeddata", handleFirstFrame);
      video.removeEventListener("canplay", handleFirstFrame);
      video.removeEventListener("resize", updateDimensions);
      video.removeEventListener("progress", updateBufferMetrics);
      video.removeEventListener("timeupdate", updateBufferMetrics);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeChannel, bufferMode, retryCount, setIsPlaying, markChannelOffline, markChannelVerifiedLive, updateBufferMetrics]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [setIsPlaying]);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    videoRef.current.muted = nextMute;
    if (!nextMute && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  }, [isMuted, volume]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  }, []);

  const handlePlayerTouchEnd = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_GAP = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_GAP) {
      e.preventDefault();
      toggleFullscreen();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying && !isInfoModalOpen) setShowControls(false);
      }, 5000);
    }
  }, [toggleFullscreen, isPlaying, isInfoModalOpen]);

  const handlePlayerDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    toggleFullscreen();
  }, [toggleFullscreen]);

  const handleMouseMove = useCallback(() => {
    if (isInfoModalOpen) return;
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isInfoModalOpen) setShowControls(false);
    }, 5000);
  }, [isInfoModalOpen, isPlaying]);

  const handleMouseEnter = useCallback(() => {
    if (isInfoModalOpen) return;
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isInfoModalOpen) setShowControls(false);
    }, 5000);
  }, [isInfoModalOpen, isPlaying]);

  const handleMouseLeave = useCallback(() => {
    if (isInfoModalOpen) return;
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !isFullscreen) {
      setShowControls(false);
    }
  }, [isInfoModalOpen, isPlaying, isFullscreen]);

  const handleClose = useCallback(() => {
    setActiveChannel(null);
    setIsInfoModalOpen(false);
    if (window.location.pathname.startsWith("/watch")) {
      router.push("/");
    }
  }, [setActiveChannel, router]);

  const handleShare = useCallback(() => {
    if (typeof window !== "undefined" && activeChannel) {
      const url = `${window.location.origin}/watch/${getChannelSlug(activeChannel)}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      });
    }
  }, [activeChannel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "]" || e.key === "PageDown") { e.preventDefault(); playNextChannel(); }
      else if (e.key === "ArrowLeft" || e.key === "[" || e.key === "PageUp") { e.preventDefault(); playPrevChannel(); }
      else if (e.key === " " || e.key.toLowerCase() === "k") { e.preventDefault(); togglePlay(); }
      else if (e.key.toLowerCase() === "m") { e.preventDefault(); toggleMute(); }
      else if (e.key.toLowerCase() === "f") { e.preventDefault(); toggleFullscreen(); }
      else if (e.key === "Escape") { e.preventDefault(); if (document.fullscreenElement) document.exitFullscreen().catch(console.error); else handleClose(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playNextChannel, playPrevChannel, togglePlay, toggleMute, toggleFullscreen, handleClose]);

  // Synchronize OS lock screen / control center media controls with MediaSession API
  useEffect(() => {
    if (!activeChannel || typeof window === "undefined" || !("mediaSession" in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activeChannel.name,
        artist: activeChannel.group || "IPTV Live Broadcast",
        album: activeChannel.country || "Live Television",
        artwork: [
          { src: activeChannel.logo || "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: activeChannel.backdrop || "/icon-512.png", sizes: "1920x1080", type: "image/jpeg" },
        ],
      });

      navigator.mediaSession.setActionHandler("play", () => {
        videoRef.current?.play();
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        videoRef.current?.pause();
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        playNextChannel();
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        playPrevChannel();
      });
      navigator.mediaSession.setActionHandler("stop", () => {
        handleClose();
      });
    } catch {
      // ignore
    }

    return () => {
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
        navigator.mediaSession.setActionHandler("stop", null);
      } catch {
        // ignore
      }
    };
  }, [activeChannel, setIsPlaying, playNextChannel, playPrevChannel, handleClose]);

  const {
    sameCategoryChannels,
    sameCountryChannels,
    sameLanguageChannels,
    allRecommendedChannels,
  } = useMemo(() => {
    if (!activeChannel) {
      return {
        sameCategoryChannels: [],
        sameCountryChannels: [],
        sameLanguageChannels: [],
        allRecommendedChannels: [],
      };
    }

    const activeGroups = splitCategories(activeChannel.group);
    const activeCountry = activeChannel.country?.toLowerCase().trim();
    const activeLang = activeChannel.language?.toLowerCase().trim();

    const otherChannels = channels.filter((c) => c.id !== activeChannel.id);

    const compareLiveAndMedia = (a: typeof channels[0], b: typeof channels[0]) => {
      const aOff = offlineChannelIds.has(a.id);
      const bOff = offlineChannelIds.has(b.id);
      if (!aOff && bOff) return -1;
      if (aOff && !bOff) return 1;

      const getMediaTier = (ch: typeof channels[0]) => {
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

    const catMatches = otherChannels
      .filter((c) => splitCategories(c.group).some((g) => activeGroups.includes(g)))
      .sort(compareLiveAndMedia);

    const countryMatches = activeCountry
      ? otherChannels
          .filter((c) => c.country && c.country.toLowerCase().trim() === activeCountry)
          .sort(compareLiveAndMedia)
      : [];

    const langMatches = activeLang
      ? otherChannels
          .filter((c) => c.language && c.language.toLowerCase().trim() === activeLang)
          .sort(compareLiveAndMedia)
      : [];

    // Prioritized ranking: Live + Media Tier + Country match (3 pts) + Category match (2 pts) + Language match (1 pt)
    const ranked = [...otherChannels].sort((a, b) => {
      const liveDiff = compareLiveAndMedia(a, b);
      if (liveDiff !== 0) return liveDiff;

      let scoreA = 0;
      let scoreB = 0;
      if (activeCountry && a.country?.toLowerCase().trim() === activeCountry) scoreA += 3;
      if (activeCountry && b.country?.toLowerCase().trim() === activeCountry) scoreB += 3;
      if (splitCategories(a.group).some((g) => activeGroups.includes(g))) scoreA += 2;
      if (splitCategories(b.group).some((g) => activeGroups.includes(g))) scoreB += 2;
      if (activeLang && a.language?.toLowerCase().trim() === activeLang) scoreA += 1;
      if (activeLang && b.language?.toLowerCase().trim() === activeLang) scoreB += 1;
      return scoreB - scoreA;
    });

    return {
      sameCategoryChannels: catMatches,
      sameCountryChannels: countryMatches,
      sameLanguageChannels: langMatches,
      allRecommendedChannels: ranked.slice(0, 30),
    };
  }, [activeChannel, channels, offlineChannelIds]);

  const displayedSidebarChannels = useMemo(() => {
    switch (sidebarFilter) {
      case "category":
        return sameCategoryChannels;
      case "country":
        return sameCountryChannels;
      case "language":
        return sameLanguageChannels;
      case "all":
      default:
        return allRecommendedChannels;
    }
  }, [
    sidebarFilter,
    sameCategoryChannels,
    sameCountryChannels,
    sameLanguageChannels,
    allRecommendedChannels,
  ]);

  const { displayName: activeDisplayName, qualityTag: activeQualityTag } =
    activeChannel
      ? formatChannelDisplayName(activeChannel.name, activeChannel.quality)
      : { displayName: "", qualityTag: null };

  const activeResolutionBadge =
    detectedResolution || (activeQualityTag ? normalizeResolutionTag(activeQualityTag) : null);

  if (!activeChannel) return null;

  return (
    <div
      ref={playerWrapperRef}
      className={
        isFullscreen
          ? "fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
          : "w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 pt-20 pb-16 scroll-mt-20"
      }
    >
      <div
        className={
          isFullscreen
            ? "w-full h-full"
            : "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        }
      >
        <div
          className={
            isFullscreen
              ? "w-full h-full"
              : "lg:col-span-8 xl:col-span-9 2xl:col-span-9 space-y-3 sm:space-y-4"
          }
        >
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchEnd={handlePlayerTouchEnd}
            onDoubleClick={handlePlayerDoubleClick}
            className={`relative overflow-hidden bg-black select-none group shadow-2xl transition-all duration-300 ${
              isFullscreen
                ? "w-full h-full rounded-none"
                : "w-full aspect-video max-h-[calc(100vh-140px)] rounded-2xl border border-zinc-800 shadow-2xl shadow-black/80"
            }`}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onWaiting={() => setIsLoading(true)}
              onPlaying={() => setIsLoading(false)}
              onClick={togglePlay}
              className="w-full h-full object-contain cursor-pointer"
            />
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 backdrop-blur-[2px] pointer-events-none z-20 transition-all duration-300">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-16 h-16 rounded-full bg-purple-600/30 animate-ping" />
                  <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-full border-3 border-purple-500/20 border-t-purple-500 border-r-purple-400 animate-spin shadow-2xl" />
                  <Tv className="absolute w-5 h-5 text-purple-300 animate-pulse" />
                </div>
                <div className="mt-4 flex flex-col items-center space-y-1">
                  <span className="text-xs sm:text-sm font-bold tracking-wider text-white">
                    {bufferAhead > 0 ? `Buffering Stream...` : "Connecting Stream..."}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {bufferAhead > 0 ? `${bufferAhead}s cached in memory` : "Optimizing ABR & Deep Buffer"}
                  </span>
                </div>
              </div>
            )}
            {errorMessage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 p-4 sm:p-6 text-center z-30">
                <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-red-950/60 border border-red-500/40 flex items-center justify-center mb-3 sm:mb-4">
                  <AlertCircle className="w-7 sm:w-8 h-7 sm:h-8 text-red-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Playback Unavailable</h3>
                <p className="text-xs sm:text-sm text-gray-400 max-w-md mb-5">{errorMessage}</p>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-md"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? "animate-spin" : ""}`} />
                    <span>{isLoading ? "Retrying..." : "Retry"}</span>
                  </button>
                  <button type="button" onClick={playNextChannel} className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer">
                    <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span>Next Channel</span>
                  </button>
                </div>
              </div>
            )}
            {/* Top Video Floating Overlay: Visible on hover / touch, auto-hides after 3s in fullscreen */}
            <div className={`absolute top-0 inset-x-0 p-2.5 sm:p-4 bg-linear-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between z-20 transition-opacity duration-300 pointer-events-none ${showControls || !isPlaying ? "opacity-100" : "opacity-0"}`}>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 pointer-events-auto flex-1 mr-2">
                {/* Live Status Pill */}
                <div className="flex items-center space-x-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shrink-0">
                  {errorMessage ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-xs font-bold text-red-400 tracking-wider">OFFLINE</span>
                    </>
                  ) : hasFetchedFrame ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-live-pulse" />
                      <span className="text-xs font-bold text-white tracking-wider">LIVE</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span className="text-xs font-bold text-amber-300 tracking-wider">CONNECTING</span>
                    </>
                  )}
                </div>

                {/* Channel Title & Info */}
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  {hasValidLogo && activeChannel.logo && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0 relative">
                      <img
                        key={activeChannel.id + "-top-logo"}
                        src={activeChannel.logo}
                        alt={activeDisplayName}
                        onError={() => setFailedLogoUrls((prev) => new Set(prev).add(activeChannel.logo!))}
                        className="max-h-7 max-w-7 sm:max-h-8 sm:max-w-8 object-contain drop-shadow-sm"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-bold text-white block truncate leading-tight">
                      {activeDisplayName}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-zinc-400 block truncate leading-tight">
                      {formatCategories(activeChannel.group)} • {activeChannel.country || "Global"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Action Icons in Top Overlay */}
              <div className="flex items-center space-x-1 sm:space-x-1.5 pointer-events-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSleepModalOpen(true)}
                  className={`p-1.5 sm:p-2 rounded-full backdrop-blur-md border transition-colors cursor-pointer flex items-center space-x-1 ${
                    sleepTimerRemaining
                      ? "bg-purple-600 border-purple-400 text-white shadow-lg"
                      : "bg-black/60 hover:bg-black/80 text-white border-white/10"
                  }`}
                  title={sleepTimerRemaining ? `Sleep timer: ${formatSleepRemaining(sleepTimerRemaining)} remaining` : "Set Sleep Timer"}
                >
                  <Timer className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${sleepTimerRemaining ? "text-white animate-pulse" : "text-gray-300"}`} />
                  {sleepTimerRemaining && <span className="text-[10px] font-mono font-bold pr-0.5">{formatSleepRemaining(sleepTimerRemaining)}</span>}
                </button>

                {isPipAvailable && (
                  <button
                    type="button"
                    onClick={togglePip}
                    className="hidden sm:flex p-1.5 sm:p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                    title="Picture-in-Picture"
                  >
                    <PictureInPicture2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsInfoModalOpen(true)}
                  className="hidden sm:flex p-1.5 sm:p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                  title="Technical Specs"
                >
                  <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsChannelGuideOpen(true)}
                  className="p-1.5 sm:p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                  title="All Channels Guide"
                >
                  <List className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-300 hover:text-white" />
                </button>
              </div>
            </div>

            {/* Bottom Video Floating Overlay: Visible on hover / touch, auto-hides after 3s in fullscreen */}
            <div className={`absolute bottom-0 inset-x-0 p-2.5 sm:p-4 bg-linear-to-t from-black/90 via-black/50 to-transparent z-20 transition-opacity duration-300 pointer-events-none ${showControls || !isPlaying ? "opacity-100" : "opacity-0"}`}>
              <div className="flex items-center justify-between pointer-events-auto">
                <div className="flex items-center space-x-1.5 sm:space-x-3">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); playPrevChannel(); }}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
                  >
                    <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-white" />
                    ) : (
                      <Play className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-white ml-0.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); playNextChannel(); }}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
                  >
                    <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <div className="flex items-center space-x-1 sm:space-x-1.5 ml-0.5 sm:ml-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                      className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-red-400" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-gray-200" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="hidden sm:block w-16 md:w-20 accent-purple-500 cursor-pointer h-1 sm:h-1.5 bg-gray-700 rounded-lg"
                    />
                  </div>

                  <div className="hidden md:flex items-center space-x-1.5 text-[11px] text-zinc-400 ml-2">
                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                    <span>Buffer:</span>
                    <strong className={`font-mono ${bufferAhead > 5 ? "text-emerald-400" : "text-amber-300"}`}>
                      {bufferAhead}s
                    </strong>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="hidden sm:inline px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
                    {bufferMode === "smooth" ? "Ultra Smooth (30s)" : "Low Latency (6s)"}
                  </span>

                  {detectedResolution && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white font-medium">
                      {detectedResolution}
                    </span>
                  )}

                  {isPipAvailable && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); togglePip(); }}
                      className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
                      title="Picture-in-Picture"
                    >
                      <PictureInPicture2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                    className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
                  >
                    {isFullscreen ? (
                      <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Non-Fullscreen: Bottom Playback Controls Bar Below Video */}
          {!isFullscreen && (
            <div className="sm:hidden flex items-center justify-between px-3 py-2 bg-[#121215] rounded-xl border border-zinc-800/80">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); playPrevChannel(); }}
                  className="p-2 rounded-full bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 transition-colors active:scale-95 cursor-pointer"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); playNextChannel(); }}
                  className="p-2 rounded-full bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 transition-colors active:scale-95 cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                  className="p-2 rounded-full bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 transition-colors active:scale-95 cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-gray-200" />
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {detectedResolution && (
                  <span className="px-2 py-1 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium">
                    {detectedResolution}
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                  className="p-2 rounded-full bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 transition-colors active:scale-95 cursor-pointer"
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
          {!isFullscreen && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
                {/* Unified Channel Branding */}
                <div className="flex items-center space-x-3.5 min-w-0">
                  {hasValidLogo && activeChannel.logo && (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center relative shrink-0 shadow-md p-1.5">
                      <img
                        key={activeChannel.id + "-brand-logo"}
                        src={activeChannel.logo}
                        alt={activeDisplayName}
                        onError={() => setFailedLogoUrls((prev) => new Set(prev).add(activeChannel.logo!))}
                        className="max-h-full max-w-full object-contain drop-shadow-sm"
                      />
                    </div>
                  )}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight truncate">
                        {activeDisplayName}
                      </h1>
                      {errorMessage ? (
                        <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 border border-red-500/50 text-red-400 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span>OFFLINE</span>
                        </span>
                      ) : hasFetchedFrame ? (
                        <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white shrink-0 shadow">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-live-pulse" />
                          <span>LIVE</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 border border-amber-500/50 text-amber-300 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          <span>CONNECTING</span>
                        </span>
                      )}
                      {activeResolutionBadge && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 border border-zinc-700/60 text-zinc-300">
                          {activeResolutionBadge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 truncate flex items-center space-x-1.5">
                      <span>{formatCategories(activeChannel.group)}</span>
                      <span>•</span>
                      <span>{activeChannel.country || "Global Broadcast"}</span>
                      {activeChannel.language && activeChannel.language !== "Multi-Audio" && (
                        <>
                          <span>•</span>
                          <span>{activeChannel.language}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Actions Toolbar: Compact centered icon buttons on mobile, full labeled buttons on desktop */}
                <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(activeChannel.id)}
                    className={`w-9 h-9 sm:w-auto sm:h-auto flex items-center justify-center sm:space-x-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                      isFav
                        ? "bg-purple-600 text-white border border-purple-400 shadow-purple-900/30"
                        : "bg-zinc-900 hover:bg-zinc-800 text-gray-200 border border-zinc-800"
                    }`}
                    title={isFav ? "Saved to Favorites" : "Add to Favorites"}
                    aria-label={isFav ? "Saved to Favorites" : "Add to Favorites"}
                  >
                    <Heart className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${isFav ? "fill-white text-white" : "text-gray-300"}`} />
                    <span className="hidden sm:inline">{isFav ? "Saved" : "Favorite"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-9 h-9 sm:w-auto sm:h-auto flex items-center justify-center sm:space-x-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-gray-200 border border-zinc-800 text-xs font-semibold transition-all cursor-pointer"
                    title="Share Channel Link"
                    aria-label="Share Channel Link"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline text-emerald-300 font-bold">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-zinc-300" />
                        <span className="hidden sm:inline">Share</span>
                      </>
                    )}
                  </button>

                  {activeChannel.website && (
                    <a
                      href={activeChannel.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 sm:w-auto sm:h-auto flex items-center justify-center sm:space-x-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-gray-200 border border-zinc-800 text-xs font-semibold transition-all"
                      title="Official Website"
                      aria-label="Official Website"
                    >
                      <ExternalLink className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-zinc-300" />
                      <span className="hidden sm:inline">Website</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsInfoModalOpen(true)}
                    className="w-9 h-9 sm:w-auto sm:h-auto flex items-center justify-center sm:space-x-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-gray-200 border border-zinc-800 text-xs font-semibold transition-all cursor-pointer"
                    title="Technical Specifications"
                    aria-label="Technical Specifications"
                  >
                    <Info className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-zinc-300" />
                    <span className="hidden sm:inline">Specs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveChannel(null)}
                    className="w-9 h-9 sm:w-auto sm:h-auto flex items-center justify-center sm:space-x-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-gray-200 border border-zinc-800 text-xs font-semibold transition-all cursor-pointer"
                    title="Close Channel"
                    aria-label="Close Channel"
                  >
                    <X className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-gray-400" />
                    <span className="hidden sm:inline">Close</span>
                  </button>
                </div>
              </div>
              <div className="rounded-2xl bg-[#121215] border border-zinc-800/80 p-3.5 sm:p-5 space-y-3 text-sm shadow-xl">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-zinc-200 font-bold">About Broadcast</span>
                    <span className="hidden sm:inline text-zinc-500 font-normal">
                      • Technical Details & Transmission
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-medium text-zinc-300 hover:text-white transition-all cursor-pointer"
                  >
                    <span>{isInfoExpanded ? "Hide Details" : "Show Details"}</span>
                    {isInfoExpanded ? <ChevronUp className="w-3 h-3 text-zinc-400" /> : <ChevronDown className="w-3 h-3 text-zinc-400" />}
                  </button>
                </div>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                  {activeChannel.description ||
                    `${activeChannel.name} is a live streaming channel in ${formatCategories(
                      activeChannel.group
                    )}. Broadcasting 24/7 in high definition.`}
                </p>
                {isInfoExpanded && (
                  <div className="pt-3 border-t border-zinc-800/60 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs">
                    <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60 flex flex-col justify-between">
                      <div className="flex items-center space-x-1.5 text-[9px] sm:text-[10px] text-zinc-500 font-bold tracking-wider uppercase">
                        <Tag className="w-3 h-3 text-purple-400 shrink-0" />
                        <span className="truncate">Category / Genre</span>
                      </div>
                      <span className="font-semibold text-xs sm:text-sm text-zinc-100 mt-1 block truncate">
                        {formatCategories(activeChannel.group)}
                      </span>
                    </div>

                    <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60 flex flex-col justify-between">
                      <div className="flex items-center space-x-1.5 text-[9px] sm:text-[10px] text-zinc-500 font-bold tracking-wider uppercase">
                        <Globe className="w-3 h-3 text-blue-400 shrink-0" />
                        <span className="truncate">Country / Region</span>
                      </div>
                      <span className="font-semibold text-xs sm:text-sm text-zinc-100 mt-1 block truncate">
                        {activeChannel.country || "Global"}
                      </span>
                    </div>

                    <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60 flex flex-col justify-between">
                      <div className="flex items-center space-x-1.5 text-[9px] sm:text-[10px] text-zinc-500 font-bold tracking-wider uppercase">
                        <Languages className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">Audio / Language</span>
                      </div>
                      <span className="font-semibold text-xs sm:text-sm text-zinc-100 mt-1 block truncate">
                        {activeChannel.language || "International"}
                      </span>
                    </div>

                    <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60 flex flex-col justify-between">
                      <div className="flex items-center space-x-1.5 text-[9px] sm:text-[10px] text-zinc-500 font-bold tracking-wider uppercase">
                        <Tv className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">Network</span>
                      </div>
                      <span className="font-semibold text-xs sm:text-sm text-zinc-100 mt-1 block truncate">
                        {activeChannel.network || activeChannel.name}
                      </span>
                    </div>

                    <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60 flex flex-col justify-between">
                      <div className="flex items-center space-x-1.5 text-[9px] sm:text-[10px] text-zinc-500 font-bold tracking-wider uppercase">
                        <Hash className="w-3 h-3 text-pink-400 shrink-0" />
                        <span className="truncate">TVG ID</span>
                      </div>
                      <span className="font-mono text-xs sm:text-sm text-zinc-300 mt-1 block truncate">
                        {activeChannel.tvgName || activeChannel.tvgId || "Auto Matched"}
                      </span>
                    </div>

                    <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60 flex flex-col justify-between">
                      <div className="flex items-center space-x-1.5 text-[9px] sm:text-[10px] text-zinc-500 font-bold tracking-wider uppercase">
                        <Activity className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">Buffer Engine</span>
                      </div>
                      <span className="font-semibold text-xs sm:text-sm text-emerald-400 mt-1 block truncate">
                        {bufferMode === "smooth" ? "Ultra Smooth (30s)" : "Low Latency (6s)"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {!isFullscreen && (
          <div className="lg:col-span-4 xl:col-span-3 2xl:col-span-3 space-y-3.5">
            {/* Sidebar Header & Topic Chips */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-white text-base">Related & Up Next</h3>
                </div>
                <span className="text-xs text-zinc-400 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 font-mono">
                  {displayedSidebarChannels.length} channels
                </span>
              </div>

              {/* YouTube Filter Chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
                {/* All */}
                <button
                  type="button"
                  onClick={() => setSidebarFilter("all")}
                  className={`px-3 py-1.5 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
                    sidebarFilter === "all"
                      ? "bg-purple-600 text-white shadow-sm border border-purple-400"
                      : "bg-white/10 hover:bg-white/15 text-gray-300 border border-white/10"
                  }`}
                >
                  All ({allRecommendedChannels.length})
                </button>

                {/* Category */}
                <button
                  type="button"
                  onClick={() => setSidebarFilter("category")}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
                    sidebarFilter === "category"
                      ? "bg-purple-600 text-white shadow-sm border border-purple-400"
                      : "bg-white/10 hover:bg-white/15 text-gray-300 border border-white/10"
                  }`}
                  title={`Same Category: ${formatCategories(activeChannel.group)}`}
                >
                  <Tag className="w-3 h-3" />
                  <span>
                    {formatCategories(activeChannel.group).split(";")[0]} ({sameCategoryChannels.length})
                  </span>
                </button>

                {/* Country */}
                {activeChannel.country && (
                  <button
                    type="button"
                    onClick={() => setSidebarFilter("country")}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
                      sidebarFilter === "country"
                        ? "bg-purple-600 text-white shadow-sm border border-purple-400"
                        : "bg-white/10 hover:bg-white/15 text-gray-300 border border-white/10"
                    }`}
                    title={`Same Country: ${activeChannel.country}`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>
                      {activeChannel.country} ({sameCountryChannels.length})
                    </span>
                  </button>
                )}

                {/* Language */}
                {activeChannel.language && (
                  <button
                    type="button"
                    onClick={() => setSidebarFilter("language")}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
                      sidebarFilter === "language"
                        ? "bg-purple-600 text-white shadow-sm border border-purple-400"
                        : "bg-white/10 hover:bg-white/15 text-gray-300 border border-white/10"
                    }`}
                    title={`Same Language: ${activeChannel.language}`}
                  >
                    <Languages className="w-3 h-3" />
                    <span>
                      {activeChannel.language} ({sameLanguageChannels.length})
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Channels List */}
            {displayedSidebarChannels.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 space-y-2">
                <p className="text-xs">No other channels found matching this filter.</p>
                <button
                  type="button"
                  onClick={() => setSidebarFilter("all")}
                  className="text-xs text-purple-400 hover:text-purple-300 underline font-semibold cursor-pointer"
                >
                  Show all recommendations
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {displayedSidebarChannels.map((item) => (
                  <SidebarChannelItem
                    key={item.id}
                    item={item}
                    isActive={item.id === activeChannel.id}
                    isOffline={offlineChannelIds.has(item.id)}
                    activeCountry={activeChannel.country}
                    isFav={favorites.includes(item.id)}
                    onToggleFav={() => toggleFavorite(item.id)}
                    onSelect={() => {
                      setActiveChannel(item);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {isInfoModalOpen && (
        <div onClick={(e) => e.stopPropagation()} className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {hasValidLogo && activeChannel.logo && (
                  <div className="w-12 h-12 flex items-center justify-center shrink-0 relative">
                    <img
                      key={activeChannel.id + "-info-logo"}
                      src={activeChannel.logo}
                      alt={activeChannel.name}
                      onError={() => setFailedLogoUrls((prev) => new Set(prev).add(activeChannel.logo!))}
                      className="max-h-12 max-w-12 object-contain drop-shadow-sm"
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white">{activeDisplayName}</h3>
                  <p className="text-xs text-zinc-400 font-medium">Channel Specifications & JSON Metadata</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsInfoModalOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-zinc-800">
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60"><Tag className="w-4 h-4 text-purple-400 shrink-0" /><div className="min-w-0"><span className="text-[10px] text-gray-400 block">Category</span><span className="font-medium truncate block">{formatCategories(activeChannel.group)}</span></div></div>
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60"><Globe className="w-4 h-4 text-purple-400 shrink-0" /><div className="min-w-0"><span className="text-[10px] text-gray-400 block">Country</span><span className="font-medium truncate block">{activeChannel.country || "Global Broadcast"}</span></div></div>
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60"><MapPin className="w-4 h-4 text-purple-400 shrink-0" /><div className="min-w-0"><span className="text-[10px] text-gray-400 block">City / Region</span><span className="font-medium truncate block">{activeChannel.city || activeChannel.region || "Worldwide"}</span></div></div>
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60"><Video className="w-4 h-4 text-purple-400 shrink-0" /><div className="min-w-0"><span className="text-[10px] text-gray-400 block">Resolution</span><span className="font-medium text-emerald-400 block">{activeResolutionBadge || "Auto"}</span></div></div>
            </div>
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between text-xs"><span className="font-bold text-gray-200 flex items-center space-x-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /><span>Playback Buffer Depth Engine</span></span><span className="text-zinc-300 font-mono text-[10px]">{bufferAhead}s Forward Buffer</span></div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setBufferMode("smooth")} className={`p-2 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${bufferMode === "smooth" ? "bg-purple-600 text-white shadow-md border border-purple-400" : "bg-zinc-900 text-gray-400 hover:text-white hover:bg-zinc-800 border border-zinc-800"}`}><div className="font-bold flex items-center justify-between"><span>Ultra Smooth</span></div><div className="text-[10px] opacity-80 mt-0.5">30s deep buffer</div></button>
                <button type="button" onClick={() => setBufferMode("low-latency")} className={`p-2 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${bufferMode === "low-latency" ? "bg-purple-600 text-white shadow-md border border-purple-400" : "bg-zinc-900 text-gray-400 hover:text-white hover:bg-zinc-800 border border-zinc-800"}`}><div className="font-bold flex items-center justify-between"><span>Low Latency</span></div><div className="text-[10px] opacity-80 mt-0.5">6s live edge sync</div></button>
              </div>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-zinc-800">
              <span className="text-[10px] text-gray-400 block font-medium">STREAM PLAYLIST URL (HLS)</span>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 break-all select-all flex items-center justify-between">
                <span className="truncate mr-2">{activeChannel.url}</span>
                <button type="button" onClick={() => { navigator.clipboard.writeText(activeChannel.url); }} className="px-2 py-1 rounded bg-purple-600/80 hover:bg-purple-600 text-white text-[10px] font-bold shrink-0 cursor-pointer">Copy</button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
              <div className="flex items-center space-x-1.5 text-gray-400"><ShieldCheck className="w-4 h-4 text-emerald-400" /><span>Verified Stream Transmission</span></div>
              <button type="button" onClick={() => setIsInfoModalOpen(false)} className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors cursor-pointer">Done</button>
            </div>
          </div>
        </div>
      )}
      {isSleepModalOpen && (
        <div onClick={(e) => e.stopPropagation()} className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-5 text-white space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Sleep Timer</h3>
                  <p className="text-xs text-zinc-400">Auto-stop playback</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsSleepModalOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {sleepTimerRemaining ? (
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Timer className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Timer Active: <strong className="font-mono text-emerald-300">{formatSleepRemaining(sleepTimerRemaining)}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={cancelSleepTimer}
                  className="px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500/40 text-red-300 hover:bg-red-900 font-medium cursor-pointer"
                >
                  Turn Off
                </button>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[15, 30, 45, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => startSleepTimer(mins)}
                  className="p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer bg-zinc-900 hover:bg-zinc-800 hover:border-purple-500/50 border-zinc-800 text-gray-200"
                >
                  {mins >= 60 ? `${mins / 60} Hour${mins > 60 ? "s" : ""}` : `${mins} Minutes`}
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsSleepModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-gray-300 font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

