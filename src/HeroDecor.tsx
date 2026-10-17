import type { CSSProperties } from 'react';
import './hero-decor.css';

// Original 8-bit stickers, using stepped silhouettes rather than rounded emoji.
function Sticker({ kind }: { kind: 'music' | 'cursor' | 'heart' | 'brush' }) {
  return <svg viewBox="0 0 80 80" fill="none" strokeLinejoin="miter">
    {kind === 'music' && <>
      <path d="M24 16h16v-4h24v44h-4v8H44V52h8V28H36v36h-4v8H12V60h4v-4h8Z" fill="#9560F5" stroke="#fffefa" strokeWidth="4" />
      <path d="M28 20h12v-4h20v5H40v4H28Z" fill="#C4A1FF" />
    </>}
    {kind === 'cursor' && <>
      <path d="M18 8v49l13-13 11 24 12-6-12-23h20Z" fill="#36C982" stroke="#fffefa" strokeWidth="4" strokeLinejoin="round" />
      <path d="M23 20v24" stroke="#A2F0C6" strokeWidth="3" />
    </>}
    {kind === 'heart' && <>
      <path d="M12 18h20v8h16v-8h20v28H58v10H48v10H32V56H22V46H12Z" fill="#F26887" stroke="#fffefa" strokeWidth="4" />
      <path d="M20 26h12v4h-8v8h-4Z" fill="#FFD3DE" />
      <path d="M58 38h6v8h-6v10H48v6h-8v-6h8V46h10Z" fill="#D74367" />
    </>}
    {kind === 'brush' && <g transform="rotate(28 40 40)">
      <path d="M34 6h12v35h8v20l-8 11H26l-8-11V41h16Z" fill="#fffefa" stroke="#fffefa" strokeWidth="5" />
      <path d="M35 6h10v36H35Z" fill="#F7B439" />
      <path d="M35 6h4v32h-4Z" fill="#FFE29C" />
      <path d="M21 42h30v12H21Z" fill="#424C59" />
      <path d="M21 42h30v4H21Z" fill="#8F9EAC" />
      <path d="M21 54h30v7h-4v8H25v-8h-4Z" fill="#F45A42" />
      <path d="M27 54v10m9-10v13m9-13v7" stroke="#FF9F76" strokeWidth="3" />
    </g>}

  </svg>;
}

const flecks = [
  [7, 13, -30, 'sage'], [16, 17, 28, 'gold'], [5, 36, -25, 'violet'],
  [20, 32, 40, 'coral'], [14, 46, -18, 'ink'], [24, 49, 25, 'sage'],
  [7, 57, 30, 'coral'], [19, 64, -40, 'gold'], [10, 72, 20, 'violet'],
  [27, 79, -28, 'sage'], [14, 87, 15, 'ink'], [35, 88, -35, 'coral'],
  [84, 13, 30, 'violet'], [94, 21, -30, 'gold'], [80, 25, 25, 'sage'],
  [93, 42, -35, 'coral'], [79, 43, 25, 'ink'], [86, 54, -30, 'gold'],
  [95, 65, 35, 'sage'], [77, 65, -20, 'violet'], [92, 79, -25, 'coral'],
  [73, 83, 30, 'gold'], [83, 90, -35, 'ink'], [59, 86, 30, 'sage'],
];
const burst = [
  [-74, -30, -45], [-58, -61, 30], [-21, -77, -22], [28, -73, 48],
  [64, -50, -28], [80, -18, 60], [60, 19, -32], [-63, 21, 40],
];

export function HeroDecor() {
  return <div className="hero-decor" aria-hidden="true">
    {(['music', 'cursor', 'heart', 'brush'] as const).map(kind =>
      <span key={kind} className={`hero-sticker sticker-${kind}`}><span><Sticker kind={kind} /></span></span>)}
    {flecks.map(([x, y, tilt, color], i) => <i key={i} className={`hero-fleck fleck-${color} ${i % 4 === 0 ? 'is-square' : ''}`} style={{ left: `${x}%`, top: `${y}%`, '--tilt': `${tilt}deg`, '--delay': `${i * -.37}s`, '--drift': `${i % 2 ? 8 : -8}px`, '--duration': `${4.2 + i % 4 * .7}s` } as CSSProperties} />)}
  </div>;
}

export function HelloBurst({ greeting }: { greeting: boolean }) {
  return <span className={`hello-burst ${greeting ? 'is-celebrating' : ''}`} aria-hidden="true">
    {burst.map(([x, y, r], i) => <i key={i} style={{ '--x': `${x}px`, '--y': `${y}px`, '--r': `${r}deg`, '--delay': `${i * 18}ms` } as CSSProperties} />)}
  </span>;
}
