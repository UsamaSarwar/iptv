# Project Guidelines & Agent Instructions

This document defines coding standards, conventions, and architectural best practices for AI coding agents (Google Antigravity, Cursor, Windsurf, Claude Code, etc.).

---

## ⚡ React & Next.js Guidelines
- **Avoid setState in Effects**: Never call `setState` synchronously within a `useEffect` to avoid cascading re-renders and ESLint violations (`react-hooks/set-state-in-effect`). Prefer lazy state initializers (`useState(() => getInitialValue())`), event-driven triggers, or state derived during rendering.
- **Unused Imports & Types**: Always clean up unused imports, dead variables, and outdated type definitions before concluding any task.
- **Client vs. Server Components**: Mark interactive client-side components with `"use client";` at the top. Keep server data fetching and static page generation in Server Components.

---

## 🎨 Tailwind CSS v4 Rules
- **Modern Linear Gradients**: Always use `bg-linear-to-*` (e.g. `bg-linear-to-r`, `bg-linear-to-t`, `bg-linear-to-b`, `bg-linear-to-tr`) instead of legacy `bg-gradient-to-*`.
- **Standardized Spacing & Sizing**: Prefer native numeric scale tokens over arbitrary pixel brackets when a standard multiple exists (e.g., use `w-50`, `w-60`, `w-125`, `w-150`, `min-h-125` instead of `w-[200px]`, `w-[240px]`, `w-[500px]`, `w-[600px]`, `min-h-[500px]`).
- **Aspect Ratios**: Use standard format `aspect-16/10` or `aspect-video` instead of arbitrary brackets `aspect-[16/10]`.
- **Flexbox Utilities**: Always use `shrink-0` instead of `flex-shrink-0`.

---

## 📡 Storage & Channel State Architecture
- **IndexedDB for High Volume**: When persisting custom or high-volume channel catalogs (>5MB) on the client, always use IndexedDB (`src/lib/db.ts`) to avoid browser `localStorage` quota limitations.
- **Static Snapshot & GitHub Pages**: Remote channel snapshots are maintained directly in `public/channels-snapshot.json` and synchronized via automated GitHub Actions cron jobs (`.github/workflows/sync-channels.yml`).

---

## 🛡️ Quality Assurance & Verification
- Always execute `npm run lint` and `npm run build` before completing tasks to guarantee 0 lint errors, 0 warnings, and a clean production build.
