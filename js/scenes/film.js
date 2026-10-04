/* A film world — the film's own frames, floating in an environment built for it.
   Scroll moves the camera through the world; click a frame to hold it still. */
import * as THREE from "three";
import { PALETTE as P, NOISE, waterMaterial, skyDome, motes, glowTexture, lightShaft, glowPlane } from "tr/shaders";

const THEMES = {
  booth: { bg: 0x050d17, fog: 0x07121c, near: 5, far: 26 },
  ocean: { bg: 0x0a1a2a, fog: 0x0b1d2e, near: 6, far: 34 },
  glass: { bg: 0x02060b, fog: 0x031411, near: 4, far: 26 },
  flame: { bg: 0x02060b, fog: 0x02060b, near: 8, far: 34 },
  stars: { bg: 0x02060b, fog: 0x02060b, near: 12, far: 60 },
  garden: { bg: 0xbfe3f2, fog: 0xb6dcee, near: 9, far: 42 },
  neon: { bg: 0x02060b, fog: 0x050d17, near: 3, far: 24 }
};

export function create(ctx, { id }) {
  const { tex, D, TR, small } = ctx;
  const f = D.films.find((x) => x.id === id);
  const kind = f.world, th = THEMES[kind];
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(th.bg);
  scene.fog = new THREE.Fog(th.fog, th.near, th.far);
  const camera = new THREE.PerspectiveCamera(48, ctx.aspect(), 0.1, 200);
  const n = f.frames, S = kind === "neon" ? 6 : 5.4;
  const updaters = [], hotspots = [], pickables = [], frames = [];
  let seed = 7; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const add = (o) => { scene.add(o); return o; };

  /* ---------- lights ---------- */
  add(new THREE.HemisphereLight(kind === "garden" ? 0xffffff : 0x9fc4ff, kind === "garden" ? 0x6fd3b8 : 0x05121c, kind === "garden" ? 1.4 : kind === "booth" ? 1.6 : 0.9));
  const key = add(new THREE.DirectionalLight(0xdcecff, kind === "garden" ? 1.6 : 0.8)); key.position.set(4, 10, 6);

  /* ---------- frame placement ---------- */
  const place = (i) => {
    if (kind === "flame") {
      const a = (i / n) * Math.PI * 2 * 1.25, y = 1.2 + (i / n) * 11;
      return { pos: new THREE.Vector3(Math.cos(a) * 4.4, y, Math.sin(a) * 4.4), rotY: -a + Math.PI / 2 + Math.PI };
    }
    const side = i % 2 ? 1 : -1;
    let y = 1.75 + ((i % 3) - 1) * 0.35, x = side * (kind === "neon" ? 3.1 : 2.5);
    if (kind === "stars") y = 2.4 + ((i * 37) % 10) / 10 * 1.6;
    if (kind === "ocean" && i >= Math.ceil(n * 0.6)) y = -2.2 - (i - Math.ceil(n * 0.6)) * 0.9;
    return { pos: new THREE.Vector3(x, y, -2.5 - i * S), rotY: -side * 0.42 };
  };
  const W = kind === "neon" ? 4.4 : 3.4;
  for (let i = 0; i < n; i++) {
    const { pos, rotY } = place(i);
    const g = new THREE.Group(); g.position.copy(pos); g.rotation.y = rotY;
    const mat = new THREE.MeshBasicMaterial({ color: 0x1b2a38, toneMapped: false });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(W, W * 9 / 16), mat);
    plane.userData.hot = "frame" + i; pickables.push(plane);
    const rim = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.08, W * 9 / 16 + 0.08), new THREE.MeshBasicMaterial({ color: kind === "garden" ? 0xffffff : 0xbfe8ff, toneMapped: false, transparent: true, opacity: 0.75 }));
    rim.position.z = -0.05;
    const glow = glowPlane(W * 2, W * 1.4, kind === "glass" ? 0x6fd3b8 : 0x59a5d8, kind === "garden" ? 0.12 : 0.3);
    glow.position.z = -0.12;
    g.add(glow, rim, plane);
    add(g);
    frames.push({ g, plane, mat, base: pos.clone(), ph: rand() * 6, hover: 0 });
    hotspots.push({ id: "frame" + i, cursor: "view", action: () => TR.openFrame(f.id, i) });
  }
  const loads = frames.map((fr, i) => tex(`assets/films/${f.id}/${String(i).padStart(2, "0")}.webp`).then((t) => {
    if (!t) return;
    fr.mat.map = t; fr.mat.needsUpdate = true; fr.fadeIn = 0;
    const a = t.image.width / t.image.height;
    if (Math.abs(a - 16 / 9) > 0.05) fr.plane.scale.set(Math.min(1, a / (16 / 9)), Math.min(1, (16 / 9) / a), 1);
  }));

  /* ---------- environments ---------- */
  const endZ = -2.5 - (n - 1) * S;
  const path = { len: Math.abs(endZ) + 8 };

  if (kind === "booth") {
    const room = add(new THREE.Mesh(new THREE.BoxGeometry(14, 7, path.len + 20), new THREE.MeshStandardMaterial({ color: 0x13324a, side: THREE.BackSide, roughness: 0.95 })));
    room.position.set(0, 3.2, endZ / 2);
    for (let i = 0; i < n; i++) {
      const fr = frames[i];
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 3.2, 4), new THREE.MeshBasicMaterial({ color: 0x9fb8c8 }));
      wire.position.set(0, 2.6, 0); fr.g.add(wire);
      const cone = lightShaft(2.6, 5.2, 0xdcecff, 0.16); cone.position.set(fr.base.x, fr.base.y + 1.4, fr.base.z + 0.4); add(cone);
      updaters.push(() => cone.lookAt(camera.position.x, cone.position.y, camera.position.z));
    }
    for (let k = 0; k < 18; k++) {
      const strip = new THREE.Group();
      for (let j = 0; j < 4; j++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.26), frames[(k + j) % n].mat); m.position.y = -j * 0.3; strip.add(m); }
      const bg = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 1.28), new THREE.MeshBasicMaterial({ color: 0xeef6fa })); bg.position.set(0, -0.45, -0.005); strip.add(bg);
      strip.position.set((rand() - 0.5) * 11, 3.6 + rand() * 1.2, 2 - rand() * path.len);
      strip.rotation.y = (rand() - 0.5) * 1.2; add(strip);
      updaters.push((t) => { strip.rotation.z = Math.sin(t * 0.6 + k) * 0.05; });
    }
    const dust = motes(small ? 90 : 160, [-6, 0, endZ - 6, 6, 5, 6], { size: 0.045, color: 0xdcecff, opacity: 0.55 });
    add(dust.points); updaters.push(dust.update);
    const floor = add(new THREE.Mesh(new THREE.PlaneGeometry(14, path.len + 20), new THREE.MeshStandardMaterial({ color: 0x0b1a28, roughness: 0.3, metalness: 0.4 })));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, endZ / 2);
  }

  let waterMesh = null;
  if (kind === "ocean" || kind === "glass" || kind === "neon" || kind === "stars") {
    const wm = waterMaterial({
      fog: th.fog, fogNear: th.near, fogFar: th.far, side: kind === "ocean" ? THREE.DoubleSide : THREE.FrontSide,
      deep: kind === "glass" ? 0x02100e : 0x02080f, shallow: kind === "glass" ? 0x0e3b36 : 0x0b2a3d,
      sky: kind === "glass" ? 0x1d6b5f : kind === "neon" ? 0x133c55 : 0x386fa4, scale: kind === "neon" ? 1.6 : 0.9, sun: [0.2, 0.35, -1]
    });
    waterMesh = add(new THREE.Mesh(new THREE.PlaneGeometry(120, path.len + 80, 1, 1), wm));
    waterMesh.rotation.x = -Math.PI / 2; waterMesh.position.set(0, kind === "ocean" ? 0 : 0.02, endZ / 2);
    if (kind === "stars") waterMesh.visible = false;
  }

  const sky = (kind === "booth" || kind === "neon") ? null : add(skyDome({
    top: kind === "garden" ? 0x59a5d8 : 0x02060b, bottom: kind === "garden" ? 0xeef6fa : kind === "glass" ? 0x062019 : 0x0a1a2a,
    band: kind === "glass" ? 0x0e3b36 : 0x133c55, stars: kind === "garden" ? 0 : kind === "stars" ? 1.6 : 1, radius: 110
  }));
  if (sky) sky.position.z = endZ / 2;

  if (kind === "ocean") {
    const under = new THREE.Color(0x0a2a44), above = new THREE.Color(th.fog);
    const bubbles = motes(small ? 80 : 150, [-6, -9, endZ - 6, 6, -0.3, 4], { size: 0.07, color: 0xbfe8ff, opacity: 0.6, rise: 0.6 });
    add(bubbles.points); updaters.push(bubbles.update);
    for (let k = 0; k < 9; k++) { const s = lightShaft(1.6 + rand() * 2, 12, 0x84d2f6, 0.07); s.position.set((rand() - 0.5) * 10, -6, endZ * (0.55 + rand() * 0.5)); s.rotation.z = (rand() - 0.5) * 0.3; add(s); updaters.push(() => s.lookAt(camera.position.x, s.position.y, camera.position.z)); }
    for (let k = 0; k < 6; k++) { const cliff = new THREE.Mesh(new THREE.ConeGeometry(4 + rand() * 4, 8 + rand() * 8, 6), new THREE.MeshStandardMaterial({ color: 0x0b1d2a, flatShading: true, roughness: 0.9 })); cliff.position.set((k % 2 ? 1 : -1) * (12 + rand() * 6), 2, -6 - k * 7); add(cliff); }
    updaters.push(() => {
      const u = THREE.MathUtils.clamp(-camera.position.y / 2, 0, 1);
      scene.fog.color.lerpColors(above, under, u); scene.background.copy(scene.fog.color);
      scene.fog.near = THREE.MathUtils.lerp(th.near, 1.5, u); scene.fog.far = THREE.MathUtils.lerp(th.far, 16, u);
      if (sky) sky.visible = u < 0.95;
    });
  }

  if (kind === "glass") {
    const lead = (() => {
      const c = document.createElement("canvas"); c.width = 512; c.height = 288; const g = c.getContext("2d");
      /* leaded border only — panes around the edge, the image stays clear */
      g.strokeStyle = "rgba(2,6,11,.85)"; g.lineWidth = 3;
      g.lineWidth = 14; g.strokeRect(0, 0, 512, 288);
      g.lineWidth = 3;
      for (let x = 0; x <= 512; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 22); g.moveTo(x, 288); g.lineTo(x, 266); g.stroke(); }
      for (let y = 0; y <= 288; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(22, y); g.moveTo(512, y); g.lineTo(490, y); g.stroke(); }
      g.strokeRect(22, 22, 468, 244);
      g.fillStyle = "rgba(111,211,184,.18)"; g.fillRect(0, 0, 512, 22); g.fillRect(0, 266, 512, 22); g.fillRect(0, 22, 22, 244); g.fillRect(490, 22, 22, 244);
      return new THREE.CanvasTexture(c);
    })();
    frames.forEach((fr) => {
      const ov = new THREE.Mesh(new THREE.PlaneGeometry(W, W * 9 / 16), new THREE.MeshBasicMaterial({ map: lead, transparent: true, depthWrite: false }));
      ov.position.z = 0.01; fr.g.add(ov);
      const arch = new THREE.Mesh(new THREE.TorusGeometry(W / 2 + 0.1, 0.06, 8, 48, Math.PI), new THREE.MeshStandardMaterial({ color: 0x1d6b5f, emissive: 0x0e3b36, emissiveIntensity: 0.8, roughness: 0.3 }));
      arch.position.y = W * 9 / 32; fr.g.add(arch);
    });
    for (let k = 0; k < Math.ceil(path.len / 6); k++) {
      [-1, 1].forEach((s) => {
        const pil = add(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 7, 12), new THREE.MeshStandardMaterial({ color: 0x0b1f1c, roughness: 0.6 })));
        pil.position.set(s * 4.6, 3.5, 2 - k * 6);
      });
    }
    const motesG = motes(small ? 90 : 160, [-5, 0.2, endZ - 6, 5, 5, 5], { size: 0.08, color: 0x6fd3b8, opacity: 0.8 });
    add(motesG.points); updaters.push(motesG.update);
  }

  let flame = null;
  if (kind === "flame") {
    const fm = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform float uTime; varying vec2 vUv; ${NOISE}
        void main(){ vec2 p = vUv; float n = fbm(vec2(p.x*4.0, p.y*3.0 - uTime*1.6));
          float w = 0.32 * (1.0 - p.y*0.7); float d = abs(p.x - 0.5 + (n-0.5)*0.25*p.y);
          float a = smoothstep(w, w*0.2, d) * smoothstep(1.0, 0.05, p.y) * smoothstep(0.0, 0.06, p.y);
          float core = smoothstep(w*0.45, 0.0, d) * smoothstep(0.7, 0.0, p.y);
          vec3 col = mix(vec3(0.05,0.25,0.55), vec3(0.35,0.75,1.0), a) + vec3(0.9,0.97,1.0)*core;
          gl_FragColor = vec4(col, a*(0.6+0.6*n)); }`
    });
    flame = add(new THREE.Mesh(new THREE.PlaneGeometry(3.2, 15), fm));
    flame.position.set(0, 7, 0);
    const embers = motes(small ? 120 : 220, [-3, 0, -3, 3, 15, 3], { size: 0.08, color: 0x91e5f6, opacity: 0.9, rise: 1.2 });
    add(embers.points); updaters.push(embers.update);
    const glowL = add(new THREE.PointLight(0x84d2f6, 6, 14, 1.6)); glowL.position.set(0, 4, 0);
    const base = add(new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 0.4, 32), new THREE.MeshStandardMaterial({ color: 0x0b1d2a, roughness: 0.4, metalness: 0.4 })));
    base.position.y = 0.2;
    const floor = add(new THREE.Mesh(new THREE.CircleGeometry(30, 64), waterMaterial({ fogNear: 8, fogFar: 34, sun: [0, 0.5, 0.2] })));
    floor.rotation.x = -Math.PI / 2; waterMesh = floor;
    updaters.push((t) => { fm.uniforms.uTime.value = t; flame.lookAt(camera.position.x, flame.position.y, camera.position.z); glowL.intensity = 5.5 + Math.sin(t * 9) * 0.6; });
  }

  if (kind === "stars" || kind === "garden") {
    const blades = small ? 2200 : 4200;
    const bg = new THREE.ConeGeometry(0.03, 0.7, 3); bg.translate(0, 0.35, 0);
    const grass = new THREE.InstancedMesh(bg, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }), blades);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), c = new THREE.Color();
    for (let i = 0; i < blades; i++) {
      ps.set((rand() - 0.5) * 30, 0, 6 - rand() * (path.len + 14));
      if (Math.abs(ps.x) < 0.7) ps.x += Math.sign(ps.x || 1) * 0.7;
      q.setFromEuler(new THREE.Euler((rand() - 0.5) * 0.5, rand() * 3, (rand() - 0.5) * 0.5));
      const h = 0.5 + rand() * 1.2; sc.set(1, h, 1); m.compose(ps, q, sc); grass.setMatrixAt(i, m);
      c.set(kind === "garden" ? [0x1d6b5f, 0x2f8a6f, 0x6fd3b8][i % 3] : [0x06140f, 0x0e3b36, 0x0b2420][i % 3]); grass.setColorAt(i, c);
    }
    add(grass);
    const ground = add(new THREE.Mesh(new THREE.PlaneGeometry(60, path.len + 40), new THREE.MeshStandardMaterial({ color: kind === "garden" ? 0x2f6f5a : 0x030b0a, roughness: 1 })));
    ground.rotation.x = -Math.PI / 2; ground.position.z = endZ / 2;
    if (kind === "stars") {
      const pts = frames.map((fr) => fr.base.clone().add(new THREE.Vector3(0, 0, 0)));
      const line = add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x91e5f6, transparent: true, opacity: 0.35 })));
      void line;
      const fl = motes(small ? 60 : 110, [-10, 0.3, endZ - 6, 10, 2.5, 6], { size: 0.09, color: 0x91e5f6, opacity: 0.9 });
      add(fl.points); updaters.push(fl.update);
    } else {
      const petals = motes(small ? 120 : 220, [-9, 0, endZ - 6, 9, 7, 6], { size: 0.1, color: 0xffffff, opacity: 0.9 });
      add(petals.points); updaters.push(petals.update);
    }
  }

  if (kind === "neon") {
    const tubes = [0x91e5f6, 0x6fd3b8, 0x386fa4, 0xeef6fa];
    for (let k = 0; k < Math.ceil(path.len / 4); k++) {
      [-1, 1].forEach((s, j) => {
        const col = tubes[(k + j) % tubes.length];
        const tube = add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.6 + rand() * 1.4), new THREE.MeshBasicMaterial({ color: col, toneMapped: false })));
        tube.position.set(s * (4.6 + rand() * 0.6), 2.4 + rand() * 2.5, 2 - k * 4 - rand() * 2);
        if (rand() < 0.5) tube.rotation.x = Math.PI / 2;
        const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: col, transparent: true, opacity: 0.35, depthWrite: false }));
        gl.scale.set(2.6, 2.6, 1); gl.position.copy(tube.position); add(gl);
        const ph = rand() * 10; updaters.push((t) => { gl.material.opacity = 0.3 + (Math.sin(t * 13 + ph) > 0.92 ? -0.25 : 0.05); });
      });
      [-1, 1].forEach((s) => { const b = add(new THREE.Mesh(new THREE.BoxGeometry(3, 10 + rand() * 8, 3), new THREE.MeshStandardMaterial({ color: 0x050d17, roughness: 0.8 }))); b.position.set(s * 7.5, 5, 2 - k * 4); });
    }
    frames.forEach((fr) => { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, fr.base.y, 8), new THREE.MeshStandardMaterial({ color: 0x0b1d2a })); post.position.y = -fr.base.y / 2 - 1.2; fr.g.add(post); });
    const RN = small ? 500 : 1100, rp = new Float32Array(RN * 6), rv = [];
    for (let i = 0; i < RN; i++) { const x = (rand() - 0.5) * 16, y = rand() * 9, z = 4 - rand() * (path.len + 6); rv.push([x, y, z, 10 + rand() * 6]); }
    const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.BufferAttribute(rp, 3));
    add(new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.35 })));
    updaters.push((t, dt) => {
      for (let i = 0; i < RN; i++) { const r = rv[i]; r[1] -= r[3] * dt; if (r[1] < 0) r[1] += 9; rp.set([r[0], r[1], r[2], r[0] - 0.03, r[1] + 0.35, r[2]], i * 6); }
      rg.attributes.position.needsUpdate = true;
    });
  }

  /* ---------- camera ---------- */
  const start = new THREE.Vector3(0, 1.7, 7), lookT = new THREE.Vector3();
  let held = null;
  function camAt(p, look, t) {
    if (kind === "flame") {
      const a = p * Math.PI * 2 * 1.25 + 0.4, y = 1.8 + p * 11;
      camera.position.set(Math.cos(a) * 10.5, y + 0.4, Math.sin(a) * 10.5);
      lookT.set(0, y + 0.2, 0);
    } else {
      const z = THREE.MathUtils.lerp(start.z, endZ - 1.5, p);
      let y = 1.7;
      if (kind === "ocean") y = THREE.MathUtils.lerp(1.7, -4.2, THREE.MathUtils.smoothstep(p, 0.52, 0.8));
      if (kind === "stars") y = 2.2 + p * 0.6;
      camera.position.set(Math.sin(t * 0.25) * 0.35 + look.x * 0.6, y + look.y * 0.3, z);
      lookT.set(look.x * 1.5, y + (kind === "stars" ? 0.8 : 0) + look.y * 0.6, z - 7);
    }
    camera.lookAt(lookT);
  }

  let hoverId = null;
  return {
    scene, camera, hotspots, pickables, ready: Promise.all(loads.slice(0, 2)),
    hover(id) { hoverId = id; },
    update(dt, t, p, look) {
      camAt(p, look, t);
      if (waterMesh) waterMesh.material.uniforms.uTime.value = t;
      if (sky) sky.material.uniforms.uTime.value = t;
      frames.forEach((fr, i) => {
        const target = hoverId === "frame" + i ? 1 : 0;
        fr.hover += (target - fr.hover) * Math.min(1, dt * 6);
        fr.g.position.y = fr.base.y + Math.sin(t * 0.6 + fr.ph) * 0.06;
        if (fr.fadeIn !== undefined && fr.fadeIn < 1) { fr.fadeIn = Math.min(1, fr.fadeIn + dt * 2.5); fr.mat.color.setScalar(0.11 + 0.89 * fr.fadeIn); }
        const k = 1 + fr.hover * 0.07; fr.g.scale.set(k, k, k);
      });
      updaters.forEach((u) => u(t, dt));
      void held;
    },
    dispose() {
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) [].concat(o.material).forEach((m) => m.dispose());
      });
    }
  };
}
