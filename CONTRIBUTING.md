# Contributing to IPTV

Thank you for your interest in contributing to **IPTV**! We welcome contributions from the community to help make this open-source streaming platform better, faster, and more accessible.

---

## 📋 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat everyone with respect and empathy.

---

## 🛠️ Development Workflow

### 1. Prerequisites
- **Node.js**: 20.x or later
- **npm**: 10.x or later (or `pnpm` / `bun`)
- **Git**

### 2. Fork & Clone
```bash
git clone https://github.com/<your-username>/iptv.git
cd iptv
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Running Quality Checks
Before submitting a pull request, ensure all tests and linting pass:
```bash
# Run ESLint
npm run lint

# Run automated tests
npm run test

# Test static production build
npm run build
```

---

## 📡 Adding or Updating Channels

1. **Default Curated Channels**: Located in `src/data/default-channels.ts`.
2. **Channel Sources**: Managed in `scripts/sync-channels.mjs` and `src/lib/server-channels.ts`.
3. **Stream Verification**: You can verify channel stream health locally using:
   ```bash
   # Test default channels
   npm run test:streams

   # Test specific category
   node scripts/test-channels.mjs --category Sports
   ```

> [!IMPORTANT]
> All stream URLs must be publicly available, legal open-source IPTV feeds. Do not submit pirated streams or paid subscription links.

---

## 🔀 Submitting Pull Requests

1. Create a descriptive feature branch:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. Commit your changes following conventional commit style:
   - `feat: add new feature`
   - `fix: resolve issue with player controls`
   - `docs: update documentation`
3. Push to your fork and submit a Pull Request to `main`.
4. Fill out the PR template thoroughly.
