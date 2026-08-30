import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INDEXNOW_KEY = "ab045a05655e44a8905085dff8b50b72";
const HOST = "iptv.usama.dev";
const BASE_URL = `https://${HOST}`;
const KEY_LOCATION = `${BASE_URL}/${INDEXNOW_KEY}.txt`;
const BATCH_SIZE = 10_000;

const PROVIDERS = [
  { name: "IndexNow", url: "https://api.indexnow.org/indexnow" },
  { name: "Bing", url: "https://www.bing.com/indexnow" },
  { name: "Yandex", url: "https://yandex.com/indexnow" },
  { name: "Naver", url: "https://searchadvisor.naver.com/indexnow" },
  { name: "Yep", url: "https://indexnow.yep.com/indexnow" },
];

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getChannelSlug(channel) {
  if (channel?.id) {
    const idSlug = slugify(channel.id);
    if (idSlug) return idSlug;
  }
  return slugify(channel?.name);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out.length ? out : [[]];
}

function extractUrlsFromSitemap(xml) {
  const urls = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let match;
  while ((match = re.exec(xml)) !== null) {
    urls.push(match[1].trim());
  }
  return urls;
}

function buildUrlsFromChannels(channels) {
  const staticPages = [BASE_URL, `${BASE_URL}/terms`, `${BASE_URL}/privacy`];

  const categories = new Set();
  const countries = new Set();
  const channelPages = [];

  for (const channel of channels) {
    for (const part of String(channel.group || "General").split(/[;,/]/)) {
      const cat = part.trim();
      if (cat) categories.add(cat);
    }
    const country = channel.country?.trim();
    if (country) countries.add(country);

    const slug = getChannelSlug(channel);
    if (slug) channelPages.push(`${BASE_URL}/watch/${slug}`);
  }

  return [
    ...staticPages,
    ...Array.from(categories).map(
      (cat) => `${BASE_URL}/?category=${encodeURIComponent(cat)}`
    ),
    ...Array.from(countries).map(
      (country) => `${BASE_URL}/?country=${encodeURIComponent(country)}`
    ),
    ...channelPages,
  ];
}

async function fetchUrlsFromSnapshot() {
  const localSnapshotPath = path.resolve(__dirname, "../public/channels-snapshot.json");
  if (fs.existsSync(localSnapshotPath)) {
    const raw = fs.readFileSync(localSnapshotPath, "utf-8");
    const data = JSON.parse(raw);
    if (Array.isArray(data.channels) && data.channels.length > 0) {
      return buildUrlsFromChannels(data.channels);
    }
  }

  const remoteUrl =
    process.env.NEXT_PUBLIC_SNAPSHOT_URL ||
    `${BASE_URL}/channels-snapshot.json`;

  const res = await fetch(remoteUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`Snapshot HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.channels) || data.channels.length === 0) {
    throw new Error("Snapshot has no channels");
  }
  return buildUrlsFromChannels(data.channels);
}

async function fetchUrlsFromSitemap() {
  const res = await fetch(`${BASE_URL}/sitemap.xml`, {
    headers: { Accept: "application/xml,text/xml,*/*" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Sitemap HTTP ${res.status}`);
  const urls = extractUrlsFromSitemap(await res.text());
  if (urls.length === 0) throw new Error("Sitemap contained no URLs");
  return urls;
}

async function collectUrls() {
  try {
    const urls = await fetchUrlsFromSnapshot();
    console.log(`[IndexNow] Built ${urls.length} URLs from channel snapshot`);
    return Array.from(new Set(urls));
  } catch (snapshotErr) {
    console.warn(`[IndexNow] Snapshot unavailable (${snapshotErr.message}), trying sitemap...`);
  }

  try {
    const urls = await fetchUrlsFromSitemap();
    console.log(`[IndexNow] Loaded ${urls.length} URLs from live sitemap`);
    return Array.from(new Set(urls));
  } catch (sitemapErr) {
    console.warn(`[IndexNow] Sitemap unavailable (${sitemapErr.message}), using core pages`);
  }

  return [BASE_URL, `${BASE_URL}/terms`, `${BASE_URL}/privacy`];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * IndexNow engines fetch the key file to verify ownership. During a Vercel
 * build the new deploy is not live yet, so wait until production serves the key.
 */
async function waitForKeyFile({ attempts = 12, delayMs = 5000 } = {}) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(KEY_LOCATION, { cache: "no-store" });
      const body = res.ok ? (await res.text()).trim() : "";
      if (res.ok && body === INDEXNOW_KEY) {
        console.log(`[IndexNow] Key file verified at ${KEY_LOCATION}`);
        return true;
      }
      console.log(
        `[IndexNow] Key not ready yet (attempt ${i}/${attempts}, HTTP ${res.status})`
      );
    } catch (err) {
      console.log(
        `[IndexNow] Key check failed (attempt ${i}/${attempts}): ${err.message}`
      );
    }
    if (i < attempts) await sleep(delayMs);
  }
  return false;
}

function isVerificationPending(status, error) {
  if (status === 202) return true;
  const text = String(error || "");
  return (
    status === 403 &&
    (/SiteVerificationNotCompleted/i.test(text) ||
      /key couldn't be loaded/i.test(text) ||
      /Failed to get key file/i.test(text) ||
      /Forbidden/i.test(text))
  );
}

async function submitProvider(provider, urlList) {
  const batches = chunk(urlList, BATCH_SIZE);
  let lastStatus = 0;

  for (const batch of batches) {
    if (batch.length === 0) continue;

    const res = await fetch(provider.url, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: KEY_LOCATION,
        urlList: batch,
      }),
    });

    lastStatus = res.status;
    const body = await res.text().catch(() => "");

    // 200 OK / 202 Accepted (verification pending) count as success
    if (res.ok || res.status === 202) {
      continue;
    }

    return {
      provider: provider.name,
      ok: false,
      pending: isVerificationPending(res.status, body),
      status: res.status,
      error: body.slice(0, 300) || res.statusText,
    };
  }

  return {
    provider: provider.name,
    ok: true,
    pending: lastStatus === 202,
    status: lastStatus || 200,
  };
}

async function main() {
  const isCI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
  const force = process.env.INDEXNOW_FORCE === "1";

  // Only run when explicitly forced or configured
  if (!force && !isCI) {
    console.log(
      `[IndexNow] Skipping submit (Run with INDEXNOW_FORCE=1 to trigger IndexNow submission)`
    );
    return;
  }

  console.log("[IndexNow] Checking that key file is publicly reachable...");
  // During build the *new* deploy is not live yet. After the first successful
  // deploy that hosts the key, subsequent builds see it immediately from prod.
  const keyReady = await waitForKeyFile({ attempts: 3, delayMs: 2000 });

  if (!keyReady) {
    console.warn(
      "[IndexNow] Key file not live yet (expected on first deploy before outputs go public). Daily cron / next deploy will retry."
    );
    return;
  }

  console.log("[IndexNow] Submitting URLs to all providers...");

  const urls = await collectUrls();
  console.log(`[IndexNow] Submitting ${urls.length} URLs to ${PROVIDERS.length} providers`);

  const results = await Promise.all(PROVIDERS.map((p) => submitProvider(p, urls)));

  for (const result of results) {
    if (result.ok) {
      const note = result.pending ? " (verification pending)" : "";
      console.log(`[IndexNow] ${result.provider}: OK (HTTP ${result.status})${note}`);
    } else if (result.pending) {
      console.warn(
        `[IndexNow] ${result.provider}: verification pending (HTTP ${result.status}) — will succeed on next run`
      );
    } else {
      console.warn(
        `[IndexNow] ${result.provider}: FAILED (HTTP ${result.status}) ${result.error || ""}`
      );
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  console.log(`[IndexNow] Done — ${okCount}/${results.length} providers accepted submissions`);
}

main().catch((err) => {
  // Never fail the Vercel build because of IndexNow
  console.warn("[IndexNow] Submit failed (non-fatal):", err);
  process.exit(0);
});
