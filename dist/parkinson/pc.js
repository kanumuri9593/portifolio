/* Parkinson Consulting — interactions. No framework, no build step. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  $("#yr").textContent = new Date().getFullYear();
  requestAnimationFrame(() => document.body.classList.add("is-ready"));

  /* ---------- reveal on scroll ---------- */
  const rio = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("is-in"); rio.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px" });
  const watchReveals = () => $$(".reveal:not(.is-in)").forEach((el) => rio.observe(el));

  /* ---------- header: drawer, active link, paper mode ---------- */
  const top = $("#top"), burger = $("#burger"), drawer = $("#drawer");
  const setDrawer = (open) => {
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    drawer.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setDrawer(drawer.hidden));
  drawer.addEventListener("click", (e) => { if (e.target.closest("a")) setDrawer(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !drawer.hidden) setDrawer(false); });

  const navLinks = $$(".top__nav a");
  const sio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle("is-on", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  ["hyprlayer", "studio", "services", "work", "about", "contact"].forEach((id) => sio.observe(document.getElementById(id)));

  const studioEl = $("#studio");
  const paperCheck = () => {
    const r = studioEl.getBoundingClientRect();
    top.classList.toggle("is-paper", r.top < 44 && r.bottom > 44);
  };
  addEventListener("scroll", paperCheck, { passive: true });
  paperCheck();

  /* ---------- hero field: dot grid with agents walking the lines ---------- */
  const field = $("#field");
  (() => {
    const ctx = field.getContext("2d");
    const G = 28;
    let w, h, dpr, cols, rows, agents = [], running = false, mx = -999, my = -999, t0 = 0;
    const colors = ["255,122,47", "143,180,255", "111,227,165"];
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = field.clientWidth; h = field.clientHeight;
      field.width = w * dpr; field.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / G) + 1; rows = Math.ceil(h / G) + 1;
      const n = Math.round(Math.min(18, Math.max(7, (w * h) / 60000)));
      agents = Array.from({ length: n }, spawn);
    };
    function spawn() {
      const horiz = Math.random() < .5;
      return { x: Math.floor(Math.random() * cols) * G, y: Math.floor(Math.random() * rows) * G,
        dx: horiz ? (Math.random() < .5 ? 1 : -1) : 0, dy: horiz ? 0 : (Math.random() < .5 ? 1 : -1),
        v: .6 + Math.random() * .9, c: colors[Math.floor(Math.random() * (Math.random() < .6 ? 1 : 3))], trail: [] };
    }
    const step = (a) => {
      a.x += a.dx * a.v; a.y += a.dy * a.v;
      const onX = Math.abs(a.x / G - Math.round(a.x / G)) < a.v / G, onY = Math.abs(a.y / G - Math.round(a.y / G)) < a.v / G;
      if (onX && onY && Math.random() < .14) {
        a.x = Math.round(a.x / G) * G; a.y = Math.round(a.y / G) * G;
        if (a.dx) { a.dy = Math.random() < .5 ? 1 : -1; a.dx = 0; } else { a.dx = Math.random() < .5 ? 1 : -1; a.dy = 0; }
      }
      a.trail.push(a.x, a.y); if (a.trail.length > 90) a.trail.splice(0, 2);
      if (a.x < -G * 2 || a.x > w + G * 2 || a.y < -G * 2 || a.y > h + G * 2) Object.assign(a, spawn(), { trail: [] });
    };
    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const x = i * G, y = j * G, d = Math.hypot(x - mx, y - my);
        const near = d < 140 ? 1 - d / 140 : 0;
        ctx.fillStyle = `rgba(236,235,230,${0.07 + near * .4})`;
        ctx.fillRect(x - .75 - near, y - .75 - near, 1.5 + near * 2, 1.5 + near * 2);
      }
      for (const a of agents) {
        if (!reduce) step(a);
        const tr = a.trail;
        for (let k = 2; k < tr.length; k += 2) {
          ctx.strokeStyle = `rgba(${a.c},${(k / tr.length) * .55})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(tr[k - 2], tr[k - 1]); ctx.lineTo(tr[k], tr[k + 1]); ctx.stroke();
        }
        ctx.fillStyle = `rgba(${a.c},1)`;
        ctx.shadowColor = `rgba(${a.c},.9)`; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(a.x, a.y, 1.8, 0, 7); ctx.fill();
        ctx.shadowBlur = 0;
      }
    };
    const loop = (t) => { if (!running) return; draw(t); requestAnimationFrame(loop); };
    const start = () => { if (running || document.hidden) return; running = true; requestAnimationFrame(loop); };
    const stop = () => { running = false; };
    size();
    addEventListener("resize", () => { size(); if (!running) draw(0); });
    field.parentElement.addEventListener("pointermove", (e) => { const r = field.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    field.parentElement.addEventListener("pointerleave", () => { mx = my = -999; });
    if (reduce) { for (const a of agents) for (let i = 0; i < 60; i++) step(a); draw(0); return; }
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(field);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  })();

  /* ---------- hero console: a spec compiles into traced software ---------- */
  (() => {
    const SPECS = [
      { file: "spec/release-readiness.spec", lines: [
        "spec      release-readiness  v3.2",
        "when      change.merged -> main",
        "require   tests.contract >= baseline",
        "          review.senior == approved",
        "          agent.sandbox == enforced",
        "trace     change-control CC-114" ],
        hits: [0, 1, 2, 3, 4],
        out: ["<b>✓</b> contract + integration tests generated", "<b>✓</b> senior review: approved, 0 unreviewed merges", "<b>→</b> evidence traced to CC-114"] },
      { file: "contracts/feed.pricing.daily.spec", lines: [
        "contract  feed.pricing.daily  v1.4",
        "schema    id:uuid  px:decimal  ts:utc",
        "quality   null(px) == 0",
        "on_drift  quarantine at ingestion",
        "owner     data-steward:markets",
        "lineage   publish -> catalog" ],
        hits: [0, 1, 2, 3, 5],
        out: ["<b>✓</b> ingestion, validation, transforms generated", "<b>✓</b> schema drift caught at the boundary", "<b>→</b> lineage published to catalog"] },
      { file: "rules/connector.capacity.spec", lines: [
        "rule      connector.capacity  §4.2",
        "given     material, grade, fastener",
        "then      allowable = table(4.2)",
        "verify    golden-record vs legacy",
        "signoff   domain.engineering",
        "docs      generate from spec" ],
        hits: [0, 1, 2, 3, 5],
        out: ["<b>✓</b> calculation service + API contract generated", "<b>✓</b> outputs match legacy on golden records", "<b>→</b> every rule traced to §4.2"] },
    ];
    const code = $("#consoleCode"), lane = $$("#consoleLane li"), out = $("#consoleOut"), file = $("#consoleFile");
    const hl = (s) => esc(s)
      .replace(/^(\S+)/, '<span class="k">$1</span>')
      .replace(/(v\d[\d.]*|§[\d.]+|CC-\d+)/g, '<span class="s">$1</span>')
      .replace(/(== \S+|&gt;= \S+|-&gt; \S+)/g, '<span class="v">$1</span>');
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(code);
    const until = async () => { while (!visible || document.hidden) await wait(300); };

    const renderStatic = (s) => {
      file.textContent = s.file;
      code.innerHTML = s.lines.map((l) => `<span class="ln">${hl(l)}</span>`).join("");
      lane.forEach((li) => li.classList.add("is-done"));
      out.innerHTML = s.out.map((o) => `<div>${o}</div>`).join("");
    };
    if (reduce) return renderStatic(SPECS[0]);

    (async function run(i = 0) {
      const s = SPECS[i % SPECS.length];
      await until();
      file.textContent = s.file;
      code.innerHTML = ""; out.innerHTML = "";
      lane.forEach((li) => li.classList.remove("is-on", "is-done"));
      const lines = [];
      for (const l of s.lines) {
        const el = document.createElement("span"); el.className = "ln"; code.appendChild(el); lines.push(el);
        const caret = '<i class="caret"></i>';
        for (let c = 1; c <= l.length; c += 2) { el.innerHTML = esc(l.slice(0, c)) + caret; await wait(16); }
        el.innerHTML = hl(l);
        await wait(70);
      }
      await wait(350);
      for (let k = 0; k < lane.length; k++) {
        await until();
        lane[k].classList.add("is-on");
        lines.forEach((el, j) => el.classList.toggle("is-hit", j === s.hits[k]));
        if (k >= 2) { const d = document.createElement("div"); d.innerHTML = s.out[k - 2]; out.appendChild(d); }
        await wait(720);
        lane[k].classList.replace("is-on", "is-done");
      }
      lines.forEach((el) => el.classList.remove("is-hit"));
      await wait(2600);
      run(i + 1);
    })();
  })();

  /* ---------- Hyprlayer loop ---------- */
  (() => {
    const names = ["Capture", "Validate", "Generate", "Verify", "Evolve"];
    const g = $("#ringNodes"), prog = $("#ringProg"), packet = $("#ringPacket");
    const R = 150, C = 200;
    const pos = (i) => { const a = -Math.PI / 2 + (i / 5) * Math.PI * 2; return [C + R * Math.cos(a), C + R * Math.sin(a), a]; };
    g.innerHTML = names.map((n, i) => {
      const [x, y, a] = pos(i);
      const lx = C + (R + 34) * Math.cos(a), ly = C + (R + 34) * Math.sin(a) + 4;
      const anchor = Math.abs(Math.cos(a)) < .2 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
      return `<g class="loop__node" data-i="${i}"><circle cx="${x}" cy="${y}" r="8"/><text x="${lx}" y="${ly}" text-anchor="${anchor}">${n}</text></g>`;
    }).join("");
    const nodes = $$(".loop__node", g), steps = $$(".step");
    let cur = -1, pAng = -Math.PI / 2, target = -Math.PI / 2, raf;
    const set = (i) => {
      if (i === cur) return; cur = i;
      nodes.forEach((n, j) => { n.classList.toggle("is-on", j === i); n.classList.toggle("is-done", j < i); });
      steps.forEach((s, j) => s.classList.toggle("is-on", j === i));
      prog.style.strokeDasharray = `${(i / 5) * 100 + (i === 4 ? 20 : 0)} 100`;
      $("#ringNum").textContent = "0" + (i + 1);
      $("#ringName").textContent = names[i];
      target = pos(i)[2];
      if (reduce) { pAng = target; place(); } else { cancelAnimationFrame(raf); raf = requestAnimationFrame(tween); }
    };
    const place = () => { packet.setAttribute("cx", C + R * Math.cos(pAng)); packet.setAttribute("cy", C + R * Math.sin(pAng)); };
    const tween = () => { pAng += (target - pAng) * .12; place(); if (Math.abs(target - pAng) > .002) raf = requestAnimationFrame(tween); };
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) set(+e.target.dataset.i); }),
      { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach((s) => io.observe(s));
    set(0);
  })();

  /* ---------- One Energy Studio: live phone demo ---------- */
  (() => {
    const BIZ = {
      barber: { name: "Fade &amp; Co.", tag: "Barbershop · Jersey City", hero: "Sharp cuts,<br>no waiting.", sub: "Walk-ins welcome · Tue–Sun",
        bg: "#f6f3ee", ink: "#141210", card: "#ece6dc", acc: "#1d1b18", accOn: "#f6f3ee", accInk: "#1d1b18", soft: "#e2dacd",
        grad: "linear-gradient(160deg,#3b302a,#141210 70%)", cta: "Book a chair",
        menu: [["Signature cut", "45 min", "$35"], ["Skin fade", "50 min", "$40"], ["Beard sculpt", "25 min", "$20"]],
        l1: ["Booking", "Customers book themselves, 24/7"], l2: ["Waitlist", "Live place in line, no crowded lobby"],
        reward: "3 more cuts to a free one", unit: "cuts", kpi: [["64%", "repeat clients"], ["Sat 11a", "busiest hour"], ["$1,240", "this week"], ["+18", "new clients"]] },
      food: { name: "Lucia’s Kitchen", tag: "Food truck · Catering", hero: "Pupusas, fresh<br>off the plancha.", sub: "Today at Exchange Place",
        bg: "#fff8f0", ink: "#2a1608", card: "#fdebd8", acc: "#e8551c", accOn: "#fff", accInk: "#b33d0d", soft: "#fbdcc0",
        grad: "linear-gradient(160deg,#f07a2a,#a3300b 75%)", cta: "Order pickup",
        menu: [["Revuelta pupusa", "pork, bean, cheese", "$4.50"], ["Loroco &amp; cheese", "vegetarian", "$4.50"], ["Catering tray", "serves 20", "$180"]],
        l1: ["Ordering", "Pickup orders, no app-store commission"], l2: ["Truck tracker", "Where the truck is, right now"],
        reward: "2 more orders to a free plate", unit: "orders", kpi: [["Revuelta", "top seller"], ["12:30p", "peak rush"], ["$2,980", "this week"], ["41%", "order again"]] },
      home: { name: "Brightline Electric", tag: "Licensed electrician · Hudson County", hero: "Safe wiring.<br>On time.", sub: "Licensed &amp; insured · Same-week visits",
        bg: "#f3f6fb", ink: "#0d1726", card: "#e3eaf5", acc: "#1f5eff", accOn: "#fff", accInk: "#1f4fd6", soft: "#d4e0fb",
        grad: "linear-gradient(160deg,#2b4f9e,#0d1726 75%)", cta: "Get a quote",
        menu: [["Panel upgrade", "100A → 200A", "Quote"], ["EV charger install", "Level 2", "Quote"], ["Lighting &amp; fixtures", "per visit", "from $120"]],
        l1: ["Quote requests", "Photos in, quote out, job booked"], l2: ["Job schedule", "Every job, crew and status in one place"],
        reward: "Refer a neighbour, both get $25", unit: "referrals", kpi: [["38%", "quote → job"], ["Google", "top lead source"], ["$640", "avg job value"], ["4.9★", "reviews"]] },
      fit: { name: "Northside Strength", tag: "Coaching · Small-group training", hero: "Get strong.<br>Stay consistent.", sub: "Classes from 6 am",
        bg: "#f1f7f1", ink: "#0f1f14", card: "#dfeee1", acc: "#15803d", accOn: "#fff", accInk: "#12672f", soft: "#cde6d1",
        grad: "linear-gradient(160deg,#1f7a46,#0f1f14 75%)", cta: "Book a class",
        menu: [["Strength foundations", "45 min · 8 spots", "Free 1st"], ["HIIT conditioning", "30 min", "Pass"], ["1:1 coaching", "60 min", "$85"]],
        l1: ["Class booking", "Book, cancel, check in from a phone"], l2: ["Packages", "10-class passes and memberships"],
        reward: "2 more classes to this month’s badge", unit: "classes", kpi: [["82%", "class fill rate"], ["6:00a", "fullest class"], ["91%", "member retention"], ["$4,120", "this month"]] },
    };
    const layerFns = [
      (b) => `<div class="scr__hero" style="background:${b.grad}"><span>${b.sub}</span><b>${b.hero}</b></div>
        <div class="scr__row"><span class="scr__btn scr__btn--o">Call</span><span class="scr__btn">${b.cta}</span></div>
        <div class="scr__list">${b.menu.map((m) => `<div class="scr__item"><span>${m[0]}<small>${m[1]}</small></span><b>${m[2]}</b></div>`).join("")}</div>`,
      (b, k) => ({
        barber: `<p class="scr__h">Book with Andre</p><p class="scr__sub">Signature cut · 45 min</p>
          <div class="scr__days">${["Tue 14", "Wed 15", "Thu 16", "Fri 17", "Sat 18"].map((d, i) => `<span class="${i === 2 ? "is-pick" : ""}">${d.split(" ")[0]}<b>${d.split(" ")[1]}</b></span>`).join("")}</div>
          <div class="scr__times">${["10:00", "10:45", "11:30", "1:15", "2:00", "3:30"].map((t, i) => `<span class="${i === 1 ? "is-off" : i === 3 ? "is-pick" : ""}">${t}</span>`).join("")}</div>
          <span class="scr__btn">Confirm Thu 1:15 pm</span>
          <div class="scr__toast"><i></i>Booked. Reminder set for 11:15 am.</div>`,
        food: `<p class="scr__h">Your order</p><p class="scr__sub">Pickup at the truck</p>
          <div class="scr__list"><div class="scr__item"><span>2 × Revuelta<small>extra curtido</small></span><b>$9.00</b></div><div class="scr__item"><span>1 × Loroco &amp; cheese</span><b>$4.50</b></div><div class="scr__item"><span>Horchata</span><b>$3.50</b></div></div>
          <span class="scr__btn">Pay $17.00 · ready 12:40</span>
          <div class="scr__toast"><i></i>Order in. We’ll text you when it’s up.</div>`,
        home: `<p class="scr__h">What do you need?</p><p class="scr__sub">Photos help us quote faster</p>
          <div class="scr__list"><div class="scr__item is-pick"><span>EV charger install<small>Garage · 30 ft from panel</small></span><b>✓</b></div><div class="scr__item"><span>Add 3 photos</span><b>＋</b></div><div class="scr__item"><span>Preferred visit<small>Weekday mornings</small></span><b>›</b></div></div>
          <span class="scr__btn">Request my quote</span>
          <div class="scr__toast"><i></i>Request sent. Quote on its way.</div>`,
        fit: `<p class="scr__h">This week</p><p class="scr__sub">Tap a class to save your spot</p>
          <div class="scr__days">${["Mon 13", "Tue 14", "Wed 15", "Thu 16", "Fri 17"].map((d, i) => `<span class="${i === 1 ? "is-pick" : ""}">${d.split(" ")[0]}<b>${d.split(" ")[1]}</b></span>`).join("")}</div>
          <div class="scr__list"><div class="scr__item is-pick"><span>6:00 am · Strength<small>Coach Dana · 2 spots left</small></span><b>✓</b></div><div class="scr__item"><span>12:15 pm · HIIT<small>5 spots</small></span><b>›</b></div></div>
          <div class="scr__toast"><i></i>You’re in. Check in with one tap.</div>`,
      })[k],
      (b, k) => ({
        barber: `<p class="scr__h">You’re in line</p><div class="scr__big"><b>3</b><small>people ahead · about 25 min</small></div>
          <div class="scr__bar"><i style="width:62%"></i></div>
          <div class="scr__list"><div class="scr__item"><span>Wait anywhere<small>Grab a coffee, we’ll text you</small></span><b>☕</b></div></div>
          <div class="scr__toast"><i></i>You’re next. Head over in 5.</div>`,
        food: `<p class="scr__h">Where’s the truck?</p><div class="scr__big"><small>Parked now</small><b style="font-size:30px">Exchange Pl.</b><small>until 3:00 pm</small></div>
          <div class="scr__list"><div class="scr__item"><span>Thu<small>Grove St PATH</small></span><b>11–3</b></div><div class="scr__item"><span>Sat<small>Riverview Farmers Market</small></span><b>9–2</b></div></div>
          <div class="scr__toast"><i></i>The truck is 2 blocks from you.</div>`,
        home: `<p class="scr__h">Today’s jobs</p><p class="scr__sub">3 jobs · 2 crews</p>
          <div class="scr__list"><div class="scr__item"><span>8:30 · Panel upgrade<small>Crew A · Newark Ave</small></span><span class="scr__pill">Done</span></div><div class="scr__item is-pick"><span>11:00 · EV charger<small>Crew B · en route</small></span><span class="scr__pill">Live</span></div><div class="scr__item"><span>2:30 · Fixtures<small>Crew A</small></span><span class="scr__pill">Next</span></div></div>
          <div class="scr__toast"><i></i>Customer notified: crew arriving 10:55.</div>`,
        fit: `<p class="scr__h">Choose a plan</p><p class="scr__sub">Cancel any time</p>
          <div class="scr__list"><div class="scr__item"><span>10-class pass<small>valid 3 months</small></span><b>$180</b></div><div class="scr__item is-pick"><span>Monthly unlimited<small>most flexible</small></span><b>$149</b></div><div class="scr__item"><span>Drop-in</span><b>$22</b></div></div>
          <span class="scr__btn">Start membership</span>`,
      })[k],
      (b) => `<p class="scr__h">Your rewards</p><p class="scr__sub">${b.reward}</p>
        <div class="scr__stamps">${Array.from({ length: 10 }, (_, i) => `<i class="${i < 7 ? "is-on" : ""}" style="animation-delay:${i * 60}ms">${i < 7 ? "✓" : ""}</i>`).join("")}</div>
        <div class="scr__list"><div class="scr__item"><span>Birthday treat<small>sent automatically</small></span><b>🎁</b></div><div class="scr__item"><span>Invite a friend<small>you both earn a reward</small></span><b>›</b></div></div>
        <div class="scr__toast"><i></i>7 of 10 ${b.unit}. You’re close.</div>`,
      (b) => `<p class="scr__h">This week</p><p class="scr__sub">Your business at a glance</p>
        <div class="scr__chart">${[42, 58, 50, 71, 88, 100, 64].map((v, i) => `<i style="height:${v}%;animation-delay:${i * 70}ms"></i>`).join("")}</div>
        <div class="scr__kpis">${b.kpi.map((k) => `<div><b>${k[0]}</b><small>${k[1]}</small></div>`).join("")}</div>`,
    ];
    const screen = $("#screen"), tabs = $$("#bizTabs button"), layerBtns = $$("#layers button");
    let biz = "barber", layer = 0, auto = !reduce, timer, inView = false;
    const render = () => {
      const b = BIZ[biz];
      Object.entries({ bg: b.bg, ink: b.ink, card: b.card, acc: b.acc, "acc-ink-on": b.accOn, "acc-ink": b.accInk, soft: b.soft })
        .forEach(([k, v]) => screen.style.setProperty("--bz-" + k, v));
      screen.innerHTML = `<div class="scr"><div class="scr__top"><span class="scr__logo"><i></i>${b.name}</span><span class="scr__pill">${layer === 0 ? "Open now" : ["", "Book", "Live", "Rewards", "Insights"][layer]}</span></div>${layerFns[layer](b, biz)}</div>`;
      layerBtns.forEach((x, i) => x.classList.toggle("is-on", i === layer));
      $("#l1").textContent = b.l1[0]; $("#l1s").textContent = b.l1[1];
      $("#l2").textContent = b.l2[0]; $("#l2s").textContent = b.l2[1];
    };
    const tick = () => { clearTimeout(timer); if (!auto || !inView) return; timer = setTimeout(() => { layer = (layer + 1) % 5; render(); tick(); }, 3600); };
    tabs.forEach((t) => t.addEventListener("click", () => {
      tabs.forEach((x) => x.setAttribute("aria-selected", x === t)); biz = t.dataset.biz; layer = 0; render(); tick();
    }));
    layerBtns.forEach((x, i) => x.addEventListener("click", () => { auto = false; clearTimeout(timer); layer = i; render(); }));
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; tick(); }, { threshold: .35 }).observe(screen);
    render();
  })();

  /* ---------- Services ---------- */
  const SERVICES = [
    { id: "agentic", t: "Agentic Development & AI Engineering", s: "Agents across planning, coding, testing, review and operations, with guardrails and human approval.",
      d: [["Agentic delivery pipelines", "Agents draft code, generate tests, migrate code and prepare release notes inside your existing CI/CD."], ["Guardrails & human-in-the-loop", "Policy boundaries, sandboxed tools and senior review at defined checkpoints."], ["Evaluation & quality gates", "Harnesses that measure agent output against specs and regression suites."], ["Enterprise AI enablement", "Tooling standards, spec conventions, review workflows and training."], ["RAG & knowledge systems", "Assistants grounded in your code and documentation, with access controls and citations."], ["Legacy acceleration", "Agent-assisted analysis of COBOL, mainframe and monolithic systems to shorten discovery."]] },
    { id: "e2e", t: "End-to-End Project Delivery", s: "One accountable team owns discovery, architecture, build, test, deploy and what comes after.",
      d: [["Concept to production", "Ideation, requirements, architecture, sprints, QA and deployment."], ["Greenfield & brownfield", "New builds, or enhancement and modernization of what you run today."], ["Single accountable team", "One partner and one delivery commitment instead of a vendor chain."], ["Post-launch optimization", "Ongoing support, performance tuning and enhancements."]] },
    { id: "vision", t: "Strategic Vision & Advisory", s: "Enterprise technology strategy, roadmaps and alignment across business units.",
      d: [["Enterprise vision creation", "Workshops and stakeholder sessions that define a long-term technology vision."], ["Cross-vertical alignment", "One roadmap across business units, drawing on Healthcare, Finance, Manufacturing and Airlines experience."], ["Roadmap & governance", "Milestones, investment priorities and governance frameworks."], ["Financial optimization & ROI", "Prioritized investment and less redundant spend."]] },
    { id: "dotnet", t: ".NET Development", s: "From desktop applications to cloud-native microservices.",
      d: [["ASP.NET Core & Web APIs", "Web apps and RESTful APIs with ASP.NET Core, Blazor and modern .NET."], ["Enterprise applications", "Large-scale desktop and cross-platform apps."], ["Microservices", "Distributed systems on .NET, Docker, Kubernetes and Azure Service Fabric."], [".NET modernization", ".NET Framework applications moved to .NET 8+."]],
      tech: ["ASP.NET Core", "Blazor", "WPF", "WinForms", ".NET MAUI", "Docker", "Kubernetes", "Azure Service Fabric"] },
    { id: "java", t: "Java & Spring Solutions", s: "Enterprise Java on Spring and Jakarta EE.",
      d: [["Spring Boot applications", "Production-ready apps with Spring Boot, Security and Data."], ["Enterprise Java (Jakarta EE)", "Large systems with JPA, JMS and integration patterns."], ["Spring Cloud microservices", "Distributed and event-driven architectures."], ["JVM performance", "GC tuning, memory profiling and monitoring."]],
      tech: ["Spring Boot", "Spring Cloud", "Spring Security", "Spring Data", "Jakarta EE", "JPA", "JMS", "Netflix OSS"] },
    { id: "python", t: "Python Solutions", s: "Web applications, data engineering, AI and automation.",
      d: [["Web applications", "Scalable apps with Django, Flask and FastAPI."], ["Data engineering", "ETL pipelines and data processing."], ["Machine learning & AI", "Model development, deployment and MLOps."], ["Automation", "Business process automation, integrations and DevOps tooling."]],
      tech: ["Django", "Flask", "FastAPI", "Pandas", "PySpark", "Airflow", "scikit-learn", "TensorFlow", "PyTorch"] },
    { id: "cloud", t: "Cloud & Azure Services", s: "Architecture, migration and optimization across Azure, AWS and multi-cloud.",
      d: [["Cloud migration", "On-premises workloads moved with minimal disruption."], ["Azure architecture", "Secure, scalable designs on the Azure Well-Architected Framework."], ["Multi-cloud strategy", "Hybrid and multi-cloud for flexibility and lower risk."], ["Cost optimization", "Right-sizing, reserved instances and FinOps practice."]],
      tech: ["Azure", "AWS", "GCP"] },
    { id: "sap", t: "SAP & Enterprise Integrations", s: "SAP implementation, migration, integration and hosting.",
      d: [["S/4HANA migration", "ECC to S/4HANA, including process and data migration."], ["SAP integration services", "SAP connected to the rest of your estate."], ["Custom ABAP", "Enhancements, reports and Fiori apps."], ["SAP on cloud", "Azure, AWS or Google Cloud with high availability and disaster recovery."]],
      tech: ["SAP S/4HANA", "SAP Integration Suite", "ABAP", "SAP Fiori"] },
    { id: "mobile", t: "Mobile Development", s: "Native and cross-platform apps for iOS and Android.",
      d: [["iOS & Android native", "Swift/SwiftUI and Kotlin."], ["Cross-platform", "One codebase, more platforms, lower cost."], ["Enterprise mobility", "MDM integration, offline use and backend sync."], ["App modernization", "Legacy mobile apps brought up to date."]],
      tech: ["Swift", "SwiftUI", "Kotlin", "React Native", "Flutter", ".NET MAUI"] },
    { id: "legacy", t: "Legacy Modernization", s: "Mainframe, COBOL and monoliths moved to modern platforms, business logic intact.",
      d: [["Mainframe migration", "AS/400, mainframe and COBOL, with automated code conversion and testing."], ["Replatforming", "Applications moved to cloud containers with minimal code change."], ["Monolith to microservices", "Decomposition with domain-driven design."], ["Database modernization", "Modern SQL or NoSQL platforms, with data validation."]] },
    { id: "pm", t: "Project Management", s: "Expert-led management of complex, multi-stakeholder programs.",
      d: [["Complex problem solving", "Big challenges broken into workstreams with clear ownership."], ["Agile & hybrid delivery", "Agile transformation, Scrum, SAFe and hybrid methods."], ["Program & portfolio", "Multiple projects coordinated, portfolios prioritized."], ["Vendor & stakeholder", "Third parties, contracts, risk and communication handled."]],
      tech: ["Scrum", "SAFe", "Agile", "Hybrid"] },
    { id: "data", t: "Data Engineering & Architecture", s: "Enterprise data platforms, pipelines, BI and governance.",
      d: [["Enterprise data architecture", "Scalable, compliant data platforms."], ["Pipeline engineering", "ETL/ELT for real-time and batch."], ["BI & analytics", "Dashboards, self-service analytics and executive reporting."], ["Governance & quality", "MDM, cataloging, lineage and quality frameworks for regulated industries."]],
      tech: ["Snowflake", "Azure Synapse", "Databricks", "Redshift", "Azure Data Factory", "Informatica", "Spark", "Airflow", "Power BI", "Tableau", "Looker"] },
    { id: "devops", t: "DevOps & CI/CD", s: "Automated pipelines, infrastructure as code and reliability practice.",
      d: [["CI/CD pipelines", "Automated build, test and deploy."], ["Containers & Kubernetes", "Containerization, orchestration and service mesh."], ["Infrastructure as code", "Repeatable, reviewable infrastructure."], ["Site reliability engineering", "Observability, incident management and reliability work."]],
      tech: ["Azure DevOps", "GitHub Actions", "Jenkins", "Docker", "Kubernetes", "Terraform", "ARM", "Pulumi", "Ansible"] },
  ];
  const svc = $("#svcList");
  svc.innerHTML = SERVICES.map((s, i) => `
    <div class="svc__item reveal" id="${s.id}">
      <button class="svc__head" aria-expanded="false" aria-controls="svc-${s.id}">
        <span class="svc__n">${String(i + 1).padStart(2, "0")}</span>
        <span class="svc__t">${esc(s.t)}<small>${esc(s.s)}</small></span>
        <span class="svc__plus" aria-hidden="true"></span>
      </button>
      <div class="svc__body" id="svc-${s.id}"><div class="svc__inner">
        <div class="svc__cols">${s.d.map((d) => `<div><b>${esc(d[0])}</b><p>${esc(d[1])}</p></div>`).join("")}</div>
        ${s.tech ? `<div class="svc__tech">${s.tech.map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
      </div></div>
    </div>`).join("");
  const openSvc = (item, open) => { item.classList.toggle("is-open", open); $(".svc__head", item).setAttribute("aria-expanded", open); };
  svc.addEventListener("click", (e) => {
    const h = e.target.closest(".svc__head"); if (!h) return;
    const item = h.parentElement; openSvc(item, !item.classList.contains("is-open"));
  });
  const hashOpen = () => { const el = location.hash && svc.querySelector(location.hash); if (el) openSvc(el, true); };
  addEventListener("hashchange", hashOpen); hashOpen();

  /* ---------- Case studies ---------- */
  const CASES = [
    { id: "simpson-strong-tie", client: "Simpson Strong-Tie", kind: "Product engineering", t: "Rebuilding a product engineering platform on executable specifications",
      m: [["~3x", "faster feature delivery"], ["100%", "of rules traced to spec"], ["65%", "less regression effort"], ["4 wks", "to recover legacy rules"]],
      c: "Two decades of structural engineering rules lived only in legacy code. Documentation had drifted, every change needed heavy manual regression, and new engineers took months to ramp.",
      a: "Agents extracted candidate rules from the legacy code; domain experts signed each one off into a versioned executable spec. Hyprlayer generated services, calculation engines, API contracts and tests, while golden-record tests compared every output to legacy results.",
      o: "The client now owns a specification asset. Every production rule traces to a reviewed clause, change impact is known before implementation, and new engineers learn from the spec.",
      tech: ["Hyprlayer", ".NET Core", "Azure SQL Server", "REST APIs", "Azure DevOps", "Conformance tests"] },
    { id: "american-airlines", client: "American Airlines", kind: "Operations platform", t: "Agent-assisted delivery for a mission-critical operations platform",
      m: [["~60%", "less manual QA effort"], ["~40%", "shorter delivery cycles"], ["~2x", "test coverage growth"], ["0", "unreviewed agent merges"]],
      c: "A high-throughput platform needed faster releases without weakening controls. Manual test authoring ate each sprint, and any AI approach had to meet strict security and change-control requirements.",
      a: "Agents joined the pipeline as governed participants: generating unit, contract and integration tests for review and scaffolding adapters against published contracts, inside sandboxed tooling. Senior reviewers approved every agent change before it reached a shared branch.",
      o: "Engineers spend their time on judgment, not boilerplate. Coverage rose, defects surface earlier, and every agent change carries a review trail. The approach was extended to other workstreams.",
      tech: ["Hyprlayer", "Java / Spring Boot", "Kubernetes", "CI/CD", "Contract testing", "Policy guardrails"] },
    { id: "sp-global", client: "S&P Global", kind: "Data platform", t: "Governed data pipelines generated from data contracts",
      m: [["~70%", "faster feed onboarding"], ["0", "undocumented pipelines"], ["~85%", "fewer drift incidents"], ["Always", "audit-ready lineage"]],
      c: "Onboarding a feed took weeks of custom pipeline work. Schema and quality expectations lived in tickets and spreadsheets, and upstream schema changes became downstream incidents.",
      a: "The data contract became the unit of work: schema, semantics, quality rules, SLAs and ownership in one spec. Agents generated ingestion, validation, transforms and lineage; violations are quarantined at the boundary.",
      o: "No feed reaches production without a contract. Drift is caught at ingestion, lineage stays current for audit, and engineering moved from plumbing to analytics.",
      tech: ["Hyprlayer", "Python", "Spark", "Airflow", "Data contracts", "Lineage & catalog"] },
    { id: "identity", client: "Regulated enterprise", kind: "with TechDemocracy", t: "Spec-driven identity and access modernization",
      m: [["~50%", "faster app onboarding"], ["1", "authoritative policy spec"], ["Real-time", "SoD conflict detection"], ["On demand", "audit evidence"]],
      c: "Access policy was spread across a large regulated estate. Entitlements were duplicated, certifications were manual, and segregation-of-duties conflicts were found at audit time.",
      a: "TechDemocracy’s identity expertise met Hyprlayer’s spec discipline: roles, entitlements, approvals and SoD constraints in one spec, from which agents generated connectors, policy and certification workflows.",
      o: "Identity governance became provable, not reconstructed. SoD conflicts are blocked before they happen and audit evidence comes from the same source that runs the system.",
      tech: ["Hyprlayer", "Enterprise IAM", "SCIM / SAML / OIDC", "Policy as code", "Cloud directory"] },
  ];
  (() => {
    const tabsEl = $("#caseTabs"), panel = $("#casePanel"), wrap = $(".cases");
    const DUR = 9000;
    let cur = 0, timer, auto = !reduce, inView = false;
    tabsEl.style.setProperty("--dur", DUR + "ms");
    tabsEl.innerHTML = CASES.map((c, i) => `<button role="tab" id="tab-${c.id}" aria-selected="${i === 0}" aria-controls="casePanel"><b>${esc(c.client)}</b><small>${esc(c.kind)}</small></button>`).join("");
    const btns = $$("button", tabsEl);
    const show = (i) => {
      cur = i; const c = CASES[i];
      btns.forEach((b, j) => b.setAttribute("aria-selected", j === i));
      panel.setAttribute("aria-labelledby", "tab-" + c.id);
      panel.innerHTML = `<article class="case" id="${c.id}">
        <p class="case__client">${esc(c.client)} <span>· ${esc(c.kind)}</span></p>
        <h3>${esc(c.t)}</h3>
        <div class="case__metrics">${c.m.map((m) => `<div><b>${esc(m[0])}</b><small>${esc(m[1])}</small></div>`).join("")}</div>
        <div class="case__cols"><div><h4>Challenge</h4><p>${esc(c.c)}</p></div><div><h4>Approach</h4><p>${esc(c.a)}</p></div><div><h4>Outcome</h4><p>${esc(c.o)}</p></div></div>
        <div class="case__tech">${c.tech.map((t) => `<span>${esc(t)}</span>`).join("")}</div></article>`;
      if (tabsEl.scrollWidth > tabsEl.clientWidth) tabsEl.scrollTo({ left: btns[i].offsetLeft - tabsEl.offsetLeft - (tabsEl.clientWidth - btns[i].offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
      tick();
    };
    const tick = () => { clearTimeout(timer); wrap.classList.toggle("is-paused", !auto); if (!auto || !inView) return; timer = setTimeout(() => show((cur + 1) % CASES.length), DUR); };
    btns.forEach((b, i) => b.addEventListener("click", () => { auto = false; show(i); }));
    new IntersectionObserver(([e]) => {
      const was = inView; inView = e.isIntersecting;
      if (inView && !was && auto) show(cur); else tick();
    }, { threshold: .3 }).observe(wrap);
    const fromHash = CASES.findIndex((c) => "#" + c.id === location.hash);
    show(fromHash > -1 ? fromHash : 0);
    if (fromHash > -1) { auto = false; tick(); }
  })();

  /* ---------- Contact ---------- */
  (() => {
    const INTERESTS = ["One Energy Studio (local business)", "Hyprlayer spec-driven development", ...SERVICES.map((s) => s.t), "Something else"];
    const chips = $("#chips"), form = $("#form"), msg = $("#formMsg");
    chips.innerHTML = INTERESTS.map((t) => `<button type="button" aria-pressed="false">${esc(t)}</button>`).join("");
    chips.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); });
    $$("[data-interest]").forEach((a) => a.addEventListener("click", () => {
      $$("button", chips).forEach((b) => { if (b.textContent === a.dataset.interest) b.setAttribute("aria-pressed", "true"); });
    }));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = new FormData(form);
      if (f.get("website")) return;
      let bad = false;
      ["name", "email", "message"].forEach((n) => {
        const el = form.elements[n];
        const ok = el.value.trim() && (n !== "email" || /^\S+@\S+\.\S+$/.test(el.value));
        el.classList.toggle("is-bad", !ok); if (!ok) bad = true;
      });
      if (bad) { msg.style.color = "#ff8a8a"; msg.textContent = "Please fill in your name, a valid email and a short message."; return; }
      const interests = $$("button[aria-pressed='true']", chips).map((b) => b.textContent);
      const data = { name: f.get("name").trim(), email: f.get("email").trim(), company: (f.get("company") || "").trim(), interests, message: f.get("message").trim() };
      msg.style.color = "";
      const endpoint = form.dataset.endpoint;
      if (endpoint) {
        try {
          const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
          if (!r.ok) throw 0;
          form.reset(); $$("button", chips).forEach((b) => b.setAttribute("aria-pressed", "false"));
          msg.textContent = "Thank you. We’ll be in touch within 24 business hours.";
          return;
        } catch { /* fall through to email */ }
      }
      const body = `Name: ${data.name}\nEmail: ${data.email}\nCompany: ${data.company || "-"}\nInterested in: ${interests.join(", ") || "-"}\n\n${data.message}`;
      location.href = `mailto:contact@parkinsonconsultingllc.com?subject=${encodeURIComponent("Project inquiry from " + data.name)}&body=${encodeURIComponent(body)}`;
      msg.textContent = "Opening your email app with everything filled in.";
    });
  })();

  watchReveals();
})();
