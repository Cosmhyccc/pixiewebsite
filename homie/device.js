// homie is a Mac app. Most launch traffic is phones (X, HN on mobile), so on a phone or tablet the
// download buttons become "send it to my mac": share sheet where there is one, else copy the link.
(() => {
  const ua = navigator.userAgent;
  const iPad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  const phone = /iPhone|iPad|iPod|Android|Mobile/.test(ua) || iPad;
  const notMac = !phone && !/Macintosh|Mac OS X/.test(ua);
  if (!phone && !notMac) return;

  // Keep where this visit came from (e.g. ?ref=ig-homie) so the download on the Mac is still attributed.
  const from = new URLSearchParams();
  for (const [k, v] of new URLSearchParams(location.search)) if (/^(ref|utm_\w+)$/.test(k)) from.set(k, v.slice(0, 100));
  const link = "https://homie-mac.vercel.app/" + (from.toString() ? "?" + from : "");
  const label = phone ? "send it to my mac" : "homie is mac only, for now";
  const note = phone ? "homie lives on your Mac. Send yourself the link." : "Apple silicon · macOS 26 or later";

  // A small toast for machines homie can't run on.
  let toast;
  function unsupported(cta) {
    window.homieTrack?.("Download Unsupported", { cta });
    if (!toast) {
      toast = document.createElement("div");
      toast.setAttribute("role", "status");
      toast.innerHTML = "Oops, your machine is not supported<br>for homie at the time :(";
      toast.style.cssText = "position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:9999;width:max-content;max-width:min(320px,calc(100vw - 32px));"
        + "padding:16px 22px;border-radius:16px;border:2px solid #e5484d;background:#ffe8e8;color:#8f1d22;font:600 16px/1.4 inherit;text-align:center;"
        + "box-shadow:0 10px 30px rgba(229,72,77,.2);transition:opacity .25s;opacity:0;pointer-events:none";
      document.body.appendChild(toast);
    }
    requestAnimationFrame(() => (toast.style.opacity = "1"));
    clearTimeout(toast.hide);
    toast.hide = setTimeout(() => (toast.style.opacity = "0"), 3500);
  }

  document.querySelectorAll('a[href^="/download"]').forEach((a) => {
    const text = [...a.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    const small = a.classList.contains("pill");
    if (text) text.textContent = small ? (phone ? "send to mac" : "mac only") : label;
    a.querySelector(".cta__free")?.remove();
    const p = a.nextElementSibling;
    if (p && p.classList.contains("cta-note")) p.textContent = note;
    if (!phone) {
      // Windows/Linux: say so instead of handing over a DMG that can't run.
      a.addEventListener("click", (e) => { e.preventDefault(); unsupported(small ? "nav" : "hero"); });
      return;
    }
    a.addEventListener("click", async (e) => {
      e.preventDefault();
      if (navigator.share) {
        try { await navigator.share({ title: "homie", text: "homie, the voice buddy in my Mac's notch", url: link }); } catch {}
        return;
      }
      try { await navigator.clipboard.writeText(link); } catch {}
      const before = text ? text.textContent : "";
      if (text) { text.textContent = small ? "copied ✓" : "link copied ✓"; setTimeout(() => (text.textContent = before), 1800); }
    });
  });
})();
