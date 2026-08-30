"use client";

import React, { useState } from "react";
import { useIPTV } from "@/context/iptv-context";
import { POPULAR_PLAYLIST_SOURCES } from "@/data/default-channels";
import {
  X,
  Upload,
  Link,
  Check,
  AlertCircle,
  PlusCircle,
  Trash2,
  Tv,
  ListPlus,
  Sparkles,
} from "lucide-react";

export function PlaylistModal() {
  const {
    isPlaylistModalOpen,
    setIsPlaylistModalOpen,
    loadCustomPlaylistUrl,
    loadCustomPlaylistContent,
    customPlaylists,
    removePlaylist,
  } = useIPTV();

  const [activeTab, setActiveTab] = useState<"url" | "file" | "sources">("url");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  if (!isPlaylistModalOpen) return null;

  const handleImportUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl) return;

    setLoading(true);
    setStatusMsg(null);

    const success = await loadCustomPlaylistUrl(playlistUrl, playlistName || "Custom Web Playlist");
    setLoading(false);

    if (success) {
      setStatusMsg({ type: "success", text: "Playlist imported and channels loaded successfully!" });
      setPlaylistUrl("");
      setPlaylistName("");
    } else {
      setStatusMsg({
        type: "error",
        text: "Failed to parse playlist. Check URL or CORS policy of the playlist provider.",
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = loadCustomPlaylistContent(content, file.name.replace(/\.[^/.]+$/, ""));
        if (success) {
          setStatusMsg({
            type: "success",
            text: `Successfully imported channels from ${file.name}!`,
          });
        } else {
          setStatusMsg({
            type: "error",
            text: "No valid channels could be extracted from this M3U file.",
          });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleImportPreset = async (presetUrl: string, presetName: string) => {
    setLoading(true);
    setStatusMsg(null);
    const success = await loadCustomPlaylistUrl(presetUrl, presetName);
    setLoading(false);
    if (success) {
      setStatusMsg({ type: "success", text: `Loaded "${presetName}" successfully!` });
    } else {
      setStatusMsg({
        type: "error",
        text: `Could not load preset. You can copy the URL and import directly.`,
      });
    }
  };

  const handleImportAllSources = async () => {
    setLoading(true);
    setStatusMsg(null);
    let count = 0;
    for (const source of POPULAR_PLAYLIST_SOURCES) {
      const ok = await loadCustomPlaylistUrl(source.url, source.name);
      if (ok) count++;
    }
    setLoading(false);
    setStatusMsg({
      type: "success",
      text: `Successfully imported all ${count} open-source playlists!`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl shadow-black/90 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <ListPlus className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Manage IPTV Playlists</h3>
              <p className="text-xs text-zinc-400">
                Import custom M3U/M3U8 playlists or select popular open sources
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsPlaylistModalOpen(false)}
            className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 px-5 pt-3 space-x-4 bg-zinc-950">
          <button
            onClick={() => {
              setActiveTab("url");
              setStatusMsg(null);
            }}
            className={`pb-3 text-xs font-semibold flex items-center space-x-1.5 transition-all border-b-2 ${
              activeTab === "url"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>M3U URL</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("file");
              setStatusMsg(null);
            }}
            className={`pb-3 text-xs font-semibold flex items-center space-x-1.5 transition-all border-b-2 ${
              activeTab === "file"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload .M3U File</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("sources");
              setStatusMsg(null);
            }}
            className={`pb-3 text-xs font-semibold flex items-center space-x-1.5 transition-all border-b-2 ${
              activeTab === "sources"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Open Sources</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 border ${
                statusMsg.type === "success"
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                  : "bg-red-950/60 border-red-500/50 text-red-200"
              }`}
            >
              {statusMsg.type === "success" ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* TAB 1: M3U URL */}
          {activeTab === "url" && (
            <form onSubmit={handleImportUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Playlist Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Premium Channels"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  M3U / M3U8 Playlist URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/playlist.m3u"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Supports standard M3U/M3U8 URLs with #EXTINF directives.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Fetching and parsing playlist...</span>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Import Playlist URL</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: File Upload */}
          {activeTab === "file" && (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-2xl cursor-pointer bg-zinc-900/30 hover:bg-zinc-900/60 transition-all">
                <Upload className="w-10 h-10 text-zinc-400 mb-3" />
                <span className="text-sm font-semibold text-white">Click to upload .m3u file</span>
                <span className="text-xs text-zinc-500 mt-1">Supports UTF-8 M3U playlists</span>
                <input
                  type="file"
                  accept=".m3u,.m3u8,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* TAB 3: Curated Sources */}
          {activeTab === "sources" && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-xs text-zinc-400">
                  Select from verified open-source IPTV channels provided by the iptv-org initiative:
                </p>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleImportAllSources}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load All</span>
                </button>
              </div>

              {POPULAR_PLAYLIST_SOURCES.map((source, i) => {
                const isLoaded = customPlaylists.some(
                  (p) => p.url === source.url || p.name === source.name
                );
                return (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between group transition-all"
                  >
                    <div className="pr-3">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-zinc-200">
                          {source.name}
                        </h4>
                        {isLoaded && (
                          <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Loaded</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">{source.description}</p>
                    </div>
                    <button
                      disabled={loading}
                      onClick={() => handleImportPreset(source.url, source.name)}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isLoaded
                          ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                          : "bg-zinc-800 hover:bg-purple-600 text-zinc-300 hover:text-white border border-zinc-700"
                      }`}
                    >
                      {isLoaded ? "Reload" : "Load"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* User's Loaded Playlists List */}
          {customPlaylists.length > 0 && (
            <div className="pt-4 border-t border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Your Loaded Playlists ({customPlaylists.length})
              </h4>
              <div className="space-y-2">
                {customPlaylists.map((pl) => (
                  <div
                    key={pl.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <Tv className="w-4 h-4 text-purple-400" />
                      <span className="font-semibold text-white">{pl.name}</span>
                      <span className="text-zinc-500">({pl.channelCount} streams)</span>
                    </div>
                    <button
                      onClick={() => removePlaylist(pl.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                      title="Remove playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
