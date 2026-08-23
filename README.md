# 🛸 Aliasist Files Abductor Suite

This bundle contains both implementations of **Aliasist Files Abductor**:

```
aliasist-files-abductor/
├── abductor-tauri/       # Modern Rust + Tauri rewrite (v3.0.0)
├── abductor-electron/    # Original Electron + JavaScript/Python app (v2.7.0)
└── README.md
```

---

## 1. `files-abductor-rust-tauri` (Rust + Tauri v3.0.0) — Recommended

The high-performance, lightweight rewrite built with Rust, Tauri v2, React, and Framer Motion.

### Highlights:
- **Zero-Setup Sidecar Bundling**: Bundles standalone `yt-dlp` and `ffmpeg` inside the installer.
- **Cloudflare Bypass**: Built-in `curl_cffi` browser impersonation (`--impersonate chrome`).
- **Resilient Fallback**: Handles silent videos, single-stream media (Pixabay, stock video), and YouTube/Vimeo/TikTok.
- **Ultra Lightweight**: Standalone ~15 MB executable / ~35 MB RAM footprint.
- **Cross-Platform Releases**: Generates Linux `.AppImage`/`.deb`, Windows `.exe`/`.msi`, and macOS `.dmg`.

### Running:
```bash
cd abductor-tauri
npm install
npm run tauri dev
```

### Packaging:
```bash
# Fetch sidecar binaries (yt-dlp and ffmpeg)
./scripts/fetch-binaries.sh

# Build production installer
npm run tauri build
```

---

## 2. `abductor-electron` (Electron v2.7.0)

The original classic Electron application featuring the full UFO splash sequence, joke banks, and custom alien aesthetic.

### Highlights:
- **Classic UI & Jokes**: Original dark-mode UI with animated abduction jokes.
- **Patched Engine**: Updated `main.js` with modern browser impersonation and resilient format selection.
- **Anti-Highlighting Protection**: Fully protected UI layout with text-selection disabling.

### Running:
```bash
cd abductor-electron
npm install
npm run dev
```

---

## 👽 Author & License
- **Created by:** dev_aliasist — [www.aliasist.com](https://www.aliasist.com)
- **License:** Unlicense / MIT
