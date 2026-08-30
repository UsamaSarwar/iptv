# 📺 IPTV — Live Global Television & Streaming Platform

[![Channel & Stream Status Sync](https://github.com/UsamaSarwar/iptv/actions/workflows/sync-channels.yml/badge.svg)](https://github.com/UsamaSarwar/iptv/actions/workflows/sync-channels.yml)
[![Deploy to GitHub Pages](https://github.com/UsamaSarwar/iptv/actions/workflows/deploy.yml/badge.svg)](https://github.com/UsamaSarwar/iptv/actions/workflows/deploy.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Static_Hosting-181717?style=flat&logo=github)](https://pages.github.com/)

A state-of-the-art, high-performance web IPTV streaming application featuring **11,000+ live television channels** from across the globe, real-time stream health monitoring, and a premium cinema user interface.

🌐 **Live Website:** [https://iptv.usama.dev](https://iptv.usama.dev)

---

## ✨ Key Features

- **📡 11,000+ Global Channels**: Live broadcasts categorized across News, Sports, Movies & Cinema, Documentary, Kids, Music, and regional programming.
- **🔴 Real-Time Stream Status Tracking**:
  - **`LIVE` (Red)**: Confirmed active, responsive stream.
  - **`OFFLINE` (Grey)**: Non-responsive or down stream.
  - **`CHECKING` (Blue-Grey)**: On-demand stream probing on channel card hover.
- **🔄 Automated Scheduled Sync Engine**:
  - Powered by **GitHub Actions** (`cron: '0 0,12 * * *'`).
  - Concurrently aggregates, cleans, deduplicates, and probes thousands of streams.
  - Generates verified snapshots directly into `public/channels-snapshot.json` and updates the live site.
- **🎬 Netflix-Style Cinema UI**:
  - Hero Billboard with direct playback and rich channel information modal.
  - Horizontal shelf sliders sorted dynamically by channel count.
  - Interactive theater player with HLS video engine, quality selectors, audio switcher, and live sidebar recommendations.
- **🔎 Instant Search & Filters (`⌘K`)**:
  - Multi-dimensional filtering by Category, Country, Language, and Resolution (4K, 1080p, 720p, SD).
- **💾 Custom M3U / M3U8 Playlist Manager**:
  - Import custom playlists via URL or `.m3u` file upload.
  - Unlimited local persistence powered by **IndexedDB**.

---

## 🛠️ Architecture & Tech Stack

```
┌────────────────────────────────┐
│  GitHub Actions (Sync Cron)    │
│  .github/workflows/sync-*.yml  │
└────────────────────────────────┘
                │
                ├─► 1. Aggregates IPTV-org feeds & sources
                ├─► 2. Probes live / offline streams
                ├─► 3. Updates public/channels-snapshot.json
                │
                ▼
┌────────────────────────────────┐
│  GitHub Pages Deployment       │
│  .github/workflows/deploy.yml  │
└────────────────────────────────┘
                │
                ▼
┌────────────────────────────────┐
│  Next.js App / IPTVContext     │
│  Hydrates with verified        │
│  LIVE & OFFLINE statuses       │
└────────────────────────────────┘
```

- **Framework**: [Next.js 16](https://nextjs.org/) (Static Export `output: 'export'`, App Router, React 19)
- **Hosting**: [GitHub Pages](https://pages.github.com/) + Custom Domain
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Streaming Engine**: [Hls.js](https://github.com/video-dev/hls.js/) + Native HTML5 Video
- **Database & Storage**: Static Snapshot (`public/channels-snapshot.json`) + Client-side [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- **Automation**: [GitHub Actions](https://github.com/features/actions)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.18+ or Node.js 20+
- npm, pnpm, or bun

### 1. Clone & Install
```bash
git clone https://github.com/UsamaSarwar/iptv.git
cd iptv
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build & Export Purely Static Site
```bash
npm run build
```
The static export will be generated in `./out` directory ready for GitHub Pages.

---

## 🧪 Production Verification & Linting

```bash
# Run ESLint check
npm run lint

# Build static production bundle
npm run build
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/UsamaSarwar/iptv/issues).

Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting pull requests.

---

## 🔒 Security

For vulnerability reporting and disclosure guidelines, please see [SECURITY.md](SECURITY.md).

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).

---

## ⚖️ Legal Disclaimer

This application is an open-source video stream player. It does not host, broadcast, or store any proprietary media streams. All channels and playlists are public feeds provided by the global open-source community ([IPTV-org](https://github.com/iptv-org/iptv)). All trademarks and content belong to their respective owners.
