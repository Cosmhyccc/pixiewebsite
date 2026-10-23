import { useEffect, useState } from 'react';

// Same 5 × 6 silhouette and 2 × 2 pupils as the native EyesView.
export function Eye({ side }: { side: string }) {
  return <svg className={`eye eye--${side}`} viewBox="0 0 15 18" aria-hidden="true" shapeRendering="crispEdges">
    <path fill="currentColor" d="M3 0h9v3h3v12h-3v3H3v-3H0V3h3Z" />
    <rect className="pupil" x="4.5" y="6" width="6" height="6" fill="#050505" />
  </svg>;
}



export function TypedHeadline({ active, reducedMotion, text, id }: { active: boolean; reducedMotion: boolean; text: string; id: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    if (!active || reducedMotion) return;
    const timer = setInterval(() => setCount(previous => {
      if (previous >= text.length) { clearInterval(timer); return previous; }
      return previous + 1;
    }), 42);
    return () => clearInterval(timer);
  }, [active, reducedMotion, text]);
  let offset = 0;
  return <h2 id={id} aria-label={text}><span aria-hidden="true">
    {text.split(' ').map((word, index) => {
      const start = offset;
      offset += word.length + 1;
      return <span key={index} className={`typed-word ${word === 'DO' ? 'typed-emphasis' : ''}`}>
        {[...word].map((letter, i) => <span key={i} className={`${reducedMotion || start + i < count ? 'typed-letter' : 'untyped-letter'} ${!reducedMotion && start + i === count - 1 ? 'typing-head' : ''}`}>{letter}</span>)}
        <span> </span>
      </span>;
    })}
  </span></h2>;
}


export function HeroGreeting({ reducedMotion }: { reducedMotion: boolean }) {
  const text = 'Hello, world';
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (reducedMotion) return;
    setCount(0);
    let interval: ReturnType<typeof setInterval>;
    const delay = setTimeout(() => {
      interval = setInterval(() => setCount(previous => {
        if (previous + 1 >= text.length) clearInterval(interval);
        return Math.min(previous + 1, text.length);
      }), 110);
    }, 450);
    return () => { clearTimeout(delay); clearInterval(interval); };
  }, [reducedMotion]);
  return <h1 className="hero-greeting" aria-label={text}>
    <span className="greeting-measure" aria-hidden="true">{text}</span>
    <span className="greeting-typed" aria-hidden="true">{reducedMotion ? text : text.slice(0, count)}<span className="greeting-cursor" /></span>
  </h1>;
}
