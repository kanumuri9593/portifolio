/* Sai Gangula · identity security portfolio
   Vanilla JS + canvas/SVG, GSAP 3.13 ScrollTrigger and Lenis (vendored). */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const NS = "http://www.w3.org/2000/svg";
  const G = typeof gsap !== "undefined" && !RM;
  if (G) gsap.registerPlugin(ScrollTrigger);

  /* smooth scroll */
  let lenis = null;
  if (G && typeof Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const el = a.getAttribute("href").length > 1 && $(a.getAttribute("href"));
    if (!el) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(el, { duration: 1.4 }) : el.scrollIntoView({ behavior: RM ? "auto" : "smooth" });
  }));

  /* split helpers */
  function splitChars(el) {
    const t = el.textContent; el.textContent = "";
    el.setAttribute("aria-label", t);
    [...t].forEach((c) => { const s = document.createElement("span"); s.className = "ch"; s.setAttribute("aria-hidden", "true"); s.textContent = c === " " ? " " : c; el.appendChild(s); });
    return $$(".ch", el);
  }
  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/); el.textContent = "";
    words.forEach((w, i) => { const s = document.createElement("span"); s.className = "w"; s.textContent = w; el.appendChild(s); if (i < words.length - 1) el.appendChild(document.createTextNode(" ")); });
    return $$(".w", el);
  }

  /* hero dot grid with a soft cursor spotlight */
  function dots() {
    const cv = $("#dots"), ctx = cv.getContext("2d"), hero = $(".hero");
    let W, H, m = { x: -999, y: -999, tx: -999, ty: -999 }, vis = true, t0 = performance.now();
    function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); draw(t0); }
    hero.addEventListener("pointermove", (e) => { if (e.pointerType === "touch") return; const r = cv.getBoundingClientRect(); m.tx = e.clientX - r.left; m.ty = e.clientY - r.top; });
    hero.addEventListener("pointerleave", () => { m.tx = -999; m.ty = -999; });
    new IntersectionObserver(([en]) => (vis = en.isIntersecting)).observe(hero);
    function draw(now) {
      const t = (now - t0) / 1000, gap = W < 640 ? 22 : 28;
      const auto = m.tx < -500;
      const tx = auto ? W * (0.5 + 0.3 * Math.sin(t * 0.25)) : m.tx, ty = auto ? H * (0.45 + 0.2 * Math.cos(t * 0.31)) : m.ty;
      m.x += (tx - m.x) * 0.08; m.y += (ty - m.y) * 0.08;
      if (m.x < -500) { m.x = tx; m.y = ty; }
      ctx.clearRect(0, 0, W, H);
      const R = Math.max(220, W * 0.22);
      for (let y = gap / 2; y < H; y += gap) for (let x = gap / 2; x < W; x += gap) {
        const d = Math.hypot(x - m.x, y - m.y), k = Math.max(0, 1 - d / R);
        const r = 0.9 + k * 1.9;
        ctx.fillStyle = k > 0.02 ? `rgba(30,63,224,${0.18 + k * 0.7})` : "rgba(14,24,56,.13)";
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
      }
    }
    size(); addEventListener("resize", size);
    if (G) (function loop(now) { requestAnimationFrame(loop); if (vis && !document.hidden) draw(now); })(t0);
  }

  /* hero intro + scroll */
  function hero() {
    const words = $$(".hero__word");
    const chars = words.map(splitChars);
    if (!G) return;
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(chars.flat(), { yPercent: 105, duration: 1.4, stagger: 0.035 }, 0.1)
      .from(".hero__photo", { y: 120, opacity: 0, duration: 1.6 }, 0.35)
      .from(".hero__kick, .hero__lede > *, .nav > *", { y: 16, opacity: 0, duration: 1, stagger: 0.06 }, 0.8)
      .from(".snap", { y: 40, opacity: 0, scale: 0.96, duration: 1.2, stagger: 0.09 }, 0.9);
    // scroll: name drifts apart, snaps lift at different speeds, photo scales
    const st = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
    chars.forEach((cs) => cs.forEach((c, i) => {
      const mid = (cs.length - 1) / 2;
      gsap.to(c, { x: () => (i - mid) * innerWidth * 0.008, ease: "none", scrollTrigger: st });
    }));
    gsap.to(".hero__name", { yPercent: -18, ease: "none", scrollTrigger: st });
    gsap.matchMedia().add("(min-width: 900px)", () => { $$(".snap").forEach((el, i) => gsap.to(el, { y: -16 - i * 10, ease: "none", scrollTrigger: st })); });
    gsap.to(".hero__photo", { scale: 1.06, yPercent: 4, ease: "none", scrollTrigger: st });
  }

  /* ===== v4 hero snaps (illustrative live demos) ===== */
  // identity graph: a rotating sphere of identities, each human owns many machines and agents
  function sphere() {
    const cv = $("#sphere"); if (!cv) return;
    const ctx = cv.getContext("2d"), N = 220, pts = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996;
      pts.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r, kind: i % 55 === 0 ? 0 : i % 5 === 0 ? 2 : 1 });
    }
    let W, H, vis = true;
    const hum = pts.filter((p) => p.kind === 0), links = [];
    pts.forEach((p, i) => { if (p.kind === 2 && i % 3 === 0) links.push([hum[i % hum.length], p]); });
    function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
    function proj(p, a, b) {
      const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      const x = p.x * ca - p.z * sa, z1 = p.x * sa + p.z * ca, y = p.y * cb - z1 * sb, z = p.y * sb + z1 * cb;
      const R = Math.min(W, H) * 0.36, cx = W * 0.5, cy = H * 0.52;
      return [cx + x * R, cy + y * R, z];
    }
    function draw(t) {
      if (!W) return;
      ctx.clearRect(0, 0, W, H);
      const a = t * 0.00025, b = 0.42 + Math.sin(t * 0.0002) * 0.12, pulse = (t * 0.0006) % 1;
      links.forEach(([h, p], k) => {
        const A = proj(h, a, b), B = proj(p, a, b), dep = (A[2] + B[2] + 2) / 4;
        ctx.strokeStyle = `rgba(107,133,255,${0.08 + dep * 0.22})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
        const q = (pulse + k * 0.13) % 1;
        ctx.fillStyle = `rgba(160,178,255,${dep})`;
        ctx.beginPath(); ctx.arc(A[0] + (B[0] - A[0]) * q, A[1] + (B[1] - A[1]) * q, 1.4, 0, 6.283); ctx.fill();
      });
      pts.map((p) => [p, proj(p, a, b)]).sort((m, n) => m[1][2] - n[1][2]).forEach(([p, [x, y, z]]) => {
        const d = (z + 1) / 2, r = p.kind === 0 ? 4.2 : p.kind === 2 ? 2.4 : 1.5;
        ctx.fillStyle = p.kind === 0 ? `rgba(255,255,255,${0.35 + d * 0.65})` : p.kind === 2 ? `rgba(107,133,255,${0.3 + d * 0.7})` : `rgba(140,142,152,${0.15 + d * 0.5})`;
        ctx.beginPath(); ctx.arc(x, y, r * (0.6 + d * 0.6), 0, 6.283); ctx.fill();
        if (p.kind === 0 && d > 0.5) { ctx.strokeStyle = `rgba(255,255,255,${(d - 0.5) * 0.8})`; ctx.beginPath(); ctx.arc(x, y, r + 4 + Math.sin(t * 0.004) * 1.5, 0, 6.283); ctx.stroke(); }
      });
    }
    size(); addEventListener("resize", () => { size(); draw(performance.now()); });
    if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => (vis = e.isIntersecting)).observe(cv);
    if (!G) { draw(1200); return; }
    (function loop(now) { requestAnimationFrame(loop); if (vis && !document.hidden) draw(now); })(performance.now());
  }

  // passkey: fingerprint traces, then verified
  function passkey() {
    const card = $(".snap--pass"); if (!card) return;
    const st = $("#passSt"), sub = $("#passSub"), fill = $$(".fp__fill path", card);
    const ok = () => { card.classList.add("is-ok"); st.textContent = "Verified"; sub.textContent = "Phishing-resistant, no password"; sub.className = "snap__sub ok"; };
    if (!G) { fill.forEach((p) => (p.style.strokeDashoffset = 0)); ok(); return; }
    gsap.timeline({ delay: 1.6, repeat: -1, repeatDelay: 2.4 })
      .call(() => { card.classList.remove("is-ok"); st.textContent = "Passkey"; sub.textContent = "Waiting for Face ID"; sub.className = "snap__sub"; })
      .set(fill, { strokeDashoffset: 60 })
      .to(fill, { strokeDashoffset: 0, duration: 1.4, stagger: 0.12, ease: "power2.inOut" }, "+=0.5")
      .call(() => { sub.textContent = "Checking device key"; }, null, "-=0.6")
      .call(ok, null, "+=0.2")
      .to(card, { scale: 1.03, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" }, "<");
  }

  // agent token: a 15 minute credential counts down (sped up), expires, is revoked, then reissued
  function tokenSnap() {
    const card = $(".snap--tok"); if (!card) return;
    const fill = $("#ttlFill"), t = $("#ttlT"), st = $("#tokSt");
    const fmt = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(Math.floor(s % 60)).padStart(2, "0");
    if (!G) return;
    const o = { s: 900 };
    gsap.timeline({ delay: 2, repeat: -1, repeatDelay: 0.4 })
      .call(() => { card.classList.remove("is-dead"); st.textContent = "Scoped to one task"; st.className = "snap__sub"; })
      .set(o, { s: 900 }).set(fill, { scaleX: 1 })
      .to(o, { s: 0, duration: 7, ease: "none", onUpdate: () => (t.textContent = fmt(o.s)) })
      .to(fill, { scaleX: 0, duration: 7, ease: "none" }, "<")
      .call(() => { card.classList.add("is-dead"); st.textContent = "Expired and revoked. No standing key"; st.className = "snap__sub bad"; })
      .to({}, { duration: 2.2 })
      .call(() => { st.textContent = "New token for the next task"; st.className = "snap__sub ok"; card.classList.remove("is-dead"); t.textContent = "15:00"; })
      .to(fill, { scaleX: 1, duration: 0.6, ease: "expo.out" })
      .to({}, { duration: 1.2 });
  }

  // policy decisions: a stream of allow / deny / hold / revoke calls
  const DECISIONS = [
    ["allow", "sai@corp → crm.read", "passkey"],
    ["deny", "svc-backup → prod-db.drop", "out of scope"],
    ["hold", "ap-agent → payee.change", "needs a person"],
    ["allow", "research-agent → docs.read", "15 min token"],
    ["revoke", "leaver@corp → vpn", "offboarded"],
    ["deny", "new-country session → admin", "impossible travel"],
    ["allow", "contractor → jira.write", "expires Friday"],
    ["hold", "support-agent → refunds.issue", "over $500"],
    ["deny", "ci-bot → secrets.read", "key not scoped"],
  ];
  function decisionLog() {
    const ol = $("#dlog"); if (!ol) return;
    const row = ([k, w, why]) => { const li = document.createElement("li"); li.className = k; li.innerHTML = `<b>${k.toUpperCase()}</b><span>${w}</span><em>${why}</em>`; return li; };
    let i = 0;
    for (; i < 4; i++) ol.appendChild(row(DECISIONS[i]));
    if (!G) return;
    setInterval(() => {
      if (document.hidden) return;
      const li = row(DECISIONS[i++ % DECISIONS.length]);
      ol.appendChild(li);
      gsap.from(li, { y: 16, opacity: 0, duration: 0.6, ease: "expo.out" });
      while (ol.children.length > 5) ol.removeChild(ol.firstChild);
    }, 1700);
  }

  /* expertise tabs: each discipline gets its own small live diagram */
  const EXP = [
    ["IGA · Governance", "Know who has access, and why.", "Bring identity lifecycles, access decisions and accountability together, so security teams move from scattered visibility to a program they can trust.",
      () => { let h = `<circle class="s" cx="100" cy="100" r="78"/><circle class="w" cx="100" cy="100" r="10"/><g class="spin">`;
        for (let i = 0; i < 8; i++) { const a = i * 0.785, x = 100 + Math.cos(a) * 78, y = 100 + Math.sin(a) * 78; h += `<line class="s flowd" x1="100" y1="100" x2="${x}" y2="${y}"/><circle class="${i % 3 ? "f" : "g"}" cx="${x}" cy="${y}" r="7"/>`; }
        return h + `</g><circle class="b pulse" cx="100" cy="100" r="30"/>`; }],
    ["PAM · Privileged access", "Protect the access that matters most.", "Cut exposure around powerful accounts and sensitive systems with the right mix of visibility, just-in-time access and accountability.",
      () => `<circle class="s" cx="100" cy="100" r="80"/><g class="spinR"><circle class="b" cx="100" cy="100" r="62" stroke-dasharray="6 10"/></g><rect class="s" x="66" y="92" width="68" height="56" rx="10" style="stroke:#fff;stroke-width:2"/><path class="b" d="M78 92 V76 a22 22 0 0 1 44 0 V92"/><circle class="w" cx="100" cy="116" r="6"/><rect class="w" x="97" y="118" width="6" height="16" rx="3"/><circle class="b pulse" cx="100" cy="100" r="40"/>`],
    ["CIAM · Customer identity", "Easy for people. Strong by design.", "Join authentication and user experience, so customers sign in quickly and safely on every app and device, with passkeys instead of passwords.",
      () => { let h = `<circle class="s" cx="100" cy="100" r="40"/><circle class="s" cx="100" cy="100" r="62"/><circle class="s" cx="100" cy="100" r="84"/>`;
        [[40, 6, "spin"], [62, 10, "spinR"], [84, 14, "spin"]].forEach(([r, n, c]) => { h += `<g class="${c}">`; for (let i = 0; i < n; i++) { const a = (i / n) * 6.283; h += `<circle class="${i % 4 ? "w" : "f"}" cx="${100 + Math.cos(a) * r}" cy="${100 + Math.sin(a) * r}" r="${r === 40 ? 4 : 3}" opacity="${r === 84 ? .5 : .9}"/>`; } h += `</g>`; });
        return h + `<circle class="f" cx="100" cy="100" r="12"/>`; }],
    ["NHI · Agent identity", "Extend trust beyond people.", "As software and AI agents act for us, make ownership, scoped permissions, short-lived credentials and human approval part of the identity program.",
      () => `<path class="s" d="M100 30 L160 65 L160 135 L100 170 L40 135 L40 65 Z" style="stroke:#fff;stroke-width:1.6"/><path class="b" d="M100 58 L136 79 L136 121 L100 142 L64 121 L64 79 Z"/><g class="spin"><circle class="s" cx="100" cy="100" r="88" stroke-dasharray="2 6"/><circle class="g" cx="188" cy="100" r="6"/></g><g class="spinR"><circle class="r" cx="100" cy="12" r="5"/></g><circle class="w" cx="100" cy="100" r="9"/><circle class="b pulse" cx="100" cy="100" r="26"/>`],
  ];
  function expertise() {
    const tabs = $$(".exp__tab"), art = $("#expArt"), copy = $(".exp__copy"); if (!art) return;
    function pick(i) {
      tabs.forEach((t, j) => t.setAttribute("aria-selected", j === i));
      const [l, t, p, a] = EXP[i];
      $("#expLabel").textContent = l; $("#expTitle").textContent = t; $("#expText").textContent = p; art.innerHTML = a();
      copy.classList.remove("is-swap"); void copy.offsetWidth; copy.classList.add("is-swap");
      if (G) gsap.fromTo(art, { scale: 0.85, opacity: 0, rotate: -20, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, rotate: 0, duration: 0.9, ease: "expo.out" });
    }
    tabs.forEach((t, i) => t.addEventListener("click", () => pick(i)));
    pick(0);
    if (G) {
      gsap.from(".exp__tab", { x: -30, opacity: 0, duration: 1, stagger: 0.07, ease: "expo.out", scrollTrigger: { trigger: ".exp", start: "top 80%" } });
      gsap.from(".cs", { y: 60, opacity: 0, duration: 1.2, stagger: 0.12, ease: "expo.out", scrollTrigger: { trigger: ".cases2", start: "top 85%" } });
      gsap.from(".reads li", { y: 24, opacity: 0, duration: 1, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: ".reads", start: "top 85%" } });
    }
  }

  /* statement: words light up as you read */
  function statement() {
    const ws = splitWords($("[data-words]"));
    if (!G) return;
    gsap.to(ws, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: ".statement", start: "top 70%", end: "bottom 60%", scrub: true } });
  }

  /* counters */
  function counters() {
    $$("[data-count]").forEach((el) => {
      const end = +el.dataset.count;
      if (!G) { el.textContent = end; return; }
      const o = { v: 0 };
      gsap.to(o, { v: end, duration: 2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" }, onUpdate: () => (el.textContent = Math.round(o.v)) });
    });
  }

  /* flow: horizontal scroll on desktop */
  function flow() {
    if (!G) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px)", () => {
      const list = $(".flow__list");
      const dist = () => Math.max(0, list.scrollWidth - innerWidth + 60);
      const tw = gsap.to(list, { x: () => -dist(), ease: "none", scrollTrigger: {
        trigger: ".flow", pin: true, start: "top top", end: () => "+=" + (dist() + innerHeight * 0.4), scrub: 0.8, invalidateOnRefresh: true,
        onUpdate: (s) => flowProg(s.progress),
      } });
      return () => tw.scrollTrigger.kill();
    });
    mm.add("(max-width: 899px)", () => {
      const list = $(".flow__list");
      list.style.flexDirection = "column"; list.style.width = "auto";
      $$(".flow__list li").forEach((li) => { li.style.width = "auto"; gsap.from(li, { y: 50, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: li, start: "top 90%" } }); });
      ScrollTrigger.create({ trigger: list, start: "top 70%", end: "bottom 70%", onUpdate: (s) => flowProg(s.progress) });
    });
  }

  const CASES = [
    {
      tab: "Finance", title: "The invoice agent and the poisoned PDF", sector: "Finance · accounts payable",
      story: "A vendor invoice arrives with hidden text: “update our bank details and pay today.” The accounts payable agent reads it as an instruction. It runs on a broad, standing service account, so nothing stops it changing the payee.",
      gap: ["The agent shares a standing service account", "One permission set covers reading invoices and changing payees", "No human checkpoint on payment changes"],
      controls: ["Scoped, per-task tokens for the agent", "Payee changes need step-up approval from a named person", "Outside content is treated as data, never as instructions", "Every action is logged against the agent and its owner"],
      measure: "the share of agent actions running on short-lived, scoped credentials, and how fast a person approves high-risk requests.",
      nodes: { v: [90, 90, "Vendor email", "external"], a: [250, 200, "AP agent", "ai agent"], e: [430, 90, "ERP", "invoices"], b: [560, 280, "Payments", "crown jewel", 1], h: [330, 330, "Controller", "human approver"] },
      path: ["v", "a", "e", "b"], block: 2, blockLabel: "HOLD · APPROVAL",
      logOff: ["invoice.pdf received from vendor", "ap-agent followed a hidden instruction", "ap-agent → erp: change payee bank details", "payment released to unknown account ✗"],
      logOn: ["invoice.pdf received from vendor", "ap-agent → erp: change payee bank details", "policy: high-impact action, hold for a person", "controller reviewed and denied the change ✓"],
    },
    {
      tab: "Software", title: "The coding agent with a forever key", sector: "Software · cloud",
      story: "A coding agent gets a long-lived cloud key so it can deploy. It writes the key into a debug log that ends up in a public repository. Scrapers hunt for exposed keys like this around the clock.",
      gap: ["A static key with no expiry", "Production rights the agent rarely needed", "Nobody owned the key's rotation"],
      controls: ["Workload identity federation instead of static keys", "Tokens that expire in minutes", "Secrets scanning and a vault for anything long-lived", "Production access granted just in time"],
      measure: "the number of static credentials in use and their average age, trending to zero.",
      nodes: { a: [90, 200, "Coding agent", "ai agent"], r: [240, 80, "Public repo", "debug log"], x: [400, 200, "Key scraper", "attacker"], c: [560, 90, "Cloud console", "production"], d: [560, 300, "Customer data", "crown jewel", 1] },
      path: ["a", "r", "x", "c", "d"], block: 2, blockLabel: "TOKEN EXPIRED",
      logOff: ["coding-agent wrote config to debug.log", "debug.log pushed to a public repo", "scraper found a cloud key", "key accepted, production data copied ✗"],
      logOn: ["coding-agent wrote config to debug.log", "secret scanner flagged and revoked the token", "scraper tried a token that expired 14 minutes ago", "sign-in refused, nothing to steal ✓"],
    },
    {
      tab: "M&A", title: "Merger weekend: two directories, one company", sector: "Any industry · acquisition",
      story: "Day one of an acquisition. Thousands of accounts arrive, including service accounts and an automation agent nobody on the new team knows about. A former contractor still has working credentials.",
      gap: ["No inventory of the acquired company's non-human accounts", "Leavers not reconciled across both directories", "Directory trust opened before cleanup"],
      controls: ["Discovery and owner attestation before trust opens", "Joiner, mover and leaver rules for non-humans too", "An access certification in the first 30 days", "Ownerless accounts disabled by default"],
      measure: "the share of identities with a named owner, before and after day one.",
      nodes: { k: [90, 90, "Ex-contractor", "attacker"], o: [250, 200, "Retired bot", "still enabled"], s: [420, 90, "Service accounts", "no owner"], t: [420, 300, "Directory trust", "new"], p: [570, 200, "Core apps", "crown jewel", 1] },
      path: ["k", "o", "s", "p"], block: 0, blockLabel: "NO OWNER · DISABLED",
      logOff: ["ex-contractor signed in as retired-bot", "retired-bot used inherited service account", "trust path into core apps accepted", "core apps reached through the merger ✗"],
      logOn: ["discovery: retired-bot has no owner", "attestation failed, account disabled", "ex-contractor sign-in rejected", "trust opened after cleanup ✓"],
    },
    {
      tab: "Healthcare", title: "The help-desk call that sounded like the CFO", sector: "Healthcare · help desk",
      story: "A caller with a cloned executive voice asks the help desk to reset MFA before a board meeting. The voice, the urgency and the details all check out. Generative AI makes this cheap to try at scale.",
      gap: ["Voice treated as proof of identity", "Help desk can reset MFA without verification", "A reset grants instant privileged access"],
      controls: ["Phishing-resistant passkeys for executives and admins", "Verified identity re-proofing for every reset", "Privileged sessions brokered and recorded through PAM", "Alerts on a reset followed by a new-device sign-in"],
      measure: "the share of privileged users on phishing-resistant MFA, and verified resets as a share of all resets.",
      nodes: { f: [90, 200, "Cloned voice", "attacker"], d: [250, 90, "Help desk", "human"], m: [400, 200, "MFA reset", "identity"], e: [560, 90, "Admin console", "privileged"], r: [560, 300, "Patient records", "crown jewel", 1] },
      path: ["f", "d", "m", "e", "r"], block: 1, blockLabel: "RE-PROOF REQUIRED",
      logOff: ["urgent call from the “CFO”", "help desk reset MFA by phone", "new device enrolled", "admin console opened to records ✗"],
      logOn: ["urgent call from the “CFO”", "reset needs verified identity re-proofing", "caller could not pass verification", "real CFO notified, passkey unchanged ✓"],
    },
    {
      tab: "Retail CIAM", title: "Shopping agents acting for customers", sector: "Retail · customer identity",
      story: "Customers start sending AI agents to shop, rebook and redeem points for them. With no proper way to delegate, agents sign in with the customer's own password, and the store cannot tell a helpful agent from a hostile one.",
      gap: ["Agents share the customer's password", "Agent and customer sessions look identical", "No way for a customer to see or revoke an agent"],
      controls: ["Delegated, scoped consent for agents (OAuth style)", "Agent sessions labelled and rate-limited", "A customer page to review and revoke agents", "Passkeys for the customer themselves"],
      measure: "the share of agent traffic on delegated tokens, and account takeover reports per month.",
      nodes: { c: [90, 90, "Customer", "human"], g: [90, 300, "Rogue agent", "attacker"], l: [320, 200, "Store sign-in", "ciam"], a: [560, 90, "Saved cards", "crown jewel", 1], p: [560, 300, "Loyalty points", "crown jewel", 1] },
      path: ["g", "l", "p"], block: 0, blockLabel: "DELEGATED TOKEN ONLY",
      logOff: ["agent signed in with a replayed password", "session looks like the customer", "points redeemed to a new address", "customer finds out a week later ✗"],
      logOn: ["agent presented a replayed password", "policy: agents need delegated consent", "sign-in refused, customer alerted", "customer's own agent keeps working, scoped ✓"],
    },
  ];
  function cases() {
    const tabs = $("#caseTabs"), svg = $("#graph"), log = $("#log"), run = $("#runBtn"), caseEl = $("#case");
    let cur = 0, mode = "off", running = null, edges = [];
    CASES.forEach((c, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "tab"; b.setAttribute("role", "tab"); b.textContent = c.tab;
      b.addEventListener("click", () => select(i));
      tabs.appendChild(b);
    });
    $$(".toggle__opt").forEach((b) => b.addEventListener("click", () => {
      mode = b.dataset.mode;
      $$(".toggle__opt").forEach((o) => { o.classList.toggle("is-on", o === b); o.setAttribute("aria-pressed", o === b); });
      play();
    }));
    run.addEventListener("click", play);
    const layout = () => svg.clientWidth < 520
      ? { w: 360, h: 470, nw: 150, nh: 52, map: ([x, y]) => [80 + ((y - 80) / 250) * 200, 50 + ((x - 90) / 480) * 370] }
      : { w: 640, h: 380, nw: 140, nh: 54, map: ([x, y]) => [x, y] };
    function render() {
      if (running) { running.kill(); running = null; }
      const c = CASES[cur], L = layout(), pos = {};
      svg.setAttribute("viewBox", `0 0 ${L.w} ${L.h}`); svg.innerHTML = "";
      Object.entries(c.nodes).forEach(([k, n]) => (pos[k] = L.map(n)));
      edges = [];
      for (let i = 0; i < c.path.length - 1; i++) {
        const [x1, y1] = pos[c.path[i]], [x2, y2] = pos[c.path[i + 1]];
        const bend = 26 * (i % 2 ? 1 : -1);
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", `M${x1} ${y1} Q${(x1 + x2) / 2 + bend} ${(y1 + y2) / 2 - bend} ${x2} ${y2}`);
        p.setAttribute("class", "edge"); svg.appendChild(p); edges.push(p);
      }
      Object.entries(c.nodes).forEach(([k, n]) => {
        const [x, y] = pos[k], g = document.createElementNS(NS, "g");
        g.setAttribute("class", "node" + (n[4] ? " is-jewel" : "")); g.dataset.k = k;
        g.setAttribute("transform", `translate(${x - L.nw / 2} ${y - L.nh / 2})`);
        g.innerHTML = `<rect width="${L.nw}" height="${L.nh}" rx="12"/><text x="14" y="23">${n[2]}</text><text class="sub" x="14" y="40">${n[3].toUpperCase()}</text>`;
        svg.appendChild(g);
      });
      const be = edges[c.block], mp = be.getPointAtLength(be.getTotalLength() * 0.55);
      const sh = document.createElementNS(NS, "g");
      sh.setAttribute("class", "shield"); sh.setAttribute("transform", `translate(${mp.x} ${mp.y})`);
      sh.innerHTML = `<circle r="15"/><path d="M-6 0 L-1.5 4.5 L6.5 -4.5"/><text y="32" text-anchor="middle">${c.blockLabel}</text>`;
      svg.appendChild(sh);
      const pk = document.createElementNS(NS, "circle");
      pk.setAttribute("r", 6); pk.setAttribute("class", "packet"); pk.style.opacity = 0; svg.appendChild(pk);
      log.innerHTML = `<li>${mode === "on" ? "Controls on. Press Run." : "Controls off. Press Run."}</li>`;
    }
    function addLog(txt, cls) {
      const li = document.createElement("li");
      li.textContent = new Date().toTimeString().slice(0, 8) + "  " + txt; if (cls) li.className = cls;
      log.appendChild(li); while (log.children.length > 5) log.firstChild.remove();
    }
    function play() {
      const c = CASES[cur];
      render(); log.innerHTML = "";
      const pk = $(".packet", svg), sh = $(".shield", svg), lines = mode === "on" ? c.logOn : c.logOff;
      if (!G) {
        lines.forEach((l, i) => addLog(l, i === lines.length - 1 ? (mode === "on" ? "good" : "bad") : ""));
        if (mode === "on") { sh.style.opacity = 1; $$(".node.is-jewel", svg).forEach((n) => n.classList.add("is-safe")); }
        else $$(".node.is-jewel", svg).forEach((n) => n.classList.add("is-hit"));
        return;
      }
      run.disabled = true;
      const tl = gsap.timeline({ onComplete: () => (run.disabled = false) });
      running = tl;
      tl.set(pk, { opacity: 1 });
      const stopAt = mode === "on" ? c.block : edges.length;
      let li = 0, queued = 0;
      const logAt = () => { if (queued >= lines.length - 1) return; queued++; tl.call(() => addLog(lines[li++]), null, ">"); };
      for (let i = 0; i <= Math.min(stopAt, edges.length - 1); i++) {
        const e = edges[i], len = e.getTotalLength(), end = i === stopAt ? 0.55 : 1, o = { t: 0 };
        logAt();
        tl.to(o, { t: end, duration: 0.85 * end, ease: i === stopAt ? "power3.out" : "power2.inOut", onUpdate() { const p = e.getPointAtLength(len * o.t); pk.setAttribute("cx", p.x); pk.setAttribute("cy", p.y); } });
        if (i !== stopAt) { const n = $(`.node[data-k="${c.path[i + 1]}"]`, svg); tl.call(() => n.classList.add("is-hit")); }
      }
      while (queued < lines.length - 1) logAt();
      if (mode === "on") {
        tl.fromTo(sh, { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" })
          .to(pk, { attr: { r: 22 }, opacity: 0, duration: 0.5 }, "<")
          .call(() => { $$(".node.is-hit", svg).forEach((n) => n.classList.remove("is-hit")); $$(".node.is-jewel", svg).forEach((n) => n.classList.add("is-safe")); addLog(lines[lines.length - 1], "good"); });
      } else {
        tl.to(pk, { attr: { r: 26 }, opacity: 0, duration: 0.6 })
          .call(() => addLog(lines[lines.length - 1], "bad"), null, "<");
      }
    }
    function select(i) {
      cur = i;
      $$(".tab", tabs).forEach((t, j) => t.setAttribute("aria-selected", j === i));
      const c = CASES[i];
      $("#caseTitle").textContent = c.title; $("#caseStory").textContent = c.story;
      $("#caseSector").textContent = c.sector; $("#caseMeasure").textContent = c.measure;
      $("#caseGap").innerHTML = c.gap.map((g) => `<li>${g}</li>`).join("");
      $("#caseControls").innerHTML = c.controls.map((g) => `<li>${g}</li>`).join("");
      caseEl.classList.remove("is-swap"); void caseEl.offsetWidth; caseEl.classList.add("is-swap");
      render();
    }
    select(0);
    let tall = svg.clientWidth < 520;
    addEventListener("resize", () => { const t = svg.clientWidth < 520; if (t !== tall) { tall = t; render(); } });
    if (G) ScrollTrigger.create({ trigger: svg, start: "top 70%", once: true, onEnter: () => setTimeout(play, 300) });
  }

  /* playbook: each rule's top rule fills as it scrolls past */
  function playbook() {
    if (!G) return;
    $$(".rules li").forEach((li) => {
      gsap.fromTo(li, { "--p": 0 }, { "--p": 1, ease: "none", scrollTrigger: { trigger: li, start: "top 85%", end: "top 45%", scrub: true } });
      gsap.from(li.children, { y: 24, opacity: 0, duration: 1, stagger: 0.06, ease: "expo.out", scrollTrigger: { trigger: li, start: "top 85%" } });
    });
  }

  /* readiness check */
  const QUESTIONS = [
    ["Inventory", "Do you know how many AI agents and service accounts run in your environment today?"],
    ["Ownership", "Does every agent and service account have a named human owner?"],
    ["Credentials", "Do agents use short-lived tokens instead of static API keys?"],
    ["Privilege", "Is agent access scoped to the task and granted just in time?"],
    ["Approval", "Do high-impact agent actions, like payments, exports and access changes, pause for a person?"],
    ["Review", "Are agents included in your regular access reviews?"],
  ];
  function check() {
    const form = $("#quiz"), score = $("#score"), word = $("#scoreWord"), fill = $("#meterFill");
    form.innerHTML = QUESTIONS.map(([k, q], i) => `<div class="q"><fieldset><legend><small>0${i + 1} · ${k}</small>${q}</legend><div class="opts">${[["Yes", 2], ["Partly", 1], ["No", 0], ["Not sure", 0]].map(([l, v]) => `<label><input type="radio" name="q${i}" value="${v}"><span>${l}</span></label>`).join("")}</div></fieldset></div>`).join("");
    let shown = 0;
    form.addEventListener("change", () => {
      let sum = 0, n = 0;
      QUESTIONS.forEach((_, i) => { const v = form.querySelector(`input[name=q${i}]:checked`); if (v) { sum += +v.value; n++; } });
      const pct = Math.round((sum / 12) * 100);
      fill.style.width = pct + "%";
      if (G) { const o = { v: shown }; gsap.to(o, { v: pct, duration: 0.9, ease: "expo.out", onUpdate: () => (score.textContent = Math.round(o.v)) }); } else score.textContent = pct;
      shown = pct;
      word.textContent = n < 6 ? `${n} of 6 answered` : pct >= 75 ? "Ahead of the curve" : pct >= 40 ? "Getting there" : "Exposed";
      if (n === 6) {
        const v = $("#verdict");
        const [t, d] = pct >= 75
          ? ["You're ahead of most.", "The foundations are in place. Next is proving it: continuous certification of agents, and policies that check intent, not just permissions."]
          : pct >= 40
          ? ["Good foundations, real gaps.", "Some agents are governed and some aren't yet. A short identity assessment usually finds the standing keys and ownerless accounts worth fixing first."]
          : ["Your agents may have more access than your people.", "That's common right now, and fixable. Start with an inventory and owners, then move agents to short-lived, scoped credentials."];
        $("#verdictTitle").textContent = t; $("#verdictText").textContent = d;
        if (v.hidden) { v.hidden = false; if (G) gsap.from(v, { y: 30, opacity: 0, duration: 1, ease: "expo.out" }); }
      }
    });
  }

  /* reveals */
  function reveals() {
    const contactChars = $$(".contact__big [data-split]").map(splitChars);
    if (!G) return;
    const up = (sel, trig, extra = {}) => gsap.from(sel, { y: 40, opacity: 0, duration: 1.2, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: trig || sel, start: "top 85%" }, ...extra });
    up(".numbers__row li", ".numbers");
    up(".flow__head > *", ".flow__head");
    up(".scenarios__head > *", ".scenarios__head");
    up(".incident", ".incidents");
    up(".playbook__head > *", ".playbook__head");
    up(".about__text > *, .timeline li", ".about");
    gsap.from(".about__photo img", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".about", start: "top bottom", end: "bottom bottom", scrub: true } });
    up(".check__head > *", ".check__head");
    up(".q", ".quiz", { stagger: 0.05 });
    up(".cover__grid > div > *, .facts li", ".cover__grid");
    gsap.from(contactChars.flat(), { yPercent: 105, duration: 1.3, stagger: 0.025, ease: "expo.out", scrollTrigger: { trigger: ".contact", start: "top 70%" } });
    up(".contact__lede, .contact__ctas", ".contact__lede");
  }

  /* ===================== IAM motion layer ===================== */
  function rnd(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
  // fingerprint ridges: concentric warped loops broken into segments
  function fingerprint(cx, cy, n, step, seed = 7) {
    const R = rnd(seed), out = [];
    for (let i = 1; i <= n; i++) {
      const rx = step * (i + 0.6), ry = rx * 1.32, pts = [];
      const open = 0.35 + R() * 0.5; // gap at the bottom
      for (let a = -Math.PI / 2 + open; a <= Math.PI * 1.5 - open; a += 0.06) {
        const w = 1 + 0.05 * Math.sin(a * 3 + i * 0.7) + 0.03 * Math.sin(a * 7 - i);
        pts.push([cx + Math.cos(a + Math.PI) * rx * w, cy - Math.sin(a + Math.PI) * ry * w * -1]);
      }
      // split into dashes with small breaks
      let seg = [];
      pts.forEach((p, k) => {
        seg.push(p);
        if ((R() < 0.035 && seg.length > 6) || k === pts.length - 1) {
          out.push("M" + seg.map((q) => q[0].toFixed(1) + " " + q[1].toFixed(1)).join("L"));
          seg = [];
        }
      });
    }
    return out;
  }
  const svgPaths = (list, cls) => list.map((d) => `<path class="${cls}" d="${d}"/>`).join("");
  function drawOn(els, opts = {}) {
    els.forEach((el) => { const L = el.getTotalLength ? el.getTotalLength() : 100; el.style.strokeDasharray = L; el.style.strokeDashoffset = G ? L : 0; });
    if (G) return gsap.to(els, { strokeDashoffset: 0, duration: 1.6, stagger: 0.02, ease: "power2.inOut", ...opts });
  }

  /* 1. Face ID style verification on the hero photo */
  function faceId() {
    const box = $("#faceid"), tag = $("#faceTag"), txt = $("#faceText"), mesh = $(".faceid__mesh", box);
    const R = rnd(11), pts = [];
    for (let i = 0; i < 18; i++) { const a = R() * 6.283, r = Math.sqrt(R()) * 46; pts.push([50 + Math.cos(a) * r * 0.85, 50 + Math.sin(a) * r]); }
    let h = "";
    pts.forEach((p, i) => pts.forEach((q, j) => { if (j > i && Math.hypot(p[0] - q[0], p[1] - q[1]) < 26) h += `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}"/>`; }));
    pts.forEach((p) => (h += `<circle cx="${p[0]}" cy="${p[1]}" r=".9"/>`));
    mesh.innerHTML = h;
    if (!G) { box.style.opacity = 1; box.classList.add("is-ok"); tag.classList.add("is-ok"); tag.style.opacity = 1; txt.textContent = "Verified · human · passkey"; return; }
    const cs = $$(".faceid__c", box), scan = $(".faceid__scan", box);
    const off = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
    const tl = gsap.timeline({ delay: 1.9, repeat: -1, repeatDelay: 6 });
    tl.call(() => { box.classList.remove("is-ok"); tag.classList.remove("is-ok"); txt.textContent = "Scanning face"; })
      .set(box, { opacity: 1 })
      .fromTo(cs, { x: (i) => off[i][0] * 26, y: (i) => off[i][1] * 26, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.8, ease: "expo.out", stagger: 0.04 })
      .fromTo(tag, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5 }, "<")
      .fromTo(scan, { top: "0%", opacity: 1 }, { top: "100%", duration: 0.9, ease: "power1.inOut", yoyo: true, repeat: 1 })
      .fromTo($$("line, circle", mesh), { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.008 }, "<0.2")
      .set(scan, { opacity: 0 })
      .call(() => { txt.textContent = "Checking passkey"; })
      .to({}, { duration: 0.6 })
      .call(() => { box.classList.add("is-ok"); tag.classList.add("is-ok"); txt.textContent = "Verified · human · passkey"; })
      .fromTo(cs, { scale: 1 }, { scale: 1.12, duration: 0.18, yoyo: true, repeat: 1 })
      .to($$("line, circle", mesh), { opacity: 0, duration: 0.6 }, "+=0.6")
      .to(box, { opacity: 0, duration: 0.8 }, "+=1.6")
      .to(tag, { opacity: 0, duration: 0.6 }, "<");
  }

  /* 2. One identity splits into 109 behind the statement */
  function split() {
    const cv = $("#split"), ctx = cv.getContext("2d"), sec = $(".statement");
    let W, H, p = 0;
    const R = rnd(5), dots = [];
    for (let i = 0; i < 109; i++) dots.push({ a: i * 2.39996, k: Math.sqrt((i + 0.5) / 109), agent: i % 4 === 0, d: R() * 0.25 });
    function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); draw(); }
    function draw() {
      if (!W) return;
      ctx.clearRect(0, 0, W, H);
      const ox = W / 2, oy = H * 0.5, RX = W * 0.47, RY = H * 0.44;
      const n = Math.round(Math.min(1, p / 0.6) * 109);
      for (let i = 0; i < 109; i++) {
        const d = dots[i];
        const t = Math.max(0, Math.min(1, (p * 1.5 - d.d - i / 109 * 0.6) / 0.5));
        if (t <= 0) continue;
        const e = 1 - Math.pow(1 - t, 3);
        const x = ox + Math.cos(d.a) * RX * d.k * e, y = oy + Math.sin(d.a) * RY * d.k * e;
        if (i % 3 === 0) { ctx.strokeStyle = d.agent ? "rgba(30,63,224,.16)" : "rgba(14,24,56,.07)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(x, y); ctx.stroke(); }
        ctx.fillStyle = d.agent ? "rgba(30,63,224,.75)" : "rgba(14,24,56,.32)";
        if (d.agent) { ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 4, y); ctx.fill(); }
        else ctx.fillRect(x - 2, y - 2, 4, 4);
      }
      // the one human at the origin
      ctx.fillStyle = "#1e3fe0"; ctx.beginPath(); ctx.arc(ox, oy, 6 + 3 * (1 - Math.min(1, p * 3)), 0, 6.283); ctx.fill();
      ctx.strokeStyle = "rgba(30,63,224,.35)"; ctx.beginPath(); ctx.arc(ox, oy, 16, 0, 6.283); ctx.stroke();
      ctx.font = "11px JetBrains Mono, monospace"; ctx.fillStyle = "rgba(14,24,56,.55)"; ctx.textAlign = "center";
      if (n > 0) ctx.fillText(`1 human  ·  ${n} machine identities`, ox, H - 28);
    }
    size(); addEventListener("resize", size);
    if (G) ScrollTrigger.create({ trigger: sec, start: "top 85%", end: "bottom 40%", onUpdate: (s) => { p = s.progress; draw(); } });
    else { p = 1; draw(); }
  }

  /* 3. Animated icons on the access-request cards + travelling token */
  const ICONS = [
    // Discover: radar
    `<circle class="s" cx="40" cy="40" r="34"/><circle class="s" cx="40" cy="40" r="22"/><circle class="s" cx="40" cy="40" r="10"/>
     <g class="sweep"><path d="M40 40 L74 40 A34 34 0 0 0 64 16 Z" fill="rgba(30,63,224,.16)"/><line class="b" x1="40" y1="40" x2="74" y2="40"/></g>
     <circle class="f blip" cx="58" cy="26" r="3"/><circle class="f blip" cx="24" cy="54" r="3"/><circle class="f blip" cx="61" cy="56" r="3"/>
     <path class="s" d="M88 30h24M88 40h18M88 50h22"/>`,
    // Authenticate: fingerprint + scan
    () => `<g>${svgPaths(fingerprint(40, 40, 7, 4.2, 3), "s")}</g><line class="b fpscan" x1="12" y1="8" x2="68" y2="8"/>
     <rect class="s" x="86" y="22" width="26" height="36" rx="6"/><path class="b" d="M93 40l4 4 8-9"/>`,
    // Authorize: key + scope brackets
    `<circle class="s" cx="20" cy="40" r="11"/><circle class="f" cx="20" cy="40" r="3"/><path class="s" d="M31 40H70M58 40v8M66 40v6"/>
     <g class="br-l"><path class="b" d="M88 20h-6v40h6"/></g><g class="br-r"><path class="b" d="M106 20h6v40h-6"/></g>
     <path class="s" d="M92 32h10M92 40h10M92 48h10"/><path class="b" d="M92 40h10"/>`,
    // Approve: agent -> pause -> person
    `<rect class="s" x="4" y="28" width="26" height="24" rx="6"/><circle class="f" cx="17" cy="40" r="3"/>
     <path class="s" d="M32 40h56" stroke-dasharray="3 4"/>
     <g class="pause"><path class="b" d="M55 33v14M65 33v14"/></g><g class="ok"><circle cx="60" cy="40" r="10" fill="#1f9d55"/><path d="M55 40l3.5 3.5 6.5-7" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>
     <circle class="s" cx="104" cy="31" r="7"/><path class="s" d="M91 56c2-9 7-13 13-13s11 4 13 13"/>`,
    // Audit: scrolling log lines
    `<defs><clipPath id="logclip"><rect x="0" y="6" width="120" height="68" rx="8"/></clipPath></defs>
     <rect class="s" x="0" y="6" width="120" height="68" rx="8"/>
     <g clip-path="url(#logclip)"><g class="logs">${[0,1,2,3,4,5,6,7].map((i) => `<path class="${i % 3 === 1 ? "b" : "s"}" d="M12 ${18 + i * 12}h${[70, 52, 84, 40, 64, 76, 48, 58][i]}"/><circle class="f" cx="104" cy="${18 + i * 12}" r="2"/>`).join("")}</g></g>`,
  ];
  const TOKEN = ["requesting access", "discovered · owner: finance", "authenticated · 15 min token", "scoped · read invoices only", "approved by controller", "logged · reviewed ✓"];
  let flowItems = [];
  function flowIcons() {
    flowItems = $$(".flow__list li");
    flowItems.forEach((li, i) => {
      const s = document.createElementNS(NS, "svg");
      s.setAttribute("class", "ico"); s.setAttribute("viewBox", "0 0 120 80"); s.setAttribute("aria-hidden", "true");
      s.innerHTML = typeof ICONS[i] === "function" ? ICONS[i]() : ICONS[i];
      li.insertBefore(s, $("h3", li));
    });
    if (G) {
      gsap.to(".br-l", { x: 6, duration: 1.4, yoyo: true, repeat: -1, ease: "power2.inOut" });
      gsap.to(".br-r", { x: -6, duration: 1.4, yoyo: true, repeat: -1, ease: "power2.inOut" });
      const strokes = $$(".flow .ico .s, .flow .ico .b").filter((e) => !e.classList.contains("fpscan") && !e.getAttribute("stroke-dasharray"));
      strokes.forEach((el) => { const L = el.getTotalLength(); el.style.strokeDasharray = L; el.style.strokeDashoffset = L; });
      ScrollTrigger.create({ trigger: ".flow", start: "top 70%", once: true, onEnter: () => gsap.to(strokes, { strokeDashoffset: 0, duration: 1.8, stagger: 0.01, ease: "power2.inOut" }) });
    }
  }
  function flowProg(p) {
    $("#flowBar").style.width = p * 100 + "%";
    const tok = $("#token"), bar = tok.parentElement;
    tok.style.left = Math.max(0, p * (bar.clientWidth - tok.offsetWidth)) + "px";
    const stage = p < 0.04 ? 0 : Math.min(5, 1 + Math.floor((p - 0.04) / 0.96 * 5));
    $("#tokenSt").textContent = TOKEN[stage];
    tok.classList.toggle("is-done", stage === 5);
    flowItems.forEach((li, i) => li.classList.toggle("is-pass", i < stage));
  }

  /* 4. Padlocks that close as each control locks in */
  function locks() {
    $$(".rules li").forEach((li) => {
      const s = document.createElementNS(NS, "svg");
      s.setAttribute("class", "lock"); s.setAttribute("viewBox", "0 0 30 36"); s.setAttribute("aria-hidden", "true");
      s.innerHTML = `<path class="sh" d="M8 17V11a7 7 0 0 1 14 0v6"/><rect class="body" x="3" y="16" width="24" height="18" rx="5"/><circle class="kh" cx="15" cy="25" r="2.2"/>`;
      li.insertBefore(s, $("h3", li));
      if (G) ScrollTrigger.create({ trigger: li, start: "top 85%", end: "top 45%", onUpdate: (st) => li.classList.toggle("is-locked", st.progress > 0.97), onLeave: () => li.classList.add("is-locked"), onEnterBack: () => {} });
      else li.classList.add("is-locked");
    });
  }

  /* 5. Kickers decrypt as they enter */
  function decrypt() {
    if (!G) return;
    const GL = "0123456789ABCDEF#$%&*/<>";
    $$(".kicker").forEach((k) => {
      if (k.closest(".hero")) return;
      const text = k.textContent;
      ScrollTrigger.create({ trigger: k, start: "top 90%", once: true, onEnter: () => {
        let f = 0;
        (function tick() {
          let h = "";
          for (let i = 0; i < text.length; i++) h += f > i * 1.2 + 4 || text[i] === " " ? text[i] : `<span class="g">${GL[(Math.random() * GL.length) | 0]}</span>`;
          k.innerHTML = h;
          if (f++ < text.length * 1.2 + 6) requestAnimationFrame(tick); else k.textContent = text;
        })();
      } });
    });
  }

  /* 6. Fingerprint drawing behind the contact headline */
  function contactPrint() {
    const svg = $("#contactFp");
    svg.innerHTML = svgPaths(fingerprint(0, 0, 18, 8.4, 21), "");
    const ps = $$("path", svg);
    ps.forEach((el) => { const L = el.getTotalLength(); el.style.strokeDasharray = L; el.style.strokeDashoffset = G ? L : 0; });
    if (G) gsap.to(ps, { strokeDashoffset: 0, ease: "none", stagger: 0.004, scrollTrigger: { trigger: ".contact", start: "top 85%", end: "center 50%", scrub: 0.6 } });
  }

  dots(); hero(); sphere(); passkey(); tokenSnap(); decisionLog(); faceId(); expertise(); statement(); split(); counters(); flowIcons(); flow(); cases(); playbook(); locks(); check(); reveals(); decrypt(); contactPrint();
  addEventListener("load", () => G && ScrollTrigger.refresh());
  { const nav = document.getElementById("nav"), onS = () => nav.classList.toggle("is-scrolled", scrollY > 40); addEventListener("scroll", onS, { passive: true }); onS(); }
})();
