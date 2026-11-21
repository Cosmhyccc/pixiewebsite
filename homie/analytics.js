// Site analytics (Mixpanel project Pixie). Anonymous visitor id in localStorage, no cookies, no autocapture.
// Events: Page Viewed (referrer + utm), Download Clicked (which button), Send To Mac Clicked (phones),
// Link Clicked (discord / github / x / max), Scroll Depth (25/50/75/100). Country/city come from Mixpanel
// geolocating the request; the IP isn't stored. Sent via our relay first (ad blockers), Mixpanel direct as fallback.
(() => {
  const token = "bc31218b5266564b4ee19572ba6d53dc"; // public ingestion token, can't read data
  const relay = "https://yiphasqdhitluorenuwl.supabase.co/functions/v1/pixie-analytics";
  const direct = "https://api.mixpanel.com/track?verbose=1&ip=1";
  let visitor = crypto.randomUUID();
  try { visitor = localStorage.getItem("homie.web.visitor") || visitor; localStorage.setItem("homie.web.visitor", visitor); } catch {}
  const ua = navigator.userAgent;
  const device = /iPhone|iPad|iPod|Android|Mobile/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? "phone"
    : /Macintosh|Mac OS X/.test(ua) ? "mac" : "other";
  const test = !/(^|\.)homie-mac\.vercel\.app$/.test(location.hostname);

  let from = {};   // the link this visit came in on (utm/ref), sent with every event so downloads are attributed too
  function track(event, props = {}) {
    const body = new URLSearchParams({ data: JSON.stringify([{ event, properties: {
      token, distinct_id: visitor, $device_id: visitor, $insert_id: crypto.randomUUID(), time: Math.floor(Date.now() / 1000),
      source: "homie_site", platform: device, is_test: test, ...from, ...props,
    } }]) });
    const post = (url) => fetch(url, { method: "POST", body, keepalive: true, credentials: "omit" })
      .then((r) => r.json()).then((j) => { if (j.status !== 1) throw 0; });
    post(relay).catch(() => post(direct)).catch(() => {});
  }
  window.homieTrack = track;

  const params = new URLSearchParams(location.search), view = { path: location.pathname.slice(0, 100) };
  try { if (document.referrer) { const h = new URL(document.referrer).hostname; if (h !== location.hostname) view.referrer_domain = h.slice(0, 100); } } catch {}
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "ref"]) { const v = params.get(k); if (v) view[k === "ref" ? "utm_source" : k] = v.slice(0, 100); }
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) if (view[k]) from[k] = view[k];
  track("Page Viewed", view);

  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (href.endsWith("homie.dmg")) {
      const cta = a.classList.contains("pill") ? "nav" : a.dataset.guide ? "footer" : "hero";
      track(device === "phone" ? "Send To Mac Clicked" : "Download Clicked", { cta });
    } else {
      const target = /discord\./.test(href) ? "discord" : /github\.com/.test(href) ? "github" : /(x|twitter)\.com/.test(href) ? "x"
        : /max|pricing/.test(href) ? "max" : null;
      if (target) track("Link Clicked", { target });
    }
  }, true);

  const marks = [25, 50, 75, 100], seen = new Set();
  addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (max <= 0) return;
    const pct = (scrollY / max) * 100;
    for (const m of marks) if (pct >= m - 2 && !seen.has(m)) { seen.add(m); track("Scroll Depth", { depth: m }); }
  }, { passive: true });
})();
