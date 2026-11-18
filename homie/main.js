// homie prototype: stickers slap on, crayon lines draw and "boil", saif talks.
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

gsap.registerPlugin(ScrollTrigger);

// --- crayon boil: swap the wobble seed "on twos" so lines feel hand-animated
if (!reduce) {
  const turb = $$(".boil");
  let seed = 1;
  setInterval(() => {
    if (document.hidden) return;
    seed = (seed % 3) + 1;
    turb.forEach((t) => t.setAttribute("seed", seed));
  }, 140);
}

// --- prepare line draw-on
const drawables = $$(".draw");
drawables.forEach((p) => {
  const len = Math.ceil(p.getTotalLength ? p.getTotalLength() : 600) + 2;
  p.style.strokeDasharray = len;
  p.style.strokeDashoffset = reduce ? 0 : len;
});
const draw = (els, opts = {}) =>
  gsap.to(els, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut", stagger: 0.07, ...opts });

// --- the "slap": stickers land a little big and tilted, then settle with a bounce
const slap = (els, opts = {}) =>
  gsap.from(els, {
    scale: 1.35,
    rotation: () => gsap.utils.random(-12, 12),
    autoAlpha: 0,
    duration: 0.55,
    ease: "back.out(2.6)",
    stagger: 0.08,
    clearProps: "scale,rotation,opacity,visibility",
    ...opts,
  });

// --- saif: hard two-photo swaps while the bubble types (5 swaps/sec, the edits look)
function talk() {
  const t = $(".talker");
  const out = $(".bubble__t");
  const line = out.dataset.say;
  if (reduce) { out.textContent = line; t.classList.add("is-smile"); $(".bubble").classList.add("is-done"); return; }
  let i = 0;
  const swap = setInterval(() => t.classList.toggle("is-open"), 200);
  const type = setInterval(() => {
    out.textContent = line.slice(0, ++i);
    if (i >= line.length) {
      clearInterval(type);
      setTimeout(() => { clearInterval(swap); t.classList.remove("is-open"); t.classList.add("is-smile"); $(".bubble").classList.add("is-done"); }, 260);
    }
  }, 42);
}

// --- "stays HOME." -> FREE. -> LOCAL. -> PRIVATE., once everything has landed
const WORDS = [["HOME.", "var(--blue)"], ["FREE.", "#3fae12"], ["LOCAL.", "var(--orange)"], ["PRIVATE.", "var(--purple)"]];
function cycleWord() {
  const el = $(".w--home");
  let i = 0;
  setInterval(() => {
    if (document.hidden) return;
    i = (i + 1) % WORDS.length;
    el.textContent = WORDS[i][0];
    el.style.color = WORDS[i][1];
    // a fresh sticker slapped on top: lands big and crooked, settles (stop-motion steps)
    gsap.fromTo(el, { scale: 1.22, rotation: gsap.utils.random([-7, -4, 5, 8]) },
      { scale: 1, rotation: gsap.utils.random([-2.5, 1.5, 2.5]), duration: 0.32, ease: "back.out(3)" });
  }, 1000);
}

// --- homie blinks now and then
function blink() {
  // squash the eye shapes themselves (no transforms, so they can never jump off the house)
  const eyes = $$(".eyes ellipse");
  gsap.timeline({ onComplete: () => gsap.delayedCall(gsap.utils.random(2, 5), blink) })
    .set(eyes, { attr: { ry: 1.5 } })
    .set(eyes, { attr: { ry: 10 } }, 0.12);
}

function intro() {
  document.body.classList.remove("is-loading");
  if (reduce) { talk(); return; }

  const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
  tl.add(slap(".nav", { scale: 1, rotation: 0, y: -20, ease: "power3.out", duration: 0.6 }), 0)
    .add(slap(".orb", { scale: 0, ease: "back.out(3)" }), 0.05)
    .add(slap(".hero__hi"), 0.1)
    .add(slap(".h1 .w", { stagger: 0.09 }), 0.2)
    .add(draw($$(".hero__art .draw").filter((p) => !p.classList.contains("x")), { stagger: 0.05 }), 0.35)
    .add(slap(".hero .lede", { rotation: 0, scale: 1.08, duration: 0.5 }), 0.75)
    .add(slap(".chip", { stagger: 0.07 }), 0.95)
    .add(slap(".cta-row", { rotation: -4 }), 1.25)
    .from(".eyes ellipse", { attr: { ry: 0 }, duration: 0.3, ease: "back.out(3)", stagger: 0.05 }, 1.3)
    .from(".dots circle", { attr: { r: 0 }, duration: 0.45, ease: "back.out(3)", stagger: 0.05 }, 1.35)
    .from(".hero .note", { autoAlpha: 0, y: 10, duration: 0.4, stagger: 0.15 }, 1.5)
    // the cloud gets a big red "nah"
    .add(draw($$(".x"), { duration: 0.32, ease: "power3.in", stagger: 0.18 }), 1.85)
    .fromTo(".cloud", { x: 0 }, { x: 6, duration: 0.05, repeat: 5, yoyo: true, ease: "steps(1)" }, 2.25)
    .add(slap(".founder", { rotation: 8, y: 40, scale: 1, ease: "back.out(1.8)", duration: 0.6 }), 1.9)
    .call(cycleWord, null, 0.6) // first swap ~1.6s in, right as the headline finishes landing
    .call(talk, null, 2.5)
    .call(blink, null, 2.8);

  // data dots bob inside the house, on twos
  $$(".dots circle").forEach((c, i) =>
    gsap.to(c, { y: -10 - i * 2, duration: 0.5 + i * 0.07, repeat: -1, yoyo: true, ease: "steps(4)", delay: 2 + i * 0.1 })
  );
  // the cloud drifts, far away, minding its own business
  gsap.to(".cloud", { x: -14, y: 4, duration: 3.2, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 2.6 });

  // why local: headline slaps, cards land one by one, icons draw
  gsap.timeline({ scrollTrigger: { trigger: ".why__head", start: "top 78%" } })
    .add(slap(".why .h2 .w", { stagger: 0.12 }))
    .from(".why__sub", { autoAlpha: 0, y: 12, duration: 0.4 }, 0.3);
  $$(".card").forEach((card, i) => {
    gsap.timeline({ scrollTrigger: { trigger: card, start: "top 85%" } })
      .from(card, { y: 60, rotation: i % 2 ? 7 : -7, autoAlpha: 0, duration: 0.6, ease: "back.out(1.7)", delay: (i % 2) * 0.12, clearProps: "transform,opacity,visibility" })
      .add(draw($$(".draw", card), { duration: 0.5 }), 0.25);
  });
  gsap.timeline({ scrollTrigger: { trigger: ".max-line", start: "top 85%" } })
    .from(".max-line", { autoAlpha: 0, y: 20, duration: 0.5 })
    .add(draw($$(".max-tag .draw"), { duration: 0.8, ease: "power1.inOut" }), 0.2)
    .from(".max-tag b", { scale: 1.6, rotation: -14, duration: 0.45, ease: "back.out(3)" }, 0.5);
}

// wait for the fonts + key images so nothing pops in half-dressed (2.5s cap)
Promise.race([
  Promise.all([
    document.fonts.ready,
    ...$$("img").map((im) => (im.decode ? im.decode().catch(() => {}) : null)),
  ]),
  new Promise((r) => setTimeout(r, 2500)),
]).then(intro);

// --- Pixie's actual eyes, ported from GiantEyesView.swift: 5x6 white pixel silhouette, 2x2 square pupils
// that step in half-pixels toward your cursor, and the same 5-frame blink every 3-6s
(() => {
  const cv = $(".pxeyes");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const W = 222, H = 100; cv.width = W; cv.height = H;
  const P = Math.floor(Math.min(H * 0.72 / 6, W * 0.27 / 5)); // one "pixel"
  const SHAPE = ["01110", "11111", "11111", "11111", "11111", "01110"];
  const BLINK = [3, 1, 1, 3, 6];
  let mouse = { x: innerWidth / 2, y: innerHeight / 2 }, gaze = { x: 0, y: 0 };
  let blinkAt = -1, nextBlink = performance.now() + 2000;
  addEventListener("pointermove", (e) => { mouse = { x: e.clientX, y: e.clientY }; }, { passive: true });
  const draw = (now) => {
    const r = cv.getBoundingClientRect();
    const dx = mouse.x - (r.left + r.width / 2), dy = mouse.y - (r.top + r.height / 2);
    const dist = Math.max(180, Math.hypot(dx, dy));
    gaze.x += (dx / dist - gaze.x) * 0.2; gaze.y += (dy / dist - gaze.y) * 0.2;
    if (!reduce && now >= nextBlink) { blinkAt = now; nextBlink = now + 3000 + Math.random() * 3000; }
    const el = (now - blinkAt) / 1000;
    const rows = el >= 0 && el < 0.225 ? BLINK[Math.min(4, Math.floor(el / 0.045))] : 6;
    const sil = rows === 6 ? SHAPE : Array(rows).fill("11111");
    const pupH = rows === 6 ? 2 * P : P, step = Math.max(1, Math.floor(P / 2));
    const ox = Math.round(gaze.x * 2) * step, oy = rows === 6 ? Math.round(gaze.y * 2) * step : 0;
    const midY = Math.round(H / 2);
    ctx.clearRect(0, 0, W, H);
    for (const c of [W * 0.29, W * 0.71]) {
      const left = Math.round(c - 2.5 * P), top = Math.round(midY - rows * P / 2);
      ctx.fillStyle = "#fff";
      sil.forEach((row, y) => [...row].forEach((cell, x) => { if (cell === "1") ctx.fillRect(left + x * P, top + y * P, P, P); }));
      if (rows > 1) { ctx.fillStyle = "#000"; ctx.fillRect(Math.round(c - P) + ox, Math.round(midY - pupH / 2) + oy, 2 * P, pupH); }
    }
    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
})();
