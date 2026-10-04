/* The library — a tower of books under a starry dome and an orrery, water on the floor,
   an underwater window, and nine glowing books floating up the middle. Each opens a poem. */
import * as THREE from "three";
import { NOISE, waterMaterial, motes, glowTexture } from "tr/shaders";

export function create(ctx) {
  const { D, small } = ctx;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02060b);
  scene.fog = new THREE.FogExp2(0x041219, 0.028);
  const camera = new THREE.PerspectiveCamera(55, ctx.aspect(), 0.1, 200);
  const R = 7, H = 24;
  let seed = 3; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const add = (o) => { scene.add(o); return o; };

  add(new THREE.HemisphereLight(0x84d2f6, 0x0e3b36, 0.65));
  const winLight = add(new THREE.PointLight(0x59a5d8, 14, 16, 1.6)); winLight.position.set(0, 4, -R + 1.2);
  const globeLight = add(new THREE.PointLight(0x6fd3b8, 8, 12, 1.6)); globeLight.position.set(-3.4, 1.6, 2.6);
  const topLight = add(new THREE.PointLight(0xdcecff, 10, 26, 1.4)); topLight.position.set(0, H - 5, 0);

  /* ---------- the walls of books ---------- */
  const WIN_A = -Math.PI / 2, WIN_HALF = 0.32;
  const levels = Math.floor(H / 1.15);
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0x0b2232, roughness: 0.55, metalness: 0.15 });
  for (let l = 0; l <= levels; l++) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.05, R - 0.05, 0.06, 64, 1, true, 0, Math.PI * 2), shelfMat);
    ring.position.y = l * 1.15; add(ring);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(R - 0.42, 0.03, 6, 96), shelfMat);
    lip.rotation.x = Math.PI / 2; lip.position.y = l * 1.15 + 0.03; add(lip);
  }
  const back = add(new THREE.Mesh(new THREE.CylinderGeometry(R + 0.05, R + 0.05, H + 2, 64, 1, true), new THREE.MeshStandardMaterial({ color: 0x050d17, side: THREE.BackSide, roughness: 1 })));
  back.position.y = H / 2;

  const COLORS = [0x133c55, 0x386fa4, 0x59a5d8, 0x84d2f6, 0xeef6fa, 0x0e3b36, 0x1d6b5f, 0x6fd3b8, 0x0b1d30, 0x91e5f6, 0x2a4f6a, 0x163a33];
  const books = [];
  for (let l = 0; l < levels; l++) {
    let a = 0;
    while (a < Math.PI * 2) {
      const w = 0.07 + rand() * 0.07, da = w / (R - 0.3);
      const ang = a + da / 2;
      const inWin = Math.abs(Math.atan2(Math.sin(ang - WIN_A), Math.cos(ang - WIN_A))) < WIN_HALF && l * 1.15 < 7.2;
      if (!inWin && rand() > 0.03) books.push({ ang, y: l * 1.15 + 0.06, w, h: 0.62 + rand() * 0.38, d: 0.3 + rand() * 0.08, c: COLORS[Math.floor(rand() * COLORS.length)], lean: rand() < 0.04 ? (rand() - 0.5) * 0.5 : 0 });
      a += da + 0.004;
    }
  }
  const bookMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.05 }), books.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color();
  books.forEach((b, i) => {
    const r = R - 0.3 - b.d / 2;
    p.set(Math.cos(b.ang) * r, b.y + b.h / 2, Math.sin(b.ang) * r);
    e.set(0, -b.ang, b.lean); q.setFromEuler(e); s.set(b.d, b.h, b.w);
    m4.compose(p, q, s); bookMesh.setMatrixAt(i, m4);
    col.set(b.c).multiplyScalar(0.75 + rand() * 0.35); bookMesh.setColorAt(i, col);
  });
  add(bookMesh);

  /* ---------- the underwater window ---------- */
  const winMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } }, toneMapped: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime; varying vec2 vUv; ${NOISE}
      float fish(vec2 p, float t, float y, float sp, float s){ vec2 q = p - vec2(fract(t*sp + y*3.1)*1.4 - 0.2, y); q.x *= 1.0/s; q.y *= 2.6/s; float body = smoothstep(0.03, 0.0, length(q) - 0.025); float tail = smoothstep(0.02, 0.0, abs(q.y) - (q.x+0.05)*0.6) * step(q.x, -0.02) * step(-0.07, q.x); return max(body, tail); }
      void main(){ vec2 p = vUv; float t = uTime;
        vec3 deep = vec3(0.01,0.08,0.18), shallow = vec3(0.12,0.45,0.75);
        vec3 c = mix(deep, shallow, smoothstep(0.0, 1.0, p.y));
        float ca = pow(abs(sin(fbm(p*6.0 + vec2(t*0.2, t*0.15))*6.28)), 6.0);
        c += vec3(0.5,0.85,1.0) * ca * 0.35 * p.y;
        float sh = 0.0; for (int i=0;i<10;i++){ float fi = float(i); sh = max(sh, fish(p, t*0.6, 0.15 + fract(fi*0.37)*0.7, 0.04 + fract(fi*0.71)*0.05, 0.6 + fract(fi*0.53)*0.7)); }
        c = mix(c, vec3(0.0,0.03,0.07), sh*0.85);
        float bub = step(0.985, hash(floor(vec2(p.x*40.0, p.y*40.0 - t*3.0)))) * 0.6; c += vec3(0.7,0.9,1.0)*bub*p.y;
        float frame = step(0.49, abs(p.x-0.5)) + step(0.495, abs(p.y-0.5)) + step(0.996, 1.0-abs(fract(p.x*3.0)-0.5)*2.0) + step(0.996, 1.0-abs(fract(p.y*4.0)-0.5)*2.0);
        c = mix(c, vec3(0.02,0.06,0.1), clamp(frame,0.0,1.0)*0.9);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`
  });
  const winGeo = new THREE.CylinderGeometry(R - 0.32, R - 0.32, 6.6, 24, 1, true, Math.PI / 2 - WIN_A - WIN_HALF, WIN_HALF * 2);
  const win = add(new THREE.Mesh(winGeo, winMat)); win.position.y = 3.6; win.material.side = THREE.BackSide;
  const winArch = add(new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.1, 8, 40, Math.PI), new THREE.MeshStandardMaterial({ color: 0x84d2f6, emissive: 0x386fa4, emissiveIntensity: 0.8 })));
  winArch.position.set(0, 6.9, -(R - 0.4));

  /* ---------- the dome of stars + the orrery ---------- */
  const dome = add(new THREE.Mesh(new THREE.SphereGeometry(R + 0.1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.ShaderMaterial({
    side: THREE.BackSide, uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime; varying vec3 vP; ${NOISE}
      void main(){ vec2 sp = vec2(atan(vP.z, vP.x)*30.0, vP.y*40.0); float h = hash(floor(sp));
        float star = step(0.975, h) * smoothstep(0.5, 0.0, length(fract(sp)-0.5)) * (0.6+0.4*sin(uTime*2.0+h*50.0));
        float neb = fbm(vP.xz*3.0 + uTime*0.01);
        vec3 c = mix(vec3(0.01,0.05,0.09), vec3(0.04,0.2,0.22), neb*neb) + vec3(0.08,0.25,0.4)*smoothstep(0.55,0.9,neb)*0.5;
        c += vec3(0.85,0.95,1.0)*star;
        gl_FragColor = vec4(c,1.0);
        #include <colorspace_fragment>
      }`
  })));
  dome.position.y = H;
  const orrery = new THREE.Group(); orrery.position.y = H - 3.2; add(orrery);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.55 });
  const planets = [];
  [1.0, 1.7, 2.5, 3.3, 4.2, 5.0].forEach((r, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 6, 128), ringMat); ring.rotation.x = Math.PI / 2; orrery.add(ring);
    const size = [0.12, 0.18, 0.14, 0.42, 0.2, 0.15][i], color = [0xeef6fa, 0x6fd3b8, 0x84d2f6, 0x59a5d8, 0x1d6b5f, 0xeef6fa][i];
    const pl = new THREE.Mesh(new THREE.SphereGeometry(size, 24, 16), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: i === 3 ? 0.9 : 0.4, roughness: 0.4 }));
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.4 + i * 0.3, 4), ringMat);
    const piv = new THREE.Group(); piv.rotation.y = rand() * 6; pl.position.x = r; str.position.set(r, (1.4 + i * 0.3) / 2, 0);
    piv.add(pl, str); orrery.add(piv); planets.push({ piv, sp: 0.25 / (1 + i * 0.6) });
  });
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xbfe8ff, transparent: true, opacity: 0.8, depthWrite: false }));
  sun.scale.set(2.4, 2.4, 1); orrery.add(sun);

  /* ---------- the floor: water over a compass ---------- */
  const compass = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 1024; const g = c.getContext("2d");
    g.fillStyle = "#04121c"; g.fillRect(0, 0, 1024, 1024);
    g.translate(512, 512); g.strokeStyle = "rgba(145,229,246,.55)"; g.lineWidth = 3;
    [480, 440, 300, 140].forEach((r) => { g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); });
    for (let i = 0; i < 16; i++) { g.save(); g.rotate((i / 16) * Math.PI * 2); g.fillStyle = i % 2 ? "rgba(29,107,95,.7)" : "rgba(89,165,216,.7)"; g.beginPath(); g.moveTo(0, -(i % 2 ? 280 : 430)); g.lineTo(22, 0); g.lineTo(-22, 0); g.closePath(); g.fill(); g.restore(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const floor = add(new THREE.Mesh(new THREE.CircleGeometry(R, 64), new THREE.MeshStandardMaterial({ map: compass, roughness: 0.4, metalness: 0.2 })));
  floor.rotation.x = -Math.PI / 2;
  const water = add(new THREE.Mesh(new THREE.CircleGeometry(R, 64), waterMaterial({ deep: 0x021412, shallow: 0x0e3b36, sky: 0x1d6b5f, horizon: 0x04121c, opacity: 0.72, fogNear: 30, fogFar: 60, scale: 1.4, sun: [0, 0.8, -0.5] })));
  water.rotation.x = -Math.PI / 2; water.position.y = 0.08;

  /* ---------- props: ladder, telescope, globe, open books ---------- */
  const wood = new THREE.MeshStandardMaterial({ color: 0x13324a, roughness: 0.5 });
  const ladder = new THREE.Group();
  [-0.32, 0.32].forEach((x) => { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 13, 0.07), wood); rail.position.set(x, 6.5, 0); ladder.add(rail); });
  for (let k = 0; k < 30; k++) { const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.64, 6), wood); rung.rotation.z = Math.PI / 2; rung.position.y = 0.4 + k * 0.42; ladder.add(rung); }
  ladder.position.set(Math.cos(-2.4) * (R - 1.0), 0, Math.sin(-2.4) * (R - 1.0)); ladder.rotation.set(-0.12, Math.PI / 2 + 2.4, 0); add(ladder);
  const globe = add(new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 20), new THREE.MeshStandardMaterial({ color: 0x1d6b5f, emissive: 0x6fd3b8, emissiveIntensity: 1.1, roughness: 0.3 })));
  globe.position.set(-3.4, 1.4, 2.6);
  const gRing = add(new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.02, 8, 64), new THREE.MeshStandardMaterial({ color: 0xeef6fa, metalness: 0.7, roughness: 0.2 })));
  gRing.position.copy(globe.position); gRing.rotation.set(1.1, 0, 0.4);
  const stand = add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.3, 0.85, 12), wood)); stand.position.set(-3.4, 0.42, 2.6);
  const scope = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 1.6, 16), new THREE.MeshStandardMaterial({ color: 0xdfe9ef, metalness: 0.5, roughness: 0.25 })); tube.rotation.z = 1.1; tube.position.y = 1.5; scope.add(tube);
  [0, 2.1, 4.2].forEach((a) => { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 6), wood); leg.position.set(Math.cos(a) * 0.3, 0.7, Math.sin(a) * 0.3); leg.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); scope.add(leg); });
  scope.position.set(2.2, 0, -(R - 2.4)); scope.rotation.y = -0.6; add(scope);

  /* ---------- the nine books ---------- */
  const hotspots = [], pickables = [], floaters = [];
  const pageMat = new THREE.MeshStandardMaterial({ color: 0xeef6fa, emissive: 0xbfe8ff, emissiveIntensity: 0.9, side: THREE.DoubleSide });
  D.poems.forEach((poem, i) => {
    const g = new THREE.Group();
    const coverMat = new THREE.MeshStandardMaterial({ color: [0x133c55, 0x1d6b5f, 0x386fa4][i % 3], emissive: 0x386fa4, emissiveIntensity: 0.3, roughness: 0.4 });
    [-1, 1].forEach((sd) => {
      const half = new THREE.Group();
      const cover = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.58), coverMat); cover.position.x = sd * 0.21;
      const page = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.035, 0.54), pageMat); page.position.set(sd * 0.2, 0.025, 0);
      half.add(cover, page); half.rotation.z = sd * -0.35; g.add(half);
      [cover, page].forEach((m) => { m.userData.hot = poem.id; pickables.push(m); });
    });
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x91e5f6, transparent: true, opacity: 0.55, depthWrite: false })); glow.scale.set(1.8, 1.8, 1); g.add(glow);
    const a = (i / D.poems.length) * Math.PI * 2 * 1.5, y = 2.2 + i * ((H - 9) / (D.poems.length - 1));
    g.position.set(Math.cos(a) * 1.9, y, Math.sin(a) * 1.9); g.scale.setScalar(0.65);
    add(g);
    floaters.push({ g, glow, a, y, ph: rand() * 6, hover: 0, id: poem.id, coverMat });
    hotspots.push({ id: poem.id, route: "poem/" + poem.id, label: poem.title, sub: poem.kind === "story" ? "story" : "poem", anchor: g.position, cursor: "read", visible: () => ctx.TR.progress() < 0.42 });
  });

  const dust = motes(small ? 120 : 260, [-R + 1, 0.2, -R + 1, R - 1, H - 1, R - 1], { size: 0.07, color: 0x91e5f6, opacity: 0.75 });
  add(dust.points);

  let hoverId = null, diveT = null;
  const look = new THREE.Vector3();
  return {
    scene, camera, hotspots, pickables, ready: Promise.resolve(),
    hover(id) { hoverId = id; },
    dive(id) {
      const fl = floaters.find((x) => x.id === id);
      return new Promise((res) => {
        diveT = { t0: performance.now(), from: camera.position.clone(), to: fl.g.position.clone(), res };
        setTimeout(() => { if (diveT) { const r = diveT.res; diveT = null; r(); } }, 1300);
      });
    },
    enter() { diveT = null; },
    update(dt, t, pr, ptr) {
      water.material.uniforms.uTime.value = t; winMat.uniforms.uTime.value = t; dome.material.uniforms.uTime.value = t;
      planets.forEach((pl) => { pl.piv.rotation.y += dt * pl.sp; });
      orrery.rotation.y += dt * 0.02; globe.rotation.y += dt * 0.3;
      floaters.forEach((fl) => {
        const target = hoverId === fl.id ? 1 : 0; fl.hover += (target - fl.hover) * Math.min(1, dt * 6);
        fl.a += dt * 0.05;
        fl.g.position.set(Math.cos(fl.a) * 1.9, fl.y + Math.sin(t * 0.8 + fl.ph) * 0.18, Math.sin(fl.a) * 1.9);
        fl.g.rotation.y = -fl.a + Math.sin(t + fl.ph) * 0.2; fl.g.rotation.x = 0.5 + Math.sin(t * 0.7 + fl.ph) * 0.1;
        const k = 0.65 * (1 + fl.hover * 0.4); fl.g.scale.set(k, k, k);
        fl.glow.material.opacity = 0.45 + fl.hover * 0.5; fl.coverMat.emissiveIntensity = 0.3 + fl.hover * 0.8;
      });
      if (diveT) {
        const k = Math.min(1, (performance.now() - diveT.t0) / 950), e2 = k * k * k;
        camera.position.lerpVectors(diveT.from, diveT.to, e2 * 0.92); camera.lookAt(diveT.to);
        if (k >= 1) { const r = diveT.res; diveT = null; r(); }
      } else {
        const y = 1.7 + pr * (H - 8), a = 0.9 + pr * Math.PI * 1.6 + ptr.x * 0.15;
        camera.position.set(Math.cos(a) * 5.2, y, Math.sin(a) * 5.2);
        look.set(0, y + 1.6 + ptr.y * 1.2 + (pr > 0.5 ? Math.pow((pr - 0.5) * 2, 1.5) * 14 : 0), 0);
        camera.lookAt(look);
      }
      dust.update(t);
    }
  };
}
