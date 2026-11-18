// friend loops: invite link (not live yet), waitlist email, mention us on X, share with a friend
(() => {
  const $ = (s) => document.querySelector(s);
  const WAITLIST = "https://yiphasqdhitluorenuwl.supabase.co/functions/v1/pixie-local-waitlist";
  const KEY = "sb_publishable_qKA6uxOk2OWafa1GyfLqFw_2SPK69ba"; // public app key, same one the app ships
  const TWEET = "anybody got a homie ai invite code? demo looked awesome, would love it if someone can share an invite!";
  const msg = (form, text, ok = false) => { const m = form.querySelector(".inv__msg"); m.textContent = text; m.classList.toggle("is-ok", ok); };

  const link = $('[data-inv="link"]');
  link?.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = link.link.value.trim();
    msg(link, v ? "invites aren't live just yet. get in line (step 2) for now" : "paste your invite link first.");
  });

  const mail = $('[data-inv="email"]');
  mail?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = mail.querySelector("button"), email = mail.email.value.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return msg(mail, "that email looks off. try again?");
    btn.disabled = true; btn.textContent = "saving…"; msg(mail, "");
    try {
      const r = await fetch(WAITLIST, { method: "POST", headers: { "Content-Type": "application/json", apikey: KEY }, body: JSON.stringify({ email }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.saved) throw new Error(j.error || "");
      btn.textContent = "you're in line ✓"; mail.email.disabled = true;
      msg(mail, "you're on the list. we'll email you a code when it's your turn.", true);
    } catch (err) {
      btn.disabled = false; btn.textContent = "get in line";
      msg(mail, err.message || "couldn't save your spot. try again in a sec?");
    }
  });

  document.querySelectorAll('[data-inv="x"]').forEach((x) => (x.href = "https://x.com/intent/tweet?text=" + encodeURIComponent(TWEET)));

  const share = $('[data-inv="share"]');
  share?.addEventListener("click", async () => {
    const card = share.closest(".inv__card"), url = location.origin + location.pathname;
    const m = (t) => { const el = card.querySelector(".inv__msg"); el.textContent = t; el.classList.add("is-ok"); };
    try {
      if (navigator.share) { await navigator.share({ title: "homie", text: "a free AI that lives on your Mac. no cloud.", url }); return; }
      await navigator.clipboard.writeText(url); m("link copied. go send it to your homie");
    } catch (e) { if (e?.name !== "AbortError") m(url); }
  });
})();
