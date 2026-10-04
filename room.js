/* TANRAIN — the room.
   A cutaway diorama on a round island in still water: the screen (films), the desk (the lab),
   the bookshelf (the library), the window (about). Built from primitives — no model files.
   Talks to app.js through window.TR; exposes window.ROOM. */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const TR = window.TR;

function boot() {
  if (!TR || TR.isFlat()) return;

  const canvas = document.getElementById("room-canvas");
  const small = Math.min(innerWidth, innerHeight) < 700;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    TR.fail();
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.6 : 2));
  renderer.setSize(innerWidth || 1280, innerHeight || 800, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); TR.fail(); });

  const scene = new THREE.Scene();
  const manager = new THREE.LoadingManager();
  const loader = new THREE.TextureLoader(manager);

  /* ---------------- camera + controls ---------------- */
  /* a tab can report a 0×0 viewport before it is shown — never let that become NaN */
  const vw = () => innerWidth || document.documentElement.clientWidth || 1280;
  const vh = () => innerHeight || document.documentElement.clientHeight || 800;
  const aspect = () => vw() / vh();
  const camera = new THREE.PerspectiveCamera(30, aspect(), 0.1, 120);
  const HOME_TARGET = new THREE.Vector3(0, 0.95, 0);
  const HOME_DIR = new THREE.Vector3(1, 0.8, 1).normalize();
  const homeDistance = () => {
    const a = aspect();
    const fit = 7.4 / (2 * Math.tan(THREE.MathUtils.degToRad(15)) * Math.min(a, 1.25));
    return Math.max(15, fit);
  };
  camera.position.copy(HOME_TARGET).addScaledVector(HOME_DIR, homeDistance());

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(HOME_TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = 6;
  controls.maxDistance = homeDistance() + 6;
  controls.minPolarAngle = 0.5;
  controls.maxPolarAngle = 1.34;
  controls.minAzimuthAngle = 0.08;
  controls.maxAzimuthAngle = Math.PI / 2 - 0.08;
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 0.7;
  controls.update();

  /* ---------------- lights: a cool room, one warm source ---------------- */
  const hemi = new THREE.HemisphereLight(0xa9b8ff, 0x1a1f3d, 1.25);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight(0xd2dcff, 1.7);
  moon.position.set(6.5, 10, 5.5);
  moon.castShadow = true;
  moon.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  Object.assign(moon.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
  moon.shadow.bias = -0.0005;
  moon.shadow.normalBias = 0.025;
  moon.shadow.radius = 5;
  scene.add(moon);
  const fill = new THREE.DirectionalLight(0x6e86d6, 0.55);
  fill.position.set(-3, 4, 7);
  scene.add(fill);

  /* ---------------- helpers ---------------- */
  const M = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.82, metalness: 0 }, o));
  function rbox(w, h, d, mat, r = 0.035) {
    const rad = Math.min(r, w / 2 - 0.002, h / 2 - 0.002, d / 2 - 0.002);
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.max(rad, 0.001)), typeof mat === "number" ? M(mat) : mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
  function cyl(rt, rb, h, mat, seg = 24) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof mat === "number" ? M(mat) : mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
  function put(mesh, x, y, z, parent) { mesh.position.set(x, y, z); (parent || scene).add(mesh); return mesh; }
  function canvasTex(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }
  function photo(url) {
    const t = loader.load(url);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  const rand = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

  /* ---------------- procedural textures ---------------- */
  const floorTex = canvasTex(512, 512, (g, w, h) => {
    const plank = h / 9;
    for (let i = 0; i < 9; i++) {
      const tone = 46 + Math.floor(rand() * 16);
      g.fillStyle = `rgb(${tone + 46},${tone + 14},${tone - 6})`;
      g.fillRect(0, i * plank, w, plank);
      g.fillStyle = "rgba(0,0,0,.25)";
      g.fillRect(0, i * plank, w, 2);
      const seam = rand() * w;
      g.fillRect(seam, i * plank, 2, plank);
      for (let k = 0; k < 6; k++) {
        g.strokeStyle = "rgba(0,0,0,.06)";
        g.beginPath(); g.moveTo(0, i * plank + rand() * plank); g.lineTo(w, i * plank + rand() * plank); g.stroke();
      }
    }
  });
  const wallTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = "#24356f"; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) {
      g.fillStyle = "rgba(110,134,214,.06)"; g.fillRect(x, 0, 14, h);
    }
    for (let i = 0; i < 110; i++) {
      const gold = rand() < 0.12;
      g.fillStyle = gold ? "rgba(214,168,92,.55)" : "rgba(170,186,240,.28)";
      const x = rand() * w, y = rand() * h, r = gold ? 2.2 : 1.2;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
  });
  const skyTex = canvasTex(256, 300, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "#0a1636"); gr.addColorStop(0.55, "#2545c4"); gr.addColorStop(1, "#8d9fe6");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(239,230,210,${0.3 + rand() * 0.6})`; g.fillRect(rand() * w, rand() * h * 0.6, 1.5, 1.5); }
    const glow = g.createRadialGradient(170, 80, 4, 170, 80, 70);
    glow.addColorStop(0, "rgba(255,240,210,.55)"); glow.addColorStop(1, "rgba(255,240,210,0)");
    g.fillStyle = glow; g.fillRect(0, 0, w, h);
    g.fillStyle = "#f6ecd2"; g.beginPath(); g.arc(170, 80, 26, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#1d3488"; g.beginPath(); g.arc(181, 72, 23, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(11,27,58,.75)";
    g.beginPath(); g.moveTo(0, h); g.lineTo(0, h - 40); g.lineTo(50, h - 70); g.lineTo(110, h - 38); g.lineTo(170, h - 80); g.lineTo(256, h - 30); g.lineTo(256, h); g.fill();
  });
  const rugTex = canvasTex(512, 512, (g, w) => {
    const c = w / 2;
    [["#1B3B8A", 250], ["#B8893D", 236], ["#2a4486", 226], ["#6E86D6", 160], ["#1B3B8A", 148], ["#8E1B23", 60]].forEach(([col, r]) => {
      g.fillStyle = col; g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.fill();
    });
    g.strokeStyle = "rgba(214,168,92,.7)"; g.lineWidth = 3;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.beginPath(); g.moveTo(c + Math.cos(a) * 70, c + Math.sin(a) * 70); g.lineTo(c + Math.cos(a) * 140, c + Math.sin(a) * 140); g.stroke(); }
  });
  const moonsTex = canvasTex(512, 200, (g, w, h) => {
    g.fillStyle = "#101b40"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5; i++) {
      const x = 56 + i * 100, y = h / 2;
      g.fillStyle = "#e9dcbc"; g.beginPath(); g.arc(x, y, 30, 0, Math.PI * 2); g.fill();
      const off = [-44, -22, 0, 22, 44][i];
      if (off !== 0) { g.fillStyle = "#101b40"; g.beginPath(); g.arc(x + off, y, 30, 0, Math.PI * 2); g.fill(); }
    }
    g.strokeStyle = "#B8893D"; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  });
  const glowDot = canvasTex(64, 64, (g) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,.7)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  });
  const radialAlpha = canvasTex(256, 256, (g) => {
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, "#fff"); gr.addColorStop(0.72, "#fff"); gr.addColorStop(1, "#000");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  });
  const poolAlpha = canvasTex(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "#fff"); gr.addColorStop(1, "#000");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });

  /* ---------------- the island + still water ---------------- */
  put(cyl(3.55, 3.15, 0.7, M(0x2c3c74, { roughness: 0.95 }), 72), 0, -0.52, 0);
  put(cyl(3.62, 3.62, 0.09, M(0x41558f, { roughness: 0.9 }), 72), 0, -0.2, 0);
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(7.6, 96),
    new THREE.MeshStandardMaterial({ color: 0x1d4c7e, roughness: 0.16, metalness: 0.2, transparent: true, opacity: 0.94, alphaMap: radialAlpha })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.64;
  water.receiveShadow = true;
  scene.add(water);
  const ripples = [];
  for (let i = 0; i < 4; i++) {
    const r = new THREE.Mesh(
      new THREE.RingGeometry(1, 1.012, 96),
      new THREE.MeshBasicMaterial({ color: 0xdfe6ff, transparent: true, opacity: 0, depthWrite: false })
    );
    r.rotation.x = -Math.PI / 2;
    r.position.y = -0.63;
    r.userData.phase = i / 4;
    scene.add(r);
    ripples.push(r);
  }
  const stoneGeo = new THREE.IcosahedronGeometry(0.22, 0);
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2, d = 3.55 + rand() * 0.55;
    const s = new THREE.Mesh(stoneGeo, M(0x93a1cc, { flatShading: true, roughness: 0.9 }));
    s.scale.set(0.7 + rand() * 0.9, 0.38 + rand() * 0.25, 0.7 + rand() * 0.8);
    s.rotation.y = rand() * 3;
    s.castShadow = s.receiveShadow = true;
    put(s, Math.cos(a) * d, -0.55, Math.sin(a) * d);
  }
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2, d = 4.3 + rand() * 2.2;
    const pad = cyl(0.26 + rand() * 0.1, 0.26, 0.025, M(0x2f6f62, { roughness: 0.7 }), 20);
    put(pad, Math.cos(a) * d, -0.62, Math.sin(a) * d);
    if (rand() < 0.45) put(new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), M(0xefe6d2, { emissive: 0xd6a85c, emissiveIntensity: 0.2 })), pad.position.x, -0.56, pad.position.z);
  }
  const reedMat = M(0x2b6b63, { roughness: 0.8 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rand() * 0.3;
    const d = 3.3 + rand() * 0.25;
    if (Math.cos(a) > 0.2 && Math.sin(a) > 0.2) continue; /* keep the front view clear */
    for (let k = 0; k < 3; k++) {
      const reed = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.6 + rand() * 0.5, 5), reedMat);
      reed.castShadow = true;
      reed.rotation.z = (rand() - 0.5) * 0.4;
      reed.rotation.x = (rand() - 0.5) * 0.4;
      put(reed, Math.cos(a) * d + (rand() - 0.5) * 0.2, 0.1, Math.sin(a) * d + (rand() - 0.5) * 0.2);
    }
  }
  [[2.7, 1.6], [1.4, 2.9], [-2.9, 1.5], [2.95, -0.6]].forEach(([x, z], n) => {
    const bush = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.22 + rand() * 0.12, 14, 10), M(n % 2 ? 0x2f6f62 : 0x3e8e7a, { roughness: 0.85 }));
      s.castShadow = true;
      s.position.set((rand() - 0.5) * 0.4, 0.1 + rand() * 0.15, (rand() - 0.5) * 0.4);
      bush.add(s);
    }
    put(bush, x, -0.12, z);
  });

  /* ---------------- the room shell ---------------- */
  const room = new THREE.Group();
  scene.add(room);
  put(rbox(4.3, 0.3, 4.3, M(0xffffff, { map: floorTex, roughness: 0.72 }), 0.06), 0, -0.15, 0, room);
  const wallMat = M(0xffffff, { map: wallTex, roughness: 0.95 });
  put(rbox(4.3, 3.3, 0.24, wallMat, 0.04), 0, 1.5, -2.03, room);
  put(rbox(0.24, 3.3, 4.3, wallMat, 0.04), -2.03, 1.5, 0, room);
  const beam = M(0x8a5a3c, { roughness: 0.7 });
  put(rbox(4.7, 0.22, 0.56, beam, 0.06), 0.05, 3.22, -1.98, room);
  put(rbox(0.56, 0.22, 4.7, beam, 0.06), -1.98, 3.22, 0.05, room);
  put(rbox(4.3, 0.12, 0.05, beam, 0.02), 0, 0.06, -1.89, room);
  put(rbox(0.05, 0.12, 4.3, beam, 0.02), -1.89, 0.06, 0, room);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.15, 64), M(0xffffff, { map: rugTex, roughness: 1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.receiveShadow = true;
  put(rug, 0.35, 0.012, 0.55, room);

  /* hotspot registry */
  const hotspots = {};
  function hotspot(name, anchor, focus, dist) {
    const g = new THREE.Group();
    g.userData.section = name;
    room.add(g);
    hotspots[name] = { group: g, anchor: new THREE.Vector3(...anchor), focus: new THREE.Vector3(...focus), dist, meshes: [] };
    return g;
  }

  /* ================= FILMS — the screen + projector ================= */
  const films = hotspot("films", [0.75, 2.75, -1.85], [0.75, 1.55, -1.3], 7.2);
  const SCREEN_W = 2.0, SCREEN_H = 1.15;
  put(rbox(SCREEN_W + 0.1, SCREEN_H + 0.1, 0.04, 0x0d1328, 0.015), 0.75, 1.78, -1.9, films);
  put(cyl(0.05, 0.05, SCREEN_W + 0.3, 0xd8ccb0, 16), 0.75, 2.42, -1.88, films).rotation.z = Math.PI / 2;
  const stillUrls = ["assets/img/v-kalaagni.jpg", "assets/img/v-stars.jpg", "assets/img/contingency-1.jpg", "assets/img/v-mishen.jpg", "assets/img/v-contingency-wm.jpg", "assets/img/v-welcome.jpg", "assets/img/viviana-2.jpg", "assets/img/ninth-1.jpg"];
  const stills = stillUrls.map(photo);
  const screenA = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), new THREE.MeshBasicMaterial({ map: stills[0], toneMapped: false }));
  const screenB = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), new THREE.MeshBasicMaterial({ map: stills[1], toneMapped: false, transparent: true, opacity: 0 }));
  put(screenA, 0.75, 1.78, -1.876, films);
  put(screenB, 0.75, 1.78, -1.874, films);
  const screenLight = new THREE.PointLight(0xc9d4ff, 2.2, 4.5, 2);
  put(screenLight, 0.75, 1.7, -1.2, room);
  /* projector on a stool */
  const stool = new THREE.Group();
  put(cyl(0.22, 0.22, 0.05, 0x8a5a3c), 0, 0.55, 0, stool);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    const leg = put(cyl(0.018, 0.018, 0.56, 0x5b3b2b, 8), Math.cos(a) * 0.15, 0.27, Math.sin(a) * 0.15, stool);
    leg.rotation.z = Math.cos(a) * 0.1; leg.rotation.x = -Math.sin(a) * 0.1;
  }
  put(rbox(0.34, 0.2, 0.42, M(0x8e1b23, { roughness: 0.55 }), 0.04), 0, 0.68, 0, stool);
  const lens = put(cyl(0.065, 0.075, 0.14, M(0xb8893d, { metalness: 0.6, roughness: 0.35 }), 20), 0, 0.68, -0.27, stool);
  lens.rotation.x = Math.PI / 2;
  const reels = [];
  [-0.09, 0.13].forEach((z) => {
    const reel = put(cyl(0.13, 0.13, 0.03, M(0x1d2330, { metalness: 0.4, roughness: 0.4 }), 28), 0, 0.94, z, stool);
    reel.rotation.z = Math.PI / 2;
    reels.push(reel);
  });
  put(stool, 0.75, 0, 0.7, films);
  /* the beam */
  const lensWorld = new THREE.Vector3(0.75, 0.68, 0.43);
  const screenCenter = new THREE.Vector3(0.75, 1.78, -1.87);
  const beamDir = screenCenter.clone().sub(lensWorld);
  const beamLen = beamDir.length();
  const beamGeo = new THREE.ConeGeometry(1, beamLen, 4, 1, true);
  beamGeo.rotateY(Math.PI / 4);
  beamGeo.translate(0, -beamLen / 2, 0);
  beamGeo.scale(SCREEN_W / 2 / 0.707, 1, SCREEN_H / 2 / 0.707);
  const beamMesh = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0xdbe3ff, transparent: true, opacity: 0.055, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beamMesh.position.copy(lensWorld);
  beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), beamDir.normalize());
  room.add(beamMesh);

  /* ================= LIBRARY — the bookshelf ================= */
  const library = hotspot("library", [-1.3, 3.05, -1.7], [-1.3, 1.25, -1.4], 6.8);
  const shelfMat = M(0x6b4630, { roughness: 0.7 });
  const SH = { x: -1.32, z: -1.72, w: 1.12, h: 2.3, d: 0.36 };
  put(rbox(SH.w, SH.h, 0.03, M(0x3a2618), 0.01), SH.x, SH.h / 2, SH.z - SH.d / 2 + 0.02, library);
  [-1, 1].forEach((s) => put(rbox(0.05, SH.h, SH.d, shelfMat, 0.015), SH.x + s * (SH.w / 2 - 0.025), SH.h / 2, SH.z, library));
  const BOOK_COLORS = [0x8e1b23, 0xb8893d, 0x1b3b8a, 0x3e8e9e, 0xefe6d2, 0x6e86d6, 0xc77a2b, 0x2545c4, 0x5a2e4a, 0x2a4f5c];
  const shelfYs = [0.04, 0.6, 1.16, 1.72, 2.27];
  shelfYs.forEach((y, si) => {
    put(rbox(SH.w, 0.04, SH.d, shelfMat, 0.012), SH.x, y, SH.z, library);
    if (si === shelfYs.length - 1) return;
    let x = SH.x - SH.w / 2 + 0.07;
    const end = SH.x + SH.w / 2 - 0.07 - (si === 1 ? 0.3 : 0);
    while (x < end) {
      const bw = 0.05 + rand() * 0.06, bh = 0.3 + rand() * 0.16;
      if (x + bw > end) break;
      const lean = rand() < 0.1 ? 0.18 : 0;
      const b = rbox(bw, bh, 0.24 + rand() * 0.06, M(BOOK_COLORS[Math.floor(rand() * BOOK_COLORS.length)], { roughness: 0.75 }), 0.008);
      b.rotation.z = -lean;
      put(b, x + bw / 2 + (lean ? 0.04 : 0), y + 0.02 + bh / 2, SH.z + 0.02, library);
      x += bw + 0.008 + (lean ? 0.06 : 0);
    }
    if (si === 1) {
      for (let k = 0; k < 3; k++) put(rbox(0.26, 0.05, 0.2, M(BOOK_COLORS[(k * 3) % BOOK_COLORS.length]), 0.008), SH.x + SH.w / 2 - 0.22, y + 0.045 + k * 0.05, SH.z + 0.03, library).rotation.y = (k - 1) * 0.12;
    }
  });
  const globe = put(new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 18), M(0x1b3b8a, { roughness: 0.5, emissive: 0x1b3b8a, emissiveIntensity: 0.15 })), SH.x - 0.25, 2.47, SH.z, library);
  globe.castShadow = true;
  put(new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.01, 8, 40), M(0xb8893d, { metalness: 0.7, roughness: 0.3 })), SH.x - 0.25, 2.47, SH.z, library).rotation.x = 1.2;
  const candle = put(cyl(0.04, 0.04, 0.16, 0xefe6d2, 12), SH.x + 0.28, 2.37, SH.z, library);
  const flame = put(new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc070, toneMapped: false })), SH.x + 0.28, 2.48, SH.z, library);
  flame.scale.y = 1.6;
  const moonsPrint = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.35), M(0xffffff, { map: moonsTex, roughness: 0.6 }));
  put(moonsPrint, SH.x, 2.82, -1.9, library);

  /* ================= LAB — the desk ================= */
  const lab = hotspot("lab", [-1.6, 2.62, -0.35], [-1.45, 1.15, -0.35], 6.4);
  const walnut = M(0x5b3b2b, { roughness: 0.6 });
  const DK = { x: -1.58, z: -0.38, w: 0.62, l: 1.15, y: 0.78 };
  put(rbox(DK.w, 0.05, DK.l, walnut, 0.015), DK.x, DK.y, DK.z, lab);
  [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, b]) => put(cyl(0.022, 0.022, DK.y, 0x2a1c14, 10), DK.x + a * (DK.w / 2 - 0.05), DK.y / 2, DK.z + b * (DK.l / 2 - 0.05), lab));
  put(rbox(0.4, 0.36, 0.42, M(0xe6dcc4, { roughness: 0.6 }), 0.05), -1.72, 1.0, -0.6, lab);
  const monitor = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.26), new THREE.MeshBasicMaterial({ map: photo("assets/img/v-gozero.jpg"), toneMapped: false }));
  monitor.rotation.y = Math.PI / 2;
  put(monitor, -1.515, 1.01, -0.6, lab);
  put(rbox(0.14, 0.025, 0.36, 0x2a3358, 0.01), -1.4, 0.815, -0.6, lab);
  /* film camera */
  put(rbox(0.2, 0.13, 0.11, M(0x1d2330, { roughness: 0.4 }), 0.02), -1.62, 0.87, -0.12, lab);
  put(cyl(0.045, 0.05, 0.08, M(0xb8893d, { metalness: 0.6, roughness: 0.3 }), 18), -1.5, 0.87, -0.12, lab).rotation.z = Math.PI / 2;
  /* flasks */
  const flaskProfile = [[0, 0], [0.07, 0], [0.075, 0.02], [0.03, 0.12], [0.022, 0.16], [0.026, 0.17], [0, 0.17]].map(([x, y]) => new THREE.Vector2(x, y));
  const liquidProfile = [[0, 0.004], [0.064, 0.004], [0.05, 0.06], [0, 0.06]].map(([x, y]) => new THREE.Vector2(x, y));
  [[0x3e8e9e, -1.38, -0.9], [0x2545c4, -1.5, -0.86], [0xc77a2b, -1.36, -0.82]].forEach(([col, fx, fz]) => {
    const glass = new THREE.Mesh(new THREE.LatheGeometry(flaskProfile, 24), new THREE.MeshStandardMaterial({ color: 0xdfe8ff, transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.1 }));
    put(glass, fx, 0.805, fz, lab);
    const liq = new THREE.Mesh(new THREE.LatheGeometry(liquidProfile, 24), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.9, roughness: 0.3 }));
    put(liq, fx, 0.805, fz, lab);
  });
  /* desk lamp — the warm source */
  put(cyl(0.08, 0.09, 0.025, 0x1d2330, 18), -1.78, 0.815, 0.0, lab);
  const arm1 = put(cyl(0.012, 0.012, 0.42, M(0xb8893d, { metalness: 0.6, roughness: 0.3 }), 8), -1.72, 1.0, 0.0, lab);
  arm1.rotation.z = -0.35;
  const arm2 = put(cyl(0.012, 0.012, 0.3, M(0xb8893d, { metalness: 0.6, roughness: 0.3 }), 8), -1.56, 1.22, 0.0, lab);
  arm2.rotation.z = 1.0;
  const shade = put(new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.14, 20, 1, true), M(0x1b3b8a, { side: THREE.DoubleSide, roughness: 0.5 })), -1.42, 1.17, 0.0, lab);
  shade.rotation.z = 0.6;
  put(new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false })), -1.4, 1.12, 0.0, lab);
  const deskLamp = new THREE.PointLight(0xffb066, 3.2, 4.2, 1.7);
  put(deskLamp, -1.36, 1.05, 0.0, room);
  /* chair */
  const chair = new THREE.Group();
  put(cyl(0.22, 0.22, 0.07, M(0x6e86d6, { roughness: 0.7 })), 0, 0.48, 0, chair);
  put(cyl(0.025, 0.025, 0.42, 0x1d2330, 8), 0, 0.24, 0, chair);
  put(cyl(0.2, 0.2, 0.025, 0x1d2330, 18), 0, 0.02, 0, chair);
  put(rbox(0.06, 0.42, 0.38, M(0x6e86d6, { roughness: 0.7 }), 0.03), 0.2, 0.75, 0, chair);
  put(chair, -1.0, 0, -0.42, lab);
  /* the wall of forty generations, pegged above the desk */
  put(cyl(0.006, 0.006, 1.3, 0xd8ccb0, 6), -1.895, 2.27, -0.38, lab).rotation.x = Math.PI / 2;
  ["assets/img/ninth-2.jpg", "assets/img/ninth-4.jpg", "assets/img/ninth-5.jpg", "assets/img/ninth-6.jpg", "assets/img/v-info.jpg"].forEach((url, i) => {
    const z = -0.92 + i * 0.27;
    const pol = new THREE.Group();
    put(rbox(0.012, 0.32, 0.26, M(0xf4ecda, { roughness: 0.8 }), 0.004), 0, 0, 0, pol);
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), M(0xffffff, { map: photo(url), roughness: 0.7 }));
    pic.rotation.y = Math.PI / 2;
    put(pic, 0.008, 0.03, 0, pol);
    pol.rotation.x = (i % 2 ? 1 : -1) * 0.07;
    put(pol, -1.885, 2.06 - (i % 2) * 0.04, z, lab);
  });

  /* ================= ABOUT — the window, the armchair, the lamp ================= */
  const about = hotspot("about", [-1.85, 2.78, 1.0], [-1.35, 1.45, 1.0], 6.8);
  const cream = M(0xefe6d2, { roughness: 0.6 });
  const WN = { z: 1.0, y: 1.78, w: 1.15, h: 1.3, x: -1.9 };
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(WN.w, WN.h), new THREE.MeshBasicMaterial({ map: skyTex, toneMapped: false }));
  pane.rotation.y = Math.PI / 2;
  put(pane, WN.x + 0.002, WN.y, WN.z, about);
  put(rbox(0.08, 0.07, WN.w + 0.14, cream, 0.02), WN.x + 0.02, WN.y + WN.h / 2 + 0.03, WN.z, about);
  put(rbox(0.08, 0.07, WN.w + 0.14, cream, 0.02), WN.x + 0.02, WN.y - WN.h / 2 - 0.03, WN.z, about);
  [-1, 1].forEach((s) => put(rbox(0.08, WN.h + 0.12, 0.07, cream, 0.02), WN.x + 0.02, WN.y, WN.z + s * (WN.w / 2 + 0.035), about));
  put(rbox(0.04, WN.h, 0.03, cream, 0.01), WN.x + 0.02, WN.y, WN.z, about);
  put(rbox(0.04, 0.03, WN.w, cream, 0.01), WN.x + 0.02, WN.y + 0.08, WN.z, about);
  put(rbox(0.22, 0.05, WN.w + 0.3, cream, 0.02), WN.x + 0.09, WN.y - WN.h / 2 - 0.08, WN.z, about);
  put(cyl(0.015, 0.015, WN.w + 0.9, M(0xb8893d, { metalness: 0.6, roughness: 0.3 }), 8), WN.x + 0.1, WN.y + WN.h / 2 + 0.16, WN.z, about).rotation.x = Math.PI / 2;
  [-1, 1].forEach((s) => {
    const curtain = new THREE.Group();
    for (let k = 0; k < 4; k++) put(rbox(0.06, 1.62, 0.1, M(0x8e1b23, { roughness: 0.85 }), 0.03), (k % 2) * 0.03, 0, k * 0.085 - 0.13, curtain);
    put(curtain, WN.x + 0.13, WN.y - 0.06, WN.z + s * (WN.w / 2 + 0.24), about);
  });
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), new THREE.MeshBasicMaterial({ color: 0x9fb3ff, transparent: true, opacity: 0.22, alphaMap: poolAlpha, blending: THREE.AdditiveBlending, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2;
  put(pool, -0.9, 0.016, 1.0, room);
  /* armchair, facing into the room */
  const chairA = new THREE.Group();
  const blue = M(0x1b3b8a, { roughness: 0.85 }), peri = M(0x3a56b0, { roughness: 0.85 });
  put(rbox(0.85, 0.2, 0.78, blue, 0.07), 0, 0.12, 0, chairA);
  put(rbox(0.66, 0.16, 0.62, peri, 0.07), 0, 0.3, 0.04, chairA);
  put(rbox(0.85, 0.72, 0.18, blue, 0.08), 0, 0.56, -0.31, chairA);
  [-1, 1].forEach((s) => put(rbox(0.15, 0.42, 0.78, blue, 0.07), s * 0.38, 0.38, 0, chairA));
  put(rbox(0.3, 0.06, 0.5, M(0xc77a2b, { roughness: 0.9 }), 0.03), 0.38, 0.62, 0.05, chairA).rotation.z = -0.1;
  chairA.rotation.y = Math.PI / 2 + 0.25;
  put(chairA, -1.35, 0, 1.15, about);
  /* floor lamp */
  put(cyl(0.15, 0.17, 0.03, 0x1d2330, 20), -1.62, 0.015, 0.32, about);
  put(cyl(0.014, 0.014, 1.5, M(0xb8893d, { metalness: 0.6, roughness: 0.3 }), 8), -1.62, 0.76, 0.32, about);
  put(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.26, 24, 1, true), M(0xefe6d2, { side: THREE.DoubleSide, emissive: 0xffb066, emissiveIntensity: 0.55 })), -1.62, 1.56, 0.32, about);
  const floorLamp = new THREE.PointLight(0xffc27a, 3.4, 4.5, 1.6);
  put(floorLamp, -1.6, 1.42, 0.38, room);
  /* side table: walkman + mug */
  put(cyl(0.22, 0.22, 0.03, walnut, 24), -0.7, 0.56, 1.9, about);
  put(cyl(0.025, 0.025, 0.55, 0x2a1c14, 8), -0.7, 0.28, 1.9, about);
  put(rbox(0.17, 0.05, 0.12, M(0x2545c4, { roughness: 0.45 }), 0.012), -0.75, 0.6, 1.86, about);
  put(rbox(0.07, 0.006, 0.05, M(0x0b1b3a), 0.002), -0.75, 0.627, 1.86, about);
  put(cyl(0.045, 0.04, 0.09, 0xefe6d2, 16), -0.6, 0.62, 1.97, about);
  /* acrylic guitar, leaning between the shelf and the screen */
  const guitar = new THREE.Group();
  const acrylic = new THREE.MeshStandardMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.42, roughness: 0.08, metalness: 0.15, emissive: 0x6e86d6, emissiveIntensity: 0.12 });
  const gb1 = put(new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 16), acrylic), 0, 0.36, 0, guitar); gb1.scale.z = 0.32;
  const gb2 = put(new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 16), acrylic), 0, 0.68, 0, guitar); gb2.scale.z = 0.32;
  put(rbox(0.065, 0.78, 0.04, M(0x8a5a3c), 0.01), 0, 1.18, 0, guitar);
  put(rbox(0.09, 0.16, 0.035, M(0x8a5a3c), 0.01), 0, 1.62, 0, guitar);
  put(cyl(0.06, 0.06, 0.012, M(0x0b1b3a), 20), 0, 0.42, 0.085, guitar).rotation.x = Math.PI / 2;
  guitar.rotation.set(-0.11, 0.25, 0.05);
  put(guitar, -0.5, 0.02, -1.66, room);

  /* ---------------- fairy lights + wall clock ---------------- */
  const bulbsA = new THREE.MeshBasicMaterial({ color: 0xffd28a, toneMapped: false });
  const bulbsB = new THREE.MeshBasicMaterial({ color: 0xffe2b0, toneMapped: false });
  const bulbGeo = new THREE.SphereGeometry(0.028, 10, 8);
  function stringLights(a, b, sag) {
    const mid = a.clone().lerp(b, 0.5); mid.y -= sag;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.005, 5), M(0x1d2330));
    room.add(wire);
    const n = Math.round(a.distanceTo(b) / 0.22);
    for (let i = 1; i < n; i++) {
      const bulb = new THREE.Mesh(bulbGeo, i % 2 ? bulbsA : bulbsB);
      bulb.position.copy(curve.getPoint(i / n));
      room.add(bulb);
    }
  }
  stringLights(new THREE.Vector3(-1.88, 3.05, -1.88), new THREE.Vector3(2.1, 3.05, -1.88), 0.28);
  stringLights(new THREE.Vector3(-1.88, 3.05, -1.88), new THREE.Vector3(-1.88, 3.05, 2.1), 0.28);
  put(cyl(0.16, 0.16, 0.035, cream, 28), -0.42, 2.6, -1.89, room).rotation.x = Math.PI / 2;
  const hands = new THREE.Group();
  put(rbox(0.012, 0.1, 0.01, M(0x0b1b3a), 0.003), 0, 0.04, 0, hands);
  const minute = put(rbox(0.008, 0.13, 0.01, M(0x8e1b23), 0.003), 0, 0, 0, hands);
  minute.geometry.translate(0, 0.06, 0);
  put(hands, -0.42, 2.6, -1.865, room);

  /* ---------------- fireflies ---------------- */
  const FF = small ? 40 : 70;
  const ffGeo = new THREE.BufferGeometry();
  const ffPos = new Float32Array(FF * 3), ffBase = [];
  for (let i = 0; i < FF; i++) {
    const a = rand() * Math.PI * 2, d = 1.2 + rand() * 4.6;
    ffBase.push({ x: Math.cos(a) * d, y: 0.1 + rand() * 3.4, z: Math.sin(a) * d, p: rand() * 10, s: 0.3 + rand() * 0.6 });
  }
  ffGeo.setAttribute("position", new THREE.BufferAttribute(ffPos, 3));
  const fireflies = new THREE.Points(ffGeo, new THREE.PointsMaterial({ size: 0.09, map: glowDot, color: 0xffd28a, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  scene.add(fireflies);

  /* collect hotspot meshes + remember their emissive state */
  Object.values(hotspots).forEach((h) => {
    h.group.traverse((o) => {
      if (!o.isMesh) return;
      o.userData.section = h.group.userData.section;
      h.meshes.push(o);
      if (o.material.emissive) {
        o.material = o.material.clone();
        o.userData.baseEmissive = o.material.emissive.clone();
        o.userData.baseEI = o.material.emissiveIntensity;
      }
    });
  });
  const pickables = Object.values(hotspots).flatMap((h) => h.meshes);

  /* ============================================================
     INTERACTION
     ============================================================ */
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2(-5, -5);
  let hovered = null, ptrDirty = false;
  const GOLD = new THREE.Color(0xd6a85c);

  function setHover(section) {
    if (section === hovered) return;
    if (hovered) hotspots[hovered].meshes.forEach((m) => { if (m.userData.baseEmissive) { m.material.emissive.copy(m.userData.baseEmissive); m.material.emissiveIntensity = m.userData.baseEI; } });
    hovered = section;
    if (hovered) hotspots[hovered].meshes.forEach((m) => { if (m.userData.baseEmissive) { m.material.emissive.copy(GOLD); m.material.emissiveIntensity = 0.32; } });
    TR.hover(hovered);
  }
  function pick() {
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    return hit ? hit.object.userData.section : null;
  }
  canvas.addEventListener("pointermove", (e) => {
    ptr.x = (e.clientX / vw()) * 2 - 1;
    ptr.y = -(e.clientY / vh()) * 2 + 1;
    ptrDirty = e.pointerType === "mouse";
  });
  canvas.addEventListener("pointerleave", () => { ptr.set(-5, -5); setHover(null); });
  let downAt = null;
  canvas.addEventListener("pointerdown", (e) => { downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas.addEventListener("pointerup", (e) => {
    if (!downAt || anim) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    const quick = performance.now() - downAt.t < 450;
    downAt = null;
    if (moved > 7 || !quick) return;
    ptr.x = (e.clientX / vw()) * 2 - 1;
    ptr.y = -(e.clientY / vh()) * 2 + 1;
    const s = pick();
    if (s) TR.go(s, { x: e.clientX, y: e.clientY });
  });

  /* HTML labels pinned to the 3D anchors */
  const labels = {};
  document.querySelectorAll(".hotspot").forEach((el) => {
    labels[el.dataset.open] = el;
    el.addEventListener("mouseenter", () => setHover(el.dataset.open));
    el.addEventListener("mouseleave", () => setHover(null));
  });
  const v3 = new THREE.Vector3();
  function placeLabels() {
    for (const name in labels) {
      const h = hotspots[name];
      if (!h) continue;
      v3.copy(h.anchor).project(camera);
      const el = labels[name];
      if (v3.z > 1) { el.style.visibility = "hidden"; continue; }
      el.style.visibility = "";
      const x = (v3.x * 0.5 + 0.5) * vw();
      const y = (-v3.y * 0.5 + 0.5) * vh();
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, calc(-100% - 22px)) rotate(var(--r))`;
    }
  }

  /* camera moves: walk to an object, walk back home */
  let anim = null;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function tweenCamera(toTarget, toPos, ms, done) {
    const mine = { t0: performance.now(), ms: reduced ? 1 : ms, fromT: controls.target.clone(), fromP: camera.position.clone(), toT: toTarget, toP: toPos, done };
    anim = mine;
    controls.enabled = false;
    /* if frames are throttled (background tab, slow device) still arrive — never leave a click hanging */
    setTimeout(() => { if (anim === mine) stepAnim(mine.t0 + mine.ms); }, mine.ms + 500);
  }
  function stepAnim(now) {
    if (!anim) return;
    const k = Math.min(1, (now - anim.t0) / anim.ms);
    const e = ease(k);
    controls.target.lerpVectors(anim.fromT, anim.toT, e);
    camera.position.lerpVectors(anim.fromP, anim.toP, e);
    if (k >= 1) {
      const done = anim.done;
      anim = null;
      controls.enabled = true;
      if (done) done();
    }
  }

  let paused = false;
  const night = { on: TR.isNight(), k: TR.isNight() ? 1 : 0 };

  window.ROOM = {
    focus(section, cb) {
      const h = hotspots[section];
      if (!h) { cb && cb(); return; }
      setHover(null);
      const dir = camera.position.clone().sub(controls.target).normalize().lerp(HOME_DIR, 0.5).normalize();
      tweenCamera(h.focus.clone(), h.focus.clone().addScaledVector(dir, h.dist), 1050, () => cb && cb({ x: vw() / 2, y: vh() / 2 }));
    },
    reset() {
      tweenCamera(HOME_TARGET.clone(), HOME_TARGET.clone().addScaledVector(HOME_DIR, homeDistance()), 1200);
    },
    setPaused(p) { paused = p; if (!p) last = performance.now(); },
    setNight(on) { night.on = on; },
    hover(section) { setHover(section); },
    get state() {
      return { dist: +camera.position.distanceTo(controls.target).toFixed(2), aspect: +camera.aspect.toFixed(3), fov: camera.fov, home: +homeDistance().toFixed(2), buf: [renderer.domElement.width, renderer.domElement.height] };
    }
  };

  /* ============================================================
     LOOP
     ============================================================ */
  let last = performance.now(), t = 0, screenIdx = 0, screenT = 0, fading = false;
  function frame(now) {
    requestAnimationFrame(frame);
    if (paused) return;
    if (innerWidth && innerHeight && (innerWidth !== sizeW || innerHeight !== sizeH)) onResize();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;

    stepAnim(now);
    controls.update();

    /* night blend */
    night.k += ((night.on ? 1 : 0) - night.k) * Math.min(1, dt * 2.2);
    const n = night.k;
    hemi.intensity = 1.25 - n * 0.75;
    moon.intensity = 1.7 - n * 0.95;
    fill.intensity = 0.55 - n * 0.3;
    deskLamp.intensity = 3.2 + n * 3.4;
    floorLamp.intensity = 3.4 + n * 3.6;
    renderer.toneMappingExposure = 1.2 - n * 0.12;
    fireflies.material.opacity = 0.55 + n * 0.4;

    /* water */
    ripples.forEach((r) => {
      const p = (t * 0.06 + r.userData.phase) % 1;
      const s = 3.7 + p * 3.6;
      r.scale.set(s, s, 1);
      r.material.opacity = (1 - p) * 0.2;
    });

    /* projector */
    reels.forEach((r, i) => { r.rotation.x += dt * (i ? 1.6 : 1.2); });
    beamMesh.material.opacity = 0.05 + Math.sin(t * 9) * 0.004 + Math.sin(t * 23) * 0.003;
    screenT += dt;
    if (!fading && screenT > 4.2) { fading = true; screenT = 0; screenB.material.map = stills[(screenIdx + 1) % stills.length]; screenB.material.needsUpdate = true; }
    if (fading) {
      screenB.material.opacity = Math.min(1, screenB.material.opacity + dt * 0.9);
      if (screenB.material.opacity >= 1) {
        screenIdx = (screenIdx + 1) % stills.length;
        screenA.material.map = stills[screenIdx];
        screenA.material.needsUpdate = true;
        screenB.material.opacity = 0;
        fading = false;
      }
    }
    screenLight.intensity = 2 + Math.sin(t * 7) * 0.15;

    /* small life */
    flame.scale.y = 1.6 + Math.sin(t * 13) * 0.18;
    flame.position.x = SH.x + 0.28 + Math.sin(t * 7) * 0.004;
    const tw = 0.75 + Math.sin(t * 2.2) * 0.25;
    bulbsA.color.setRGB(1, 0.82 * tw + 0.1, 0.54 * tw);
    bulbsB.color.setRGB(1, 0.88 * (1.2 - tw * 0.5), 0.69 * (1.2 - tw * 0.5));
    minute.rotation.z = -t * 0.05;
    for (let i = 0; i < FF; i++) {
      const b = ffBase[i];
      ffPos[i * 3] = b.x + Math.sin(t * b.s + b.p) * 0.3;
      ffPos[i * 3 + 1] = b.y + Math.sin(t * b.s * 1.3 + b.p * 2) * 0.22;
      ffPos[i * 3 + 2] = b.z + Math.cos(t * b.s + b.p) * 0.3;
    }
    ffGeo.attributes.position.needsUpdate = true;

    /* hover */
    if (ptrDirty && !anim) { ptrDirty = false; setHover(pick()); }

    renderer.render(scene, camera);
    placeLabels();
  }

  let sizeW = 0, sizeH = 0;
  function onResize() {
    sizeW = vw(); sizeH = vh();
    camera.aspect = aspect();
    camera.updateProjectionMatrix();
    renderer.setSize(sizeW, sizeH, false);
    controls.maxDistance = homeDistance() + 6;
    if (!Number.isFinite(camera.position.x)) {
      controls.target.copy(HOME_TARGET);
      camera.position.copy(HOME_TARGET).addScaledVector(HOME_DIR, homeDistance());
    }
    if (!anim && !document.body.classList.contains("panel-open")) {
      const dir = camera.position.clone().sub(controls.target).normalize();
      const dist = THREE.MathUtils.clamp(camera.position.distanceTo(controls.target), controls.minDistance, controls.maxDistance);
      camera.position.copy(controls.target).addScaledVector(dir, dist);
    }
  }
  window.addEventListener("resize", onResize);

  let started = false;
  function start() {
    if (started) return;
    started = true;
    renderer.compile(scene, camera);
    requestAnimationFrame(frame);
    TR.roomReady();
  }
  manager.onProgress = (url, loaded, total) => TR.progress((loaded / total) * 0.96);
  manager.onLoad = start;
  manager.onError = () => { /* a missing photo just leaves that surface blank */ };
  setTimeout(start, 9000); /* never wait forever on a slow image */
}

try {
  boot();
} catch (e) {
  if (window.TR) window.TR.fail();
}
