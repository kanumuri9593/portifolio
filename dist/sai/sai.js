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
        ctx.fillStyle = k > 0.02 ? `rgba(30,63,224,${0.18 + k * 0.7})` : "rgba(15,16,19,.13)";
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
      .from(".hero__meta > *, .nav > *", { y: 16, opacity: 0, duration: 1, stagger: 0.06 }, 0.9);
    // scroll: name spreads apart, photo lifts and scales
    const st = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
    chars.forEach((cs) => cs.forEach((c, i) => {
      const mid = (cs.length - 1) / 2;
      gsap.to(c, { x: () => (i - mid) * innerWidth * 0.018, ease: "none", scrollTrigger: st });
    }));
    gsap.to(".hero__name", { yPercent: -30, opacity: 0.15, ease: "none", scrollTrigger: st });
    gsap.to(".hero__photo", { scale: 1.08, yPercent: 6, ease: "none", scrollTrigger: st });
    gsap.to(".hero__meta", { opacity: 0, y: -30, ease: "none", scrollTrigger: { ...st, end: "30% top" } });
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
        onUpdate: (s) => ($("#flowBar").style.width = s.progress * 100 + "%"),
      } });
      return () => tw.scrollTrigger.kill();
    });
    mm.add("(max-width: 899px)", () => {
      const list = $(".flow__list");
      list.style.flexDirection = "column"; list.style.width = "auto";
      $$(".flow__list li").forEach((li) => { li.style.width = "auto"; gsap.from(li, { y: 50, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: li, start: "top 90%" } }); });
      ScrollTrigger.create({ trigger: list, start: "top 70%", end: "bottom 70%", onUpdate: (s) => ($("#flowBar").style.width = s.progress * 100 + "%") });
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

  dots(); hero(); statement(); counters(); flow(); cases(); playbook(); check(); reveals();
  addEventListener("load", () => G && ScrollTrigger.refresh());
})();
