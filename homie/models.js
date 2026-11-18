// homie "look inside" sections (on the home page, below why local). Wrapped so it can share the page with main.js.
(() => {
// homie "what's in the house": x-ray hero with homie's eyes, crew cards, an auto-playing tool reel,
// a looping 4-billion-number brain, a live pipeline + terminal, and a sticker wall you can push around.
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
gsap.registerPlugin(ScrollTrigger);

// ---------- shared hand-drawn bits ----------
const prepDraw = (els) => els.forEach((p) => {
  const len = Math.ceil(p.getTotalLength ? p.getTotalLength() : 600) + 2;
  p.style.strokeDasharray = len;
  p.style.strokeDashoffset = reduce ? 0 : len;
});
prepDraw($$(".cdraw"));
const draw = (els, opts = {}) => gsap.to(els, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut", stagger: 0.07, ...opts });
// stickers slap on: land big and crooked, settle with a bounce (scale/rotation in opts are the starting pose)
const slap = (els, opts = {}) => {
  const { scale = 1.35, rotation = () => gsap.utils.random(-12, 12), ...rest } = opts;
  return gsap.fromTo(els, { autoAlpha: 0, scale, rotation }, {
    autoAlpha: 1, scale: 1, rotation: 0, duration: 0.5, ease: "back.out(2.6)", stagger: 0.07,
    clearProps: "scale,rotation,opacity,visibility", ...rest,
  });
};
// visibility via IntersectionObserver: always live, never stale when the page above changes height
const node = (el) => (typeof el === "string" ? $(el) : el);
const onView = (el, fn) => {
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: "0px 0px -6% 0px" });
  io.observe(node(el));
};
const whileVisible = (el, fn) => new IntersectionObserver((es) => es.forEach((e) => fn(e.isIntersecting))).observe(node(el));

// ---------- hero ----------
function hero() {
  // homie's notch: pupils follow your pointer, blinks now and then
  const hn = $(".hn"), hp = $$(".hn .peye b");
  addEventListener("pointermove", (e) => {
    const r = hn.getBoundingClientRect();
    const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 420));
    const dy = Math.max(-1, Math.min(1, (e.clientY - r.bottom) / 320));
    hp.forEach((p) => { p.style.left = 4 + Math.round(dx * 4) + "px"; p.style.top = 5 + Math.round(dy * 5) + "px"; });
  }, { passive: true });
  const blink = () => { hn.classList.add("is-blink"); setTimeout(() => hn.classList.remove("is-blink"), 110); setTimeout(blink, 2200 + Math.random() * 2600); };
  setTimeout(blink, 2500);
  weights();
  if (reduce) return;
  // this section now lives below "why local", so it lands when you scroll to it
  gsap.set([".mx-kicker", ".mx-h1 .w", ".bigmac", ".mx-hero .lede", ".mx-hero .note"], { autoAlpha: 0 });
  onView(".mx-hero", () => gsap.timeline()
    .add(slap(".mx-kicker"), 0.1)
    .add(slap(".mx-h1 .w", { stagger: 0.09 }), 0.2)
    .fromTo(".bigmac", { y: 80, rotation: 10, autoAlpha: 0 }, { y: 0, rotation: 0, autoAlpha: 1, duration: 0.6, ease: "back.out(1.6)", clearProps: "transform" }, 0.3)
    .add(slap(".mx-hero .lede", { rotation: 0, scale: 1.08, duration: 0.5 }), 0.7)
    .from(".hn", { y: -30, duration: 0.4, ease: "back.out(2)" }, 0.9)
    .fromTo(".mx-hero .note", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.2 }, 1.4));
}

// ---------- hero screen: the actual model, running. 4-bit weights shimmer as a pass sweeps through,
// GGUF tensors load, and next-token probabilities pick a reply word by word ----------
function weights() {
  const cv = $(".wcv"), ctx = cv.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  const fit = () => {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  };
  new ResizeObserver(fit).observe(cv); fit();

  const COLS = 34, ROWS = 22;
  const seed = Array.from({ length: COLS * ROWS }, (_, i) => Math.sin(i * 12.9898) * 43758.5453 % 1);
  const TENSORS = ["token_embd.weight", "attn_q.weight", "attn_k.weight", "attn_v.weight", "attn_output.weight", "ffn_gate.weight", "ffn_up.weight", "ffn_down.weight", "attn_norm.weight"];
  // the reply homie "writes", with the runner-up guesses it didn't pick
  const STEPS = [
    ["sure", ["ok", "yes", "on"]], ["!", [",", ".", " —"]], [" starting", [" setting", " making", " start"]],
    [" a", [" your", " the", " one"]], [" 10", [" ten", " 1", " 15"]], [" minute", ["-min", " min", " sec"]],
    [" timer", [" alarm", " clock", " count"]], [".", ["!", " now", " for"]],
  ];
  const lerp = (a, b, t) => a + (b - a) * t;
  // 4-bit palette: 16 levels from blue through ink to orange
  const LV = Array.from({ length: 16 }, (_, k) => {
    const t = k / 15;
    const c = t < 0.5 ? [lerp(31, 26, t * 2), lerp(92, 34, t * 2), lerp(255, 64, t * 2)] : [lerp(26, 255, (t - 0.5) * 2), lerp(34, 82, (t - 0.5) * 2), lerp(64, 20, (t - 0.5) * 2)];
    return `rgb(${c.map(Math.round).join(",")})`;
  });
  let layer = 0, tensorLog = [], tok = 0, out = "", lastTok = 0, lastTensor = 0;

  const frame = (now) => {
    const t = now / 1000;
    if (!W) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, W, H);
    const fs = Math.max(7.5, W / 46), mono = `600 ${fs}px ui-monospace, Menlo, monospace`;
    const top = H * 0.17, padX = W * 0.045;

    // header
    ctx.font = mono; ctx.fillStyle = "#8ee04f";
    ctx.fillText("Qwen3.5-4B · Q4_K_M · 4.0B weights", padX, top - fs * 0.6);

    // weight matrix (left): each cell is a 4-bit level; a matmul pass sweeps across
    const gx = padX, gy = top + fs * 0.4, gw = W * 0.5, gh = H * 0.6;
    const cw = gw / COLS, ch = gh / ROWS;
    const sweep = (t * 0.55) % 1.25 - 0.1;
    if (sweep < 0 && lastTensor !== -1) { layer = (layer + 1) % 36; lastTensor = -1; }
    if (sweep > 0) lastTensor = 0;
    for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
      const s = seed[j * COLS + i];
      let v = 0.5 + 0.32 * Math.sin(i * 0.55 + j * 0.31 + layer * 1.7 + s * 6) * Math.cos(j * 0.4 - t * 0.8 + s * 3) + (s - 0.5) * 0.3;
      const near = Math.max(0, 1 - Math.abs(i / COLS - sweep) * 9);
      v = Math.min(0.999, Math.max(0, v + near * 0.25 * Math.sin(t * 9 + i)));
      ctx.fillStyle = LV[Math.floor(v * 16)];
      ctx.fillRect(gx + i * cw + 0.6, gy + j * ch + 0.6, cw - 1.2, ch - 1.2);
      if (near > 0.6) { ctx.fillStyle = `rgba(142,224,79,${(near - 0.6) * 0.9})`; ctx.fillRect(gx + i * cw, gy + j * ch, cw, ch); }
    }
    ctx.fillStyle = "#c9c2b2"; ctx.font = `500 ${fs * 0.92}px ui-monospace, Menlo, monospace`;
    ctx.fillText(`blk.${layer}.${TENSORS[1 + (layer % 7)]}  ·  4-bit`, gx, gy + gh + fs * 1.3);

    // tensor log (right top)
    if (now - lastTensor > 0 && Math.random() < 0.06) {
      tensorLog.push(`✓ blk.${Math.floor(Math.random() * 36)}.${TENSORS[Math.floor(Math.random() * TENSORS.length)]}`);
      if (tensorLog.length > 4) tensorLog.shift();
    }
    const rx = W * 0.58, rw = W * 0.38;
    ctx.font = `500 ${fs * 0.86}px ui-monospace, Menlo, monospace`;
    tensorLog.forEach((l, k) => { ctx.fillStyle = `rgba(201,194,178,${0.35 + k * 0.17})`; ctx.fillText(l.slice(0, 26), rx, top + fs * 0.4 + k * fs * 1.25); });

    // next-token probabilities (right bottom)
    if (now - lastTok > 520) {
      lastTok = now; tok++;
      if (tok > STEPS.length + 4) { tok = 0; out = ""; }
      else if (tok <= STEPS.length) out += STEPS[tok - 1][0];
    }
    const step = STEPS[Math.min(tok, STEPS.length - 1)];
    const cands = [step[0], ...step[1]], phase = Math.min(1, (now - lastTok) / 260);
    const probs = [0.62, 0.19, 0.11, 0.05];
    const by = top + fs * 6.2;
    ctx.font = mono; ctx.fillStyle = "#f4afc0"; ctx.fillText("next token?", rx, by);
    cands.forEach((c, k) => {
      const y = by + fs * 0.9 + k * fs * 1.45, bw = rw * 0.62 * probs[k] / 0.62 * phase;
      ctx.fillStyle = k === 0 ? "#8ee04f" : "rgba(246,239,224,.22)";
      ctx.fillRect(rx + rw * 0.36, y, bw, fs * 0.95);
      ctx.fillStyle = k === 0 ? "#f6efe0" : "rgba(246,239,224,.55)";
      ctx.font = `600 ${fs * 0.95}px ui-monospace, Menlo, monospace`;
      ctx.fillText(JSON.stringify(c.trim() || c).slice(0, 9), rx, y + fs * 0.85);
    });

    // the reply so far
    ctx.font = `600 ${fs * 1.05}px ui-monospace, Menlo, monospace`;
    ctx.fillStyle = "#f6efe0";
    const blinkOn = Math.floor(t * 2) % 2 === 0;
    ctx.fillText("> " + out + (blinkOn ? "▌" : ""), padX, H * 0.93);
    ctx.fillStyle = "#8ee04f"; ctx.font = `500 ${fs * 0.85}px ui-monospace, Menlo, monospace`;
    if (W > 420) { ctx.textAlign = "right"; ctx.fillText("~15 tok/s · 0 bytes uploaded", W - padX, H * 0.93); ctx.textAlign = "left"; }
  };
  if (reduce) { requestAnimationFrame((n) => frame(n + 4000)); return; }
  let on = true;
  whileVisible(".mx-hero", (v) => (on = v));
  const loop = (n) => { if (on && !document.hidden) frame(n); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}

// ---------- the scroll nudge leaves once you've started scrolling ----------
function nudge() {
  const n = $(".nudge");
  let ready = false;
  const upd = () => n.classList.toggle("is-gone", !ready || scrollY > 140);
  addEventListener("scroll", upd, { passive: true });
  upd();
  setTimeout(() => { ready = true; upd(); }, reduce ? 0 : 1300); // pops up once the hero has landed
}

// ---------- the crew: dealt early and fast, tap to flip ----------
function crew() {
  const cards = $$(".tcard");
  let held = 0; // a tap takes over for a few seconds
  cards.forEach((c) => c.addEventListener("click", () => { c.classList.toggle("is-flipped"); held = performance.now() + 6000; }));
  if (reduce) return;
  // auto-flip: front, back, front... one card after another, quick
  let k = 0, flipping = null;
  const flipNext = () => {
    if (performance.now() < held || document.hidden) return;
    const c = cards[k % cards.length];
    c.classList.toggle("is-flipped");
    gsap.fromTo(c, { y: 0 }, { y: -14, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" });
    k++;
  };
  whileVisible(".deck", (v) => { clearInterval(flipping); if (v) flipping = setInterval(flipNext, 650); });
  gsap.set(".tcard", { autoAlpha: 0 });
  onView(".crew-sec", () => {
    gsap.timeline()
      .add(slap(".crew-sec .h2 .w", { stagger: 0.08, duration: 0.4 }))
      .from(".crew-sec .sec-sub", { autoAlpha: 0, y: 12, duration: 0.3 }, 0.2)
      .fromTo(".tcard", { y: 160, x: (i) => (1.5 - i) * 100, rotation: (i) => (i % 2 ? 22 : -22), autoAlpha: 0 },
        { y: 0, x: 0, rotation: 0, autoAlpha: 1, duration: 0.5, ease: "back.out(1.5)", stagger: 0.08, clearProps: "transform" }, 0.1)
      .add(draw($$(".cdraw"), { duration: 0.45, stagger: 0.02 }), 0.4)
;
  });
}

// ---------- the tool reel: four little re-enactments on a Mac screen, auto-advancing ----------
function reel() {
  const stg = $(".stg");
  const notch = $(".notch2");
  const pupils = $$(".peye b");
  const cur = $(".hcursor");
  const bub = $(".hbub"), bubT = $(".hbub__t");
  const said = $(".said"), saidT = $(".said__t");
  const tag = $(".mode-tag");
  const demos = $$(".demo");
  const tabs = $$(".rtab");
  const NOTCH = { x: 470, y: -20 };
  let curPos = { x: NOTCH.x, y: NOTCH.y };

  const look = (x, y) => { // pupils glance toward a stage point
    const dx = Math.max(-1, Math.min(1, (x - 480) / 300)), dy = Math.max(-1, Math.min(1, (y + 20) / 300));
    pupils.forEach((p) => { p.style.left = 8 + Math.round(dx * 7) + "px"; p.style.top = 10 + Math.round(dy * 8) + "px"; });
  };
  const placeCur = () => { gsap.set(cur, { x: curPos.x, y: curPos.y }); look(curPos.x, curPos.y); };
  // the cursor flies in a little arc, like it's excited
  const fly = (tl, at, x, y, d = 0.7) => {
    const from = {};
    tl.add(() => { from.x = curPos.x; from.y = curPos.y; }, at);
    const o = { t: 0 };
    tl.fromTo(o, { t: 0 }, { t: 1, duration: d, ease: "power2.inOut", onUpdate: () => {
      const t = o.t, mx = (from.x + x) / 2, my = Math.min(from.y, y) - 80;
      curPos.x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * mx + t * t * x;
      curPos.y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * my + t * t * y;
      placeCur();
    } }, at);
  };
  const click = (tl, at) => tl.to(cur, { scale: 0.8, duration: 0.08, yoyo: true, repeat: 1, transformOrigin: "10% 10%" }, at);
  const typeInto = (tl, at, el, text, per = 0.045) => {
    const o = { n: 0 };
    tl.fromTo(o, { n: 0 }, { n: text.length, duration: text.length * per, ease: "none", onUpdate: () => (el.textContent = text.slice(0, Math.round(o.n))) }, at);
  };
  const say = (tl, at, text) => { // homie talks: bubble types, notch glows
    tl.add(() => { bub.classList.add("is-on"); notch.classList.add("is-talk"); }, at);
    typeInto(tl, at, bubT, text, 0.03);
  };
  const you = (tl, at, text) => {
    tl.add(() => said.classList.add("is-on"), at);
    typeInto(tl, at, saidT, "“" + text + "”", 0.05);
    tl.add(() => said.classList.remove("is-on"), at + text.length * 0.05 + 0.6);
  };
  const reset = () => {
    bub.classList.remove("is-on"); notch.classList.remove("is-talk"); said.classList.remove("is-on");
    bubT.textContent = ""; saidT.textContent = ""; stg.classList.remove("is-dark");
    curPos = { x: NOTCH.x, y: NOTCH.y }; placeCur();
  };

  // A. music: voice -> Apple Music -> playing, with a stopwatch
  function music() {
    const d = $(".d-music");
    const rows = $$(".mu__rows li", d), q = $(".mu__q", d), sw = $(".stopwatch__n", d);
    const tl = gsap.timeline();
    tl.set(rows, { autoAlpha: 0 }).set(rows[0], { className: "" }).set(".mu__now", { yPercent: 110 }).add(() => (q.textContent = "")).set(".win--music", { autoAlpha: 0, scale: 0.9 });
    const clock = { s: 0 };
    tl.fromTo(clock, { s: 0 }, { s: 4.2, duration: 4.2, ease: "none", onUpdate: () => (sw.textContent = clock.s.toFixed(1)) }, 0.2);
    you(tl, 0.2, "play billie jean");
    tl.to(".win--music", { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }, 1.4);
    typeInto(tl, 1.8, q, "billie jean", 0.05);
    tl.to(rows, { autoAlpha: 1, duration: 0.01, stagger: 0.08 }, 2.4);
    fly(tl, 2.5, 270, 220, 0.8);
    click(tl, 3.35);
    tl.add(() => rows[0].classList.add("is-hit"), 3.4)
      .to(".mu__now", { yPercent: 0, duration: 0.35, ease: "back.out(2)" }, 3.6)
      .fromTo(".mu__eq i", { scaleY: 0.2 }, { scaleY: 1, duration: 0.2, repeat: 15, yoyo: true, ease: "steps(3)", stagger: 0.06 }, 3.9)
      .fromTo(".stopwatch", { scale: 1.5, rotation: -14 }, { scale: 1, rotation: -4, duration: 0.35, ease: "back.out(3)" }, 4.4);
    say(tl, 4.3, "playing billie jean. 4 seconds, no cloud.");
    fly(tl, 5.2, 820, 420, 0.9);
    tl.to({}, { duration: 1.6 });
    return tl;
  }

  // B. draws it out: the board opens and homie's cursor traces each stroke
  function drawIt() {
    const strokes = $$(".bst"), labels = $$(".bt");
    prepDraw(strokes);
    const tl = gsap.timeline();
    tl.set(".board", { autoAlpha: 0, scale: 0.92 }).set(labels, { autoAlpha: 0 }).set(strokes, { strokeDashoffset: (i, el) => el.style.strokeDasharray });
    you(tl, 0.2, "how does a heart pump?");
    tl.to(".board", { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }, 1.6);
    say(tl, 1.8, "ok so blood comes in up top, then the heart squeezes it out…");
    let at = 2.2;
    tl.to(labels[3], { autoAlpha: 1, duration: 0.2 }, at);
    strokes.forEach((p, i) => {
      const len = +p.style.strokeDasharray, dur = Math.min(1.1, 0.25 + len / 900);
      const o = { t: 0 };
      fly(tl, at, 170 + p.getPointAtLength(0).x, 92 + p.getPointAtLength(0).y, 0.3);
      tl.fromTo(o, { t: 0 }, { t: 1, duration: dur, ease: "power1.inOut", onUpdate: () => {
        p.style.strokeDashoffset = len * (1 - o.t);
        const pt = p.getPointAtLength(len * o.t);
        curPos.x = 170 + pt.x; curPos.y = 92 + pt.y; placeCur();
      } }, at + 0.3);
      at += 0.3 + dur;
      if (i === 2) tl.to(labels[0], { autoAlpha: 1, duration: 0.2 }, at);
      if (i === 3) tl.to(labels[1], { autoAlpha: 1, duration: 0.2 }, at);
      if (i === 4) tl.to(labels[2], { autoAlpha: 1, duration: 0.2 }, at);
    });
    fly(tl, at + 0.1, 860, 470, 0.8);
    tl.to({}, { duration: 1.4 });
    return tl;
  }

  // C. circle + ask: you circle a word, homie explains it
  function circle() {
    const hit = $(".web__hit"), ring = $(".web__ring"), rp = $(".web__ring path"), uc = $(".ucursor");
    prepDraw([rp]);
    const len = +rp.style.strokeDasharray;
    const tl = gsap.timeline();
    tl.set(".win--web", { autoAlpha: 0, y: 20 }).add(() => hit.classList.remove("is-lit")).set(rp, { strokeDashoffset: len });
    tl.to(".win--web", { autoAlpha: 1, y: 0, duration: 0.35, ease: "back.out(2)" }, 0.1);
    // position the ring + your (black) cursor over the word, measured in stage units
    tl.add(() => {
      const w = $(".win--web").getBoundingClientRect(), h = hit.getBoundingClientRect();
      const k = w.width / 660;
      const x = (h.left - w.left) / k, y = (h.top - w.top) / k;
      gsap.set(ring, { x: x - 30, y: y - 22 });
      uc.dataset.x = 150 + x - 20; uc.dataset.y = 92 + y + 20;
      gsap.set(uc, { x: 700, y: 520, autoAlpha: 1 });
    }, 0.5);
    tl.to(uc, { x: () => +uc.dataset.x, y: () => +uc.dataset.y, duration: 0.6, ease: "power2.inOut" }, 0.6);
    const o = { t: 0 };
    tl.fromTo(o, { t: 0 }, { t: 1, duration: 0.9, ease: "power1.inOut", onUpdate: () => {
      rp.style.strokeDashoffset = len * (1 - o.t);
      const pt = rp.getPointAtLength(len * o.t);
      const r = gsap.getProperty(ring, "x"), s = gsap.getProperty(ring, "y");
      gsap.set(uc, { x: 150 + r + pt.x * (190 / 220), y: 92 + s + pt.y * (78 / 90) });
    } }, 1.3);
    you(tl, 1.4, "what's this?");
    tl.add(() => hit.classList.add("is-lit"), 2.4);
    tl.add(() => { const t = gsap.getProperty(ring, "x"), u = gsap.getProperty(ring, "y"); tl.vars.target = { x: 150 + t + 160, y: 92 + u + 10 }; }, 2.5);
    fly(tl, 2.6, 520, 250, 0.8);
    say(tl, 2.8, "chlorophyll! the green stuff in leaves. it catches sunlight so the plant can make sugar.");
    tl.to(uc, { autoAlpha: 0, duration: 0.3 }, 3.2);
    tl.to({}, { duration: 2.8 });
    return tl;
  }

  // D. runs your Mac: windows tile, dark mode, timer, volume
  function mac() {
    const calls = $$(".calls li");
    const tl = gsap.timeline();
    tl.set([".win--a", ".win--b", ".win--c"], { clearProps: "all" }).set(calls, { autoAlpha: 0 }).set(".hud", { autoAlpha: 0 }).set(".hud--vol span i", { width: "80%" });
    tl.from([".win--a", ".win--b", ".win--c"], { autoAlpha: 0, scale: 0.9, duration: 0.3, stagger: 0.08, ease: "back.out(2)" }, 0.1);
    you(tl, 0.4, "notes + safari side by side, dark mode, pasta timer");
    fly(tl, 3.0, 250, 140, 0.6);
    click(tl, 3.6);
    tl.to(calls[0], { autoAlpha: 1, duration: 0.01 }, 3.6)
      .to(".win--a", { left: 24, top: 46, width: 450, height: 500, duration: 0.5, ease: "power3.inOut" }, 3.7)
      .to(".win--b", { left: 486, top: 46, width: 450, height: 500, duration: 0.5, ease: "power3.inOut" }, 3.75)
      .to(".win--c", { autoAlpha: 0, scale: 0.6, duration: 0.3 }, 3.7);
    fly(tl, 4.2, 700, 300, 0.5);
    tl.to(calls[1], { autoAlpha: 1, duration: 0.01 }, 4.6).add(() => stg.classList.add("is-dark"), 4.7)
      .to(calls[2], { autoAlpha: 1, duration: 0.01 }, 5.1)
      .fromTo(".hud--timer", { autoAlpha: 0, scale: 1.5 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: "back.out(3)" }, 5.1);
    const tm = { s: 600 };
    tl.to(tm, { s: 596, duration: 3, ease: "steps(4)", onUpdate: () => ($(".hud__n").textContent = `${Math.floor(tm.s / 60)}:${String(Math.round(tm.s % 60)).padStart(2, "0")}`) }, 5.3);
    tl.to(calls[3], { autoAlpha: 1, duration: 0.01 }, 5.6)
      .to(".hud--vol", { autoAlpha: 1, duration: 0.15 }, 5.6)
      .to(".hud--vol span i", { width: "40%", duration: 0.6, ease: "steps(6)" }, 5.7)
      .to(".hud--vol", { autoAlpha: 0, duration: 0.3 }, 6.8);
    say(tl, 6.0, "done. four things, one breath.");
    fly(tl, 6.2, 860, 520, 0.8);
    tl.to({}, { duration: 1.8 });
    return tl;
  }

  const builders = [music, drawIt, circle, mac];
  const TAGS = [["works in homie", false], ["homie max", true], ["homie max", true], ["works in homie", false]];
  let idx = 0, tl = null, bar = null, running = false;
  const play = (i) => {
    idx = i;
    tl && tl.kill(); bar && bar.kill();
    reset();
    demos.forEach((d, k) => d.classList.toggle("is-on", k === i));
    tabs.forEach((t, k) => { t.classList.toggle("is-on", k === i); t.setAttribute("aria-selected", k === i); gsap.set($("i", t), { width: k < i ? "100%" : "0%" }); });
    tag.textContent = TAGS[i][0]; tag.classList.toggle("is-max", TAGS[i][1]);
    tl = builders[i]();
    bar = gsap.fromTo($(".rtab__bar i", tabs[i]), { width: "0%" }, { width: "100%", duration: tl.duration(), ease: "none" });
    tl.eventCallback("onComplete", () => play((idx + 1) % builders.length));
    if (!running) { tl.pause(); bar.pause(); }
  };
  tabs.forEach((t, k) => t.addEventListener("click", () => { running = true; play(k); }));
  // blink the notch now and then
  const blink = () => { notch.classList.add("is-blink"); setTimeout(() => notch.classList.remove("is-blink"), 110); setTimeout(blink, 2200 + Math.random() * 2500); };
  if (reduce) { play(0); tl.progress(1); return; }
  blink();
  play(0);
  whileVisible(".mac2", (v) => { running = v; if (v) { tl.play(); bar.play(); } else { tl.pause(); bar.pause(); } });
  onView(".tools", () => gsap.timeline().add(slap(".tools .h2 .w", { stagger: 0.08 })).from(".tools .sec-sub", { autoAlpha: 0, duration: 0.3 }, 0.2));
}

// ---------- how big is a brain: plays on its own, loops ----------
function size() {
  const cv = $(".size__cv");
  const ctx = cv.getContext("2d");
  const lines = $$(".size__line");
  const num = $(".size__num");
  const COLS = 80, ROWS = 50, N = COLS * ROWS;
  const PALETTE = ["#1f5cff", "#7b5cf2", "#ff5214", "#8ee04f", "#f4afc0", "#1f1d1a"];
  const order = gsap.utils.shuffle([...Array(N).keys()]);
  const rank = new Array(N);
  order.forEach((idx, r) => (rank[idx] = r));
  const color = Array.from({ length: N }, (_, i) => PALETTE[(i * 7 + (i % 13)) % PALETTE.length]);
  let W = 0, H = 0, dpr = 1;
  const state = { p: 0 };
  const ease = gsap.parseEase("power3.inOut");
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const fit = () => {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height || r.width * 0.68;
    if (!r.height) cv.style.height = H + "px";
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    render(state.p);
  };
  function render(p) {
    if (!W) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const gap = Math.min(W / (COLS + 2), H / (ROWS + 4));
    const ox = (W - gap * (COLS - 1)) / 2, oy = (H - gap * (ROWS - 1)) / 2 - gap;
    const fill = clamp((p - 0.06) / 0.4);
    const pack = ease(clamp((p - 0.52) / 0.18));
    const cloud = ease(clamp((p - 0.74) / 0.16));
    const shown = p < 0.06 ? 1 : Math.max(1, Math.floor(fill * N));
    const pg = gap * 0.32, pc = 64;
    const px0 = W * 0.08, py0 = H * 0.8 - pg * Math.ceil(N / pc);
    if (cloud > 0) {
      const g = gap * (0.9 + cloud * 0.2), reach = cloud * Math.hypot(W, H) * 1.1;
      ctx.fillStyle = "rgba(31,29,26,.13)";
      for (let y = g / 2; y < H; y += g) for (let x = g / 2; x < W; x += g)
        if (Math.hypot(x - px0, y - H * 0.8) < reach) { ctx.beginPath(); ctx.arc(x, y, g * 0.18, 0, 6.283); ctx.fill(); }
    }
    for (let i = 0; i < N; i++) {
      if (rank[i] >= shown) continue;
      const gx = ox + (i % COLS) * gap, gy = oy + Math.floor(i / COLS) * gap;
      const tx = px0 + (i % pc) * pg, ty = py0 + Math.floor(i / pc) * pg;
      const x = gx + (tx - gx) * pack, y = gy + (ty - gy) * pack;
      let r = gap * 0.36 * (1 - pack * 0.55);
      if (p < 0.06 && i === order[0]) r = gap * (0.36 + 2.6 * (1 - clamp(p / 0.06)));
      ctx.fillStyle = color[i];
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    }
    if (pack > 0.6) {
      ctx.globalAlpha = clamp((pack - 0.6) / 0.4);
      ctx.strokeStyle = "#1f1d1a"; ctx.lineWidth = 3;
      ctx.strokeRect(px0 - 8, py0 - 8, pg * pc + 10, pg * Math.ceil(N / pc) + 10);
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
    const li = p < 0.06 ? 0 : p < 0.5 ? 1 : p < 0.73 ? 2 : 3;
    lines.forEach((l, k) => l.classList.toggle("is-on", k === li));
  }
  new ResizeObserver(fit).observe(cv);
  if (reduce) { state.p = 0.7; fit(); return; }
  // ~12s loop with holds on each idea; starts the moment it peeks into view, pauses off-screen
  const loop = gsap.timeline({ repeat: -1, repeatDelay: 1.2, paused: true, onUpdate: () => render(state.p) })
    .fromTo(state, { p: 0 }, { p: 0.06, duration: 0.8, ease: "power2.out" })
    .to(state, { p: 0.46, duration: 3.2, ease: "power1.in" })
    .to(state, { p: 0.46, duration: 0.9 })
    .to(state, { p: 0.7, duration: 1.6, ease: "none" })
    .to(state, { p: 0.7, duration: 1.4 })
    .to(state, { p: 0.9, duration: 1.4, ease: "none" })
    .to(state, { p: 1, duration: 2.2 });
  whileVisible(".size__viz", (v) => (v ? loop.play() : loop.pause()));
  onView(".size", () => slap(".size__h .w", { stagger: 0.08 }));
}

// ---------- under the hood: packets flow forever, specs count up, terminal types ----------
function hood() {
  const NS = "http://www.w3.org/2000/svg";
  const P = (id) => document.getElementById(id);
  const phone = matchMedia("(max-width: 700px)");
  // the wide diagram on desktop, the tall one on phones
  const routes = () => {
    const k = phone.matches ? "pv" : "pw";
    return { g: $(phone.matches ? ".packets--v" : ".packets:not(.packets--v)"),
      brain: [1, 2, 3, 4, 6].map((n) => P(k + n)), fast: [1, 2, 5, 6].map((n) => P(k + n)) };
  };
  const COLORS = ["#1f5cff", "#7b5cf2", "#8ee04f", "#ff5214", "#f4afc0"];
  const spawn = (route, color, speed, g) => {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("r", 9); c.setAttribute("fill", color); g.appendChild(c);
    const lens = route.map((p) => p.getTotalLength()), total = lens.reduce((a, b) => a + b, 0);
    const o = { d: 0 };
    gsap.to(o, { d: total, duration: total / speed, ease: "none", onComplete: () => c.remove(), onUpdate: () => {
      let d = o.d, k = 0;
      while (k < lens.length - 1 && d > lens[k]) { d -= lens[k]; k++; }
      const pt = route[k].getPointAtLength(Math.min(d, lens[k]));
      c.setAttribute("cx", pt.x); c.setAttribute("cy", pt.y);
    } });
  };
  let n = 0, timer = null;
  const tick = () => { // every other packet takes the instant lane, and it's faster
    const fast = n % 2 === 0;
    const r = routes();
    spawn(fast ? r.fast : r.brain, COLORS[n % COLORS.length], fast ? 420 : 240, r.g);
    n++;
  };
  whileVisible(".pipe", (v) => { clearInterval(timer); if (v && !reduce) { tick(); timer = setInterval(() => !document.hidden && tick(), 700); } });

  const specs = $$(".spec b");
  const showSpecs = () => specs.forEach((b) => {
    const to = +b.dataset.to, pre = b.dataset.pre || "", suf = b.dataset.suf || "";
    const o = { v: 0 };
    if (reduce) { b.textContent = pre + to.toLocaleString("en-US") + suf; return; }
    gsap.to(o, { v: to, duration: 1.4, ease: "power2.out", onUpdate: () => (b.textContent = pre + Math.round(o.v).toLocaleString("en-US") + suf) });
  });
  onView(".specs", () => { showSpecs(); if (!reduce) slap(".spec", { stagger: 0.06 }); });
  onView(".hood", () => !reduce && slap(".hood .h2 .w", { stagger: 0.1 }));

  // terminal: what booting homie's brain + voice looks like (typed, looping)
  const out = $(".term__out");
  const LINES = [
    ["$ ", "llama-server -m Qwen3.5-4B-Q4_K_M.gguf -c 12288 --host 127.0.0.1", "p"],
    ["", "  loaded 4.0B params · 2.7 GB · Metal GPU", "d"],
    ["", "  ✓ toolbox prompt cached (5,019 tokens)", "g"],
    ["$ ", "PixieVoice --engine ane --voice af_heart", "p"],
    ["", "  ✓ Kokoro 82M on the Neural Engine · ~100 ms/phrase", "g"],
    ["$ ", "homie listen --on-device", "p"],
    ["", "  > \"set a 10 minute timer\"", "o"],
    ["", "  ⚡ instant lane · no model needed · done", "g"],
    ["", "  > \"what should i cook with eggs and spinach?\"", "o"],
    ["", "  brain · 15 tok/s · speaking while it thinks…", "d"],
    ["", "  bytes sent to the internet: 0", "g"],
  ];
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  if (reduce) { out.innerHTML = LINES.map(([a, b, c]) => `<span class="${c}">${esc(a + b)}</span>`).join("\n"); return; }
  let li = 0, ci = 0, html = "", typing = false;
  const step = () => {
    if (li >= LINES.length) { setTimeout(() => { li = 0; ci = 0; html = ""; step(); }, 2600); return; }
    const [pre, txt, cls] = LINES[li];
    const isCmd = pre === "$ ";
    ci += isCmd ? 2 : txt.length; // commands type out, output lands in one go
    const part = esc(pre + txt.slice(0, ci));
    out.innerHTML = html + `<span class="${cls}">${part}</span><span class="cur"></span>`;
    if (ci >= txt.length) { html += `<span class="${cls}">${esc(pre + txt)}</span>\n`; li++; ci = 0; setTimeout(step, isCmd ? 380 : 260); }
    else setTimeout(step, 28);
  };
  onView(".term", () => { if (!typing) { typing = true; step(); } });
}

// ---------- sticker wall ----------
function wall() {
  const wallEl = $(".wall");
  $$(".peel").forEach((el) => {
    let sx = 0, sy = 0, dx = 0, dy = 0, held = false;
    el.addEventListener("pointerdown", (e) => {
      held = true; el.setPointerCapture(e.pointerId); el.classList.add("is-held");
      sx = e.clientX - dx; sy = e.clientY - dy;
      el.style.zIndex = String(10 + (wallEl.dataset.z = +(wallEl.dataset.z || 0) + 1));
    });
    el.addEventListener("pointermove", (e) => { if (!held) return; dx = e.clientX - sx; dy = e.clientY - sy; el.style.translate = `${dx}px ${dy}px`; });
    const drop = () => { if (!held) return; held = false; el.classList.remove("is-held"); };
    el.addEventListener("pointerup", drop); el.addEventListener("pointercancel", drop);
  });
  if (reduce) return;
  onView(".open", () => gsap.timeline().add(slap(".open .h2 .w", { stagger: 0.1 })).from(".open__lede", { autoAlpha: 0, y: 14, duration: 0.4 }, 0.3));
  onView(".wall", () => gsap.timeline().add(slap(".peel", { stagger: 0.08, scale: 2 })).from(".wall__hint", { autoAlpha: 0, duration: 0.4 }, 0.8));
  onView(".outro", () => slap([".outro .cta", ".outro .cta-note", ".outro .discord"], { stagger: 0.1 }));
}

Promise.race([
  Promise.all([document.fonts.ready, ...$$("img:not([loading=lazy])").map((im) => (im.decode ? im.decode().catch(() => {}) : null))]),
  new Promise((r) => setTimeout(r, 2500)),
]).then(() => { hero(); crew(); reel(); size(); hood(); wall(); ScrollTrigger.refresh(); });

})();
