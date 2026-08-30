"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useIPTV, getCountryFlagEmoji } from "@/context/iptv-context";
import { Globe, X, Search, Check, Sparkles, Radio } from "lucide-react";

export function CountryPromptModal() {
  const {
    isCountryModalOpen,
    dismissCountryPrompt,
    selectedCountry,
    setSelectedCountry,
    countries,
    countryCounts,
    detectedUserCountry,
  } = useIPTV();

  const [searchQuery, setSearchQuery] = useState("");
  const [candidateOverride, setCandidateOverride] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCandidate =
    candidateOverride ?? (detectedUserCountry || (selectedCountry !== "All" ? selectedCountry : "All"));

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCountryModalOpen) {
        dismissCountryPrompt();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCountryModalOpen, dismissCountryPrompt]);

  // Focus search input when modal is displayed
  useEffect(() => {
    if (isCountryModalOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isCountryModalOpen]);

  // Filter countries by search query
  const filteredCountries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return countries;
    return countries.filter((c) => c.toLowerCase().includes(q));
  }, [countries, searchQuery]);

  if (!isCountryModalOpen) return null;

  const handleApply = (countryName: string) => {
    setSelectedCountry(countryName);
    dismissCountryPrompt();
    setCandidateOverride(null);
    setSearchQuery("");
  };

  const handleClose = () => {
    dismissCountryPrompt();
    setCandidateOverride(null);
    setSearchQuery("");
  };

  const detectedCount = detectedUserCountry ? countryCounts[detectedUserCountry] || 0 : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="country-modal-title"
      onClick={handleClose}
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-5 sm:p-6 text-white space-y-4 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 id="country-modal-title" className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                <span>Choose Broadcast Region</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Filter live channels by country or browse worldwide television.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Dismiss country selection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Detected Country Quick Action Banner */}
        {detectedUserCountry && (
          <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-purple-500/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl" role="img" aria-label={detectedUserCountry}>
                  {getCountryFlagEmoji(detectedUserCountry)}
                </span>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-white">{detectedUserCountry}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Detected Location
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {detectedCount > 0 ? `${detectedCount} live channels` : "Regional live streams"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleApply(detectedUserCountry)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Switch to {detectedUserCountry}</span>
              </button>
            </div>
          </div>
        )}

        {/* Search Countries */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all available countries..."
            className="w-full pl-9.5 pr-4 py-2.5 bg-zinc-900/80 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Scrollable Countries List */}
        <div className="flex-1 overflow-y-auto max-h-60 space-y-1 pr-1 scroll-smooth">
          {filteredCountries.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No countries matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredCountries.map((c) => {
              const isSelected = selectedCandidate === c;
              const count = countryCounts[c] || 0;
              const flag = getCountryFlagEmoji(c);

              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCandidateOverride(c)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-purple-600 text-white font-bold"
                      : "bg-zinc-900/40 hover:bg-zinc-900 text-zinc-200 border border-transparent hover:border-zinc-800"
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="text-base" role="img" aria-label={c}>
                      {flag}
                    </span>
                    <span className="truncate">{c === "All" ? "All Countries (Global)" : c}</span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-zinc-800/80 text-zinc-400 border border-zinc-700/50"
                      }`}
                    >
                      {count}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => handleApply("All")}
            className="px-3.5 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors font-medium cursor-pointer"
          >
            Explore Global (All)
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold border border-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleApply(selectedCandidate)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-md cursor-pointer active:scale-95"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Apply Selection</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
