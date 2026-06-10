# Contributing to OpenPortal

Thanks for your interest in improving OpenPortal! This document explains how to
set up the project, the conventions we follow, and how to submit changes.

## Getting started

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173` in a Chromium-based browser. You can develop the
entire UI **without a device** using demo mode: `http://localhost:5173/?demo`.

## Useful scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the Vite dev server |
| `pnpm build` | Type-check (`tsc --noEmit`) and build for production |
| `pnpm preview` | Preview the production build locally |
| `pnpm lint` | Run Biome checks (lint + format + import order) |
| `pnpm format` | Auto-format the codebase with Biome |

Please make sure `pnpm build` and `pnpm lint` both pass before opening a PR.

## Architecture rules

- **The UI never imports `@yume-chan/*` directly.** All ADB operations go
  through `src/lib/adb/`. If you need a new device capability, add a function in
  the appropriate `src/lib/adb/*.ts` module and call it from components/stores.
- **State lives in Zustand stores** (`src/store/`). Components read from stores;
  device I/O is kept out of render paths.
- **Everything is internationalized.** No hard-coded user-facing strings — add
  keys under `src/locales/<lang>/<namespace>.json` and use `useTranslation`.
- **Keep advanced features behind Advanced mode** when they are powerful or
  potentially confusing for non-technical users (see `useUIStore().mode`).

## Code style

- TypeScript, strict mode. Avoid `any`; prefer precise types.
- Formatting and linting are enforced by [Biome](https://biomejs.dev) (tabs,
  organized imports). Run `pnpm format` before committing.
- Match the surrounding code: Tailwind utility classes inline, `cn()` for
  conditional classes, small focused components.

## Adding an app to the catalog

The catalog is data-only and lives in
[`src/lib/portal/catalog.json`](src/lib/portal/catalog.json) so apps can be
submitted with a simple PR — no code changes required. Add an object to the
array:

```json
{
  "id": "my-app",
  "name": "My App",
  "packageName": "com.example.myapp",
  "description": "What it does, in one sentence.",
  "category": "utility",
  "version": "1.0.0",
  "verified": true,
  "featured": false,
  "downloadUrl": "https://...",
  "iconUrl": "https://...",
  "setup": {
    "kind": "commands",
    "commands": ["settings put secure ..."],
    "labelKey": "setAsDefault"
  }
}
```

Field reference:

- `id` — unique kebab-case identifier
- `packageName` — exact Android package name
- `category` — one of `launcher`, `store`, `media`, `photo`, `smartHome`,
  `assistant`, `utility`
- `verified` — `true` only if the app was tested on a Portal
- `featured` — featured apps are the ones shown in Classic mode
- `downloadUrl`, `iconUrl` — optional
- `setup` — optional post-install configuration, one of two shapes:
  - `{ "kind": "commands", "commands": [...], "auto"?: boolean, "labelKey"?: string }`
    — shell commands to finish setup. `auto: true` runs them silently right
    after install (e.g. a launcher becoming the default); otherwise they run
    when the user clicks the setup gear on the app card. `labelKey` is an i18n
    key in `src/locales/<lang>/apps.json` used for the gear's tooltip.
  - `{ "kind": "custom", "id": "...", "labelKey"?: string }` — setup that needs
    a UI (e.g. uploading credentials). The `id` must match a panel registered in
    `src/components/apps/setup/registry.ts`. **This is the only catalog change
    that also requires code** — most apps should use `commands`.

Guidelines:

- Only mark `verified: true` for apps that have been confirmed working on a Meta
  Portal device. Note which model(s) you tested in the PR description.
- Prefer open-source apps and official download sources.
- Do **not** submit apps that require root, exploits, or that violate the device
  owner's terms — OpenPortal only uses public ADB commands.

## Reporting bugs

Open an issue with:

- Portal model and firmware version (visible on the Dashboard)
- Browser and OS
- Steps to reproduce, and any errors from the browser console

## Pull requests

1. Fork and create a feature branch.
2. Make your change, with i18n keys for any new strings.
3. Run `pnpm lint` and `pnpm build`.
4. Open a PR describing the change and how you tested it.

By contributing you agree that your contributions are licensed under the
project's [MIT License](LICENSE).
