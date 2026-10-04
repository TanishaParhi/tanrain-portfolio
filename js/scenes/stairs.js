/* The stairs — a moonlit stairwell; every frame on the wall is a poster. Scroll to climb. */
import * as THREE from "three";
import { motes, lightShaft, glowTexture, glowPlane } from "tr/shaders";

export function create(ctx) {
  const { D, tex, TR, small } = ctx;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02060b);
  scene.fog = new THREE.Fog(0x02060b, 6, 26);
  const camera = new THREE.PerspectiveCamera(50, ctx.aspect(), 0.1, 120);
  const add = (o) => { scene.add(o); return o; };

  add(new THREE.HemisphereLight(0x9fc4ff, 0x050d17, 0.7));
  const moon = add(new THREE.DirectionalLight(0xdcecff, 1.4)); moon.position.set(-6, 14, -10);

  const N = 64, RISE = 0.19, RUN = 0.3, WALL_X = 2.9;
  const TOP_Y = N * RISE, TOP_Z = -N * RUN;
  const stepMat = new THREE.MeshStandardMaterial({ color: 0x0b1d2a, roughness: 0.35, metalness: 0.3 });
  const steps = new THREE.InstancedMesh(new THREE.BoxGeometry(2.6, RISE, RUN + 0.02), stepMat, N);
  const nose = new THREE.InstancedMesh(new THREE.BoxGeometry(2.6, 0.012, 0.012), new THREE.MeshBasicMaterial({ color: 0x84d2f6, toneMapped: false }), N);
  const m = new THREE.Matrix4();
  for (let i = 0; i < N; i++) {
    m.makeTranslation(0.6, i * RISE + RISE / 2, -i * RUN); steps.setMatrixAt(i, m);
    m.makeTranslation(0.6, i * RISE + RISE, -i * RUN + RUN / 2); nose.setMatrixAt(i, m);
  }
  add(steps); add(nose);

  /* the wall the posters hang on */
  const wallTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 512; const g = c.getContext("2d");
    g.fillStyle = "#0a1826"; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? "145,229,246" : "2,6,11"},${Math.random() * 0.05})`; g.fillRect(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 6, 2 + Math.random() * 6); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 4); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const wall = add(new THREE.Mesh(new THREE.PlaneGeometry(40, TOP_Y + 14), new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 })));
  wall.rotation.y = -Math.PI / 2; wall.position.set(WALL_X, TOP_Y / 2 + 2, TOP_Z / 2);
  const wall2 = add(new THREE.Mesh(new THREE.PlaneGeometry(40, TOP_Y + 14), new THREE.MeshStandardMaterial({ color: 0x050d17, roughness: 1 })));
  wall2.rotation.y = Math.PI / 2; wall2.position.set(-3.4, TOP_Y / 2 + 2, TOP_Z / 2);

  /* the banister */
  const railPts = [new THREE.Vector3(-0.75, 1.0, 0.4), new THREE.Vector3(-0.75, TOP_Y + 1.0, TOP_Z)];
  add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(...railPts), 8, 0.035, 8), new THREE.MeshStandardMaterial({ color: 0xdfe9ef, metalness: 0.6, roughness: 0.25 })));
  const bal = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.018, 0.022, 0.9, 6), new THREE.MeshStandardMaterial({ color: 0x1b3a52, metalness: 0.4, roughness: 0.4 }), N);
  for (let i = 0; i < N; i++) { m.makeTranslation(-0.75, i * RISE + RISE + 0.45, -i * RUN); bal.setMatrixAt(i, m); }
  add(bal);

  /* a tall window at the top, moonlight falling down the stairs */
  const win = add(new THREE.Mesh(new THREE.PlaneGeometry(2.4, 5), new THREE.MeshBasicMaterial({ color: 0x9fd6f2, toneMapped: false })));
  win.position.set(0.4, TOP_Y + 3.2, TOP_Z - 2.6);
  const winGlow = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x84d2f6, transparent: true, opacity: 0.6, depthWrite: false })));
  winGlow.scale.set(9, 12, 1); winGlow.position.copy(win.position);
  for (let k = 0; k < 4; k++) {
    const sh = lightShaft(2.2, 16, 0xbfe8ff, 0.07); sh.position.set(0.2 + k * 0.4 - 0.6, TOP_Y - 3, TOP_Z + 3 + k); sh.rotation.x = 0.6; add(sh);
  }

  /* posters */
  const hotspots = [], pickables = [], frames = [];
  const loads = D.posters.map((pp, i) => {
    const k = (i + 0.6) / D.posters.length;
    const z = -k * N * RUN + 0.5, y = k * TOP_Y + 1.55 + (i % 2 ? 0.55 : -0.15);
    const g = new THREE.Group(); g.position.set(WALL_X - 0.04, y, z); g.rotation.y = -Math.PI / 2;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.05), new THREE.MeshStandardMaterial({ color: 0x050d17, roughness: 0.4, metalness: 0.5 }));
    const mat = new THREE.MeshBasicMaterial({ color: 0x1b2a38, toneMapped: false });
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); pic.position.z = 0.03;
    pic.userData.hot = "poster" + i; frame.userData.hot = "poster" + i; pickables.push(pic, frame);
    const glow = glowPlane(1, 1, 0x59a5d8, 0.18); glow.position.z = -0.06;
    g.add(glow, frame, pic); add(g);
    const fr = { g, frame, pic, glow, y, z, hover: 0, title: pp[1] };
    frames.push(fr);
    hotspots.push({ id: "poster" + i, cursor: "view", action: () => TR.openPoster(i) });
    return tex("assets/posters/" + pp[0] + ".webp").then((t) => {
      if (!t) return;
      mat.map = t; mat.color.set(0xffffff); mat.needsUpdate = true;
      const a = t.image.width / t.image.height, h = 1.3, w = h * a;
      pic.scale.set(w, h, 1); frame.scale.set(w + 0.14, h + 0.14, 1); glow.scale.set(w * 2.4, h * 2, 1);
    });
  });

  const dust = motes(small ? 120 : 240, [-2, 0, TOP_Z - 4, 2, TOP_Y + 6, 2], { size: 0.05, color: 0xdcecff, opacity: 0.6 });
  add(dust.points);

  let hoverId = null, lastCap = -1;
  const ndc = new THREE.Vector3();
  const look = new THREE.Vector3();
  return {
    scene, camera, hotspots, pickables, ready: Promise.all(loads),
    hover(id) { hoverId = id; },
    enter() { lastCap = -1; },
    exit() { TR.caption("", ""); },
    update(dt, t, p, ptr) {
      const k = Math.min(1, p * 1.04);
      const z = 1.2 - k * (N * RUN + 0.6), y = Math.max(0, -z / RUN) * RISE + 1.65;
      camera.position.set(-0.9 + ptr.x * 0.25, y + Math.sin(t * 1.6) * 0.015 + ptr.y * 0.15, z);
      look.set(WALL_X, y + 0.55 + ptr.y * 0.3, z - 2.6 + ptr.x * 0.5);
      camera.lookAt(look);
      camera.updateMatrixWorld();
      let best = -1, bd = 1e9;
      frames.forEach((fr, i) => {
        const target = hoverId === "poster" + i ? 1 : 0; fr.hover += (target - fr.hover) * Math.min(1, dt * 6);
        const s = 1 + fr.hover * 0.06; fr.g.scale.set(s, s, s);
        fr.glow.material.opacity = 0.15 + fr.hover * 0.35;
        ndc.copy(fr.g.position).project(camera);
        const d = Math.abs(ndc.x) + Math.abs(ndc.y) * 0.5; if (ndc.z < 1 && d < bd) { bd = d; best = i; }
      });
      const show = p > 0.04 && p < 0.985 && bd < 0.55;
      const cap = show ? best : -1;
      if (cap !== lastCap) { lastCap = cap; TR.caption(cap >= 0 ? "poster " + String(cap + 1).padStart(2, "0") + " / " + frames.length : "", cap >= 0 ? frames[cap].title : ""); }
      dust.update(t);
    },
    dispose() {}
  };
}
