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
Both homepage CTAs use the explicit production GitHub Release asset `pixie-production-20261023/Pixie.dmg` in this public website repository. Publish and verify that notarized asset before deploying these buttons. Do not upload app source or beta installers here.

Mac detection is a convenience guard: excludes iOS (including iPad desktop mode), Android, Windows and other platforms from the download action. It cannot verify CPU or macOS version; the page states Apple Silicon / macOS 26+ explicitly.

Apple vector mark: Simple Icons, https://github.com/simple-icons/simple-icons/blob/develop/icons/apple.svg (rendered white; no raster/background required).
