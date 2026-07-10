/* TANRAIN — a house at blue hour
   World mode: four rooms on a 2×2 plane, camera drifts between them.
   Fallback: plain scroll (default, no JS needed). */

(function () {
  "use strict";

  var ROOMS = { hall: [0, 0], films: [1, 0], lab: [0, 1], library: [1, 1] };
  var NAMES = { hall: "the hall", films: "the screening room", lab: "the lab", library: "the library" };
  var world = document.getElementById("world");
  var maplabel = document.getElementById("maplabel");

  document.body.classList.add("js");
  var sky = { a: document.querySelector(".stars-a"), b: document.querySelector(".stars-b") };
  var veil = document.getElementById("veil");
  var current = "hall";

  function worldCapable() {
    return (
      window.matchMedia("(min-width: 900px)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function isWorld() {
    return document.body.classList.contains("world");
  }

  /* ---------- camera ---------- */
  function goTo(name, instant) {
    if (!ROOMS[name]) return;
    current = name;

    if (isWorld()) {
      var pos = ROOMS[name];
      if (instant) world.style.transition = "none";
      world.style.transform =
        "translate3d(" + pos[0] * -100 + "vw, " + pos[1] * -100 + "vh, 0)";
      if (instant) {
        void world.offsetHeight; /* flush so the next move animates */
        world.style.transition = "";
      }
      /* parallax drift — sky moves at one-tenth camera speed */
      if (sky.a) sky.a.style.transform = "translate(" + pos[0] * -4 + "%, " + pos[1] * -4 + "%)";
      if (sky.b) sky.b.style.transform = "translate(" + pos[0] * -2 + "%, " + pos[1] * -2 + "%)";
      document.querySelectorAll(".room").forEach(function (r) {
        r.classList.toggle("active", r.id === name);
      });
    } else {
      var el = document.getElementById(name);
      if (el) el.scrollIntoView({ behavior: instant ? "auto" : "smooth" });
    }

    document.querySelectorAll("#map .mroom").forEach(function (r) {
      r.classList.toggle("here", r.getAttribute("data-goto") === name);
    });
    document.querySelectorAll("#flatnav a").forEach(function (a) {
      a.classList.toggle("here", a.getAttribute("data-goto") === name);
    });
    if (maplabel) maplabel.innerHTML = "you are in <em>" + NAMES[name] + "</em>";
    document.body.setAttribute("data-room", name);
    if (history.replaceState) history.replaceState(null, "", "#" + name);
  }

  /* ---------- mode switching ---------- */
  function applyMode() {
    var want = worldCapable();
    if (want && !isWorld()) {
      document.body.classList.add("world");
      goTo(current, true);
    } else if (!want && isWorld()) {
      document.body.classList.remove("world");
      world.style.transform = "";
      if (sky.a) sky.a.style.transform = "";
      if (sky.b) sky.b.style.transform = "";
    }
  }

  /* ---------- navigation wiring ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-goto]");
    if (!t) return;
    e.preventDefault();
    goTo(t.getAttribute("data-goto"));
  });

  document.addEventListener("keydown", function (e) {
    if (!isWorld()) return;
    if (e.target.matches("input, textarea")) return;
    var pos = ROOMS[current];
    var next = null;
    if (e.key === "ArrowRight" && pos[0] === 0) next = pos[1] === 0 ? "films" : "library";
    if (e.key === "ArrowLeft" && pos[0] === 1) next = pos[1] === 0 ? "hall" : "lab";
    if (e.key === "ArrowDown" && pos[1] === 0) next = pos[0] === 0 ? "lab" : "library";
    if (e.key === "ArrowUp" && pos[1] === 1) next = pos[0] === 0 ? "hall" : "films";
    if (next) {
      e.preventDefault();
      goTo(next);
    }
  });

  /* ---------- veil ---------- */
  var enterBtn = document.getElementById("enter-btn");
  if (enterBtn) {
    enterBtn.addEventListener("click", function () {
      veil.classList.add("gone");
    });
  }

  /* ---------- lazy video iframes + one-open-at-a-time ---------- */
  document.querySelectorAll("details").forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (!d.open) return;
      /* load the Drive player only on first open — keeps the page light */
      d.querySelectorAll("iframe[data-src]").forEach(function (f) {
        f.src = f.getAttribute("data-src");
        f.removeAttribute("data-src");
      });
      /* close siblings within the same section */
      var section = d.closest("section");
      if (section) {
        section.querySelectorAll("details[open]").forEach(function (o) {
          if (o !== d && !o.contains(d) && !d.contains(o)) o.open = false;
        });
      }
      /* drift the opened piece into view — scroll the room, never the camera */
      setTimeout(function () {
        var room = d.closest(".room");
        if (isWorld() && room) {
          room.scrollTo({ top: Math.max(0, d.offsetTop - 90), behavior: "smooth" });
        } else {
          d.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 150);
    });
  });

  /* ---------- blur-up images ---------- */
  document.querySelectorAll("img").forEach(function (img) {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add("loaded");
    } else {
      img.addEventListener("load", function () { img.classList.add("loaded"); });
      img.addEventListener("error", function () { img.classList.add("loaded"); });
    }
  });

  /* ---------- lantern — a single warm source in a cool room ---------- */
  var lantern = document.getElementById("lantern");
  if (lantern && window.matchMedia("(hover: hover)").matches) {
    var lx = -400, ly = -400, tx = lx, ty = ly, lit = false, drifting = false;
    function drift() {
      var dx = tx - lx, dy = ty - ly;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) { drifting = false; return; }
      lx += dx * 0.06;
      ly += dy * 0.06;
      lantern.style.transform = "translate(" + lx.toFixed(1) + "px, " + ly.toFixed(1) + "px)";
      requestAnimationFrame(drift);
    }
    document.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!lit) { lx = tx; ly = ty; lit = true; lantern.classList.add("on"); }
      if (!drifting) { drifting = true; requestAnimationFrame(drift); }
    });
  }

  /* ---------- camera guard — the house pans, it never scrolls ---------- */
  var house = document.getElementById("house");
  house.addEventListener("scroll", function () {
    if (isWorld()) { house.scrollLeft = 0; house.scrollTop = 0; }
  });

  /* ---------- init ---------- */
  var hash = location.hash.replace("#", "");
  if (ROOMS[hash]) current = hash;

  applyMode();
  goTo(current, true);

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyMode, 200);
  });
  var mq = window.matchMedia("(min-width: 900px)");
  if (mq.addEventListener) mq.addEventListener("change", applyMode);
})();
