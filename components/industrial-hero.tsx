"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "./brand";

export function IndustrialHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let sceneCleanup: (() => void) | undefined;

    const boot = async () => {
      const THREE = await import("three");
      if (disposed) return;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const mobile = window.innerWidth < 760;

      let renderer;
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

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.35));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.shadowMap.enabled = !mobile;
      if (!mobile) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0x07110b, 1);

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x07110b, mobile ? 0.060 : 0.050);

      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
      const baseCamera = new THREE.Vector3(mobile ? 6.3 : 7.8, mobile ? 4.0 : 4.8, mobile ? 11.8 : 12.6);
      const target = new THREE.Vector3(mobile ? 2.7 : 2.45, 0.8, -1.1);
      camera.position.copy(baseCamera);
      camera.lookAt(target);

      const root = new THREE.Group();
      root.position.set(mobile ? 0.5 : 0.9, -1.1, -0.2);
      scene.add(root);

      const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x101c14,
        roughness: 0.94,
        metalness: 0.02,
      });
      const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x21472e,
        roughness: 0.72,
        metalness: 0.06,
      });
      const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0xa9aea5,
        roughness: 0.45,
        metalness: 0.46,
      });
      const metalMaterial = new THREE.MeshStandardMaterial({
        color: 0x88918b,
        roughness: 0.36,
        metalness: 0.72,
      });
      const pipeMaterial = new THREE.MeshStandardMaterial({
        color: 0xb1b7b0,
        roughness: 0.30,
        metalness: 0.76,
      });
      const solarMaterial = new THREE.MeshStandardMaterial({
        color: 0x13252b,
        roughness: 0.28,
        metalness: 0.56,
      });
      const darkMaterial = new THREE.MeshStandardMaterial({
        color: 0x0d120f,
        roughness: 0.74,
        metalness: 0.20,
      });
      const orangeMaterial = new THREE.MeshStandardMaterial({
        color: 0xe8931d,
        emissive: 0x8f3d04,
        emissiveIntensity: 0.85,
        roughness: 0.34,
        metalness: 0.18,
      });
      const eggMaterial = new THREE.MeshStandardMaterial({
        color: 0xe8dcc1,
        roughness: 0.58,
        metalness: 0.0,
      });

      const ground = new THREE.Mesh(new THREE.PlaneGeometry(34, 28), groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.set(2.8, 0, -2.2);
      ground.receiveShadow = true;
      root.add(ground);

      const yard = new THREE.Mesh(
        new THREE.PlaneGeometry(12.5, 9.5),
        new THREE.MeshStandardMaterial({ color: 0x27302a, roughness: 0.90, metalness: 0.03 }),
      );
      yard.rotation.x = -Math.PI / 2;
      yard.position.set(2.6, 0.012, -0.9);
      yard.receiveShadow = true;
      root.add(yard);

      const markAsShadowCaster = (mesh: any) => {
        mesh.castShadow = !mobile;
        mesh.receiveShadow = true;
        return mesh;
      };

      const hallBodyGeometry = new THREE.BoxGeometry(2.55, 1.28, mobile ? 5.2 : 6.4);
      const roofGeometry = new THREE.BoxGeometry(1.55, 0.11, mobile ? 5.35 : 6.55);
      const panelGeometry = new THREE.BoxGeometry(0.72, 0.045, 0.88);

      const hallCount = mobile ? 2 : 3;
      for (let i = 0; i < hallCount; i++) {
        const hall = new THREE.Group();
        hall.position.set(0.15 + i * 2.85, 0.65, -3.05 - i * 0.12);

        const body = markAsShadowCaster(new THREE.Mesh(hallBodyGeometry, wallMaterial));
        body.position.y = 0.64;
        hall.add(body);

        const roofLeft = markAsShadowCaster(new THREE.Mesh(roofGeometry, roofMaterial));
        roofLeft.rotation.z = -0.39;
        roofLeft.position.set(-0.61, 1.48, 0);
        hall.add(roofLeft);

        const roofRight = markAsShadowCaster(new THREE.Mesh(roofGeometry, roofMaterial));
        roofRight.rotation.z = 0.39;
        roofRight.position.set(0.61, 1.48, 0);
        hall.add(roofRight);

        const panelCount = mobile ? 3 : 5;
        for (let j = 0; j < panelCount; j++) {
          const panel = new THREE.Mesh(panelGeometry, solarMaterial);
          panel.position.set(0.73, 1.64, -1.85 + j * 0.92);
          panel.rotation.z = 0.39;
          hall.add(panel);
        }

        // Front ventilation / service details make each hall read as a real facility.
        for (let j = 0; j < 3; j++) {
          const vent = new THREE.Mesh(
            new THREE.CylinderGeometry(0.13, 0.13, 0.08, 18),
            darkMaterial,
          );
          vent.rotation.x = Math.PI / 2;
          vent.position.set(-0.62 + j * 0.62, 0.78, (mobile ? 5.2 : 6.4) * 0.5 + 0.05);
          hall.add(vent);
        }

        root.add(hall);
      }

      const siloGroup = new THREE.Group();
      siloGroup.position.set(mobile ? 3.6 : 5.2, 0, 1.15);
      root.add(siloGroup);

      const siloBodyGeometry = new THREE.CylinderGeometry(0.50, 0.50, 2.25, 28, 1, false);
      const siloCapGeometry = new THREE.CylinderGeometry(0.02, 0.53, 0.52, 28);
      const siloHopperGeometry = new THREE.CylinderGeometry(0.18, 0.48, 0.62, 24);
      const legGeometry = new THREE.CylinderGeometry(0.032, 0.032, 0.88, 8);
      const ringGeometry = new THREE.TorusGeometry(0.505, 0.014, 6, 24);

      const siloCount = mobile ? 2 : 3;
      for (let i = 0; i < siloCount; i++) {
        const silo = new THREE.Group();
        silo.position.x = i * 1.15;

        const body = markAsShadowCaster(new THREE.Mesh(siloBodyGeometry, metalMaterial));
        body.position.y = 2.0;
        silo.add(body);

        const cap = markAsShadowCaster(new THREE.Mesh(siloCapGeometry, metalMaterial));
        cap.position.y = 3.38;
        silo.add(cap);

        const hopper = markAsShadowCaster(new THREE.Mesh(siloHopperGeometry, metalMaterial));
        hopper.position.y = 0.75;
        silo.add(hopper);

        for (const x of [-0.31, 0.31]) {
          for (const z of [-0.24, 0.24]) {
            const leg = new THREE.Mesh(legGeometry, metalMaterial);
            leg.position.set(x, 0.44, z);
            silo.add(leg);
          }
        }

        for (let r = 0; r < 6; r++) {
          const ring = new THREE.Mesh(ringGeometry, pipeMaterial);
          ring.rotation.x = Math.PI / 2;
          ring.position.y = 1.15 + r * 0.36;
          silo.add(ring);
        }

        siloGroup.add(silo);
      }

      const feedCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(mobile ? 4.0 : 5.5, 3.45, 1.2),
        new THREE.Vector3(mobile ? 3.7 : 5.1, 4.05, 0.0),
        new THREE.Vector3(mobile ? 3.0 : 4.3, 3.55, -1.55),
        new THREE.Vector3(mobile ? 2.3 : 3.2, 2.75, -2.55),
      ]);
      const feedPipe = markAsShadowCaster(new THREE.Mesh(
        new THREE.TubeGeometry(feedCurve, mobile ? 26 : 40, 0.085, 10, false),
        pipeMaterial,
      ));
      root.add(feedPipe);

      const flowBeads: any[] = [];
      const flowCount = mobile ? 3 : 6;
      const beadGeometry = new THREE.SphereGeometry(0.095, 14, 10);
      for (let i = 0; i < flowCount; i++) {
        const bead = new THREE.Mesh(beadGeometry, orangeMaterial);
        flowBeads.push(bead);
        root.add(bead);
      }

      const conveyor = new THREE.Group();
      conveyor.position.set(mobile ? 2.3 : 2.7, 0.44, 3.0);
      root.add(conveyor);

      const belt = markAsShadowCaster(new THREE.Mesh(
        new THREE.BoxGeometry(mobile ? 4.0 : 5.4, 0.22, 0.88),
        darkMaterial,
      ));
      conveyor.add(belt);

      const railGeometry = new THREE.BoxGeometry(mobile ? 4.05 : 5.45, 0.07, 0.07);
      for (const z of [-0.48, 0.48]) {
        const rail = new THREE.Mesh(railGeometry, metalMaterial);
        rail.position.set(0, 0.27, z);
        conveyor.add(rail);
      }

      const eggProfile = [
        new THREE.Vector2(0.00, -0.48),
        new THREE.Vector2(0.22, -0.44),
        new THREE.Vector2(0.34, -0.24),
        new THREE.Vector2(0.38, 0.02),
        new THREE.Vector2(0.32, 0.27),
        new THREE.Vector2(0.19, 0.46),
        new THREE.Vector2(0.00, 0.55),
      ];
      const eggGeometry = new THREE.LatheGeometry(eggProfile, 24);
      const eggs: any[] = [];
      const eggCount = mobile ? 5 : 8;
      for (let i = 0; i < eggCount; i++) {
        const egg = markAsShadowCaster(new THREE.Mesh(eggGeometry, eggMaterial));
        egg.scale.setScalar(0.72);
        eggs.push(egg);
        conveyor.add(egg);
      }

      const packingBox = markAsShadowCaster(new THREE.Mesh(
        new THREE.BoxGeometry(1.45, 1.25, 1.45),
        wallMaterial,
      ));
      packingBox.position.set(mobile ? -2.65 : -3.55, 0.51, 0);
      conveyor.add(packingBox);

      const packingStripe = new THREE.Mesh(
        new THREE.BoxGeometry(1.49, 0.16, 1.49),
        orangeMaterial,
      );
      packingStripe.position.set(mobile ? -2.65 : -3.55, 0.74, 0);
      conveyor.add(packingStripe);

      const hemi = new THREE.HemisphereLight(0xa7bbb0, 0x061009, mobile ? 1.65 : 1.85);
      scene.add(hemi);

      const key = new THREE.DirectionalLight(0xffe1b5, mobile ? 3.2 : 3.8);
      key.position.set(-4.5, 9.0, 7.0);
      key.castShadow = !mobile;
      if (!mobile) {
        key.shadow.mapSize.set(1024, 1024);
        key.shadow.camera.near = 0.5;
        key.shadow.camera.far = 32;
        key.shadow.camera.left = -10;
        key.shadow.camera.right = 10;
        key.shadow.camera.top = 10;
        key.shadow.camera.bottom = -10;
        key.shadow.bias = -0.00035;
      }
      scene.add(key);

      const rim = new THREE.DirectionalLight(0x7fa284, 1.25);
      rim.position.set(8, 5, -8);
      scene.add(rim);

      const warm = new THREE.PointLight(0xe8931d, 18, 8, 2);
      warm.position.set(mobile ? 2.8 : 4.7, 2.2, 2.2);
      scene.add(warm);

      let active = true;
      let pageVisible = !document.hidden;
      let raf = 0;
      let pointerX = 0;
      let pointerY = 0;
      let targetX = 0;
      let targetY = 0;
      let scrollProgress = 0;
      const clock = new THREE.Clock();
      let markedReady = false;

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(2, Math.round(rect.width));
        const height = Math.max(2, Math.round(rect.height));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      const draw = () => {
        resize();
        pointerX += (targetX - pointerX) * 0.045;
        pointerY += (targetY - pointerY) * 0.045;

        const elapsed = reducedMotion ? 0 : clock.getElapsedTime();
        root.rotation.y = -0.055 + pointerX * 0.018;
        root.rotation.x = pointerY * 0.006;

        camera.position.set(
          baseCamera.x + pointerX * 0.28,
          baseCamera.y + pointerY * 0.15 + scrollProgress * 0.25,
          baseCamera.z - scrollProgress * 0.72,
        );
        camera.lookAt(target.x + pointerX * 0.10, target.y, target.z - scrollProgress * 0.12);

        flowBeads.forEach((bead, index) => {
          const t = (elapsed * 0.075 + index / flowBeads.length) % 1;
          bead.position.copy(feedCurve.getPointAt(t));
        });

        const travel = mobile ? 3.2 : 4.5;
        eggs.forEach((egg, index) => {
          const phase = ((index / eggs.length) + elapsed * 0.022) % 1;
          egg.position.set(-travel * 0.5 + phase * travel, 0.46, 0);
          egg.rotation.y = phase * Math.PI * 0.30;
        });

        renderer.render(scene, camera);
        if (!markedReady) {
          markedReady = true;
          setReady(true);
        }
      };

      const loop = () => {
        raf = 0;
        if (!active || !pageVisible) return;
        draw();
        if (!reducedMotion) raf = requestAnimationFrame(loop);
      };

      const requestFrame = () => {
        if (!raf && active && pageVisible) raf = requestAnimationFrame(loop);
      };

      const onPointerMove = (event: PointerEvent) => {
        targetX = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
        targetY = -(event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
        if (reducedMotion) requestFrame();
      };

      const onScroll = () => {
        scrollProgress = Math.min(Math.max(window.scrollY / Math.max(window.innerHeight, 1), 0), 1.1);
        if (reducedMotion) requestFrame();
      };

      const onVisibility = () => {
        pageVisible = !document.hidden;
        if (pageVisible) requestFrame();
      };

      const observer = new IntersectionObserver(
        ([entry]) => {
          active = entry.isIntersecting;
          if (active) requestFrame();
          else if (raf) {
            cancelAnimationFrame(raf);
            raf = 0;
          }
        },
        { rootMargin: "180px" },
      );
      observer.observe(canvas);

      const resizeObserver = new ResizeObserver(() => requestFrame());
      resizeObserver.observe(canvas);
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      onScroll();
      requestFrame();

      sceneCleanup = () => {
        observer.disconnect();
        resizeObserver.disconnect();
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("scroll", onScroll);
        document.removeEventListener("visibilitychange", onVisibility);
        if (raf) cancelAnimationFrame(raf);
        scene.traverse((object: any) => {
          if (object.geometry?.dispose) object.geometry.dispose();
          if (object.material) {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material: any) => material.dispose?.());
          }
        });
        renderer.dispose();
      };
    };

    void boot();

    return () => {
      disposed = true;
      sceneCleanup?.();
    };
  }, []);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <Image
        className="hero-fallback"
        src="/images/agromont-hero.png"
        alt="Ilustrativni prikaz AgroMont proizvodnog sistema sa silosima, farmom i pakovanjem jaja"
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
