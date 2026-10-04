/* Shared materials: glassy black water, swirling portals, starry skies. */
import * as THREE from "three";

export const PALETTE = {
  black: 0x02060b, ink: 0x050d17, abyss: 0x0a1a2a, tarawera: 0x133c55, matisse: 0x386fa4,
  picton: 0x59a5d8, seagull: 0x84d2f6, spray: 0x91e5f6, white: 0xeef6fa,
  sea: 0x0e3b36, kelp: 0x1d6b5f, mint: 0x6fd3b8
};
const C = (hex) => new THREE.Color(hex);

export const NOISE = /* glsl */ `
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 m = mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<5;i++){ v += a*noise(p); p = m*p; a *= 0.5; } return v; }
`;

/* ---------- water: black glass with white glints ---------- */
export function waterMaterial(o = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: o.depthWrite ?? true,
    side: o.side ?? THREE.FrontSide,
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: C(o.deep ?? 0x02080f) },
      uShallow: { value: C(o.shallow ?? 0x0b2a3d) },
      uSky: { value: C(o.sky ?? 0x386fa4) },
      uHorizon: { value: C(o.horizon ?? 0x0a1a2a) },
      uGlint: { value: C(o.glint ?? 0xeef6fa) },
      uSun: { value: new THREE.Vector3(...(o.sun ?? [0.3, 0.55, -1])).normalize() },
      uFog: { value: C(o.fog ?? 0x02060b) },
      uFogNear: { value: o.fogNear ?? 12 },
      uFogFar: { value: o.fogFar ?? 45 },
      uScale: { value: o.scale ?? 1 },
      uOpacity: { value: o.opacity ?? 1 },
      uUnder: { value: C(o.under ?? 0x2b6f8f) }
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uFogNear, uFogFar, uScale, uOpacity;
      uniform vec3 uDeep, uShallow, uSky, uHorizon, uGlint, uSun, uFog, uUnder;
      varying vec3 vWorld;
      ${NOISE}
      vec2 wv(vec2 p, vec2 d, float f, float a, float s){ float ph = dot(p, d)*f + uTime*s; return d*(cos(ph)*a*f); }
      void main(){
        vec2 p = vWorld.xz * uScale;
        vec2 g = wv(p, normalize(vec2(1.0, 0.3)), 1.1, 0.10, 0.9)
               + wv(p, normalize(vec2(-0.45, 1.0)), 1.9, 0.07, 1.3)
               + wv(p, normalize(vec2(0.7, -0.9)), 3.3, 0.045, 1.9)
               + wv(p, normalize(vec2(-1.0, -0.25)), 5.9, 0.025, 2.6)
               + wv(p, normalize(vec2(0.2, 1.0)), 9.7, 0.012, 3.4);
        float n1 = fbm(p*2.2 + uTime*0.15);
        g += (vec2(n1, fbm(p*2.2 - uTime*0.12 + 7.0)) - 0.5) * 0.35;
        vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
        vec3 v = normalize(cameraPosition - vWorld);
        if (!gl_FrontFacing) { n = -n; }
        float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 4.0);
        vec3 r = reflect(-v, n);
        vec3 sky = mix(uHorizon, uSky, clamp(r.y * 1.4, 0.0, 1.0));
        vec3 col = mix(uDeep, uShallow, clamp(0.35 + n.x * 1.8 + n.z * 0.8, 0.0, 1.0));
        col = mix(col, sky, clamp(0.08 + fres * 0.9, 0.0, 1.0));
        float spec = pow(max(dot(r, uSun), 0.0), 360.0);
        float ridge = 1.0 - abs(fbm(p*3.2 + g*2.5 + uTime*0.25)*2.0 - 1.0);
        float edge = smoothstep(0.93, 0.995, ridge);
        col += uGlint * (spec * 1.3 + edge * (0.05 + fres * 0.32) + pow(max(n.x+n.z,0.0),4.0)*0.08);
        if (!gl_FrontFacing) { col = mix(uUnder, uGlint, spec*2.0 + edge*0.4) * 0.8; }
        float d = length(cameraPosition - vWorld);
        float fog = smoothstep(uFogNear, uFogFar, d);
        gl_FragColor = vec4(mix(col, uFog, fog), uOpacity * (1.0 - fog * 0.98));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
}

/* ---------- portal: a swirling disc with a bright rim ---------- */
export function portalMaterial(o = {}) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    uniforms: {
      uTime: { value: Math.random() * 10 },
      uHover: { value: 0 },
      uA: { value: C(o.a ?? 0x050d17) },
      uB: { value: C(o.b ?? 0x386fa4) },
      uC: { value: C(o.c ?? 0x91e5f6) },
      uShape: { value: o.rect ? 1 : 0 }
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uHover, uShape; uniform vec3 uA, uB, uC; varying vec2 vUv;
      ${NOISE}
      void main(){
        vec2 p = vUv*2.0 - 1.0;
        float r = uShape > 0.5 ? max(abs(p.x), abs(p.y)) : length(p);
        float a = atan(p.y, p.x);
        float t = uTime * (0.35 + uHover*0.5);
        float sw = fbm(vec2(a*1.6 + r*3.5 - t*1.4, r*3.0 - t));
        float sw2 = fbm(vec2(a*3.0 - r*5.0 + t, r*6.0 + t*0.7) + sw);
        vec3 col = mix(uA, uB, smoothstep(0.25, 0.75, sw));
        col = mix(col, uC, smoothstep(0.62, 0.95, sw2) * (0.6 + 0.4*r));
        float rim = smoothstep(0.80, 0.98, r) * smoothstep(1.0, 0.97, r);
        float core = smoothstep(0.55, 0.0, r);
        col += uC * rim * (2.2 + uHover*2.0);
        col += uC * core * 0.25 * (1.0 + uHover);
        float alpha = smoothstep(1.0, 0.96, r) * (0.82 + 0.18*uHover);
        gl_FragColor = vec4(col * (1.0 + uHover*0.4), alpha);
        #include <colorspace_fragment>
      }`
  });
}

/* ---------- a gradient sky dome with stars ---------- */
export function skyDome(o = {}) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: {
      uTop: { value: C(o.top ?? 0x02060b) }, uBottom: { value: C(o.bottom ?? 0x0a1a2a) },
      uStars: { value: o.stars ?? 1 }, uTime: { value: 0 }, uBand: { value: C(o.band ?? 0x133c55) }
    },
    vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop, uBottom, uBand; uniform float uStars, uTime; varying vec3 vDir;
      ${NOISE}
      void main(){
        float h = clamp(vDir.y*0.5+0.5, 0.0, 1.0);
        vec3 col = mix(uBottom, uTop, smoothstep(0.35, 0.95, h));
        vec2 sp = vec2(atan(vDir.z, vDir.x)*60.0, vDir.y*60.0);
        float s = hash(floor(sp)); float tw = 0.6 + 0.4*sin(uTime*2.0 + s*40.0);
        float star = step(0.985, s) * smoothstep(0.5, 0.0, length(fract(sp)-0.5)) * tw * smoothstep(0.42, 0.6, h);
        float band = fbm(vec2(atan(vDir.z, vDir.x)*2.0, vDir.y*6.0 + 1.0)) * smoothstep(0.25, 0.0, abs(vDir.y - 0.35 + 0.15*sin(atan(vDir.z,vDir.x))));
        col += uBand * band * 0.6 * uStars;
        col += vec3(0.85, 0.95, 1.0) * star * uStars;
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(o.radius ?? 90, 32, 16), m);
  mesh.renderOrder = -10;
  return mesh;
}

/* ---------- soft glowing dot texture for particles / sprites ---------- */
let _dot;
export function glowTexture() {
  if (_dot) return _dot;
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,.75)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  _dot = new THREE.CanvasTexture(c);
  return _dot;
}

/* drifting motes — returns { points, update(t) } */
export function motes(n, box, o = {}) {
  const pos = new Float32Array(n * 3), base = [];
  for (let i = 0; i < n; i++) {
    const p = [box[0] + Math.random() * (box[3] - box[0]), box[1] + Math.random() * (box[4] - box[1]), box[2] + Math.random() * (box[5] - box[2])];
    base.push({ p, ph: Math.random() * 10, s: 0.2 + Math.random() * 0.6 });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ size: o.size ?? 0.06, map: glowTexture(), color: o.color ?? PALETTE.spray, transparent: true, opacity: o.opacity ?? 0.8, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const points = new THREE.Points(geo, mat);
  const rise = o.rise ?? 0, H = box[4] - box[1];
  return {
    points,
    update(t) {
      for (let i = 0; i < n; i++) {
        const b = base[i];
        pos[i * 3] = b.p[0] + Math.sin(t * b.s + b.ph) * 0.3;
        let y = b.p[1] + Math.sin(t * b.s * 1.3 + b.ph * 2) * 0.2 + (rise ? ((t * rise * b.s) % H) : 0);
        if (rise && y > box[4]) y -= H;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = b.p[2] + Math.cos(t * b.s + b.ph) * 0.3;
      }
      geo.attributes.position.needsUpdate = true;
    }
  };
}

/* a soft additive light shaft */
export function lightShaft(w, h, color = PALETTE.seagull, opacity = 0.12) {
  const c = document.createElement("canvas"); c.width = 64; c.height = 256;
  const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
  const side = g.createLinearGradient(0, 0, 64, 0);
  side.addColorStop(0, "rgba(0,0,0,1)"); side.addColorStop(0.5, "rgba(0,0,0,0)"); side.addColorStop(1, "rgba(0,0,0,1)");
  g.globalCompositeOperation = "destination-out"; g.fillStyle = side; g.fillRect(0, 0, 64, 256);
  const m = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}

/* a flat glow that stays parallel to its frame (sprites cut in front of frames seen at an angle) */
export function glowPlane(w, h, color = PALETTE.picton, opacity = 0.25) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: glowTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
}
