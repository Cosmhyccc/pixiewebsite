# Pixie website

Animated Pixie landing page built with React, TypeScript and Vite.

## Development

```sh
npm ci
npm run dev
```

## Build and deploy

```sh
npm run build
npm run preview
```

Pushes to `main` build and deploy automatically through GitHub Actions to:
https://cosmhyccc.github.io/pixiewebsite/

Production assets use the `/pixiewebsite/` base path. Local development stays at `/`. When connecting a custom domain, change the production base in `vite.config.ts` to `/` and configure the domain in GitHub Pages.

## Interactions

Seven scroll chapters use alternating, expanding black and white backgrounds. Pixel eyes, typing headlines, hand-drawn strokes and illustrative teaching scenes run locally. Motion respects reduced-motion preferences; demonstration clocks pause in background tabs.

The physics and creative-tool scenes are original SVG illustrations, not live app control, video playback or spoken audio. “Say hello” is a visual greeting and “Get Pixie” displays “Coming soon”. Downloads are intentionally disabled until launch.

## Production download (Oct 23, 2026)
Both homepage CTAs use the explicit production GitHub Release asset `pixie-production-20261115/Pixie.dmg` in this public website repository. Publish and verify that notarized asset before deploying these buttons. Do not upload app source or beta installers here.

Mac detection is a convenience guard: excludes iOS (including iPad desktop mode), Android, Windows and other platforms from the download action. It cannot verify CPU or macOS version; the page states Apple Silicon / macOS 26+ explicitly.

Apple vector mark: Simple Icons, https://github.com/simple-icons/simple-icons/blob/develop/icons/apple.svg (rendered white; no raster/background required).

### Download analytics
The primary download now fetches `/downloads/Pixie.dmg` (byte-identical to the notarized release), verifies SHA256, then hands a Blob to the browser download manager. GitHub Release remains a direct fallback.
Mixpanel events in the existing app project: Page Viewed (path, referrer_domain, utm_*), Download Clicked, Download Completed, Download Failed, Download Unsupported, Download Fallback Clicked. Events are sent form-encoded (CORS simple request): Mixpanel's preflight omits Access-Control-Allow-Headers, so the original JSON request was silently blocked and no download events arrived before Nov 15 2026. Events go first to the first-party Supabase relay `pixie-analytics` (ad-blocker resistant), falling back to api.mixpanel.com; shared $insert_id dedupes. The installer SHA256 (and `release` property) is computed at build time from public/downloads/Pixie.dmg in vite.config.ts — replacing the DMG is enough. Completion means the browser fully received and checksum-verified the bytes, NOT proof the user saved to disk or installed; compare with the app's `App Launched` where first_launch=true. Click/completion/fallback share attempt_id; cta is hero/closing; anonymous distinct_id supports unique browser counts. Filter is_test=false for launch reporting. Local QA is is_test=true. No autocapture, session replay, email, full URL, or IP enrichment. Telemetry cannot block downloading.
