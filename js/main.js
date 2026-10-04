/* TANRAIN — the 3D engine.
   One renderer, many worlds. Each world is a module in js/scenes/ that returns
   { scene, camera, ready, hotspots, update(dt, t, progress, pointer), hover(id), dive(id), pullback(sec), dispose() }.
   Exposes window.WORLD for app.js. */

import * as THREE from "three";

const TR = window.TR;
const D = window.TR_DATA;
const V = new URL(import.meta.url).search; /* cache-bust scene modules with the same ?v= as main.js */

function fail() { window.dispatchEvent(new Event("world:fail")); }

function boot() {
  if (!TR || !TR.is3d()) return;
  const canvas = document.getElementById("gl");
  const vw = () => innerWidth || document.documentElement.clientWidth || 1280;
  const vh = () => innerHeight || document.documentElement.clientHeight || 800;
  const small = Math.min(vw(), vh()) < 700;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, powerPreference: "high-performance" });
  } catch (e) { fail(); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.setSize(vw(), vh(), false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x02060b, 1);
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); TR.fail(); });

  /* ---------- textures ----------
     Chrome/Firefox decode images off the main thread (ImageBitmap) so a world can stream
     its frames in without stutter; Safari keeps the classic loader. */
  const ua = navigator.userAgent;
  const useBitmaps = typeof createImageBitmap === "function" && /Chrome|Firefox/.test(ua);
  const bitmapLoader = useBitmaps ? new THREE.ImageBitmapLoader().setOptions({ imageOrientation: "flipY" }) : null;
  const loader = new THREE.TextureLoader();
  const cache = new Map();
  function tex(url) {
    if (cache.has(url)) return cache.get(url);
    const done = (t, res) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; res(t); };
    const p = new Promise((res) => {
      if (bitmapLoader) {
        bitmapLoader.load(url, (bmp) => { const t = new THREE.Texture(bmp); t.flipY = false; t.needsUpdate = true; done(t, res); }, undefined, () => res(null));
      } else {
        loader.load(url, (t) => done(t, res), undefined, () => res(null));
      }
    });
    cache.set(url, p);
    return p;
  }
  const ctx = { THREE, renderer, tex, D, vw, vh, small, TR, aspect: () => vw() / vh() };

  /* ---------- worlds ----------
     Built worlds stay in memory (most recent eight), so going back is instant.
     prefetch() builds and compiles a world before it is shown — on hover, and in idle time. */
  const MODULES = {
    room: () => import("./scenes/room.js" + V),
    films: () => import("./scenes/hall.js" + V),
    film: () => import("./scenes/film.js" + V),
    library: () => import("./scenes/library.js" + V),
    poem: () => import("./scenes/poem.js" + V),
    stairs: () => import("./scenes/stairs.js" + V),
    lab: () => import("./scenes/ambient.js" + V),
    about: () => import("./scenes/ambient.js" + V)
  };
  const PINNED = new Set(["room", "films", "library"]);
  const LIMIT = small ? 6 : 10;
  const built = new Map();     /* key -> inst, in recency order */
  const building = new Map();  /* key -> Promise<inst> */
  let current = null, currentKey = null, paused = false;
  const keyOf = (name, id) => (id ? name + ":" + id : name);

  function touch(key, inst) {
    built.delete(key); built.set(key, inst);
    while (built.size > LIMIT) {
      const oldest = [...built.keys()].find((k) => !PINNED.has(k) && k !== currentKey);
      if (!oldest) break;
      const gone = built.get(oldest); built.delete(oldest);
      if (gone.dispose) gone.dispose();
    }
  }

  function build(name, id) {
    const key = keyOf(name, id);
    if (built.has(key)) return Promise.resolve(built.get(key));
    if (building.has(key)) return building.get(key);
    const p = MODULES[name]().then(async (mod) => {
      const inst = mod.create(ctx, { name, id });
      inst.key = key;
      await inst.ready;
      try {
        if (renderer.compileAsync) await renderer.compileAsync(inst.scene, inst.camera);
        else renderer.compile(inst.scene, inst.camera);
      } catch (e) { /* compile lazily on first frame instead */ }
      building.delete(key);
      touch(key, inst);
      return inst;
    }).catch((e) => { building.delete(key); throw e; });
    building.set(key, p);
    return p;
  }

  function prefetch(name, id, soft) {
    if (!MODULES[name]) return;
    /* idle (soft) prefetches only fill free slots, so they never evict a world you've visited */
    if (soft && !built.has(keyOf(name, id)) && built.size + building.size >= LIMIT) return;
    build(name, id).catch(() => {});
  }

  async function show(name, id) {
    const key = keyOf(name, id);
    if (key === currentKey && current) return;
    let inst;
    try { inst = await build(name, id); } catch (e) { console.warn("[world]", e); return; }
    const old = current;
    if (old && old !== inst && old.exit) old.exit();
    current = inst; currentKey = key;
    touch(key, inst);
    smooth = TR.progress();
    resize();
    if (inst.enter) inst.enter();
    buildLabels(inst);
  }

  /* ---------- labels pinned to 3D anchors ---------- */
  const labelBox = document.getElementById("labels");
  let labels = [];
  function buildLabels(inst) {
    labelBox.innerHTML = "";
    labels = (inst.hotspots || []).filter((h) => h.label).map((h) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "label3d";
      el.innerHTML = "<b>" + h.label + "</b>" + (h.sub ? "<i>" + h.sub + "</i>" : "");
      el.addEventListener("click", (e) => activate(h, e.clientX, e.clientY));
      el.addEventListener("mouseenter", () => setHover(h.id));
      el.addEventListener("mouseleave", () => setHover(null));
      labelBox.appendChild(el);
      return { h, el };
    });
    setTimeout(() => labels.forEach((l) => l.el.classList.add("on")), 600);
  }
  const v3 = new THREE.Vector3();
  function placeLabels() {
    const cam = current.camera, W = vw(), H = vh();
    for (const l of labels) {
      const a = l.h.anchor;
      if (!a || (l.h.visible && !l.h.visible())) { l.el.style.visibility = "hidden"; continue; }
      v3.copy(a).project(cam);
      if (v3.z > 1 || Math.abs(v3.x) > 1.15 || Math.abs(v3.y) > 1.15) { l.el.style.visibility = "hidden"; continue; }
      l.el.style.visibility = "";
      l.el.style.transform = `translate(${((v3.x * 0.5 + 0.5) * W).toFixed(1)}px, ${((-v3.y * 0.5 + 0.5) * H).toFixed(1)}px) translate(-50%, calc(-100% - 20px))`;
    }
  }

  /* ---------- picking ---------- */
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2(-9, -9);
  const look = new THREE.Vector2(0, 0); // smoothed pointer for parallax
  let hovered = null, ptrDirty = false, down = null, diving = false;

  function setHover(id) {
    if (id === hovered) return;
    hovered = id;
    if (current && current.hover) current.hover(id);
    labels.forEach((l) => l.el.classList.toggle("hot", l.h.id === id));
    const h = id && current.hotspots.find((x) => x.id === id);
    if (h && h.route) { const [n, i] = h.route.split("/"); prefetch(n, i); } /* hovering a portal starts building its world */
    TR.cursor && TR.cursor(h ? h.cursor || "enter" : "");
    canvas.style.cursor = id ? "pointer" : "";
    if (id) TR.chime(1);
  }
  function pick() {
    if (!current || !current.pickables || !current.pickables.length) return null;
    ray.setFromCamera(ptr, current.camera);
    const hit = ray.intersectObjects(current.pickables, false)[0];
    return hit ? hit.object.userData.hot : null;
  }
  async function activate(h, x, y) {
    if (diving) return;
    if (h.action) { h.action(); return; }
    if (!h.route) return;
    diving = true;
    setHover(null);
    try { if (current.dive) await current.dive(h.id); } catch (e) { /* keep going */ }
    diving = false;
    TR.go(h.route, { x: x ?? vw() / 2, y: y ?? vh() / 2 });
  }

  const setPtr = (e) => { ptr.x = (e.clientX / vw()) * 2 - 1; ptr.y = -(e.clientY / vh()) * 2 + 1; };
  window.addEventListener("pointermove", (e) => { setPtr(e); ptrDirty = e.pointerType === "mouse"; });
  canvas.addEventListener("pointerleave", () => setHover(null));
  window.addEventListener("pointerdown", (e) => { if (e.target === canvas || e.target.closest("#page")) down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  window.addEventListener("pointerup", (e) => {
    if (!down || !current || paused) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), quick = performance.now() - down.t < 450;
    down = null;
    if (moved > 8 || !quick) return;
    if (e.target.closest("a, button, .sticker, input, #menu, #modal, .label3d")) return;
    setPtr(e);
    const id = pick();
    const h = id && current.hotspots.find((x) => x.id === id);
    if (h) activate(h, e.clientX, e.clientY);
  });

  /* ---------- loop ---------- */
  let last = performance.now(), t = 0, smooth = 0, sizeW = 0, sizeH = 0;
  function resize() {
    sizeW = vw(); sizeH = vh();
    renderer.setSize(sizeW, sizeH, false);
    if (current) {
      current.camera.aspect = sizeW / sizeH;
      current.camera.updateProjectionMatrix();
      if (current.resize) current.resize(sizeW, sizeH);
    }
  }
  window.addEventListener("resize", resize);

  function frame(now) {
    requestAnimationFrame(frame);
    if (!current || paused) { last = now; return; }
    if (innerWidth && innerHeight && (innerWidth !== sizeW || innerHeight !== sizeH)) resize();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now; t += dt;
    smooth += (TR.progress() - smooth) * Math.min(1, dt * 4);
    const inside = Math.abs(ptr.x) <= 1.2 && Math.abs(ptr.y) <= 1.2;
    look.x += ((inside ? ptr.x : 0) - look.x) * Math.min(1, dt * 2.5);
    look.y += ((inside ? ptr.y : 0) - look.y) * Math.min(1, dt * 2.5);
    current.update(dt, t, smooth, look);
    if (ptrDirty && !diving) { ptrDirty = false; setHover(pick()); }
    renderer.render(current.scene, current.camera);
    placeLabels();
  }
  requestAnimationFrame(frame);

  window.WORLD = {
    show,
    prefetch,
    setPaused(p) { paused = p; },
    pullback(sec) { if (current && current.pullback) current.pullback(sec); },
    get current() { return currentKey; },
    debug() {
      if (!current) return null;
      const c = current.camera;
      return { key: currentKey, cam: c.position.toArray().map((v) => +v.toFixed(2)), dir: c.getWorldDirection(new THREE.Vector3()).toArray().map((v) => +v.toFixed(2)), children: current.scene.children.length, frames: t.toFixed(1), smooth: +smooth.toFixed(3), calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
    }
  };
  window.dispatchEvent(new Event("world:ready"));
}

try { boot(); } catch (e) { console.warn("[world]", e); fail(); }
