/* A quiet sea behind the lab and the about page — black glass water, a moon, drifting light. */
import * as THREE from "three";
import { waterMaterial, skyDome, motes, glowTexture } from "tr/shaders";

export function create(ctx, { name }) {
  const { small } = ctx;
  const lab = name === "lab";
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02060b);
  scene.fog = new THREE.Fog(0x02060b, 10, 60);
  const camera = new THREE.PerspectiveCamera(45, ctx.aspect(), 0.1, 200);
  const sky = skyDome({ top: 0x02060b, bottom: lab ? 0x041512 : 0x0a1a2a, band: lab ? 0x0e3b36 : 0x133c55 });
  scene.add(sky);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), waterMaterial({ fogNear: 8, fogFar: 70, sun: [0, 0.22, -1], sky: lab ? 0x1d6b5f : 0x386fa4, shallow: lab ? 0x0e3b36 : 0x0b2a3d }));
  water.rotation.x = -Math.PI / 2; scene.add(water);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(3, 48), new THREE.MeshBasicMaterial({ color: 0xeef6fa, fog: false }));
  moon.position.set(38, 16, -90); scene.add(moon);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x84d2f6, transparent: true, opacity: 0.4, depthWrite: false, fog: false }));
  halo.scale.set(40, 40, 1); halo.position.copy(moon.position); scene.add(halo);
  const glints = motes(small ? 80 : 160, [-20, 0.3, -40, 20, 8, 4], { size: 0.12, color: lab ? 0x6fd3b8 : 0x91e5f6, opacity: 0.7 });
  scene.add(glints.points);
  return {
    scene, camera, hotspots: [], pickables: [], ready: Promise.resolve(),
    update(dt, t, p, look) {
      water.material.uniforms.uTime.value = t; sky.material.uniforms.uTime.value = t;
      camera.position.set(look.x * 0.8, 1.6 + p * 5 + look.y * 0.3, 6 - p * 10);
      camera.lookAt(look.x * 3, 2 + p * 3 + look.y, -40);
      glints.update(t);
    },
    dispose() {}
  };
}
