/* TANRAIN — app.js
   Routing, the dive into the eyes, every page's HTML, scroll effects, stickers, cursor, modal, sound.
   The 3D worlds (js/main.js) talk to this file through window.TR and expose window.WORLD. */

(function () {
  "use strict";

  var D = window.TR_DATA;
  var body = document.body;
  var params = new URLSearchParams(location.search);
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGsap = !!window.gsap;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var img = function (path) { return "assets/" + path + ".webp"; };
  var frame = function (id, n) { return img("films/" + id + "/" + String(n).padStart(2, "0")); };

  /* ============================================================
     3D OR NOT
     ============================================================ */
  function webgl() {
    try { var c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); }
    catch (e) { return false; }
  }
  var state = { three: !params.has("flat") && webgl(), route: null, busy: false, entered: false, sound: false };
  if (!state.three) body.classList.add("no3d");
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  var worldReady = new Promise(function (res) {
    if (!state.three) return res(null);
    window.addEventListener("world:ready", function () { res(window.WORLD); }, { once: true });
    window.addEventListener("world:fail", function () { fail3d(); res(null); }, { once: true });
    setTimeout(function () { if (!window.WORLD) { fail3d(); res(null); } }, 14000);
  });
  function fail3d() {
    if (!state.three) return;
    state.three = false;
    body.classList.add("no3d");
    $$(".label3d").forEach(function (l) { l.remove(); });
    if (state.route) lockScroll(false);
  }

  /* ============================================================
     SMOOTH SCROLL
     ============================================================ */
  var lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    if (hasGsap) {
      lenis.on("scroll", function () { if (window.ScrollTrigger) ScrollTrigger.update(); });
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }
  function scrollTop0() {
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  }
  function lockScroll(on) {
    body.classList.toggle("locked", on);
    if (lenis) { if (on) lenis.stop(); else lenis.start(); }
  }

  /* progress through the page (or through a [data-track] element) — the 3D camera rides this */
  var trackEl = null;
  function progress() {
    var vh = innerHeight;
    if (trackEl) {
      var r = trackEl.getBoundingClientRect();
      var span = r.height - vh;
      return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    }
    var max = document.documentElement.scrollHeight - vh;
    return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  }

  /* ============================================================
     ROUTES + PAGES
     ============================================================ */
  function parse(hash) {
    var h = (hash || "").replace(/^#\/?/, "");
    var parts = h.split("/");
    var name = parts[0] || "intro";
    var id = parts[1];
    if (name === "film" && !findFilm(id)) name = "films";
    if (name === "poem" && !findPoem(id)) name = "library";
    if (["intro", "room", "films", "film", "library", "poem", "stairs", "lab", "about"].indexOf(name) < 0) name = "room";
    if (name !== "film" && name !== "poem") id = undefined;
    return { name: name, id: id, key: id ? name + "/" + id : name };
  }
  function findFilm(id) { return D.films.filter(function (f) { return f.id === id; })[0]; }
  function findPoem(id) { return D.poems.filter(function (p) { return p.id === id; })[0]; }

  var ICON = {
    left: '<svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    out: '<svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/></svg>'
  };
  var cap = function (t) { return t.charAt(0).toUpperCase() + t.slice(1); };
  var back = function (to, label) {
    return '<a class="back-room btn btn-ghost btn-sm" href="#' + to + '" data-route="' + to + '" data-cursor="back" data-magnetic><span class="btn-ico" aria-hidden="true">' + ICON.left + '</span><span class="btn-label">' + cap(label) + "</span></a>";
  };
  var nextLink = function (route, small, title, extraStyle) {
    return '<a class="next-world" href="#' + route + '" data-route="' + route + '"' + (extraStyle ? ' style="' + extraStyle + '"' : "") + '><small>' + small + '</small><span class="nw-row"><span class="nw-title">' + title + '</span><span class="nw-arrow" aria-hidden="true">' + ICON.right + "</span></span></a>";
  };
  var outLink = function (href, label) { return '<a class="link-arrow" href="' + href + '" target="_blank" rel="noopener"><span>' + label + '</span>' + ICON.out + "</a>"; };
  var cue = '<p class="scroll-cue">Scroll</p>';
  var sticker = function (b, i, cls, style) {
    return '<span class="sticker ' + (cls || "") + '" style="' + (style || "") + '">' + (b ? "<b>" + esc(b) + "</b>" : "") + (i ? "<i>" + esc(i) + "</i>" : "") + "</span>";
  };

  var PAGES = {
    room: function () {
      var cards = [
        ["films", "the screening hall", "films", "films/anamne/03"],
        ["library", "the library", "poems & stories", "films/mishen/00"],
        ["stairs", "the stairs", "posters & design", "posters/vision"],
        ["lab", "the lab", "experiments", "lab/viviana-2"],
        ["about", "the window", "about me", "about/portrait"]
      ].map(function (c) {
        return '<a class="room-card glass" href="#' + c[0] + '" data-route="' + c[0] + '"><img src="' + img(c[3]) + '" alt="" loading="lazy"><i>' + c[2] + "</i><b>" + c[1] + "</b></a>";
      }).join("");
      return '<section class="room-page">' +
        '<div class="room-title"><p class="kicker"><span class="dot"></span>you are inside</p><h2>the room</h2>' +
        "<p>Every glowing ring is a door — the screen, the shelf, the stairs that climb out of the water, the desk, the window.</p></div>" +
        '<p class="room-hint">drag to look around · click a portal</p>' +
        '<nav class="room-doors" aria-label="Doors">' + [["films", "films"], ["library", "library"], ["stairs", "stairs"], ["lab", "lab"], ["about", "window"]].map(function (d) { return '<a class="btn btn-ghost btn-sm" href="#' + d[0] + '" data-route="' + d[0] + '"><span class="btn-label">' + cap(d[1]) + "</span></a>"; }).join("") + "</nav>" +
        '<div class="room-cards">' + cards + "</div></section>";
    },

    films: function () {
      var rows = D.films.map(function (f, i) {
        return '<a class="hall-row" href="#film/' + f.id + '" data-route="film/' + f.id + '" data-preview="' + frame(f.id, 1) + '" data-cursor="enter">' +
          '<span class="n">' + String(i + 1).padStart(2, "0") + '</span><span class="t">' + esc(f.title) + '</span><span class="k">' + esc(f.kind) +
          '</span><span class="y">' + esc(f.year) + '</span><span class="a" aria-hidden="true">' + ICON.right + "</span></a>";
      }).join("");
      var words = D.films.map(function (f) { return "<span>" + esc(f.title) + "<b>✦</b></span>"; }).join("");
      return back("room", "back to the room") +
        '<section class="wrap hall-head screen">' +
        '<p class="kicker"><span class="dot"></span>the screening hall</p>' +
        '<h1 class="display split">Seven films,<br><em>seven worlds.</em></h1>' +
        '<p class="lede" data-reveal style="margin-top:1.6rem">Each screen is a door. Step through one and you walk inside the film — built from its own frames.</p>' +
        sticker("made with", "midjourney · veo · kling · higgsfield", "blue tape", "--r:5deg;right:8%;top:26vh") +
        cue + "</section>" +
        '<section class="wrap"><div class="hall-list">' + rows + "</div></section>" +
        '<div class="marquee"><div class="marquee-track">' + words + words + "</div></div>" +
        '<section class="wrap" style="padding:6rem 0 12rem">' + nextLink("library", "Next door", "The library") + "</section>" +
        '<img class="hall-preview" id="hall-preview" alt="">';
    },

    film: function (r) {
      var f = findFilm(r.id), idx = D.films.indexOf(f), next = D.films[(idx + 1) % D.films.length];
      var lines = f.lines.map(function (l) { return '<section class="wrap film-line"><p class="split">' + esc(l) + "</p></section>"; }).join("");
      var flat = ""; for (var i = 0; i < f.frames; i++) flat += '<img src="' + frame(f.id, i) + '" alt="' + esc(f.title) + ' — frame ' + (i + 1) + '" loading="lazy">';
      var links = (f.links || []).map(function (l) { return outLink(l[1], cap(esc(l[0]))); }).join("") + outLink("https://drive.google.com/file/d/" + f.drive + "/view", "Open on Drive");
      return back("films", "back to the screening hall") +
        '<section class="wrap screen film-hero">' +
        '<p class="kicker"><span class="dot"></span>Film ' + String(idx + 1).padStart(2, "0") + " of " + String(D.films.length).padStart(2, "0") + (f.project ? " — project: " + esc(f.project) : "") + "</p>" +
        '<h1 class="display split">' + esc(f.title) + "</h1>" +
        '<div class="film-meta"><span class="chip live">' + esc(f.status) + '</span><span class="chip">' + esc(f.year) + '</span><span class="chip">' + esc(f.kind) + "</span></div>" +
        '<p class="lede" data-reveal>' + esc(f.logline) + "</p>" +
        sticker(f.label, "’" + (f.year.match(/\d\d$/) || ["26"])[0], "tape", "--r:-6deg;right:6%;top:18vh") +
        cue + "</section>" + lines +
        '<section class="wrap"><div class="film-flat">' + flat + "</div></section>" +
        '<section class="wrap film-end">' +
        '<button class="watch-btn btn btn-primary btn-lg" type="button" data-play="' + f.id + '" data-cursor="watch" data-magnetic><span class="btn-disc" aria-hidden="true">' + ICON.play + '</span><span class="btn-label">' + (f.id === "paralian" ? "Watch the draft clips" : "Watch the film") + "</span></button>" +
        '<div class="film-links">' + links + "</div>" +
        nextLink("film/" + next.id, "Next world", esc(next.title)) +
        "</section>" +
        '<p class="frame-hint">click a frame to hold it still</p>';
    },

    library: function () {
      var cards = D.poems.map(function (p) {
        return '<a class="book-card glass" href="#poem/' + p.id + '" data-route="poem/' + p.id + '" data-cursor="read">' +
          '<span class="k">' + (p.kind === "story" ? "story" : "poem") + '</span><span class="n">' + esc(p.num) + '</span><span class="t">' + esc(p.title) +
          '</span><span class="g">' + esc(p.gloss) + "</span></a>";
      }).join("");
      return back("room", "back to the room") +
        '<section class="wrap screen lib-head">' +
        '<p class="kicker"><span class="dot"></span>the library</p>' +
        '<h1 class="display split">The writing that<br><em>started everything.</em></h1>' +
        '<p class="lede" data-reveal style="margin-top:1.6rem">Before the films there were poems. Nine books float in the tower — touch one and it opens into the world it was written from.</p>' +
        sticker("tip", "the floating books are clickable", "mint tape", "--r:4deg;right:7%;top:30vh") +
        cue + "</section>" +
        '<section class="wrap"><div class="lib-shelf">' + cards + "</div></section>" +
        '<div class="marquee"><div class="marquee-track"><span>hiraeth<b>✦</b></span><span>toska<b>✦</b></span><span>caleö<b>✦</b></span><span>noctifer<b>✦</b></span><span>astrologia<b>✦</b></span><span>billet-doux<b>✦</b></span>' +
        "<span>hiraeth<b>✦</b></span><span>toska<b>✦</b></span><span>caleö<b>✦</b></span><span>noctifer<b>✦</b></span><span>astrologia<b>✦</b></span><span>billet-doux<b>✦</b></span></div></div>" +
        '<section class="wrap" style="padding:4rem 0 12rem">' + nextLink("stairs", "Next door", "The stairs") + '<p style="margin-top:2rem">' + outLink(D.links.substack, "The essays live on Substack") + "</p></section>";
    },

    poem: function (r) {
      var p = findPoem(r.id), i = D.poems.indexOf(p);
      var prev = D.poems[(i - 1 + D.poems.length) % D.poems.length], next = D.poems[(i + 1) % D.poems.length];
      var st = (D.stickers[p.id] || []).map(function (s, k) {
        var pos = ["right:6%;top:22vh", "left:52%;top:62vh", "right:14%;top:78vh"][k % 3];
        return sticker(s[0], s[1], ["", "blue", "mint"][k % 3] + " tape", "--r:" + (k % 2 ? 5 : -5) + "deg;" + pos);
      }).join("");
      return back("library", "back to the library") +
        '<article class="poem-page">' +
        '<section class="wrap screen poem-head">' +
        '<p class="kicker"><span class="dot"></span>' + (p.kind === "story" ? "story " : "poem ") + esc(p.num) + "</p>" +
        '<h1 class="display split">' + esc(p.title) + "</h1>" +
        '<p class="poem-gloss" data-reveal>' + esc(p.gloss) + "</p>" + st + cue + "</section>" +
        '<div class="poem-text">' + p.html + "</div>" +
        (p.id === "alexithymia" ? '<div class="poem-words" aria-hidden="true"></div>' : "") +
        '<nav class="poem-nav">' + nextLink("poem/" + prev.id, "Previous book", esc(prev.title)) + nextLink("poem/" + next.id, "Next book", esc(next.title), "text-align:right;align-items:flex-end") + "</nav>" +
        "</article>";
    },

    stairs: function () {
      var grid = D.posters.map(function (p, i) {
        return '<button type="button" data-poster="' + i + '"><img src="' + img("posters/" + p[0]) + '" alt="' + esc(p[1]) + '" loading="lazy"></button>';
      }).join("");
      var arch = D.archive.map(function (a, i) {
        return '<button class="arch-item glass" type="button" data-archive="' + i + '" data-cursor="view"><img src="' + img("archive/" + a[0]) + '" alt="' + esc(a[1]) + '" loading="lazy" data-wipe>' +
          "<figcaption><b>" + esc(a[1]) + "</b><i>" + esc(a[2]) + "</i></figcaption></button>";
      }).join("");
      return back("room", "back to the room") +
        '<div data-track>' +
        '<section class="wrap screen stairs-head">' +
        '<p class="kicker"><span class="dot"></span>the stairs — <a href="' + D.links.design + '" target="_blank" rel="noopener">@aesthetes_meraki</a></p>' +
        '<h1 class="display split">Posters on<br><em>the way up.</em></h1>' +
        '<p class="lede" data-reveal style="margin-top:1.6rem">Before the films, I designed. Climb the stairs — every frame on the wall is a poster I made.</p>' +
        sticker("graphic designer", "sculpting dreams into visual poetry", "tape", "--r:-4deg;right:8%;top:24vh") +
        cue + "</section>" +
        '<div class="stairs-spacer"></div></div>' +
        '<div class="stairs-caption" id="stairs-caption"><i></i><b></b></div>' +
        '<section class="wrap"><div class="poster-grid">' + grid + "</div></section>" +
        '<section class="archive"><div class="wrap">' +
        '<p class="kicker"><span class="dot"></span>at the top of the stairs</p>' +
        '<h2 class="display split" style="font-size:clamp(3rem,9vw,7.5rem)">The archive.</h2>' +
        '<p class="lede" data-reveal style="margin-top:1.2rem">Brand kits, logos, ads, campaigns and thumbnails — the other half of the work.</p>' +
        '<div class="stickers-inline">' + sticker("brand", "Kishmish · Sleek & Crafted", "blue", "--r:-3deg") + sticker("ads", "Audible · Alexa · Krispy Kreme", "mint", "--r:4deg") + sticker("thumbnails", "one hit 1M+ views", "ink", "--r:-2deg") + "</div>" +
        '<div class="archive-grid">' + arch + "</div>" +
        '<div style="padding-top:5rem">' + nextLink("lab", "Next door", "The lab") + "</div>" +
        "</div></section>";
    },

    lab: function () {
      var items = D.lab.map(function (it) {
        var media = it.images.map(function (p, k) {
          return '<button type="button" data-gallery="' + it.id + '" data-index="' + k + '" data-cursor="view"><img src="' + img(p) + '" alt="' + esc(it.title) + '" loading="lazy" data-wipe></button>';
        }).join("");
        return '<article class="lab-item' + (it.portrait ? " portrait" : "") + '">' +
          '<div class="lab-media">' + media + "</div>" +
          '<div class="lab-copy"><span class="sticker mint" style="position:relative;--r:-3deg"><b>' + esc(it.tag) + "</b><i>" + esc(it.year) + "</i></span>" +
          '<h3 class="split">' + esc(it.title) + '</h3><p class="body-copy" data-reveal>' + esc(it.blurb) + "</p>" +
          (it.tools ? '<p class="tools">' + esc(it.tools) + "</p>" : "") +
          (it.drive ? '<button class="play-btn btn btn-ghost" type="button" data-lab="' + it.id + '" data-cursor="watch" data-magnetic><span class="btn-ico" aria-hidden="true">' + ICON.play + '</span><span class="btn-label">Watch</span></button>' : "") +
          "</div></article>";
      }).join("");
      var gens = D.generations.map(function (g, i) {
        return '<figure class="polaroid" style="--r:' + [-4, 3, -2, 4, -3, 2][i % 6] + 'deg"><img src="' + img(g[0]) + '" alt="generation test — ' + esc(g[1]) + '" loading="lazy"><figcaption>' + esc(g[1]) + "</figcaption></figure>";
      }).join("");
      var boards = D.boards.map(function (b) {
        return '<a class="ticket" href="' + b[2] + '" target="_blank" rel="noopener"><small>admit one · ' + esc(b[1]) + "</small><b>" + esc(b[0]) + "</b></a>";
      }).join("");
      return back("room", "back to the room") +
        '<section class="wrap screen lab-head">' +
        '<p class="kicker"><span class="dot"></span>the lab</p>' +
        '<h1 class="lab-title split">Experiments, tool fights &amp; dead ends.</h1>' +
        sticker("WIP", "", "blue", "--r:9deg;left:min(62vw,640px);top:28vh") + sticker("", "nothing here is finished — that's the point", "tape", "--r:-5deg;right:6%;top:58vh") +
        cue + "</section>" +
        '<div class="wrap lab-items">' + items + "</div>" +
        '<section class="hscroll"><div class="hscroll-track"><div class="hscroll-intro"><p class="kicker"><span class="dot"></span>the wall of forty generations</p>' +
        '<h2 class="display" style="font-size:clamp(2.6rem,6vw,4.6rem)">The face wouldn’t hold.</h2><p class="body-copy" style="margin-top:1rem">Image tests from <em>The 9th Revolution</em> — Seedream 4.0 &amp; Nano Banana. The versions that almost made it.</p></div>' +
        gens + "</div></section>" +
        '<section class="wrap" style="padding:6rem 0 2rem"><p class="kicker"><span class="dot"></span>the paper trail</p><h2 class="display split" style="font-size:clamp(2.6rem,7vw,5.5rem)">Boards &amp; decks.</h2><div class="tickets">' + boards + "</div>" +
        '<div style="padding:3rem 0 10rem">' + nextLink("about", "Next door", "The window") + "</div></section>";
    },

    about: function () {
      return back("room", "back to the room") +
        '<section class="wrap screen about-head">' +
        '<p class="kicker"><span class="dot"></span>the window — about</p>' +
        '<h1 class="manifesto lit">I write about <span class="inl"><img src="' + frame("mishen", 0) + '" alt=""></span> <em>film</em> and <em>the mind.</em> Now I’m learning to make <span class="inl"><img src="' + frame("anamne", 3) + '" alt=""></span> them — with <em>machines,</em> <span class="inl wide"><img src="' + frame("paralian", 5) + '" alt=""></span> and with the <em>failure</em> left in the shot.</h1>' +
        "</section>" +
        '<div class="wrap about-grid">' +
        '<figure class="portrait" data-parallax="0.12"><img src="' + img("about/portrait") + '" alt="Tanisha Parhi" data-wipe></figure>' +
        '<div><p class="lede" data-reveal>I related to a man who wished his plane would crash. It took me an entire essay — through Fincher’s direction, the psychology of dissociation, and my own carefully maintained routines — to understand why.</p>' +
        '<div class="body-copy" data-reveal style="margin-top:1.4rem"><p>That is how I read films: one movie, several lenses at once. Psychology, cinematography, philosophy, and the admission I’d rather leave out.</p>' +
        "<p>I studied design first — posters, brands, thumbnails that crossed a million views. Then writing about films stopped being enough, and I started making them: with AI tools, a laptop, and no crew. I’m not arrived. I’m building — and this is the build.</p></div>" +
        '<div class="stickers-inline">' + sticker("available", "for collabs & commissions", "blue", "--r:-4deg") + sticker("writer", "poet · essayist", "mint", "--r:3deg") + sticker("designer", "@aesthetes_meraki", "ink", "--r:-2deg") + "</div></div></div>" +
        '<div class="marquee"><div class="marquee-track"><span>writer<b>✦</b></span><span>filmmaker in progress<b>✦</b></span><span>graphic designer<b>✦</b></span><span>poet<b>✦</b></span><span>essayist<b>✦</b></span>' +
        "<span>writer<b>✦</b></span><span>filmmaker in progress<b>✦</b></span><span>graphic designer<b>✦</b></span><span>poet<b>✦</b></span><span>essayist<b>✦</b></span></div></div>" +
        '<div class="wrap"><ul class="elsewhere">' +
        '<li><a href="' + D.links.substack + '" target="_blank" rel="noopener"><b>Substack</b><span>essays &amp; the film diary</span></a></li>' +
        '<li><a href="' + D.links.instagram + '" target="_blank" rel="noopener"><b>Instagram</b><span>@taniverse.tm</span></a></li>' +
        '<li><a href="' + D.links.design + '" target="_blank" rel="noopener"><b>Design</b><span>@aesthetes_meraki</span></a></li>' +
        '<li><a href="' + D.links.linkedin + '" target="_blank" rel="noopener"><b>LinkedIn</b><span>the professional room</span></a></li>' +
        '<li><a href="mailto:' + D.links.email + '"><b>Email</b><span>' + D.links.email + "</span></a></li></ul></div>";
    }
  };

  /* ============================================================
     NAVIGATION + TRANSITIONS
     ============================================================ */
  var page = $("#page");
  var tx = $("#tx");

  function render(r) {
    killEffects();
    page.innerHTML = r.name === "intro" ? PAGES.room() : PAGES[r.name](r);
    body.className = body.className.replace(/\broute-\S+/g, "").trim();
    body.classList.add("route-" + r.name);
    body.classList.toggle("room", r.name === "room" || r.name === "intro");
    lockScroll((r.name === "room" || r.name === "intro") && state.three);
    trackEl = $("[data-track]", page);
    scrollTop0();
    initEffects();
    if (r.name !== "intro") document.title = titleFor(r);
  }
  function titleFor(r) {
    var t = { room: "the room", films: "the screening hall", library: "the library", stairs: "the stairs", lab: "the lab", about: "about" }[r.name];
    if (r.name === "film") t = findFilm(r.id).title;
    if (r.name === "poem") t = findPoem(r.id).title;
    return (t ? t + " — " : "") + "TanRain · Tanisha Parhi";
  }

  /* the title card a transition holds while the next world loads */
  function card(r) {
    if (r.name === "film") { var f = findFilm(r.id); return ["Film " + String(D.films.indexOf(f) + 1).padStart(2, "0") + " — " + f.year, f.title]; }
    if (r.name === "poem") { var p = findPoem(r.id); return [(p.kind === "story" ? "Story " : "Poem ") + p.num, p.title]; }
    return ({ room: ["Back to", "The room"], films: ["Door 01", "The screening hall"], library: ["Door 02", "The library"], stairs: ["Door 03", "The stairs"], lab: ["Door 04", "The lab"], about: ["Door 05", "The window"] })[r.name] || ["", ""];
  }
  function kindFor(r) {
    if (r.name === "film") return "leader";
    if (r.name === "library" || r.name === "poem") return "page";
    if (r.name === "stairs") return "climb";
    if (r.name === "room") return "iris";
    return "portal";
  }

  function go(key, opts) {
    opts = opts || {};
    var r = parse("#" + key);
    if (state.busy || (state.route && state.route.key === r.key)) return Promise.resolve();
    state.busy = true;
    closeMenu();
    closeModal();
    if (!opts.fromHash && history.pushState) history.pushState(null, "", "#" + r.key);
    var x = opts.x != null ? opts.x : innerWidth / 2, y = opts.y != null ? opts.y : innerHeight / 2;
    var kind = kindFor(r);
    prefetchRoute(r); /* start building the next world now, while the transition plays */
    chime(0.5);
    return TX.cover(kind, x, y, card(r)).then(function () {
      state.route = r;
      render(r);
      return showWorld(r);
    }).then(function () {
      return TX.uncover(kind);
    }).then(function () {
      state.busy = false;
      page.focus({ preventScroll: true });
      idlePrefetch(r);
    }, function () { state.busy = false; TX.reset(); });
  }

  function showWorld(r) {
    if (!state.three) return Promise.resolve();
    return worldReady.then(function (W) {
      if (!W) return;
      return Promise.race([W.show(r.name === "intro" ? "room" : r.name, r.id), wait(8000)]);
    });
  }
  function wait(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }

  /* ============================================================
     PREFETCH — build worlds before they are needed
     ============================================================ */
  function prefetchRoute(r, soft) {
    if (!state.three || !window.WORLD || !r) return;
    window.WORLD.prefetch(r.name === "intro" ? "room" : r.name, r.id, soft);
  }
  var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 400); };
  function idlePrefetch(r) {
    if (!state.three) return;
    var next = [];
    if (r.name === "room" || r.name === "intro") next = ["films", "library", "stairs", "lab", "about"];
    else if (r.name === "films") next = D.films.slice(0, 3).map(function (f) { return "film/" + f.id; });
    else if (r.name === "film") { var i = D.films.indexOf(findFilm(r.id)); next = ["film/" + D.films[(i + 1) % D.films.length].id, "films"]; }
    else if (r.name === "library") next = D.poems.slice(0, 3).map(function (p) { return "poem/" + p.id; });
    else if (r.name === "poem") { var k = D.poems.indexOf(findPoem(r.id)); next = ["poem/" + D.poems[(k + 1) % D.poems.length].id, "library"]; }
    else next = ["room"];
    (function step() {
      if (state.busy) { setTimeout(step, 700); return; } /* never compete with a transition */
      var key = next.shift(); if (!key) return;
      idle(function () { prefetchRoute(parse("#" + key), true); setTimeout(step, 700); });
    })();
  }
  var hoverTimer = null;
  function onIntent(e) {
    var t = e.target.closest && e.target.closest("[data-route]");
    if (!t) return;
    clearTimeout(hoverTimer);
    var key = t.getAttribute("data-route");
    hoverTimer = setTimeout(function () { prefetchRoute(parse("#" + key)); }, 60);
  }
  document.addEventListener("pointerover", onIntent, { passive: true });
  document.addEventListener("focusin", onIntent);
  document.addEventListener("touchstart", onIntent, { passive: true });

  /* ============================================================
     TRANSITIONS — one per kind of door
     portal (water) · leader (film countdown) · page (a page turns) · climb (stairs) · iris (back to the room)
     ============================================================ */
  var TX = (function () {
    var title = $(".tx-title", tx), tSmall = $("small", title), tBig = $("b", title);
    var portalEl = $(".tx-portal", tx), rings = $$(".tx-rings i", tx);
    var leader = $(".tx-leader", tx), num = $(".lead-num", tx), sweep = $(".lead-sweep", tx), dial = $(".lead-dial", tx), sprockets = $$(".lead-sprockets", tx);
    var pageWrap = $(".tx-page", tx), sheet = $(".tx-sheet", tx);
    var climb = $(".tx-climb", tx), bars = $$(".tx-climb i", tx), iris = $(".tx-iris", tx);
    var disp = tx.querySelector("#tx-ripple feDisplacementMap"), turb = tx.querySelector("#tx-ripple feTurbulence");
    var simple = !hasGsap || reduced;
    var spin = null;

    function showTitle(c, delay) {
      tSmall.textContent = c[0]; tBig.textContent = c[1];
      if (simple) { title.style.opacity = 1; return; }
      gsap.fromTo(title, { opacity: 0, y: 26, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "expo.out", delay: delay || 0 });
    }
    function hideTitle() { if (!simple) gsap.to(title, { opacity: 0, y: -18, filter: "blur(8px)", duration: 0.35, ease: "power2.in" }); else title.style.opacity = 0; }
    function ripple(dur, peak) {
      if (!disp || simple) return;
      var o = { s: 0, f: 0.012 };
      gsap.timeline().to(o, { s: peak, f: 0.02, duration: dur * 0.5, ease: "sine.in", onUpdate: set }).to(o, { s: 0, f: 0.012, duration: dur * 0.5, ease: "sine.out", onUpdate: set });
      function set() { disp.setAttribute("scale", o.s.toFixed(1)); turb.setAttribute("baseFrequency", o.f.toFixed(4) + " " + (o.f * 1.6).toFixed(4)); }
    }
    function reset() {
      if (!simple) gsap.killTweensOf([portalEl, rings, leader, num, sweep, dial, sprockets, pageWrap, sheet, climb, bars, iris, title, tx]);
      if (spin) { spin.kill(); spin = null; }
      tx.className = ""; tx.removeAttribute("data-kind");
      [portalEl, leader, pageWrap, climb, iris, title, tx].forEach(function (el) { el.removeAttribute("style"); });
      rings.concat(bars, sprockets, [sheet, num, sweep, dial]).forEach(function (el) { el.removeAttribute("style"); });
    }

    var cover = {
      portal: function (x, y, c) {
        tx.style.setProperty("--x", x + "px"); tx.style.setProperty("--y", y + "px");
        return new Promise(function (res) {
          gsap.set(portalEl, { opacity: 1, clipPath: "circle(0% at " + x + "px " + y + "px)" });
          gsap.fromTo(rings, { scale: 0, opacity: 0.9 }, { scale: 1, opacity: 0, duration: 1.2, stagger: 0.1, ease: "power2.out" });
          ripple(0.9, 46);
          gsap.to(portalEl, { clipPath: "circle(150% at " + x + "px " + y + "px)", duration: 0.75, ease: "power3.in", onComplete: res });
          showTitle(c, 0.45);
        });
      },
      leader: function (x, y, c) {
        return new Promise(function (res) {
          gsap.set(leader, { opacity: 1, clipPath: "inset(0% 50% 0% 50%)" });
          gsap.to(leader, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.38, ease: "power3.inOut" });
          gsap.fromTo(sprockets[0], { xPercent: -100 }, { xPercent: 0, duration: 0.45, ease: "power3.out", delay: 0.1 });
          gsap.fromTo(sprockets[1], { xPercent: 100 }, { xPercent: 0, duration: 0.45, ease: "power3.out", delay: 0.1 });
          gsap.fromTo(dial, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.8)", delay: 0.2 });
          spin = gsap.fromTo(sweep, { rotate: 0 }, { rotate: 360, duration: 0.42, ease: "none", repeat: -1, delay: 0.25 });
          var n = 3;
          num.textContent = "3";
          var tick = function () { n -= 1; if (n < 1) { res(); return; } num.textContent = String(n); chime(n === 1 ? 2 : 1.5); setTimeout(tick, 230); };
          setTimeout(tick, 480);
          showTitle(c, 0.3);
        });
      },
      page: function (x, y, c) {
        return new Promise(function (res) {
          gsap.set(pageWrap, { opacity: 1 });
          gsap.fromTo(sheet, { rotateY: 92, transformOrigin: "left center" }, { rotateY: 0, duration: 0.75, ease: "power3.out", onComplete: res });
          showTitle(c, 0.35);
        });
      },
      climb: function (x, y, c) {
        return new Promise(function (res) {
          gsap.set(climb, { opacity: 1 });
          gsap.fromTo(bars.slice().reverse(), { yPercent: 102 }, { yPercent: 0, duration: 0.5, stagger: 0.055, ease: "power3.out", onComplete: res });
          showTitle(c, 0.4);
        });
      },
      iris: function (x, y, c) {
        return new Promise(function (res) {
          gsap.set(iris, { opacity: 1, "--ir": "110vmax" });
          gsap.to(iris, { "--ir": "0vmax", duration: 0.7, ease: "power3.in", onComplete: res });
          showTitle(c, 0.4);
        });
      }
    };
    var uncover = {
      portal: function () {
        return new Promise(function (res) {
          hideTitle(); ripple(0.8, 34);
          gsap.to(portalEl, { opacity: 0, scale: 1.08, filter: "blur(12px)", duration: 0.75, ease: "power2.out", onComplete: res });
        });
      },
      leader: function () {
        return new Promise(function (res) {
          hideTitle();
          if (spin) { spin.kill(); spin = null; }
          gsap.timeline({ onComplete: res })
            .set(leader, { backgroundColor: "#eef6fa" })
            .to(dial, { opacity: 0, duration: 0.05 })
            .set(leader, { backgroundColor: "#02060b" }, 0.07)
            .to(leader, { opacity: 0.25, duration: 0.06 }, 0.1).to(leader, { opacity: 0.8, duration: 0.05 })
            .to(leader, { opacity: 0.1, duration: 0.06 }).to(leader, { opacity: 0.55, duration: 0.05 })
            .to(leader, { opacity: 0, duration: 0.35, ease: "power2.out" });
        });
      },
      page: function () {
        return new Promise(function (res) {
          hideTitle();
          gsap.to(sheet, { rotateY: -100, transformOrigin: "left center", duration: 0.8, ease: "power3.in", onComplete: res });
        });
      },
      climb: function () {
        return new Promise(function (res) {
          hideTitle();
          gsap.to(bars.slice().reverse(), { yPercent: -102, duration: 0.5, stagger: 0.055, ease: "power3.in", onComplete: res });
        });
      },
      iris: function () {
        return new Promise(function (res) {
          hideTitle();
          gsap.to(iris, { "--ir": "110vmax", duration: 0.8, ease: "power3.out", delay: 0.1, onComplete: res });
        });
      }
    };

    return {
      cover: function (kind, x, y, c) {
        reset();
        tx.classList.add("on"); tx.setAttribute("data-kind", kind);
        if (simple) { tx.classList.add("simple"); showTitle(c); return wait(60); }
        return cover[kind](x, y, c);
      },
      uncover: function (kind) {
        if (simple) { reset(); return wait(30); }
        return uncover[kind]().then(reset);
      },
      reset: reset
    };
  })();

  window.addEventListener("popstate", function () {
    var r = parse(location.hash);
    if (r.name === "intro") r = parse("#room");
    if (!state.entered) enterDirect();
    go(r.key, { fromHash: true });
  });

  /* ============================================================
     THE EYES — intro + dive
     ============================================================ */
  var intro = $("#intro");
  var eyes = $("#eyes");
  var dived = false;

  function setLoad(p) { var i = $(".intro-load i"); if (i) i.style.width = Math.round(p * 100) + "%"; }

  function startIntro() {
    state.route = parse("#intro");
    render(state.route);
    var eyeImg = $$(".eyes-img", eyes).filter(function (im) { return getComputedStyle(im).display !== "none"; })[0];
    var imgReady = new Promise(function (res) { if (!eyeImg || eyeImg.complete) res(); else { eyeImg.onload = res; eyeImg.onerror = res; } });
    setLoad(0.15);
    var roomReady = state.three ? worldReady.then(function (W) { setLoad(0.5); return W ? Promise.race([W.show("room"), wait(9000)]) : null; }) : Promise.resolve();
    Promise.all([imgReady, roomReady]).then(function () {
      setLoad(1);
      intro.classList.add("ready");
      if (hasGsap && !reduced) gsap.fromTo(".intro-title", { opacity: 0, y: 30, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.6, ease: "expo.out" });
      armDive();
    });
    if (hasGsap && !reduced) gsap.fromTo(eyes, { scale: 1.08 }, { scale: 1, duration: 6, ease: "power2.out" });
  }

  function armDive() {
    var trigger = function (e) {
      if (dived) return;
      if (e && e.type === "keydown" && ["Tab", "Shift", "Meta", "Control", "Alt"].indexOf(e.key) >= 0) return;
      dive();
    };
    window.addEventListener("wheel", trigger, { passive: true });
    window.addEventListener("touchmove", trigger, { passive: true });
    window.addEventListener("keydown", trigger);
    $("#dive").addEventListener("click", trigger);
    eyes.addEventListener("click", trigger);
  }

  function dive() {
    if (dived) return;
    dived = true;
    intro.classList.add("diving");
    if (window.WORLD && window.WORLD.pullback) window.WORLD.pullback(2.6);
    var finished = false;
    var done = function () {
      if (finished) return;
      finished = true;
      intro.classList.add("gone");
      body.classList.add("entered");
      state.entered = true;
      state.route = parse("#room");
      if (history.replaceState) history.replaceState(null, "", "#room");
      document.title = titleFor(state.route);
      try { sessionStorage.setItem("tanrain.dived", "1"); } catch (e) { /* private mode */ }
      chime(0.5);
      idlePrefetch(state.route);
    };
    if (!hasGsap || reduced) { done(); return; }
    gsap.killTweensOf(eyes);
    eyes.style.setProperty("--hole", "0%");
    eyes.style.webkitMaskImage = eyes.style.maskImage = "radial-gradient(circle at var(--px, 28.1%) var(--py, 47.8%), transparent var(--hole), #000 calc(var(--hole) + 1.5%))";
    var tl = gsap.timeline({ onComplete: done });
    setTimeout(function () { if (!finished && !document.hidden) { tl.progress(1); done(); } }, 4200);
    tl.to(eyes, { scale: 11, duration: 2.4, ease: "power3.in" }, 0)
      .to(eyes, { "--hole": "160%", duration: 1.5, ease: "power2.in" }, 0.95)
      .to(".eyes-light", { opacity: 0, duration: 0.8 }, 0.4)
      .to(intro, { backgroundColor: "rgba(2,6,11,0)", duration: 0.6 }, 1.2);
  }

  /* ============================================================
     EFFECTS
     ============================================================ */
  var tickers = [];
  function killEffects() {
    if (window.ScrollTrigger) ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
    tickers.forEach(function (fn) { if (hasGsap) gsap.ticker.remove(fn); });
    tickers = [];
  }

  function split(el, inner) {
    var walk = function (node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement("span"); w.className = "w";
            if (inner) { var s = document.createElement("span"); s.textContent = part; w.appendChild(s); } else w.textContent = part;
            frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") {
          if (n.classList.contains("inl")) n.classList.add("w"); else walk(n);
        }
      });
    };
    walk(el);
    return $$(".w", el);
  }

  /* buttons: label rolls up on hover (a second copy slides in), and they lean toward the cursor */
  function enhanceButtons(root) {
    $$(".btn-label", root).forEach(function (l) {
      if (l.dataset.rolled) return;
      l.dataset.rolled = "1";
      var t = l.textContent;
      l.innerHTML = '<span class="roll"><span>' + esc(t) + '</span><span aria-hidden="true">' + esc(t) + "</span></span>";
    });
    if (!fine || reduced) return;
    $$("[data-magnetic]", root).forEach(function (el) {
      if (el.dataset.mag) return;
      el.dataset.mag = "1";
      var strength = el.classList.contains("btn-icon") ? 0.35 : 0.22;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.translate = (dx * strength).toFixed(1) + "px " + (dy * strength).toFixed(1) + "px";
      });
      el.addEventListener("pointerleave", function () { el.style.translate = ""; });
    });
  }

  function initEffects() {
    enhanceButtons(page);
    initStickers();
    initPreview();
    if (!hasGsap || !window.ScrollTrigger || reduced) {
      $$(".lit .w").forEach(function (w) { w.classList.add("on"); });
      return;
    }
    var ST = ScrollTrigger;

    $$(".split", page).forEach(function (el) {
      var words = split(el, true).map(function (w) { return w.firstChild; }).filter(function (n) { return n && n.nodeType === 1; });
      gsap.from(words, { yPercent: 115, rotate: 4, duration: 1.2, ease: "expo.out", stagger: 0.035, scrollTrigger: { trigger: el, start: "top 88%" } });
    });
    $$(".lit", page).forEach(function (el) {
      var words = split(el, false);
      ST.create({ trigger: el, start: "top 75%", end: "bottom 35%", onUpdate: function (s) {
        var n = Math.floor(s.progress * (words.length + 1));
        words.forEach(function (w, i) { w.classList.toggle("on", i < n); });
      } });
      words.slice(0, 3).forEach(function (w) { w.classList.add("on"); });
    });
    $$("[data-reveal]", page).forEach(function (el) {
      gsap.from(el, { opacity: 0, y: 40, filter: "blur(8px)", duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } });
    });
    $$(".poem-text > p", page).forEach(function (el) {
      gsap.from(el, { opacity: 0, y: 60, filter: "blur(10px)", duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%" } });
    });
    $$("[data-wipe]", page).forEach(function (el) {
      gsap.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)", scale: 1.15 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%" } });
    });
    $$("[data-parallax]", page).forEach(function (el) {
      var k = parseFloat(el.getAttribute("data-parallax")) || 0.15;
      gsap.to(el, { yPercent: -100 * k, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    });
    $$(".sticker", page).forEach(function (el) {
      gsap.from(el, { scale: 2.4, rotate: (Math.random() - 0.5) * 70, opacity: 0, duration: 0.9, ease: "back.out(2.2)", delay: 0.2 + Math.random() * 0.3, scrollTrigger: { trigger: el, start: "top 95%" } });
    });
    $$(".hall-row, .book-card, .arch-item, .ticket", page).forEach(function (el, i) {
      gsap.from(el, { opacity: 0, y: 50, duration: 1, ease: "expo.out", delay: (i % 4) * 0.06, scrollTrigger: { trigger: el, start: "top 94%" } });
    });
    $$(".screen > .display, .screen > .manifesto, .screen > .lab-title", page).forEach(function (el) {
      gsap.to(el, { yPercent: -18, opacity: 0.25, ease: "none", scrollTrigger: { trigger: el.parentNode, start: "top top", end: "bottom top", scrub: true } });
    });
    $$(".scroll-cue", page).forEach(function (el) {
      gsap.to(el, { opacity: 0, ease: "none", scrollTrigger: { trigger: el.parentNode, start: "top top", end: "20% top", scrub: true } });
    });
    $$(".marquee-track", page).forEach(function (track) {
      var x = 0;
      var fn = function () {
        var half = track.scrollWidth / 2;
        var v = lenis ? Math.abs(lenis.velocity || 0) : 0;
        x -= 0.6 + Math.min(v, 60) * 0.25;
        if (half > 0 && -x >= half) x += half;
        track.style.transform = "translateX(" + x + "px)";
      };
      gsap.ticker.add(fn); tickers.push(fn);
    });
    $$(".hscroll", page).forEach(function (sec) {
      var track = $(".hscroll-track", sec);
      var dist = function () { return Math.max(0, track.scrollWidth - innerWidth); };
      gsap.to(track, { x: function () { return -dist(); }, ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true } });
    });
    if ($(".poem-words", page)) floatingWords();
    ST.refresh();
    /* lazy images change the page height — re-measure every trigger as they arrive */
    var queued = null;
    var remeasure = function () { clearTimeout(queued); queued = setTimeout(function () { ST.refresh(); }, 120); };
    $$("img", page).forEach(function (im) { if (!im.complete) { im.addEventListener("load", remeasure, { once: true }); im.addEventListener("error", remeasure, { once: true }); } });
  }

  /* stickers — drag them anywhere */
  function initStickers() {
    $$(".sticker", page).forEach(function (el) {
      var sx, sy, ox = 0, oy = 0, dragging = false;
      el.addEventListener("pointerdown", function (e) {
        dragging = true; sx = e.clientX - ox; sy = e.clientY - oy;
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* synthetic event */ }
        el.style.zIndex = 40; chime(1.5);
      });
      el.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        ox = e.clientX - sx; oy = e.clientY - sy;
        el.style.translate = ox + "px " + oy + "px";
      });
      var up = function () { dragging = false; };
      el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    });
  }

  /* hover previews in the screening-hall list */
  function initPreview() {
    var pv = $("#hall-preview", page);
    if (!pv || !fine) return;
    $$(".hall-row", page).forEach(function (row) {
      row.addEventListener("mouseenter", function () { pv.src = row.dataset.preview; pv.classList.add("on"); });
      row.addEventListener("mouseleave", function () { pv.classList.remove("on"); });
      row.addEventListener("mousemove", function (e) { pv.style.transform = "translate(" + (e.clientX + 28) + "px," + (e.clientY - 90) + "px) rotate(-3deg)"; });
    });
  }

  /* Alexithymia — the butterflies of unspoken words */
  function floatingWords() {
    var box = $(".poem-words", page);
    var words = ["unspoken", "butterflies", "graveyard of words", "ocean", "chains", "constellations", "silent", "ballad", "drowning", "a choice", "voice deferred", "unsung"];
    var els = words.map(function (w, i) {
      var s = document.createElement("span"); s.textContent = w;
      s.style.fontSize = (1 + Math.random() * 1.6) + "rem"; box.appendChild(s);
      return { el: s, x: Math.random() * innerWidth, y: Math.random() * innerHeight, vx: (Math.random() - 0.5) * 0.4, vy: -0.15 - Math.random() * 0.35, p: i };
    });
    var fn = function (t) {
      els.forEach(function (o) {
        o.x += o.vx + Math.sin(t * 0.8 + o.p) * 0.3; o.y += o.vy;
        if (o.y < -60) { o.y = innerHeight + 40; o.x = Math.random() * innerWidth; }
        o.el.style.transform = "translate(" + o.x.toFixed(1) + "px," + o.y.toFixed(1) + "px)";
      });
    };
    gsap.ticker.add(fn); tickers.push(fn);
  }

  /* ============================================================
     CURSOR
     ============================================================ */
  if (fine && !reduced) {
    body.classList.add("custom-cursor");
    var cur = $("#cursor"), dot = $("span", cur), cx = innerWidth / 2, cy = innerHeight / 2, px = cx, py = cy;
    window.addEventListener("pointermove", function (e) { px = e.clientX; py = e.clientY; });
    (function loop() {
      cx += (px - cx) * 0.22; cy += (py - cy) * 0.22;
      cur.style.transform = "translate(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px)";
      requestAnimationFrame(loop);
    })();
    document.addEventListener("pointerover", function (e) {
      var t = e.target.closest("[data-cursor], .label3d");
      cur.classList.toggle("big", !!t);
      dot.textContent = t ? (t.getAttribute("data-cursor") || "enter") : "";
    });
  }
  window.TR_cursor = function (label) {
    var c = $("#cursor"); if (!c) return;
    c.classList.toggle("big", !!label); $("span", c).textContent = label || "";
  };

  /* ============================================================
     MODAL — the player, the lightbox
     ============================================================ */
  var modal = $("#modal"), mBox = $(".modal-box", modal), mMedia = $(".modal-media", modal), mNav = $(".modal-nav", modal);
  var gallery = null, lastFocus = null;

  function openModal(o) {
    if (modal.hidden) lastFocus = document.activeElement;
    mMedia.innerHTML = "";
    if (o.drive) {
      var fr = document.createElement("div"); fr.className = "video-frame" + (o.portrait ? " portrait" : "");
      var ifr = document.createElement("iframe");
      ifr.src = "https://drive.google.com/file/d/" + o.drive + "/preview";
      ifr.title = o.title; ifr.allow = "autoplay; fullscreen";
      fr.appendChild(ifr); mMedia.appendChild(fr);
    } else if (o.image) {
      var im = document.createElement("img"); im.src = o.image; im.alt = o.title || ""; mMedia.appendChild(im);
    }
    $(".modal-meta", modal).textContent = o.meta || "";
    $("#modal-title").textContent = o.title || "";
    $(".modal-body", modal).innerHTML = o.html || "";
    $(".modal-info", modal).style.display = o.title || o.html ? "" : "none";
    mBox.classList.toggle("tall", !!o.portrait);
    mNav.hidden = !gallery;
    modal.hidden = false;
    lockScroll(true);
    $(".modal-x", modal).focus({ preventScroll: true });
    if (window.WORLD) window.WORLD.setPaused(true);
  }
  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true; mMedia.innerHTML = ""; gallery = null;
    lockScroll(!!(state.route && state.route.name === "room" && state.three));
    if (window.WORLD) window.WORLD.setPaused(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function showGallery(list, i, title, meta) {
    gallery = { list: list, i: (i + list.length) % list.length, title: title, meta: meta };
    var g = gallery.list[gallery.i];
    openModal({ image: g[0], title: g[1] || title, meta: meta ? meta + " · " + (gallery.i + 1) + " / " + list.length : "" });
  }
  function stepGallery(d) { if (gallery) showGallery(gallery.list, gallery.i + d, gallery.title, gallery.meta); }
  $(".modal-prev", modal).addEventListener("click", function () { stepGallery(-1); });
  $(".modal-next", modal).addEventListener("click", function () { stepGallery(1); });

  function playFilm(id) {
    var f = findFilm(id); if (!f) return;
    var stills = ""; for (var i = 0; i < Math.min(f.frames, 6); i++) stills += '<img src="' + frame(f.id, i) + '" alt="" loading="lazy">';
    var links = (f.links || []).map(function (l) { return '<a href="' + l[1] + '" target="_blank" rel="noopener">' + esc(l[0]) + " ↗</a>"; }).join("");
    gallery = null;
    openModal({ drive: f.drive, title: f.title, meta: [f.status, f.year, f.kind].join(" · "), html: "<p>" + esc(f.logline) + '</p><div class="stills">' + stills + "</div>" + links });
  }
  function playLab(id) {
    var it = D.lab.filter(function (x) { return x.id === id; })[0]; if (!it) return;
    gallery = null;
    openModal({ drive: it.drive, portrait: it.portrait, title: it.title, meta: it.tag + " · " + it.year, html: "<p>" + esc(it.blurb) + "</p>" + (it.tools ? "<p>" + esc(it.tools) + "</p>" : "") });
  }

  /* ============================================================
     CLICKS + KEYS
     ============================================================ */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-route], [data-play], [data-lab], [data-gallery], [data-poster], [data-archive], [data-dismiss]");
    if (!t) { if (body.classList.contains("menu-open") && !e.target.closest("#menu, #menu-btn")) closeMenu(); return; }
    if (t.hasAttribute("data-dismiss")) { e.preventDefault(); closeModal(); return; }
    if (t.hasAttribute("data-route")) {
      e.preventDefault();
      if (!state.entered) enterDirect();
      go(t.getAttribute("data-route"), { x: e.clientX || innerWidth / 2, y: e.clientY || innerHeight / 2 });
      return;
    }
    e.preventDefault();
    if (t.hasAttribute("data-play")) return playFilm(t.getAttribute("data-play"));
    if (t.hasAttribute("data-lab")) return playLab(t.getAttribute("data-lab"));
    if (t.hasAttribute("data-gallery")) {
      var it = D.lab.filter(function (x) { return x.id === t.getAttribute("data-gallery"); })[0];
      return showGallery(it.images.map(function (p) { return [img(p), it.title]; }), +t.getAttribute("data-index"), it.title, it.tag);
    }
    if (t.hasAttribute("data-poster")) return showGallery(D.posters.map(function (p) { return [img("posters/" + p[0]), p[1]]; }), +t.getAttribute("data-poster"), "", "poster");
    if (t.hasAttribute("data-archive")) return showGallery(D.archive.map(function (a) { return [img("archive/" + a[0]), a[1]]; }), +t.getAttribute("data-archive"), "", "archive");
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (!modal.hidden) closeModal();
      else if (body.classList.contains("menu-open")) closeMenu();
      else if (state.entered && state.route && state.route.name !== "room") go(state.route.name === "film" ? "films" : state.route.name === "poem" ? "library" : "room");
    }
    if (!modal.hidden && gallery && (e.key === "ArrowRight" || e.key === "ArrowLeft")) stepGallery(e.key === "ArrowRight" ? 1 : -1);
  });

  /* menu */
  var menuBtn = $("#menu-btn");
  function closeMenu() { body.classList.remove("menu-open"); menuBtn.setAttribute("aria-expanded", "false"); }
  menuBtn.addEventListener("click", function () {
    var on = !body.classList.contains("menu-open");
    body.classList.toggle("menu-open", on); menuBtn.setAttribute("aria-expanded", String(on));
    if (on) chime(1);
  });

  /* ============================================================
     SOUND — underwater rain + a low pad, synthesised
     ============================================================ */
  var audio = null;
  function initAudio() {
    if (audio) return audio;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    var ctx = new AC(), len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0), b0 = 0, b1 = 0, b2 = 0;
    for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11; }
    var src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1400;
    var rain = ctx.createGain(); rain.gain.value = 0;
    src.connect(lp); lp.connect(rain); rain.connect(ctx.destination); src.start();
    var pad = ctx.createGain(); pad.gain.value = 0; pad.connect(ctx.destination);
    [110, 164.81, 220, 329.63].forEach(function (f, n) { var o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f; var g = ctx.createGain(); g.gain.value = n === 3 ? 0.1 : 0.3; o.connect(g); g.connect(pad); o.start(); });
    audio = { ctx: ctx, rain: rain, pad: pad };
    return audio;
  }
  function setSound(on) {
    state.sound = on; $("#sound-btn").setAttribute("aria-pressed", String(on));
    var a = on ? initAudio() : audio; if (!a) return;
    if (a.ctx.state === "suspended") a.ctx.resume();
    var t = a.ctx.currentTime;
    a.rain.gain.setTargetAtTime(on ? 0.4 : 0, t, 0.8); a.pad.gain.setTargetAtTime(on ? 0.03 : 0, t, 1.4);
  }
  var NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
  function chime(oct) {
    if (!state.sound || !audio) return;
    var ctx = audio.ctx, t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = NOTES[Math.floor(Math.random() * NOTES.length)] * (oct || 1);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.045, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 2);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 2.1);
  }
  $("#sound-btn").addEventListener("click", function () { setSound(!state.sound); });

  /* ============================================================
     BOOT
     ============================================================ */
  function enterDirect() {
    dived = true;
    intro.classList.add("gone");
    body.classList.add("entered");
    state.entered = true;
  }

  window.TR = {
    is3d: function () { return state.three; },
    progress: progress,
    route: function () { return state.route; },
    go: function (key, o) { return go(key, o); },
    chime: chime,
    cursor: function (label) { window.TR_cursor(label); },
    setLoad: setLoad,
    caption: function (kicker, title) {
      var c = $("#stairs-caption"); if (!c) return;
      c.classList.toggle("on", !!title);
      if (title) { $("i", c).textContent = kicker; $("b", c).textContent = title; }
    },
    openPoster: function (i) { showGallery(D.posters.map(function (p) { return [img("posters/" + p[0]), p[1]]; }), i, "", "poster"); },
    openFrame: function (id, n) { var f = findFilm(id); var list = []; for (var i = 0; i < f.frames; i++) list.push([frame(id, i), f.title]); showGallery(list, n, f.title, "frame"); },
    fail: fail3d
  };

  enhanceButtons(document);
  var first = parse(location.hash);
  var seen = false; try { seen = sessionStorage.getItem("tanrain.dived") === "1"; } catch (e) { /* private mode */ }
  if (first.name === "intro" || (first.name === "room" && !seen)) {
    startIntro();
  } else {
    enterDirect();
    state.route = first;
    render(first);
    showWorld(first).then(function () { idlePrefetch(first); });
  }
  window.addEventListener("resize", function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); });
})();
