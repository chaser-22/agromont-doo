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

#define MAX_STEPS 46
#define MAX_DIST 24.0
#define SURF_DIST 0.003

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

float sdRoundBox(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

float sdCappedCylinder(vec3 p, vec2 h) {
  vec2 d = abs(vec2(length(p.xz), p.y)) - h;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float sdEllipsoid(vec3 p, vec3 r) {
  float k0 = length(p / r);
  float k1 = length(p / (r * r));
  return k0 * (k0 - 1.0) / max(k1, 0.0001);
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a;
  vec3 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

vec2 opUnion(vec2 a, vec2 b) {
  return a.x < b.x ? a : b;
}

float eggShape(vec3 p) {
  float taper = mix(1.10, 0.82, smoothstep(-0.18, 0.24, p.y));
  p.xz /= taper;
  return sdEllipsoid(p, vec3(0.15, 0.215, 0.15));
}

vec2 mapScene(vec3 p) {
  vec2 res = vec2(100.0, 0.0);

  // Ground / production yard.
  res = opUnion(res, vec2(p.y + 1.34, 1.0));

  // Three poultry halls: long, clean industrial volumes with pitched roofs.
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec3 hp = p - vec3(1.35 + fi * 1.28, -0.72, -1.45 - fi * 0.48);
    float hall = sdRoundBox(hp, vec3(0.52, 0.54, 2.18), 0.035);
    res = opUnion(res, vec2(hall, 3.0));

    vec3 roofL = hp - vec3(-0.28, 0.62, 0.0);
    roofL.xy *= rot(-0.42);
    res = opUnion(res, vec2(sdBox(roofL, vec3(0.38, 0.055, 2.23)), 4.0));

    vec3 roofR = hp - vec3(0.28, 0.62, 0.0);
    roofR.xy *= rot(0.42);
    res = opUnion(res, vec2(sdBox(roofR, vec3(0.38, 0.055, 2.23)), 4.0));

    // Solar arrays, reflecting the actual farm's roof-mounted solar panels.
    for (int j = 0; j < 2; j++) {
      float fj = float(j);
      vec3 panel = hp - vec3(0.0, 0.745, -0.76 + fj * 1.42);
      res = opUnion(res, vec2(sdBox(panel, vec3(0.34, 0.025, 0.56)), 5.0));
    }
  }

  // Corrugated feed silos and supports.
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec3 sp = p - vec3(0.25 + fi * 0.69, -0.20 + 0.03 * mod(fi, 2.0), -3.72);
    float body = sdCappedCylinder(sp, vec2(0.28, 0.86));
    vec3 dome = sp - vec3(0.0, 0.91, 0.0);
    float cap = sdEllipsoid(dome, vec3(0.29, 0.16, 0.29));
    vec3 hopper = sp + vec3(0.0, 0.94, 0.0);
    float coneHint = sdEllipsoid(hopper, vec3(0.24, 0.34, 0.24));
    res = opUnion(res, vec2(min(body, min(cap, coneHint)), 2.0));

    vec3 legA = p - vec3(0.11 + fi * 0.69, -1.03, -3.61);
    vec3 legB = p - vec3(0.39 + fi * 0.69, -1.03, -3.83);
    res = opUnion(res, vec2(sdBox(legA, vec3(0.025, 0.30, 0.025)), 2.0));
    res = opUnion(res, vec2(sdBox(legB, vec3(0.025, 0.30, 0.025)), 2.0));
  }

  // Feed transfer pipes: a visible physical link between storage and poultry halls.
  res = opUnion(res, vec2(sdCapsule(p, vec3(0.25, 0.72, -3.72), vec3(2.34, 0.72, -3.72), 0.055), 2.0));
  res = opUnion(res, vec2(sdCapsule(p, vec3(2.34, 0.72, -3.72), vec3(2.34, 0.42, -2.26), 0.055), 2.0));
  res = opUnion(res, vec2(sdCapsule(p, vec3(2.34, 0.42, -2.26), vec3(3.95, 0.18, -1.90), 0.055), 2.0));

  // Packing conveyor in the foreground.
  vec3 belt = p - vec3(2.75, -0.96, 0.72);
  res = opUnion(res, vec2(sdRoundBox(belt, vec3(2.15, 0.09, 0.30), 0.05), 6.0));
  for (int i = 0; i < 5; i++) {
    float phase = fract(float(i) * 0.205 + uTime * 0.035);
    vec3 ep = p - vec3(0.92 + phase * 3.72, -0.72, 0.72);
    res = opUnion(res, vec2(eggShape(ep), 7.0));
  }

  // Amber material-flow markers travel from feed storage toward the halls.
  for (int i = 0; i < 4; i++) {
    float t = fract(float(i) * 0.25 + uTime * 0.07);
    vec3 a = vec3(0.30, 0.72, -3.72);
    vec3 b = vec3(2.25, 0.72, -3.72);
    vec3 marker = p - mix(a, b, t);
    res = opUnion(res, vec2(sdSphere(marker, 0.045), 8.0));
  }

  return res;
}

vec3 getNormal(vec3 p) {
  vec2 e = vec2(0.003, 0.0);
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
    dO += hit.x * 0.88;
    material = hit.y;
    if (abs(hit.x) < SURF_DIST || dO > MAX_DIST) break;
  }
  return vec2(dO, material);
}

float ambientOcclusion(vec3 p, vec3 n) {
  float occ = 0.0;
  float weight = 0.62;
  for (int i = 1; i <= 3; i++) {
    float h = 0.10 * float(i);
    float d = mapScene(p + n * h).x;
    occ += (h - d) * weight;
    weight *= 0.55;
  }
  return clamp(1.0 - occ, 0.46, 1.0);
}

vec3 materialColor(float id, vec3 p) {
  if (id < 1.5) {
    float lane = smoothstep(0.46, 0.49, abs(fract((p.x + 7.0) * 0.18) - 0.5));
    return mix(vec3(0.055, 0.075, 0.058), vec3(0.075, 0.095, 0.070), lane * 0.20);
  }
  if (id < 2.5) {
    float rib = 0.88 + 0.12 * cos(p.y * 58.0);
    return vec3(0.48, 0.52, 0.49) * rib;
  }
  if (id < 3.5) return vec3(0.105, 0.165, 0.115);
  if (id < 4.5) return vec3(0.66, 0.68, 0.62);
  if (id < 5.5) return vec3(0.055, 0.095, 0.105);
  if (id < 6.5) return vec3(0.055, 0.060, 0.052);
  if (id < 7.5) return vec3(0.91, 0.84, 0.67);
  return vec3(0.96, 0.48, 0.055);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag * 2.0 - uResolution.xy) / max(uResolution.y, 1.0);
  vec2 suv = frag / max(uResolution, vec2(1.0));

  vec3 bgTop = vec3(0.018, 0.030, 0.021);
  vec3 bgBottom = vec3(0.055, 0.078, 0.054);
  vec3 color = mix(bgBottom, bgTop, smoothstep(0.0, 1.0, suv.y));

  float horizon = exp(-9.0 * abs(uv.y + 0.20));
  color += vec3(0.055, 0.075, 0.048) * horizon;

  // Camera keeps the industrial scene on the right so the headline remains dominant.
  vec3 ro = vec3(
    -0.15 + uPointer.x * 0.18,
    1.05 + uPointer.y * 0.12 + uScroll * 0.10,
    7.65 - uScroll * 0.58
  );
  vec3 ta = vec3(1.55 + uPointer.x * 0.07, -0.34 + uScroll * 0.05, -1.40);
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
    vec3 base = materialColor(matId, p);

    vec3 keyDir = normalize(vec3(-0.58, 0.90, 0.62));
    vec3 fillDir = normalize(vec3(0.74, 0.34, -0.52));
    float diff = max(dot(n, keyDir), 0.0);
    float fill = max(dot(n, fillDir), 0.0) * 0.22;
    float rim = pow(1.0 - max(dot(n, -rd), 0.0), 2.4);
    float specPower = matId > 4.5 && matId < 5.5 ? 70.0 : 34.0;
    float spec = pow(max(dot(reflect(-keyDir, n), -rd), 0.0), specPower);
    float ao = ambientOcclusion(p, n);

    color = base * (0.26 + diff * 0.84 + fill) * ao;
    color += vec3(0.72, 0.82, 0.70) * rim * 0.10;

    if (matId > 1.5 && matId < 2.5) color += spec * vec3(0.72, 0.78, 0.73) * 0.46;
    if (matId > 4.5 && matId < 5.5) color += spec * vec3(0.30, 0.52, 0.56) * 0.42;
    if (matId > 6.5 && matId < 7.5) color += spec * vec3(1.0, 0.78, 0.42) * 0.16;
    if (matId > 7.5) color += vec3(1.0, 0.30, 0.02) * 0.78;

    float fog = 1.0 - exp(-0.021 * dist * dist);
    color = mix(color, bgTop, fog);
  }

  // A restrained warm key light instead of the previous abstract glow.
  float warmLight = exp(-3.0 * length(uv - vec2(0.58, 0.23)));
  color += vec3(0.10, 0.045, 0.006) * warmLight;

  vec2 dustUv = vec2(suv.x * (uResolution.x / max(uResolution.y, 1.0)), suv.y + uTime * 0.006);
  vec2 dustCell = floor(dustUv * vec2(52.0, 40.0));
  float dustHash = hash21(dustCell);
  vec2 local = fract(dustUv * vec2(52.0, 40.0)) - 0.5;
  float dust = smoothstep(0.055, 0.0, length(local)) * step(0.982, dustHash);
  color += vec3(0.72, 0.55, 0.26) * dust * 0.15;

  float vignette = smoothstep(1.55, 0.22, length(uv * vec2(0.70, 0.90)));
  color *= 0.72 + 0.28 * vignette;
  float grain = hash21(frag + fract(uTime) * 61.0) - 0.5;
  color += grain * 0.009;
  color = pow(max(color, 0.0), vec3(0.4545));

  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader, gl.COMPILE_STATUS);
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
      const quality = mobile ? 0.54 : 0.78;
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.05 : 1.3) * quality;
      const nextWidth = Math.max(2, Math.min(1500, Math.round(rect.width * dpr)));
      const nextHeight = Math.max(2, Math.min(980, Math.round(rect.height * dpr)));
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
      pointerX += (targetX - pointerX) * 0.05;
      pointerY += (targetY - pointerY) * 0.05;
      const scroll = Math.min(Math.max(window.scrollY / Math.max(window.innerHeight, 1), 0), 1.15);
      gl.uniform2f(pointerLocation, pointerX, pointerY);
      gl.uniform1f(timeLocation, reducedMotion ? 0.0 : (now - start) / 1000);
      gl.uniform1f(scrollLocation, reducedMotion ? 0.12 : scroll);
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
        alt="Ilustrativni prikaz AgroMont proizvodnog sistema sa silosima i poljoprivrednim objektima"
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
          Farma Martinići · Stočna hrana Spuž
        </div>
        <h1 id="hero-title" className="reveal">
          Hranimo ono
          <br />
          što <em>raste.</em>
        </h1>
        <div className="hero-bottom reveal">
          <p>
            Od stočne hrane u Spužu do proizvodnje jaja na farmi Martinići i poljoprivrednih centara — povezan sistem domaće proizvodnje i podrške.
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

      <div className="hero-tech hero-system" aria-hidden="true">
        <span><b>01</b> SPUŽ · STOČNA HRANA</span>
        <span><b>02</b> MARTINIĆI · JAJA</span>
        <span><b>03</b> CENTRI · CRNA GORA</span>
      </div>
      <div className="hero-index" aria-hidden="true">
        <span>PROIZVODNJA / PAKOVANJE</span>
        <span>DOMAĆI LANAC</span>
      </div>
      <div className="hero-scroll" aria-hidden="true">
        <span>Skrolujte</span>
        <i />
      </div>
    </section>
  );
}
