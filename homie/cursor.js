// homie's giant cursor: flies around the page on a spring, points at whatever matters ([data-guide]),
// circles it in crayon, says a line, and does tricks when you're idle. Chill most of the time, a little unhinged sometimes.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const guides = [...document.querySelectorAll("[data-guide]")];
  if (!guides.length) return;

  const css = `
  .gc { position: fixed; left: 0; top: 0; z-index: 80; pointer-events: none; will-change: transform; }
  .gc__arrow { width: var(--gcs, 92px); height: var(--gcs, 92px); overflow: visible; display: block; filter: drop-shadow(4px 7px 0 rgba(31,29,26,.28)); transform-origin: 12% 8%; }
  .gc__arrow path { fill: #e0628a; stroke: #fff8e7; stroke-width: 3.2; stroke-linejoin: round; }
  .gc__arrow .gc__edge { fill: none; stroke: #1f1d1a; stroke-width: 1.6; }
  .gc__name { position: absolute; left: 58%; top: 74%; font-family: "Permanent Marker", cursive; font-size: 15px; color: #fff8e7; background: #e0628a; padding: 1px 9px 2px; border-radius: 8px; box-shadow: 0 0 0 2px #1f1d1a; transform: rotate(-6deg); white-space: nowrap; }
  .gc__bub { position: absolute; left: 70%; top: -16px; translate: 0 -100%; max-width: 230px; width: max-content; background: #fff8e7; color: #1f1d1a; border-radius: 16px; padding: 9px 14px; font: 600 15px/1.3 Barlow, "Helvetica Neue", sans-serif; box-shadow: 0 0 0 3px #1f1d1a, 4px 6px 0 rgba(31,29,26,.2); transform-origin: 0 100%; scale: 0; transition: scale .35s cubic-bezier(.34,1.56,.64,1); }
  .gc__bub.is-on { scale: 1; }
  .gc.is-left .gc__bub { left: auto; right: 30%; transform-origin: 100% 100%; }
  .gc-ring { position: absolute; z-index: 79; pointer-events: none; overflow: visible; }
  .gc-ring path { fill: none; stroke: #e0628a; stroke-width: 6; stroke-linecap: round; filter: url(#crayon); }
  @media (max-width: 700px) { .gc { --gcs: 58px; } .gc__name { font-size: 12px; } .gc__bub { font-size: 13.5px; max-width: 180px; } }
  @media (hover: none) and (max-width: 500px) { .gc__bub { display: none; } }`;
  document.head.insertAdjacentHTML("beforeend", `<style>${css}</style>`);

  const el = document.createElement("div");
  el.className = "gc";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<svg class="gc__arrow" viewBox="0 0 40 40"><path d="M5 3l29 14-12 3.6L16.4 34z"/><path class="gc__edge" d="M5 3l29 14-12 3.6L16.4 34z"/></svg>
    <span class="gc__name">homie</span><div class="gc__bub"></div>`;
  document.body.appendChild(el);
  const arrow = el.querySelector(".gc__arrow");
  const bub = el.querySelector(".gc__bub");

  // spring state
  const pos = { x: innerWidth * 0.6, y: -120 }, vel = { x: 0, y: 0 };
  const trick = { x: 0, y: 0, r: 0, s: 1 };       // offsets animated by tricks
  const dodge = { x: 0, y: 0 };
  let target = { x: innerWidth * 0.6, y: innerHeight * 0.4 };
  let active = null, ring = null, lastMove = performance.now(), bubTimer = 0;
  const QUIPS = ["wheee", "wheeeeee", "wheee", "wheeeee~", "brb doing a lap", "no cloud. just vibes", "scroll more, it gets better"];
  const WHEE = ["wheee", "wheeeeee", "wheeeee~"];
  let lastWhee = 0;

  const say = (text, ms = 2600) => {
    bub.textContent = text;
    bub.classList.add("is-on");
    clearTimeout(bubTimer);
    bubTimer = setTimeout(() => bub.classList.remove("is-on"), ms);
  };

  // pick the guide nearest the middle of the screen
  const pick = () => {
    let best = null, bd = Infinity;
    const mid = innerHeight * 0.48;
    for (const g of guides) {
      const r = g.getBoundingClientRect();
      if (r.bottom < 60 || r.top > innerHeight - 60 || !r.width) continue;
      const d = Math.abs((r.top + r.bottom) / 2 - mid);
      if (d < bd) { bd = d; best = g; }
    }
    return best;
  };

  // a wobbly crayon loop drawn around the element, living in the page (it scrolls with it)
  const circle = (g) => {
    if (ring) { const old = ring; gsap.to(old, { opacity: 0, duration: 0.3, onComplete: () => old.remove() }); ring = null; }
    const r = g.getBoundingClientRect();
    const pad = 22, w = r.width + pad * 2, h = r.height + pad * 2;
    if (w > 700 || h > 460 || innerWidth < 700) return; // big sections (and phones) just get pointed at
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "gc-ring");
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    Object.assign(svg.style, { left: r.left + scrollX - pad + "px", top: r.top + scrollY - pad + "px", width: w + "px", height: h + "px" });
    // an ellipse that overshoots its start, like a real marker loop
    const cx = w / 2, cy = h / 2, rx = w / 2 - 6, ry = h / 2 - 6;
    let d = "";
    for (let i = 0; i <= 56; i++) {
      const t = -0.5 + (i / 50) * Math.PI * 2;
      const wob = 1 + Math.sin(i * 1.7) * 0.012 + i * 0.0009;
      const x = cx + Math.cos(t) * rx * wob, y = cy + Math.sin(t) * ry * wob;
      d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }
    const p = document.createElementNS(ns, "path");
    p.setAttribute("d", d);
    svg.appendChild(p);
    document.body.appendChild(svg);
    const len = p.getTotalLength();
    p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
    gsap.to(p, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", delay: 0.35 });
    ring = svg;
    // the cursor "draws" it: ride along the loop
    const o = { t: 0 };
    gsap.to(o, { t: 1, duration: 0.9, ease: "power2.inOut", delay: 0.35, onUpdate: () => {
      const pt = p.getPointAtLength(len * o.t);
      const rr = svg.getBoundingClientRect();
      trick.x = rr.left + pt.x - target.x; trick.y = rr.top + pt.y - target.y;
    }, onComplete: () => gsap.to(trick, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" }) });
  };

  const tricks = [
    () => { // loop-de-loop
      const o = { a: 0 };
      gsap.to(o, { a: Math.PI * 2, duration: 1.1, ease: "power1.inOut", onUpdate: () => { trick.x = Math.sin(o.a) * 70; trick.y = (1 - Math.cos(o.a)) * -60; trick.r = (o.a / (Math.PI * 2)) * 360; }, onComplete: () => (trick.r = 0) });
    },
    () => { // zoomies: figure 8 across the screen
      const o = { a: 0 };
      gsap.to(o, { a: Math.PI * 2, duration: 1.6, ease: "sine.inOut", onUpdate: () => { trick.x = Math.sin(o.a) * innerWidth * 0.22; trick.y = Math.sin(o.a * 2) * 60; } });
    },
    () => gsap.timeline().to(trick, { s: 1.35, duration: 0.18, ease: "power2.out" }).to(trick, { s: 1, duration: 0.6, ease: "elastic.out(1, 0.35)" }), // boing
    () => gsap.timeline().to(trick, { r: -18, duration: 0.1 }).to(trick, { r: 16, duration: 0.1, repeat: 3, yoyo: true }).to(trick, { r: 0, duration: 0.3 }), // wiggle
  ];

  // you move toward it, it scoots away (then comes back)
  addEventListener("pointermove", (e) => {
    lastMove = performance.now();
    const dx = pos.x + 30 - e.clientX, dy = pos.y + 30 - e.clientY, dist = Math.hypot(dx, dy);
    if (dist < 110 && e.pointerType === "mouse") {
      const k = (110 - dist) / 110;
      gsap.to(dodge, { x: (dx / (dist || 1)) * 120 * k, y: (dy / (dist || 1)) * 90 * k, duration: 0.25, overwrite: true });
      gsap.to(dodge, { x: 0, y: 0, duration: 1.2, delay: 1.4, ease: "power2.inOut" });
    }
  }, { passive: true });
  addEventListener("scroll", () => (lastMove = performance.now()), { passive: true });

  // ---- scripted intro (pages opt in with data-intro="1..n" + data-intro-act + data-intro-say) ----
  const steps = [...document.querySelectorAll("[data-intro]")].sort((a, b) => a.dataset.intro - b.dataset.intro);
  let introOn = false, introTarget = null;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const visible = (r) => r.width > 0 && r.bottom > 0 && r.top < innerHeight;
  const zigzag = (g) => { // a crayon zigzag under the element, and the cursor rides it
    const r = g.getBoundingClientRect();
    const w = r.width + 20, h = 34, ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "gc-ring"); svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    Object.assign(svg.style, { left: r.left + scrollX - 10 + "px", top: r.bottom + scrollY - 20 + "px", width: w + "px", height: h + "px" });
    let d = "M4 " + h / 2;
    const n = Math.max(6, Math.round(w / 34));
    for (let i = 1; i <= n; i++) d += ` L${(4 + (i * (w - 8)) / n).toFixed(1)} ${i % 2 ? 6 : h - 6}`;
    const p = document.createElementNS(ns, "path"); p.setAttribute("d", d); svg.appendChild(p);
    document.body.appendChild(svg);
    const len = p.getTotalLength();
    p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
    if (ring) ring.remove();
    ring = svg;
    const o = { t: 0 };
    return new Promise((done) => gsap.to(o, { t: 1, duration: 0.6, ease: "none", onUpdate: () => {
      p.style.strokeDashoffset = len * (1 - o.t);
      const pt = p.getPointAtLength(len * o.t), rr = svg.getBoundingClientRect();
      introTarget = () => ({ x: rr.left + pt.x - 6, y: rr.top + pt.y - 4 });
    }, onComplete: done }));
  };
  async function intro() {
    if (!steps.length || scrollY > 60) return;
    introOn = true;
    for (const s of steps) {
      if (!introOn) break;
      const act = s.dataset.introAct, line = s.dataset.introSay || "";
      const r0 = s.getBoundingClientRect();
      if (act === "circle") {
        introTarget = () => { const r = s.getBoundingClientRect(); return { x: r.right - 30, y: r.top + 10 }; };
        await sleep(260); say(line, 1300); circle(s); await sleep(900);
      } else if (act === "zigzag") {
        introTarget = () => { const r = s.getBoundingClientRect(); return { x: r.left - 10, y: r.bottom - 10 }; };
        await sleep(240); say(line, 1600); await zigzag(s); await sleep(250);
      } else if (act === "wander") {
        say(line, 1400);
        for (let i = 0; i < 7 && introOn; i++) {
          const p = { x: gsap.utils.random(innerWidth * 0.1, innerWidth * 0.85), y: gsap.utils.random(innerHeight * 0.2, innerHeight * 0.75) };
          introTarget = () => p; await sleep(210);
        }
      } else if (act === "nudge") {
        const at = () => { const r = s.getBoundingClientRect(); return visible(r) ? { x: r.left + r.width / 2 - 10, y: r.top - 70 } : { x: innerWidth / 2 - 20, y: innerHeight - 170 }; };
        introTarget = at; await sleep(280); say(line, 2600);
        gsap.to(trick, { y: 34, duration: 0.28, repeat: 7, yoyo: true, ease: "power1.inOut" });
        await sleep(1800);
      }
    }
    introOn = false; introTarget = null; active = null;
  }
  addEventListener("scroll", () => { if (introOn && scrollY > 60) { introOn = false; introTarget = null; } }, { passive: true });
  setTimeout(intro, 1200);

  let entered = false, nextTrick = performance.now() + 7000, hop = 0, nextHop = 0;
  gsap.ticker.add(() => {
    const g = introOn ? active : pick();
    if (introOn && introTarget) target = introTarget();
    if (!introOn && g !== active) {
      active = g;
      if (g) {
        say(g.dataset.guide);
        circle(g);
        if (!entered) { entered = true; }
      }
    }
    if (!introOn && active) {
      const r = active.getBoundingClientRect();
      // sit just off the element's top-right corner, pointing in
      // never parks: hops between spots around the element every ~1.6s
      const nowH = performance.now();
      if (nowH > nextHop) { hop++; nextHop = nowH + gsap.utils.random(1200, 2000); }
      const spots = [[1, 0], [0.5, 0], [0, 0.4], [1, 0.6], [0.2, 1], [0.8, 1]];
      const [fx, fy] = spots[hop % spots.length];
      const tx = Math.min(innerWidth - 190, Math.max(20, r.left + r.width * fx - 30));
      const ty = Math.min(innerHeight - 150, Math.max(130, r.top + Math.min(r.height, innerHeight * 0.7) * fy - 20));
      target = { x: tx, y: ty };
    }
    // idle hover bob
    const t = performance.now() / 1000;
    const bob = { x: Math.sin(t * 1.3) * 10, y: Math.sin(t * 2.1) * 8 };
    const gx = target.x + trick.x + dodge.x + bob.x, gy = target.y + trick.y + dodge.y + bob.y;
    // spring (a bit bouncy: it overshoots and settles)
    const K = introOn ? 0.14 : 0.08, D = introOn ? 0.74 : 0.78; // zippier during the intro
    vel.x += (gx - pos.x) * K; vel.y += (gy - pos.y) * K;
    vel.x *= D; vel.y *= D;
    pos.x += vel.x; pos.y += vel.y;
    const speed = Math.hypot(vel.x, vel.y);
    // going fast? obviously say wheee
    if (speed > 22 && !bub.classList.contains("is-on") && performance.now() - lastWhee > 2500 && Math.random() < 0.5) {
      lastWhee = performance.now(); say(gsap.utils.random(WHEE), 1100);
    }
    const tilt = Math.max(-35, Math.min(35, vel.x * 1.6)) + trick.r;
    const stretch = 1 + Math.min(0.35, speed / 70);
    el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    window.homieCursor = { x: pos.x + 8, y: pos.y + 6 }; // so things on the page can watch it
    arrow.style.transform = `rotate(${tilt}deg) scale(${trick.s * stretch}, ${trick.s / Math.sqrt(stretch)})`;
    el.classList.toggle("is-left", pos.x > innerWidth - 300);
    // tricks when you're chilling
    const now = performance.now();
    if (!introOn && now > nextTrick && now - lastMove > 1500) {
      gsap.utils.random(tricks)();
      if (Math.random() < 0.9) say(gsap.utils.random(QUIPS), 1800);
      nextTrick = now + gsap.utils.random(4000, 7000);
    }
  });
})();
