"use client";

import { useEffect, useRef, useState } from "react";
import { buildSupplyChainScene } from "@/lib/supply-chain-scene";

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
    body: "Poultry infrastruktura, skladištenje i kontinuirana ishrana povezuju proizvodnju hrane sa proizvodnjom konzumnih jaja.",
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

const stageBreaks = [0.06, 0.19, 0.35, 0.51, 0.67, 0.83];

function resolveStage(progress: number) {
  let current = 0;
  for (let i = 0; i < stageBreaks.length; i++) {
    if (progress >= stageBreaks[i]) current = i;
  }
  return Math.min(stages.length - 1, current);
}

function interpolateFov(progress: number) {
  const points = [
    [0.0, 30],
    [0.13, 36],
    [0.3, 32],
    [0.49, 37],
    [0.67, 29],
    [0.82, 35],
    [1.0, 42],
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

export function SupplyChainExperience() {
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
      const THREE = await import("three");
      if (cancelled) return;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const mobile = window.matchMedia("(max-width: 900px)").matches;
      const lowPower = mobile && ((navigator.hardwareConcurrency ?? 8) <= 4 || window.innerWidth <= 430);

      let renderer: any;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: !mobile,
          alpha: false,
          powerPreference: "high-performance",
          precision: lowPower ? "mediump" : "highp",
        });
      } catch {
        setFailed(true);
        return;
      }

      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 0.78 : mobile ? 1 : 1.35));
      renderer.shadowMap.enabled = !mobile;
      if (!mobile) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0x151a16, 1);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x151a16);
      scene.fog = new THREE.FogExp2(0x151a16, mobile ? 0.027 : 0.021);

      const camera = new THREE.PerspectiveCamera(mobile ? 38 : 34, 1, 0.1, 120);

      const cameraPoints = mobile
        ? [
            new THREE.Vector3(-19.5, 2.3, 8.2),
            new THREE.Vector3(-12.5, 5.3, 12.7),
            new THREE.Vector3(1.8, 6.6, 14.5),
            new THREE.Vector3(16.2, 5.2, 13.8),
            new THREE.Vector3(16.0, 2.7, 10.1),
            new THREE.Vector3(5.8, 5.9, 15.8),
            new THREE.Vector3(3.5, 15.8, 27.0),
          ]
        : [
            new THREE.Vector3(-20.2, 1.65, 6.8),
            new THREE.Vector3(-12.8, 4.3, 11.6),
            new THREE.Vector3(-0.3, 5.7, 13.4),
            new THREE.Vector3(14.5, 4.1, 13.7),
            new THREE.Vector3(17.6, 2.1, 8.7),
            new THREE.Vector3(5.0, 4.8, 14.9),
            new THREE.Vector3(2.0, 17.6, 29.0),
          ];

      const targetPoints = [
        new THREE.Vector3(-17.0, 1.2, 0.3),
        new THREE.Vector3(-7.4, 4.0, -3.6),
        new THREE.Vector3(1.6, 4.4, -2.0),
        new THREE.Vector3(15.1, 1.6, -2.2),
        new THREE.Vector3(14.5, 1.4, 4.0),
        new THREE.Vector3(3.2, 1.4, 7.0),
        new THREE.Vector3(3.0, 0.5, 0.0),
      ];

      const cameraCurve = new THREE.CatmullRomCurve3(cameraPoints, false, "catmullrom", 0.42);
      const targetCurve = new THREE.CatmullRomCurve3(targetPoints, false, "catmullrom", 0.4);

      const supplyScene = buildSupplyChainScene(THREE, { mobile, lowPower });
      scene.add(supplyScene.world);

      const hemi = new THREE.HemisphereLight(0xd8dfd2, 0x172018, mobile ? 1.65 : 1.95);
      scene.add(hemi);

      const sun = new THREE.DirectionalLight(0xffdfaa, mobile ? 2.8 : 4.0);
      sun.position.set(-13, 18, 13);
      sun.castShadow = !mobile;
      if (!mobile) {
        sun.shadow.mapSize.set(1536, 1536);
        sun.shadow.camera.left = -28;
        sun.shadow.camera.right = 28;
        sun.shadow.camera.top = 24;
        sun.shadow.camera.bottom = -18;
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 65;
        sun.shadow.bias = -0.00035;
      }
      scene.add(sun);

      const coolFill = new THREE.DirectionalLight(0x83a997, 1.1);
      coolFill.position.set(18, 9, -14);
      scene.add(coolFill);

      const processLight = new THREE.PointLight(0xf0a128, mobile ? 7 : 12, 18, 2);
      processLight.position.set(2.0, 5.2, 1.5);
      scene.add(processLight);

      const gradingLight = new THREE.SpotLight(0xf4d7aa, mobile ? 9 : 15, 22, Math.PI / 5, 0.55, 1.4);
      gradingLight.position.set(14.5, 7.4, 10.0);
      gradingLight.target.position.set(14.5, 0.5, 4.0);
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

      const updateScroll = () => {
        const rect = root.getBoundingClientRect();
        const viewport = Math.max(window.innerHeight, 1);
        const travel = Math.max(root.offsetHeight - viewport, 1);
        progress = Math.min(1, Math.max(0, -rect.top / travel));
        root.style.setProperty("--supply-progress", progress.toFixed(4));

        const nextStage = resolveStage(progress);
        setActiveStage((current) => current === nextStage ? current : nextStage);
        const nextPastIntro = progress > (mobile ? 0.055 : 0.07);
        setPastIntro((current) => current === nextPastIntro ? current : nextPastIntro);

        if (reducedMotion) ensureFrame();
      };

      const draw = () => {
        resize();
        const elapsed = reducedMotion ? 0 : clock.getElapsedTime();

        pointerX += (targetPointerX - pointerX) * 0.045;
        pointerY += (targetPointerY - pointerY) * 0.045;

        const cameraProgress = Math.min(1, Math.max(0, progress));
        cameraCurve.getPointAt(cameraProgress, cameraPosition);
        targetCurve.getPointAt(cameraProgress, targetPosition);

        if (!mobile) {
          cameraPosition.x += pointerX * 0.26;
          cameraPosition.y += pointerY * 0.18;
          targetPosition.x += pointerX * 0.12;
        }

        camera.position.copy(cameraPosition);
        camera.lookAt(targetPosition);
        const nextFov = interpolateFov(cameraProgress);
        if (Math.abs(camera.fov - nextFov) > 0.02) {
          camera.fov += (nextFov - camera.fov) * 0.14;
          camera.updateProjectionMatrix();
        }

        const daylight = 1 + Math.sin(cameraProgress * Math.PI) * 0.08;
        renderer.toneMappingExposure = daylight;
        processLight.intensity = (mobile ? 6 : 10) + Math.sin(elapsed * 0.8) * 0.4;
        sun.position.x = -13 + cameraProgress * 9;

        supplyScene.update(elapsed, cameraProgress);
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
        }
        if (!reducedMotion) raf = requestAnimationFrame(loop);
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
      window.addEventListener("scroll", onScroll, { passive: true });
      if (!mobile) window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);

      updateScroll();
      resize();
      ensureFrame();

      cleanup = () => {
        observer.disconnect();
        resizeObserver.disconnect();
        window.removeEventListener("scroll", onScroll);
        if (!mobile) window.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("visibilitychange", onVisibility);
        if (raf) cancelAnimationFrame(raf);
        supplyScene.dispose();
        renderer.dispose();
      };
    };

    void boot();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className={`supply-experience ${ready ? "is-ready" : ""} ${failed ? "is-fallback" : ""}`}
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
    </section>
  );
}
