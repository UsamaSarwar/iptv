"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { IPTVChannel, PlaylistInfo } from "@/types/iptv";
import { DEFAULT_CHANNELS } from "@/data/default-channels";
import { parseM3U } from "@/lib/m3u-parser";
import {
  saveChannelsToIndexedDB,
  getChannelsFromIndexedDB,
  savePlaylistsToIndexedDB,
  savePreferenceToIndexedDB,
  getPreferenceFromIndexedDB,
  saveSnapshotMetaToIndexedDB,
  getSnapshotMetaFromIndexedDB,
} from "@/lib/db";

interface IPTVContextType {
  channels: IPTVChannel[];
  allChannels: IPTVChannel[];
  categories: string[];
  categoryCounts: Record<string, number>;
  countries: string[];
  countryCounts: Record<string, number>;
  languages: string[];
  languageCounts: Record<string, number>;
  resolutions: string[];
  resolutionCounts: Record<string, number>;
  activeChannel: IPTVChannel | null;
  isPlaying: boolean;
  favorites: string[];
  watchHistory: string[];
  customPlaylists: PlaylistInfo[];
  selectedCategory: string;
  selectedCountry: string;
  selectedLanguage: string;
  selectedResolution: string;
  userCountry: string | null;
  detectedUserCountry: string | null;
  detectedUserCountryCode: string | null;
  searchQuery: string;
  isPlaylistModalOpen: boolean;
  isChannelGuideOpen: boolean;
  isSearchOpen: boolean;
  isCountryModalOpen: boolean;
  offlineChannelIds: Set<string>;
  verifiedLiveChannelIds: Set<string>;
  setActiveChannel: (channel: IPTVChannel | null) => void;
  setIsPlaying: (playing: boolean) => void;
  toggleFavorite: (channelId: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedCountry: (country: string) => void;
  setSelectedLanguage: (language: string) => void;
  setSelectedResolution: (resolution: string) => void;
  setSearchQuery: (query: string) => void;
  setIsPlaylistModalOpen: (open: boolean) => void;
  setIsChannelGuideOpen: (open: boolean) => void;
  setIsSearchOpen: (open: boolean) => void;
  setIsCountryModalOpen: (open: boolean) => void;
  dismissCountryPrompt: () => void;
  isSyncing: boolean;
  isSyncDone: boolean;
  syncChannels: () => Promise<boolean>;
  markChannelOffline: (channelId: string) => void;
  markChannelVerifiedLive: (channelId: string) => void;
  loadCustomPlaylistUrl: (url: string, name: string) => Promise<boolean>;
  loadCustomPlaylistContent: (content: string, name: string) => boolean;
  removePlaylist: (playlistId: string) => void;
  playNextChannel: () => void;
  playPrevChannel: () => void;
}

const IPTVContext = createContext<IPTVContextType | undefined>(undefined);

export function getCountryFlagEmoji(countryNameOrCode?: string): string {
  if (!countryNameOrCode) return "🌐";
  const name = countryNameOrCode.toLowerCase().trim();
  const flagMap: Record<string, string> = {
    pakistan: "🇵🇰",
    pk: "🇵🇰",
    "united states": "🇺🇸",
    us: "🇺🇸",
    usa: "🇺🇸",
    "united kingdom": "🇬🇧",
    uk: "🇬🇧",
    gb: "🇬🇧",
    canada: "🇨🇦",
    ca: "🇨🇦",
    india: "🇮🇳",
    in: "🇮🇳",
    australia: "🇦🇺",
    au: "🇦🇺",
    france: "🇫🇷",
    fr: "🇫🇷",
    germany: "🇩🇪",
    de: "🇩🇪",
    italy: "🇮🇹",
    it: "🇮🇹",
    spain: "🇪🇸",
    es: "🇪🇸",
    turkey: "🇹🇷",
    tr: "🇹🇷",
    "saudi arabia": "🇸🇦",
    sa: "🇸🇦",
    "united arab emirates": "🇦🇪",
    ae: "🇦🇪",
    qatar: "🇶🇦",
    qa: "🇶🇦",
    "south africa": "🇿🇦",
    za: "🇿🇦",
    brazil: "🇧🇷",
    br: "🇧🇷",
    mexico: "🇲🇽",
    mx: "🇲🇽",
    argentina: "🇦🇷",
    ar: "🇦🇷",
    japan: "🇯🇵",
    jp: "🇯🇵",
    "south korea": "🇰🇷",
    kr: "🇰🇷",
    china: "🇨🇳",
    cn: "🇨🇳",
    russia: "🇷🇺",
    ru: "🇷🇺",
    netherlands: "🇳🇱",
    nl: "🇳🇱",
    austria: "🇦🇹",
    at: "🇦🇹",
    slovakia: "🇸🇰",
    sk: "🇸🇰",
  };
  return flagMap[name] || "🌐";
}

const FAVORITES_KEY = "iptv_favorites_v1";
const HISTORY_KEY = "iptv_history_v1";
const PLAYLISTS_KEY = "iptv_custom_playlists_v1";
const OFFLINE_CHANNELS_KEY = "iptv_offline_channels_v1";
const PREF_SELECTED_COUNTRY = "iptv_selected_country_v1";
const PREF_COUNTRY_PROMPT_DISMISSED = "iptv_country_prompt_dismissed_v1";

export function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .replace(/(?:^|\s|-|\/)\S/g, (match) => match.toUpperCase());
}

export function normalizeCategory(cat?: string): string {
  if (!cat) return "Popular";
  const cleaned = cat.trim().replace(/^[,;.\s/]+|[,;.\s/]+$/g, "");
  if (!cleaned) return "Popular";
  const lower = cleaned.toLowerCase();
  if (
    lower === "uncategorized" ||
    lower === "general" ||
    lower === "undefined" ||
    lower === "unknown" ||
    lower === "other" ||
    lower === "none"
  ) {
    return "Popular";
  }
  return toTitleCase(cleaned);
}

const COUNTRY_ALIASES: Record<string, string> = {
  usa: "United States",
  us: "United States",
  "united states of america": "United States",
  uk: "United Kingdom",
  gb: "United Kingdom",
  "great britain": "United Kingdom",
  uae: "United Arab Emirates",
  pk: "Pakistan",
  in: "India",
};

let regionDisplayNames: Intl.DisplayNames | null = null;
function getRegionDisplayName(code: string): string | null {
  if (typeof Intl === "undefined" || !Intl.DisplayNames) return null;
  try {
    if (!regionDisplayNames) {
      regionDisplayNames = new Intl.DisplayNames(["en"], { type: "region" });
    }
    const resolved = regionDisplayNames.of(code.toUpperCase());
    if (resolved && resolved.toLowerCase() !== code.toLowerCase()) {
      return resolved;
    }
  } catch {
    // ignore
  }
  return null;
}

export function normalizeCountry(country?: string): string {
  if (!country) return "";
  const cleaned = country.trim().replace(/^[,;.\s/]+|[,;.\s/]+$/g, "");
  if (!cleaned) return "";
  const lower = cleaned.toLowerCase();
  if (COUNTRY_ALIASES[lower]) return COUNTRY_ALIASES[lower];

  // If 2 or 3 character country code (e.g. AF, AL, AM, AO, PK, US, etc.), resolve to full country name
  if (cleaned.length === 2 || cleaned.length === 3) {
    const resolved = getRegionDisplayName(cleaned);
    if (resolved) return resolved;
  }

  return toTitleCase(cleaned);
}

const LANGUAGE_ALIASES: Record<string, string> = {
  eng: "English",
  en: "English",
  urd: "Urdu",
  ur: "Urdu",
  hin: "Hindi",
  hi: "Hindi",
  spa: "Spanish",
  es: "Spanish",
  ara: "Arabic",
  ar: "Arabic",
  fra: "French",
  fr: "French",
  deu: "German",
  de: "German",
  por: "Portuguese",
  pt: "Portuguese",
  ita: "Italian",
  it: "Italian",
  tur: "Turkish",
  tr: "Turkish",
  rus: "Russian",
  ru: "Russian",
  zho: "Chinese",
  zh: "Chinese",
  jpn: "Japanese",
  ja: "Japanese",
  kor: "Korean",
  ko: "Korean",
};

export function normalizeLanguage(lang?: string): string[] {
  if (!lang) return [];
  const parts = lang.split(/[;,/]/).map((s) => s.trim()).filter(Boolean);
  const result: string[] = [];
  parts.forEach((p) => {
    const lower = p.toLowerCase();
    const resolved = LANGUAGE_ALIASES[lower] || toTitleCase(p);
    if (resolved && !result.includes(resolved)) {
      result.push(resolved);
    }
  });
  return result;
}

// Helper to extract clean category list splitting multi-categories by semicolon, comma, slash
export function splitCategories(rawGroup?: string): string[] {
  if (!rawGroup) return ["Popular"];
  const list = rawGroup
    .split(/[;,/]/)
    .map((g) => normalizeCategory(g))
    .filter(Boolean);
  return list.length > 0 ? Array.from(new Set(list)) : ["Popular"];
}

// Helper to format multiple categories with a dot symbol • instead of semicolons
export function formatCategories(rawGroup?: string): string {
  const list = splitCategories(rawGroup);
  return list.length > 0 ? list.join(" • ") : "Popular";
}

const RESOLUTION_REGEX = /\s*[\(\[\{]\s*(\d{3,4}p|\d{3,4}i|\d{1,2}k|4k|uhd|fhd|hd|sd|hevc|h\.?26[45]|raw|60fps|50fps)\s*[\)\]\}]/gi;
const TRAILING_RES_REGEX = /\s+(\d{3,4}p|\d{3,4}i|4k|uhd|fhd|hd)$/i;

export function normalizeResolutionTag(tag?: string | null): string | null {
  if (!tag) return null;
  const upper = tag.trim().toUpperCase();
  if (upper === "FHD" || upper === "1080P" || upper === "1080I" || upper === "1080") return "1080p";
  if (upper === "720P" || upper === "720I" || upper === "720") return "720p";
  if (upper === "576P" || upper === "576I" || upper === "576") return "576p";
  if (upper === "480P" || upper === "480I" || upper === "480") return "480p";
  if (upper === "360P" || upper === "360") return "360p";
  if (upper === "240P" || upper === "240") return "240p";
  if (upper === "4K" || upper === "UHD" || upper === "2160P" || upper === "2160") return "4K";
  if (upper === "8K") return "8K";
  if (upper === "HD") return "720p";
  if (upper === "SD") return "576p";
  return tag.toLowerCase();
}

/**
 * Trims bracketed or trailing resolution tokens from channel names and returns a clean display name and quality tag
 * e.g. "PTV Sports (1080p)" -> displayName: "PTV Sports", qualityTag: "1080p"
 */
export function formatChannelDisplayName(name: string, fallbackQuality?: string): {
  displayName: string;
  qualityTag: string | null;
} {
  if (!name) return { displayName: "Live Channel", qualityTag: fallbackQuality || null };

  let clean = name.trim();
  let extractedQuality: string | null = null;

  // Match and remove bracketed resolution/quality tags e.g. (1080p), [720p], (4K)
  const matches = clean.match(RESOLUTION_REGEX);
  if (matches && matches.length > 0) {
    const rawTag = matches[0].replace(/[\(\[\{\)\]\}\s]/g, "");
    extractedQuality = normalizeResolutionTag(rawTag);
    clean = clean.replace(RESOLUTION_REGEX, "").trim();
  }

  // Match and remove trailing resolution tokens e.g. "Channel 1080p"
  const trailingMatch = clean.match(TRAILING_RES_REGEX);
  if (trailingMatch) {
    if (!extractedQuality) {
      extractedQuality = normalizeResolutionTag(trailingMatch[1]);
    }
    clean = clean.replace(TRAILING_RES_REGEX, "").trim();
  }

  // Clean any empty parentheses or leftover brackets & known tags
  clean = clean
    .replace(/\[\s*not\s*24\/7\s*\]|\(\s*not\s*24\/7\s*\)/gi, "")
    .replace(/\[\s*geo[- ]?blocked\s*\]|\(\s*geo[- ]?blocked\s*\)/gi, "")
    .replace(/\s*\(\s*\)|\s*\[\s*\]|\s*\{\s*\}/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  const finalQuality = extractedQuality || (fallbackQuality ? normalizeResolutionTag(fallbackQuality) : null);

  return {
    displayName: clean || name,
    qualityTag: finalQuality,
  };
}

// Helper for localStorage subscription with useSyncExternalStore
function createLocalStorageStore<T>(key: string, initialValue: T) {
  let listeners: Array<() => void> = [];

  const subscribe = (listener: () => void) => {
    listeners.push(listener);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key) listener();
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
      window.removeEventListener("storage", handleStorage);
    };
  };

  const getSnapshot = (): string => {
    if (typeof window === "undefined") return JSON.stringify(initialValue);
    return localStorage.getItem(key) || JSON.stringify(initialValue);
  };

  const getServerSnapshot = (): string => {
    return JSON.stringify(initialValue);
  };

  const setValue = (val: T) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(val));
      listeners.forEach((l) => l());
    }
  };

  return { subscribe, getSnapshot, getServerSnapshot, setValue };
}

function createUrlSearchStore() {
  let listeners: Array<() => void> = [];

  const subscribe = (listener: () => void) => {
    listeners.push(listener);
    const handlePopState = () => listener();
    window.addEventListener("popstate", handlePopState);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
      window.removeEventListener("popstate", handlePopState);
    };
  };

  const getSnapshot = (): string => {
    if (typeof window === "undefined") return "";
    return window.location.search;
  };

  const getServerSnapshot = (): string => {
    return "";
  };

  const notify = () => {
    listeners.forEach((l) => l());
  };

  return { subscribe, getSnapshot, getServerSnapshot, notify };
}

const favoritesStore = createLocalStorageStore<string[]>(FAVORITES_KEY, []);
const historyStore = createLocalStorageStore<string[]>(HISTORY_KEY, []);
const playlistsStore = createLocalStorageStore<PlaylistInfo[]>(PLAYLISTS_KEY, []);
const offlineChannelsStore = createLocalStorageStore<string[]>(OFFLINE_CHANNELS_KEY, []);
const urlSearchStore = createUrlSearchStore();

export function IPTVProvider({ children }: { children: React.ReactNode }) {
  const favoritesRaw = useSyncExternalStore(
    favoritesStore.subscribe,
    favoritesStore.getSnapshot,
    favoritesStore.getServerSnapshot
  );

  const historyRaw = useSyncExternalStore(
    historyStore.subscribe,
    historyStore.getSnapshot,
    historyStore.getServerSnapshot
  );

  const playlistsRaw = useSyncExternalStore(
    playlistsStore.subscribe,
    playlistsStore.getSnapshot,
    playlistsStore.getServerSnapshot
  );

  const offlineChannelsRaw = useSyncExternalStore(
    offlineChannelsStore.subscribe,
    offlineChannelsStore.getSnapshot,
    offlineChannelsStore.getServerSnapshot
  );

  const urlSearchRaw = useSyncExternalStore(
    urlSearchStore.subscribe,
    urlSearchStore.getSnapshot,
    urlSearchStore.getServerSnapshot
  );

  // Scalable custom channel storage using IndexedDB (bypasses 5MB localStorage quota for 10k+ channel streams)
  const [customChannels, setCustomChannels] = useState<IPTVChannel[]>([]);
  const [sessionOfflineIds, setSessionOfflineIds] = useState<Set<string>>(new Set());
  const [verifiedLiveChannelIds, setVerifiedLiveChannelIds] = useState<Set<string>>(new Set());

  // Instant IndexedDB First-Paint + Stale-While-Revalidate Snapshot Sync
  useEffect(() => {
    let isMounted = true;

    const hydrateAndSync = async () => {
      let cachedTimestamp = 0;
      let hasLocalData = false;

      // 1. Initial fast local hydration directly from IndexedDB (0ms network delay)
      let storedChannels: IPTVChannel[] = [];
      try {
        const [idbChannels, cachedMeta] = await Promise.all([
          getChannelsFromIndexedDB(),
          getSnapshotMetaFromIndexedDB(),
        ]);
        storedChannels = idbChannels || [];

        if (isMounted) {
          if (storedChannels.length > 0) {
            hasLocalData = true;
            setCustomChannels(storedChannels);
          }
          if (cachedMeta) {
            cachedTimestamp = cachedMeta.lastUpdated || 0;
            if (Array.isArray(cachedMeta.verifiedLiveChannelIds) && cachedMeta.verifiedLiveChannelIds.length > 0) {
              setVerifiedLiveChannelIds(new Set(cachedMeta.verifiedLiveChannelIds));
            }
            if (Array.isArray(cachedMeta.offlineChannelIds) && cachedMeta.offlineChannelIds.length > 0) {
              setSessionOfflineIds(new Set(cachedMeta.offlineChannelIds));
            }
          }
        }
      } catch (idbErr) {
        console.warn("[IPTV Context] Initial IndexedDB read fallback:", idbErr);
      }

      // 2. Background Stale-While-Revalidate Snapshot Sync from static /channels-snapshot.json
      try {
        const snapshotUrl =
          process.env.NEXT_PUBLIC_SNAPSHOT_URL ||
          "/channels-snapshot.json";

        const res = await fetch(snapshotUrl);

        if (res && res.ok) {
          const data = await res.json();
          if (isMounted && data && Array.isArray(data.channels) && data.channels.length > 0) {
            const isNewer = !cachedTimestamp || (data.lastUpdated && data.lastUpdated > cachedTimestamp);
            const hasFewChannels = !hasLocalData || storedChannels.length < 50;
            const hasMoreChannels = data.channels.length > storedChannels.length;
            const needsSync = isNewer || hasFewChannels || hasMoreChannels;

            if (needsSync) {
              setCustomChannels(data.channels);

              if (Array.isArray(data.verifiedLiveChannelIds)) {
                setVerifiedLiveChannelIds(new Set(data.verifiedLiveChannelIds));
              }
              if (Array.isArray(data.offlineChannelIds)) {
                setSessionOfflineIds(new Set(data.offlineChannelIds));
              }

              // Persist in background to IndexedDB
              await Promise.all([
                saveChannelsToIndexedDB(data.channels),
                saveSnapshotMetaToIndexedDB({
                  lastUpdated: data.lastUpdated || Date.now(),
                  version: data.version || 1,
                  totalChannels: data.channels.length,
                  verifiedLiveCount: data.verifiedLiveCount || data.verifiedLiveChannelIds?.length || 0,
                  offlineCount: data.offlineCount || data.offlineChannelIds?.length || 0,
                  verifiedLiveChannelIds: data.verifiedLiveChannelIds || [],
                  offlineChannelIds: data.offlineChannelIds || [],
                }),
              ]);
            }
          }
        }
      } catch (fetchErr) {
        console.warn("[IPTV Context] Snapshot background sync skipped:", fetchErr);
      }
    };

    hydrateAndSync();

    return () => {
      isMounted = false;
    };
  }, []);

  const favorites: string[] = React.useMemo(() => {
    try {
      return JSON.parse(favoritesRaw);
    } catch {
      return [];
    }
  }, [favoritesRaw]);

  const watchHistory: string[] = React.useMemo(() => {
    try {
      return JSON.parse(historyRaw);
    } catch {
      return [];
    }
  }, [historyRaw]);

  const customPlaylists: PlaylistInfo[] = React.useMemo(() => {
    try {
      return JSON.parse(playlistsRaw);
    } catch {
      return [];
    }
  }, [playlistsRaw]);

  const cachedOfflineIds: Set<string> = React.useMemo(() => {
    try {
      return new Set(JSON.parse(offlineChannelsRaw));
    } catch {
      return new Set();
    }
  }, [offlineChannelsRaw]);

  // Combined set of verified offline channels (strictly excluding verified live channels)
  const offlineChannelIds = React.useMemo(() => {
    const combined = new Set(cachedOfflineIds);
    sessionOfflineIds.forEach((id) => combined.add(id));
    verifiedLiveChannelIds.forEach((id) => combined.delete(id));
    return combined;
  }, [cachedOfflineIds, sessionOfflineIds, verifiedLiveChannelIds]);

  // Combine default channels with dynamic/custom channels, applying strict deduplication by URL and Name
  const rawChannels = React.useMemo(() => {
    const combined = customChannels.length > 0 ? [...DEFAULT_CHANNELS, ...customChannels] : DEFAULT_CHANNELS;
    const seenUrls = new Set<string>();
    const seenNames = new Set<string>();
    const uniqueChannels: IPTVChannel[] = [];

    for (const ch of combined) {
      // Normalize URL (strip trailing slashes)
      const normalizedUrl = (ch.url || "").trim().replace(/\/+$/, "").toLowerCase();
      // Normalize name & country key (e.g. "filmax::pakistan")
      const normalizedKey = `${(ch.name || "").trim().toLowerCase()}::${(ch.country || "").trim().toLowerCase()}`;

      if (normalizedUrl && seenUrls.has(normalizedUrl)) {
        continue;
      }
      if (normalizedKey && seenNames.has(normalizedKey)) {
        continue;
      }

      if (normalizedUrl) seenUrls.add(normalizedUrl);
      if (normalizedKey) seenNames.add(normalizedKey);
      uniqueChannels.push(ch);
    }

    return uniqueChannels;
  }, [customChannels]);

  // Keep all catalog channels visible so users can see full inventory and check live status
  const channels = rawChannels;

  const [activeChannel, setActiveChannel] = useState<IPTVChannel | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Initialize filter states from hydration-safe urlSearchStore with user state overrides
  const initialUrlParams = React.useMemo(() => {
    let savedCountry = "All";
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(PREF_SELECTED_COUNTRY);
        if (stored) savedCountry = stored;
      } catch {
        // ignore
      }
    }
    if (!urlSearchRaw) return { cat: "All", country: savedCountry, lang: "All", res: "All", q: "" };
    const params = new URLSearchParams(urlSearchRaw);
    return {
      cat: params.get("category") || "All",
      country: params.get("country") || savedCountry,
      lang: params.get("language") || "All",
      res: params.get("resolution") || "All",
      q: params.get("q") || "",
    };
  }, [urlSearchRaw]);

  const [selectedCategoryOverride, setSelectedCategoryState] = useState<string | null>(null);
  const [selectedCountryOverride, setSelectedCountryState] = useState<string | null>(null);
  const [selectedLanguageOverride, setSelectedLanguageState] = useState<string | null>(null);
  const [selectedResolutionOverride, setSelectedResolutionState] = useState<string | null>(null);
  const [searchQueryOverride, setSearchQueryState] = useState<string | null>(null);

  const selectedCategory = selectedCategoryOverride ?? initialUrlParams.cat;
  const selectedCountry = selectedCountryOverride ?? initialUrlParams.country;
  const selectedLanguage = selectedLanguageOverride ?? initialUrlParams.lang;
  const selectedResolution = selectedResolutionOverride ?? initialUrlParams.res;
  const searchQuery = searchQueryOverride ?? initialUrlParams.q;

  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [detectedUserCountry, setDetectedUserCountry] = useState<string | null>(null);
  const [detectedUserCountryCode, setDetectedUserCountryCode] = useState<string | null>(null);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState<boolean>(false);
  const [isChannelGuideOpen, setIsChannelGuideOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState<boolean>(false);

  const dismissCountryPrompt = useCallback(() => {
    setIsCountryModalOpen(false);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(PREF_COUNTRY_PROMPT_DISMISSED, "true");
      } catch {
        // ignore
      }
      savePreferenceToIndexedDB(PREF_COUNTRY_PROMPT_DISMISSED, "true").catch(() => { });
    }
  }, []);

  // Sync state changes to browser URL search params seamlessly
  const updateUrlParams = useCallback(
    (newCat: string, newCountry: string, newLang: string, newRes: string, newSearch: string) => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);

      if (newCat && newCat !== "All") {
        url.searchParams.set("category", newCat);
      } else {
        url.searchParams.delete("category");
      }

      if (newCountry && newCountry !== "All") {
        url.searchParams.set("country", newCountry);
      } else {
        url.searchParams.delete("country");
      }

      if (newLang && newLang !== "All") {
        url.searchParams.set("language", newLang);
      } else {
        url.searchParams.delete("language");
      }

      if (newRes && newRes !== "All") {
        url.searchParams.set("resolution", newRes);
      } else {
        url.searchParams.delete("resolution");
      }

      if (newSearch && newSearch.trim()) {
        url.searchParams.set("q", newSearch.trim());
      } else {
        url.searchParams.delete("q");
      }

      window.history.replaceState(null, "", url.toString());
      urlSearchStore.notify();
    },
    []
  );

  const setSelectedCategory = useCallback(
    (cat: string) => {
      setSelectedCategoryState(cat);
      updateUrlParams(cat, selectedCountry, selectedLanguage, selectedResolution, searchQuery);
    },
    [selectedCountry, selectedLanguage, selectedResolution, searchQuery, updateUrlParams]
  );

  const setSelectedCountry = useCallback(
    (country: string) => {
      setSelectedCountryState(country);
      updateUrlParams(selectedCategory, country, selectedLanguage, selectedResolution, searchQuery);

      // Persist country preference to both localStorage and IndexedDB
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(PREF_SELECTED_COUNTRY, country);
          localStorage.setItem(PREF_COUNTRY_PROMPT_DISMISSED, "true");
        } catch {
          // ignore
        }
        savePreferenceToIndexedDB(PREF_SELECTED_COUNTRY, country).catch(() => { });
        savePreferenceToIndexedDB(PREF_COUNTRY_PROMPT_DISMISSED, "true").catch(() => { });
      }
    },
    [selectedCategory, selectedLanguage, selectedResolution, searchQuery, updateUrlParams]
  );

  const setSelectedLanguage = useCallback(
    (lang: string) => {
      setSelectedLanguageState(lang);
      updateUrlParams(selectedCategory, selectedCountry, lang, selectedResolution, searchQuery);
    },
    [selectedCategory, selectedCountry, selectedResolution, searchQuery, updateUrlParams]
  );

  const setSelectedResolution = useCallback(
    (res: string) => {
      setSelectedResolutionState(res);
      updateUrlParams(selectedCategory, selectedCountry, selectedLanguage, res, searchQuery);
    },
    [selectedCategory, selectedCountry, selectedLanguage, searchQuery, updateUrlParams]
  );

  const setSearchQuery = useCallback(
    (query: string) => {
      setSearchQueryState(query);
      updateUrlParams(selectedCategory, selectedCountry, selectedLanguage, selectedResolution, query);
    },
    [selectedCategory, selectedCountry, selectedLanguage, selectedResolution, updateUrlParams]
  );

  const markChannelVerifiedLive = useCallback((channelId: string) => {
    setVerifiedLiveChannelIds((prev) => {
      if (prev.has(channelId)) return prev;
      return new Set([...prev, channelId]);
    });
    setSessionOfflineIds((prev) => {
      if (!prev.has(channelId)) return prev;
      const next = new Set(prev);
      next.delete(channelId);
      return next;
    });
    try {
      const current = JSON.parse(offlineChannelsStore.getSnapshot() || "[]") as string[];
      if (current.includes(channelId)) {
        offlineChannelsStore.setValue(current.filter((id) => id !== channelId));
      }
    } catch {
      // ignore
    }
  }, [setVerifiedLiveChannelIds, setSessionOfflineIds]);

  const markChannelOffline = useCallback((channelId: string) => {
    setSessionOfflineIds((prev) => {
      if (prev.has(channelId)) return prev;
      return new Set([...prev, channelId]);
    });
    setVerifiedLiveChannelIds((prev) => {
      if (!prev.has(channelId)) return prev;
      const next = new Set(prev);
      next.delete(channelId);
      return next;
    });
    try {
      const current = JSON.parse(offlineChannelsStore.getSnapshot() || "[]") as string[];
      if (!current.includes(channelId)) {
        offlineChannelsStore.setValue([...current, channelId]);
      }
    } catch {
      // ignore
    }
  }, [setSessionOfflineIds, setVerifiedLiveChannelIds]);

  // Extract unique category names & counts from currently active/working channels with case-insensitive deduplication
  const { categories, categoryCounts } = React.useMemo(() => {
    const countsMap = new Map<string, { display: string; count: number }>();

    channels.forEach((c) => {
      const split = splitCategories(c.group);
      const uniqueCatsInChannel = new Set<string>();
      split.forEach((rawCat) => {
        const norm = normalizeCategory(rawCat);
        if (norm) {
          const key = norm.toLowerCase();
          uniqueCatsInChannel.add(key);
          if (!countsMap.has(key)) {
            countsMap.set(key, { display: norm, count: 0 });
          }
        }
      });
      uniqueCatsInChannel.forEach((key) => {
        const item = countsMap.get(key);
        if (item) item.count += 1;
      });
    });

    const sortedEntries = Array.from(countsMap.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.display.localeCompare(b.display);
    });

    const catsList = ["All", "Favorites", ...sortedEntries.map((e) => e.display)];
    const countsDict: Record<string, number> = {
      All: channels.length,
      Favorites: favorites.length,
    };
    sortedEntries.forEach((e) => {
      countsDict[e.display] = e.count;
    });

    return { categories: catsList, categoryCounts: countsDict };
  }, [channels, favorites.length]);

  // Extract unique country names & counts from currently active/working channels with case-insensitive deduplication
  const { countries, countryCounts } = React.useMemo(() => {
    const countsMap = new Map<string, { display: string; count: number }>();

    channels.forEach((c) => {
      if (c.country && c.country.trim()) {
        const norm = normalizeCountry(c.country);
        if (norm) {
          const key = norm.toLowerCase();
          if (!countsMap.has(key)) {
            countsMap.set(key, { display: norm, count: 0 });
          }
          countsMap.get(key)!.count += 1;
        }
      }
    });

    const sortedEntries = Array.from(countsMap.values()).sort((a, b) =>
      a.display.localeCompare(b.display)
    );

    const countryList = ["All", ...sortedEntries.map((e) => e.display)];
    const countsDict: Record<string, number> = {
      All: channels.length,
    };
    sortedEntries.forEach((e) => {
      countsDict[e.display] = e.count;
    });

    return { countries: countryList, countryCounts: countsDict };
  }, [channels]);

  // Extract unique language names & counts from currently active/working channels with case-insensitive deduplication
  const { languages, languageCounts } = React.useMemo(() => {
    const countsMap = new Map<string, { display: string; count: number }>();

    channels.forEach((c) => {
      if (c.language && c.language.trim()) {
        const langs = normalizeLanguage(c.language);
        const uniqueLangsInChannel = new Set<string>();
        langs.forEach((norm) => {
          if (norm) {
            const key = norm.toLowerCase();
            uniqueLangsInChannel.add(key);
            if (!countsMap.has(key)) {
              countsMap.set(key, { display: norm, count: 0 });
            }
          }
        });
        uniqueLangsInChannel.forEach((key) => {
          const item = countsMap.get(key);
          if (item) item.count += 1;
        });
      }
    });

    const sortedEntries = Array.from(countsMap.values()).sort((a, b) =>
      a.display.localeCompare(b.display)
    );

    const langList = ["All", ...sortedEntries.map((e) => e.display)];
    const countsDict: Record<string, number> = {
      All: channels.length,
    };
    sortedEntries.forEach((e) => {
      countsDict[e.display] = e.count;
    });

    return { languages: langList, languageCounts: countsDict };
  }, [channels]);

  // Extract unique resolution/quality tags & counts from currently active/working channels
  const { resolutions, resolutionCounts } = React.useMemo(() => {
    const countsMap = new Map<string, number>();

    channels.forEach((c) => {
      const { qualityTag } = formatChannelDisplayName(c.name, c.quality);
      const rawRes = qualityTag || c.quality || "HD";
      const res = rawRes.trim().toUpperCase();
      if (res) {
        countsMap.set(res, (countsMap.get(res) || 0) + 1);
      }
    });

    const ORDER = ["4K", "FHD", "1080P", "720P", "HD", "576P", "480P", "360P", "240P", "SD", "HEVC"];
    const foundKeys = Array.from(countsMap.keys());

    const sorted = foundKeys.sort((a, b) => {
      const idxA = ORDER.indexOf(a);
      const idxB = ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    const resList = ["All", ...sorted];
    const countsDict: Record<string, number> = {
      All: channels.length,
    };
    countsMap.forEach((count, key) => {
      countsDict[key] = count;
    });

    return { resolutions: resList, resolutionCounts: countsDict };
  }, [channels]);

  // Detect user's current country ONCE on initial load and dynamically fetch localized channels
  const hasDetectedLocation = useRef(false);
  useEffect(() => {
    if (hasDetectedLocation.current) return;
    hasDetectedLocation.current = true;

    const detectCountryAndFetchChannels = async () => {
      let detectedCountry: string | null = null;
      let detectedCountryCode: string | null = null;
      let detectedCity: string | undefined = undefined;
      let detectedRegion: string | undefined = undefined;

      // 1. Try ipwho.is
      try {
        const res = await fetch("https://ipwho.is/", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data && data.country) {
            detectedCountry = data.country;
            detectedCountryCode = data.country_code;
            detectedCity = data.city;
            detectedRegion = data.region;
          }
        }
      } catch {
        // fallback
      }

      // 2. Fallback to api.country.is
      if (!detectedCountry) {
        try {
          const res = await fetch("https://api.country.is/", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (data && data.country) {
              detectedCountryCode = data.country;
              const code = data.country.toLowerCase();
              detectedCountry = COUNTRY_ALIASES[code] || data.country;
            }
          }
        } catch {
          // fallback
        }
      }

      if (detectedCountry) {
        const normalized = normalizeCountry(detectedCountry) || detectedCountry;
        setUserCountry(normalized);

        // If country code is present, dynamically fetch localized open streams directly from CORS-enabled IPTV-org source
        if (detectedCountryCode) {
          try {
            const countryRes = await fetch(`https://iptv-org.github.io/iptv/countries/${detectedCountryCode.toLowerCase()}.m3u`);
            if (countryRes.ok) {
              const countryM3uText = await countryRes.text();
              const parsedChannels = parseM3U(countryM3uText);
              if (parsedChannels && parsedChannels.length > 0) {
                const enriched: IPTVChannel[] = parsedChannels.map((ch: IPTVChannel) => ({
                  ...ch,
                  city: ch.city || detectedCity,
                  region: ch.region || detectedRegion,
                  country: ch.country || normalized,
                  countryCode: detectedCountryCode || undefined,
                }));

                // Safely merge without triggering re-fetch cycles
                setCustomChannels((prev) => {
                  const existingIds = new Set(prev.map((c) => c.id));
                  const newOnes = enriched.filter((c: IPTVChannel) => !existingIds.has(c.id));
                  if (newOnes.length === 0) return prev;
                  const updated = [...prev, ...newOnes];
                  saveChannelsToIndexedDB(updated).catch(() => { });
                  return updated;
                });
              }
            }
          } catch (err) {
            console.warn("Failed to dynamically fetch localized channels:", err);
          }
        }

        // Save detected country info
        setUserCountry(normalized);
        setDetectedUserCountry(normalized);
        setDetectedUserCountryCode(detectedCountryCode);

        // Show easily dismissible region selection pop-up initialized with detected country after 10 seconds of user visit
        if (typeof window !== "undefined") {
          const localDismissed = localStorage.getItem(PREF_COUNTRY_PROMPT_DISMISSED);
          const params = new URLSearchParams(window.location.search);
          if (!localDismissed && !params.has("country")) {
            setTimeout(async () => {
              try {
                const isStillDismissed = localStorage.getItem(PREF_COUNTRY_PROMPT_DISMISSED);
                if (isStillDismissed) return;
                const idbDismissed = await getPreferenceFromIndexedDB<string>(PREF_COUNTRY_PROMPT_DISMISSED);
                if (!idbDismissed) {
                  setIsCountryModalOpen(true);
                }
              } catch {
                setIsCountryModalOpen(true);
              }
            }, 10000);
          }
        }
      }
    };

    detectCountryAndFetchChannels();
  }, []);

  useEffect(() => {
    if (customPlaylists.length > 0) {
      savePlaylistsToIndexedDB(customPlaylists).catch(() => { });
    }
  }, [customPlaylists]);

  // Toggle favorite channel
  const toggleFavorite = useCallback(
    (channelId: string) => {
      const isFav = favorites.includes(channelId);
      const updated = isFav
        ? favorites.filter((id) => id !== channelId)
        : [...favorites, channelId];
      favoritesStore.setValue(updated);
    },
    [favorites]
  );

  // Add channel to watch history
  const addToHistory = useCallback(
    (channelId: string) => {
      const filtered = watchHistory.filter((id) => id !== channelId);
      const updated = [channelId, ...filtered].slice(0, 50); // keep last 50
      historyStore.setValue(updated);
    },
    [watchHistory]
  );

  // Set active channel and record to history
  const handleSetActiveChannel = useCallback(
    (channel: IPTVChannel | null) => {
      setActiveChannel(channel);
      if (channel) {
        addToHistory(channel.id);
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    },
    [addToHistory]
  );

  // Load custom playlist from URL with unlimited IndexedDB persistence
  const loadCustomPlaylistUrl = useCallback(
    async (url: string, name: string): Promise<boolean> => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch playlist");
        const content = await res.text();
        const parsed = parseM3U(content);

        if (parsed.length === 0) return false;

        const newPlaylist: PlaylistInfo = {
          id: `playlist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name,
          url,
          channelCount: parsed.length,
          addedAt: Date.now(),
          isActive: true,
        };

        const filteredPlaylists = customPlaylists.filter((p) => p.name !== name && p.url !== url);
        const updatedPlaylists = [...filteredPlaylists, newPlaylist];
        playlistsStore.setValue(updatedPlaylists);
        savePlaylistsToIndexedDB(updatedPlaylists).catch(() => { });

        const updatedChannels = [...customChannels, ...parsed];
        setCustomChannels(updatedChannels);
        saveChannelsToIndexedDB(updatedChannels).catch(console.error);
        return true;
      } catch (err) {
        console.error("Error loading playlist URL:", err);
        return false;
      }
    },
    [customPlaylists, customChannels]
  );

  // Load custom playlist from raw M3U text content
  const loadCustomPlaylistContent = useCallback(
    (content: string, name: string): boolean => {
      try {
        const parsed = parseM3U(content);
        if (parsed.length === 0) return false;

        const newPlaylist: PlaylistInfo = {
          id: `playlist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name,
          channelCount: parsed.length,
          addedAt: Date.now(),
          isActive: true,
        };

        const updatedPlaylists = [...customPlaylists, newPlaylist];
        playlistsStore.setValue(updatedPlaylists);
        savePlaylistsToIndexedDB(updatedPlaylists).catch(() => { });

        const updatedChannels = [...customChannels, ...parsed];
        setCustomChannels(updatedChannels);
        saveChannelsToIndexedDB(updatedChannels).catch(console.error);
        return true;
      } catch (err) {
        console.error("Error loading playlist text:", err);
        return false;
      }
    },
    [customPlaylists, customChannels]
  );

  // Remove a custom playlist
  const removePlaylist = useCallback(
    (playlistId: string) => {
      const updated = customPlaylists.filter((p) => p.id !== playlistId);
      playlistsStore.setValue(updated);
      savePlaylistsToIndexedDB(updated).catch(() => { });
      if (updated.length === 0) {
        setCustomChannels([]);
        saveChannelsToIndexedDB([]).catch(() => { });
      }
    },
    [customPlaylists]
  );

  // Navigation: Next / Prev channel
  const playNextChannel = useCallback(() => {
    const list = channels.length > 0 ? channels : rawChannels;
    if (list.length === 0) return;

    if (!activeChannel) {
      handleSetActiveChannel(list[0]);
      return;
    }

    let currentIndex = list.findIndex(
      (c) =>
        c.id === activeChannel.id ||
        c.url === activeChannel.url ||
        c.name.toLowerCase() === activeChannel.name.toLowerCase()
    );

    if (currentIndex === -1) {
      currentIndex = 0;
    }

    const nextIndex = (currentIndex + 1) % list.length;
    handleSetActiveChannel(list[nextIndex]);
  }, [activeChannel, channels, rawChannels, handleSetActiveChannel]);

  const playPrevChannel = useCallback(() => {
    const list = channels.length > 0 ? channels : rawChannels;
    if (list.length === 0) return;

    if (!activeChannel) {
      handleSetActiveChannel(list[list.length - 1]);
      return;
    }

    let currentIndex = list.findIndex(
      (c) =>
        c.id === activeChannel.id ||
        c.url === activeChannel.url ||
        c.name.toLowerCase() === activeChannel.name.toLowerCase()
    );

    if (currentIndex === -1) {
      currentIndex = 0;
    }

    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    handleSetActiveChannel(list[prevIndex]);
  }, [activeChannel, channels, rawChannels, handleSetActiveChannel]);

  // Dynamic on-demand channel & stream status sync with backend cron engine
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncDone, setIsSyncDone] = useState(false);
  const syncCooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const syncChannels = useCallback(async (): Promise<boolean> => {
    if (isSyncing) return false;
    setIsSyncing(true);
    try {
      // Fetch fresh static snapshot to immediately hydrate UI and IndexedDB
      const snapshotUrl =
        process.env.NEXT_PUBLIC_SNAPSHOT_URL ||
        "/channels-snapshot.json";

      const snapshotRes = await fetch(`${snapshotUrl}?t=${Date.now()}`);

      if (snapshotRes && snapshotRes.ok) {
        const data = await snapshotRes.json();
        if (data && Array.isArray(data.channels) && data.channels.length > 0) {
          if (Array.isArray(data.verifiedLiveChannelIds)) {
            setVerifiedLiveChannelIds(new Set(data.verifiedLiveChannelIds));
          }
          if (Array.isArray(data.offlineChannelIds)) {
            setSessionOfflineIds(new Set(data.offlineChannelIds));
          }
          setCustomChannels(data.channels);

          await Promise.all([
            saveChannelsToIndexedDB(data.channels),
            saveSnapshotMetaToIndexedDB({
              lastUpdated: data.lastUpdated || Date.now(),
              version: data.version || 1,
              totalChannels: data.channels.length,
              verifiedLiveCount: data.verifiedLiveCount || data.verifiedLiveChannelIds?.length || 0,
              offlineCount: data.offlineCount || data.offlineChannelIds?.length || 0,
              verifiedLiveChannelIds: data.verifiedLiveChannelIds || [],
              offlineChannelIds: data.offlineChannelIds || [],
            }),
          ]);
        }
      }

      setIsSyncDone(true);
      if (syncCooldownTimerRef.current) clearTimeout(syncCooldownTimerRef.current);
      syncCooldownTimerRef.current = setTimeout(() => {
        setIsSyncDone(false);
      }, 60000); // 1-minute success confirmation state

      return snapshotRes?.ok ?? true;
    } catch (err) {
      console.error("[IPTV Context] Sync failed:", err);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    return () => {
      if (syncCooldownTimerRef.current) {
        clearTimeout(syncCooldownTimerRef.current);
      }
    };
  }, []);

  return (
    <IPTVContext.Provider
      value={{
        channels,
        allChannels: rawChannels,
        categories,
        categoryCounts,
        countries,
        countryCounts,
        languages,
        languageCounts,
        resolutions,
        resolutionCounts,
        activeChannel,
        isPlaying,
        favorites,
        watchHistory,
        customPlaylists,
        selectedCategory,
        selectedCountry,
        selectedLanguage,
        selectedResolution,
        userCountry,
        detectedUserCountry,
        detectedUserCountryCode,
        searchQuery,
        isPlaylistModalOpen,
        isChannelGuideOpen,
        isSearchOpen,
        isCountryModalOpen,
        offlineChannelIds,
        verifiedLiveChannelIds,
        isSyncing,
        isSyncDone,
        syncChannels,
        setActiveChannel: handleSetActiveChannel,
        setIsPlaying,
        toggleFavorite,
        setSelectedCategory,
        setSelectedCountry,
        setSelectedLanguage,
        setSelectedResolution,
        setSearchQuery,
        setIsPlaylistModalOpen,
        setIsChannelGuideOpen,
        setIsSearchOpen,
        setIsCountryModalOpen,
        dismissCountryPrompt,
        markChannelOffline,
        markChannelVerifiedLive,
        loadCustomPlaylistUrl,
        loadCustomPlaylistContent,
        removePlaylist,
        playNextChannel,
        playPrevChannel,
      }}
    >
      {children}
    </IPTVContext.Provider>
  );
}

export function useIPTV() {
  const context = useContext(IPTVContext);
  if (!context) {
    throw new Error("useIPTV must be used within an IPTVProvider");
  }
  return context;
}
