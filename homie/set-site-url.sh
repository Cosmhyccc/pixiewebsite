#!/bin/bash
# Point the site's canonical / og:url / og:image / twitter:image at a new base URL.
# Usage: ./set-site-url.sh https://homie-mac.vercel.app   (no trailing slash)
set -euo pipefail
new="${1:?usage: ./set-site-url.sh https://your.domain}"
new="${new%/}"
cd "$(dirname "$0")"
old=$(sed -n 's/.*<link rel="canonical" href="\([^"]*\)\/".*/\1/p' index.html)
[[ -n "$old" ]] || { echo "canonical link not found in index.html"; exit 1; }
sed -i '' "s#${old}/#${new}/#g; s#SITE URL: ${old}#SITE URL: ${new}#" index.html
echo "site URL: ${old} -> ${new}"
grep -n "$new" index.html
