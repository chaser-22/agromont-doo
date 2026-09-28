"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "./brand";

const vertexShader = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;
uniform float uScroll;

#define MAX_STEPS 52
#define MAX_DIST 18.0
#define SURF_DIST 0.0022

mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdCappedCylinder(vec3 p, vec2 h) {
  vec2 d = abs(vec2(length(p.xz), p.y)) - h;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

float sdEllipsoid(vec3 p, vec3 r) {
  float k0 = length(p / r);
  float k1 = length(p / (r * r));
  return k0 * (k0 - 1.0) / max(k1, 0.0001);
}

vec2 opUnion(vec2 a, vec2 b) {
  return a.x < b.x ? a : b;
}

vec2 mapScene(vec3 p) {
  p.xz *= rot(-0.08 - uScroll * 0.18);
  vec2 res = vec2(100.0, 0.0);

  float ground = p.y + 1.44;
  res = opUnion(res, vec2(ground, 4.0));

  vec3 core = p - vec3(0.48, -0.05, 0.28);
  core.xz *= rot(0.18 + uTime * 0.055);
  core.xy *= rot(-0.09 + uPointer.x * 0.035);
  float seed = sdEllipsoid(core, vec3(0.86, 1.15, 0.84));
  res = opUnion(res, vec2(seed, 1.0));

  vec3 ringA = core;
  ringA.yz *= rot(1.05 + uScroll * 0.25);
  float ring = sdTorus(ringA, vec2(1.48, 0.042));
  res = opUnion(res, vec2(ring, 2.0));

  vec3 ringB = core;
  ringB.xy *= rot(0.88 - uScroll * 0.18);
  ringB.yz *= rot(0.34);
  float ring2 = sdTorus(ringB, vec2(1.70, 0.018));
  res = opUnion(res, vec2(ring2, 5.0));

  for (int i = 0; i < 3; i++) {
    float fi = float(i) - 1.0;
    vec3 sp = p - vec3(fi * 1.42 - 0.15, -0.54, -2.02 - abs(fi) * 0.18);
    float cyl = sdCappedCylinder(sp, vec2(0.46, 0.88 + 0.10 * (1.0 - abs(fi))));
    vec3 capP = sp - vec3(0.0, 0.86 + 0.10 * (1.0 - abs(fi)), 0.0);
    float cap = sdEllipsoid(capP, vec3(0.47, 0.24, 0.47));
    res = opUnion(res, vec2(min(cyl, cap), 3.0));
  }

  vec3 beam = p - vec3(0.05, -0.72, -1.28);
  beam.xy *= rot(-0.18);
  float conveyor = sdBox(beam, vec3(2.18, 0.065, 0.095));
  res = opUnion(res, vec2(conveyor, 3.0));

  return res;
}

vec3 getNormal(vec3 p) {
  vec2 e = vec2(0.0025, 0.0);
  float d = mapScene(p).x;
  return normalize(vec3(
    d - mapScene(p - e.xyy).x,
    d - mapScene(p - e.yxy).x,
    d - mapScene(p - e.yyx).x
  ));
}

vec2 rayMarch(vec3 ro, vec3 rd) {
  float dO = 0.0;
  float material = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * dO;
    vec2 hit = mapScene(p);
    dO += hit.x;
    material = hit.y;
    if (abs(hit.x) < SURF_DIST || dO > MAX_DIST) break;
  }
  return vec2(dO, material);
}

vec3 materialColor(float id) {
  if (id < 1.5) return vec3(0.94, 0.49, 0.08);
  if (id < 2.5) return vec3(0.095, 0.115, 0.09);
  if (id < 3.5) return vec3(0.11, 0.25, 0.15);
  if (id < 4.5) return vec3(0.055, 0.067, 0.052);
  return vec3(0.80, 0.58, 0.22);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag * 2.0 - uResolution.xy) / max(uResolution.y, 1.0);
  vec2 suv = frag / max(uResolution, vec2(1.0));

  vec3 bgTop = vec3(0.018, 0.032, 0.023);
  vec3 bgBottom = vec3(0.055, 0.080, 0.054);
  vec3 color = mix(bgBottom, bgTop, smoothstep(0.0, 1.0, suv.y));

  float amberGlow = exp(-2.9 * length(uv - vec2(0.28, 0.04)));
  color += vec3(0.25, 0.105, 0.012) * amberGlow;

  vec3 ro = vec3(0.28 + uPointer.x * 0.26, 0.18 + uPointer.y * 0.12, 4.75 - uScroll * 0.42);
  vec3 ta = vec3(0.30, -0.20 + uScroll * 0.08, -0.18);
  vec3 ww = normalize(ta - ro);
  vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
  vec3 vv = cross(uu, ww);
  vec3 rd = normalize(ww * 1.72 + uu * uv.x + vv * uv.y);

  vec2 rm = rayMarch(ro, rd);
  float dist = rm.x;
  float matId = rm.y;

  if (dist < MAX_DIST) {
    vec3 p = ro + rd * dist;
    vec3 n = getNormal(p);
    vec3 base = materialColor(matId);

    vec3 keyDir = normalize(vec3(-0.62, 0.88, 0.72));
    vec3 rimDir = normalize(vec3(0.72, 0.35, -0.62));
    float diff = max(dot(n, keyDir), 0.0);
    float rim = pow(1.0 - max(dot(n, -rd), 0.0), 2.6);
    float spec = pow(max(dot(reflect(-keyDir, n), -rd), 0.0), 38.0);
    float secondary = max(dot(n, rimDir), 0.0) * 0.25;

    color = base * (0.24 + diff * 0.88 + secondary);
    color += vec3(1.0, 0.62, 0.22) * spec * (matId < 2.5 ? 0.48 : 0.17);
    color += vec3(0.30, 0.44, 0.30) * rim * 0.32;

    if (matId > 3.5 && matId < 4.5) {
      vec2 gridCell = fract(p.xz * 0.72);
      vec2 gridEdge = min(gridCell, 1.0 - gridCell);
      float grid = 1.0 - smoothstep(0.012, 0.034, min(gridEdge.x, gridEdge.y));
      color += vec3(0.31, 0.46, 0.27) * grid * 0.16;
    }

    float fog = 1.0 - exp(-0.035 * dist * dist);
    color = mix(color, bgTop, fog);
  }

  vec2 dustUv = vec2(suv.x * (uResolution.x / max(uResolution.y, 1.0)), suv.y + uTime * 0.009);
  vec2 dustCell = floor(dustUv * vec2(68.0, 50.0));
  float dustHash = hash21(dustCell);
  vec2 local = fract(dustUv * vec2(68.0, 50.0)) - 0.5;
  float dust = smoothstep(0.07, 0.0, length(local)) * step(0.965, dustHash);
  color += vec3(0.96, 0.64, 0.24) * dust * 0.36;

  float vignette = smoothstep(1.45, 0.22, length(uv * vec2(0.72, 0.86)));
  color *= 0.70 + 0.30 * vignette;
  float grain = hash21(frag + fract(uTime) * 73.0) - 0.5;
  color += grain * 0.012;
  color = pow(max(color, 0.0), vec3(0.4545));

  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function IndustrialHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    const vs = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );

    const position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(program, "uResolution");
    const pointerLocation = gl.getUniformLocation(program, "uPointer");
    const timeLocation = gl.getUniformLocation(program, "uTime");
    const scrollLocation = gl.getUniformLocation(program, "uScroll");

    let active = true;
    let pageVisible = !document.hidden;
    let frame = 0;
    let width = 0;
    let height = 0;
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    const start = performance.now();
    let markedReady = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const mobile = window.innerWidth < 760;
      const quality = mobile ? 0.62 : 0.82;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.35) * quality;
      const nextWidth = Math.max(2, Math.min(1600, Math.round(rect.width * dpr)));
      const nextHeight = Math.max(2, Math.min(1100, Math.round(rect.height * dpr)));
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth;
      height = nextHeight;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(resolutionLocation, width, height);
    };

    const render = (now: number) => {
      frame = 0;
      if (!active || !pageVisible) return;
      resize();
      pointerX += (targetX - pointerX) * 0.055;
      pointerY += (targetY - pointerY) * 0.055;
      const scroll = Math.min(Math.max(window.scrollY / Math.max(window.innerHeight, 1), 0), 1.25);
      gl.uniform2f(pointerLocation, pointerX, pointerY);
      gl.uniform1f(timeLocation, reducedMotion ? 0.0 : (now - start) / 1000);
      gl.uniform1f(scrollLocation, reducedMotion ? 0.16 : scroll);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!markedReady) {
        markedReady = true;
        setReady(true);
      }
      if (!reducedMotion) frame = requestAnimationFrame(render);
    };

    const ensureFrame = () => {
      if (!frame && active && pageVisible) frame = requestAnimationFrame(render);
    };

    const onPointerMove = (event: PointerEvent) => {
      targetX = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
      targetY = -(event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
      if (reducedMotion) ensureFrame();
    };

    const onVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible) ensureFrame();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting;
        if (active) ensureFrame();
        else if (frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      },
      { rootMargin: "180px" },
    );
    observer.observe(canvas);

    const resizeObserver = new ResizeObserver(() => ensureFrame());
    resizeObserver.observe(canvas);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", ensureFrame, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    ensureFrame();

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", ensureFrame);
      document.removeEventListener("visibilitychange", onVisibility);
      if (frame) cancelAnimationFrame(frame);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <Image
        className="hero-fallback"
        src="/images/agromont-hero.png"
        alt="Ilustrativni prikaz savremene poljoprivredne proizvodnje, silosa i distribucije u Crnoj Gori"
        fill
        priority
        sizes="100vw"
      />
      <canvas
        ref={canvasRef}
        className={`hero-webgl ${ready ? "is-ready" : ""}`}
        aria-hidden="true"
      />
      <div className="hero-noise" aria-hidden="true" />
      <div className="hero-grid" aria-hidden="true" />

      <div className="hero-content" id="sadrzaj">
        <div className="hero-kicker reveal">
          <span className="pulse-dot" />
          Domaća proizvodnja · Crna Gora
        </div>
        <h1 id="hero-title" className="reveal">
          Hranimo ono
          <br />
          što <em>raste.</em>
        </h1>
        <div className="hero-bottom reveal">
          <p>
            Proizvodnja jaja i stočne hrane, poljoprivredni program i centri koji povezuju pouzdan proizvod sa pravim savjetom.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#proizvodi">
              Istraži program <Arrow />
            </a>
            <a className="text-link" href="#proizvodnja">
              Kako radimo <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </div>

      <div className="hero-tech" aria-hidden="true">
        <span>AGM / PRODUCTION SYSTEM</span>
        <span>SEED · FEED · FARM · SUPPLY</span>
      </div>
      <div className="hero-index" aria-hidden="true">
        <span>42°26&apos;N</span>
        <span>019°15&apos;E</span>
      </div>
      <div className="hero-scroll" aria-hidden="true">
        <span>Skrolujte</span>
        <i />
      </div>
    </section>
  );
}
