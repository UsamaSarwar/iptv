"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIPTV, getCountryFlagEmoji } from "@/context/iptv-context";
import {
  Tv,
  Search,
  Plus,
  Heart,
  Compass,
  ChevronDown,
  Check,
  Layers,
  Globe,
  SlidersHorizontal,
  X,
  Menu,
  RefreshCw,
  Coffee,
} from "lucide-react";

export function Navbar() {
  const router = useRouter();
  const {
    setActiveChannel,
    selectedCategory,
    setSelectedCategory,
    categories,
    categoryCounts,
    selectedCountry,
    setSelectedCountry,
    countries,
    countryCounts,
    selectedLanguage,
    setSelectedLanguage,
    languages,
    languageCounts,
    selectedResolution,
    setSelectedResolution,
    resolutions,
    resolutionCounts,
    userCountry,
    favorites,
    isSyncing,
    isSyncDone,
    syncChannels,
    setIsPlaylistModalOpen,
    setIsSearchOpen,
    setIsChannelGuideOpen,
  } = useIPTV();

  const navigateHomeIfWatching = () => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/watch/")) {
      router.push("/");
    }
  };

  const [isScrolled, setIsScrolled] = useState(false);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [catSearchQuery, setCatSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [langSearchQuery, setLangSearchQuery] = useState("");
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const [isResDropdownOpen, setIsResDropdownOpen] = useState(false);
  const [resSearchQuery, setResSearchQuery] = useState("");
  const resDropdownRef = useRef<HTMLDivElement>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const catTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const langTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCatEnter = () => {
    if (catTimeoutRef.current) clearTimeout(catTimeoutRef.current);
    setIsCatDropdownOpen(true);
    setIsCountryDropdownOpen(false);
    setIsLangDropdownOpen(false);
    setIsResDropdownOpen(false);
  };
  const handleCatLeave = () => {
    catTimeoutRef.current = setTimeout(() => {
      setIsCatDropdownOpen(false);
    }, 150);
  };

  const handleCountryEnter = () => {
    if (countryTimeoutRef.current) clearTimeout(countryTimeoutRef.current);
    setIsCountryDropdownOpen(true);
    setIsCatDropdownOpen(false);
    setIsLangDropdownOpen(false);
    setIsResDropdownOpen(false);
  };
  const handleCountryLeave = () => {
    countryTimeoutRef.current = setTimeout(() => {
      setIsCountryDropdownOpen(false);
    }, 150);
  };

  const handleLangEnter = () => {
    if (langTimeoutRef.current) clearTimeout(langTimeoutRef.current);
    setIsLangDropdownOpen(true);
    setIsCatDropdownOpen(false);
    setIsCountryDropdownOpen(false);
    setIsResDropdownOpen(false);
  };
  const handleLangLeave = () => {
    langTimeoutRef.current = setTimeout(() => {
      setIsLangDropdownOpen(false);
    }, 150);
  };

  const handleResEnter = () => {
    if (resTimeoutRef.current) clearTimeout(resTimeoutRef.current);
    setIsResDropdownOpen(true);
    setIsCatDropdownOpen(false);
    setIsCountryDropdownOpen(false);
    setIsLangDropdownOpen(false);
  };
  const handleResLeave = () => {
    resTimeoutRef.current = setTimeout(() => {
      setIsResDropdownOpen(false);
    }, 150);
  };

  // Close dropdowns and menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsCatDropdownOpen(false);
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(target)) {
        setIsCountryDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(target)) {
        setIsLangDropdownOpen(false);
      }
      if (resDropdownRef.current && !resDropdownRef.current.contains(target)) {
        setIsResDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (catTimeoutRef.current) clearTimeout(catTimeoutRef.current);
      if (countryTimeoutRef.current) clearTimeout(countryTimeoutRef.current);
      if (langTimeoutRef.current) clearTimeout(langTimeoutRef.current);
      if (resTimeoutRef.current) clearTimeout(resTimeoutRef.current);
    };
  }, []);

  // Filter categories based on search query inside dropdown
  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(catSearchQuery.toLowerCase())
  );

  // Filter countries based on search query inside dropdown
  const filteredCountries = countries.filter((c) =>
    c.toLowerCase().includes(countrySearchQuery.toLowerCase())
  );

  // Filter languages based on search query inside dropdown
  const filteredLanguages = languages.filter((l) =>
    l.toLowerCase().includes(langSearchQuery.toLowerCase())
  );

  // Filter resolutions based on search query inside dropdown
  const filteredResolutions = resolutions.filter((r) =>
    r.toLowerCase().includes(resSearchQuery.toLowerCase())
  );

  return (
    <>
      <header
        suppressHydrationWarning
        className={`fixed top-0 left-0 right-0 z-40 transition-[background-color,backdrop-filter,padding,box-shadow] duration-300 ${
          isScrolled
            ? "glass-nav shadow-2xl py-2.5"
            : "bg-linear-to-b from-black/95 via-black/70 to-transparent py-3 sm:py-4"
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          {/* Brand Logo & Desktop Dropdown Filters */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 min-w-0">
            {/* Brand Logo with Lucide TV Icon */}
            <Link
              href="/"
              onClick={() => {
                setActiveChannel(null);
                setSelectedCategory("All");
                setSelectedCountry("All");
                setSelectedLanguage("All");
                setSelectedResolution("All");
                window.scrollTo({ top: 0, behavior: "instant" });
              }}
              className="flex items-center space-x-2 cursor-pointer group shrink-0 select-none"
            >
              <Tv className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400 group-hover:text-purple-300 transition-colors shrink-0" />

              <div className="flex items-baseline space-x-1.5">
                <span className="font-orbitron text-lg sm:text-xl font-black tracking-wider text-white group-hover:text-zinc-200 transition-colors">
                  IPTV
                </span>
                <span className="text-[9px] font-bold text-purple-400 tracking-wider">
                  LIVE
                </span>
              </div>
            </Link>

            {/* Desktop: Categories Dropdown */}
            <div
              className="hidden md:block relative"
              ref={dropdownRef}
              onMouseEnter={handleCatEnter}
              onMouseLeave={handleCatLeave}
            >
              <button
                type="button"
                onClick={() => {
                  setIsCatDropdownOpen(!isCatDropdownOpen);
                  setIsCountryDropdownOpen(false);
                  setIsLangDropdownOpen(false);
                  setIsResDropdownOpen(false);
                  setCatSearchQuery("");
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  selectedCategory !== "All" && selectedCategory !== "Favorites"
                    ? "bg-purple-600/20 text-purple-200 border-purple-500/40 shadow-sm"
                    : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800/80"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span suppressHydrationWarning>
                  {selectedCategory === "All" || selectedCategory === "Favorites"
                    ? "Categories"
                    : selectedCategory}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                    isCatDropdownOpen ? "rotate-180 text-purple-300" : ""
                  }`}
                />
              </button>

              {/* Categories Dropdown Card */}
              {isCatDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 rounded-xl bg-zinc-950/95 border border-zinc-800/80 shadow-2xl shadow-black/80 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                  <div className="p-2.5 border-b border-zinc-800/80 bg-zinc-900/70 flex items-center space-x-2">
                    <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search categories..."
                      value={catSearchQuery}
                      onChange={(e) => setCatSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
                    />
                    {catSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCatSearchQuery("")}
                        className="text-zinc-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
                    {filteredCategories.length === 0 ? (
                      <div className="p-3 text-center text-xs text-zinc-500">
                        No category matches found.
                      </div>
                    ) : (
                      filteredCategories.map((cat) => {
                        const isSelected = selectedCategory === cat;
                        const count = categoryCounts[cat] ?? 0;
                        return (
                          <button
                            type="button"
                            key={cat}
                            onClick={() => {
                              navigateHomeIfWatching();
                              setSelectedCategory(cat);
                              setIsCatDropdownOpen(false);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                              isSelected
                                ? "bg-purple-600/20 text-purple-200 border border-purple-500/30"
                                : "text-zinc-300 hover:text-white hover:bg-zinc-900"
                            }`}
                          >
                            <span className="truncate">{cat === "All" ? "All Categories" : cat}</span>
                            <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                                {count}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop: Countries Dropdown */}
            <div
              className="hidden md:block relative"
              ref={countryDropdownRef}
              onMouseEnter={handleCountryEnter}
              onMouseLeave={handleCountryLeave}
            >
              <button
                type="button"
                onClick={() => {
                  setIsCountryDropdownOpen(!isCountryDropdownOpen);
                  setIsCatDropdownOpen(false);
                  setIsLangDropdownOpen(false);
                  setIsResDropdownOpen(false);
                  setCountrySearchQuery("");
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  selectedCountry !== "All"
                    ? "bg-purple-600/20 text-purple-200 border-purple-500/40 shadow-sm"
                    : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800/80"
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                <span suppressHydrationWarning>{selectedCountry === "All" ? "Country" : selectedCountry}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                    isCountryDropdownOpen ? "rotate-180 text-purple-300" : ""
                  }`}
                />
              </button>

              {/* Countries Dropdown Card */}
              {isCountryDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 rounded-xl bg-zinc-950/95 border border-zinc-800/80 shadow-2xl shadow-black/80 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                  <div className="p-2.5 border-b border-zinc-800/80 bg-zinc-900/70 flex items-center space-x-2">
                    <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search countries..."
                      value={countrySearchQuery}
                      onChange={(e) => setCountrySearchQuery(e.target.value)}
                      className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
                    />
                    {countrySearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCountrySearchQuery("")}
                        className="text-zinc-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {userCountry && (
                    <div className="px-3 py-1.5 bg-zinc-900/80 border-b border-zinc-800/80 text-[10px] text-zinc-400 flex items-center justify-between">
                      <span className="truncate">IP: {userCountry}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigateHomeIfWatching();
                          setSelectedCountry(userCountry);
                          setIsCountryDropdownOpen(false);
                        }}
                        className="underline font-bold text-purple-300 hover:text-purple-200 cursor-pointer ml-2"
                      >
                        Select
                      </button>
                    </div>
                  )}

                  <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
                    {filteredCountries.length === 0 ? (
                      <div className="p-3 text-center text-xs text-zinc-500">
                        No country matches found.
                      </div>
                    ) : (
                      filteredCountries.map((c) => {
                        const isSelected = selectedCountry === c;
                        const count = countryCounts[c] ?? 0;
                        return (
                          <button
                            type="button"
                            key={c}
                            onClick={() => {
                              navigateHomeIfWatching();
                              setSelectedCountry(c);
                              setIsCountryDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                              isSelected
                                ? "bg-purple-600/20 text-purple-200 border border-purple-500/30"
                                : "text-zinc-300 hover:text-white hover:bg-zinc-900"
                            }`}
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <span className="text-sm" role="img" aria-label={c}>
                                {getCountryFlagEmoji(c)}
                              </span>
                              <span className="truncate">{c === "All" ? "All Countries" : c}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                                {count}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop: Language Dropdown */}
            <div
              className="hidden md:block relative"
              ref={langDropdownRef}
              onMouseEnter={handleLangEnter}
              onMouseLeave={handleLangLeave}
            >
              <button
                type="button"
                onClick={() => {
                  setIsLangDropdownOpen(!isLangDropdownOpen);
                  setIsCatDropdownOpen(false);
                  setIsCountryDropdownOpen(false);
                  setIsResDropdownOpen(false);
                  setLangSearchQuery("");
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  selectedLanguage !== "All"
                    ? "bg-purple-600/20 text-purple-200 border-purple-500/40 shadow-sm"
                    : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800/80"
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                <span suppressHydrationWarning>{selectedLanguage === "All" ? "Language" : selectedLanguage}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                    isLangDropdownOpen ? "rotate-180 text-purple-300" : ""
                  }`}
                />
              </button>

              {/* Languages Dropdown Card */}
              {isLangDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 rounded-xl bg-zinc-950/95 border border-zinc-800/80 shadow-2xl shadow-black/80 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                  <div className="p-2.5 border-b border-zinc-800/80 bg-zinc-900/70 flex items-center space-x-2">
                    <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search languages..."
                      value={langSearchQuery}
                      onChange={(e) => setLangSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
                    />
                    {langSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setLangSearchQuery("")}
                        className="text-zinc-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
                    {filteredLanguages.length === 0 ? (
                      <div className="p-3 text-center text-xs text-zinc-500">
                        No language matches found.
                      </div>
                    ) : (
                      filteredLanguages.map((lang) => {
                        const isSelected = selectedLanguage === lang;
                        const count = languageCounts[lang] ?? 0;
                        return (
                          <button
                            type="button"
                            key={lang}
                            onClick={() => {
                              navigateHomeIfWatching();
                              setSelectedLanguage(lang);
                              setIsLangDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                              isSelected
                                ? "bg-purple-600/20 text-purple-200 border border-purple-500/30"
                                : "text-zinc-300 hover:text-white hover:bg-zinc-900"
                            }`}
                          >
                            <span className="truncate">{lang === "All" ? "All Languages" : lang}</span>
                            <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                                {count}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop: Resolution Dropdown */}
            <div
              className="hidden lg:block relative"
              ref={resDropdownRef}
              onMouseEnter={handleResEnter}
              onMouseLeave={handleResLeave}
            >
              <button
                type="button"
                onClick={() => {
                  setIsResDropdownOpen(!isResDropdownOpen);
                  setIsCatDropdownOpen(false);
                  setIsCountryDropdownOpen(false);
                  setIsLangDropdownOpen(false);
                  setResSearchQuery("");
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  selectedResolution !== "All"
                    ? "bg-purple-600/20 text-purple-200 border-purple-500/40 shadow-sm"
                    : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800/80"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
                <span suppressHydrationWarning>{selectedResolution === "All" ? "Resolution" : selectedResolution}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                    isResDropdownOpen ? "rotate-180 text-purple-300" : ""
                  }`}
                />
              </button>

              {/* Resolutions Dropdown Card */}
              {isResDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 rounded-xl bg-zinc-950/95 border border-zinc-800/80 shadow-2xl shadow-black/80 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                  <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
                    {filteredResolutions.length === 0 ? (
                      <div className="p-3 text-center text-xs text-zinc-500">
                        No resolution matches found.
                      </div>
                    ) : (
                      filteredResolutions.map((res) => {
                        const isSelected = selectedResolution === res;
                        const count = resolutionCounts[res] ?? 0;
                        return (
                          <button
                            type="button"
                            key={res}
                            onClick={() => {
                              navigateHomeIfWatching();
                              setSelectedResolution(res);
                              setIsResDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                              isSelected
                                ? "bg-purple-600/20 text-purple-200 border border-purple-500/30"
                                : "text-zinc-300 hover:text-white hover:bg-zinc-900"
                            }`}
                          >
                            <span className="truncate">{res === "All" ? "All Resolutions" : res}</span>
                            <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                                {count}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                navigateHomeIfWatching();
                setSelectedCategory("Favorites");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`hidden xl:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                selectedCategory === "Favorites"
                  ? "bg-purple-600/20 text-purple-200 border-purple-500/40 shadow-sm"
                  : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800/80"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${selectedCategory === "Favorites" ? "text-purple-400 fill-purple-400" : "text-zinc-400"}`} />
              <span>Favorites ({favorites.length})</span>
            </button>
          </div>

          {/* Desktop Right Action Controls */}
          <div className="hidden sm:flex items-center space-x-2.5 shrink-0">
            {/* Sync Channels Button */}
            <button
              type="button"
              onClick={() => syncChannels()}
              disabled={isSyncing || isSyncDone}
              className={`h-9 flex items-center space-x-1.5 px-3 rounded-lg border text-xs font-medium transition-all whitespace-nowrap select-none ${
                isSyncDone
                  ? "bg-emerald-950/40 border-emerald-600/50 text-emerald-400 cursor-default"
                  : isSyncing
                  ? "bg-purple-950/40 border-purple-500/50 text-purple-300 cursor-not-allowed opacity-90"
                  : "bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white cursor-pointer active:scale-95"
              }`}
              title={
                isSyncDone
                  ? "Channels & stream status up to date"
                  : isSyncing
                  ? "Syncing playlist & verifying stream status..."
                  : "Sync channels & stream status now"
              }
            >
              {isSyncDone ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isSyncing ? "animate-spin text-purple-400" : "text-zinc-400"
                  }`}
                />
              )}
              <span>{isSyncDone ? "Synced" : isSyncing ? "Syncing..." : "Sync"}</span>
            </button>

            {/* TV Guide Drawer Toggle */}
            <button
              onClick={() => setIsChannelGuideOpen(true)}
              className="h-9 flex items-center space-x-1.5 px-3 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-all whitespace-nowrap cursor-pointer"
              title="Open Live Guide"
            >
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              <span>TV Guide</span>
            </button>

            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="h-9 px-3 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all flex items-center justify-between space-x-2 text-xs whitespace-nowrap cursor-pointer w-40 sm:w-48 lg:w-56 shrink-0"
              title="Search channels (Ctrl+K)"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="text-zinc-400 font-normal truncate">Search TV...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-400 shrink-0 ml-1 font-mono leading-none">
                ⌘K
              </kbd>
            </button>

            {/* Support / Buy Me a Coffee */}
            <a
              href="https://buymeacoffee.com/usamasarwar"
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 hidden lg:flex items-center space-x-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-semibold transition-all whitespace-nowrap"
              title="Support the project on Buy Me a Coffee"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
              <span>Support</span>
            </a>

            {/* Import Custom Playlist */}
            <button
              onClick={() => setIsPlaylistModalOpen(true)}
              className="h-9 flex items-center space-x-1.5 px-3.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer whitespace-nowrap border border-transparent"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add M3U</span>
            </button>
          </div>

          {/* Mobile Right Quick Action Icons */}
          <div className="flex sm:hidden items-center space-x-1.5 shrink-0">
            {/* Mobile Sync Trigger */}
            <button
              type="button"
              onClick={() => syncChannels()}
              disabled={isSyncing || isSyncDone}
              className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors ${
                isSyncDone
                  ? "bg-emerald-950/40 border-emerald-600/50 text-emerald-400"
                  : isSyncing
                  ? "bg-purple-950/40 border-purple-500/50 text-purple-300"
                  : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
              }`}
              title={isSyncDone ? "Synced" : isSyncing ? "Syncing..." : "Sync"}
            >
              {isSyncDone ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <RefreshCw
                  className={`w-4 h-4 ${isSyncing ? "animate-spin text-purple-400" : "text-zinc-400"}`}
                />
              )}
            </button>

            {/* Add Playlist */}
            <button
              onClick={() => setIsPlaylistModalOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-purple-600 text-white shadow transition-colors cursor-pointer"
              title="Add M3U Playlist"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger / Filter Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                isMobileMenuOpen
                  ? "bg-purple-600 text-white border-purple-500"
                  : "bg-zinc-900 text-zinc-300 border-zinc-800"
              }`}
              title="Toggle Filters Menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer / Filters Bar */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="sm:hidden w-full px-4 pt-3 pb-4 mt-2 bg-zinc-950/95 border-b border-zinc-800/80 backdrop-blur-xl shadow-2xl animate-in slide-in-from-top-2 duration-200"
          >
            <div className="space-y-3">
              {/* Category selector row */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Category
                </label>
                <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    const count = categoryCounts[cat] ?? 0;
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => {
                          navigateHomeIfWatching();
                          setSelectedCategory(cat);
                        }}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-purple-600 text-white shadow"
                            : "bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800"
                        }`}
                      >
                        <span>{cat}</span>
                        <span className="text-[10px] opacity-75 font-mono">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Country selector row */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Country
                </label>
                <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
                  {countries.map((c) => {
                    const isSelected = selectedCountry === c;
                    const count = countryCounts[c] ?? 0;
                    return (
                      <button
                        type="button"
                        key={c}
                        onClick={() => {
                          navigateHomeIfWatching();
                          setSelectedCountry(c);
                        }}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-purple-600 text-white shadow"
                            : "bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800"
                        }`}
                      >
                        <span>{c}</span>
                        <span className="text-[10px] opacity-75 font-mono">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language selector row */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Language
                </label>
                <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
                  {languages.map((l) => {
                    const isSelected = selectedLanguage === l;
                    const count = languageCounts[l] ?? 0;
                    return (
                      <button
                        type="button"
                        key={l}
                        onClick={() => {
                          navigateHomeIfWatching();
                          setSelectedLanguage(l);
                        }}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-purple-600 text-white shadow"
                            : "bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800"
                        }`}
                      >
                        <span>{l}</span>
                        <span className="text-[10px] opacity-75 font-mono">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resolution selector row */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Resolution
                </label>
                <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
                  {resolutions.map((r) => {
                    const isSelected = selectedResolution === r;
                    const count = resolutionCounts[r] ?? 0;
                    return (
                      <button
                        type="button"
                        key={r}
                        onClick={() => {
                          navigateHomeIfWatching();
                          setSelectedResolution(r);
                        }}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-purple-600 text-white shadow"
                            : "bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800"
                        }`}
                      >
                        <span>{r}</span>
                        <span className="text-[10px] opacity-75 font-mono">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions Row */}
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                <button
                  onClick={() => {
                    navigateHomeIfWatching();
                    setSelectedCategory("Favorites");
                    setIsMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex items-center space-x-1.5 text-xs text-zinc-300 hover:text-white"
                >
                  <Heart className="w-3.5 h-3.5 fill-purple-400 text-purple-400" />
                  <span>My Favorites ({favorites.length})</span>
                </button>

                <a
                  href="https://buymeacoffee.com/usamasarwar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Support Project</span>
                </a>

                <button
                  onClick={() => {
                    navigateHomeIfWatching();
                    setSelectedCategory("All");
                    setSelectedCountry("All");
                    setSelectedLanguage("All");
                    setSelectedResolution("All");
                    setIsMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Fixed Floating Navigation Bar */}
      <nav suppressHydrationWarning className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-800/80 backdrop-blur-xl px-4 py-2 flex items-center justify-around shadow-2xl">
        <Link
          href="/"
          onClick={() => {
            setActiveChannel(null);
            setSelectedCategory("All");
            setSelectedCountry("All");
            setSelectedLanguage("All");
            window.scrollTo({ top: 0, behavior: "instant" });
          }}
          className={`flex flex-col items-center space-y-0.5 ${
            selectedCategory === "All" && selectedCountry === "All"
              ? "text-purple-400 font-bold"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Tv className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </Link>

        <button
          onClick={() => setIsChannelGuideOpen(true)}
          className="flex flex-col items-center space-y-0.5 text-gray-400 hover:text-purple-300"
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px]">TV Guide</span>
        </button>

        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex flex-col items-center space-y-0.5 text-gray-400 hover:text-purple-300"
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px]">Search</span>
        </button>

        <button
          onClick={() => {
            navigateHomeIfWatching();
            setSelectedCategory("Favorites");
          }}
          className={`flex flex-col items-center space-y-0.5 cursor-pointer ${
            selectedCategory === "Favorites"
              ? "text-purple-400 font-bold"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Heart
            className={`w-5 h-5 ${
              selectedCategory === "Favorites" ? "fill-purple-400 text-purple-400" : ""
            }`}
          />
          <span className="text-[10px]">Favorites</span>
        </button>
      </nav>
    </>
  );
}
