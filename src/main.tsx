import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { Eye, TypedHeadline, HeroGreeting } from './Characters';
import { HeroDecor, HelloBurst } from './HeroDecor';
import { SpeedDemo } from './SpeedDemo';
import { DrawingDemo, PhysicsDemo, EditingDemo } from './DemoScenes';

function App() {
  const scrollAnimation = useRef(0);
  const face = useRef<HTMLDivElement>(null);
  const journey = useRef<HTMLElement>(null);
  const [drawingVisible, setDrawingVisible] = useState(false);
  const [closingVisible, setClosingVisible] = useState(false);
  const [activeChapter, setActiveChapter] = useState(-1);
  const [comingSoon, setComingSoon] = useState(false);
  const ctaTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [scene, setScene] = useState(0);
  const [greeting, setGreeting] = useState(false);
  const [blink, setBlink] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const greetingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(query.matches);
    sync(); query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    let frame = 0;
    function update() {
      const element = journey.current;
      if (!element) return;
      const viewport = element.querySelector<HTMLElement>('.hero')!.offsetHeight;
      const travel = Math.max(0, Math.min(8, -element.getBoundingClientRect().top / viewport));
      const progress = Math.min(1, travel / 2);
      const boundaries = [1.95, 2.95, 3.95, 4.95, 5.95, 6.95];
      const chapter = boundaries.filter(boundary => travel >= boundary).length;
      const nearest = Math.min(...boundaries.map(boundary => Math.abs(travel - boundary)));
      const contentOpacity = reducedMotion ? 1 : Math.min(1, nearest / .26);
      boundaries.forEach((boundary, index) => {
        const fraction = Math.max(0, Math.min(1, (travel - boundary + .35) / .7));
        const amount = reducedMotion ? Number(fraction >= .5) : fraction * fraction * (3 - 2 * fraction);
        element.style.setProperty(`--wipe-${index}`, `inset(0 ${(1 - amount) * 50}% ${(1 - amount) * 100}% round 0 0 ${(1 - amount) * 100}px ${(1 - amount) * 100}px)`);
      });
      element.style.setProperty('--chapter-opacity', `${contentOpacity}`);
      element.style.setProperty('--chapter-shift', `${reducedMotion ? 0 : (1 - contentOpacity) * 20}px`);
      setDrawingVisible(chapter === 3 && contentOpacity > .7);
      setClosingVisible(chapter === 6 && contentOpacity > .7);
      setActiveChapter(contentOpacity > .7 ? chapter : -1);
      const mobile = window.innerWidth <= 600;
      const growth = reducedMotion ? Number(progress > .18) : Math.min(1, progress / .5);
      const eased = growth * growth * (3 - 2 * growth);
      const startWidth = mobile ? window.innerWidth * .66 : Math.min(660, window.innerWidth * .64);
      const startHeight = mobile ? Math.max(210, Math.min(285, viewport * .34)) : Math.max(230, Math.min(340, viewport * .38));
      element.style.setProperty('--notch-width', `${startWidth + (element.clientWidth - startWidth) * eased}px`);
      element.style.setProperty('--notch-height', `${startHeight + (viewport - startHeight) * eased}px`);
      element.style.setProperty('--notch-radius', `${(mobile ? 35 : 58) * (1 - eased)}px`);
      element.style.setProperty('--eye-size', `${(mobile ? 40 : Math.max(42, Math.min(72, window.innerWidth * .057))) * (1 + eased * 1.35)}px`);
      element.style.setProperty('--eye-top', `${48 - eased * 15}%`);
      element.style.setProperty('--intro-opacity', `${Math.max(0, 1 - progress / .16)}`);
      element.style.setProperty('--intro-shift', `${reducedMotion ? 0 : -progress * 180}px`);
      element.style.setProperty('--scene-opacity', `${Math.max(0, Math.min(1, (progress - .25) / .18))}`);
      setHeaderVisible(progress < .16);
      setExpanded(progress > .35);
      setScene(chapter);
    }
    function schedule() { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); }
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [reducedMotion]);

  function scrollToScene(index: number) {
    const element = journey.current;
    if (!element) return;
    const height = element.querySelector<HTMLElement>('.hero')!.offsetHeight;
    // Land in the fully revealed hold, never on a chapter's transition boundary.
    const travel = [1.4, 2.4, 3.4, 4.4, 5.4, 6.4, 7.4][index];
    cancelAnimationFrame(scrollAnimation.current);
    const start = window.scrollY;
    const target = start + element.getBoundingClientRect().top + height * travel;
    if (reducedMotion) { window.scrollTo({ top: target, behavior: 'instant' }); return; }
    const began = performance.now();
    const duration = Math.min(1400, 750 + Math.abs(target - start) / height * 120);
    function step(now: number) {
      const t = Math.min(1, (now - began) / duration);
      const eased = t * t * t * (t * (t * 6 - 15) + 10);
      window.scrollTo({ top: start + (target - start) * eased, behavior: 'instant' });
      if (t < 1) scrollAnimation.current = requestAnimationFrame(step);
    }
    scrollAnimation.current = requestAnimationFrame(step);
  }

  useEffect(() => {
    const cancel = () => cancelAnimationFrame(scrollAnimation.current);
    const cancelKey = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) cancel();
    };
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('touchstart', cancel, { passive: true });
    window.addEventListener('keydown', cancelKey);
    return () => {
      cancel();
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
      window.removeEventListener('keydown', cancelKey);
    };
  }, []);

  useEffect(() => {
    if (window.location.hash !== '#about') return;
    const frame = requestAnimationFrame(() => scrollToScene(0));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    // The greeting owns the eyes until its wink finishes. Restart idle blinking
    // afterward so a scheduled blink cannot compete with the wink animation.
    if (reducedMotion || greeting) return;
    let next: ReturnType<typeof setTimeout>;
    let reopen: ReturnType<typeof setTimeout>;
    function schedule(delay: number) {
      next = setTimeout(() => {
        if (!document.hidden) {
          setBlink(true);
          reopen = setTimeout(() => setBlink(false), 180);
        }
        schedule(2800 + Math.random() * 2700);
      }, delay);
    }
    schedule(2200);
    return () => { clearTimeout(next); clearTimeout(reopen); setBlink(false); };
  }, [reducedMotion, greeting]);

  useEffect(() => {
    if (reducedMotion) return;
    let frame = 0;
    function look(event: PointerEvent) {
      if (event.pointerType !== 'mouse') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const element = face.current;
        if (!element) return;
        const box = element.getBoundingClientRect();
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height * .52);
        const distance = Math.max(180, Math.hypot(dx, dy));
        element.style.setProperty('--look-x', `${Math.round(dx / distance * 1.5)}px`);
        element.style.setProperty('--look-y', `${Math.round(dy / distance * 1.5)}px`);
      });
    }
    function reset() {
      cancelAnimationFrame(frame);
      face.current?.style.setProperty('--look-x', '0px');
      face.current?.style.setProperty('--look-y', '0px');
    }
    window.addEventListener('pointermove', look, { passive: true });
    document.documentElement.addEventListener('pointerleave', reset);
    return () => {
      window.removeEventListener('pointermove', look);
      document.documentElement.removeEventListener('pointerleave', reset);
      reset();
    };
  }, [reducedMotion]);

  useEffect(() => () => { clearTimeout(greetingTimer.current); clearTimeout(ctaTimer.current); }, []);

  function previewDownload() {
    clearTimeout(ctaTimer.current);
    setComingSoon(true);
    ctaTimer.current = setTimeout(() => setComingSoon(false), 2400);
  }

  function sayHello() {
    clearTimeout(greetingTimer.current);
    setGreeting(true);
    greetingTimer.current = setTimeout(() => setGreeting(false), 2600);
  }

  return <main>
    <section className={`journey chapter-${scene} ${expanded ? 'is-expanded' : ''}`} ref={journey}>
    <section className="hero" aria-label="Meet Pixie">
    <span className="site-wordmark" aria-label="Pixie">Pixie</span>
    <nav className="site-nav" aria-label="Main navigation" inert={!headerVisible}>
      <button onClick={() => scrollToScene(0)}>About</button>
      <a href="/models.html">Models</a>
      <a href="/privacy.html">Privacy</a>

    </nav>
    <HeroDecor />
    <div className="notch-arrival">
      <div className={`notch ${greeting ? 'is-greeting' : ''} ${blink ? 'is-blinking' : ''}`} ref={face} role="img" aria-label="Pixie’s two white pixel eyes in a black Mac notch">
        <div className="chapter-wipe wipe-white" style={{ clipPath: 'var(--wipe-0)' }} />
        <div className="chapter-wipe wipe-black" style={{ clipPath: 'var(--wipe-1)' }} />
        <div className="chapter-wipe wipe-white" style={{ clipPath: 'var(--wipe-2)' }} />
        <div className="chapter-wipe wipe-black" style={{ clipPath: 'var(--wipe-3)' }} />
        <div className="chapter-wipe wipe-white" style={{ clipPath: 'var(--wipe-4)' }} />
        <div className="chapter-wipe wipe-black" style={{ clipPath: 'var(--wipe-5)' }} />
        <div className="eyes"><Eye side="left" /><Eye side="right" /></div>
        <span className="notch-hello" aria-hidden="true">oh, hi.</span>
      </div>
    </div>
    <div className="intro" inert={expanded}>
      <HeroGreeting reducedMotion={reducedMotion} />
      <p>Your Mac’s little companion.</p>
      <button className="hello-button" onClick={sayHello}>
        <HelloBurst greeting={greeting} />
        <span>Say hello</span>
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h11M10 5l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <span className="sr-only" role="status">{greeting ? 'Pixie says: oh, hi.' : ''}</span>
    </div>
    <button className="scroll-cue explore-control" inert={expanded} aria-label="Scroll down to meet Pixie" onClick={() => scrollToScene(0)} tabIndex={expanded ? -1 : 0}>
      <span>Scroll to explore</span>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
    <div className="scenes" inert={!expanded || scene > 2} aria-label="A little of what Pixie can do">
      <div className="scene-window">
        <div className={`scene ${scene === 0 ? 'is-active' : ''}`} aria-hidden={scene !== 0}>
          <div className="ask-art" aria-hidden="true"><span className="fn-key">fn</span><div className="wave">{[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => <i key={i} style={{ animationDelay: `${i * -.17}s` }} />)}</div></div>
          <TypedHeadline id="intro-feature-title" text="Never use a mouse again." active={expanded && activeChapter === 0} reducedMotion={reducedMotion} />
          <p className="feature-subtitle">Just tell Pixie in natural language and it’ll do <span className="spectrum-italic">anything</span></p>
        </div>
        <div className={`scene ${scene === 1 ? 'is-active' : ''}`} aria-hidden={scene !== 1}>
          {scene === 1 && <SpeedDemo key={activeChapter === 1 ? 'playing' : 'entering'} reducedMotion={reducedMotion} />}
          <h2>Anything you can do,<br />Pixie can do faster</h2>
        </div>
        <div className={`scene ${scene === 2 ? 'is-active' : ''}`} aria-hidden={scene !== 2}>
          <div className="apps-art" aria-hidden="true">
            <span className="app-tile"><svg viewBox="0 0 32 32"><path d="m12 9 10 7-10 7Z" fill="currentColor" /></svg></span>
            <span className="app-tile app-tile--chosen"><svg viewBox="0 0 32 32" fill="none"><path d="M9 10h14M9 16h14M9 22h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg><span className="done-mark">✓</span></span>
            <span className="app-tile"><svg viewBox="0 0 32 32" fill="none"><path d="M12 23V10l12-3v13M12 13l12-3" stroke="currentColor" strokeWidth="2" /><circle cx="9" cy="23" r="3" fill="currentColor" /><circle cx="21" cy="20" r="3" fill="currentColor" /></svg></span>
            <svg className="little-cursor" viewBox="0 0 24 28"><path d="M3 2v21l6-6 5 9 4-2-5-8h9Z" fill="#fffefa" stroke="#050505" strokeWidth="2" /></svg>
          </div>
          <h2>Play music, take notes,<br />explain concepts</h2>
        </div>
      </div>
    </div>
    <section className={`drawing-section ${drawingVisible ? 'is-visible' : ''} ${scene === 3 ? 'is-current' : ''}`} inert={scene !== 3} aria-hidden={scene !== 3} aria-labelledby="drawing-title">
      <TypedHeadline id="drawing-title" text="Pixie can draw directly on your screen" active={drawingVisible} reducedMotion={reducedMotion} />
      <DrawingDemo active={drawingVisible} reducedMotion={reducedMotion} />
    </section>
    <section className={`teaching-section physics-section ${scene === 4 ? 'is-current' : ''}`} inert={scene !== 4} aria-hidden={scene !== 4} aria-labelledby="physics-title">
      <TypedHeadline id="physics-title" text="Hard concepts. Made clear." active={activeChapter === 4} reducedMotion={reducedMotion} />
      <PhysicsDemo active={activeChapter === 4} reducedMotion={reducedMotion} />
    </section>
    <section className={`teaching-section editing-section ${scene === 5 ? 'is-current' : ''}`} inert={scene !== 5} aria-hidden={scene !== 5} aria-labelledby="editing-title">
      <TypedHeadline id="editing-title" text="Finally do the thing" rainbowWord="thing" active={activeChapter === 5} reducedMotion={reducedMotion} />
      <p>Pixie can teach you any tool, software or craft you wanna learn</p>
      <EditingDemo active={activeChapter === 5} reducedMotion={reducedMotion} />
    </section>
    <section className={`closing-section ${scene === 6 ? 'is-current' : ''}`} inert={scene !== 6} aria-hidden={scene !== 6} aria-labelledby="closing-title">
      <div className={`closing-notch ${greeting ? 'is-greeting' : ''} ${blink ? 'is-blinking' : ''}`} aria-hidden="true"><Eye side="left" /><Eye side="right" /></div>
      <TypedHeadline id="closing-title" text="Pixie is the fastest AI buddy that can DO things for you" active={closingVisible} reducedMotion={reducedMotion} />
      <button className="hello-button get-button" onClick={previewDownload} aria-label="Get Pixie — coming soon">
        <span>{comingSoon ? 'Coming soon' : 'Get Pixie'}</span>
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h11M10 5l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <span className="sr-only" role="status">{comingSoon ? 'Pixie downloads are coming at launch.' : ''}</span>
    </section>
    <button className="chapter-next explore-control" inert={!expanded} onClick={() => scene < 6 ? scrollToScene(scene + 1) : window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' })} aria-label={scene < 6 ? 'Scroll down to the next feature' : 'Back to top'}>
      <span>{scene < 6 ? 'Scroll to explore' : 'Back to top'}</span>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={scene === 6 ? { transform: 'rotate(180deg)' } : undefined}><path d="M12 4v16m-6-6 6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
    </section>
    </section>
  </main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
