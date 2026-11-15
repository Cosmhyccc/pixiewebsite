// Same public ingestion token as the Mac app; no analytics read credentials.
const token = 'bc31218b5266564b4ee19572ba6d53dc';
// Computed at build time from public/downloads/Pixie.dmg (see vite.config.ts), so a new
// installer can never ship with a stale checksum.
declare const __DMG_SHA256__: string;
const checksum = __DMG_SHA256__;
export const fallbackURL = 'https://github.com/Cosmhyccc/pixiewebsite/releases/download/pixie-production-20261115/Pixie.dmg';
// First-party relay keeps ad blockers from dropping events; direct Mixpanel is the fallback.
const relayURL = 'https://yiphasqdhitluorenuwl.supabase.co/functions/v1/pixie-analytics';
const mixpanelURL = 'https://api.mixpanel.com/track?verbose=1&ip=0';
let visitor: string = crypto.randomUUID();
try {
  visitor = localStorage.getItem('pixie.web.visitor') || visitor;
  localStorage.setItem('pixie.web.visitor', visitor);
} catch { /* Private browsing: keep this page's anonymous identity. */ }

export function trackDownload(event: string, properties: Record<string, string | number | boolean>) {
  // Form-encoded body = CORS "simple request": no preflight. Mixpanel's preflight omits
  // Access-Control-Allow-Headers, so a JSON content type was silently blocked in browsers.
  const body = new URLSearchParams({ data: JSON.stringify([{ event, properties: {
    token, distinct_id: visitor, $device_id: visitor, $insert_id: crypto.randomUUID(), time: Math.floor(Date.now()/1000),
    source: 'website', release_channel: 'production', release: checksum.slice(0, 12),
    is_test: location.hostname !== 'wowpixie.com', ...properties,
  }}]) });
  async function post(url: string) {
    const response = await fetch(url, { method: 'POST', body, keepalive: true, credentials: 'omit', signal: AbortSignal.timeout(5000) });
    if (!response.ok || (await response.json()).status !== 1) throw Error('tracking_failed');
  }
  // Telemetry never blocks downloading. Retries reuse the same $insert_id, so Mixpanel dedupes.
  async function send(attempt = 0): Promise<void> {
    try { await post(relayURL); }
    catch {
      try { await post(mixpanelURL); }
      catch { if (attempt < 2) setTimeout(() => void send(attempt + 1), 1000 * 2 ** attempt); }
    }
  }
  void send();
}

/** One event per page load: path, referring site and campaign tags only (no full URL or query). */
export function trackPageView() {
  const params = new URLSearchParams(location.search);
  const properties: Record<string, string> = { path: location.pathname.slice(0, 100) };
  try { if (document.referrer) { const host = new URL(document.referrer).hostname; if (host !== location.hostname) properties.referrer_domain = host.slice(0, 100); } } catch { /* ignore */ }
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
    const value = params.get(key);
    if (value) properties[key] = value.slice(0, 100);
  }
  trackDownload('Page Viewed', properties);
}

export async function receiveInstaller(): Promise<Blob> {
  const response = await fetch('/downloads/Pixie.dmg', {signal: AbortSignal.timeout(60000)});
  if (!response.ok) throw Error('http_error');
  const bytes = await response.arrayBuffer();
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), x => x.toString(16).padStart(2, '0')).join('');
  if (hash !== checksum) throw Error('checksum_mismatch');
  return new Blob([bytes], {type: 'application/x-apple-diskimage'});
}
