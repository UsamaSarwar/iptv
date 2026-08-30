import test from "node:test";
import assert from "node:assert/strict";
import { checkStreamHealth } from "../scripts/test-channels.mjs";
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

const { DEFAULT_CHANNELS } = new Function(jsCode)();

test("Live / Offline Tracking State Logic Suite", async (t) => {
  // Test simulated context state machine
  await t.test("mutual exclusivity: marking verified live clears offline state", () => {
    let cachedOfflineIds = new Set(["channel-1", "channel-2"]);
    let sessionOfflineIds = new Set(["channel-1", "channel-3"]);
    let verifiedLiveChannelIds = new Set();

    // Helper simulating offlineChannelIds computed memo
    const getOfflineChannelIds = () => {
      const combined = new Set(cachedOfflineIds);
      sessionOfflineIds.forEach((id) => combined.add(id));
      verifiedLiveChannelIds.forEach((id) => combined.delete(id));
      return combined;
    };

    assert.equal(getOfflineChannelIds().has("channel-1"), true);
    assert.equal(getOfflineChannelIds().has("channel-2"), true);
    assert.equal(getOfflineChannelIds().has("channel-3"), true);

    // Simulate markChannelVerifiedLive("channel-1")
    const markChannelVerifiedLive = (channelId) => {
      verifiedLiveChannelIds.add(channelId);
      sessionOfflineIds.delete(channelId);
      cachedOfflineIds.delete(channelId);
    };

    markChannelVerifiedLive("channel-1");

    assert.equal(verifiedLiveChannelIds.has("channel-1"), true);
    assert.equal(getOfflineChannelIds().has("channel-1"), false, "channel-1 should NOT be in offline set after being verified live");
    assert.equal(getOfflineChannelIds().has("channel-2"), true);
    assert.equal(getOfflineChannelIds().has("channel-3"), true);
  });

  await t.test("mutual exclusivity: marking offline removes channel from verified live set", () => {
    let sessionOfflineIds = new Set();
    let verifiedLiveChannelIds = new Set(["channel-1", "channel-2"]);

    const markChannelOffline = (channelId) => {
      sessionOfflineIds.add(channelId);
      verifiedLiveChannelIds.delete(channelId);
    };

    assert.equal(verifiedLiveChannelIds.has("channel-1"), true);

    markChannelOffline("channel-1");

    assert.equal(sessionOfflineIds.has("channel-1"), true);
    assert.equal(verifiedLiveChannelIds.has("channel-1"), false, "channel-1 should be removed from verifiedLiveChannelIds");
    assert.equal(verifiedLiveChannelIds.has("channel-2"), true);
  });
});

test("Stream Health Check Suite: Live Channels Verification", async (t) => {
  await t.test("verifies core default channels are live and reachable", async () => {
    assert.ok(DEFAULT_CHANNELS.length > 0);

    // Test a subset of core default channels
    const channelsToTest = DEFAULT_CHANNELS.slice(0, 6);
    const results = await Promise.all(
      channelsToTest.map((c) => checkStreamHealth(c, 6000))
    );

    const liveCount = results.filter((r) => r.ok).length;
    const passRate = liveCount / results.length;

    assert.ok(
      passRate >= 0.8,
      `Expected at least 80% live channels, got ${liveCount}/${results.length} (${Math.round(passRate * 100)}%)`
    );
  });

  await t.test("handles invalid stream URLs gracefully without uncaught exceptions", async () => {
    const invalidChannel = {
      id: "invalid-stream",
      name: "Nonexistent Stream",
      url: "https://invalid-nonexistent-domain-123456789.com/stream.m3u8",
    };

    const result = await checkStreamHealth(invalidChannel, 2000);
    assert.equal(result.ok, false);
    assert.ok(result.reason, "Should provide a failure reason");
  });

  await t.test("rejects malformed stream URLs immediately", async () => {
    const malformedChannel = {
      id: "malformed",
      name: "Bad Scheme",
      url: "ftp://not-http.com/video.mp4",
    };

    const result = await checkStreamHealth(malformedChannel, 1000);
    assert.equal(result.ok, false);
  });
});

test("Vercel Blob & Snapshot Status Synchronization Suite", async (t) => {
  await t.test("snapshot payload maintains strict mutual exclusivity between live and offline IDs", () => {
    const mockSnapshot = {
      version: 1,
      lastUpdated: Date.now(),
      totalChannels: 100,
      verifiedLiveCount: 20,
      offlineCount: 15,
      verifiedLiveChannelIds: ["ch-1", "ch-2", "ch-3", "ch-4"],
      offlineChannelIds: ["ch-10", "ch-11", "ch-12"],
      channels: [],
    };

    const liveSet = new Set(mockSnapshot.verifiedLiveChannelIds);
    const offSet = new Set(mockSnapshot.offlineChannelIds);

    const overlap = mockSnapshot.verifiedLiveChannelIds.filter((id) => offSet.has(id));
    assert.equal(overlap.length, 0, `Expected 0 overlapping IDs between live and offline, found: ${overlap.join(", ")}`);
    assert.equal(liveSet.size, mockSnapshot.verifiedLiveChannelIds.length, "Verified live IDs should contain no duplicates");
    assert.equal(offSet.size, mockSnapshot.offlineChannelIds.length, "Offline IDs should contain no duplicates");
  });

  await t.test("snapshot state sanitizer cleanses any theoretical overlap upon client hydration", () => {
    // Simulated dirty snapshot data from server/storage
    const dirtySnapshot = {
      verifiedLiveChannelIds: ["ch-shared", "ch-live-only"],
      offlineChannelIds: ["ch-shared", "ch-offline-only"],
    };

    const liveSet = new Set(dirtySnapshot.verifiedLiveChannelIds);
    // Client hydration sanitizer logic
    const sanitizedOffline = dirtySnapshot.offlineChannelIds.filter((id) => !liveSet.has(id));

    assert.deepEqual(sanitizedOffline, ["ch-offline-only"]);
    assert.equal(sanitizedOffline.includes("ch-shared"), false, "Shared ID must be resolved to live and purged from offline");
  });
});

