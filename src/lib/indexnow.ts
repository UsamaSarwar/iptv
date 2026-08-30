export const INDEXNOW_KEY = "ab045a05655e44a8905085dff8b50b72";

export const INDEXNOW_KEY_LOCATION = `https://iptv.usama.dev/${INDEXNOW_KEY}.txt`;

/** All participating IndexNow search-engine endpoints */
export const INDEXNOW_PROVIDERS = [
  { name: "IndexNow", url: "https://api.indexnow.org/indexnow" },
  { name: "Bing", url: "https://www.bing.com/indexnow" },
  { name: "Yandex", url: "https://yandex.com/indexnow" },
  { name: "Naver", url: "https://searchadvisor.naver.com/indexnow" },
  { name: "Yep", url: "https://indexnow.yep.com/indexnow" },
] as const;

export const INDEXNOW_BATCH_SIZE = 10_000;

export type IndexNowProviderResult = {
  provider: string;
  url: string;
  ok: boolean;
  status: number;
  batchCount: number;
  error?: string;
};

function chunkUrls(urls: string[], size: number): string[][] {
  const batches: string[][] = [];
  for (let i = 0; i < urls.length; i += size) {
    batches.push(urls.slice(i, i + size));
  }
  return batches.length > 0 ? batches : [[]];
}

/**
 * Submits URLs to every IndexNow provider (Bing, Yandex, Naver, Seznam, Yep, shared API).
 * Batches at the protocol limit of 10,000 URLs per request.
 */
export async function submitToIndexNowProviders(
  host: string,
  urlList: string[]
): Promise<IndexNowProviderResult[]> {
  const uniqueUrls = Array.from(new Set(urlList.filter(Boolean)));
  const batches = chunkUrls(uniqueUrls, INDEXNOW_BATCH_SIZE);

  const payloadBase = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
  };

  return Promise.all(
    INDEXNOW_PROVIDERS.map(async (provider) => {
      try {
        let lastStatus = 0;

        for (const batch of batches) {
          if (batch.length === 0) continue;

          const res = await fetch(provider.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify({
              ...payloadBase,
              urlList: batch,
            }),
            cache: "no-store",
          });

          lastStatus = res.status;

          // 200 OK / 202 Accepted (key validation pending) are success
          if (!res.ok && res.status !== 202) {
            const body = await res.text().catch(() => "");
            return {
              provider: provider.name,
              url: provider.url,
              ok: false,
              status: res.status,
              batchCount: batches.length,
              error: body.slice(0, 300) || res.statusText,
            };
          }
        }

        return {
          provider: provider.name,
          url: provider.url,
          ok: true,
          status: lastStatus || 200,
          batchCount: batches.filter((b) => b.length > 0).length,
        };
      } catch (err) {
        return {
          provider: provider.name,
          url: provider.url,
          ok: false,
          status: 0,
          batchCount: batches.length,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    })
  );
}
