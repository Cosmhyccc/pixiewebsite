// homie "what's in the house": x-ray hero, one sentence's trip through the house (scrubbed),
// flip-able crew cards, a 4-billion-number brain on canvas, and a sticker wall you can push around.
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
gsap.registerPlugin(ScrollTrigger);

// ---------- shared hand-drawn bits (same language as the home page) ----------
if (!reduce) {
  const turb = $$(".boil");
  let seed = 1;
  setInterval(() => {
    if (document.hidden) return;
    seed = (seed % 3) + 1;
    turb.forEach((t) => t.setAttribute("seed", seed));
  }, 140);
}
$$(".draw, .tdraw, .tx, .cdraw").forEach((p) => {
  const len = Math.ceil(p.getTotalLength ? p.getTotalLength() : 600) + 2;
  p.style.strokeDasharray = p.classList.contains("ln--wire") || p.classList.contains("ln--dash") ? "" : len;
  p.dataset.len = len;
  if (!p.style.strokeDasharray) return; // dotted lines reveal by opacity instead
  p.style.strokeDashoffset = reduce ? 0 : len;
});
const draw = (els, opts = {}) => gsap.to(els, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut", stagger: 0.07, ...opts });
const slap = (els, opts = {}) =>
  gsap.from(els, {
    scale: 1.35, rotation: () => gsap.utils.random(-12, 12), autoAlpha: 0, duration: 0.55,
    ease: "back.out(2.6)", stagger: 0.08, clearProps: "scale,rotation,opacity,visibility", ...opts,
  });
const blinker = (sel) => {
  const eyes = $$(sel);
  const ry = eyes.map((e) => +e.getAttribute("ry"));
  const go = () => gsap.timeline({ onComplete: () => gsap.delayedCall(gsap.utils.random(2, 5), go) })
    .set(eyes, { attr: { ry: 1.5 } })
    .add(() => eyes.forEach((e, i) => e.setAttribute("ry", ry[i])), 0.12);
  if (!reduce) gsap.delayedCall(1.5, go);
};

// ---------- hero: the Mac gets x-rayed and the crew shows up inside ----------
function hero() {
  document.body.classList.remove("is-loading");
  if (reduce) return;
  gsap.set(".xray__pane", { opacity: 0 });
  gsap.set(".xray__lbl", { opacity: 0 });
  gsap.timeline()
    .add(slap(".nav", { scale: 1, rotation: 0, y: -20, ease: "power3.out", duration: 0.6 }), 0)
    .add(slap(".mx-kicker"), 0.1)
    .add(slap(".mx-h1 .w", { stagger: 0.1 }), 0.2)
    .add(draw($$(".xray .draw"), { stagger: 0.12 }), 0.3)
    .add(slap(".mx-hero .lede", { rotation: 0, scale: 1.08, duration: 0.5 }), 0.8)
    .add(slap(".mx-scroll", { rotation: -6 }), 1.1)
    // the scan line sweeps down; the screen turns into an x-ray behind it
    .fromTo(".xray__scan", { y: 0 }, { y: 276, duration: 0.9, ease: "power1.inOut" }, 1.1)
    .to(".xray__pane", { opacity: 1, duration: 0.9, ease: "steps(6)" }, 1.1)
    .from(".crew", { scale: 0, rotation: () => gsap.utils.random(-30, 30), transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(3)", stagger: 0.18 }, 1.6)
    .to(".xray__lbl", { opacity: 1, duration: 0.2, stagger: 0.18, ease: "steps(2)" }, 1.8)
    .to(".xray__scan", { opacity: 0, duration: 0.2 }, 2.05)
    .from(".note--x", { autoAlpha: 0, y: 10, duration: 0.4 }, 2.2);
  // the crew idles: sound waves pulse on twos, the brain bobs
  gsap.to(".crew .wv", { opacity: 0.25, duration: 0.45, repeat: -1, yoyo: true, ease: "steps(3)", stagger: 0.2, delay: 2.4 });
  gsap.to(".crew--brain", { y: "-=6", duration: 0.6, repeat: -1, yoyo: true, ease: "steps(4)", delay: 2.4 });
  blinker(".crew--brain .eye");
}

// ---------- one sentence, start to finish (pinned + scrubbed by scroll) ----------
function trip() {
  const stage = $(".stage");
  const steps = $$(".tstep");
  const zero = $(".trip__zero");
  const STEP_AT = [0, 2.0, 3.6, 4.7]; // timeline seconds where each step begins
  let step = -1;
  const setStep = (i) => {
    if (i === step) return;
    step = i;
    steps.forEach((s, k) => s.classList.toggle("is-on", k === i));
    // the counter gets checked every step... and it's still zero
    if (!reduce) gsap.fromTo(zero, { rotation: -10, scale: 1.4 }, { rotation: 0, scale: 1, duration: 0.4, ease: "back.out(3)" });
    zero.textContent = i === 3 ? "still 0 bytes" : "0 bytes";
  };

  if (reduce) {
    // no scrubbing: show the finished picture
    stage.classList.add("is-dark");
    gsap.set(".stage__night", { opacity: 1 });
    gsap.set(".twords", { opacity: 0.25 });
    steps.forEach((s) => s.classList.add("is-on"));
    return;
  }

  const words = $$(".tw");
  const toks = $$(".ttok");
  gsap.set([...words, ...toks, ".ttool", ".tclock", ".tout", ".tin", ".tcloud__q", ".teyes"], { autoAlpha: 0 });
  gsap.set($$(".tdraw.ln--wire, .tdraw.ln--dash"), { opacity: 0 });

  const tl = gsap.timeline({ defaults: { ease: "none" } });
  // the house draws itself
  tl.to($$(".tdraw").filter((p) => p.style.strokeDasharray), { strokeDashoffset: 0, duration: 0.9, stagger: 0.04, ease: "power1.inOut" }, 0)
    .to($$(".tdraw.ln--wire, .tdraw.ln--dash"), { opacity: 1, duration: 0.3 }, 0.6)
    .to(".teyes", { autoAlpha: 1, duration: 0.1 }, 0.8)
  // 01 ears: your voice comes in, words pop out
    .to(".tin", { autoAlpha: 1, duration: 0.1 }, 0.4);
  $$(".tin__bars rect").forEach((r, i) => {
    tl.fromTo(r, { scaleY: 0.2, transformOrigin: "50% 50%" }, { scaleY: 1, duration: 0.18, repeat: 5, yoyo: true, ease: "steps(2)" }, 0.45 + i * 0.05);
  });
  tl.to(words, { autoAlpha: 1, duration: 0.01, stagger: 0.12 }, 0.75)
    .from(words, { scale: 1.6, rotation: () => gsap.utils.random(-18, 18), transformOrigin: "50% 50%", duration: 0.25, ease: "back.out(3)", stagger: 0.12 }, 0.75)
    .to(".tin", { autoAlpha: 0, duration: 0.2 }, 1.85)
  // 02 brain: words get swallowed, tokens tick out one by one
    // GSAP reads each word's translate() as its x/y, so these are absolute stage coordinates
    .to(words, { x: (i) => 560 + (i % 3) * 8, y: 336,
      scale: 0.15, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.45, ease: "power2.in", stagger: 0.04 }, 2.0)
    .to(".tbrain", { scale: 1.08, transformOrigin: "50% 50%", duration: 0.12, repeat: 5, yoyo: true, ease: "steps(1)" }, 2.4)
    .to(toks, { autoAlpha: 1, duration: 0.01, stagger: 0.14 }, 2.6)
    .from(toks, { y: "-=14", duration: 0.12, stagger: 0.14, ease: "back.out(3)" }, 2.6)
  // 03 hands: two tool stickers slap down, the timer starts, the lights go out
    .to(toks, { autoAlpha: 0.25, duration: 0.2 }, 3.6)
    .to(".ttool--a", { autoAlpha: 1, duration: 0.01 }, 3.65)
    .from(".ttool--a", { scale: 1.6, rotation: -14, transformOrigin: "50% 50%", duration: 0.3, ease: "back.out(3)" }, 3.65)
    .to(".tclock", { autoAlpha: 1, duration: 0.01 }, 3.8)
    .from(".tclock", { scale: 0, transformOrigin: "50% 50%", duration: 0.3, ease: "back.out(3)" }, 3.8)
    .to(".tclock__hand", { rotation: 360, transformOrigin: "50% 100%", duration: 1.6, ease: "steps(12)" }, 4.0)
    .to(".ttool--b", { autoAlpha: 1, duration: 0.01 }, 4.05)
    .from(".ttool--b", { scale: 1.6, rotation: 12, transformOrigin: "50% 50%", duration: 0.3, ease: "back.out(3)" }, 4.05)
    .to(".stage__night", { opacity: 1, duration: 0.3, ease: "steps(3)" }, 4.25)
    // meanwhile the cloud outside gets told no
    .to($$(".tx"), { strokeDashoffset: 0, duration: 0.25, stagger: 0.12, ease: "power3.in" }, 4.3)
    .to(".tcloud__q", { autoAlpha: 1, duration: 0.15 }, 4.5)
  // 04 voice: the reply, out loud
    .to(".tout", { autoAlpha: 1, duration: 0.01 }, 4.75)
    .from(".tout__bub", { scale: 0, transformOrigin: "0% 100%", duration: 0.3, ease: "back.out(2.5)" }, 4.75);
  $$(".tout__bars rect").forEach((r, i) => {
    tl.fromTo(r, { scaleY: 0.25, transformOrigin: "50% 50%" }, { scaleY: 1, duration: 0.16, repeat: 5, yoyo: true, ease: "steps(2)" }, 4.85 + i * 0.05);
  });
  tl.to({}, { duration: 0.5 }); // hold the finished picture before unpinning

  ScrollTrigger.create({
    trigger: ".trip__pin", start: "top top", end: () => "+=" + innerHeight * 3.2, pin: true, scrub: 0.6, animation: tl,
    onUpdate: () => {
      const t = tl.time();
      stage.classList.toggle("is-dark", t >= 4.3);
      let i = 0;
      STEP_AT.forEach((at, k) => { if (t >= at) i = k; });
      setStep(i);
    },
  });
  setStep(0);
  blinker(".teyes ellipse");
}

// ---------- the crew: cards get dealt, tap to flip ----------
function crew() {
  $$(".tcard").forEach((c) => c.addEventListener("click", () => c.classList.toggle("is-flipped")));
  if (reduce) return;
  gsap.timeline({ scrollTrigger: { trigger: ".crew-sec .sec-head", start: "top 80%" } })
    .add(slap(".crew-sec .h2 .w", { stagger: 0.12 }))
    .from(".crew-sec .sec-sub", { autoAlpha: 0, y: 12, duration: 0.4 }, 0.3);
  gsap.timeline({ scrollTrigger: { trigger: ".deck", start: "top 78%" } })
    .from(".tcard", { y: 220, x: (i) => (1.5 - i) * 120, rotation: (i) => (i % 2 ? 24 : -24), autoAlpha: 0, duration: 0.7, ease: "back.out(1.4)", stagger: 0.13, clearProps: "transform,opacity,visibility" })
    .add(draw($$(".cdraw"), { duration: 0.55, stagger: 0.03 }), 0.45);
  // a one-time "hey, these flip" wiggle on the first card
  ScrollTrigger.create({
    trigger: ".deck", start: "top 40%", once: true,
    onEnter: () => gsap.fromTo(".tcard:first-child .tcard__in", { rotationY: 0 }, { rotationY: 26, duration: 0.25, yoyo: true, repeat: 3, ease: "power1.inOut", delay: 0.4, clearProps: "transform" }),
  });
}

// ---------- how big is a brain: 4,000 dots, each a million numbers ----------
function size() {
  const cv = $(".size__cv");
  const ctx = cv.getContext("2d");
  const lines = $$(".size__line");
  const num = $(".size__num");
  const COLS = 80, ROWS = 50, N = COLS * ROWS;
  const PALETTE = ["#1f5cff", "#7b5cf2", "#ff5214", "#8ee04f", "#f4afc0", "#1f1d1a"];
  // dots fill in a random order so it looks like it's "loading"
  const order = gsap.utils.shuffle([...Array(N).keys()]);
  const rank = new Array(N);
  order.forEach((idx, r) => (rank[idx] = r));
  const color = Array.from({ length: N }, (_, i) => PALETTE[(i * 7 + (i % 13)) % PALETTE.length]);
  let W = 0, H = 0, dpr = 1;
  const fit = () => {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height || r.width * 0.68;
    if (!r.height) cv.style.height = H + "px";
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    render(state.p);
  };
  const state = { p: 0 };
  const ease = gsap.parseEase("power3.inOut");
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const fmt = (n) => Math.round(n).toLocaleString("en-US");

  function render(p) {
    if (!W) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const gap = Math.min(W / (COLS + 2), H / (ROWS + 4));
    const ox = (W - gap * (COLS - 1)) / 2, oy = (H - gap * (ROWS - 1)) / 2 - gap;
    const fill = clamp((p - 0.12) / 0.43);                  // 0.12..0.55: dots appear
    const pack = ease(clamp((p - 0.58) / 0.2));               // 0.58..0.78: squish to 4-bit
    const cloud = ease(clamp((p - 0.8) / 0.2));               // 0.80..1.00: the cloud brain dwarfs it
    const shown = p < 0.12 ? 1 : Math.max(1, Math.floor(fill * N));
    // packed target: a tight block bottom-left
    const pg = gap * 0.32, pc = 64;
    const px0 = W * 0.08, py0 = H * 0.8 - pg * Math.ceil(N / pc);

    if (cloud > 0) { // ghost warehouse-scale grid swelling out behind
      const g = gap * (0.9 + cloud * 0.2);
      const reach = cloud * Math.hypot(W, H) * 1.1;
      ctx.fillStyle = "rgba(31,29,26,.13)";
      for (let y = g / 2; y < H; y += g) for (let x = g / 2; x < W; x += g) {
        if (Math.hypot(x - px0, y - H * 0.92) < reach) { ctx.beginPath(); ctx.arc(x, y, g * 0.18, 0, 6.283); ctx.fill(); }
      }
    }
    for (let i = 0; i < N; i++) {
      if (rank[i] >= shown) continue;
      const gx = ox + (i % COLS) * gap, gy = oy + Math.floor(i / COLS) * gap;
      const tx = px0 + (i % pc) * pg, ty = py0 + Math.floor(i / pc) * pg;
      const x = gx + (tx - gx) * pack, y = gy + (ty - gy) * pack;
      let r = gap * 0.36 * (1 - pack * 0.55);
      if (p < 0.12 && i === order[0]) r = gap * (0.36 + 2.6 * (1 - clamp(p / 0.12))); // the first big dot shrinks into place
      ctx.fillStyle = color[i];
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    }
    if (pack > 0.6) { // crayon-ish box + label around the packed brain
      ctx.globalAlpha = clamp((pack - 0.6) / 0.4);
      ctx.strokeStyle = "#1f1d1a"; ctx.lineWidth = 3; ctx.lineJoin = "round";
      const bw = pg * pc + 10, bh = pg * Math.ceil(N / pc) + 10;
      ctx.strokeRect(px0 - 8, py0 - 8, bw, bh);
      ctx.fillStyle = "#1f1d1a"; ctx.font = `400 ${Math.max(16, gap * 1.4)}px "Permanent Marker", cursive`;
      ctx.fillText("2.7 GB · fits on your Mac", px0 - 6, py0 - 18);
      ctx.globalAlpha = 1;
    }
    if (cloud > 0.4) {
      ctx.globalAlpha = clamp((cloud - 0.4) / 0.6);
      ctx.fillStyle = "#e0261b"; ctx.font = `400 ${Math.max(18, gap * 1.7)}px "Permanent Marker", cursive`;
      ctx.textAlign = "right"; ctx.fillText("a cloud brain → needs a warehouse", W - 10, gap * 2.2); ctx.textAlign = "left";
      ctx.globalAlpha = 1;
    }
    num.textContent = fmt(shown * 1e6);
    const li = p < 0.12 ? 0 : p < 0.56 ? 1 : p < 0.79 ? 2 : 3;
    lines.forEach((l, k) => l.classList.toggle("is-on", k === li));
  }

  new ResizeObserver(fit).observe(cv);
  if (reduce) { state.p = 0.7; fit(); return; }
  gsap.to(state, {
    p: 1, ease: "none",
    scrollTrigger: { trigger: ".size__pin", start: "top top", end: () => "+=" + innerHeight * 2.6, pin: true, scrub: 0.5 },
    onUpdate: () => render(state.p),
  });
  gsap.timeline({ scrollTrigger: { trigger: ".size", start: "top 70%" } }).add(slap(".size__h .w", { stagger: 0.1 }));
}

// ---------- the sticker wall: push 'em around ----------
function wall() {
  const wallEl = $(".wall");
  $$(".peel").forEach((el) => {
    let sx = 0, sy = 0, dx = 0, dy = 0, held = false;
    el.addEventListener("pointerdown", (e) => {
      held = true; el.setPointerCapture(e.pointerId); el.classList.add("is-held");
      sx = e.clientX - dx; sy = e.clientY - dy;
      el.style.zIndex = String(10 + (wallEl.dataset.z = +(wallEl.dataset.z || 0) + 1));
    });
    el.addEventListener("pointermove", (e) => {
      if (!held) return;
      dx = e.clientX - sx; dy = e.clientY - sy;
      el.style.translate = `${dx}px ${dy}px`;
    });
    const drop = () => { if (!held) return; held = false; el.classList.remove("is-held"); };
    el.addEventListener("pointerup", drop);
    el.addEventListener("pointercancel", drop);
  });
  if (reduce) return;
  gsap.timeline({ scrollTrigger: { trigger: ".open .sec-head", start: "top 78%" } })
    .add(slap(".open .h2 .w", { stagger: 0.12 }))
    .from(".open__lede", { autoAlpha: 0, y: 14, duration: 0.45 }, 0.35);
  gsap.timeline({ scrollTrigger: { trigger: ".wall", start: "top 75%" } })
    .add(slap(".peel", { stagger: 0.11, scale: 2 }))
    .from(".wall__hint", { autoAlpha: 0, duration: 0.4 }, 1);
  gsap.timeline({ scrollTrigger: { trigger: ".outro", start: "top 80%" } })
    .add(slap([".outro__k", ".outro .cta", ".outro .cta-note"], { stagger: 0.12 }));
  gsap.timeline({ scrollTrigger: { trigger: ".trip .sec-head", start: "top 80%" } })
    .add(slap(".trip .h2 .w", { stagger: 0.12 }))
    .from(".trip .sec-sub", { autoAlpha: 0, y: 12, duration: 0.4 }, 0.3);
}

Promise.race([
  Promise.all([document.fonts.ready, ...$$("img").map((im) => (im.decode ? im.decode().catch(() => {}) : null))]),
  new Promise((r) => setTimeout(r, 2500)),
]).then(() => { hero(); trip(); crew(); size(); wall(); ScrollTrigger.refresh(); });
