/* The room — a cutaway diorama on an island in black glass water, with portals. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { PALETTE as P, waterMaterial, portalMaterial, skyDome, motes, glowTexture } from "tr/shaders";

export function create(ctx) {
  const { renderer, tex, small } = ctx;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(P.black);
  scene.fog = new THREE.Fog(P.black, 26, 60);

  const camera = new THREE.PerspectiveCamera(30, ctx.aspect(), 0.1, 200);
  const HOME_T = new THREE.Vector3(0, 1.1, 0);
  const HOME_DIR = new THREE.Vector3(1, 0.78, 1).normalize();
  const homeDist = () => {
    const a = ctx.aspect();
    return Math.max(16, 8.6 / (2 * Math.tan(THREE.MathUtils.degToRad(15)) * Math.min(a, 1.25)));
  };
  camera.position.copy(HOME_T).addScaledVector(HOME_DIR, homeDist());

  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.06, enablePan: false, rotateSpeed: 0.5, zoomSpeed: 0.6, enabled: false });
  controls.target.copy(HOME_T);
  controls.minDistance = 7; controls.maxDistance = homeDist() + 8;
  controls.minPolarAngle = 0.45; controls.maxPolarAngle = 1.36;
  controls.minAzimuthAngle = 0.02; controls.maxAzimuthAngle = Math.PI / 2 - 0.02;
  controls.update();

  /* ---------- light: cool, with one green glow ---------- */
  scene.add(new THREE.HemisphereLight(0x9fc4ff, 0x05121c, 1.15));
  const moon = new THREE.DirectionalLight(0xdcecff, 1.9);
  moon.position.set(6.5, 10, 5.5);
  moon.castShadow = true;
  moon.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  Object.assign(moon.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
  moon.shadow.bias = -0.0005; moon.shadow.normalBias = 0.025; moon.shadow.radius = 5;
  scene.add(moon);
  const rim = new THREE.DirectionalLight(0x59a5d8, 0.8); rim.position.set(-4, 3, 7); scene.add(rim);

  /* ---------- helpers ---------- */
  const M = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0 }, o));
  const rbox = (w, h, d, mat, r = 0.035) => {
    const rad = Math.max(0.001, Math.min(r, w / 2 - 0.002, h / 2 - 0.002, d / 2 - 0.002));
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, rad), typeof mat === "number" ? M(mat) : mat);
    m.castShadow = m.receiveShadow = true; return m;
  };
  const cyl = (rt, rb, h, mat, seg = 24) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof mat === "number" ? M(mat) : mat); m.castShadow = m.receiveShadow = true; return m; };
  const put = (m, x, y, z, parent) => { m.position.set(x, y, z); (parent || scene).add(m); return m; };
  const canvasTex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  let seed = 11; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const floorTex = canvasTex(512, 512, (g, w, h) => {
    const pl = h / 9;
    for (let i = 0; i < 9; i++) {
      const v = 14 + Math.floor(rand() * 8);
      g.fillStyle = `rgb(${v},${v + 14},${v + 26})`; g.fillRect(0, i * pl, w, pl);
      g.fillStyle = "rgba(145,229,246,.07)"; g.fillRect(0, i * pl, w, 1.5);
      g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(rand() * w, i * pl, 2, pl);
    }
  });
  const wallTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = "#0b1d30"; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) { g.fillStyle = "rgba(89,165,216,.05)"; g.fillRect(x, 0, 12, h); }
    for (let i = 0; i < 120; i++) { g.fillStyle = rand() < 0.15 ? "rgba(111,211,184,.5)" : "rgba(145,229,246,.32)"; g.beginPath(); g.arc(rand() * w, rand() * h, rand() < 0.15 ? 2 : 1.1, 0, 7); g.fill(); }
  });
  const rugTex = canvasTex(512, 512, (g, w) => {
    const c = w / 2;
    [["#133C55", 250], ["#91E5F6", 238], ["#0b2a3d", 228], ["#386FA4", 160], ["#133C55", 148], ["#1d6b5f", 60]].forEach(([col, r]) => { g.fillStyle = col; g.beginPath(); g.arc(c, c, r, 0, 7); g.fill(); });
    g.strokeStyle = "rgba(238,246,250,.6)"; g.lineWidth = 3;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.beginPath(); g.moveTo(c + Math.cos(a) * 70, c + Math.sin(a) * 70); g.lineTo(c + Math.cos(a) * 140, c + Math.sin(a) * 140); g.stroke(); }
  });

  /* ---------- sky + water + island ---------- */
  const sky = skyDome({ top: 0x02060b, bottom: 0x0a1a2a, band: 0x133c55, radius: 120 });
  scene.add(sky);
  const water = new THREE.Mesh(new THREE.CircleGeometry(70, 96), waterMaterial({ fogNear: 18, fogFar: 62, sun: [-0.55, 0.42, -0.72] }));
  water.rotation.x = -Math.PI / 2; water.position.y = -0.62; scene.add(water);
  const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(2.6, 48), new THREE.MeshBasicMaterial({ color: 0xeef6fa, fog: false }));
  moonDisc.position.set(-40, 26, -52); moonDisc.lookAt(0, 0, 0); scene.add(moonDisc);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x84d2f6, transparent: true, opacity: 0.35, depthWrite: false, fog: false }));
  halo.scale.set(22, 22, 1); halo.position.copy(moonDisc.position); scene.add(halo);

  put(cyl(3.55, 3.15, 0.7, M(0x07131f, { roughness: 0.9 }), 72), 0, -0.52, 0);
  put(cyl(3.62, 3.62, 0.09, M(0x0e2333, { roughness: 0.6, metalness: 0.2 }), 72), 0, -0.2, 0);
  const stoneGeo = new THREE.IcosahedronGeometry(0.22, 0);
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2, d = 3.55 + rand() * 0.55;
    const s = new THREE.Mesh(stoneGeo, M(0x1b3a52, { flatShading: true, roughness: 0.4, metalness: 0.3 }));
    s.scale.set(0.7 + rand() * 0.9, 0.38 + rand() * 0.25, 0.7 + rand() * 0.8); s.castShadow = true;
    put(s, Math.cos(a) * d, -0.55, Math.sin(a) * d);
  }
  const reedMat = M(0x1d6b5f, { roughness: 0.7 });
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rand() * 0.3, d = 3.3 + rand() * 0.25;
    if (Math.cos(a) > 0.15 && Math.sin(a) > 0.15) continue;
    for (let k = 0; k < 3; k++) {
      const reed = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.6 + rand() * 0.6, 5), reedMat);
      reed.rotation.set((rand() - 0.5) * 0.4, 0, (rand() - 0.5) * 0.4);
      put(reed, Math.cos(a) * d + (rand() - 0.5) * 0.2, 0.12, Math.sin(a) * d + (rand() - 0.5) * 0.2);
    }
  }
  [[2.7, 1.7], [1.5, 2.95], [-2.95, 1.4], [2.95, -0.7]].forEach(([x, z], n) => {
    const bush = new THREE.Group();
    for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.22 + rand() * 0.12, 14, 10), M(n % 2 ? 0x0e3b36 : 0x1d6b5f, { roughness: 0.8 })); s.castShadow = true; s.position.set((rand() - 0.5) * 0.4, 0.1 + rand() * 0.15, (rand() - 0.5) * 0.4); bush.add(s); }
    put(bush, x, -0.12, z);
  });

  /* ---------- the room shell ---------- */
  const room = new THREE.Group(); scene.add(room);
  put(rbox(4.3, 0.3, 4.3, M(0xffffff, { map: floorTex, roughness: 0.35, metalness: 0.25 }), 0.06), 0, -0.15, 0, room);
  const wallMat = M(0xffffff, { map: wallTex, roughness: 0.9 });
  put(rbox(4.3, 3.3, 0.24, wallMat, 0.04), 0, 1.5, -2.03, room);
  put(rbox(0.24, 3.3, 4.3, wallMat, 0.04), -2.03, 1.5, 0, room);
  const beam = M(0x13324a, { roughness: 0.5, metalness: 0.2 });
  put(rbox(4.7, 0.22, 0.56, beam, 0.06), 0.05, 3.22, -1.98, room);
  put(rbox(0.56, 0.22, 4.7, beam, 0.06), -1.98, 3.22, 0.05, room);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.15, 64), M(0xffffff, { map: rugTex, roughness: 1 }));
  rug.rotation.x = -Math.PI / 2; rug.receiveShadow = true; put(rug, 0.35, 0.012, 0.55, room);

  const hotspots = [], pickables = [], portals = [];
  function hotspot(o) {
    const g = new THREE.Group(); room.add(g);
    const h = Object.assign({ group: g, meshes: [] }, o);
    hotspots.push(h);
    return h;
  }
  function addPortal(h, radius, pos, rotY = 0, colors) {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), portalMaterial(colors));
    disc.position.copy(pos); disc.rotation.y = rotY;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.02, 0.025, 12, 96), new THREE.MeshBasicMaterial({ color: 0xeef6fa, toneMapped: false }));
    ring.position.copy(pos); ring.rotation.y = rotY;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x59a5d8, transparent: true, opacity: 0.45, depthWrite: false }));
    glow.position.copy(pos); glow.scale.set(radius * 4, radius * 4, 1);
    h.group.add(glow, disc, ring);
    portals.push({ h, disc, ring, glow, base: pos.clone(), phase: rand() * 6 });
    h.portalPos = pos; h.portalNormal = new THREE.Vector3(Math.sin(rotY), 0, Math.cos(rotY));
    return disc;
  }

  /* ===== FILMS — the screen + projector ===== */
  const films = hotspot({ id: "films", route: "films", label: "the screening hall", sub: "my films", anchor: new THREE.Vector3(0.75, 2.78, -1.85) });
  const SW = 2.0, SH = 1.15;
  put(rbox(SW + 0.1, SH + 0.1, 0.04, 0x02060b, 0.015), 0.75, 1.78, -1.9, films.group);
  put(cyl(0.05, 0.05, SW + 0.3, 0xdfe9ef, 16), 0.75, 2.42, -1.88, films.group).rotation.z = Math.PI / 2;
  const stillUrls = ["anamne/03", "paralian/05", "kalaagni/01", "mishen/07", "stars/06", "welcome/02", "ninth/02"].map((p) => "assets/films/" + p + ".webp");
  const stills = [];
  const screenA = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ toneMapped: false }));
  const screenB = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, opacity: 0 }));
  put(screenA, 0.75, 1.78, -1.876, films.group); put(screenB, 0.75, 1.78, -1.874, films.group);
  const screenRing = new THREE.Mesh(new THREE.PlaneGeometry(SW + 0.22, SH + 0.22), portalMaterial({ rect: true, a: 0x050d17, b: 0x386fa4, c: 0x91e5f6 }));
  put(screenRing, 0.75, 1.78, -1.882, films.group);
  portals.push({ h: films, disc: screenRing, ring: null, glow: null, base: screenRing.position.clone(), phase: 0, fixed: true });
  films.portalPos = new THREE.Vector3(0.75, 1.78, -1.88); films.portalNormal = new THREE.Vector3(0, 0, 1);
  const screenLight = new THREE.PointLight(0xc9e4ff, 2.4, 4.5, 2); put(screenLight, 0.75, 1.7, -1.2, room);
  const stool = new THREE.Group();
  put(cyl(0.22, 0.22, 0.05, 0x13324a), 0, 0.55, 0, stool);
  for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; const leg = put(cyl(0.018, 0.018, 0.56, 0x0b1d30, 8), Math.cos(a) * 0.15, 0.27, Math.sin(a) * 0.15, stool); leg.rotation.z = Math.cos(a) * 0.1; leg.rotation.x = -Math.sin(a) * 0.1; }
  put(rbox(0.34, 0.2, 0.42, M(0xe8f1f6, { roughness: 0.35 }), 0.04), 0, 0.68, 0, stool);
  const lens = put(cyl(0.065, 0.075, 0.14, M(0x111c26, { metalness: 0.7, roughness: 0.25 }), 20), 0, 0.68, -0.27, stool); lens.rotation.x = Math.PI / 2;
  const reels = [];
  [-0.09, 0.13].forEach((z) => { const r = put(cyl(0.13, 0.13, 0.03, M(0x0b1118, { metalness: 0.5, roughness: 0.3 }), 28), 0, 0.94, z, stool); r.rotation.z = Math.PI / 2; reels.push(r); });
  put(stool, 0.75, 0, 0.7, films.group);
  const lensW = new THREE.Vector3(0.75, 0.68, 0.43), scrC = new THREE.Vector3(0.75, 1.78, -1.87);
  const bDir = scrC.clone().sub(lensW), bLen = bDir.length();
  const beamGeo = new THREE.ConeGeometry(1, bLen, 4, 1, true); beamGeo.rotateY(Math.PI / 4); beamGeo.translate(0, -bLen / 2, 0); beamGeo.scale(SW / 2 / 0.707, 1, SH / 2 / 0.707);
  const beamMesh = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beamMesh.position.copy(lensW); beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), bDir.normalize()); room.add(beamMesh);

  /* ===== LIBRARY — the bookshelf + its portal ===== */
  const lib = hotspot({ id: "library", route: "library", label: "the library", sub: "poems & stories", anchor: new THREE.Vector3(-1.3, 3.25, -1.45) });
  const shelfMat = M(0x0d2638, { roughness: 0.5, metalness: 0.1 });
  const S = { x: -1.32, z: -1.72, w: 1.12, h: 2.3, d: 0.36 };
  put(rbox(S.w, S.h, 0.03, M(0x050d17), 0.01), S.x, S.h / 2, S.z - S.d / 2 + 0.02, lib.group);
  [-1, 1].forEach((s) => put(rbox(0.05, S.h, S.d, shelfMat, 0.015), S.x + s * (S.w / 2 - 0.025), S.h / 2, S.z, lib.group));
  const BOOKS = [0x133c55, 0x386fa4, 0x59a5d8, 0x84d2f6, 0xeef6fa, 0x0e3b36, 0x1d6b5f, 0x6fd3b8, 0x0b1d30, 0x91e5f6];
  [0.04, 0.6, 1.16, 1.72, 2.27].forEach((y, si, arr) => {
    put(rbox(S.w, 0.04, S.d, shelfMat, 0.012), S.x, y, S.z, lib.group);
    if (si === arr.length - 1) return;
    let x = S.x - S.w / 2 + 0.07; const end = S.x + S.w / 2 - 0.07;
    while (x < end) {
      const bw = 0.05 + rand() * 0.06, bh = 0.3 + rand() * 0.16; if (x + bw > end) break;
      const lean = rand() < 0.1 ? 0.18 : 0;
      const b = rbox(bw, bh, 0.24 + rand() * 0.06, M(BOOKS[Math.floor(rand() * BOOKS.length)], { roughness: 0.6 }), 0.008);
      b.rotation.z = -lean; put(b, x + bw / 2 + (lean ? 0.04 : 0), y + 0.02 + bh / 2, S.z + 0.02, lib.group);
      x += bw + 0.008 + (lean ? 0.06 : 0);
    }
  });
  const globe = put(new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 18), M(0x1d6b5f, { emissive: 0x6fd3b8, emissiveIntensity: 0.9, roughness: 0.3 })), S.x - 0.25, 2.47, S.z, lib.group);
  put(new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.008, 8, 40), M(0xeef6fa, { metalness: 0.6, roughness: 0.2 })), S.x - 0.25, 2.47, S.z, lib.group).rotation.x = 1.2;
  const globeLight = new THREE.PointLight(0x6fd3b8, 1.6, 2.6, 2); put(globeLight, S.x - 0.25, 2.5, S.z + 0.3, room);
  addPortal(lib, 0.36, new THREE.Vector3(-0.98, 2.62, -1.4), 0, { a: 0x050d17, b: 0x1d6b5f, c: 0x6fd3b8 });

  /* ===== LAB — the desk + its portal ===== */
  const lab = hotspot({ id: "lab", route: "lab", label: "the lab", sub: "experiments", anchor: new THREE.Vector3(-1.55, 2.62, -0.2) });
  const deskMat = M(0x0f2638, { roughness: 0.4, metalness: 0.15 });
  const DK = { x: -1.58, z: -0.38, w: 0.62, l: 1.15, y: 0.78 };
  put(rbox(DK.w, 0.05, DK.l, deskMat, 0.015), DK.x, DK.y, DK.z, lab.group);
  [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, b]) => put(cyl(0.022, 0.022, DK.y, 0x050d17, 10), DK.x + a * (DK.w / 2 - 0.05), DK.y / 2, DK.z + b * (DK.l / 2 - 0.05), lab.group));
  put(rbox(0.4, 0.36, 0.42, M(0xdfe9ef, { roughness: 0.4 }), 0.05), -1.72, 1.0, -0.6, lab.group);
  const monitor = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.26), new THREE.MeshBasicMaterial({ toneMapped: false }));
  monitor.rotation.y = Math.PI / 2; put(monitor, -1.515, 1.01, -0.6, lab.group);
  put(rbox(0.14, 0.025, 0.36, 0x133c55, 0.01), -1.4, 0.815, -0.6, lab.group);
  const flaskP = [[0, 0], [0.07, 0], [0.075, 0.02], [0.03, 0.12], [0.022, 0.16], [0.026, 0.17], [0, 0.17]].map(([x, y]) => new THREE.Vector2(x, y));
  const liqP = [[0, 0.004], [0.064, 0.004], [0.05, 0.06], [0, 0.06]].map(([x, y]) => new THREE.Vector2(x, y));
  [[0x6fd3b8, -1.38, -0.9], [0x59a5d8, -1.5, -0.86], [0x91e5f6, -1.36, -0.82]].forEach(([col, fx, fz]) => {
    put(new THREE.Mesh(new THREE.LatheGeometry(flaskP, 24), new THREE.MeshStandardMaterial({ color: 0xdfe8ff, transparent: true, opacity: 0.3, roughness: 0.05 })), fx, 0.805, fz, lab.group);
    put(new THREE.Mesh(new THREE.LatheGeometry(liqP, 24), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.1 })), fx, 0.805, fz, lab.group);
  });
  put(rbox(0.2, 0.13, 0.11, M(0x0b1118, { roughness: 0.3 }), 0.02), -1.62, 0.87, -0.12, lab.group);
  put(cyl(0.045, 0.05, 0.08, M(0xdfe9ef, { metalness: 0.6, roughness: 0.2 }), 18), -1.5, 0.87, -0.12, lab.group).rotation.z = Math.PI / 2;
  put(cyl(0.08, 0.09, 0.025, 0x050d17, 18), -1.78, 0.815, 0.02, lab.group);
  const arm1 = put(cyl(0.012, 0.012, 0.42, M(0xdfe9ef, { metalness: 0.6, roughness: 0.3 }), 8), -1.72, 1.0, 0.02, lab.group); arm1.rotation.z = -0.35;
  const arm2 = put(cyl(0.012, 0.012, 0.3, M(0xdfe9ef, { metalness: 0.6, roughness: 0.3 }), 8), -1.56, 1.22, 0.02, lab.group); arm2.rotation.z = 1.0;
  const shade = put(new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.14, 20, 1, true), M(0x133c55, { side: THREE.DoubleSide })), -1.42, 1.17, 0.02, lab.group); shade.rotation.z = 0.6;
  put(new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), new THREE.MeshBasicMaterial({ color: 0xeef6fa, toneMapped: false })), -1.4, 1.12, 0.02, lab.group);
  const deskLamp = new THREE.PointLight(0xd8f0ff, 3.4, 4.2, 1.7); put(deskLamp, -1.36, 1.05, 0.02, room);
  const chair = new THREE.Group();
  put(cyl(0.22, 0.22, 0.07, M(0x386fa4, { roughness: 0.7 })), 0, 0.48, 0, chair);
  put(cyl(0.025, 0.025, 0.42, 0x050d17, 8), 0, 0.24, 0, chair);
  put(cyl(0.2, 0.2, 0.025, 0x050d17, 18), 0, 0.02, 0, chair);
  put(rbox(0.06, 0.42, 0.38, M(0x386fa4, { roughness: 0.7 }), 0.03), 0.2, 0.75, 0, chair);
  put(chair, -1.0, 0, -0.42, lab.group);
  const polaroidUrls = ["lab/gen-2", "lab/gen-4", "lab/gen-5", "lab/gen-6", "lab/viviana-1"].map((p) => "assets/" + p + ".webp");
  const polaroidMats = [];
  put(cyl(0.006, 0.006, 1.3, 0xdfe9ef, 6), -1.895, 2.27, -0.38, lab.group).rotation.x = Math.PI / 2;
  polaroidUrls.forEach((u, i) => {
    const pol = new THREE.Group();
    put(rbox(0.012, 0.32, 0.26, M(0xeef6fa, { roughness: 0.8 }), 0.004), 0, 0, 0, pol);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.7 }); polaroidMats.push([mat, u]);
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), mat); pic.rotation.y = Math.PI / 2; put(pic, 0.008, 0.03, 0, pol);
    pol.rotation.x = (i % 2 ? 1 : -1) * 0.07; put(pol, -1.885, 2.06 - (i % 2) * 0.04, -0.92 + i * 0.27, lab.group);
  });
  addPortal(lab, 0.3, new THREE.Vector3(-1.2, 1.62, -0.38), Math.PI / 2, { a: 0x050d17, b: 0x386fa4, c: 0x91e5f6 });

  /* ===== ABOUT — the window, the armchair ===== */
  const about = hotspot({ id: "about", route: "about", label: "the window", sub: "about me", anchor: new THREE.Vector3(-1.85, 2.85, 1.0) });
  const white = M(0xdfe9ef, { roughness: 0.5 });
  const WN = { z: 1.0, y: 1.78, w: 1.15, h: 1.3, x: -1.9 };
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(WN.w, WN.h), portalMaterial({ rect: true, a: 0x02060b, b: 0x133c55, c: 0x84d2f6 }));
  pane.rotation.y = Math.PI / 2; put(pane, WN.x + 0.004, WN.y, WN.z, about.group);
  portals.push({ h: about, disc: pane, ring: null, glow: null, base: pane.position.clone(), phase: 2, fixed: true });
  about.portalPos = new THREE.Vector3(WN.x, WN.y, WN.z); about.portalNormal = new THREE.Vector3(1, 0, 0);
  put(rbox(0.08, 0.07, WN.w + 0.14, white, 0.02), WN.x + 0.02, WN.y + WN.h / 2 + 0.03, WN.z, about.group);
  put(rbox(0.08, 0.07, WN.w + 0.14, white, 0.02), WN.x + 0.02, WN.y - WN.h / 2 - 0.03, WN.z, about.group);
  [-1, 1].forEach((s) => put(rbox(0.08, WN.h + 0.12, 0.07, white, 0.02), WN.x + 0.02, WN.y, WN.z + s * (WN.w / 2 + 0.035), about.group));
  put(rbox(0.04, WN.h, 0.03, white, 0.01), WN.x + 0.02, WN.y, WN.z, about.group);
  put(rbox(0.22, 0.05, WN.w + 0.3, white, 0.02), WN.x + 0.09, WN.y - WN.h / 2 - 0.08, WN.z, about.group);
  [-1, 1].forEach((s) => { const c = new THREE.Group(); for (let k = 0; k < 4; k++) put(rbox(0.06, 1.62, 0.1, M(0x0e3b36, { roughness: 0.85 }), 0.03), (k % 2) * 0.03, 0, k * 0.085 - 0.13, c); put(c, WN.x + 0.13, WN.y - 0.06, WN.z + s * (WN.w / 2 + 0.24), about.group); });
  const chairA = new THREE.Group(), blue = M(0x386fa4, { roughness: 0.85 }), peri = M(0x59a5d8, { roughness: 0.85 });
  put(rbox(0.85, 0.2, 0.78, blue, 0.07), 0, 0.12, 0, chairA); put(rbox(0.66, 0.16, 0.62, peri, 0.07), 0, 0.3, 0.04, chairA);
  put(rbox(0.85, 0.72, 0.18, blue, 0.08), 0, 0.56, -0.31, chairA);
  [-1, 1].forEach((s) => put(rbox(0.15, 0.42, 0.78, blue, 0.07), s * 0.38, 0.38, 0, chairA));
  put(rbox(0.3, 0.06, 0.5, M(0x6fd3b8, { roughness: 0.9 }), 0.03), 0.38, 0.62, 0.05, chairA).rotation.z = -0.1;
  chairA.rotation.y = Math.PI / 2 + 0.25; put(chairA, -1.35, 0, 1.15, about.group);
  put(cyl(0.15, 0.17, 0.03, 0x050d17, 20), -1.62, 0.015, 0.32, about.group);
  put(cyl(0.014, 0.014, 1.5, M(0xdfe9ef, { metalness: 0.6, roughness: 0.3 }), 8), -1.62, 0.76, 0.32, about.group);
  put(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.26, 24, 1, true), M(0xeef6fa, { side: THREE.DoubleSide, emissive: 0xbfe6ff, emissiveIntensity: 0.6 })), -1.62, 1.56, 0.32, about.group);
  const floorLamp = new THREE.PointLight(0xd8f0ff, 3.2, 4.5, 1.6); put(floorLamp, -1.6, 1.42, 0.38, room);
  const acrylic = new THREE.MeshStandardMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.4, roughness: 0.05, metalness: 0.2, emissive: 0x386fa4, emissiveIntensity: 0.25 });
  const guitar = new THREE.Group();
  put(new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 16), acrylic), 0, 0.36, 0, guitar).scale.z = 0.32;
  put(new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 16), acrylic), 0, 0.68, 0, guitar).scale.z = 0.32;
  put(rbox(0.065, 0.78, 0.04, M(0x13324a), 0.01), 0, 1.18, 0, guitar);
  put(rbox(0.09, 0.16, 0.035, M(0x13324a), 0.01), 0, 1.62, 0, guitar);
  guitar.rotation.set(-0.11, 0.25, 0.05); put(guitar, -0.5, 0.02, -1.66, room);

  /* ===== STAIRS — floating steps out of the water to a portal ===== */
  const stairs = hotspot({ id: "stairs", route: "stairs", label: "the stairs", sub: "posters & design", anchor: new THREE.Vector3(1.55, 4.75, -0.35) });
  const stepMat = new THREE.MeshStandardMaterial({ color: 0x9fd6f2, transparent: true, opacity: 0.32, roughness: 0.08, metalness: 0.3, emissive: 0x133c55, emissiveIntensity: 0.6 });
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0xbfeaff, toneMapped: false });
  const N = 12, steps = [];
  for (let i = 0; i < N; i++) {
    const k = i / (N - 1);
    const a = -0.2 + k * 2.1;
    const x = 2.85 + Math.sin(a) * 0.45 - k * 1.2, z = 2.55 - k * 3.0, y = -0.3 + k * 4.0;
    const st = rbox(0.46, 0.035, 0.24, stepMat, 0.012); st.rotation.y = 0.5 - k * 0.9; st.castShadow = false;
    put(st, x, y, z, stairs.group);
    [0.12, -0.12].forEach((zz) => { const edge = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.008, 0.008), edgeMat); edge.position.set(0, 0.018, zz); st.add(edge); });
    steps.push({ st, base: y, ph: i * 0.45 });
  }
  addPortal(stairs, 0.62, new THREE.Vector3(1.6, 4.25, -0.45), -0.35, { a: 0x02060b, b: 0x133c55, c: 0xeef6fa });

  /* ---------- fairy lights ---------- */
  const bulbA = new THREE.MeshBasicMaterial({ color: 0xdff4ff, toneMapped: false }), bulbB = new THREE.MeshBasicMaterial({ color: 0x91e5f6, toneMapped: false });
  const bulbGeo = new THREE.SphereGeometry(0.026, 10, 8);
  const lights = (a, b, sag) => {
    const mid = a.clone().lerp(b, 0.5); mid.y -= sag;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    room.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.005, 5), M(0x050d17)));
    const n = Math.round(a.distanceTo(b) / 0.22);
    for (let i = 1; i < n; i++) { const bl = new THREE.Mesh(bulbGeo, i % 2 ? bulbA : bulbB); bl.position.copy(curve.getPoint(i / n)); room.add(bl); }
  };
  lights(new THREE.Vector3(-1.88, 3.05, -1.88), new THREE.Vector3(2.1, 3.05, -1.88), 0.28);
  lights(new THREE.Vector3(-1.88, 3.05, -1.88), new THREE.Vector3(-1.88, 3.05, 2.1), 0.28);

  const flies = motes(small ? 40 : 70, [-5, 0, -5, 5, 4, 5], { size: 0.08, color: 0x91e5f6 });
  scene.add(flies.points);

  /* collect pickables; clone emissive materials so hover can tint them */
  hotspots.forEach((h) => h.group.traverse((o) => {
    if (!o.isMesh) return;
    o.userData.hot = h.id; pickables.push(o); h.meshes.push(o);
    if (o.material.emissive) { o.material = o.material.clone(); o.userData.e0 = o.material.emissive.clone(); o.userData.ei = o.material.emissiveIntensity; }
  }));

  /* ---------- textures ---------- */
  tex("assets/films/gozero/00.webp").then((t) => { if (t) { monitor.material.map = t; monitor.material.needsUpdate = true; } });
  polaroidMats.forEach(([m, u]) => tex(u).then((t) => { if (t) { m.map = t; m.needsUpdate = true; } }));
  const ready = tex(stillUrls[0]).then((t) => {
    stills[0] = t; screenA.material.map = t; screenA.material.needsUpdate = true;
    stillUrls.slice(1).forEach((u, i) => tex(u).then((tt) => { stills[i + 1] = tt; }));
  });

  /* ---------- camera moves ---------- */
  let anim = null;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function tween(toT, toP, ms, easing = ease) {
    return new Promise((res) => {
      anim = { t0: performance.now(), ms, fT: controls.target.clone(), fP: camera.position.clone(), toT, toP, res, easing };
      controls.enabled = false;
      setTimeout(() => { if (anim && anim.res === res) step(anim.t0 + ms); }, ms + 400);
    });
  }
  function step(now) {
    if (!anim) return;
    const k = Math.min(1, (now - anim.t0) / anim.ms), e = anim.easing(k);
    controls.target.lerpVectors(anim.fT, anim.toT, e);
    camera.position.lerpVectors(anim.fP, anim.toP, e);
    if (k >= 1) { const r = anim.res; anim = null; controls.enabled = active; r(); }
  }

  let active = false, hoverId = null, screenIdx = 0, screenT = 0, fading = false;
  const GLOW = new THREE.Color(0x59a5d8);
  return {
    scene, camera, hotspots, pickables, ready,
    enter() {
      active = true; controls.enabled = !anim;
      renderer.domElement.style.touchAction = "none";
      controls.target.copy(HOME_T);
      camera.position.copy(HOME_T).addScaledVector(HOME_DIR, homeDist());
      controls.update();
    },
    exit() { active = false; controls.enabled = false; renderer.domElement.style.touchAction = ""; },
    resize() { controls.maxDistance = homeDist() + 8; },
    hover(id) {
      if (hoverId) hotspots.find((h) => h.id === hoverId).meshes.forEach((m) => { if (m.userData.e0) { m.material.emissive.copy(m.userData.e0); m.material.emissiveIntensity = m.userData.ei; } });
      hoverId = id;
      if (id) hotspots.find((h) => h.id === id).meshes.forEach((m) => { if (m.userData.e0) { m.material.emissive.copy(GLOW); m.material.emissiveIntensity = 0.45; } });
    },
    dive(id) {
      const h = hotspots.find((x) => x.id === id); if (!h) return Promise.resolve();
      const p = h.portalPos.clone(), n = h.portalNormal.clone();
      return tween(p.clone(), p.clone().addScaledVector(n, 0.25), 950, (t) => t * t * t);
    },
    pullback(sec) {
      const close = HOME_T.clone().addScaledVector(HOME_DIR, 3.2);
      camera.position.copy(close); controls.target.copy(HOME_T);
      tween(HOME_T.clone(), HOME_T.clone().addScaledVector(HOME_DIR, homeDist()), sec * 1000, (t) => 1 - Math.pow(1 - t, 3));
    },
    update(dt, t) {
      step(performance.now());
      controls.update();
      water.material.uniforms.uTime.value = t;
      sky.material.uniforms.uTime.value = t;
      portals.forEach((p) => {
        p.disc.material.uniforms.uTime.value = t + p.phase;
        const target = hoverId === p.h.id ? 1 : 0;
        const u = p.disc.material.uniforms.uHover; u.value += (target - u.value) * Math.min(1, dt * 5);
        if (!p.fixed) {
          const y = p.base.y + Math.sin(t * 0.9 + p.phase) * 0.05;
          p.disc.position.y = p.ring.position.y = p.glow.position.y = y;
          p.glow.material.opacity = 0.35 + u.value * 0.4 + Math.sin(t * 2 + p.phase) * 0.05;
        }
      });
      steps.forEach((s) => { s.st.position.y = s.base + Math.sin(t * 0.8 + s.ph) * 0.03; });
      reels.forEach((r, i) => { r.rotation.x += dt * (i ? 1.6 : 1.2); });
      beamMesh.material.opacity = 0.05 + Math.sin(t * 9) * 0.004;
      screenT += dt;
      if (!fading && screenT > 4.2 && stills[(screenIdx + 1) % stillUrls.length]) { fading = true; screenT = 0; screenB.material.map = stills[(screenIdx + 1) % stillUrls.length]; screenB.material.needsUpdate = true; }
      if (fading) {
        screenB.material.opacity = Math.min(1, screenB.material.opacity + dt * 0.9);
        if (screenB.material.opacity >= 1) { screenIdx = (screenIdx + 1) % stillUrls.length; screenA.material.map = stills[screenIdx]; screenA.material.needsUpdate = true; screenB.material.opacity = 0; fading = false; }
      }
      screenLight.intensity = 2.2 + Math.sin(t * 7) * 0.15;
      globe.rotation.y += dt * 0.4;
      const tw = 0.75 + Math.sin(t * 2.2) * 0.25; bulbA.color.setRGB(0.87 * tw + 0.1, 0.95 * tw + 0.05, 1);
      flies.update(t);
    }
  };
}
