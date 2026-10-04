/* TANRAIN — a small room at blue hour
   app.js: panels, the film carousel, the bookshelf, sound, and the simple-version fallback.
   room.js (the 3D room) talks to this file through window.TR. */

(function () {
  "use strict";

  var body = document.body;
  var SECTIONS = ["about", "films", "lab", "library"];
  var params = new URLSearchParams(location.search);
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var state = { flat: false, open: null, sound: false, night: false, entered: false, roomReady: false };

  body.classList.add("js");
  var usingKeyboard = false;
  document.addEventListener("keydown", function (e) { if (e.key === "Tab" || e.key === "Enter" || e.key === " ") usingKeyboard = true; }, true);
  document.addEventListener("pointerdown", function () { usingKeyboard = false; }, true);

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }
  function store(key, val) { try { localStorage.setItem("tanrain." + key, val); } catch (e) { /* storage unavailable */ } }
  function recall(key) { try { return localStorage.getItem("tanrain." + key); } catch (e) { return null; } }

  /* ============================================================
     VEIL + MODE
     ============================================================ */
  var veil = $("#veil");
  var bar = $(".veil-bar i");
  var pct = $(".veil-pct");
  var actions = $(".veil-actions");

  function setProgress(p) {
    p = Math.max(0, Math.min(1, p));
    bar.style.width = (p * 100).toFixed(0) + "%";
    pct.textContent = p < 1 ? "lighting the lamp… " + Math.round(p * 100) + "%" : "the lamp is lit";
  }
  function showEnter() {
    actions.hidden = false;
    veil.classList.add("ready");
  }

  function hasWebGL() {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch (e) { return false; }
  }

  function goFlat() {
    if (state.flat) return;
    state.flat = true;
    clearTimeout(failTimer);
    body.classList.remove("room-mode", "panel-open", "focusing");
    body.classList.add("flat");
    $$(".panel.open").forEach(function (p) { p.classList.remove("open"); });
    state.open = null;
    setProgress(1);
    showEnter();
    if (state.entered) routeFromHash();
  }

  var failTimer = null;
  if (params.has("flat") || !hasWebGL()) {
    goFlat();
  } else {
    body.classList.add("room-mode");
    failTimer = setTimeout(function () { if (!state.roomReady) goFlat(); }, 15000);
  }

  function enter(withSound) {
    if (state.entered) return;
    state.entered = true;
    veil.classList.add("gone");
    body.classList.add("entered");
    if (withSound) setSound(true);
    routeFromHash();
  }
  $("#enter-btn").addEventListener("click", function () { enter(false); });
  $("#enter-sound").addEventListener("click", function () { enter(true); });

  /* ============================================================
     PANELS
     ============================================================ */
  function setHash(id) {
    if (!history.replaceState) return;
    history.replaceState(null, "", id ? "#" + id : location.pathname + location.search);
  }

  function open(section, origin) {
    if (SECTIONS.indexOf(section) < 0) return;
    closeMenu();
    initPanel(section);

    if (state.flat) {
      var el = document.getElementById(section);
      if (el) el.scrollIntoView({ behavior: reduced || document.hidden ? "auto" : "smooth" });
      setHash(section);
      markFlatNav(section);
      return;
    }

    var panel = document.getElementById(section);
    if (state.open === section) return;
    var ox = origin ? origin.x : innerWidth / 2;
    var oy = origin ? origin.y : innerHeight / 2;
    panel.style.setProperty("--ox", ox + "px");
    panel.style.setProperty("--oy", oy + "px");
    panel.scrollTop = 0;

    var prev = state.open && document.getElementById(state.open);
    panel.classList.add("open");
    if (prev) setTimeout(function () { prev.classList.remove("open"); }, 600);
    state.open = section;
    body.classList.add("panel-open");
    body.classList.remove("focusing");
    setHash(section);
    chime(0.5);
    if (window.ROOM) setTimeout(function () { if (state.open) window.ROOM.setPaused(true); }, 1200);
    var back = $(".back", panel);
    if (back && usingKeyboard) back.focus({ preventScroll: true });
    if (section === "about") requestAnimationFrame(updateReveal);
  }

  function close() {
    closeMenu();
    if (state.flat) { window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); setHash(""); return; }
    if (!state.open) return;
    var panel = document.getElementById(state.open);
    panel.classList.remove("open");
    state.open = null;
    body.classList.remove("panel-open");
    setHash("");
    if (window.ROOM) { window.ROOM.setPaused(false); window.ROOM.reset(); }
  }

  /* go = walk to the object in the room first, then open its panel */
  function go(section, origin) {
    if (!state.flat && window.ROOM && !state.open && state.entered) {
      body.classList.add("focusing");
      window.ROOM.focus(section, function (pt) { open(section, pt || origin); });
    } else {
      open(section, origin);
    }
  }

  function routeFromHash() {
    var h = location.hash.replace("#", "");
    if (!h) return;
    if (SECTIONS.indexOf(h) >= 0) { open(h); return; }
    var art = document.getElementById(h);
    if (art && art.classList.contains("film")) {
      var sec = art.closest(".panel");
      if (sec) open(sec.id);
      setTimeout(function () { openFilm(h); }, state.flat ? 200 : 900);
    }
  }

  /* ============================================================
     MENU
     ============================================================ */
  var menuBtn = $("#menu-btn");
  function closeMenu() { body.classList.remove("menu-open"); menuBtn.setAttribute("aria-expanded", "false"); }
  menuBtn.addEventListener("click", function () {
    var on = !body.classList.contains("menu-open");
    body.classList.toggle("menu-open", on);
    menuBtn.setAttribute("aria-expanded", String(on));
    if (on) chime(1);
  });

  /* ============================================================
     DELEGATED CLICKS + KEYS
     ============================================================ */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-open], [data-close], [data-film], [data-dismiss], .js .collage .film");
    if (!t) {
      if (body.classList.contains("menu-open") && !e.target.closest("#menu, #menu-btn")) closeMenu();
      return;
    }
    if (e.target.closest("a[href^='http'], a[href^='mailto'], details summary")) return; /* real links & no-JS accordions */

    if (t.hasAttribute("data-dismiss")) { e.preventDefault(); closeModal(); return; }
    if (t.hasAttribute("data-close")) { e.preventDefault(); close(); return; }
    if (t.hasAttribute("data-open")) {
      e.preventDefault();
      var film = t.getAttribute("data-film");
      if (state.open === t.getAttribute("data-open") || state.flat) {
        open(t.getAttribute("data-open"), { x: e.clientX, y: e.clientY });
        if (film) setTimeout(function () { openFilm(film); }, state.flat ? 500 : 0);
      } else {
        go(t.getAttribute("data-open"), { x: e.clientX, y: e.clientY });
        if (film) setTimeout(function () { openFilm(film); }, 1800);
      }
      return;
    }
    if (t.hasAttribute("data-film")) { e.preventDefault(); openFilm(t.getAttribute("data-film")); return; }
    if (t.classList.contains("film")) { e.preventDefault(); openFilm(t.id); }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (activeModal) closeModal();
      else if (body.classList.contains("menu-open")) closeMenu();
      else if (state.open) close();
      return;
    }
    if (activeModal === reader && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      stepPoem(e.key === "ArrowRight" ? 1 : -1);
      return;
    }
    if (!activeModal && cf.items.length && isFilmsVisible() && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      if (e.target.matches("input, textarea")) return;
      cfGo(cf.cur + (e.key === "ArrowRight" ? 1 : -1));
    }
  });

  /* ============================================================
     SOUND — rain + a low pad, synthesised (no audio files)
     ============================================================ */
  var audio = null;
  function initAudio() {
    if (audio) return audio;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    var ctx = new AC();
    var len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    var b0 = 0, b1 = 0, b2 = 0;
    for (var i = 0; i < len; i++) {
      var w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11;
    }
    var src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 400;
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2600;
    var rain = ctx.createGain(); rain.gain.value = 0;
    src.connect(hp); hp.connect(lp); lp.connect(rain); rain.connect(ctx.destination); src.start();
    var pad = ctx.createGain(); pad.gain.value = 0; pad.connect(ctx.destination);
    [110, 164.81, 220.5, 277.18].forEach(function (f, n) {
      var o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
      var g = ctx.createGain(); g.gain.value = n === 3 ? 0.12 : 0.3;
      o.connect(g); g.connect(pad); o.start();
    });
    audio = { ctx: ctx, rain: rain, pad: pad };
    return audio;
  }
  function setSound(on) {
    state.sound = on;
    var btn = $("#sound-btn");
    btn.setAttribute("aria-pressed", String(on));
    store("sound", on ? "1" : "0");
    var a = on ? initAudio() : audio;
    if (!a) return;
    if (a.ctx.state === "suspended") a.ctx.resume();
    var t = a.ctx.currentTime;
    a.rain.gain.cancelScheduledValues(t); a.pad.gain.cancelScheduledValues(t);
    a.rain.gain.setTargetAtTime(on ? 0.42 : 0, t, 0.8);
    a.pad.gain.setTargetAtTime(on ? 0.03 : 0, t, 1.4);
  }
  var NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
  function chime(octave) {
    if (!state.sound || !audio) return;
    var ctx = audio.ctx, t = ctx.currentTime;
    var f = NOTES[Math.floor(Math.random() * NOTES.length)] * (octave || 1);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "triangle"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 1.9);
  }
  $("#sound-btn").addEventListener("click", function () { setSound(!state.sound); });

  /* ============================================================
     NIGHT
     ============================================================ */
  function setNight(on) {
    state.night = on;
    body.classList.toggle("night", on);
    $("#night-btn").setAttribute("aria-pressed", String(on));
    store("night", on ? "1" : "0");
    if (window.ROOM) window.ROOM.setNight(on);
  }
  $("#night-btn").addEventListener("click", function () { setNight(!state.night); chime(0.75); });
  if (recall("night") === "1") setNight(true);

  /* ============================================================
     01 · MANIFESTO — words light up as you scroll
     ============================================================ */
  var words = [];
  function splitWords(el) {
    [].slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var s = document.createElement("span"); s.className = "w"; s.textContent = part;
          frag.appendChild(s); words.push(s);
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        if (node.classList.contains("inl")) { node.classList.add("w"); words.push(node); }
        else splitWords(node);
      }
    });
  }
  var manifesto = $("#manifesto");
  if (manifesto) splitWords(manifesto);
  var revealQueued = false;
  function updateReveal() {
    revealQueued = false;
    var vh = innerHeight;
    words.forEach(function (w) { w.classList.toggle("lit", w.getBoundingClientRect().top < vh * 0.8); });
  }
  function queueReveal() { if (!revealQueued) { revealQueued = true; requestAnimationFrame(updateReveal); } }
  $("#about").addEventListener("scroll", queueReveal, { passive: true });
  window.addEventListener("scroll", queueReveal, { passive: true });

  /* ============================================================
     02 · FILMS — coverflow carousel + index
     ============================================================ */
  var cf = { items: [], arts: [], cur: 0 };
  var track = $(".cf-track");
  var pill = $(".cf-pill");
  var stage = $(".cf-stage");
  function esc(s) { return String(s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function buildFilms() {
    cf.arts = $$("#films .film-list .film");
    var index = $("#film-index");
    cf.arts.forEach(function (art, i) {
      var d = art.dataset;
      var el = document.createElement("button");
      el.type = "button";
      el.className = "cf-item";
      el.setAttribute("aria-label", d.title + " — " + (d.drive ? "watch" : "read more"));
      el.innerHTML =
        '<span class="cf-frame">' +
          (d.img ? '<img src="' + esc(d.img) + '" alt="" draggable="false">' : '<span class="cf-poster">' + esc(d.title.toUpperCase()) + "</span>") +
          (d.status && d.status !== "finished" && d.status !== "cut" ? '<span class="cf-stamp">' + esc(d.status) + "</span>" : "") +
          '<span class="cf-play" aria-hidden="true">' + (d.drive ? "▶" : "↗") + "</span>" +
        "</span>" +
        '<span class="cf-banner">' + esc(d.label) + "</span>" +
        '<span class="cf-yy">’' + esc(d.yy) + "</span>";
      el.addEventListener("click", function () {
        if (cf.dragged) return;
        if (i === cf.cur) openFilm(art.id); else cfGo(i);
      });
      track.appendChild(el);
      cf.items.push(el);

      var row = document.createElement("button");
      row.type = "button";
      row.className = "fi-row";
      row.setAttribute("data-film", art.id);
      row.innerHTML =
        '<span class="fi-n">' + String(i + 1).padStart(2, "0") + "</span>" +
        '<span class="fi-t">' + esc(d.title) + "</span>" +
        '<span class="fi-k">' + esc(d.kind) + "</span>" +
        '<span class="fi-y">' + esc(d.year) + "</span>" +
        '<span class="fi-s">' + esc(d.status) + "</span>" +
        '<span class="fi-a">↗</span>';
      if (d.img) row.setAttribute("data-preview", d.img);
      index.appendChild(row);
    });
    cfLayout();
    $(".cf-prev").addEventListener("click", function () { cfGo(cf.cur - 1); });
    $(".cf-next").addEventListener("click", function () { cfGo(cf.cur + 1); });
    bindDrag();
    bindPreview(index);
  }

  function cfGo(i) {
    var n = cf.items.length;
    cf.cur = (i + n) % n;
    cfLayout();
    chime(1);
  }
  function cfLayout() {
    var narrow = innerWidth < 700;
    var n = cf.items.length;
    cf.items.forEach(function (el, i) {
      var o = i - cf.cur;
      if (o > n / 2) o -= n;
      if (o < -n / 2) o += n;
      var a = Math.abs(o);
      var x = o * (narrow ? 64 : 52);
      el.style.transform =
        "translate(-50%, -50%) translateX(" + x + "%) translateZ(" + (-a * 190) + "px) rotateY(" + (-o * 26) + "deg) rotate(" + (o * 1.8) + "deg)";
      el.style.opacity = a > 2 ? 0 : String(1 - a * 0.12);
      el.style.zIndex = String(100 - a);
      el.style.pointerEvents = a > 2 ? "none" : "";
      el.classList.toggle("is-center", o === 0);
      el.tabIndex = o === 0 ? 0 : -1;
    });
    var d = cf.arts[cf.cur].dataset;
    pill.textContent = d.title + " · " + d.year;
  }
  function bindDrag() {
    var sx = 0, dx = 0, down = false;
    stage.addEventListener("pointerdown", function (e) { down = true; sx = e.clientX; dx = 0; cf.dragged = false; });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      dx = e.clientX - sx;
      if (Math.abs(dx) > 8) { cf.dragged = true; stage.classList.add("dragging"); }
    });
    window.addEventListener("pointerup", function () {
      if (!down) return;
      down = false; stage.classList.remove("dragging");
      if (Math.abs(dx) > 50) cfGo(cf.cur + (dx < 0 ? 1 : -1));
      setTimeout(function () { cf.dragged = false; }, 0);
    });
  }
  function bindPreview(index) {
    var img = $("#fi-preview");
    if (!window.matchMedia("(hover: hover)").matches) return;
    index.addEventListener("mousemove", function (e) {
      var row = e.target.closest(".fi-row");
      if (!row || !row.dataset.preview) { img.classList.remove("on"); return; }
      if (img.getAttribute("src") !== row.dataset.preview) img.src = row.dataset.preview;
      img.style.transform = "translate(" + (e.clientX + 24) + "px," + (e.clientY - 80) + "px) rotate(-3deg)";
      img.classList.add("on");
    });
    index.addEventListener("mouseleave", function () { img.classList.remove("on"); });
  }
  function isFilmsVisible() { return state.flat ? true : state.open === "films"; }

  /* ============================================================
     SCREEN — the film / experiment modal
     ============================================================ */
  var screenEl = $("#screen"), reader = $("#reader");
  var activeModal = null, lastFocus = null;

  function showModal(m) {
    lastFocus = document.activeElement;
    m.hidden = false;
    activeModal = m;
    var x = $(".modal-x", m);
    if (x) x.focus({ preventScroll: true });
  }
  function closeModal() {
    if (!activeModal) return;
    activeModal.hidden = true;
    if (activeModal === screenEl) $(".screen-video", screenEl).innerHTML = ""; /* stop playback */
    activeModal = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function openFilm(id) {
    var art = document.getElementById(id);
    if (!art) return;
    var d = art.dataset;
    var video = $(".screen-video", screenEl);
    video.innerHTML = "";
    if (d.drive) {
      var fr = document.createElement("div");
      fr.className = "video-frame" + (d.aspect === "portrait" ? " portrait" : "");
      var ifr = document.createElement("iframe");
      ifr.src = "https://drive.google.com/file/d/" + d.drive + "/preview";
      ifr.title = d.title;
      ifr.allow = "autoplay; fullscreen";
      fr.appendChild(ifr);
      video.appendChild(fr);
    } else if (d.img) {
      var im = document.createElement("img"); im.className = "still"; im.src = d.img; im.alt = "";
      video.appendChild(im);
    } else {
      var po = document.createElement("div"); po.className = "cf-poster still"; po.textContent = d.title.toUpperCase();
      video.appendChild(po);
    }
    $(".screen-meta", screenEl).textContent = [d.status, d.year, d.kind].filter(Boolean).join(" · ");
    $("#screen-title").textContent = d.title;
    var log = $(".logline", art);
    $(".screen-log", screenEl).textContent = log ? log.textContent : "";
    var more = $(".screen-more", screenEl);
    more.innerHTML = "";
    var m = $(".film-more", art);
    if (m) more.appendChild(m.cloneNode(true));
    $(".modal-box", screenEl).scrollTop = 0;
    showModal(screenEl);
    chime(0.5);
  }

  /* ============================================================
     04 · LIBRARY — spines on a shelf, a book that opens
     ============================================================ */
  var poems = [];
  var SPINE_COLORS = ["#1B3B8A", "#8E1B23", "#2a4f5c", "#B8893D", "#2545C4", "#5a2e4a", "#3E8E9E", "#0B1B3A", "#C77A2B"];
  function buildSpines() {
    var spines = $("#spines");
    $$("#library .shelves-src .shelf").forEach(function (shelf) {
      var wrap = document.createElement("div"); wrap.className = "spine-shelf";
      var h = $(".shelf-h", shelf);
      var h3 = document.createElement("h3"); h3.textContent = h ? h.textContent : "";
      var row = document.createElement("div"); row.className = "spine-row";
      wrap.appendChild(h3); wrap.appendChild(row);
      $$("details.poem", shelf).forEach(function (p) {
        var i = poems.length;
        poems.push(p);
        var title = $(".p-title", p).textContent;
        var num = $(".p-num", p).textContent;
        var b = document.createElement("button");
        b.type = "button"; b.className = "spine";
        b.setAttribute("aria-label", "Read " + title);
        b.style.setProperty("--c", SPINE_COLORS[i % SPINE_COLORS.length]);
        b.style.setProperty("--h", (250 + ((i * 37) % 60)) + "px");
        b.style.setProperty("--w", (52 + ((i * 13) % 22)) + "px");
        if (i % 4 === 3) b.style.setProperty("--lean", "-4deg");
        b.innerHTML = '<span class="sp-t">' + esc(title) + '</span><span class="sp-n">' + esc(num) + "</span>";
        b.addEventListener("click", function () { openPoem(i); });
        row.appendChild(b);
      });
      spines.appendChild(wrap);
    });
  }
  var poemIndex = 0;
  function openPoem(i) {
    poemIndex = (i + poems.length) % poems.length;
    var p = poems[poemIndex];
    $(".book-num", reader).textContent = $(".p-num", p).textContent;
    $("#reader-title").textContent = $(".p-title", p).textContent;
    var g = $(".p-gloss", p);
    $(".book-gloss", reader).textContent = g ? g.textContent : "";
    var bodyEl = $(".book-body", reader);
    bodyEl.innerHTML = "";
    bodyEl.appendChild($(".poem-body", p).cloneNode(true));
    $(".book-page", reader).scrollTop = 0;
    if (!activeModal) showModal(reader);
    chime(1);
  }
  function stepPoem(dir) { openPoem(poemIndex + dir); }
  $(".book-prev").addEventListener("click", function () { stepPoem(-1); });
  $(".book-next").addEventListener("click", function () { stepPoem(1); });

  /* ============================================================
     FLAT-MODE NAV
     ============================================================ */
  function markFlatNav(id) {
    $$("#flatnav a").forEach(function (a) { a.classList.toggle("here", a.getAttribute("data-open") === id); });
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      if (!state.flat) return;
      entries.forEach(function (en) { if (en.isIntersecting) markFlatNav(en.target.id); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    SECTIONS.forEach(function (s) { io.observe(document.getElementById(s)); });
  }

  /* ============================================================
     INIT
     ============================================================ */
  var panelsReady = {};
  function initPanel(section) {
    if (panelsReady[section]) return;
    panelsReady[section] = true;
    if (section === "about") updateReveal();
  }

  buildFilms();
  buildSpines();
  window.addEventListener("resize", function () { cfLayout(); queueReveal(); });

  /* the public face room.js uses */
  window.TR = {
    isFlat: function () { return state.flat; },
    isNight: function () { return state.night; },
    progress: setProgress,
    roomReady: function () {
      if (state.flat) return;
      state.roomReady = true;
      clearTimeout(failTimer);
      setProgress(1);
      showEnter();
    },
    fail: goFlat,
    go: go,
    chime: chime,
    hover: function (section) {
      $$(".hotspot").forEach(function (h) { h.classList.toggle("hot", h.getAttribute("data-open") === section); });
      body.classList.toggle("hovering", !!section);
      if (section) chime(1);
    }
  };
  if (state.flat) { setProgress(1); showEnter(); }
})();
