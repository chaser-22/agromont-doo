"use client";

import { useEffect, useRef, useState } from "react";

type JourneyStep = {
  index: string;
  eyebrow: string;
  title: string;
  text: string;
  fact: string;
};

const steps: JourneyStep[] = [
  {
    index: "01",
    eyebrow: "Žitarice / sirovina",
    title: "Sve počinje sirovinom.",
    text: "Otkupni centri žitarica u Šapcu i Kovinu povezuju nabavku sirovine sa proizvodnjom stočne hrane i farmama.",
    fact: "Šabac + Kovin · 50.000 t ukupnog kapaciteta prema objavi iz 2025.",
  },
  {
    index: "02",
    eyebrow: "Spuž / stočna hrana",
    title: "Sirovina postaje stočna hrana.",
    text: "Fabrika u Spužu povezuje nabavku žitarica sa proizvodnjom stočne hrane za farme i tržište.",
    fact: "Spuž · domaća proizvodnja stočne hrane",
  },
  {
    index: "03",
    eyebrow: "Farma / jaja",
    title: "Sljedeća tačka je farma.",
    text: "Martinići su ključna tačka AgroMontove proizvodnje jaja, dok je preuzimanje velikog kompleksa u Milićima 2025. proširilo sistem na regionalni nivo.",
    fact: "Martinići + Milići · proizvodnja i pakovanje jaja",
  },
  {
    index: "04",
    eyebrow: "Distribucija / kupac",
    title: "Pakovanje vodi prema tržištu.",
    text: "Distribucija, partneri i poljoprivredni centri zatvaraju krug: od proizvodnje do gazdinstava, trgovaca i krajnjih kupaca.",
    fact: "Centri · partneri · regionalna distribucija",
  },
];

function createEggGeometry(THREE: any) {
  return new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0, -0.55),
      new THREE.Vector2(0.22, -0.50),
      new THREE.Vector2(0.36, -0.25),
      new THREE.Vector2(0.40, 0.02),
      new THREE.Vector2(0.32, 0.30),
      new THREE.Vector2(0.18, 0.49),
      new THREE.Vector2(0.0, 0.60),
    ],
    28,
  );
}

export function MaterialJourney() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [pastIntro, setPastIntro] = useState(false);

  useEffect(() => {
    const rootEl = rootRef.current;
    const canvas = canvasRef.current;
    if (!rootEl || !canvas) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    const boot = async () => {
      const THREE = await import("three");
      if (disposed) return;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const mobile = window.matchMedia("(max-width: 980px)").matches;
      const lowPower = mobile && ((navigator.hardwareConcurrency ?? 8) <= 4 || window.innerWidth <= 600);

      let renderer: any;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: !mobile,
          powerPreference: "high-performance",
        });
      } catch {
        return;
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 0.85 : mobile ? 1 : 1.35));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.06;
      renderer.shadowMap.enabled = !mobile;
      if (!mobile) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0x080b08, 1);

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x080b08, mobile ? 0.052 : 0.038);

      const camera = new THREE.PerspectiveCamera(mobile ? 42 : 35, 1, 0.1, 90);
      const baseY = mobile ? 3.5 : 4.2;
      camera.position.set(mobile ? 7.5 : 9.7, baseY, mobile ? 12.2 : 13.5);

      const world = new THREE.Group();
      scene.add(world);
      const stepEls = Array.from(rootEl.querySelectorAll<HTMLElement>(".journey-step"));

      const metal = new THREE.MeshStandardMaterial({
        color: 0x8d948f,
        roughness: 0.34,
        metalness: 0.78,
      });
      const darkMetal = new THREE.MeshStandardMaterial({
        color: 0x1a211d,
        roughness: 0.52,
        metalness: 0.62,
      });
      const green = new THREE.MeshStandardMaterial({
        color: 0x143d2b,
        roughness: 0.68,
        metalness: 0.08,
      });
      const cream = new THREE.MeshStandardMaterial({
        color: 0xe6dcc3,
        roughness: 0.52,
        metalness: 0.0,
      });
      const grainMat = new THREE.MeshStandardMaterial({
        color: 0xc38a3c,
        roughness: 0.66,
        metalness: 0.02,
      });
      const amber = new THREE.MeshStandardMaterial({
        color: 0xf3a526,
        emissive: 0x7d2d03,
        emissiveIntensity: 0.65,
        roughness: 0.35,
        metalness: 0.18,
      });
      const carton = new THREE.MeshStandardMaterial({
        color: 0x77705f,
        roughness: 0.93,
        metalness: 0.0,
      });

      const cast = (mesh: any) => {
        mesh.castShadow = !mobile;
        mesh.receiveShadow = !mobile;
        return mesh;
      };

      // A single industrial spine replaces the old "miniature farm" approach.
      const spine = cast(new THREE.Mesh(
        new THREE.BoxGeometry(17.5, 0.18, 0.36),
        darkMetal,
      ));
      spine.position.set(0, -0.62, 0);
      world.add(spine);

      const railA = new THREE.Mesh(new THREE.BoxGeometry(17.5, 0.045, 0.055), metal);
      railA.position.set(0, -0.42, 0.26);
      const railB = railA.clone();
      railB.position.z = -0.26;
      world.add(railA, railB);

      // STATION 01 — grain intake / hopper
      const hopperGroup = new THREE.Group();
      hopperGroup.position.x = -6.2;
      world.add(hopperGroup);

      const hopper = cast(new THREE.Mesh(
        new THREE.CylinderGeometry(0.58, 1.25, 1.55, 6, 1, false),
        metal,
      ));
      hopper.position.y = 1.15;
      hopperGroup.add(hopper);

      const hopperNeck = cast(new THREE.Mesh(
        new THREE.CylinderGeometry(0.23, 0.23, 0.65, 16),
        darkMetal,
      ));
      hopperNeck.position.y = 0.15;
      hopperGroup.add(hopperNeck);

      const grainGeometry = new THREE.SphereGeometry(0.07, 8, 6);
      const grainCount = lowPower ? 54 : mobile ? 90 : 180;
      const grainMesh = new THREE.InstancedMesh(grainGeometry, grainMat, grainCount);
      const dummy = new THREE.Object3D();
      const grainSeed: Array<{ x: number; y: number; z: number; s: number; phase: number }> = [];
      for (let i = 0; i < grainCount; i++) {
        const a = (i * 12.9898) % 6.283;
        const r = 0.15 + ((i * 0.618) % 1) * 1.2;
        grainSeed.push({
          x: Math.cos(a) * r,
          y: 2.0 + ((i * 0.173) % 1) * 4.8,
          z: Math.sin(a) * r * 0.62,
          s: 0.7 + ((i * 0.31) % 1) * 0.9,
          phase: (i * 0.137) % 1,
        });
      }
      hopperGroup.add(grainMesh);

      // STATION 02 — feed processing chamber / auger
      const processGroup = new THREE.Group();
      processGroup.position.x = -1.9;
      world.add(processGroup);

      const chamber = cast(new THREE.Mesh(
        new THREE.CylinderGeometry(1.15, 1.15, 2.85, 28),
        green,
      ));
      chamber.rotation.z = Math.PI / 2;
      chamber.position.y = 0.95;
      processGroup.add(chamber);

      const chamberRing = new THREE.TorusGeometry(1.17, 0.055, 8, 28);
      for (const x of [-1.1, -0.38, 0.38, 1.1]) {
        const ring = new THREE.Mesh(chamberRing, metal);
        ring.rotation.y = Math.PI / 2;
        ring.position.set(x, 0.95, 0);
        processGroup.add(ring);
      }

      const auger = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.38, 0.055, mobile ? 72 : 120, 8, 2, 5),
        amber,
      );
      auger.rotation.z = Math.PI / 2;
      auger.scale.x = 1.9;
      auger.position.y = 0.95;
      processGroup.add(auger);

      const pelletGeometry = new THREE.CylinderGeometry(0.045, 0.045, 0.13, 8);
      const pelletCount = lowPower ? 24 : mobile ? 36 : 72;
      const pellets = new THREE.InstancedMesh(pelletGeometry, amber, pelletCount);
      processGroup.add(pellets);

      // STATION 03 — egg handling / grading
      const eggGroup = new THREE.Group();
      eggGroup.position.x = 2.45;
      world.add(eggGroup);

      const rollerGeometry = new THREE.CylinderGeometry(0.085, 0.085, 1.05, 14);
      for (let i = 0; i < (lowPower ? 7 : mobile ? 9 : 15); i++) {
        const roller = new THREE.Mesh(rollerGeometry, metal);
        roller.rotation.x = Math.PI / 2;
        roller.position.set(-1.8 + i * 0.27, -0.30, 0);
        eggGroup.add(roller);
      }

      const eggGeometry = createEggGeometry(THREE);
      const eggs: any[] = [];
      for (let i = 0; i < (lowPower ? 4 : mobile ? 5 : 8); i++) {
        const egg = cast(new THREE.Mesh(eggGeometry, cream));
        egg.scale.setScalar(0.44);
        egg.position.y = 0.10;
        eggs.push(egg);
        eggGroup.add(egg);
      }

      const scanner = cast(new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 1.25, 1.35),
        darkMetal,
      ));
      scanner.position.set(0.75, 0.20, 0);
      eggGroup.add(scanner);

      const scannerGlow = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.055, 1.15),
        amber,
      );
      scannerGlow.position.set(0.75, 0.42, 0);
      eggGroup.add(scannerGlow);

      // STATION 04 — pack / dispatch
      const dispatchGroup = new THREE.Group();
      dispatchGroup.position.x = 6.3;
      world.add(dispatchGroup);

      for (let i = 0; i < 3; i++) {
        const pack = cast(new THREE.Mesh(
          new THREE.BoxGeometry(1.35, 0.32, 1.12),
          carton,
        ));
        pack.position.set((i - 1) * 0.92, -0.18 + i * 0.34, 0);
        pack.rotation.y = (i - 1) * 0.06;
        dispatchGroup.add(pack);

        for (let j = 0; j < 6; j++) {
          const egg = new THREE.Mesh(eggGeometry, cream);
          egg.scale.setScalar(0.19);
          egg.position.set(
            (i - 1) * 0.92 - 0.38 + (j % 3) * 0.38,
            0.06 + i * 0.34,
            -0.22 + Math.floor(j / 3) * 0.44,
          );
          dispatchGroup.add(egg);
        }
      }

      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 2.6, 12),
        amber,
      );
      beacon.position.set(1.75, 0.66, 0);
      dispatchGroup.add(beacon);

      const node = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 12), amber);
      node.position.set(1.75, 2.0, 0);
      dispatchGroup.add(node);

      // World floor and light architecture.
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(25, 18),
        new THREE.MeshStandardMaterial({ color: 0x0b120d, roughness: 0.96, metalness: 0.0 }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.76;
      floor.receiveShadow = true;
      world.add(floor);

      const hemi = new THREE.HemisphereLight(0xb8c3b9, 0x071008, mobile ? 1.6 : 1.85);
      scene.add(hemi);

      const key = new THREE.DirectionalLight(0xffe2b0, mobile ? 2.8 : 3.6);
      key.position.set(-5, 9, 7);
      key.castShadow = !mobile;
      if (!mobile) {
        key.shadow.mapSize.set(1024, 1024);
        key.shadow.camera.left = -12;
        key.shadow.camera.right = 12;
        key.shadow.camera.top = 10;
        key.shadow.camera.bottom = -8;
        key.shadow.camera.near = 0.5;
        key.shadow.camera.far = 35;
        key.shadow.bias = -0.0004;
      }
      scene.add(key);

      const warm = new THREE.PointLight(0xf3a526, 14, 11, 2);
      warm.position.set(-1, 2.6, 3.6);
      scene.add(warm);

      const edge = new THREE.DirectionalLight(0x477a5e, 1.7);
      edge.position.set(9, 5, -7);
      scene.add(edge);

      let raf = 0;
      let visible = true;
      let pageVisible = !document.hidden;
      let progress = 0;
      let pointerX = 0;
      let pointerY = 0;
      let targetX = 0;
      let targetY = 0;
      let markedReady = false;
      let lastRenderTime = 0;
      let canvasWidth = 0;
      let canvasHeight = 0;
      const clock = new THREE.Clock();

      const updateProgress = () => {
        const rect = rootEl.getBoundingClientRect();
        const viewport = Math.max(window.innerHeight, 1);
        const distance = Math.max(0, -rect.top);
        const travelStart = viewport * 0.72;
        const travelEnd = Math.max(rootEl.offsetHeight - viewport * 0.82, travelStart + 1);
        progress = Math.min(Math.max((distance - travelStart) / (travelEnd - travelStart), 0), 1);

        let nextStep = 0;
        let nearest = Number.POSITIVE_INFINITY;
        const focusLine = viewport * (mobile ? 0.46 : 0.50);
        stepEls.forEach((step, index) => {
          const stepRect = step.getBoundingClientRect();
          const center = stepRect.top + stepRect.height * 0.46;
          const delta = Math.abs(center - focusLine);
          if (delta < nearest) {
            nearest = delta;
            nextStep = index;
          }
        });

        setActiveStep((current) => (current === nextStep ? current : nextStep));
        const nextPastIntro = distance > viewport * 0.62;
        setPastIntro((current) => (current === nextPastIntro ? current : nextPastIntro));
      };

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(2, Math.round(rect.width));
        const height = Math.max(2, Math.round(rect.height));
        if (width === canvasWidth && height === canvasHeight) return;
        canvasWidth = width;
        canvasHeight = height;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      const render = () => {
        raf = 0;
        if (!visible || !pageVisible) return;
        resize();

        pointerX += (targetX - pointerX) * 0.045;
        pointerY += (targetY - pointerY) * 0.045;
        const elapsed = reducedMotion ? 0 : clock.getElapsedTime();

        // The camera physically travels down the production spine.
        const travelX = THREE.MathUtils.lerp(-6.1, 6.25, progress);
        camera.position.x = travelX + (mobile ? 4.8 : 5.9) + pointerX * 0.22;
        camera.position.y = baseY + pointerY * 0.16 + Math.sin(progress * Math.PI) * 0.45;
        camera.position.z = (mobile ? 11.2 : 12.4) - Math.sin(progress * Math.PI) * 1.6;
        camera.lookAt(travelX + 0.55, 0.45, pointerX * -0.16);

        world.rotation.y = pointerX * 0.012;

        for (let i = 0; i < grainCount; i++) {
          const seed = grainSeed[i];
          const fall = (seed.phase + elapsed * 0.12) % 1;
          dummy.position.set(seed.x, seed.y - fall * 5.4, seed.z);
          dummy.scale.set(seed.s * 0.65, seed.s, seed.s * 0.55);
          dummy.rotation.set(0.4 + i * 0.1, elapsed * 0.4 + i, 0.2);
          dummy.updateMatrix();
          grainMesh.setMatrixAt(i, dummy.matrix);
        }
        grainMesh.instanceMatrix.needsUpdate = true;

        for (let i = 0; i < pelletCount; i++) {
          const t = ((i / pelletCount) + elapsed * 0.055) % 1;
          dummy.position.set(-1.32 + t * 2.64, 0.58 + Math.sin(t * Math.PI * 7) * 0.07, ((i % 3) - 1) * 0.15);
          dummy.rotation.set(Math.PI / 2, 0, t * Math.PI * 4);
          dummy.scale.setScalar(0.9);
          dummy.updateMatrix();
          pellets.setMatrixAt(i, dummy.matrix);
        }
        pellets.instanceMatrix.needsUpdate = true;
        auger.rotation.x = elapsed * 0.22;

        eggs.forEach((egg, index) => {
          const t = ((index / eggs.length) + elapsed * 0.018) % 1;
          egg.position.x = -1.72 + t * 3.1;
          egg.position.z = Math.sin((t + index) * 5.2) * 0.05;
          egg.rotation.y = t * Math.PI * 0.22;
        });

        renderer.render(scene, camera);
        if (!markedReady) {
          markedReady = true;
          setReady(true);
        }
      };

      const loop = (time: number) => {
        raf = 0;
        if (!visible || !pageVisible) return;
        const minFrameGap = lowPower ? 32 : mobile ? 24 : 0;
        if (!minFrameGap || time - lastRenderTime >= minFrameGap) {
          lastRenderTime = time;
          render();
        }
        if (!reducedMotion) raf = requestAnimationFrame(loop);
      };

      const ensureFrame = () => {
        if (!raf && visible && pageVisible) {
          raf = reducedMotion ? requestAnimationFrame(() => render()) : requestAnimationFrame(loop);
        }
      };

      const onPointerMove = (event: PointerEvent) => {
        targetX = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
        targetY = -(event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
        if (reducedMotion) ensureFrame();
      };

      const onScroll = () => {
        updateProgress();
        if (reducedMotion) ensureFrame();
      };

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
      }, { rootMargin: "200px" });
      observer.observe(rootEl);

      const resizeObserver = new ResizeObserver(() => ensureFrame());
      resizeObserver.observe(canvas);
      if (!mobile) window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      updateProgress();
      ensureFrame();

      cleanup = () => {
        observer.disconnect();
        resizeObserver.disconnect();
        if (!mobile) window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("scroll", onScroll);
        document.removeEventListener("visibilitychange", onVisibility);
        if (raf) cancelAnimationFrame(raf);
        scene.traverse((object: any) => {
          object.geometry?.dispose?.();
          if (object.material) {
            const mats = Array.isArray(object.material) ? object.material : [object.material];
            mats.forEach((material: any) => material.dispose?.());
          }
        });
        renderer.dispose();
      };
    };

    void boot();
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <section ref={rootRef} className="material-journey" id="proizvodnja" aria-labelledby="journey-title">
      <div className="journey-sticky">
        <canvas ref={canvasRef} className={`journey-canvas ${ready ? "is-ready" : ""}`} aria-hidden="true" />
        <div className="journey-haze" aria-hidden="true" />
        <div className="journey-grid" aria-hidden="true" />

        <div className={`journey-intro ${pastIntro ? "is-past" : ""}`}>
          <span className="journey-overline">AGROMONT / PROIZVODNI SISTEM</span>
          <h1 id="journey-title">
            Od sirovine
            <br />
            do <em>tržišta.</em>
          </h1>
          <p>
            Žitarice, stočna hrana, farme, pakovanje i distribucija povezani su u jedan proizvodni sistem.
          </p>
          <div className="journey-actions">
            <a href="#sistem">Pratite tok <span aria-hidden="true">↓</span></a>
            <a href="#proizvodi">Pogledajte program ↗</a>
          </div>
        </div>

        <div className="journey-status" aria-hidden="true">
          <span>0{activeStep + 1} / 04</span>
          <strong>{steps[activeStep]?.eyebrow}</strong>
        </div>
        <div className="journey-progress" aria-hidden="true">
          {steps.map((step, index) => (
            <i key={step.index} className={index <= activeStep ? "is-active" : ""} />
          ))}
        </div>
      </div>

      <div className="journey-copy" id="sistem">
        {steps.map((step, index) => (
          <article className={`journey-step ${index === activeStep ? "is-active" : ""}`} key={step.index}>
            <div className="journey-step-number">{step.index}</div>
            <div>
              <span>{step.eyebrow}</span>
              <h2>{step.title}</h2>
              <p>{step.text}</p>
              <small>{step.fact}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
