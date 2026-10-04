/* The screening hall — seven screens floating over black water. Each is a door into a film. */
import * as THREE from "three";
import { waterMaterial, skyDome, motes, glowTexture, portalMaterial, glowPlane } from "tr/shaders";

export function create(ctx) {
  const { tex, D, small } = ctx;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02060b);
  scene.fog = new THREE.Fog(0x02060b, 14, 46);
  const camera = new THREE.PerspectiveCamera(42, ctx.aspect(), 0.1, 200);

  const sky = skyDome({ top: 0x02060b, bottom: 0x071827, band: 0x0e3b36 });
  scene.add(sky);
  const water = new THREE.Mesh(new THREE.CircleGeometry(80, 96), waterMaterial({ fogNear: 10, fogFar: 44, scale: 0.8, sun: [0, 0.3, -1] }));
  water.rotation.x = -Math.PI / 2; scene.add(water);

  const films = D.films, R = 14, screens = [], hotspots = [], pickables = [];
  const span = THREE.MathUtils.degToRad(small ? 130 : 124);
  const fade = (() => { const c = document.createElement("canvas"); c.width = 4; c.height = 128; const g = c.getContext("2d"); const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, "#fff"); gr.addColorStop(1, "#000"); g.fillStyle = gr; g.fillRect(0, 0, 4, 128); return new THREE.CanvasTexture(c); })();

  const loads = films.map((f, i) => {
    const a = -span / 2 + (span * i) / (films.length - 1);
    const g = new THREE.Group();
    g.position.set(Math.sin(a) * R, 2.6, -Math.cos(a) * R);
    g.lookAt(0, 2.6, 0);
    const W = 3.5, H = W * 9 / 16;
    const mat = new THREE.MeshBasicMaterial({ color: 0x223344, toneMapped: false });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat);
    screen.userData.hot = f.id; pickables.push(screen);
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.18, H + 0.18), portalMaterial({ rect: true, a: 0x02060b, b: 0x133c55, c: 0x91e5f6 }));
    frame.position.z = -0.05;
    const reflMat = new THREE.MeshBasicMaterial({ color: 0x8fb5cc, transparent: true, opacity: 0.22, alphaMap: fade, toneMapped: false, depthWrite: false });
    const refl = new THREE.Mesh(new THREE.PlaneGeometry(W, H), reflMat);
    refl.scale.y = -1; refl.position.y = -2.6 * 2 + 0.02;
    const glow = glowPlane(W * 2.2, H * 2.6, 0x386fa4, 0.25);
    glow.position.z = -0.12;
    g.add(glow, frame, screen, refl);
    scene.add(g);
    screens.push({ g, screen, frame, refl, glow, base: g.position.clone(), ph: i * 0.9, hover: 0, id: f.id, scale: 1 });
    hotspots.push({ id: f.id, route: "film/" + f.id, label: f.title, sub: f.year, anchor: g.position.clone().add(new THREE.Vector3(0, H / 2 + 0.55, 0)), cursor: "enter", visible: () => ctx.TR.progress() < 0.12 });
    return tex("assets/films/" + f.id + "/01.webp").then((t) => { if (t) { mat.map = t; mat.color.set(0xffffff); reflMat.map = t; mat.needsUpdate = reflMat.needsUpdate = true; } });
  });

  const dust = motes(small ? 60 : 120, [-14, 0.2, -14, 14, 6, 6], { size: 0.035, color: 0x91e5f6, opacity: 0.55 });
  scene.add(dust.points);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xbfe8ff, transparent: true, opacity: 0.5, depthWrite: false, fog: false }));
  moon.scale.set(30, 30, 1); moon.position.set(0, 18, -60); scene.add(moon);

  let hoverId = null, yaw = 0, diveT = null;
  const camPos = new THREE.Vector3(0, 2.1, 4.5), lookAt = new THREE.Vector3();
  return {
    scene, camera, hotspots, pickables, ready: Promise.all(loads),
    hover(id) { hoverId = id; },
    dive(id) {
      const s = screens.find((x) => x.id === id);
      return new Promise((res) => {
        diveT = { t0: performance.now(), from: camera.position.clone(), to: s.g.position.clone().multiplyScalar(0.92), look: s.g.position.clone(), res };
        setTimeout(() => { if (diveT) { const r = diveT.res; diveT = null; r(); } }, 1400);
      });
    },
    enter() { diveT = null; yaw = 0; },
    update(dt, t, p, look) {
      water.material.uniforms.uTime.value = t; sky.material.uniforms.uTime.value = t;
      screens.forEach((s) => {
        const target = hoverId === s.id ? 1 : 0;
        s.hover += (target - s.hover) * Math.min(1, dt * 6);
        s.g.position.y = s.base.y + Math.sin(t * 0.7 + s.ph) * 0.08;
        const k = 1 + s.hover * 0.06; s.g.scale.set(k, k, k);
        s.frame.material.uniforms.uTime.value = t + s.ph;
        s.frame.material.uniforms.uHover.value = s.hover;
        s.glow.material.opacity = 0.2 + s.hover * 0.35;
      });
      if (diveT) {
        const k = Math.min(1, (performance.now() - diveT.t0) / 1000), e = k * k * k;
        camera.position.lerpVectors(diveT.from, diveT.to, e);
        camera.lookAt(diveT.look);
        if (k >= 1) { const r = diveT.res; diveT = null; r(); }
      } else {
        const targetYaw = THREE.MathUtils.lerp(-span / 2 * 0.85, span / 2 * 0.85, Math.min(1, p * 1.6)) + look.x * 0.12;
        yaw += (targetYaw - yaw) * Math.min(1, dt * 3);
        camera.position.copy(camPos).add(new THREE.Vector3(look.x * 0.4, look.y * 0.25, 0));
        lookAt.set(Math.sin(yaw) * R, 1.15 + look.y * 0.4, -Math.cos(yaw) * R);
        camera.lookAt(lookAt);
      }
      dust.update(t);
    },
    dispose() {}
  };
}
