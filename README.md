# OpenPortal

Manage your Meta Portal directly from the browser. No software to install.

OpenPortal uses [WebUSB](https://developer.mozilla.org/en-US/docs/Web/API/WebUSB_API) and [ya-webadb](https://github.com/nicccce/ya-webadb) to speak the ADB protocol over USB, giving you full device management from a web page — pure frontend, no backend, no drivers.

## Features

- **Connect via USB** — plug in your Portal, click Connect, done. Graceful recovery if the cable is pulled out
- **App Catalog** — install community-verified apps (Immortal Launcher, Aurora Store, Google Photos Screensaver, VLC, Home Assistant, Alexa, ...) with one-click post-install setup
- **Drag & drop APK install** — sideload any APK directly from your browser
- **Installed apps manager** — uninstall, clear data, force stop, inspect permissions
- **File browser** — browse, download, upload, and delete files over ADB sync
- **Screen capture & live view** — take PNG screenshots or mirror the screen via repeated framebuffer capture
- **Logcat viewer** — live log streaming with tag, priority, and text filters, plus export
- **Shell terminal** — run ADB shell commands with command history
- **Feature flags editor** — browse and edit `device_config` flags and internal settings (no exploits)
- **Backup & restore** — export device settings + app list to JSON and restore them
- **Device settings** — toggle dark mode, block OTA updates, disable package verification, keep screen on
- **One-click presets** — apply recommended settings in a single click
- **Device dashboard** — model, firmware, SoC, storage, kernel, security patch, status indicators
- **Classic / Advanced mode** — simple mode for non-technical users, advanced mode with all the knobs
- **Keyboard shortcuts** — press `?` for the shortcut overlay
- **PWA** — installable, works offline after first load
- **i18n** — English and French, structured for easy translation

## Requirements

- A **Chromium-based browser** (Chrome, Edge, Brave, Opera) — WebUSB is not supported in Firefox or Safari
- **HTTPS** or **localhost** — WebUSB requires a secure context
- A **Meta Portal** with USB Debugging enabled (Settings > Debug > ADB Enabled)

## Supported devices

| Model | Codename | Android |
|---|---|---|
| Portal Mini | omni | 10 |
| Portal (2nd gen) | aloha | 10 |
| Portal+ (2nd gen) | porto | 10 |
| Portal Go | sansa | 10 |
| Portal TV | pltv | 10 |
| Portal (1st gen) | — | 9 |
| Portal+ (1st gen) | — | 9 |

### Finding the USB port

Every Portal exposes a **USB-C** port for data:

- **Portal Go** — the port is hidden behind the kickstand on the back. Flip the
  stand open to reach it.
- **Portal Mini / Portal / Portal+ / Portal TV** — the USB-C port is on the back
  near the power connector.

Use a known-good **data** USB-C cable (charge-only cables won't enumerate the
device).

## Getting started

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173` in Chrome, plug in your Portal via USB, and click **Connect your Portal**.

To preview the UI without a device, add `?demo` to the URL: `http://localhost:5173/?demo`

## Build & deploy

```bash
pnpm build
```

The `dist/` folder is a static site ready to deploy anywhere with HTTPS (GitHub Pages, Vercel, Netlify, Cloudflare Pages).

## Project structure

```
src/
├── lib/
│   ├── adb/          # ADB protocol layer (connection, shell, file-system, screen,
│   │                 #   logcat, device-config, app-manager, settings, backup)
│   ├── portal/       # Portal-specific logic (device models, catalog.json, presets)
│   └── utils/        # Formatters, download helper, platform detection
├── store/            # Zustand stores (device, UI, apps)
├── hooks/            # React hooks (theme, keyboard shortcuts)
├── components/
│   ├── ui/           # Shared primitives (Button, Card, Modal, ConfirmDialog, …)
│   ├── layout/       # AppShell, Sidebar, Header, ModeToggle, LanguageSwitcher
│   ├── connection/   # ConnectScreen, BrowserCheck, ConnectionStatus
│   ├── dashboard/    # DeviceCard, StatusGrid, StorageBar, QuickActions
│   ├── apps/         # AppCatalog, AppCard, AppIcon, ApkInstaller, InstalledAppsList
│   ├── files/        # FileBrowser
│   └── settings/     # PresetsPanel, SettingsPanel, BackupPanel
├── pages/            # Route pages (Dashboard, Apps, Settings, Files, Screen,
│                     #   Terminal, Logcat, Flags)
└── locales/          # i18n translation files (en, fr)
```

The UI never imports `@yume-chan/*` directly — all ADB operations go through `src/lib/adb/`.

## Tech stack

React 19 · Vite 6 · TypeScript · Tailwind CSS 4 · Zustand 5 · React Router 7 · react-i18next (en/fr) · sonner · ya-webadb · Biome · PWA (service worker)

## TODO

### Phase 1 — MVP (in progress)

- [x] Project scaffold (Vite + React + TS + Tailwind + shadcn/ui + i18n)
- [x] WebUSB connection lifecycle + RSA credential store
- [x] Device info extraction (getprop parsing, storage, status indicators)
- [x] Portal model registry (codenames, capabilities)
- [x] Connect screen with browser compatibility check
- [x] Dashboard page (device card, status grid, storage bar)
- [x] Quick actions (Install Immortal, Block OTA, Apply Recommended Settings)
- [x] Classic / Advanced mode toggle
- [x] App catalog with 9 verified apps
- [x] APK drag & drop installer with progress
- [x] Settings page with presets and toggle switches
- [x] Demo mode (`?demo` URL param) for development
- [x] Test with real Portal device over USB (needs hardware)
- [x] Post-install actions for catalog apps (set default launcher, disable overlay)
- [x] Error handling polish (disconnect recovery, install failures, timeout)
- [x] GitHub Pages deploy workflow

### Phase 2 — Power features

- [x] File browser (push/pull files via adb sync)
- [x] Screenshot capture (framebuffer → PNG)
- [x] Installed apps list with uninstall, clear data, force stop, permissions
- [x] Backup/restore device profile (export/import settings as JSON)
- [x] Responsive design (tablet / mobile-friendly)

### Phase 3 — Developer tools

- [x] Logcat viewer (real-time log streaming with tag/priority filters)
- [x] Shell terminal (interactive shell; dependency-free, not xterm.js)
- [x] Feature flags browser/editor (`device_config` + internal settings)
- [x] Live screen view (repeated framebuffer); full scrcpy mirroring is future work

### Phase 4 — Community & polish

- [x] French translation
- [x] Community app catalog (PR-based JSON submissions)
- [x] Keyboard shortcuts
- [x] PWA support (offline app shell)
- [x] Portal Go USB port guide (text; images welcome via PR)
- [x] App icons in catalog (initials avatars + optional `iconUrl`)

## Legal

Meta [officially enabled ADB access](https://developers.meta.com/horizon/blog/build-apps-for-portal-with-ai/) on Portal devices. This tool uses only public ADB commands — no exploits, no root, no bootloader unlock.

## License

MIT
