import test from "node:test";
import assert from "node:assert/strict";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getChannelSlug(channel) {
  if (channel.id) {
    const idSlug = slugify(channel.id);
    if (idSlug) return idSlug;
  }
  return slugify(channel.name);
}

function getChannelBySlug(slug, allChannels) {
  const lowerSlug = slug.toLowerCase().trim();

  // 1. Exact ID match
  const exactIdMatch = allChannels.find(
    (c) => c.id.toLowerCase() === lowerSlug || slugify(c.id) === lowerSlug
  );
  if (exactIdMatch) return exactIdMatch;

  // 2. Canonical getChannelSlug match
  const slugMatch = allChannels.find((c) => getChannelSlug(c) === lowerSlug);
  if (slugMatch) return slugMatch;

  // 3. Name slug match (handles generic or legacy /watch/minimax links)
  const nameMatches = allChannels.filter((c) => slugify(c.name) === lowerSlug);
  if (nameMatches.length === 1) {
    return nameMatches[0];
  }
  if (nameMatches.length > 1) {
    return nameMatches.sort((a, b) => {
      const getScore = (ch) => {
        let score = 0;
        const q = (ch.quality || "").toLowerCase();
        if (q.includes("4k") || q.includes("uhd")) score += 40;
        else if (q.includes("1080") || q.includes("fhd")) score += 30;
        else if (q.includes("720") || q.includes("hd")) score += 20;
        else score += 10;
        if (ch.logo) score += 5;
        if (ch.backdrop) score += 2;
        return score;
      };
      return getScore(b) - getScore(a);
    })[0];
  }

  return undefined;
}

test("Channel Slug & ID Collision Prevention Suite", async (t) => {
  const mockChannels = [
    {
      id: "minimax-hu-sd-1234",
      name: "Minimax",
      group: "Kids",
      country: "Hungary",
      quality: "SD",
      url: "http://88.212.15.19/live/minimax_hun/index.m3u8",
      logo: "https://i.imgur.com/hu.png",
    },
    {
      id: "minimax-pk-360p-5678",
      name: "Minimax",
      group: "Kids",
      country: "Pakistan",
      quality: "360p",
      url: "https://vodzong.mjunoon.tv/streamtest/minimax.m3u8",
      logo: "https://i.imgur.com/pk.png",
    },
    {
      id: "minimax-cz-hd-9999",
      name: "Minimax",
      group: "Kids",
      country: "Czechia",
      quality: "HD",
      url: "http://88.212.15.19/live/minimax_cz/index.m3u8",
      logo: "https://i.imgur.com/cz.png",
    },
  ];

  await t.test("generates unique slugs for channels sharing identical display names", () => {
    const slugs = mockChannels.map((c) => getChannelSlug(c));
    assert.equal(slugs[0], "minimax-hu-sd-1234");
    assert.equal(slugs[1], "minimax-pk-360p-5678");
    assert.equal(slugs[2], "minimax-cz-hd-9999");
    assert.equal(new Set(slugs).size, 3, "All 3 channels should have unique slugs");
  });

  await t.test("accurately resolves the exact requested channel without mismatching", () => {
    // When requesting Pakistan Minimax by its unique slug:
    const matchedPk = getChannelBySlug("minimax-pk-360p-5678", mockChannels);
    assert.ok(matchedPk);
    assert.equal(matchedPk.id, "minimax-pk-360p-5678");
    assert.equal(matchedPk.country, "Pakistan");
    assert.equal(matchedPk.quality, "360p");
    assert.equal(matchedPk.url, "https://vodzong.mjunoon.tv/streamtest/minimax.m3u8");

    // When requesting Hungary Minimax by its unique slug:
    const matchedHu = getChannelBySlug("minimax-hu-sd-1234", mockChannels);
    assert.ok(matchedHu);
    assert.equal(matchedHu.id, "minimax-hu-sd-1234");
    assert.equal(matchedHu.country, "Hungary");
    assert.equal(matchedHu.quality, "SD");
  });

  await t.test("legacy / generic slug lookup falls back gracefully to highest quality", () => {
    const fallbackMatch = getChannelBySlug("minimax", mockChannels);
    assert.ok(fallbackMatch);
    // HD should be selected over SD and 360p
    assert.equal(fallbackMatch.quality, "HD");
    assert.equal(fallbackMatch.country, "Czechia");
  });
});
