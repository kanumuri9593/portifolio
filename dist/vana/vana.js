(() => {
  "use strict";

  // Brick colours. The bright ones are white chocolate tinted with plants.
  const C = {
    D: "#3d2016", // dark chocolate
    M: "#8a5530", // milk chocolate
    W: "#f3e3c3", // white chocolate
    B: "#d23c6b", // beetroot
    T: "#f4b62f", // turmeric
    O: "#e8782a", // turmeric + beetroot
    P: "#4f6fd6", // butterfly pea
    G: "#3fa070", // spirulina
  };

  const ANIMALS = {
    tiger: {
      name: "Bengal tiger", home: "Sundarbans to Satpura", bg: "#ffd27a", shout: "Roar!",
      fact: "India is home to about three in four of the world's wild tigers.",
      act: "Do this week: switch off one light nobody is using.",
      grid: [
        ".OO....OO.",
        "OWOODDOOWO",
        "DOOOODOOOD",
        "OWDOOOOWDO",
        "DOOOWWOOOD",
        "OOOWDDWOOO",
        ".DOWWWWOD.",
        "..OOWWOO..",
      ],
    },
    elephant: {
      name: "Asian elephant", home: "Western Ghats", bg: "#c9dcf5", shout: "Pawoo!",
      fact: "A grown elephant can eat around 150 kg of plants in a single day.",
      act: "Do this week: plant a seed in a pot and give it a name.",
      grid: [
        "...MMMMM..",
        "..MMMMMMMM",
        ".MMDMMMMMM",
        "MMMMMMMMMM",
        "MW.MMMMMMM",
        "M..MMMMMMM",
        "M..MM..MM.",
        "MM.MM..MM.",
      ],
    },
    peacock: {
      name: "Indian peafowl", home: "Fields and forests everywhere", bg: "#bfe9df", shout: "Mee-ow!",
      fact: "Only the males grow the giant tail, and they drop it every year.",
      act: "Do this week: leave a bowl of water out for birds.",
      grid: [
        "G.P.G.P.G.",
        "PGPGPGPGP.",
        ".GPGPGPG..",
        "..GPPPG...",
        "....PP....",
        "....PPT...",
        "...PPP....",
        "...T..T...",
      ],
    },
    hornbill: {
      name: "Great hornbill", home: "Western Ghats and the Northeast", bg: "#ffe3a3", shout: "Kok-kok!",
      fact: "The mother seals herself inside a tree hole while the father brings food.",
      act: "Do this week: hug the oldest tree you can find. Hornbills need them.",
      grid: [
        "....TTT...",
        "...TTTTTT.",
        "..DDDTTTTT",
        ".DDWDD..TT",
        "DDDDDD....",
        "DDDDDW....",
        ".DDDWW....",
        "..T..T....",
      ],
    },
    fishingcat: {
      name: "Fishing cat", home: "Godavari mangroves, Coringa", bg: "#d9eecf", shout: "Splash!",
      fact: "It dives into the water to catch fish, which most cats would never do.",
      act: "Do this week: keep one piece of plastic out of a river or drain.",
      grid: [
        ".M......M.",
        "MMM....MMM",
        "MMMMMMMMMM",
        "MWDMMMMDWM",
        "MMMMDDMMMM",
        ".MDMWWMDM.",
        "..MMMMMM..",
        "...MMMM...",
      ],
    },
    turtle: {
      name: "Olive ridley turtle", home: "Odisha's beaches", bg: "#c4ecf4", shout: "Swoosh!",
      fact: "Thousands of mothers come ashore together on the same nights to lay eggs.",
      act: "Do this week: pick up three bits of litter on a walk.",
      grid: [
        "..........",
        "...GGGG...",
        "..GDGGDG..",
        ".GGGGGGGGM",
        "MGDGGDGGMM",
        ".GGGGGGGG.",
        ".M.M..M.M.",
        "..........",
      ],
    },
  };

  const ICONS = {
    palm: ["GG.G.GG", ".GGGGG.", "GG.M.GG", "...M...", "...M...", "...M...", "..MMM.."],
    pod: ["...G...", "..BBB..", ".BBBBB.", ".BBBBB.", ".BBBBB.", "..BBB..", "...B..."],
    leaf: ["....GGG", "..GGGGG", ".GGGGGG", "GGGGGG.", "GGGGG..", "GGG....", "M......"],
    sun: ["T..T..T", ".TTTTT.", ".TTTTT.", "TTTTTTT", ".TTTTT.", ".TTTTT.", "T..T..T"],
    flame: ["...B...", "..BB...", "..BTB..", ".BTTB..", ".BTTTB.", "BTTWTTB", ".BBBBB."],
    brick: [".......", ".D...D.", "DDDDDDD", "DDDDDDD", "DDDDDDD", "DDDDDDD", "......."],
    heart: [".BB.BB.", "BBBBBBB", "BBBBBBB", "BBBBBBB", ".BBBBB.", "..BBB..", "...B..."],
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  function paint(el, grid, drop) {
    el.style.setProperty("--cols", grid[0].length);
    el.innerHTML = "";
    let i = 0;
    grid.forEach((row) => {
      [...row].forEach((ch) => {
        const b = document.createElement("span");
        b.className = ch === "." ? "b b--e" : "b";
        if (ch !== ".") b.style.setProperty("--c", C[ch]);
        b.style.setProperty("--i", i++);
        el.appendChild(b);
      });
    });
    if (drop && !reduceMotion) {
      el.classList.remove("is-dropping");
      void el.offsetWidth;
      el.classList.add("is-dropping");
    }
  }

  // Static brick art (hero, pack, icons, join)
  $$(".brickart[data-animal]").forEach((el) => paint(el, ANIMALS[el.dataset.animal].grid, el.id === "heroArt"));
  $$(".brickart[data-icon]").forEach((el) => paint(el, ICONS[el.dataset.icon]));

  // Hero animal changes every few seconds
  const heroArt = $("#heroArt");
  const heroCycle = ["tiger", "elephant", "peacock", "hornbill", "fishingcat", "turtle"];
  let heroIdx = 0;
  if (!reduceMotion) {
    setInterval(() => {
      if (document.hidden) return;
      const r = heroArt.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      heroIdx = (heroIdx + 1) % heroCycle.length;
      const a = ANIMALS[heroCycle[heroIdx]];
      heroArt.setAttribute("aria-label", `A ${a.name.toLowerCase()} made of chocolate bricks`);
      paint(heroArt, a.grid, true);
    }, 4200);
  }

  // Nav background after scrolling
  const nav = $("#nav");
  const hero = $("#hero");
  const depthEls = $$("[data-depth]", hero);
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY;
      nav.classList.toggle("is-solid", y > 30);
      if (!reduceMotion && y < innerHeight * 1.2) {
        depthEls.forEach((el) => { el.style.transform = `translateY(${y * Number(el.dataset.depth)}px)`; });
      }
      ticking = false;
    });
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Day and night
  const root = document.documentElement;
  const toggle = $("#daynight");
  const flies = $(".fireflies");
  for (let i = 0; i < 22; i++) {
    const f = document.createElement("span");
    f.className = "fly";
    f.style.left = Math.random() * 100 + "%";
    f.style.top = 15 + Math.random() * 80 + "%";
    f.style.setProperty("--x", (Math.random() * 120 - 60).toFixed(0) + "px");
    f.style.setProperty("--y", (Math.random() * 120 - 60).toFixed(0) + "px");
    f.style.setProperty("--d", (5 + Math.random() * 6).toFixed(1) + "s");
    f.style.animationDelay = (-Math.random() * 6).toFixed(1) + "s";
    flies.appendChild(f);
  }
  function setTheme(t) {
    if (t === "night") root.setAttribute("data-theme", "night");
    else root.removeAttribute("data-theme");
    toggle.setAttribute("aria-pressed", String(t === "night"));
    toggle.setAttribute("aria-label", t === "night" ? "Switch the forest to day" : "Switch the forest to night");
    $('meta[name="theme-color"]').setAttribute("content", t === "night" ? "#071d14" : "#0f3d2a");
  }
  try { if (localStorage.getItem("vana-theme") === "night") setTheme("night"); } catch (e) { /* storage blocked */ }
  toggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "night" ? "day" : "night";
    setTheme(next);
    try { localStorage.setItem("vana-theme", next); } catch (e) { /* storage blocked */ }
  });

  // Confetti made of tiny bricks
  function burst(x, y, n = 26) {
    if (reduceMotion) return;
    const cols = Object.values(C);
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.className = "burst";
      s.style.left = x + "px";
      s.style.top = y + "px";
      s.style.background = cols[i % cols.length];
      const ang = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 160;
      s.style.setProperty("--x", Math.cos(ang) * dist + "px");
      s.style.setProperty("--y", Math.sin(ang) * dist - 60 + "px");
      s.style.setProperty("--r", Math.random() * 540 + "deg");
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1200);
    }
  }

  // Playground: drag (or tap) chunks of an animal onto the board
  const board = $("#board");
  const tray = $("#tray");
  const done = $("#playDone");
  const CHUNKS = [[0, 1], [2, 3], [4, 5], [6, 7]];
  let current = "tiger";
  let placed = 0;
  let ghost;
  let slots = [];

  function layoutSlots() {
    if (!ghost) return;
    const cells = ghost.children;
    const cols = ANIMALS[current].grid[0].length;
    slots.forEach((slot, k) => {
      const [r0, r1] = CHUNKS[k];
      const a = cells[r0 * cols];
      const b = cells[r1 * cols];
      slot.style.top = a.offsetTop + "px";
      slot.style.height = b.offsetTop + b.offsetHeight - a.offsetTop + "px";
    });
  }

  function makeChunk(k) {
    const grid = ANIMALS[current].grid;
    const el = document.createElement("div");
    el.className = "chunk";
    el.dataset.k = k;
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-label", `Piece ${k + 1} of 4`);
    const art = document.createElement("div");
    art.className = "brickart";
    paint(art, CHUNKS[k].map((r) => grid[r]));
    el.appendChild(art);
    return el;
  }

  function buildPlay(name) {
    current = name;
    placed = 0;
    done.hidden = true;
    tray.hidden = false;
    board.classList.remove("is-done");
    board.innerHTML = "";
    ghost = document.createElement("div");
    ghost.className = "brickart board__ghost";
    paint(ghost, ANIMALS[name].grid);
    const slotWrap = document.createElement("div");
    slotWrap.className = "board__slots";
    slots = CHUNKS.map((_, k) => {
      const s = document.createElement("div");
      s.className = "slot";
      s.dataset.k = k;
      slotWrap.appendChild(s);
      return s;
    });
    board.append(ghost, slotWrap);
    tray.innerHTML = "";
    const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    if (order.join() === "0,1,2,3") order.reverse();
    order.forEach((k) => tray.appendChild(makeChunk(k)));
    requestAnimationFrame(layoutSlots);
  }

  function place(chunk) {
    const k = Number(chunk.dataset.k);
    const slot = slots[k];
    chunk.classList.remove("is-dragging");
    chunk.removeAttribute("style");
    chunk.classList.add("is-placed");
    chunk.removeAttribute("tabindex");
    chunk.removeAttribute("role");
    slot.appendChild(chunk);
    placed++;
    const r = slot.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 10);
    if (placed === CHUNKS.length) finish();
  }

  function finish() {
    const a = ANIMALS[current];
    board.classList.add("is-done");
    ghost.className = "brickart board__real";
    paint(ghost, a.grid);
    $$(".board__slots", board).forEach((s) => (s.style.display = "none"));
    tray.hidden = true;
    $("#playShout").textContent = a.shout;
    $("#playSnaps").textContent = CHUNKS.length;
    done.hidden = false;
    const r = board.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 40);
  }

  let drag = null;
  tray.addEventListener("pointerdown", (e) => {
    const chunk = e.target.closest(".chunk");
    if (!chunk || chunk.classList.contains("is-placed")) return;
    e.preventDefault();
    const r = chunk.getBoundingClientRect();
    drag = { chunk, sx: e.clientX, sy: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, moved: false, w: r.width };
  });
  addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    const c = drag.chunk;
    if (!drag.moved) {
      drag.moved = true;
      const slotW = slots[0].getBoundingClientRect().width;
      c.classList.add("is-dragging");
      c.style.width = Math.min(slotW + 16, Math.max(drag.w, slotW * 0.8)) + "px";
      drag.ox = Math.min(drag.ox, parseFloat(c.style.width) - 10);
    }
    c.style.left = e.clientX - drag.ox + "px";
    c.style.top = e.clientY - drag.oy + "px";
    const slot = slots[Number(c.dataset.k)];
    const sr = slot.getBoundingClientRect();
    const pad = 30;
    const hot = e.clientX > sr.left - pad && e.clientX < sr.right + pad && e.clientY > sr.top - pad && e.clientY < sr.bottom + pad;
    slots.forEach((s) => s.classList.toggle("is-hot", s === slot && hot));
    drag.hot = hot;
  });
  function endDrag() {
    if (!drag) return;
    const { chunk, moved, hot } = drag;
    slots.forEach((s) => s.classList.remove("is-hot"));
    if (!moved || hot) place(chunk);
    else { chunk.classList.remove("is-dragging"); chunk.removeAttribute("style"); }
    drag = null;
  }
  addEventListener("pointerup", endDrag);
  addEventListener("pointercancel", () => {
    if (!drag) return;
    drag.chunk.classList.remove("is-dragging");
    drag.chunk.removeAttribute("style");
    slots.forEach((s) => s.classList.remove("is-hot"));
    drag = null;
  });
  tray.addEventListener("keydown", (e) => {
    const chunk = e.target.closest(".chunk");
    if (chunk && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); place(chunk); }
  });

  $$(".play__animals .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      $$(".play__animals .chip").forEach((c) => { c.classList.toggle("is-on", c === chip); c.setAttribute("aria-selected", String(c === chip)); });
      buildPlay(chip.dataset.animal);
    });
  });
  $("#playAgain").addEventListener("click", () => buildPlay(current));
  addEventListener("resize", layoutSlots);
  buildPlay("tiger");

  // Pack flip
  const pack = $("#pack");
  $("#packFlip").addEventListener("click", () => pack.classList.toggle("is-flipped"));

  // Journey: drag the river with a mouse (touch scrolls natively)
  const journey = $("#journey");
  let jd = null;
  journey.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    jd = { x: e.clientX, left: journey.scrollLeft };
    journey.classList.add("is-grabbing");
  });
  addEventListener("pointermove", (e) => { if (jd) journey.scrollLeft = jd.left - (e.clientX - jd.x); });
  addEventListener("pointerup", () => { if (jd) { jd = null; journey.classList.remove("is-grabbing"); } });
  journey.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") journey.scrollBy({ left: 300, behavior: "smooth" });
    if (e.key === "ArrowLeft") journey.scrollBy({ left: -300, behavior: "smooth" });
  });

  // Collectible cards
  const cards = $("#cards");
  Object.entries(ANIMALS).forEach(([key, a], i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card reveal";
    btn.style.transitionDelay = i * 60 + "ms";
    btn.setAttribute("aria-label", `${a.name}. Tap to read about it.`);
    btn.innerHTML = `<div class="card__in">
      <div class="card__f" style="--bgc:${a.bg}"><span class="card__home">No. ${String(i + 1).padStart(2, "0")}</span><div class="brickart brickart--mini" data-k="${key}"></div><span class="card__name">${a.name}</span></div>
      <div class="card__b"><b>${a.name}</b><span>Home: ${a.home}</span><span>${a.fact}</span><em>${a.act}</em></div>
    </div>`;
    paint($(".brickart", btn), a.grid);
    btn.addEventListener("click", () => btn.classList.toggle("is-open"));
    cards.appendChild(btn);
  });

  // Join form (stays on this device until signups open)
  const form = $("#joinForm");
  const msg = $("#joinMsg");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#joinEmail").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      msg.style.color = "var(--beet)";
      msg.textContent = "That email doesn't look quite right.";
      return;
    }
    const pick = form.querySelector('input[name="next"]:checked').value;
    try { localStorage.setItem("vana-join", JSON.stringify({ email, pick, at: Date.now() })); } catch (err) { /* storage blocked */ }
    msg.style.color = "";
    msg.textContent = `Saved. ${pick} gets your vote. Signups open with the first batch.`;
    const r = form.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + 20, 30);
  });

  // Reveal on scroll
  $$(".section-head, .promises li, .stop, .faq details, .bar, .join__card, .pack").forEach((el) => el.classList.add("reveal"));
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach((el) => io.observe(el));
  } else {
    $$(".reveal").forEach((el) => el.classList.add("is-in"));
  }
})();
