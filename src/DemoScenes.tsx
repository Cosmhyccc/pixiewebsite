import { useEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { Eye } from './Characters';

type DemoProps = { active: boolean; reducedMotion: boolean };
const clamp = (value: number) => Math.max(0, Math.min(1, value));

// One clock drives the ink, brush and gaze. Pauses when the tab isn't visible.
function useDemoClock(active: boolean, reducedMotion: boolean, duration: number, draw: (time: number) => void) {
  const callback = useRef(draw);
  callback.current = draw;
  useEffect(() => {
    if (!active) return;
    if (reducedMotion) { callback.current(duration * .8); return; }
    let frame = 0, elapsed = 0, previous = performance.now();
    function tick(now: number) {
      elapsed += Math.min(now - previous, 80);
      previous = now;
      callback.current((elapsed / 1000) % duration);
      frame = requestAnimationFrame(tick);
    }
    function visibility() {
      cancelAnimationFrame(frame);
      if (!document.hidden) { previous = performance.now(); frame = requestAnimationFrame(tick); }
    }
    callback.current(0);
    document.addEventListener('visibilitychange', visibility);
    if (!document.hidden) frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', visibility); };
  }, [active, reducedMotion, duration]);
}

function ink(path: SVGPathElement | null, progress: number) {
  if (path) path.style.strokeDashoffset = `${1 - clamp(progress)}`;
}
function gaze(element: HTMLDivElement | null, x: number, y: number) {
  element?.style.setProperty('--look-x', `${Math.max(-2, Math.min(2, (x - 450) / 170))}px`);
  element?.style.setProperty('--look-y', `${Math.max(-1, Math.min(2, (y - 20) / 160))}px`);
}
function Notch({ speaking = false, large = false }: { speaking?: boolean; large?: boolean }) {
  return <div className={`demo-notch ${speaking ? 'is-speaking' : ''} ${large ? 'is-teaching' : ''}`}>
    <Eye side="left" /><Eye side="right" />
    <div className="notch-wave">{[0, 1, 2, 3, 4].map(i => <i key={i} style={{ animationDelay: `${-.13 * i}s` }} />)}</div>
  </div>;
}
function Laptop({ children, label, screenRef, className = '' }: { children: ReactNode; label: string; screenRef?: RefObject<HTMLDivElement | null>; className?: string }) {
  return <div className={`computer demo-computer ${className}`} role="img" aria-label={label}>
    <div className="computer-screen" ref={screenRef}>{children}</div><div className="computer-base" />
  </div>;
}

const strokes = [
  'M214 267 C220 252 232 226 245 203 L258 173 Q262 161 266 175 L284 215 L328 219 Q344 219 331 230 L299 258 L307 299 Q310 314 298 306 L264 284 L229 307 Q216 315 220 301 L228 264 L199 237 Q186 224 202 225 L245 222',
  'M164 347 C210 328 250 335 299 326 C350 317 394 323 440 307 C484 294 501 275 535 268 C568 261 608 265 644 238',
  'M612 228 Q637 231 657 226 Q652 247 648 265',
];
export function DrawingDemo({ active, reducedMotion }: DemoProps) {
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const brush = useRef<SVGGElement>(null);
  const outlines = useRef<(SVGPathElement | null)[]>([]);
  const prepared = useRef(false);
  const screen = useRef<HTMLDivElement>(null);
  useDemoClock(active, reducedMotion, 9, time => {
    if (!prepared.current && paths.current.length === 3) {
      paths.current.forEach((path, index) => {
        if (!path) return;
        const length = path.getTotalLength();
        const left: string[] = [], right: string[] = [];
        for (let i = 0; i <= 220; i++) {
          const fraction = i / 220;
          const p = path.getPointAtLength(length * fraction);
          const before = path.getPointAtLength(Math.max(0, length * fraction - 1));
          const after = path.getPointAtLength(Math.min(length, length * fraction + 1));
          const angle = Math.atan2(after.y - before.y, after.x - before.x) + Math.PI / 2;
          const pressure = (1.4 + Math.pow(Math.sin(Math.PI * fraction), .4) * [5.5, 4, 3][index]) * (1 + Math.sin(fraction * 27 + index) * .16);
          left.push(`${p.x + Math.cos(angle) * pressure},${p.y + Math.sin(angle) * pressure}`);
          right.push(`${p.x - Math.cos(angle) * pressure},${p.y - Math.sin(angle) * pressure}`);
        }
        outlines.current[index]?.setAttribute('d', `M${left.join('L')}L${right.reverse().join('L')}Z`);
      });
      prepared.current = true;
    }
    const timings = [[.5, 3.1], [3.8, 2], [6, .6]];
    let current = 0, amount = 0;
    timings.forEach(([start, length], i) => {
      // Small changes of speed give the stroke a wrist-led rhythm.
      const linear = clamp((time - start) / length);
      const progress = reducedMotion ? 1 : clamp(linear + Math.sin(linear * Math.PI * 4) * .018);
      ink(paths.current[i], progress);
      if (time >= start) { current = i; amount = progress; }
    });
    const path = paths.current[current];
    if (!path || !brush.current) return;
    const length = path.getTotalLength();
    const point = path.getPointAtLength(amount * length);
    const next = path.getPointAtLength(Math.min(length, amount * length + 3));
    const direction = Math.atan2(next.y - point.y, next.x - point.x) * 180 / Math.PI;
    brush.current.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${24 + Math.sin(time * 2) * 7 + direction * .06})`);
    brush.current.style.opacity = reducedMotion ? '0' : `${time < 7.3 ? 1 : clamp((8 - time) / .7)}`;
    gaze(screen.current, point.x, point.y);
  });
  return <Laptop screenRef={screen} className="freehand-demo" label="Pixie follows a paintbrush with her eyes as it sketches an imperfect red star and a sweeping arrow">
    <Notch />
    <svg viewBox="0 0 900 510" className="demo-svg" aria-hidden="true">
      <defs><linearGradient id="brush-wood" x2="1" y2="0"><stop stopColor="#87553a" /><stop offset=".45" stopColor="#d7ad75" /><stop offset="1" stopColor="#a5764d" /></linearGradient></defs>
      <rect x="88" y="99" width="724" height="350" rx="12" fill="#1c1c1b" stroke="#ffffff0b" />
      <circle cx="108" cy="118" r="3" fill="#54544e" /><circle cx="121" cy="118" r="3" fill="#54544e" /><circle cx="134" cy="118" r="3" fill="#54544e" />
      <defs>{strokes.map((d, i) => <mask key={d} id={`freehand-reveal-${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width="900" height="510"><path ref={node => { paths.current[i] = node; }} d={d} className="hand-ink" pathLength="1" fill="none" stroke="white" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round" /></mask>)}</defs>
      {strokes.map((d, i) => <path key={d} ref={node => { outlines.current[i] = node; }} fill="#ff5149" mask={`url(#freehand-reveal-${i})`} />)}
      <g ref={brush} className="artist-brush">
        <path d="M-5-29 Q-6-66-2-107 Q0-121 4-109 Q9-63 7-29Z" fill="url(#brush-wood)" />
        <path d="M-7-31 8-30 10-13-8-15Z" fill="#c5c4b9" /><path d="M-6-28 7-27M-7-18 8-17" stroke="#7a7a72" strokeWidth="1.5" />
        <path d="M-8-15 Q-13-6-9 0 L-5-3-3 3 0 0 2 4 Q12-1 10-13Z" fill="#e65040" />
        <path d="M-5-12-5-3M0-11 0 0M5-10 4 1" stroke="#ff9980" strokeWidth="1.2" />
      </g>
    </svg>
  </Laptop>;
}

function Caption({ active, reducedMotion, text }: { active: boolean; reducedMotion: boolean; text: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    if (!active || reducedMotion) return;
    const timer = setInterval(() => setCount(value => {
      if (value >= text.length) { clearInterval(timer); return value; }
      return value + 1;
    }), 32);
    return () => clearInterval(timer);
  }, [active, reducedMotion, text]);
  return <div className={`explain-caption ${active ? 'is-talking' : ''}`} aria-hidden="true">
    <div className="caption-voice"><span>Pixie</span><div>{[0, 1, 2, 3, 4, 5].map(i => <i key={i} style={{ animationDelay: `${i * -.12}s` }} />)}</div></div>
    <div>{reducedMotion ? text : text.slice(0, count)}<span className="caption-caret" /></div>
  </div>;
}

export function PhysicsDemo({ active, reducedMotion }: DemoProps) {
  const circle = useRef<SVGPathElement>(null), arrow = useRef<SVGPathElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const [talking, setTalking] = useState(false);
  const phase = useRef(false);
  useDemoClock(active, reducedMotion, 13, time => {
    ink(circle.current, reducedMotion ? 1 : (time - .7) / 2);
    ink(arrow.current, reducedMotion ? 1 : (time - 3.6) / 1.3);
    const speak = time >= 3 && time < 12;
    if (phase.current !== speak) { phase.current = speak; setTalking(speak); }
    gaze(screen.current, time < 3.5 ? 355 : 680, time < 3.5 ? 306 : 185);
  });
  const speaking = active && (reducedMotion || talking);
  return <Laptop className="physics-demo" screenRef={screen} label="Illustrated YouTube physics lesson. Pixie circles a phase difference of pi and explains destructive interference with an annotation arrow">
    <Notch speaking={speaking} />
    <svg viewBox="0 0 900 510" className="demo-svg" aria-hidden="true">
      <rect x="20" y="62" width="860" height="430" rx="9" fill="#171717" />
      <rect x="37" y="76" width="30" height="20" rx="5" fill="#fa3639" /><path d="m49 81 9 5-9 5Z" fill="white" /><text x="74" y="92" className="mock-label" fontSize="18">YouTube</text>
      <rect x="218" y="75" width="338" height="24" rx="12" fill="#242424" /><text x="234" y="92" fill="#858580" fontSize="12">wave interference explained</text>
      <rect x="38" y="114" width="548" height="309" rx="4" fill="#13232a" />
      <text x="62" y="147" fill="#d5e5e4" fontSize="16">WHEN WAVES CANCEL</text>
      <path d="M62 214H558M62 275H558" stroke="#ffffff10" />
      <path d="M70 215C103 147 136 147 169 215S235 283 268 215 334 147 367 215 433 283 466 215 532 147 565 215" fill="none" stroke="#86d9d2" strokeWidth="4" />
      <path d="M70 215C103 283 136 283 169 215S235 147 268 215 334 283 367 215 433 147 466 215 532 283 565 215" fill="none" stroke="#e7b373" strokeWidth="4" />
      <text x="77" y="323" fill="#cfdddd" fontSize="24">ψ₁ + ψ₂ = 0</text><text x="327" y="323" fill="#fffefa" fontSize="32">Δφ = π</text>
      <path d="M70 362H554" stroke="#a6c2c1" strokeWidth="3" /><text x="74" y="387" fill="#829c9e" fontSize="13">Equal amplitude. Opposite phase.</text>
      <rect x="53" y="405" width="519" height="3" fill="#5e6667" /><rect x="53" y="405" width="205" height="3" fill="#f34c4a" /><circle cx="258" cy="406" r="4" fill="#fff" />
      <text x="40" y="451" fill="#eee" fontSize="18">The beauty of destructive interference</text><text x="40" y="477" fill="#8d8d89" fontSize="12">Physics, one idea at a time · 08:24</text>
      <rect x="611" y="332" width="100" height="62" rx="5" fill="#293333" /><path d="M625 366q14-34 28 0t28 0" fill="none" stroke="#9bb7b1" strokeWidth="3" /><rect x="725" y="342" width="130" height="5" rx="2" fill="#41413e" /><rect x="725" y="357" width="92" height="5" rx="2" fill="#2b2b29" />
      <rect x="611" y="412" width="100" height="62" rx="5" fill="#292931" /><circle cx="660" cy="443" r="20" fill="none" stroke="#8888a5" strokeWidth="2" /><rect x="725" y="424" width="116" height="5" rx="2" fill="#41413e" />
      <path ref={circle} className="hand-ink" pathLength="1" d="M418 281C381 266 326 278 312 298C297 324 327 345 372 346C419 350 451 330 446 304C442 289 423 282 405 279" fill="none" stroke="#ff6255" strokeWidth="5" strokeLinecap="round" />
      <path ref={arrow} className="hand-ink" pathLength="1" d="M449 294C491 306 519 269 542 233C567 193 591 188 616 190M602 180 619 190 603 202" fill="none" stroke="#ff6255" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <Caption active={speaking} reducedMotion={reducedMotion} text="These waves are half a cycle apart. The peak of one meets the trough of the other — so they cancel." />
  </Laptop>;
}

export function EditingDemo({ active, reducedMotion }: DemoProps) {
  const screen = useRef<HTMLDivElement>(null);
  const mark = useRef<SVGPathElement>(null), nextMark = useRef<SVGPathElement>(null);
  const cursor = useRef<SVGGElement>(null);
  const [step, setStep] = useState(0);
  const phase = useRef(0);
  useDemoClock(active, reducedMotion, 13, time => {
    const next = time < 2 ? 0 : time < 6.8 ? 1 : 2;
    if (phase.current !== next) { phase.current = next; setStep(next); }
    ink(mark.current, reducedMotion ? 1 : (time - 2.9) / 1.1);
    ink(nextMark.current, reducedMotion ? 1 : (time - 7.1) / 1.4);
    const move = clamp((time - 6.3) / 1.1);
    const eased = move * move * (3 - 2 * move);
    const arrival = clamp((time - 1.9) / 1);
    const approach = arrival * arrival * (3 - 2 * arrival);
    const x = time < 6.3 ? 136 + (503 - 136) * approach : 503 + (727 - 503) * eased;
    const y = time < 6.3 ? 300 + (375 - 300) * approach : 375 + (238 - 375) * eased;
    cursor.current?.setAttribute('transform', `translate(${x} ${y})`);
    if (cursor.current) cursor.current.style.opacity = reducedMotion || time > 1.5 ? '1' : '0';
    gaze(screen.current, x, y);
  });
  const teaching = active && (reducedMotion || step > 0);
  return <Laptop className={`editing-demo ${teaching ? 'guided' : ''}`} screenRef={screen} label="Illustrated DaVinci Resolve-style editing workspace. The user's cursor stays still while Pixie's second cursor circles a clip, then points to the exposure control">
    <Notch large={teaching} />
    <svg viewBox="0 0 900 510" className="demo-svg" aria-hidden="true">
      <defs><linearGradient id="film-sky" x2="0" y2="1"><stop stopColor="#a3a8a2" /><stop offset="1" stopColor="#dbb293" /></linearGradient></defs>
      <rect x="17" y="61" width="866" height="435" rx="5" fill="#202122" />
      <text x="30" y="81" fill="#939591" fontSize="12">DaVinci Resolve</text><text x="643" y="81" fill="#868884" fontSize="11">Media Pool　 Effects　 Inspector</text>
      <rect x="25" y="94" width="168" height="200" fill="#292b2b" /><text x="36" y="112" fill="#b6b7b3" fontSize="11">MASTER / FOOTAGE</text>
      {[0,1,2,3].map(i => <g key={i}><rect x={35+(i%2)*78} y={124+Math.floor(i/2)*73} width="68" height="43" fill={['#655f52','#59635c','#636967','#64625d'][i]} /><path d={`M${35+(i%2)*78} ${155+Math.floor(i/2)*73}l22-18 21 15 25-8v23h-68Z`} fill="#2c3934" /><text x={35+(i%2)*78} y={181+Math.floor(i/2)*73} fill="#999d97" fontSize="9">coast_0{i+1}.mov</text></g>)}
      <rect x="207" y="94" width="409" height="201" fill="#151616" />
      <rect x="240" y="102" width="344" height="174" fill="url(#film-sky)" />
      <path d="M240 231 291 204 332 215 384 161 433 187 470 154 509 197 584 222V276H240Z" fill="#45514b" /><path d="M240 254 322 232 391 247 470 221 584 237V276H240Z" fill="#283a34" /><path d="M427 196q-3 48-23 80" stroke="#a3afa0" strokeWidth="3" fill="none" />
      <text x="367" y="289" fill="#b8bcb7" fontSize="10">01:00:08:12　 ▷</text>
      <rect x="630" y="94" width="244" height="201" fill="#292b2b" /><text x="645" y="115" fill="#d0d2cc" fontSize="12">Color / Primary wheels</text>
      {[0,1,2].map(i => <g key={i}><circle cx={670+i*76} cy="163" r="24" fill="#202323" stroke={['#a47e78','#93a58a','#889cac'][i]} strokeWidth="3" /><path d={`M${670+i*76} 143v40m-20-20h40`} stroke="#535955" /><circle cx={670+i*76} cy="163" r="3" fill="#cad0c5" /></g>)}
      <text x="646" y="215" fill="#a8aca5" fontSize="11">Exposure</text><path d="M650 238H853" stroke="#555b56" strokeWidth="3" /><circle className="exposure-knob" cx="735" cy="238" r="6" fill="#c3cbbd" />
      <text x="646" y="272" fill="#8d948a" fontSize="10">Contrast　 1.000　　 Saturation　50</text>
      <rect x="25" y="307" width="849" height="151" fill="#191b1b" />
      <text x="36" y="328" fill="#8d938b" fontSize="11">TIMELINE 01</text>
      {Array.from({length:13},(_,i)=><path key={i} d={`M${195+i*51} 338v7`} stroke="#626962" />)}
      <text x="38" y="378" fill="#8e968b" fontSize="11">V1</text><text x="38" y="425" fill="#8e968b" fontSize="11">A1</text>
      <rect x="172" y="354" width="156" height="37" rx="3" fill="#586a86" /><rect x="331" y="354" width="219" height="37" rx="3" fill="#7c90ad" /><rect x="553" y="354" width="197" height="37" rx="3" fill="#586a86" />
      <text x="347" y="377" fill="#e7edf4" fontSize="12">coast_03.mov</text>
      <rect x="172" y="400" width="578" height="40" rx="3" fill="#3e655c" />
      {Array.from({length:68},(_,i)=><path key={i} d={`M${178+i*8} ${417-Math.abs(Math.sin(i*1.7))*10}v${5+Math.abs(Math.sin(i*1.7))*19}`} stroke="#7caa98" strokeWidth="2" />)}
      <path d="M467 336V449" stroke="#ee8d76" strokeWidth="2" /><path d="m461 333 6 9 6-9Z" fill="#ee8d76" />
      <text x="240" y="482" fill="#858e83" fontSize="11">Media　　 Cut　　 Edit　　 Fusion　　 Color　　 Fairlight　　 Deliver</text>
      <path d="M110 290v24l6-7 5 10 4-2-5-10h10Z" fill="#fffefa" stroke="#101110" strokeWidth="2" /><text x="129" y="318" fill="#a6aea2" fontSize="10">You</text>
      <path ref={mark} className="hand-ink" pathLength="1" d="M530 348C483 335 355 338 325 355C299 375 331 401 422 400C500 402 565 391 563 371C561 358 542 350 521 346" stroke="#ff6657" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path ref={nextMark} className="hand-ink" pathLength="1" d="M556 349C596 320 583 242 639 239M627 228 641 238 628 251M709 224Q735 219 760 224" stroke="#ff6657" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <g ref={cursor} className="pixie-cursor"><path d="M0 0v25l7-7 5 10 4-2-5-10h10Z" fill="#d1efb0" stroke="#172015" strokeWidth="2" /><rect x="17" y="20" width="44" height="19" rx="9" fill="#d1efb0" /><text x="25" y="33" fill="#172015" fontSize="11">Pixie</text></g>
    </svg>
    <div className={`guide-hint ${teaching ? 'is-talking' : ''}`} aria-hidden="true"><span className="guide-number">{step < 2 ? '1' : '2'}</span>{step < 2 ? 'First, select this clip.' : 'Now lift the exposure a little.'}</div>
  </Laptop>;
}
