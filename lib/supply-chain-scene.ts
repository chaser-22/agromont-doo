export type SupplySceneOptions = {
  mobile: boolean;
  lowPower: boolean;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = clamp01((value - edge0) / Math.max(edge1 - edge0, 0.0001));
  return x * x * (3 - 2 * x);
}

function makeNoiseTexture(THREE: any, size = 96, seed = 17) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const image = ctx.createImageData(size, size);
  let state = seed >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967295;
  };

  for (let i = 0; i < image.data.length; i += 4) {
    const value = Math.round(118 + random() * 82);
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 5);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

function makePitchedHallGeometry(THREE: any, length = 13, width = 4.8, wall = 2.5, roof = 1.35) {
  const l = length / 2;
  const w = width / 2;
  const vertices = new Float32Array([
    -l, 0, -w, l, 0, -w, l, 0, w, -l, 0, w,
    -l, wall, -w, l, wall, -w, l, wall, w, -l, wall, w,
    -l, wall + roof, 0, l, wall + roof, 0,
  ]);
  const indices = [
    0, 1, 5, 0, 5, 4,
    3, 7, 6, 3, 6, 2,
    0, 4, 7, 0, 7, 3,
    1, 2, 6, 1, 6, 5,
    4, 5, 9, 4, 9, 8,
    7, 8, 9, 7, 9, 6,
    0, 3, 2, 0, 2, 1,
    4, 8, 7, 5, 6, 9,
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeEggGeometry(THREE: any) {
  return new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0, -0.58),
      new THREE.Vector2(0.22, -0.53),
      new THREE.Vector2(0.36, -0.29),
      new THREE.Vector2(0.405, 0.02),
      new THREE.Vector2(0.33, 0.31),
      new THREE.Vector2(0.18, 0.50),
      new THREE.Vector2(0.0, 0.62),
    ],
    32,
  );
}

function addShadow(mesh: any, shadows: boolean) {
  mesh.castShadow = shadows;
  mesh.receiveShadow = shadows;
  return mesh;
}

function createSilo(THREE: any, materials: any, shadows: boolean, radius = 1.35, height = 7.6) {
  const group = new THREE.Group();

  const body = addShadow(
    new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 48), materials.galvanized),
    shadows,
  );
  body.position.y = height / 2;
  group.add(body);

  const roof = addShadow(
    new THREE.Mesh(new THREE.ConeGeometry(radius * 1.015, radius * 0.95, 48), materials.galvanized),
    shadows,
  );
  roof.position.y = height + radius * 0.45;
  group.add(roof);

  for (const y of [height * 0.28, height * 0.58, height * 0.85]) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.01, 0.035, 8, 48),
      materials.darkMetal,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    group.add(ring);
  }

  const ladderRailGeometry = new THREE.BoxGeometry(0.035, height * 0.83, 0.035);
  for (const z of [-0.17, 0.17]) {
    const rail = new THREE.Mesh(ladderRailGeometry, materials.darkMetal);
    rail.position.set(radius + 0.06, height * 0.47, z);
    group.add(rail);
  }
  const rungGeometry = new THREE.BoxGeometry(0.04, 0.03, 0.38);
  for (let i = 0; i < 18; i++) {
    const rung = new THREE.Mesh(rungGeometry, materials.darkMetal);
    rung.position.set(radius + 0.06, 0.65 + i * 0.31, 0);
    group.add(rung);
  }

  return group;
}

function createTruck(THREE: any, materials: any, shadows: boolean) {
  const group = new THREE.Group();
  const cargo = addShadow(new THREE.Mesh(new THREE.BoxGeometry(5.7, 2.3, 2.35), materials.offWhite), shadows);
  cargo.position.set(1.9, 1.45, 0);
  group.add(cargo);

  const cab = addShadow(new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.1, 2.2), materials.green), shadows);
  cab.position.set(-2.0, 1.35, 0);
  group.add(cab);

  const windscreen = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.78, 1.62), materials.glass);
  windscreen.position.set(-2.97, 1.72, 0);
  group.add(windscreen);

  const wheelGeometry = new THREE.CylinderGeometry(0.44, 0.44, 0.25, 24);
  for (const x of [-2.15, 0.55, 2.65]) {
    for (const z of [-1.12, 1.12]) {
      const wheel = new THREE.Mesh(wheelGeometry, materials.rubber);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.43, z);
      group.add(wheel);
    }
  }

  return group;
}

export function buildSupplyChainScene(THREE: any, options: SupplySceneOptions) {
  const { mobile, lowPower } = options;
  const shadows = !mobile;

  const roughnessNoise = makeNoiseTexture(THREE, lowPower ? 48 : 96, 41);
  const concreteNoise = makeNoiseTexture(THREE, lowPower ? 48 : 96, 93);
  if (concreteNoise) concreteNoise.repeat.set(9, 5);

  const materials = {
    galvanized: new THREE.MeshStandardMaterial({
      color: 0x9ba39e,
      roughness: 0.35,
      metalness: 0.78,
      roughnessMap: roughnessNoise,
    }),
    darkMetal: new THREE.MeshStandardMaterial({
      color: 0x1b211e,
      roughness: 0.48,
      metalness: 0.62,
      roughnessMap: roughnessNoise,
    }),
    green: new THREE.MeshStandardMaterial({
      color: 0x173f2b,
      roughness: 0.58,
      metalness: 0.12,
      roughnessMap: roughnessNoise,
    }),
    greenCutaway: new THREE.MeshPhysicalMaterial({
      color: 0x173f2b,
      roughness: 0.44,
      metalness: 0.18,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    }),
    concrete: new THREE.MeshStandardMaterial({
      color: 0x787b73,
      roughness: 0.96,
      metalness: 0,
      roughnessMap: concreteNoise,
    }),
    offWhite: new THREE.MeshStandardMaterial({
      color: 0xe6dfce,
      roughness: 0.72,
      metalness: 0.02,
      roughnessMap: roughnessNoise,
    }),
    carton: new THREE.MeshStandardMaterial({
      color: 0x837969,
      roughness: 0.94,
      metalness: 0,
      roughnessMap: roughnessNoise,
    }),
    amber: new THREE.MeshStandardMaterial({
      color: 0xf0a128,
      emissive: 0x6f2500,
      emissiveIntensity: 0.48,
      roughness: 0.38,
      metalness: 0.16,
    }),
    grain: new THREE.MeshStandardMaterial({
      color: 0xbf8437,
      roughness: 0.72,
      metalness: 0,
    }),
    egg: new THREE.MeshPhysicalMaterial({
      color: 0xf0e6cd,
      roughness: 0.48,
      metalness: 0,
      clearcoat: 0.08,
      clearcoatRoughness: 0.74,
    }),
    rubber: new THREE.MeshStandardMaterial({
      color: 0x0c0e0d,
      roughness: 0.9,
      metalness: 0,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x91a7a0,
      roughness: 0.18,
      metalness: 0,
      transparent: true,
      opacity: 0.48,
      transmission: lowPower ? 0 : 0.25,
    }),
  };

  const world = new THREE.Group();
  world.name = "AgromontSupplySystem";

  const yard = addShadow(new THREE.Mesh(new THREE.BoxGeometry(46, 0.35, 25), materials.concrete), shadows);
  yard.position.set(1, -0.32, 0);
  world.add(yard);

  const serviceLane = new THREE.Mesh(new THREE.BoxGeometry(41, 0.025, 4.9), materials.darkMetal);
  serviceLane.position.set(1, -0.13, 7.4);
  world.add(serviceLane);

  // Grain intake + elevator
  const intake = new THREE.Group();
  intake.position.set(-17.0, 0, -1.8);
  world.add(intake);

  const intakeHouse = addShadow(new THREE.Mesh(new THREE.BoxGeometry(5.9, 2.6, 5.5), materials.green), shadows);
  intakeHouse.position.y = 1.15;
  intake.add(intakeHouse);

  const intakePit = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.12, 3.0), materials.darkMetal);
  intakePit.position.set(0, 0.08, 1.25);
  intake.add(intakePit);

  const elevatorTower = addShadow(new THREE.Mesh(new THREE.BoxGeometry(2.15, 9.6, 2.15), materials.galvanized), shadows);
  elevatorTower.position.set(4.1, 4.65, -0.4);
  intake.add(elevatorTower);

  const elevatorCap = addShadow(new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.9, 2.75), materials.darkMetal), shadows);
  elevatorCap.position.set(4.1, 9.85, -0.4);
  intake.add(elevatorCap);

  // Silo field
  const siloCluster = new THREE.Group();
  siloCluster.position.set(-8.8, 0, -4.0);
  world.add(siloCluster);
  const siloCount = lowPower ? 2 : 3;
  for (let i = 0; i < siloCount; i++) {
    const silo = createSilo(THREE, materials, shadows, mobile ? 1.12 : 1.32, mobile ? 6.6 : 7.7);
    silo.position.x = i * (mobile ? 2.75 : 3.25);
    siloCluster.add(silo);
  }

  const grainBridge = addShadow(new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.46, 0.68), materials.darkMetal), shadows);
  grainBridge.position.set(-10.2, 9.0, -3.0);
  grainBridge.rotation.z = -0.08;
  world.add(grainBridge);

  for (const x of [-13.4, -10.0, -6.6]) {
    const support = new THREE.Mesh(new THREE.BoxGeometry(0.14, 7.7, 0.14), materials.galvanized);
    support.position.set(x, 4.1, -3.0);
    world.add(support);
  }

  // Feed mill
  const feedMill = new THREE.Group();
  feedMill.position.set(1.5, 0, -2.2);
  world.add(feedMill);

  const feedMain = addShadow(new THREE.Mesh(new THREE.BoxGeometry(7.6, 7.4, 6.1), materials.greenCutaway), shadows);
  feedMain.position.y = 3.45;
  feedMill.add(feedMain);

  const feedUpper = addShadow(new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.7, 4.0), materials.galvanized), shadows);
  feedUpper.position.set(0, 9.0, 0);
  feedMill.add(feedUpper);

  const feedCap = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.45, 4.8), materials.darkMetal);
  feedCap.position.set(0, 11.55, 0);
  feedMill.add(feedCap);

  const processVessels: any[] = [];
  for (const z of [-1.8, 0, 1.8]) {
    const vessel = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 5.6, 24), materials.galvanized), shadows);
    vessel.position.set(-2.15, 6.3, z);
    feedMill.add(vessel);
    processVessels.push(vessel);
  }

  const processPipeGeometry = new THREE.CylinderGeometry(0.105, 0.105, 5.8, 14);
  for (const y of [3.0, 4.75, 6.5]) {
    const pipe = new THREE.Mesh(processPipeGeometry, materials.amber);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(4.1, y, 0.9);
    feedMill.add(pipe);
  }

  const pelletGeometry = new THREE.CylinderGeometry(0.045, 0.045, 0.16, 8);
  const pelletCount = lowPower ? 24 : mobile ? 42 : 84;
  const pellets = new THREE.InstancedMesh(pelletGeometry, materials.amber, pelletCount);
  feedMill.add(pellets);

  // Farm campus
  const farmCampus = new THREE.Group();
  farmCampus.position.set(15.2, 0, -4.1);
  world.add(farmCampus);

  const farmCount = lowPower ? 2 : 3;
  for (let i = 0; i < farmCount; i++) {
    const hall = addShadow(
      new THREE.Mesh(makePitchedHallGeometry(THREE, mobile ? 10.5 : 13.2, 4.5, 2.5, 1.3), materials.offWhite),
      shadows,
    );
    hall.position.z = i * 5.5;
    farmCampus.add(hall);

    const serviceSilo = createSilo(THREE, materials, shadows, 0.66, 3.8);
    serviceSilo.scale.setScalar(0.95);
    serviceSilo.position.set(-7.1, 0, i * 5.5);
    farmCampus.add(serviceSilo);
  }

  // Sorting + packing
  const sorting = new THREE.Group();
  sorting.position.set(14.5, 0, 6.8);
  world.add(sorting);

  const sortingHall = addShadow(new THREE.Mesh(new THREE.BoxGeometry(10.2, 3.5, 5.0), materials.green), shadows);
  sortingHall.position.y = 1.55;
  sorting.add(sortingHall);

  const glazing = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.72, 0.06), materials.glass);
  glazing.position.set(0, 2.12, -2.53);
  sorting.add(glazing);

  const belt = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.18, 1.05), materials.rubber);
  belt.position.set(-0.4, 1.0, -3.0);
  sorting.add(belt);

  const eggGeometry = makeEggGeometry(THREE);
  const eggs: any[] = [];
  const eggCount = lowPower ? 4 : mobile ? 6 : 9;
  for (let i = 0; i < eggCount; i++) {
    const egg = addShadow(new THREE.Mesh(eggGeometry, materials.egg), shadows);
    egg.scale.setScalar(0.30);
    egg.position.set(-3.7 + i * 0.72, 1.34, -3.0);
    sorting.add(egg);
    eggs.push(egg);
  }

  const scanner = addShadow(new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 1.8), materials.darkMetal), shadows);
  scanner.position.set(1.2, 1.72, -3.0);
  sorting.add(scanner);

  const scanLight = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.045, 1.35), materials.amber);
  scanLight.position.set(1.2, 1.78, -3.0);
  sorting.add(scanLight);

  for (let i = 0; i < 3; i++) {
    const carton = addShadow(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.32, 1.2), materials.carton), shadows);
    carton.position.set(3.7 + i * 0.48, 0.85 + i * 0.27, -3.0 + (i % 2) * 0.12);
    sorting.add(carton);
  }

  // Logistics / loading
  const logistics = new THREE.Group();
  logistics.position.set(3.0, 0, 7.1);
  world.add(logistics);

  const canopy = addShadow(new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.32, 3.5), materials.galvanized), shadows);
  canopy.position.y = 3.4;
  logistics.add(canopy);

  for (const x of [-3.7, -1.25, 1.25, 3.7]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.45, 0.16), materials.galvanized);
    post.position.set(x, 1.58, 0);
    logistics.add(post);
  }

  const truck = createTruck(THREE, materials, shadows);
  truck.position.set(0.4, 0, -0.3);
  truck.rotation.y = Math.PI;
  logistics.add(truck);

  const signalMast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 12), materials.darkMetal);
  signalMast.position.set(-5.4, 1.5, 0);
  logistics.add(signalMast);

  const signal = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 12), materials.amber);
  signal.position.set(-5.4, 3.15, 0);
  logistics.add(signal);

  // Grain material flow: deliberately contextual, not decorative particles.
  const grainGeometry = new THREE.SphereGeometry(0.065, 7, 5);
  const grainCount = lowPower ? 52 : mobile ? 90 : 170;
  const grains = new THREE.InstancedMesh(grainGeometry, materials.grain, grainCount);
  intake.add(grains);
  const dummy = new THREE.Object3D();
  const grainSeeds = Array.from({ length: grainCount }, (_, i) => {
    const a = (i * 2.399963) % (Math.PI * 2);
    const radius = 0.12 + ((i * 0.618033) % 1) * 1.25;
    return {
      x: Math.cos(a) * radius,
      z: 1.35 + Math.sin(a) * radius * 0.46,
      phase: (i * 0.137) % 1,
      size: 0.72 + ((i * 0.31) % 1) * 0.75,
    };
  });

  // Industrial atmosphere. Sparse, slow and scale-oriented.
  const dustCount = lowPower ? 0 : mobile ? 28 : 70;
  let dust: any = null;
  if (dustCount) {
    const positions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      positions[i * 3] = -20 + ((i * 17.17) % 1) * 42;
      positions[i * 3 + 1] = 0.7 + ((i * 9.73) % 1) * 10;
      positions[i * 3 + 2] = -10 + ((i * 7.91) % 1) * 20;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xd8c49a,
      size: mobile ? 0.028 : 0.038,
      transparent: true,
      opacity: 0.17,
      depthWrite: false,
    });
    dust = new THREE.Points(geometry, material);
    world.add(dust);
  }

  const allMaterials = Object.values(materials);

  const update = (elapsed: number, progress: number) => {
    const grainSpeed = 0.19;
    for (let i = 0; i < grainCount; i++) {
      const seed = grainSeeds[i];
      const fall = (seed.phase + elapsed * grainSpeed) % 1;
      dummy.position.set(seed.x, 5.8 - fall * 5.2, seed.z);
      dummy.rotation.set(i * 0.21, elapsed * 0.28 + i, i * 0.07);
      dummy.scale.set(seed.size * 0.72, seed.size, seed.size * 0.58);
      dummy.updateMatrix();
      grains.setMatrixAt(i, dummy.matrix);
    }
    grains.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < pelletCount; i++) {
      const t = ((i / pelletCount) + elapsed * 0.065) % 1;
      dummy.position.set(-2.55 + t * 5.2, 2.0 + Math.sin(t * Math.PI * 8) * 0.07, ((i % 3) - 1) * 0.16);
      dummy.rotation.set(Math.PI / 2, 0, elapsed * 0.8 + i * 0.2);
      dummy.scale.setScalar(0.92);
      dummy.updateMatrix();
      pellets.setMatrixAt(i, dummy.matrix);
    }
    pellets.instanceMatrix.needsUpdate = true;

    eggs.forEach((egg, index) => {
      const t = ((index / eggs.length) + elapsed * 0.035) % 1;
      egg.position.x = -3.8 + t * 7.0;
      egg.position.y = 1.34 + Math.sin(t * Math.PI * 8) * 0.015;
      egg.rotation.z = t * 0.22;
    });

    const cutaway = smoothstep(0.22, 0.31, progress) * (1 - smoothstep(0.47, 0.54, progress));
    materials.greenCutaway.opacity = 1 - cutaway * 0.72;
    materials.greenCutaway.depthWrite = cutaway < 0.2;

    const logisticsSignal = 0.32 + Math.sin(elapsed * 2.2) * 0.16;
    materials.amber.emissiveIntensity = progress > 0.64 ? 0.62 + logisticsSignal : 0.48;

    if (dust) {
      dust.rotation.y = elapsed * 0.004;
      dust.position.y = Math.sin(elapsed * 0.08) * 0.12;
    }
  };

  const dispose = () => {
    roughnessNoise?.dispose?.();
    concreteNoise?.dispose?.();
    world.traverse((object: any) => {
      object.geometry?.dispose?.();
    });
    allMaterials.forEach((material: any) => material.dispose?.());
    dust?.material?.dispose?.();
  };

  return {
    world,
    materials,
    update,
    dispose,
  };
}
