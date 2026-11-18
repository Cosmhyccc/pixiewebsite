// will-it-run checker, "prove it" traffic viz, wall of homies
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const whileVisible = (el, fn) => el && new IntersectionObserver((es) => es.forEach((e) => fn(e.isIntersecting))).observe(el);

  // ---------- WILL IT RUN ON MY MAC? ----------
  (() => {
    const root = $(".chk"); if (!root) return;
    // memory bandwidth (GB/s) per chip: token speed tracks it. measured anchor: M5 base, 16 GB = 31 tok/s
    const BW = { 1: { base: 68, pro: 200, max: 400, ultra: 800 }, 2: { base: 100, pro: 200, max: 400, ultra: 800 },
      3: { base: 100, pro: 150, max: 400, ultra: 819 }, 4: { base: 120, pro: 273, max: 546 }, 5: { base: 153, pro: 307, max: 614 } };
    const HOMIE_GB = 3.5, MACOS_GB = 4;
    const st = { chip: "5", tier: "base", mem: "16" };
    const verdict = $(".chk__verdict"), why = $(".chk__why"), bar = $(".chk__bar"), tokEl = $(".chk__tok"), out = $(".chk__out"), key = $(".chk__key");
    const LINES = [["sure", "!", " starting", " a", " 10", " minute", " timer", "."], ["on", " it", ".", " dark", " mode", ",", " coming", " up", "."], ["playing", " lo", "-fi", " beats", " on", " spotify", "."]];
    let tps = 31, typeTimer = 0, li = 0, ti = 0, visible = false;

    const type = () => {
      clearTimeout(typeTimer);
      if (!visible) return;
      if (!tps) { out.textContent = "> can't run here"; return; }
      const line = LINES[li];
      if (ti === 0) out.textContent = "> ";
      if (ti < line.length) { out.textContent += line[ti++]; typeTimer = setTimeout(type, reduce ? 0 : 1000 / tps); }
      else { ti = 0; li = (li + 1) % LINES.length; typeTimer = setTimeout(type, 1300); }
    };

    const render = () => {
      const intel = st.chip === "intel";
      $$('[data-k="tier"] button').forEach((b) => (b.disabled = intel || (b.dataset.v === "ultra" && !BW[st.chip]?.ultra)));
      $$('[data-k="mem"] button').forEach((b) => (b.disabled = intel));
      if (!intel && !BW[st.chip][st.tier]) st.tier = "max";
      $$(".chk__opts button").forEach((b) => b.classList.toggle("is-on", st[b.parentElement.dataset.k] === b.dataset.v));
      const mem = +st.mem;
      let cls = "", v, w;
      if (intel) {
        tps = 0; v = "NOPE. SORRY"; cls = "is-no";
        w = "homie needs Apple silicon (M1 or newer). Intel Macs can't run the brain locally.";
      } else {
        tps = Math.min(90, Math.round(31 * Math.pow(BW[st.chip][st.tier] / 153, 0.8)));
        if (mem <= 8) tps = Math.max(5, Math.round(tps * 0.5)); // 8 GB swaps, which halves speed
        const secs = Math.max(1, (34 + 28) / tps).toFixed(1);
        if (mem <= 8) { v = "TIGHT FIT"; cls = "is-tight"; w = `runs, but 8 GB is snug. close heavy apps. ~${secs}s a request. lighter 8 GB brain coming.`; }
        else if (tps >= 25) { v = "RUNS GREAT"; w = `plenty of room. homie answers in ~${secs}s.`; }
        else { v = "RUNS FINE"; cls = "is-ok"; w = `a beat slower, still totally usable. ~${secs}s a request.`; }
      }
      if (verdict.textContent !== v && window.gsap && !reduce) gsap.fromTo(verdict, { scale: 1.25, rotation: -4 }, { scale: 1, rotation: 0, duration: 0.45, ease: "back.out(2.6)" });
      verdict.textContent = v; verdict.className = "chk__verdict " + cls; why.textContent = w;
      tokEl.textContent = intel ? "—" : `~${tps} tokens/s`;
      // one block per GB
      const n = intel ? 16 : mem, free = Math.max(0, mem - HOMIE_GB - MACOS_GB);
      bar.innerHTML = "";
      for (let i = 0; i < n; i++) {
        const b = document.createElement("i");
        if (!intel) b.className = i < Math.ceil(HOMIE_GB) ? (mem <= 8 ? "is-h is-over" : "is-h") : i < Math.ceil(HOMIE_GB) + MACOS_GB ? "is-m" : "";
        else b.className = "is-m";
        bar.appendChild(b);
      }
      key.innerHTML = intel ? "" : `<i class="k-h"></i>homie ${HOMIE_GB} <i class="k-m"></i>macOS ${MACOS_GB} <i class="k-f"></i>${free > 0 ? `${free % 1 ? free.toFixed(1) : free}${st.mem === "32" ? "+" : ""} GB free` : "~0 free"}`;
      ti = 0; type();
    };

    root.addEventListener("click", (e) => {
      const b = e.target.closest(".chk__opts button"); if (!b || b.disabled) return;
      st[b.parentElement.dataset.k] = b.dataset.v; render();
    });

    // guess the Mac from the GPU name (Chrome/Edge/Firefox say "Apple M2 Pro"; Safari only says "Apple GPU")
    try {
      if (/Mac/.test(navigator.platform || navigator.userAgent)) {
        const gl = document.createElement("canvas").getContext("webgl");
        const ext = gl && gl.getExtension("WEBGL_debug_renderer_info");
        const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "";
        const m = /Apple M(\d)(?:\s+(Pro|Max|Ultra))?/.exec(name);
        const g = $(".chk__guess");
        if (m && BW[m[1]]) {
          st.chip = m[1]; st.tier = (m[2] || "base").toLowerCase();
          g.textContent = `looks like you're on an M${m[1]}${m[2] ? " " + m[2] : ""}. we picked it for you ↓ (memory's your call)`; g.hidden = false;
        } else if (/Intel/.test(name)) {
          st.chip = "intel"; g.textContent = "looks like an Intel Mac ↓"; g.hidden = false;
        }
      }
    } catch { /* no guess, no problem */ }

    whileVisible($(".chk__mac"), (on) => { visible = on; if (on) type(); else clearTimeout(typeTimer); });
    render();
  })();

  // ---------- PROVE IT: packets loop inside the house, the cloud counter never moves ----------
  (() => {
    const svg = $(".prove__svg"); if (!svg) return;
    const path = $("#pl"), dots = $(".prove__dots"), ctr = $(".prove__in"), len = path.getTotalLength();
    const N = 6, ns = "http://www.w3.org/2000/svg";
    const ds = Array.from({ length: N }, () => { const c = document.createElementNS(ns, "circle"); c.setAttribute("r", 7); dots.appendChild(c); return c; });
    let bytes = 0, on = false, raf = 0;
    const frame = (now) => {
      const t = now / 1000;
      ds.forEach((c, i) => { const p = path.getPointAtLength(((t * 0.18 + i / N) % 1) * len); c.setAttribute("cx", p.x); c.setAttribute("cy", p.y); });
      bytes += Math.floor(2000 + Math.random() * 40000);
      ctr.textContent = bytes.toLocaleString("en-US");
      if (on) raf = requestAnimationFrame(frame);
    };
    whileVisible($(".prove__viz"), (v) => { on = v && !reduce; cancelAnimationFrame(raf); if (on) raf = requestAnimationFrame(frame); });
    if (reduce) frame(0);
    const copy = $(".prove__copy");
    copy?.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText($(".prove__cmd code").textContent); copy.textContent = "copied ✓"; }
      catch { copy.textContent = "select it ↑"; }
      setTimeout(() => (copy.textContent = "copy"), 1800);
    });
  })();

  // ---------- WALL OF HOMIES ----------
  (() => {
    const wall = $(".hw"); if (!wall) return;
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    (window.HOMIES || []).forEach((h) => {
      const card = el("a", "hw__t"); card.href = h.url; card.target = "_blank"; card.rel = "noopener";
      const who = el("div", "hw__who"); const n = el("span", null, h.name); n.appendChild(el("small", null, "@" + h.handle)); who.appendChild(n);
      card.append(who, el("p", "hw__txt", h.text));
      if (h.gotIn) card.appendChild(el("span", "hw__stamp", "got in ✓"));
      wall.appendChild(card);
    });
    const ghost = el("div", "hw__t hw__t--ghost");
    ghost.appendChild(el("p", "hw__txt", (window.HOMIES || []).length ? "you next?" : "your tweet here. be the first homie on the wall"));
    const x = $('[data-inv="x"]')?.cloneNode(true);
    if (x) ghost.appendChild(x);
    wall.appendChild(ghost);
  })();
})();
