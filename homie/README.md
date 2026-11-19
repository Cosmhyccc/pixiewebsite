# homie site

Static one-page site (no build step). Everything lives in this folder.

## Deploy on Vercel

1. New Vercel project from this repo, branch `codex/homie-site`.
2. **Root Directory: `homie`**. Framework preset: **Other**. No build command, no output directory.
3. `vercel.json` here sets clean URLs (`/models` → `/#inside`), long caching for fonts/vendor, a day for images, an hour for JS/CSS (they're also versioned with `?v=`).

The site URL lives in one place: the `<link rel="canonical">`, `og:url`, `og:image` and `twitter:image` lines at the top of `index.html` (currently `https://homie-mac.vercel.app`). Social cards need an absolute URL, so after picking the real Vercel name or buying a domain run:

```bash
./set-site-url.sh https://the-real-domain
```

## Before it goes live

- **Waitlist CORS.** `invite.js` posts to the Supabase function `pixie-local-waitlist`. Its allowed origins don't include the Vercel origin yet, so signups fail until the function's CORS list gets the new origin (e.g. `https://homie-mac.vercel.app`) and is redeployed. Not changed here; the backend owner deploys it.
- **GitHub.** Download buttons and the sticker point at https://github.com/Cosmhyccc/homie. It's private until launch, so visitors see a 404 until it's public.
- **Discord.** The invite in the outro (`N5vkCwKrX`) expired; swap in a permanent one.

## Local preview

```bash
python3 -m http.server 8765   # then open http://127.0.0.1:8765
```
