// homie-mac.vercel.app/download: counts one anonymous download, then hands over the latest signed DMG.
// Every public download link (site buttons, README, release notes, posts) points here, so Mixpanel's
// "homie Downloaded" unique count is the one download number. Sparkle updates go straight to GitHub and
// aren't counted. No cookies; the person is a salted hash of IP + browser (the IP itself isn't stored,
// Mixpanel only uses it for country/city). Counting never blocks or breaks the download.
const { createHash, randomUUID } = require("node:crypto");

const DMG = "https://github.com/Cosmhyccc/homie/releases/latest/download/homie.dmg";
const TOKEN = "bc31218b5266564b4ee19572ba6d53dc"; // public ingestion token, can't read data
const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|slack|headless|lighthouse|monitor|uptime/i;

const clip = (v) => (typeof v === "string" && v ? v.slice(0, 100) : undefined);

module.exports = async function handler(req, res) {
  const ua = String(req.headers["user-agent"] || "");
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || String(req.headers["x-real-ip"] || "");
  const q = req.query || {};
  if (req.method === "GET" && ua && !BOTS.test(ua)) {
    const person = createHash("sha256").update(`${process.env.DOWNLOAD_SALT || TOKEN}|${ip}|${ua}`).digest("hex").slice(0, 32);
    let referrer;
    try { if (req.headers.referer) referrer = new URL(req.headers.referer).hostname; } catch {}
    const props = {
      token: TOKEN, distinct_id: person, $device_id: person, $insert_id: randomUUID(), time: Math.floor(Date.now() / 1000),
      ip, source: "homie_download", from: clip(q.from) || (referrer ? "link" : "direct"), referrer_domain: clip(referrer),
      utm_source: clip(q.utm_source), utm_campaign: clip(q.utm_campaign),
      platform: /iPhone|iPad|Android|Mobile/.test(ua) ? "phone" : /Mac OS X|Macintosh/.test(ua) ? "mac" : "other",
      is_test: q.test === "1",
    };
    for (const k of Object.keys(props)) if (props[k] === undefined) delete props[k];
    const body = new URLSearchParams({ data: JSON.stringify([{ event: "homie Downloaded", properties: props }]) });
    try {
      await fetch("https://api.mixpanel.com/track?verbose=1", { method: "POST", body, signal: AbortSignal.timeout(1500) });
    } catch {}
  }
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Location", DMG);
  res.statusCode = 302;
  res.end();
}
;
