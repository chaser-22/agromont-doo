"use client";

import { useEffect, useRef, useState } from "react";
import { buildSupplyChainScene } from "@/lib/supply-chain-scene";
import { resolveSupplyQuality } from "@/lib/render-quality";

const stages = [
  {
    code: "01",
    eyebrow: "Žitarice / ulaz",
    title: "Sistem počinje sirovinom.",
    body: "Otkup i skladištenje žitarica daju proizvodnom lancu stabilan ulaz prije prerade i daljeg transporta.",
    fact: "Šabac + Kovin · 50.000 t ukupnog kapaciteta prema objavi iz 2025.",
  },
  {
    code: "02",
    eyebrow: "Spuž / stočna hrana",
    title: "Sirovina ulazi u proizvodnju.",
    body: "Fabrika stočne hrane u Spužu povezuje žitarice sa potrebama farmi i tržišta.",
    fact: "Spuž · proizvodnja stočne hrane",
  },
  {
    code: "03",
    eyebrow: "Martinići / farma",
    title: "Industrija prelazi u farmu.",
    body: "Živinarska infrastruktura, skladištenje i kontinuirana ishrana povezuju proizvodnju hrane sa proizvodnjom konzumnih jaja.",
    fact: "Martinići · proizvodnja i pakovanje konzumnih jaja",
  },
  {
    code: "04",
    eyebrow: "Sortiranje / pakovanje",
    title: "Proizvod dobija kontrolisan izlaz.",
    body: "Jaja prolaze kroz rukovanje, sortiranje i pakovanje prije distribucije prema trgovini i kupcima.",
    fact: "Oprema za sortiranje jaja · javno dokumentovan investicioni projekat",
  },
  {
    code: "05",
    eyebrow: "Logistika / centri",
    title: "Proizvodnja izlazi na teren.",
    body: "Distribucija i poljoprivredni centri povezuju proizvodni sistem sa gazdinstvima, partnerima i krajnjim kupcima.",
    fact: "Berane + Golubovci · novi poljoprivredni centri otvoreni 2025.",
  },
  {
    code: "06",
    eyebrow: "Region / mreža",
    title: "Jedan sistem postaje regionalna mreža.",
    body: "Crna Gora ostaje proizvodno jezgro, dok ulaganja u Srbiji i Bosni i Hercegovini šire ulazne, proizvodne i distributivne kapacitete.",
    fact: "Crna Gora · Srbija · Bosna i Hercegovina",
  },
] as const;

const stageBreaks = [0.06, 0.19, 0.35, 0.55, 0.70, 0.86];

function resolveStage(progress: number) {
  let current = 0;
  for (let i = 0; i < stageBreaks.length; i++) {
    if (progress >= stageBreaks[i]) current = i;
  }
  return Math.min(stages.length - 1, current);
}

function interpolateFov(progress: number) {
  const points = [
    [0.0, 31],
    [0.13, 35],
    [0.3, 33],
    [0.49, 36],
    [0.67, 34],
    [0.82, 37],
    [1.0, 44],
  ] as const;

  for (let i = 0; i < points.length - 1; i++) {
    const [aT, aV] = points[i];
    const [bT, bV] = points[i + 1];
    if (progress <= bT) {
      const local = Math.min(1, Math.max(0, (progress - aT) / Math.max(bT - aT, 0.001)));
      const eased = local * local * (3 - 2 * local);
      return aV + (bV - aV) * eased;
    }
  }
  return points[points.length - 1][1];
}

export function SupplyChainExperience({ qaMode = false }: { qaMode?: boolean } = {}) {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [pastIntro, setPastIntro] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const boot = async () => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const mobile = window.matchMedia("(max-width: 900px)").matches;
      const hardwareConcurrency = navigator.hardwareConcurrency ?? 8;
      const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
      const webGPUAvailable = typeof (navigator as Navigator & { gpu?: unknown }).gpu !== "undefined";
      const lowPower = mobile && (hardwareConcurrency <= 4 || window.innerWidth <= 430);
      const quality = resolveSupplyQuality({
        qaMode,
        reducedMotion,
        width: window.innerWidth,
        devicePixelRatio: window.devicePixelRatio || 1,
        hardwareConcurrency,
        deviceMemory,
        webGPUAvailable,
      });

      let contextLost = false;
      const onContextLost = (event: Event) => {
        event.preventDefault();
        contextLost = true;
        setFailed(true);
      };

      let THREE: any;
      let renderer: any;
      let rendererBackend: "webgpu" | "webgl2" = "webgl2";

      try {
        if (quality.preferWebGPU) {
          THREE = await import("three/webgpu");
          renderer = new THREE.WebGPURenderer({
            canvas,
            antialias: true,
            alpha: false,
          });
          await renderer.init();
          rendererBackend = "webgpu";
        } else {
          THREE = await import("three");
          renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: !mobile,
            alpha: false,
            powerPreference: "high-performance",
            precision: lowPower ? "mediump" : "highp",
          });
          canvas.addEventListener("webglcontextlost", onContextLost);
        }
      } catch {
        // WebGPU is an enhancement, never a hard dependency. If it fails during
        // initialization we immediately fall back to the proven WebGL renderer.
        try {
          THREE = await import("three");
          renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: !mobile,
            alpha: false,
            powerPreference: "high-performance",
            precision: lowPower ? "mediump" : "highp",
          });
          rendererBackend = "webgl2";
          canvas.addEventListener("webglcontextlost", onContextLost);
        } catch {
          setFailed(true);
          return;
        }
      }

      if (cancelled) {
        renderer.dispose?.();
        return;
      }

      root.dataset.renderTier = quality.tier;
      root.dataset.renderBackend = rendererBackend;

      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.AgXToneMapping ?? THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = quality.ultra ? 1.02 : 1.0;
      if ("transmissionResolutionScale" in renderer) {
        renderer.transmissionResolutionScale = quality.transmissionScale;
      }

      const maxDpr = quality.maxDpr;
      const minDpr = quality.minDpr;
      let currentDpr = maxDpr;
      renderer.setPixelRatio(currentDpr);

      if (renderer.shadowMap) {
        renderer.shadowMap.enabled = quality.shadowMapSize > 0;
        if (quality.shadowMapSize > 0) {
          if (!quality.preferWebGPU && THREE.PCFSoftShadowMap != null) {
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
          }
          renderer.shadowMap.autoUpdate = false;
          renderer.shadowMap.needsUpdate = true;
        }
      }
      renderer.setClearColor(0x7f8c86, 1);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x7f8c86);
      scene.fog = new THREE.FogExp2(0x8f9991, mobile ? 0.0118 : 0.0088);

      let environmentTarget: any = null;
      let environmentTexture: any = null;
      try {
        if (quality.ultra) {
          // Lightweight outdoor reflection environment that is renderer-agnostic.
          // This avoids forcing WebGPU through the WebGL-only PMREM generator.
          const faceColors = [
            ["#aebcc1", "#d8d1bd"], ["#9babae", "#c9c4b3"],
            ["#7f98a5", "#d8d1bd"], ["#65685e", "#8c8a7d"],
            ["#a8b7bd", "#d6cfba"], ["#9eadae", "#cfc9b7"],
          ] as const;
          const faces = faceColors.map(([top, bottom]) => {
            const face = document.createElement("canvas");
            face.width = 64;
            face.height = 64;
            const ctx = face.getContext("2d")!;
            const gradient = ctx.createLinearGradient(0, 0, 0, 64);
            gradient.addColorStop(0, top);
            gradient.addColorStop(1, bottom);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 64, 64);
            return face;
          });
          environmentTexture = new THREE.CubeTexture(faces);
          environmentTexture.colorSpace = THREE.SRGBColorSpace;
          environmentTexture.needsUpdate = true;
          scene.environment = environmentTexture;
          scene.environmentIntensity = 0.72;
        } else {
          const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js");
          const pmremGenerator = new THREE.PMREMGenerator(renderer);
          const environmentScene = new RoomEnvironment();
          environmentTarget = pmremGenerator.fromScene(environmentScene, 0.055);
          scene.environment = environmentTarget.texture;
          scene.environmentIntensity = mobile ? 0.52 : 0.62;
          environmentScene.dispose();
          pmremGenerator.dispose();
        }
      } catch {
        // Direct lights still provide a complete fallback if optional IBL is unavailable.
      }

      const camera = new THREE.PerspectiveCamera(mobile ? 39 : 33, 1, 0.08, 145);

      const cameraPoints = mobile
        ? [
            new THREE.Vector3(-24.6, 3.8, 11.8),
            new THREE.Vector3(-12.9, 4.55, 10.3),
            new THREE.Vector3(1.7, 6.0, 12.5),
            new THREE.Vector3(24.2, 7.2, 15.2),
            new THREE.Vector3(18.2, 4.4, 17.2),
            new THREE.Vector3(8.7, 4.8, 16.5),
            new THREE.Vector3(4.0, 18.3, 30.6),
          ]
        : [
            new THREE.Vector3(-24.8, 2.9, 9.5),
            new THREE.Vector3(-12.9, 3.45, 7.9),
            new THREE.Vector3(2.4, 4.85, 9.8),
            new THREE.Vector3(23.8, 6.4, 13.0),
            new THREE.Vector3(18.0, 4.0, 16.6),
            new THREE.Vector3(8.8, 3.2, 14.5),
            new THREE.Vector3(3.8, 19.6, 31.6),
          ];

      const targetPoints = [
        new THREE.Vector3(-18.0, 1.35, -1.2),
        new THREE.Vector3(-6.3, 4.8, -4.0),
        new THREE.Vector3(1.3, 4.6, -2.15),
        new THREE.Vector3(16.2, 1.85, -1.1),
        new THREE.Vector3(14.6, 1.35, 13.05),
        new THREE.Vector3(3.1, 1.45, 7.15),
        new THREE.Vector3(2.0, 1.55, 0.0),
      ];

      const cameraCurve = new THREE.CatmullRomCurve3(cameraPoints, false, "centripetal");
      const targetCurve = new THREE.CatmullRomCurve3(targetPoints, false, "centripetal");

      const supplyScene = buildSupplyChainScene(THREE, { mobile, lowPower, quality: quality.tier });
      scene.add(supplyScene.world);

      const heroAnimations: Array<(elapsed: number) => void> = [];
      let loadedHeroAssets = 0;
      root.dataset.heroAssets = "procedural";

      if (!mobile) {
        try {
          const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
          const loader = new GLTFLoader();

          const installHero = async (
            url: string,
            slot: { anchor: any; fallbackObjects: any[] },
            animate?: (root: any) => ((elapsed: number) => void) | undefined,
          ) => {
            const gltf = await loader.loadAsync(url);
            const model = gltf.scene;
            const parent = slot.anchor.parent;
            if (!parent) return;

            model.position.copy(slot.anchor.position);
            model.quaternion.copy(slot.anchor.quaternion);
            model.scale.copy(slot.anchor.scale);
            model.name = `UltraHero:${url.split("/").pop() ?? "asset"}`;
            model.traverse((object: any) => {
              if (object.isMesh) {
                object.castShadow = quality.shadowMapSize > 0;
                object.receiveShadow = quality.shadowMapSize > 0;
              }
            });

            parent.add(model);
            slot.fallbackObjects.forEach((object: any) => {
              object.visible = false;
            });

            const animation = animate?.(model);
            if (animation) heroAnimations.push(animation);
            loadedHeroAssets += 1;
            root.dataset.heroAssets = String(loadedHeroAssets);
          };

          await Promise.allSettled([
            installHero("/models/truck-ultra.glb", supplyScene.heroSlots.truck),
            installHero("/models/egg-grader-ultra.glb", supplyScene.heroSlots.grader, (model) => {
              const eggMesh = model.getObjectByName("egg");
              if (!eggMesh) return undefined;
              const baseX = eggMesh.position.x;
              const baseY = eggMesh.position.y;
              return (elapsed: number) => {
                eggMesh.position.x = baseX + Math.sin(elapsed * 0.72) * 0.075;
                eggMesh.position.y = baseY + Math.sin(elapsed * 1.45) * 0.008;
              };
            }),
          ]);
        } catch {
          // Desktop hero assets are an enhancement. The procedural versions
          // remain visible if the loader or an individual GLB is unavailable.
        }
      }

      const hemi = new THREE.HemisphereLight(0xe7edf0, 0x4b493e, mobile ? 0.82 : quality.ultra ? 0.84 : 0.98);
      scene.add(hemi);

      const sun = new THREE.DirectionalLight(0xffe1ad, mobile ? 2.15 : quality.ultra ? 3.25 : 3.05);
      sun.position.set(-15, 20, 10);
      sun.target.position.set(2, 0.8, 0);
      sun.castShadow = !mobile;
      if (!mobile) {
        sun.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
        sun.shadow.camera.left = -31;
        sun.shadow.camera.right = 31;
        sun.shadow.camera.top = 26;
        sun.shadow.camera.bottom = -21;
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 72;
        sun.shadow.bias = quality.ultra ? -0.00018 : -0.00028;
        sun.shadow.normalBias = quality.ultra ? 0.012 : 0.018;
      }
      scene.add(sun, sun.target);

      const coolFill = new THREE.DirectionalLight(0xa9bcc3, mobile ? 0.28 : quality.ultra ? 0.27 : 0.36);
      coolFill.position.set(21, 11, -16);
      scene.add(coolFill);

      const warmBounce = new THREE.DirectionalLight(0xd2a477, mobile ? 0.16 : quality.ultra ? 0.14 : 0.24);
      warmBounce.position.set(-8, 4, 18);
      scene.add(warmBounce);

      const processLight = new THREE.PointLight(0xf0a128, mobile ? 2.6 : quality.ultra ? 3.25 : 4.2, 15, 2);
      processLight.position.set(2.0, 4.8, 1.5);
      scene.add(processLight);

      const gradingLight = new THREE.SpotLight(0xffddb1, mobile ? 3.2 : quality.ultra ? 4.25 : 5.2, 19, Math.PI / 6.0, 0.66, 1.5);
      gradingLight.position.set(14.6, 6.7, 15.2);
      gradingLight.target.position.set(14.8, 1.0, 13.05);
      scene.add(gradingLight, gradingLight.target);

      let viewportWidth = 0;
      let viewportHeight = 0;
      let progress = 0;
      let visible = true;
      let pageVisible = !document.hidden;
      let raf = 0;
      let lastFrame = 0;
      let pointerX = 0;
      let pointerY = 0;
      let markedReady = false;
      let targetPointerX = 0;
      let targetPointerY = 0;
      let perfWindowStart = 0;
      let perfFrames = 0;
      let latestFps = 0;
      const clock = new THREE.Clock();
      const cameraPosition = new THREE.Vector3();
      const targetPosition = new THREE.Vector3();

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(2, Math.round(rect.width));
        const height = Math.max(2, Math.round(rect.height));
        if (width === viewportWidth && height === viewportHeight) return;
        viewportWidth = width;
        viewportHeight = height;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      const applyProgress = (nextProgress: number) => {
        progress = Math.min(1, Math.max(0, nextProgress));
        root.style.setProperty("--supply-progress", progress.toFixed(4));

        const nextStage = resolveStage(progress);
        setActiveStage((current) => current === nextStage ? current : nextStage);
        const nextPastIntro = progress > (mobile ? 0.055 : 0.07);
        setPastIntro((current) => current === nextPastIntro ? current : nextPastIntro);
      };

      const updateScroll = () => {
        if (qaMode) return;
        const rect = root.getBoundingClientRect();
        const viewport = Math.max(window.innerHeight, 1);
        const travel = Math.max(root.offsetHeight - viewport, 1);
        applyProgress(-rect.top / travel);

        if (reducedMotion) ensureFrame();
      };

      const draw = () => {
        resize();
        const elapsed = reducedMotion ? 0 : qaMode ? progress * 12 : clock.getElapsedTime();

        pointerX += (targetPointerX - pointerX) * 0.045;
        pointerY += (targetPointerY - pointerY) * 0.045;

        const cameraProgress = Math.min(1, Math.max(0, progress));
        cameraCurve.getPoint(cameraProgress, cameraPosition);
        targetCurve.getPoint(cameraProgress, targetPosition);

        if (!mobile) {
          cameraPosition.x += pointerX * 0.26;
          cameraPosition.y += pointerY * 0.18;
          targetPosition.x += pointerX * 0.12;
        }

        camera.position.copy(cameraPosition);
        camera.lookAt(targetPosition);
        const nextFov = interpolateFov(cameraProgress) + (mobile ? 4.0 : 0);
        if (Math.abs(camera.fov - nextFov) > 0.02) {
          camera.fov = qaMode ? nextFov : camera.fov + (nextFov - camera.fov) * 0.14;
          camera.updateProjectionMatrix();
        }

        const daylight = (quality.ultra ? 1.01 : 0.98) + Math.sin(cameraProgress * Math.PI) * (quality.ultra ? 0.025 : 0.035);
        renderer.toneMappingExposure = daylight;
        processLight.intensity = (mobile ? 2.5 : quality.ultra ? 3.2 : 4.1) + Math.sin(elapsed * 0.72) * 0.12;
        gradingLight.intensity = (mobile ? 3.1 : quality.ultra ? 4.1 : 5.0) + Math.sin(elapsed * 0.55) * 0.10;
        if (scene.fog) scene.fog.density = (mobile ? 0.0118 : quality.ultra ? 0.0076 : 0.0088) + cameraProgress * 0.0004;

        supplyScene.update(elapsed, cameraProgress);
        heroAnimations.forEach((animate) => animate(elapsed));
        renderer.render(scene, camera);

        if (!markedReady) {
          markedReady = true;
          setReady(true);
        }
      };

      const loop = (time: number) => {
        raf = 0;
        if (!visible || !pageVisible) return;
        const frameGap = lowPower ? 33 : mobile ? 24 : 0;
        if (!frameGap || time - lastFrame >= frameGap) {
          lastFrame = time;
          draw();

          if (!reducedMotion) {
            if (!perfWindowStart) perfWindowStart = time;
            perfFrames += 1;
            const perfWindow = time - perfWindowStart;
            if (perfWindow >= 1800) {
              const fps = perfFrames / (perfWindow / 1000);
              latestFps = fps;
              const floor = quality.targetFps;
              if (fps < floor && currentDpr > minDpr + 0.02) {
                currentDpr = Math.max(minDpr, currentDpr - 0.12);
                renderer.setPixelRatio(currentDpr);
                renderer.setSize(viewportWidth, viewportHeight, false);
              }
              perfWindowStart = time;
              perfFrames = 0;
            }
          }
        }
        if (!reducedMotion && !qaMode) raf = requestAnimationFrame(loop);
      };

      const ensureFrame = () => {
        if (raf || !visible || !pageVisible) return;
        raf = reducedMotion
          ? requestAnimationFrame(() => {
              raf = 0;
              draw();
            })
          : requestAnimationFrame(loop);
      };

      const onPointerMove = (event: PointerEvent) => {
        targetPointerX = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
        targetPointerY = -(event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
      };

      const qaWindow = window as any;
      let gpuInfo = { vendor: "unknown", renderer: "unknown" };
      try {
        const gl = renderer.getContext();
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          gpuInfo = {
            vendor: String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "unknown"),
            renderer: String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "unknown"),
          };
        }
      } catch {
        // GPU vendor strings are optional and may be blocked by browser privacy settings.
      }

      if (qaMode) {
        qaWindow.__AGROMONT_3D_QA__ = {
          version: 1,
          ready: true,
          setProgress(value: number) {
            applyProgress(Number.isFinite(value) ? value : 0);
            draw();
            return this.snapshot();
          },
          snapshot() {
            return {
              ready: markedReady,
              failed: contextLost,
              progress,
              stage: resolveStage(progress) + 1,
              stageCode: stages[resolveStage(progress)].code,
              mobile,
              lowPower,
              reducedMotion,
              quality: quality.tier,
              backend: rendererBackend,
              heroAssets: loadedHeroAssets,
              viewport: { width: viewportWidth, height: viewportHeight },
              dpr: currentDpr,
              fps: latestFps,
              camera: {
                position: camera.position.toArray(),
                target: targetPosition.toArray(),
                fov: camera.fov,
                near: camera.near,
                far: camera.far,
              },
              renderer: {
                calls: renderer.info.render.calls,
                triangles: renderer.info.render.triangles,
                points: renderer.info.render.points,
                lines: renderer.info.render.lines,
                geometries: renderer.info.memory.geometries,
                textures: renderer.info.memory.textures,
              },
              gpu: gpuInfo,
              timestamp: performance.now(),
            };
          },
        };
        applyProgress(0);
      }

      const onScroll = () => updateScroll();
      const onVisibility = () => {
        pageVisible = !document.hidden;
        if (pageVisible) ensureFrame();
      };

      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) ensureFrame();
        else if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      }, { rootMargin: "220px" });

      const resizeObserver = new ResizeObserver(() => {
        resize();
        ensureFrame();
      });

      observer.observe(root);
      resizeObserver.observe(canvas);
      if (!qaMode) window.addEventListener("scroll", onScroll, { passive: true });
      if (!mobile && !qaMode) window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);

      updateScroll();
      resize();
      ensureFrame();

      cleanup = () => {
        observer.disconnect();
        resizeObserver.disconnect();
        if (!qaMode) window.removeEventListener("scroll", onScroll);
        if (!mobile && !qaMode) window.removeEventListener("pointermove", onPointerMove);
        if (qaWindow.__AGROMONT_3D_QA__) delete qaWindow.__AGROMONT_3D_QA__;
        document.removeEventListener("visibilitychange", onVisibility);
        if (raf) cancelAnimationFrame(raf);
        canvas.removeEventListener("webglcontextlost", onContextLost);
        supplyScene.dispose();
        environmentTarget?.dispose?.();
        environmentTexture?.dispose?.();
        renderer.dispose();
      };
    };

    void boot();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [qaMode]);

  return (
    <section
      ref={rootRef}
      className={`supply-experience ${qaMode ? "is-qa-mode" : ""} ${ready ? "is-ready" : ""} ${failed ? "is-fallback" : ""}`}
      id="proizvodnja"
      aria-labelledby="supply-title"
    >
      <div className="supply-sticky">
        <div className="supply-fallback" aria-hidden="true" />
        <canvas ref={canvasRef} className="supply-canvas" aria-hidden="true" />
        <div className="supply-vignette" aria-hidden="true" />
        <div className="supply-grid" aria-hidden="true" />

        <div className={`supply-intro ${pastIntro ? "is-past" : ""}`}>
          <span>AGROMONT / INDUSTRIJSKA POLJOPRIVREDA</span>
          <h1 id="supply-title">
            Od zrna
            <br />
            do <em>mreže.</em>
          </h1>
          <p>
            Žitarice, stočna hrana, farme, sortiranje, pakovanje i distribucija povezani
            su kroz jedan proizvodni sistem.
          </p>
          <div className="supply-intro-actions">
            <a href="#sistem">Pratite sistem <b aria-hidden="true">↓</b></a>
            <a href="#proizvodi">Program i proizvodi <b aria-hidden="true">↗</b></a>
          </div>
        </div>

        <div className={`supply-stage-index ${pastIntro ? "is-visible" : ""}`} aria-hidden="true">
          <span>{stages[activeStage].code} / 06</span>
          <strong>{stages[activeStage].eyebrow}</strong>
        </div>

        <div className={`supply-stage-copy ${pastIntro ? "is-visible" : ""}`} id="sistem">
          {stages.map((stage, index) => (
            <article
              key={stage.code}
              className={index === activeStage ? "is-active" : ""}
              aria-current={index === activeStage ? "step" : undefined}
            >
              <span>{stage.code} / {stage.eyebrow}</span>
              <h2>{stage.title}</h2>
              <p>{stage.body}</p>
              <small>{stage.fact}</small>
            </article>
          ))}
        </div>

        <div className={`supply-progress ${pastIntro ? "is-visible" : ""}`} aria-hidden="true">
          {stages.map((stage, index) => (
            <i key={stage.code} className={index <= activeStage ? "is-active" : ""} />
          ))}
        </div>

        <p className="supply-disclaimer">
          3D vizuelizacija interpretira tok poslovnog sistema; nije tehnički model konkretnog postrojenja.
        </p>
      </div>

      <div className="supply-fallback-story" aria-label="Proizvodni sistem">
        {stages.map((stage) => (
          <article key={stage.code}>
            <span>{stage.code} / {stage.eyebrow}</span>
            <h2>{stage.title}</h2>
            <p>{stage.body}</p>
            <small>{stage.fact}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
