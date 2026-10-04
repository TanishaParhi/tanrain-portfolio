/* A poem's world — a full-screen living sky drawn by a shader, chosen per poem.
   The words themselves scroll over it in HTML. */
import * as THREE from "three";
import { NOISE } from "tr/shaders";

const HEAD = /* glsl */ `
uniform float uTime, uScroll, uVariant; uniform vec2 uRes, uMouse; varying vec2 vUv;
${NOISE}
vec3 stars(vec2 p, float dens){ vec2 g = floor(p*dens); float h = hash(g); vec2 f = fract(p*dens) - 0.5;
  float s = step(0.975, h) * smoothstep(0.08 + h*0.04, 0.0, length(f)) * (0.55 + 0.45*sin(uTime*2.0 + h*60.0)); return vec3(0.85,0.95,1.0)*s; }
`;

const WORLDS = {
  /* aurora over a mountain lake — Hiraeth (0) and Alpenglow (1) */
  aurora: /* glsl */ `
    void main(){
      vec2 uv = vUv; vec2 p = (uv - 0.5) * vec2(uRes.x/uRes.y, 1.0);
      float horizon = 0.34 + uScroll*0.04;
      bool lake = uv.y < horizon;
      vec2 q = lake ? vec2(uv.x, horizon*2.0 - uv.y + sin(uv.x*90.0 + uTime*2.0)*0.002*(horizon-uv.y)*40.0) : uv;
      vec3 col = mix(vec3(0.0,0.02,0.05), vec3(0.02,0.08,0.16), smoothstep(1.0, horizon, q.y));
      col += stars(q*vec2(uRes.x/uRes.y,1.0), 90.0) * smoothstep(horizon, 1.0, q.y);
      float t = uTime*0.06;
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        float wave = fbm(vec2(q.x*2.0 + fi*3.1 + t*(1.0+fi*0.3), t*0.5 + fi));
        float band = q.y - (0.62 + fi*0.06 + (wave-0.5)*0.45 + uMouse.y*0.03);
        float curtain = smoothstep(0.0, 0.03, band) * smoothstep(0.32 + uVariant*0.12, 0.0, band);
        float rays = 0.6 + 0.4*fbm(vec2(q.x*40.0 + fi*7.0, t*3.0));
        vec3 ac = mix(vec3(0.1,0.9,0.6), vec3(0.3,0.7,1.0), fract(fi*0.37 + wave*0.5));
        col += ac * curtain * rays * (0.38 + uVariant*0.35) * (1.0 - fi*0.15);
      }
      if (uVariant > 0.5) { float sh = smoothstep(0.004, 0.0, abs(q.y - 0.85 + (q.x - fract(uTime*0.11))*0.5)) * step(fract(uTime*0.11)-0.25, q.x) * step(q.x, fract(uTime*0.11)); col += vec3(0.9,0.97,1.0)*sh*0.9; }
      float m = 0.12 + fbm(vec2(q.x*3.0, 1.0))*0.1;
      float mount = smoothstep(horizon + m + 0.003, horizon + m, q.y) * step(horizon, q.y);
      col = mix(col, vec3(0.0,0.02,0.035), mount);
      if (lake) col *= vec3(0.55,0.7,0.8);
      float cabin = step(abs(uv.x - 0.78), 0.018) * step(horizon, uv.y) * step(uv.y, horizon + 0.03);
      float roof = step(uv.y, horizon + 0.03 + (0.022 - abs(uv.x-0.78))) * step(horizon + 0.03, uv.y) * step(abs(uv.x-0.78), 0.022);
      col = mix(col, vec3(0.0,0.01,0.02), max(cabin, roof));
      col += vec3(0.75,0.95,1.0) * step(abs(uv.x - 0.784), 0.003) * step(abs(uv.y - horizon - 0.014), 0.004) * (0.7 + 0.3*sin(uTime*3.0));
      gl_FragColor = vec4(col, 1.0);
    }`,

  /* sunlit ocean from below — Alexithymia */
  words: /* glsl */ `
    void main(){
      vec2 uv = vUv; vec2 p = (uv - 0.5) * vec2(uRes.x/uRes.y, 1.0);
      vec3 col = mix(vec3(0.0,0.02,0.05), vec3(0.04,0.22,0.36), pow(uv.y, 1.6));
      vec2 cp = p*3.0 + vec2(0.0, uTime*0.05);
      float c = 0.0; for (int i=0;i<3;i++){ float fi=float(i); c += pow(abs(sin(fbm(cp*(1.0+fi*0.6) + uTime*0.12*(fi+1.0))*6.2831)), 8.0); }
      col += vec3(0.4,0.8,1.0) * c * 0.12 * uv.y;
      float rays = fbm(vec2(p.x*3.0 + p.y*1.2, uTime*0.05)) * smoothstep(0.2, 1.0, uv.y);
      col += vec3(0.5,0.85,1.0) * pow(rays, 3.0) * 0.6;
      float sn = step(0.992, hash(floor(vec2(uv.x*160.0, uv.y*160.0 + uTime*4.0)))) * 0.5; col += vec3(0.8,0.95,1.0)*sn;
      col *= 1.0 - length(p)*0.5 - uScroll*0.35;
      gl_FragColor = vec4(col, 1.0);
    }`,

  /* polaroids developing in the dark — The Polaroid */
  polaroid: /* glsl */ `
    void main(){
      vec2 uv = vUv; float asp = uRes.x/uRes.y; vec2 p = uv*vec2(asp,1.0);
      vec3 col = vec3(0.0,0.01,0.02) + stars(p, 60.0)*0.5;
      vec2 cell = vec2(0.42, 0.5);
      vec2 g = floor(p/cell + vec2(0.0, uTime*0.015 + uScroll*0.8)); vec2 f = fract(p/cell + vec2(0.0, uTime*0.015 + uScroll*0.8));
      float h = hash(g);
      if (h > 0.45) {
        vec2 c = (f - 0.5) * vec2(1.0, 1.15) + vec2((h-0.5)*0.2, 0.0);
        float rot = (h - 0.7)*0.4; c = mat2(cos(rot),-sin(rot),sin(rot),cos(rot))*c;
        float outer = step(abs(c.x), 0.3) * step(abs(c.y), 0.34);
        float inner = step(abs(c.x), 0.26) * step(abs(c.y - 0.04), 0.25);
        float dev = smoothstep(0.0, 1.0, sin(uTime*0.25 + h*30.0)*0.5 + 0.5 + uScroll*0.6);
        vec3 photo = mix(vec3(0.0,0.03,0.07), vec3(0.06,0.18,0.3), dev) + stars((c+g)*1.7, 30.0)*dev*1.6;
        photo += vec3(0.3,0.7,1.0) * smoothstep(0.25, 0.0, length(c - vec2(0.05,0.08))) * dev * 0.25;
        col = mix(col, vec3(0.85,0.9,0.92)*0.75, outer);
        col = mix(col, photo, inner);
      }
      gl_FragColor = vec4(col, 1.0);
    }`,

  /* a turning kaleidoscope of glass — Kaleidoscope */
  kaleido: /* glsl */ `
    void main(){
      vec2 p = (vUv - 0.5) * vec2(uRes.x/uRes.y, 1.0);
      float r = length(p), a = atan(p.y, p.x) + uTime*0.04 + uScroll*1.5;
      float seg = 6.2831/8.0; a = mod(a, seg); a = abs(a - seg*0.5);
      vec2 q = vec2(cos(a), sin(a)) * r;
      float n = fbm(q*4.0 + uTime*0.08);
      float n2 = fbm(q*9.0 - uTime*0.05 + n*2.0);
      vec3 col = mix(vec3(0.02,0.08,0.16), vec3(0.08,0.4,0.55), n);
      col = mix(col, vec3(0.1,0.6,0.45), smoothstep(0.55, 0.75, n2));
      col += vec3(0.85,0.95,1.0) * smoothstep(0.46, 0.5, abs(fract(n2*5.0) - 0.5)) * 0.5;
      col *= smoothstep(0.95, 0.15, r) * 1.2;
      col += vec3(0.6,0.9,1.0) * pow(max(0.0, 1.0 - r*3.0), 3.0) * 0.4;
      gl_FragColor = vec4(col, 1.0);
    }`,

  /* the deep sea with god rays — The Perks of Our Society */
  abyss: /* glsl */ `
    void main(){
      vec2 uv = vUv; vec2 p = (uv - 0.5) * vec2(uRes.x/uRes.y, 1.0);
      float depth = uScroll;
      vec3 col = mix(vec3(0.0,0.01,0.025), vec3(0.03,0.15,0.22)*(1.0-depth*0.7), pow(uv.y, 2.2));
      float rays = 0.0; for (int i=0;i<5;i++){ float fi = float(i); float x = p.x*1.2 + p.y*0.35 + fi*0.21 - 0.4; rays += smoothstep(0.06, 0.0, abs(fract(x + sin(uTime*0.1+fi)*0.05) - 0.5) - 0.01*fi) * fbm(vec2(fi, uTime*0.1)); }
      col += vec3(0.4,0.8,0.9) * rays * 0.18 * smoothstep(0.1, 1.0, uv.y) * (1.0 - depth*0.6);
      float sn = 0.0; for (int k=0;k<2;k++){ float fk=float(k); vec2 g = vec2(uv.x*(90.0+fk*60.0), uv.y*(90.0+fk*60.0) + uTime*(1.5+fk)); sn += step(0.985, hash(floor(g))) * smoothstep(0.5, 0.0, length(fract(g)-0.5)); }
      col += vec3(0.7,0.9,0.95) * sn * 0.35;
      float shape = smoothstep(0.02, 0.0, length((p - vec2(sin(uTime*0.05)*0.6, -0.25))*vec2(1.0, 2.6)) - 0.12);
      col = mix(col, vec3(0.0,0.01,0.02), shape*0.6);
      col *= 1.0 - length(p)*0.55;
      gl_FragColor = vec4(col, 1.0);
    }`,

  /* a dawn that rises as you read — The Dawn */
  dawn: /* glsl */ `
    void main(){
      vec2 uv = vUv; vec2 p = (uv - 0.5) * vec2(uRes.x/uRes.y, 1.0);
      float s = uScroll;
      vec3 top = mix(vec3(0.0,0.02,0.06), vec3(0.2,0.45,0.75), s);
      vec3 bot = mix(vec3(0.02,0.08,0.16), vec3(0.85,0.93,0.98), s);
      vec3 col = mix(bot, top, smoothstep(0.1, 0.95, uv.y));
      col += stars(p, 80.0) * (1.0 - s) * smoothstep(0.3, 1.0, uv.y);
      vec2 sunp = vec2(0.0, -0.45 + s*0.7);
      float d = length(p - sunp);
      col += vec3(0.95,0.98,1.0) * smoothstep(0.09, 0.07, d) * s;
      col += vec3(0.6,0.85,1.0) * exp(-d*5.0) * 0.6 * s;
      float cl = fbm(vec2(p.x*2.0 + uTime*0.01, p.y*6.0)) * smoothstep(0.2, 0.55, uv.y) * smoothstep(0.85, 0.5, uv.y);
      col = mix(col, mix(vec3(0.1,0.2,0.35), vec3(0.95,0.97,1.0), s), smoothstep(0.5, 0.8, cl)*0.55);
      float ground = smoothstep(0.22 + fbm(vec2(uv.x*4.0, 2.0))*0.06, 0.2, uv.y);
      col = mix(col, mix(vec3(0.0,0.02,0.03), vec3(0.05,0.2,0.18), s), ground);
      gl_FragColor = vec4(col, 1.0);
    }`,

  /* sound rippling across water — Nocturne Notes */
  waves: /* glsl */ `
    void main(){
      vec2 uv = vUv; vec2 p = (uv - 0.5) * vec2(uRes.x/uRes.y, 1.0);
      vec3 col = vec3(0.0,0.015,0.035);
      float rings = 0.0;
      for (int i=0;i<5;i++){ float fi=float(i); vec2 c = vec2(sin(fi*2.3)*0.6, cos(fi*1.7)*0.32); float d = length(p - c);
        float w = sin(d*42.0 - uTime*(2.0+fi*0.3) - fi) * exp(-d*2.2); rings += smoothstep(0.92, 1.0, w); }
      col += vec3(0.3,0.75,1.0) * rings * 0.5;
      col += vec3(0.1,0.7,0.55) * smoothstep(0.96, 1.0, sin(p.y*120.0 + sin(p.x*8.0 + uTime)*3.0)) * 0.12 * (0.5 + 0.5*sin(uTime*0.7));
      float eq = 0.0; float x = floor(uv.x*64.0); float hgt = 0.04 + 0.1*pow(abs(sin(uTime*2.0 + x*0.7) * noise(vec2(x, uTime*1.5))), 0.8);
      eq = step(uv.y, hgt) * step(0.2, fract(uv.x*64.0));
      col += vec3(0.5,0.9,1.0) * eq * 0.35;
      col += stars(p, 70.0) * 0.4;
      gl_FragColor = vec4(col, 1.0);
    }`,

  /* a nebula with neon being woven — The Neon Weaver's Quest */
  nebula: /* glsl */ `
    void main(){
      vec2 uv = vUv; vec2 p = (uv - 0.5) * vec2(uRes.x/uRes.y, 1.0);
      float n = fbm(p*2.2 + vec2(uTime*0.02, 0.0) + fbm(p*3.0 - uTime*0.03));
      vec3 col = mix(vec3(0.0,0.01,0.03), vec3(0.04,0.14,0.3), n);
      col = mix(col, vec3(0.05,0.35,0.35), smoothstep(0.55, 0.85, n)*0.7);
      col += stars(p, 110.0);
      float t = uTime*0.35 + uScroll*4.0;
      float line = 0.0;
      for (int i=0;i<60;i++){ float fi = float(i)/60.0; float tt = t - fi*2.5;
        vec2 q = vec2(sin(tt*1.3)*0.55*(uRes.x/uRes.y), sin(tt*1.7 + 1.0)*0.35);
        line += smoothstep(0.012, 0.0, length(p - q)) * (1.0 - fi); }
      col += vec3(0.55,0.95,1.0) * line * 0.6;
      col += vec3(0.4,1.0,0.8) * smoothstep(0.03, 0.0, abs(length(p - vec2(0.0, 0.05)) - 0.32 - sin(uTime)*0.01)) * 0.35;
      gl_FragColor = vec4(col, 1.0);
    }`
};

export function create(ctx, { id }) {
  const { D } = ctx;
  let world = D.worlds[id] || "aurora";
  let variant = 0;
  if (world === "aurora2") { world = "aurora"; variant = 1; }
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  camera.aspect = 1; camera.updateProjectionMatrix = function () { THREE.OrthographicCamera.prototype.updateProjectionMatrix.call(this); };
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScroll: { value: 0 }, uVariant: { value: variant }, uRes: { value: new THREE.Vector2(ctx.vw(), ctx.vh()) }, uMouse: { value: new THREE.Vector2() } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: HEAD + WORLDS[world], /* colours are authored as screen colours — no second conversion */
    depthWrite: false, depthTest: false
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  scene.add(quad);
  return {
    scene, camera, hotspots: [], pickables: [], ready: Promise.resolve(),
    resize(w, h) { mat.uniforms.uRes.value.set(w, h); },
    update(dt, t, p, look) {
      mat.uniforms.uTime.value = t;
      mat.uniforms.uScroll.value = p;
      mat.uniforms.uMouse.value.set(look.x, look.y);
    },
    dispose() { quad.geometry.dispose(); mat.dispose(); }
  };
}
