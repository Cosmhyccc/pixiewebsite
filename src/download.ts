// Same public ingestion token as the Mac app; no analytics read credentials.
const token = 'bc31218b5266564b4ee19572ba6d53dc';
const checksum = '53a6c2986e1d88ffd9f76403794e746333345bdd143ccbcc0f1f8f7a08335d33';
export const fallbackURL = 'https://github.com/Cosmhyccc/pixiewebsite/releases/download/pixie-production-20261023/Pixie.dmg';
let visitor: string = crypto.randomUUID();
try {
  visitor = localStorage.getItem('pixie.web.visitor') || visitor;
  localStorage.setItem('pixie.web.visitor', visitor);
} catch { /* Private browsing: keep this page's anonymous identity. */ }

export function trackDownload(event: string, properties: Record<string, string | number | boolean>) {
  const payload = JSON.stringify([{ event, properties: {
    token, distinct_id: visitor, $insert_id: crypto.randomUUID(), time: Math.floor(Date.now()/1000),
    source: 'website', release_channel: 'production', release: '20261023-195605',
    is_test: location.hostname !== 'wowpixie.com', ...properties,
  }}]);
  // Telemetry never blocks downloading. Retry using the same deduplication ID.
  async function send(attempt = 0): Promise<void> {
    try {
      const response = await fetch('https://api.mixpanel.com/track?verbose=1&ip=0', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: payload,
        keepalive: true, credentials: 'omit', signal: AbortSignal.timeout(5000),
      });
      if (!response.ok || (await response.json()).status !== 1) throw Error('tracking_failed');
    } catch { if (attempt < 2) setTimeout(() => void send(attempt + 1), 1000 * 2 ** attempt); }
  }
  void send();
}

export async function receiveInstaller(): Promise<Blob> {
  const response = await fetch('/downloads/Pixie.dmg', {signal: AbortSignal.timeout(60000)});
  if (!response.ok) throw Error('http_error');
  const bytes = await response.arrayBuffer();
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), x => x.toString(16).padStart(2, '0')).join('');
  if (hash !== checksum) throw Error('checksum_mismatch');
  return new Blob([bytes], {type: 'application/x-apple-diskimage'});
}
