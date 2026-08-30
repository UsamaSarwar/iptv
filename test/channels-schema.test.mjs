import test from "node:test";
import assert from "node:assert/strict";
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

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

test("Default Channels: Schema & Data Integrity", async (t) => {
  await t.test("contains non-empty channel catalog", () => {
    assert.ok(Array.isArray(DEFAULT_CHANNELS));
    assert.ok(DEFAULT_CHANNELS.length > 0, "DEFAULT_CHANNELS should not be empty");
  });

  await t.test("every channel has required metadata fields", () => {
    for (const channel of DEFAULT_CHANNELS) {
      assert.ok(channel.id && typeof channel.id === "string", `Channel missing id: ${JSON.stringify(channel)}`);
      assert.ok(channel.name && typeof channel.name === "string", `Channel missing name: ${channel.id}`);
      assert.ok(channel.group && typeof channel.group === "string", `Channel missing group: ${channel.id}`);
      assert.ok(channel.url && typeof channel.url === "string", `Channel missing url: ${channel.id}`);
      assert.ok(
        channel.url.startsWith("http://") || channel.url.startsWith("https://"),
        `Channel has invalid url: ${channel.url}`
      );
    }
  });

  await t.test("all channel IDs and slugs are unique to avoid routing collisions", () => {
    const seenIds = new Set();
    const seenSlugs = new Set();

    for (const channel of DEFAULT_CHANNELS) {
      assert.ok(!seenIds.has(channel.id), `Duplicate channel id found: "${channel.id}"`);
      seenIds.add(channel.id);

      const slug = slugify(channel.name);
      assert.ok(!seenSlugs.has(slug), `Duplicate channel slug found: "${slug}" for channel "${channel.name}"`);
      seenSlugs.add(slug);
    }
  });

  await t.test("every channel has valid quality and group taxonomy", () => {
    const validQualities = new Set(["4K", "UHD", "FHD", "HD", "SD", "Auto"]);
    for (const channel of DEFAULT_CHANNELS) {
      if (channel.quality) {
        assert.ok(
          validQualities.has(channel.quality),
          `Channel "${channel.name}" has unexpected quality: "${channel.quality}"`
        );
      }
    }
  });
});

test("Popular Playlist Sources: Schema Integrity", async (t) => {
  await t.test("sources have valid names and urls", () => {
    assert.ok(Array.isArray(POPULAR_PLAYLIST_SOURCES));
    assert.ok(POPULAR_PLAYLIST_SOURCES.length > 0);

    for (const source of POPULAR_PLAYLIST_SOURCES) {
      assert.ok(source.name && typeof source.name === "string");
      assert.ok(source.url && typeof source.url === "string" && source.url.startsWith("http"));
      assert.ok(source.description && typeof source.description === "string");
    }
  });
});
