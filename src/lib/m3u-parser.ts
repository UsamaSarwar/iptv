import { IPTVChannel } from "@/types/iptv";

// Country ISO codes map to friendly English Country Names
export const COUNTRY_CODES: Record<string, string> = {
  us: "United States",
  uk: "United Kingdom",
  gb: "United Kingdom",
  pk: "Pakistan",
  in: "India",
  ca: "Canada",
  au: "Australia",
  fr: "France",
  de: "Germany",
  it: "Italy",
  es: "Spain",
  nl: "Netherlands",
  br: "Brazil",
  mx: "Mexico",
  ar: "Argentina",
  tr: "Turkey",
  sa: "Saudi Arabia",
  ae: "United Arab Emirates",
  qa: "Qatar",
  za: "South Africa",
  at: "Austria",
  sk: "Slovakia",
  jp: "Japan",
  kr: "South Korea",
  cn: "China",
  ru: "Russia",
};

// Default primary language by country
export const COUNTRY_DEFAULT_LANGUAGES: Record<string, string> = {
  pakistan: "Urdu",
  pk: "Urdu",
  "united states": "English",
  us: "English",
  "united kingdom": "English",
  uk: "English",
  gb: "English",
  canada: "English",
  ca: "English",
  australia: "English",
  au: "English",
  france: "French",
  fr: "French",
  germany: "German",
  de: "German",
  italy: "Italian",
  it: "Italian",
  spain: "Spanish",
  es: "Spanish",
  mexico: "Spanish",
  mx: "Spanish",
  argentina: "Spanish",
  ar: "Spanish",
  brazil: "Portuguese",
  br: "Portuguese",
  turkey: "Turkish",
  tr: "Turkish",
  "saudi arabia": "Arabic",
  sa: "Arabic",
  "united arab emirates": "Arabic",
  ae: "Arabic",
  qatar: "Arabic",
  qa: "Arabic",
  russia: "Russian",
  ru: "Russian",
  china: "Chinese",
  cn: "Chinese",
  japan: "Japanese",
  jp: "Japanese",
  "south korea": "Korean",
  kr: "Korean",
  india: "Hindi",
  in: "Hindi",
};

// ISO 639-1 / 639-2 language code mapping
export const LANGUAGE_CODES: Record<string, string> = {
  eng: "English",
  en: "English",
  urd: "Urdu",
  ur: "Urdu",
  hin: "Hindi",
  hi: "Hindi",
  ara: "Arabic",
  ar: "Arabic",
  fra: "French",
  fre: "French",
  fr: "French",
  deu: "German",
  ger: "German",
  de: "German",
  spa: "Spanish",
  es: "Spanish",
  ita: "Italian",
  it: "Italian",
  por: "Portuguese",
  pt: "Portuguese",
  tur: "Turkish",
  tr: "Turkish",
  rus: "Russian",
  ru: "Russian",
  zho: "Chinese",
  chi: "Chinese",
  zh: "Chinese",
  jpn: "Japanese",
  ja: "Japanese",
  kor: "Korean",
  ko: "Korean",
  ben: "Bengali",
  bn: "Bengali",
  pan: "Punjabi",
  pa: "Punjabi",
};

const RESOLUTION_REGEX = /\s*[\(\[\{]\s*(\d{3,4}p|\d{3,4}i|\d{1,2}k|4k|uhd|fhd|hd|sd|hevc|h\.?26[45]|raw|60fps|50fps)\s*[\)\]\}]/gi;
const TRAILING_RES_REGEX = /\s+(\d{3,4}p|\d{3,4}i|4k|uhd|fhd|hd)$/i;

/**
 * Extracts resolution quality tag from channel name/group and cleans the raw title
 */
export function cleanChannelNameAndExtractQuality(rawName: string, rawGroup?: string): {
  cleanName: string;
  quality: string;
} {
  let cleanName = rawName.trim();
  let quality = "HD";
  let extractedQuality: string | null = null;

  // 1. Check for specific pixel resolutions in brackets/parentheses e.g. (1080p), [1080p], (720p), (4K)
  const matches = cleanName.match(RESOLUTION_REGEX);
  if (matches && matches.length > 0) {
    const rawTag = matches[0].replace(/[\(\[\{\)\]\}\s]/g, "");
    extractedQuality = rawTag.toUpperCase();
    cleanName = cleanName.replace(RESOLUTION_REGEX, "").trim();
  }

  // 2. Trailing resolution tokens without brackets e.g. "Channel 1080p" or "Channel 720p"
  const trailingMatch = cleanName.match(TRAILING_RES_REGEX);
  if (trailingMatch) {
    if (!extractedQuality) {
      extractedQuality = trailingMatch[1].toUpperCase();
    }
    cleanName = cleanName.replace(TRAILING_RES_REGEX, "").trim();
  }

  // 3. Trailing HD / FHD / 4K / UHD tokens in raw string or group
  const combined = `${rawName} ${rawGroup || ""}`.toLowerCase();
  if (extractedQuality) {
    quality = extractedQuality;
  } else if (combined.includes("4k") || combined.includes("uhd") || combined.includes("2160")) {
    quality = "4K";
  } else if (combined.includes("fhd") || combined.includes("1080")) {
    quality = "1080p";
  } else if (combined.includes("720") || combined.includes("hd")) {
    quality = "HD";
  } else if (combined.includes("576")) {
    quality = "576p";
  } else if (combined.includes("480")) {
    quality = "480p";
  } else if (combined.includes("360")) {
    quality = "360p";
  } else if (combined.includes("240")) {
    quality = "240p";
  } else if (combined.includes("sd")) {
    quality = "SD";
  }

  // Clean any empty parentheses or leftover brackets & known tags
  cleanName = cleanName
    .replace(/\[\s*not\s*24\/7\s*\]|\(\s*not\s*24\/7\s*\)/gi, "")
    .replace(/\[\s*geo[- ]?blocked\s*\]|\(\s*geo[- ]?blocked\s*\)/gi, "")
    .replace(/\s*\(\s*\)|\s*\[\s*\]|\s*\{\s*\}/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return { cleanName: cleanName || rawName, quality };
}

/**
 * Parses standard M3U / M3U8 IPTV playlist text format into structured IPTVChannel objects
 */
export function parseM3U(m3uContent: string): IPTVChannel[] {
  const lines = m3uContent.split(/\r?\n/);
  const channels: IPTVChannel[] = [];

  let currentInfo: Partial<IPTVChannel> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    if (line.startsWith("#EXTINF:")) {
      currentInfo = {};

      // Extract tvg attributes: tvg-id, tvg-name, tvg-logo, group-title, tvg-country, tvg-language
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/i);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      const countryMatch = line.match(/tvg-country="([^"]*)"/i);
      const langMatch = line.match(/tvg-language="([^"]*)"/i);

      // Extract channel display name after the last comma
      const commaIndex = line.lastIndexOf(",");
      let rawName = "Live Channel";
      if (commaIndex !== -1 && commaIndex < line.length - 1) {
        rawName = line.substring(commaIndex + 1).trim();
      }

      currentInfo.tvgId = tvgIdMatch ? tvgIdMatch[1] : undefined;
      currentInfo.tvgName = tvgNameMatch ? tvgNameMatch[1] : undefined;
      currentInfo.logo = tvgLogoMatch ? tvgLogoMatch[1] : undefined;
      currentInfo.group = groupMatch ? groupMatch[1] : "Popular";

      // Detect country from tvg-country, or tvg-id like "Channel.pk@SD" or "Channel.us"
      let country: string | undefined = undefined;
      const rawCountryCode = countryMatch ? countryMatch[1] : undefined;

      if (rawCountryCode) {
        const cleaned = rawCountryCode.trim();
        if (COUNTRY_CODES[cleaned.toLowerCase()]) {
          country = COUNTRY_CODES[cleaned.toLowerCase()];
        } else if (cleaned.length === 2 || cleaned.length === 3) {
          try {
            const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
            const resolved = regionNames.of(cleaned.toUpperCase());
            country = resolved && resolved.toLowerCase() !== cleaned.toLowerCase() ? resolved : cleaned;
          } catch {
            country = cleaned;
          }
        } else {
          country = cleaned;
        }
      } else if (currentInfo.tvgId) {
        const idCountryMatch = currentInfo.tvgId.match(/\.([a-z]{2})(?:@|\.|$)/i);
        if (idCountryMatch) {
          const code = idCountryMatch[1].toLowerCase();
          if (COUNTRY_CODES[code]) {
            country = COUNTRY_CODES[code];
          } else {
            try {
              const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
              const resolved = regionNames.of(code.toUpperCase());
              country = resolved && resolved.toLowerCase() !== code ? resolved : code.toUpperCase();
            } catch {
              country = code.toUpperCase();
            }
          }
        }
      }

      // Detect language from tvg-language or country default
      let language = langMatch ? langMatch[1] : undefined;
      if (language) {
        const langLower = language.toLowerCase();
        language = LANGUAGE_CODES[langLower] || language;
      } else if (country) {
        language = COUNTRY_DEFAULT_LANGUAGES[country.toLowerCase()] || "Multi-Audio";
      }

      currentInfo.country = country;
      currentInfo.language = language || "English";

      // Extract clean name and resolution chip
      const { cleanName, quality } = cleanChannelNameAndExtractQuality(
        rawName || currentInfo.tvgName || "Live Channel",
        currentInfo.group
      );

      currentInfo.name = cleanName;
      currentInfo.quality = quality;
    } else if (!line.startsWith("#") && currentInfo.name) {
      // Line is stream URL
      const streamUrl = line;
      if (streamUrl.startsWith("http://") || streamUrl.startsWith("https://") || streamUrl.startsWith("rtmp://")) {
        const slugToken = (t: string) =>
          t
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");

        let baseSlug = "";
        if (currentInfo.tvgId) {
          baseSlug = slugToken(currentInfo.tvgId);
        }
        if (!baseSlug) {
          const namePart = slugToken(currentInfo.name || "channel");
          const countryPart = currentInfo.country ? slugToken(currentInfo.country) : "";
          const qualityPart = currentInfo.quality ? slugToken(currentInfo.quality) : "";
          baseSlug = [namePart, countryPart, qualityPart].filter(Boolean).join("-");
        }

        // Generate a 4-character deterministic hash from streamUrl to ensure 100% uniqueness
        let hash = 0;
        for (let h = 0; h < streamUrl.length; h++) {
          hash = (hash << 5) - hash + streamUrl.charCodeAt(h);
          hash |= 0;
        }
        const hashStr = Math.abs(hash).toString(36).substring(0, 4);
        const id = `${baseSlug || "channel"}-${hashStr}`;

        channels.push({
          id,
          name: currentInfo.name || "Live Channel",
          logo: currentInfo.logo,
          group: currentInfo.group || "Popular",
          url: streamUrl,
          tvgId: currentInfo.tvgId,
          tvgName: currentInfo.tvgName,
          country: currentInfo.country,
          language: currentInfo.language,
          quality: currentInfo.quality || "HD",
          description: `Live broadcast stream on ${currentInfo.group || "IPTV"} network. High-quality 24/7 transmission.`,
        });
      }
      currentInfo = {};
    }
  }

  return channels;
}
