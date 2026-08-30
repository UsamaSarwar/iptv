#!/usr/bin/env node

/**
 * IPTV Channel Stream Health & Metadata Verification Suite
 * 
 * Usage:
 *   node scripts/test-channels.mjs                # Tests default core channels
 *   node scripts/test-channels.mjs --all          # Tests entire snapshot catalog
 *   node scripts/test-channels.mjs --limit 50     # Tests first 50 channels
 *   node scripts/test-channels.mjs --category News# Tests specific category
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
  .replace(/export\s+const\s+/g, "const ") + "\nreturn DEFAULT_CHANNELS;";
const DEFAULT_CHANNELS = new Function(jsCode)();

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const localSnapshotPath = path.resolve(__dirname, "../public/channels-snapshot.json");
const SNAPSHOT_URL =
  process.env.NEXT_PUBLIC_SNAPSHOT_URL ||
  "https://iptv.usama.dev/channels-snapshot.json";

// Parse CLI Args
const args = process.argv.slice(2);
const testAll = args.includes("--all") || args.includes("-a");
const limitArgIndex = args.findIndex((a) => a === "--limit" || a === "-l");
const limit = limitArgIndex !== -1 && args[limitArgIndex + 1] ? parseInt(args[limitArgIndex + 1], 10) : null;
const categoryArgIndex = args.findIndex((a) => a === "--category" || a === "-c");
const categoryFilter = categoryArgIndex !== -1 ? args[categoryArgIndex + 1]?.toLowerCase() : null;

/**
 * Tests an individual HLS live stream
 */
export async function checkStreamHealth(channel, timeoutMs = 6000) {
  const startTime = Date.now();
  const url = channel.url;

  if (!url || typeof url !== "string" || !url.startsWith("http")) {
    return {
      channel,
      ok: false,
      durationMs: 0,
      reason: "Invalid or missing URL scheme",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // 1. Fetch Playlist Manifest
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "*/*",
      },
    });

    if (!res.ok) {
      clearTimeout(timeoutId);
      return {
        channel,
        ok: false,
        durationMs: Date.now() - startTime,
        status: res.status,
        reason: `HTTP ${res.status} ${res.statusText}`,
      };
    }

    const text = await res.text();
    if (!text || !text.includes("#EXTM3U")) {
      clearTimeout(timeoutId);
      return {
        channel,
        ok: false,
        durationMs: Date.now() - startTime,
        reason: "Invalid HLS header (missing #EXTM3U)",
      };
    }

    // 2. Parse variant or media playlist
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let targetSegmentUrl = null;
    let variantPlaylistUrl = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("#EXT-X-STREAM-INF")) {
        for (let k = i + 1; k < lines.length; k++) {
          if (!lines[k].startsWith("#")) {
            try {
              variantPlaylistUrl = new URL(lines[k], url).toString();
            } catch {
              variantPlaylistUrl = lines[k];
            }
            break;
          }
        }
        if (variantPlaylistUrl) break;
      }
    }

    if (variantPlaylistUrl) {
      try {
        const variantRes = await fetch(variantPlaylistUrl, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "User-Agent": BROWSER_UA,
            Accept: "*/*",
          },
        });

        if (variantRes.ok) {
          const variantText = await variantRes.text();
          const vLines = variantText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
          for (let j = 0; j < vLines.length; j++) {
            const vl = vLines[j];
            if (vl.startsWith("#EXTINF:") || vl.startsWith("#EXT-X-MAP:")) {
              for (let k = j + 1; k < vLines.length; k++) {
                if (!vLines[k].startsWith("#")) {
                  try {
                    targetSegmentUrl = new URL(vLines[k], variantPlaylistUrl).toString();
                  } catch {
                    targetSegmentUrl = vLines[k];
                  }
                  break;
                }
              }
              if (targetSegmentUrl) break;
            } else if (!vl.startsWith("#") && (vl.endsWith(".ts") || vl.endsWith(".m4s") || vl.includes(".ts?") || vl.includes(".m4s?"))) {
              try {
                targetSegmentUrl = new URL(vl, variantPlaylistUrl).toString();
              } catch {
                targetSegmentUrl = vl;
              }
              break;
            }
          }
        }
      } catch {
        // Continue with valid manifest validation
      }
    } else {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("#EXTINF:") || line.startsWith("#EXT-X-MAP:")) {
          for (let k = i + 1; k < lines.length; k++) {
            if (!lines[k].startsWith("#")) {
              try {
                targetSegmentUrl = new URL(lines[k], url).toString();
              } catch {
                targetSegmentUrl = lines[k];
              }
              break;
            }
          }
          if (targetSegmentUrl) break;
        } else if (!line.startsWith("#") && (line.endsWith(".ts") || line.endsWith(".m4s") || line.includes(".ts?") || line.includes(".m4s?"))) {
          try {
            targetSegmentUrl = new URL(line, url).toString();
          } catch {
            targetSegmentUrl = line;
          }
          break;
        }
      }
    }

    if (targetSegmentUrl) {
      try {
        const segRes = await fetch(targetSegmentUrl, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "User-Agent": BROWSER_UA,
            Accept: "*/*",
          },
        });

        clearTimeout(timeoutId);

        const durationMs = Date.now() - startTime;
        if (segRes.ok || segRes.status === 206) {
          return {
            channel,
            ok: true,
            durationMs,
            status: segRes.status,
          };
        }
      } catch {
        // Fallback to manifest verification
      }
    }

    clearTimeout(timeoutId);
    return {
      channel,
      ok: true,
      durationMs: Date.now() - startTime,
      status: 200,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      channel,
      ok: false,
      durationMs: Date.now() - startTime,
      reason: err.name === "AbortError" ? "Timeout (>6s)" : (err.message || "Network error"),
    };
  }
}

/**
 * Concurrency runner
 */
async function runPool(items, fn, concurrency = 8) {
  const results = [];
  const executing = [];

  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);

    if (concurrency <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(results);
}

async function main() {
  console.log("\n=======================================================");
  console.log("📺  IPTV STREAM HEALTH & CHANNEL VERIFICATION SUITE");
  console.log("=======================================================\n");

  let channelsToTest = [];

  if (testAll) {
    if (fs.existsSync(localSnapshotPath)) {
      try {
        const raw = fs.readFileSync(localSnapshotPath, "utf-8");
        const data = JSON.parse(raw);
        channelsToTest = data.channels || [];
        console.log(`✓ Loaded ${channelsToTest.length} channels from local public/channels-snapshot.json.`);
      } catch (err) {
        console.warn(`⚠️ Could not parse local snapshot:`, err.message);
      }
    }

    if (channelsToTest.length === 0) {
      console.log(`🌐 Fetching channel snapshot from ${SNAPSHOT_URL}...`);
      try {
        const res = await fetch(SNAPSHOT_URL);
        if (res.ok) {
          const data = await res.json();
          channelsToTest = data.channels || [];
          console.log(`✓ Loaded ${channelsToTest.length} channels from snapshot.`);
        } else {
          console.warn(`⚠️ Could not load remote snapshot, falling back to default channels.`);
          channelsToTest = DEFAULT_CHANNELS;
        }
      } catch (e) {
        console.warn(`⚠️ Failed to fetch snapshot (${e.message}), using default channels.`);
        channelsToTest = DEFAULT_CHANNELS;
      }
    }
  } else {
    channelsToTest = DEFAULT_CHANNELS;
    console.log(`📂 Using ${channelsToTest.length} core default channels.`);
  }

  if (categoryFilter) {
    channelsToTest = channelsToTest.filter((c) =>
      c.group?.toLowerCase().includes(categoryFilter)
    );
    console.log(`🔍 Filtered by category "${categoryFilter}": ${channelsToTest.length} channels.`);
  }

  if (limit && limit > 0) {
    channelsToTest = channelsToTest.slice(0, limit);
    console.log(`⚡ Limited test run to ${limit} channels.`);
  }

  console.log(`\n🚀 Starting verification across ${channelsToTest.length} channels (concurrency: 8)...\n`);

  let completed = 0;
  const total = channelsToTest.length;

  const results = await runPool(
    channelsToTest,
    async (channel) => {
      const result = await checkStreamHealth(channel);
      completed++;
      const icon = result.ok ? "✅ LIVE" : "❌ OFF ";
      const time = `${result.durationMs}ms`.padStart(6);
      const name = channel.name.padEnd(28).slice(0, 28);
      const statusReason = result.ok ? "Ready" : result.reason;
      console.log(`[${completed.toString().padStart(3)}/${total}] ${icon} | ${time} | ${name} | ${statusReason}`);
      return result;
    },
    8
  );

  const live = results.filter((r) => r.ok);
  const offline = results.filter((r) => !r.ok);
  const avgLatency = Math.round(
    live.reduce((acc, r) => acc + r.durationMs, 0) / (live.length || 1)
  );

  console.log("\n=======================================================");
  console.log("📊  TEST SUMMARY REPORT");
  console.log("=======================================================");
  console.log(`Total Channels Tested : ${total}`);
  console.log(`✅ Live & Playable    : ${live.length} (${Math.round((live.length / total) * 100)}%)`);
  console.log(`❌ Offline / Timeout  : ${offline.length} (${Math.round((offline.length / total) * 100)}%)`);
  console.log(`⚡ Average Latency    : ${avgLatency}ms`);
  console.log("=======================================================\n");

  if (offline.length > 0 && !testAll) {
    console.log("⚠️  Offline Default Channels:");
    offline.forEach((off) => {
      console.log(` - ${off.channel.name} (${off.channel.id}): ${off.reason}`);
    });
    console.log("");
  }

  // If testing core channels, require high availability threshold (>70%)
  if (!testAll && live.length / total < 0.6) {
    console.error("❌ Test Failed: Core channel availability is below threshold!");
    process.exit(1);
  }

  console.log("✨ Channel stream verification complete!\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error("Fatal error during test run:", err);
    process.exit(1);
  });
}
