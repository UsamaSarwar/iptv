import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const FAVICON_SVG_PATH = path.join(PUBLIC_DIR, "favicon.svg");

// Create multi-resolution ICO buffer from PNG buffers
function createIco(pngBuffers) {
  const numImages = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type (1)
  header.writeUInt16LE(numImages, 4);

  const dirEntries = [];
  let offset = 6 + 16 * numImages;

  for (const { buffer, size } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size === 256 ? 0 : size, 0); // width
    entry.writeUInt8(size === 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    dirEntries.push(entry);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map((p) => p.buffer)]);
}

// Generate SVG with background for app/touch/maskable icons
function generateAppIconSvg({
  size,
  padding = 0.2,
  cornerRadius = 0,
  withGlow = true,
} = {}) {
  const innerSize = size * (1 - padding * 2);
  const offset = size * padding;
  const scale = innerSize / 24;
  const glowRadius = innerSize * 0.45;
  const rxAttr = cornerRadius > 0 ? `rx="${cornerRadius}"` : "";

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16092b"/>
      <stop offset="50%" stop-color="#0e061a"/>
      <stop offset="100%" stop-color="#080312"/>
    </linearGradient>

    <!-- TV Stroke Gradient matching favicon.svg -->
    <linearGradient id="favGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c084fc"/>
      <stop offset="100%" stop-color="#9333ea"/>
    </linearGradient>

    <!-- Ambient Glow Filter -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${(size * 0.03).toFixed(2)}" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="${size}" height="${size}" ${rxAttr} fill="url(#bgGrad)"/>

  ${
    withGlow
      ? `<!-- Ambient Glow Behind TV -->
  <circle cx="${size / 2}" cy="${size / 2 + size * 0.04}" r="${glowRadius}" fill="#9333ea" opacity="0.25" filter="url(#glow)"/>`
      : ""
  }

  <!-- Centered TV Icon derived directly from favicon.svg (24x24 viewBox) -->
  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    <!-- Transparent screen inside TV Frame -->
    <rect x="2" y="7" width="20" height="15" rx="2" fill="#1b0c36" fill-opacity="0.6" stroke="url(#favGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="17 2 12 7 7 2" fill="none" stroke="url(#favGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

async function buildIcons() {
  console.log("Reading source favicon.svg...");
  const faviconSvg = fs.readFileSync(FAVICON_SVG_PATH);

  // 1. Transparent PNG Favicons (16x16, 32x32, 48x48)
  console.log("Generating transparent PNG favicons...");
  const p16 = await sharp(faviconSvg).resize(16, 16).png().toBuffer();
  const p32 = await sharp(faviconSvg).resize(32, 32).png().toBuffer();
  const p48 = await sharp(faviconSvg).resize(48, 48).png().toBuffer();

  fs.writeFileSync(path.join(PUBLIC_DIR, "favicon-16x16.png"), p16);
  fs.writeFileSync(path.join(PUBLIC_DIR, "favicon-32x32.png"), p32);
  console.log("✓ Created favicon-16x16.png & favicon-32x32.png");

  // 2. favicon.ico
  console.log("Generating favicon.ico...");
  const icoBuffer = createIco([
    { buffer: p16, size: 16 },
    { buffer: p32, size: 32 },
    { buffer: p48, size: 48 },
  ]);
  fs.writeFileSync(path.join(PUBLIC_DIR, "favicon.ico"), icoBuffer);
  console.log("✓ Created favicon.ico");

  // 3. Apple Touch Icon (180x180) - Opaque dark background with centered TV icon
  console.log("Generating apple-touch-icon.png (180x180)...");
  const appleSvg = Buffer.from(generateAppIconSvg({ size: 180, padding: 0.22, withGlow: true }));
  const applePng = await sharp(appleSvg).resize(180, 180).png().toBuffer();
  fs.writeFileSync(path.join(PUBLIC_DIR, "apple-touch-icon.png"), applePng);
  console.log("✓ Created apple-touch-icon.png");

  // 4. PWA Icon 192x192 & 512x512
  console.log("Generating PWA icons (192x192, 512x512)...");
  const icon192Svg = Buffer.from(generateAppIconSvg({ size: 192, padding: 0.2, withGlow: true }));
  const icon192Png = await sharp(icon192Svg).resize(192, 192).png().toBuffer();
  fs.writeFileSync(path.join(PUBLIC_DIR, "icon-192.png"), icon192Png);

  const icon512Svg = Buffer.from(generateAppIconSvg({ size: 512, padding: 0.2, withGlow: true }));
  const icon512Png = await sharp(icon512Svg).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.join(PUBLIC_DIR, "icon-512.png"), icon512Png);
  console.log("✓ Created icon-192.png & icon-512.png");

  // 5. PWA Maskable Icons (safe zone padding: ~28%)
  console.log("Generating maskable icons (192x192, 512x512)...");
  const maskable192Svg = Buffer.from(generateAppIconSvg({ size: 192, padding: 0.28, withGlow: true }));
  const maskable192Png = await sharp(maskable192Svg).resize(192, 192).png().toBuffer();
  fs.writeFileSync(path.join(PUBLIC_DIR, "icon-maskable-192.png"), maskable192Png);

  const maskable512Svg = Buffer.from(generateAppIconSvg({ size: 512, padding: 0.28, withGlow: true }));
  const maskable512Png = await sharp(maskable512Svg).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.join(PUBLIC_DIR, "icon-maskable-512.png"), maskable512Png);
  console.log("✓ Created icon-maskable-192.png & icon-maskable-512.png");

  // 6. icon.svg (512x512 vector master)
  console.log("Generating icon.svg (512x512)...");
  const masterSvg = generateAppIconSvg({ size: 512, padding: 0.2, withGlow: true });
  fs.writeFileSync(path.join(PUBLIC_DIR, "icon.svg"), masterSvg);
  console.log("✓ Created icon.svg");

  console.log("\nAll icons successfully generated from favicon.svg!");
}

buildIcons().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
