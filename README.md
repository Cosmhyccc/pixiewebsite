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
