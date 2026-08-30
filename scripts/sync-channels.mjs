#!/usr/bin/env node

/**
 * Direct Channel Aggregator & Static Snapshot Generator
 * 
 * Aggregates IPTV channels and saves the verified snapshot directly to public/channels-snapshot.json
 * for purely static serving on GitHub Pages and edge CDNs.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultChannelsPath = path.resolve(__dirname, "../src/data/default-channels.ts");
const content = fs.readFileSync(defaultChannelsPath, "utf-8");

const jsCode = content
  .replace(/import\s+.*?;\n?/g, "")
  .replace(/: IPTVChannel\[\]/g, "")
  .replace(/export\s+const\s+/g, "const ") + "\nreturn { DEFAULT_CHANNELS, POPULAR_PLAYLIST_SOURCES };";

const { DEFAULT_CHANNELS, POPULAR_PLAYLIST_SOURCES } = new Function(jsCode)();

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

async function probeStream(url, timeoutMs = 4000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": BROWSER_UA, Accept: "*/*" },
    });
    clearTimeout(timeoutId);
    if (!res.ok) return false;
    const text = await res.text();
    return Boolean(text && text.includes("#EXTM3U"));
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

function parseM3USimple(m3uText) {
  const lines = m3uText.split(/\r?\n/);
  const channels = [];
  let current = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("#EXTINF:")) {
      const tvgIdMatch = trimmed.match(/tvg-id="([^"]*)"/i);
      const tvgNameMatch = trimmed.match(/tvg-name="([^"]*)"/i);
      const tvgLogoMatch = trimmed.match(/tvg-logo="([^"]*)"/i);
      const groupMatch = trimmed.match(/group-title="([^"]*)"/i);
      const countryMatch = trimmed.match(/tvg-country="([^"]*)"/i);
      const langMatch = trimmed.match(/tvg-language="([^"]*)"/i);

      const commaIdx = trimmed.lastIndexOf(",");
      const rawName = commaIdx !== -1 ? trimmed.substring(commaIdx + 1).trim() : "Live Channel";

      current = {
        name: rawName,
        tvgId: tvgIdMatch ? tvgIdMatch[1] : undefined,
        tvgName: tvgNameMatch ? tvgNameMatch[1] : undefined,
        logo: tvgLogoMatch ? tvgLogoMatch[1] : undefined,
        group: groupMatch ? groupMatch[1] : "Popular",
        country: countryMatch ? countryMatch[1] : undefined,
        language: langMatch ? langMatch[1] : undefined,
      };
    } else if (!trimmed.startsWith("#") && current.name && trimmed.startsWith("http")) {
      const id = `${current.name.toLowerCase().replace(/[^\w-]+/g, "-")}-${Math.random().toString(36).substring(2, 6)}`;
      channels.push({
        id,
        name: current.name,
        group: current.group || "Popular",
        logo: current.logo,
        url: trimmed,
        country: current.country,
        language: current.language,
        quality: "HD",
        description: `Live broadcast on ${current.group || "IPTV"} network.`,
      });
      current = {};
    }
  }

  return channels;
}

async function main() {
  console.log("=======================================================");
  console.log("⚡ IPTV Channel Sync & Snapshot Generator");
  console.log("=======================================================\n");

  const startTime = Date.now();
  const rawList = [...DEFAULT_CHANNELS];

  for (const source of POPULAR_PLAYLIST_SOURCES) {
    try {
      console.log(`Fetching source: ${source.name}...`);
      const res = await fetch(source.url, { headers: { "User-Agent": BROWSER_UA } });
      if (res.ok) {
        const text = await res.text();
        const parsed = parseM3USimple(text);
        rawList.push(...parsed);
        console.log(`✓ Loaded ${parsed.length} channels from ${source.name}`);
      }
    } catch (err) {
      console.warn(`⚠️ Failed to load source ${source.name}:`, err.message);
    }
  }

  // Deduplicate
  const seenUrls = new Set();
  const seenNames = new Set();
  const allChannels = [];

  for (const ch of rawList) {
    const normUrl = (ch.url || "").trim().replace(/\/+$/, "").toLowerCase();
    const normKey = `${(ch.name || "").trim().toLowerCase()}::${(ch.country || "").trim().toLowerCase()}`;

    if (normUrl && seenUrls.has(normUrl)) continue;
    if (normKey && seenNames.has(normKey)) continue;

    if (normUrl) seenUrls.add(normUrl);
    if (normKey) seenNames.add(normKey);
    allChannels.push(ch);
  }

  console.log(`\nAggregated ${allChannels.length} unique channels. Probing stream availability...`);

  const verifiedLiveSet = new Set();
  const offlineSet = new Set();
  const sample = allChannels.slice(0, 200);
  const BATCH_SIZE = 20;

  for (let i = 0; i < sample.length; i += BATCH_SIZE) {
    const batch = sample.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (channel) => {
        const isLive = await probeStream(channel.url, 4000);
        if (isLive) {
          verifiedLiveSet.add(channel.id);
          offlineSet.delete(channel.id);
        } else {
          if (!verifiedLiveSet.has(channel.id)) {
            offlineSet.add(channel.id);
          }
        }
      })
    );
  }

  const verifiedLiveChannelIds = Array.from(verifiedLiveSet);
  const offlineChannelIds = Array.from(offlineSet);

  const payload = {
    version: 1,
    lastUpdated: Date.now(),
    totalChannels: allChannels.length,
    verifiedLiveCount: verifiedLiveChannelIds.length,
    offlineCount: offlineChannelIds.length,
    verifiedLiveChannelIds,
    offlineChannelIds,
    channels: allChannels,
  };

  console.log("\n📊 Summary:");
  console.log(` - Total Channels: ${allChannels.length}`);
  console.log(` - Verified Live: ${verifiedLiveChannelIds.length}`);
  console.log(` - Offline: ${offlineChannelIds.length}`);

  const publicSnapshotPath = path.resolve(__dirname, "../public/channels-snapshot.json");
  console.log(`\nWriting static snapshot to: ${publicSnapshotPath}`);
  fs.writeFileSync(publicSnapshotPath, JSON.stringify(payload, null, 2), "utf-8");
  console.log("✅ Successfully saved snapshot to public/channels-snapshot.json");

  console.log(`✨ Sync completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
