import {
  createCyclone,
  createDetailedFarmHall,
  createDetailedSilo,
  createDetailedTruck,
  createIndustrialCatwalk,
  createIndustrialSurfaceMaps,
  createSafetyLadder,
  createSignTexture,
  createTerrainBackdrop,
} from "@/lib/industrial-detail-kit";

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

function addShadow(mesh: any, shadows: boolean) {
  mesh.castShadow = shadows;
  mesh.receiveShadow = shadows;
  return mesh;
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
    36,
  );
}

function createPipe(
  THREE: any,
  material: any,
  length: number,
  radius = 0.10,
  horizontal = true,
) {
  const pipe = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 14),
    material,
  );
  if (horizontal) pipe.rotation.z = Math.PI / 2;
  return pipe;
}

function createPanelSeams(
  THREE: any,
  material: any,
  width: number,
  height: number,
  z: number,
  count: number,
) {
  const group = new THREE.Group();
  const seamGeo = new THREE.BoxGeometry(0.018, height, 0.022);
  for (let i = 1; i < count; i++) {
    const seam = new THREE.Mesh(seamGeo, material);
    seam.position.set(-width / 2 + (i / count) * width, height / 2, z);
    group.add(seam);
  }
  return group;
}

function createIndustrialStair(
  THREE: any,
  materials: any,
  height: number,
  run: number,
  options: { lowPower: boolean },
) {
  const group = new THREE.Group();
  const steps = options.lowPower ? 7 : 12;
  for (let i = 0; i < steps; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(run / steps + 0.04, 0.07, 0.72),
      materials.darkMetal,
    );
    step.position.set(
      -run / 2 + (i + 0.5) * (run / steps),
      0.08 + (i / (steps - 1)) * height,
      0,
    );
    group.add(step);
  }
  for (const z of [-0.36, 0.36]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(Math.hypot(run, height), 0.035, 0.035),
      materials.galvanized,
    );
    rail.position.set(0, height / 2 + 0.58, z);
    rail.rotation.z = Math.atan2(height, run);
    group.add(rail);
  }
  return group;
}

function createRoadMarkings(THREE: any, material: any) {
  const group = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.012, 0.08), material);
    line.position.set(-16 + i * 4.0, 0.012, 7.4);
    group.add(line);
  }
  for (const x of [-18.5, 18.5]) {
    const stop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.014, 4.1), material);
    stop.position.set(x, 0.014, 7.4);
    group.add(stop);
  }
  return group;
}

function createPalletStack(THREE: any, materials: any, shadows: boolean, layers = 3) {
  const group = new THREE.Group();
  const pallet = addShadow(
    new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.9), materials.wood),
    shadows,
  );
  pallet.position.y = 0.08;
  group.add(pallet);
  for (let l = 0; l < layers; l++) {
    for (let x = 0; x < 3; x++) {
      for (let z = 0; z < 2; z++) {
        const box = addShadow(
          new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, 0.37), materials.carton),
          shadows,
        );
        box.position.set(-0.38 + x * 0.38, 0.28 + l * 0.27, -0.19 + z * 0.39);
        group.add(box);
      }
    }
  }
  return group;
}

function createBollards(THREE: any, material: any, positions: Array<[number, number, number]>) {
  const group = new THREE.Group();
  const geo = new THREE.CylinderGeometry(0.075, 0.09, 0.62, 12);
  positions.forEach(([x, y, z]) => {
    const bollard = new THREE.Mesh(geo, material);
    bollard.position.set(x, y + 0.31, z);
    group.add(bollard);
  });
  return group;
}

function createSkyDome(THREE: any) {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x5f7265) },
      horizonColor: { value: new THREE.Color(0xb7b7a3) },
      groundColor: { value: new THREE.Color(0x3a4036) },
    },
    vertexShader: `
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      varying vec3 vWorld;
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 groundColor;
      void main() {
        float h = normalize(vWorld).y;
        vec3 upper = mix(horizonColor, topColor, smoothstep(0.02, 0.72, h));
        vec3 finalColor = mix(groundColor, upper, smoothstep(-0.28, 0.04, h));
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(70, 32, 16), material);
  dome.position.y = 4;
  return dome;
}

export function buildSupplyChainScene(THREE: any, options: SupplySceneOptions) {
  const { mobile, lowPower } = options;
  const shadows = !mobile;
  const detailOptions = { mobile, lowPower, shadows };
  const surfaceMaps = createIndustrialSurfaceMaps(THREE, lowPower);

  const materials = {
    siloMetal: new THREE.MeshStandardMaterial({
      color: 0xa6aaa4,
      roughness: 0.35,
      metalness: 0.84,
      roughnessMap: surfaceMaps.steelNoise,
      bumpMap: surfaceMaps.corrugation,
      bumpScale: 0.055,
      envMapIntensity: 1.15,
    }),
    galvanized: new THREE.MeshStandardMaterial({
      color: 0x9ba29d,
      roughness: 0.38,
      metalness: 0.76,
      roughnessMap: surfaceMaps.steelNoise,
      envMapIntensity: 1.1,
    }),
    darkMetal: new THREE.MeshStandardMaterial({
      color: 0x1a211d,
      roughness: 0.52,
      metalness: 0.62,
      roughnessMap: surfaceMaps.steelNoise,
      envMapIntensity: 0.75,
    }),
    green: new THREE.MeshStandardMaterial({
      color: 0x183f2c,
      roughness: 0.52,
      metalness: 0.12,
      roughnessMap: surfaceMaps.paint,
      bumpMap: surfaceMaps.paint,
      bumpScale: 0.018,
    }),
    greenCutaway: new THREE.MeshPhysicalMaterial({
      color: 0x183f2c,
      roughness: 0.43,
      metalness: 0.16,
      roughnessMap: surfaceMaps.paint,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      envMapIntensity: 0.9,
    }),
    concrete: new THREE.MeshStandardMaterial({
      color: 0x777a72,
      roughness: 0.96,
      metalness: 0,
      roughnessMap: surfaceMaps.concrete,
      bumpMap: surfaceMaps.concrete,
      bumpScale: 0.035,
    }),
    asphalt: new THREE.MeshStandardMaterial({
      color: 0x272a27,
      roughness: 0.94,
      metalness: 0,
      roughnessMap: surfaceMaps.concrete,
      bumpMap: surfaceMaps.concrete,
      bumpScale: 0.012,
    }),
    offWhite: new THREE.MeshStandardMaterial({
      color: 0xe8e1d2,
      roughness: 0.74,
      metalness: 0.02,
      roughnessMap: surfaceMaps.paint,
      bumpMap: surfaceMaps.paint,
      bumpScale: 0.012,
    }),
    hallPanel: new THREE.MeshStandardMaterial({
      color: 0xd9d8ce,
      roughness: 0.66,
      metalness: 0.08,
      roughnessMap: surfaceMaps.paint,
      bumpMap: surfaceMaps.corrugation,
      bumpScale: 0.018,
    }),
    roofMetal: new THREE.MeshStandardMaterial({
      color: 0x7f8983,
      roughness: 0.45,
      metalness: 0.56,
      roughnessMap: surfaceMaps.steelNoise,
      bumpMap: surfaceMaps.corrugation,
      bumpScale: 0.025,
    }),
    trailer: new THREE.MeshStandardMaterial({
      color: 0xd8d6ca,
      roughness: 0.58,
      metalness: 0.18,
      roughnessMap: surfaceMaps.paint,
      bumpMap: surfaceMaps.corrugation,
      bumpScale: 0.02,
    }),
    carton: new THREE.MeshStandardMaterial({
      color: 0x8b806d,
      roughness: 0.94,
      metalness: 0,
      roughnessMap: surfaceMaps.carton,
      bumpMap: surfaceMaps.carton,
      bumpScale: 0.035,
    }),
    wood: new THREE.MeshStandardMaterial({
      color: 0x6e5236,
      roughness: 0.9,
      metalness: 0,
    }),
    amber: new THREE.MeshStandardMaterial({
      color: 0xf0a128,
      emissive: 0x6f2500,
      emissiveIntensity: 0.38,
      roughness: 0.36,
      metalness: 0.14,
    }),
    grain: new THREE.MeshStandardMaterial({
      color: 0xb9823e,
      roughness: 0.76,
      metalness: 0,
    }),
    egg: new THREE.MeshPhysicalMaterial({
      color: 0xf0e6cf,
      roughness: 0.48,
      metalness: 0,
      clearcoat: 0.055,
      clearcoatRoughness: 0.82,
      envMapIntensity: 0.55,
    }),
    rubber: new THREE.MeshStandardMaterial({
      color: 0x0b0d0c,
      roughness: 0.88,
      metalness: 0,
      roughnessMap: surfaceMaps.rubber,
      bumpMap: surfaceMaps.rubber,
      bumpScale: 0.02,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x839a90,
      roughness: 0.16,
      metalness: 0,
      transparent: true,
      opacity: 0.58,
      transmission: lowPower ? 0 : 0.18,
      thickness: 0.12,
      ior: 1.45,
      envMapIntensity: 0.8,
    }),
    lightLens: new THREE.MeshStandardMaterial({
      color: 0xf4d49a,
      emissive: 0xffb24d,
      emissiveIntensity: 1.6,
      roughness: 0.24,
      metalness: 0,
    }),
    roadLine: new THREE.MeshBasicMaterial({ color: 0xd8d3bf }),
    grass: new THREE.MeshStandardMaterial({
      color: 0x27382b,
      roughness: 1,
      metalness: 0,
    }),
    mountain: new THREE.MeshStandardMaterial({
      color: 0x46584b,
      roughness: 1,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
  };

  const world = new THREE.Group();
  world.name = "AgromontSupplySystemRealistic";

  const sky = createSkyDome(THREE);
  world.add(sky);

  const terrain = createTerrainBackdrop(THREE, materials.mountain, mobile);
  terrain.position.y = -0.2;
  world.add(terrain);

  const outerGround = new THREE.Mesh(new THREE.BoxGeometry(76, 0.18, 42), materials.grass);
  outerGround.position.set(1, -0.52, 1);
  outerGround.receiveShadow = shadows;
  world.add(outerGround);

  const yard = addShadow(new THREE.Mesh(new THREE.BoxGeometry(52, 0.34, 27), materials.concrete), shadows);
  yard.position.set(1, -0.31, 0);
  world.add(yard);

  const serviceLane = addShadow(new THREE.Mesh(new THREE.BoxGeometry(48, 0.05, 5.2), materials.asphalt), shadows);
  serviceLane.position.set(1, -0.11, 7.4);
  world.add(serviceLane);
  world.add(createRoadMarkings(THREE, materials.roadLine));

  // Concrete curbs create a real yard edge and give the camera scale cues.
  for (const z of [-12.7, 12.7]) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(51.2, 0.18, 0.22), materials.concrete);
    curb.position.set(1, 0.0, z);
    world.add(curb);
  }

  // ---------------------------------------------------------------------------
  // GRAIN INTAKE / BUCKET ELEVATOR
  // ---------------------------------------------------------------------------
  const intake = new THREE.Group();
  intake.position.set(-18.0, 0, -1.8);
  world.add(intake);

  const intakeHouse = addShadow(new THREE.Mesh(new THREE.BoxGeometry(6.6, 2.9, 5.8), materials.green), shadows);
  intakeHouse.position.y = 1.28;
  intake.add(intakeHouse);

  const intakeRoof = addShadow(new THREE.Mesh(new THREE.BoxGeometry(7.1, 0.22, 6.25), materials.roofMetal), shadows);
  intakeRoof.position.y = 2.83;
  intake.add(intakeRoof);

  const intakeDoor = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.88, 1.42), materials.darkMetal);
  intakeDoor.position.set(-3.36, 1.0, -1.25);
  intake.add(intakeDoor);

  const intakeWindow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.74, 1.42), materials.glass);
  intakeWindow.position.set(-3.37, 1.55, 1.08);
  intake.add(intakeWindow);

  const intakePitFrame = addShadow(new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.16, 3.35), materials.galvanized), shadows);
  intakePitFrame.position.set(0, 0.07, 1.45);
  intake.add(intakePitFrame);

  const grate = new THREE.Group();
  for (let i = 0; i < (lowPower ? 8 : 16); i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 2.95), materials.darkMetal);
    bar.position.set(-1.88 + i * (3.76 / Math.max(1, (lowPower ? 7 : 15))), 0.18, 1.45);
    grate.add(bar);
  }
  intake.add(grate);

  const elevatorTower = addShadow(new THREE.Mesh(new THREE.BoxGeometry(2.35, 10.8, 2.35), materials.siloMetal), shadows);
  elevatorTower.position.set(4.55, 5.15, -0.55);
  intake.add(elevatorTower);

  intake.add(createPanelSeams(THREE, materials.darkMetal, 2.35, 10.4, 0.0, 5).translateX(4.55).translateZ(0.64));

  const elevatorCap = addShadow(new THREE.Mesh(new THREE.BoxGeometry(3.15, 1.0, 3.15), materials.darkMetal), shadows);
  elevatorCap.position.set(4.55, 10.98, -0.55);
  intake.add(elevatorCap);

  const elevatorLadder = createSafetyLadder(THREE, materials.darkMetal, 8.7, 0.42, detailOptions);
  elevatorLadder.position.set(5.78, 0.8, -0.55);
  elevatorLadder.rotation.y = Math.PI / 2;
  intake.add(elevatorLadder);

  const elevatorPlatform = createIndustrialCatwalk(THREE, materials, 3.6, detailOptions);
  elevatorPlatform.position.set(4.55, 9.55, 0.55);
  elevatorPlatform.rotation.y = Math.PI / 2;
  intake.add(elevatorPlatform);

  intake.add(createBollards(THREE, materials.amber, [
    [-3.0, 0, 3.1],
    [-1.9, 0, 3.1],
    [1.9, 0, 3.1],
    [3.0, 0, 3.1],
  ]));

  // ---------------------------------------------------------------------------
  // SILO FIELD / CATWALKS / DISTRIBUTION PIPEWORK
  // ---------------------------------------------------------------------------
  const siloCluster = new THREE.Group();
  siloCluster.position.set(-9.1, 0, -4.2);
  world.add(siloCluster);

  const siloCount = lowPower ? 2 : 3;
  const siloRadius = mobile ? 1.16 : 1.42;
  const siloHeight = mobile ? 7.1 : 8.35;
  for (let i = 0; i < siloCount; i++) {
    const silo = createDetailedSilo(THREE, materials, siloRadius, siloHeight, detailOptions);
    silo.position.x = i * (mobile ? 2.95 : 3.45);
    siloCluster.add(silo);
  }

  const grainBridge = createIndustrialCatwalk(THREE, materials, 13.8, detailOptions);
  grainBridge.position.set(-10.3, 9.7, -3.35);
  grainBridge.rotation.z = -0.07;
  world.add(grainBridge);

  for (const x of [-14.1, -10.4, -6.7]) {
    const supportA = new THREE.Mesh(new THREE.BoxGeometry(0.14, 8.3, 0.14), materials.galvanized);
    supportA.position.set(x, 4.3, -3.72);
    world.add(supportA);
    if (!lowPower) {
      const supportB = supportA.clone();
      supportB.position.z = -2.98;
      world.add(supportB);
      const cross = new THREE.Mesh(new THREE.BoxGeometry(0.08, 8.4, 0.08), materials.darkMetal);
      cross.position.set(x, 4.3, -3.35);
      cross.rotation.x = 0.09;
      world.add(cross);
    }
  }

  const transferPipe = createPipe(THREE, materials.galvanized, 12.2, 0.13, true);
  transferPipe.position.set(-10.4, 9.0, -2.80);
  transferPipe.rotation.z += -0.07;
  world.add(transferPipe);

  // ---------------------------------------------------------------------------
  // FEED MILL — facade based on a real industrial feed function, not exact CAD.
  // ---------------------------------------------------------------------------
  const feedMill = new THREE.Group();
  feedMill.position.set(1.3, 0, -2.15);
  world.add(feedMill);

  const feedMain = addShadow(new THREE.Mesh(new THREE.BoxGeometry(8.3, 7.8, 6.45), materials.greenCutaway), shadows);
  feedMain.position.y = 3.62;
  feedMill.add(feedMain);

  const facadeSeams = createPanelSeams(THREE, materials.darkMetal, 8.1, 7.2, 3.235, lowPower ? 6 : 12);
  facadeSeams.position.y = 0.1;
  feedMill.add(facadeSeams);

  const feedUpper = addShadow(new THREE.Mesh(new THREE.BoxGeometry(4.5, 5.0, 4.1), materials.siloMetal), shadows);
  feedUpper.position.set(0, 9.15, 0);
  feedMill.add(feedUpper);

  const feedCap = addShadow(new THREE.Mesh(new THREE.BoxGeometry(5.15, 0.48, 4.8), materials.darkMetal), shadows);
  feedCap.position.set(0, 11.9, 0);
  feedMill.add(feedCap);

  const serviceDoor = new THREE.Mesh(new THREE.BoxGeometry(1.25, 2.2, 0.08), materials.darkMetal);
  serviceDoor.position.set(-2.9, 1.12, 3.27);
  feedMill.add(serviceDoor);

  const controlWindow = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 0.08), materials.glass);
  controlWindow.position.set(1.7, 4.8, 3.27);
  feedMill.add(controlWindow);

  const spuzSignTexture = createSignTexture(THREE, ["FABRIKA STOČNE HRANE", "SPUŽ / PROIZVODNJA"]);
  const spuzSignMaterial = new THREE.MeshStandardMaterial({
    map: spuzSignTexture,
    roughness: 0.65,
    metalness: 0.02,
  });
  const spuzSign = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 0.98), spuzSignMaterial);
  spuzSign.position.set(-0.15, 6.3, 3.285);
  feedMill.add(spuzSign);

  const feedStair = createIndustrialStair(THREE, materials, 2.7, 3.0, { lowPower });
  feedStair.position.set(-4.42, 0.02, 1.95);
  feedStair.rotation.y = Math.PI / 2;
  feedMill.add(feedStair);

  const millCatwalk = createIndustrialCatwalk(THREE, materials, 7.4, detailOptions);
  millCatwalk.position.set(0.2, 5.65, 3.46);
  feedMill.add(millCatwalk);

  const cyclones: any[] = [];
  const cycloneCount = lowPower ? 2 : 3;
  for (let i = 0; i < cycloneCount; i++) {
    const cyclone = createCyclone(THREE, materials, mobile ? 0.88 : 1, detailOptions);
    cyclone.position.set(-2.5 + i * 2.5, 8.5, -3.9);
    feedMill.add(cyclone);
    cyclones.push(cyclone);

    const duct = createPipe(THREE, materials.galvanized, 3.8, 0.13, false);
    duct.position.set(-2.5 + i * 2.5, 7.2, -3.15);
    feedMill.add(duct);
  }

  const processVessels: any[] = [];
  for (const z of [-1.9, 0, 1.9]) {
    const vessel = addShadow(
      new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 5.9, 28), materials.galvanized),
      shadows,
    );
    vessel.position.set(-2.25, 6.25, z);
    feedMill.add(vessel);
    processVessels.push(vessel);

    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.56, 1.0, 28), materials.galvanized);
    cone.rotation.x = Math.PI;
    cone.position.set(-2.25, 2.82, z);
    feedMill.add(cone);
  }

  const processPipeGeometry = new THREE.CylinderGeometry(0.11, 0.11, 6.3, 14);
  for (const y of [3.0, 4.8, 6.6]) {
    const pipe = new THREE.Mesh(processPipeGeometry, materials.amber);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(4.25, y, 0.9);
    feedMill.add(pipe);
  }

  if (!lowPower) {
    for (let y = 1.5; y < 7.0; y += 1.15) {
      const conduit = createPipe(THREE, materials.darkMetal, 2.0, 0.045, true);
      conduit.position.set(2.6, y, 3.36);
      feedMill.add(conduit);
    }
  }

  const pelletGeometry = new THREE.CylinderGeometry(0.045, 0.045, 0.16, 8);
  const pelletCount = lowPower ? 22 : mobile ? 38 : 76;
  const pellets = new THREE.InstancedMesh(pelletGeometry, materials.amber, pelletCount);
  feedMill.add(pellets);

  // ---------------------------------------------------------------------------
  // FARM CAMPUS — repeated halls, feed silos, fans and service infrastructure.
  // ---------------------------------------------------------------------------
  const farmCampus = new THREE.Group();
  farmCampus.position.set(16.2, 0, -5.0);
  world.add(farmCampus);

  const farmCount = lowPower ? 2 : 3;
  const hallLength = mobile ? 10.8 : 13.8;
  const hallWidth = 4.6;
  for (let i = 0; i < farmCount; i++) {
    const hallGeometry = makePitchedHallGeometry(THREE, hallLength, hallWidth, 2.55, 1.35);
    const hall = createDetailedFarmHall(
      THREE,
      materials,
      hallGeometry,
      hallLength,
      hallWidth,
      detailOptions,
    );
    hall.position.z = i * 5.7;
    farmCampus.add(hall);

    const serviceSilo = createDetailedSilo(THREE, materials, 0.68, 4.1, detailOptions);
    serviceSilo.scale.setScalar(0.94);
    serviceSilo.position.set(-7.35, 0, i * 5.7);
    farmCampus.add(serviceSilo);

    const feedLink = createPipe(THREE, materials.galvanized, 4.5, 0.06, true);
    feedLink.position.set(-5.6, 2.35, i * 5.7 + hallWidth / 2 + 0.22);
    farmCampus.add(feedLink);
  }

  const farmLane = new THREE.Mesh(new THREE.BoxGeometry(15.0, 0.035, 18.0), materials.asphalt);
  farmLane.position.set(0, -0.08, 5.3);
  farmCampus.add(farmLane);

  if (!lowPower) {
    const fence = new THREE.Group();
    const postGeo = new THREE.BoxGeometry(0.05, 1.35, 0.05);
    for (let i = 0; i < 16; i++) {
      const post = new THREE.Mesh(postGeo, materials.galvanized);
      post.position.set(-8.2 + i * 1.1, 0.64, 12.8);
      fence.add(post);
    }
    const rail = new THREE.Mesh(new THREE.BoxGeometry(16.8, 0.04, 0.04), materials.galvanized);
    rail.position.set(0, 0.95, 12.8);
    fence.add(rail);
    farmCampus.add(fence);
  }

  // ---------------------------------------------------------------------------
  // SORTING / PACKING — roller line, scanner and palletised cartons.
  // ---------------------------------------------------------------------------
  const sorting = new THREE.Group();
  sorting.position.set(14.6, 0, 7.0);
  world.add(sorting);

  const sortingHall = addShadow(new THREE.Mesh(new THREE.BoxGeometry(10.6, 3.8, 5.2), materials.green), shadows);
  sortingHall.position.y = 1.65;
  sorting.add(sortingHall);

  const sortingRoof = addShadow(new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.20, 5.65), materials.roofMetal), shadows);
  sortingRoof.position.y = 3.62;
  sorting.add(sortingRoof);

  const glazing = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.82, 0.08), materials.glass);
  glazing.position.set(0, 2.30, -2.64);
  sorting.add(glazing);

  const sortSignTexture = createSignTexture(THREE, ["SORTIRANJE / PAKOVANJE", "MARTINIĆI / PROIZVODNI TOK"], {
    accent: "#e89a28",
    background: "#153b29",
    foreground: "#f2ede2",
  });
  const sortSignMaterial = new THREE.MeshStandardMaterial({ map: sortSignTexture, roughness: 0.55 });
  const sortSign = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.10), sortSignMaterial);
  sortSign.position.set(0.4, 1.06, -2.66);
  sorting.add(sortSign);

  const beltFrame = addShadow(new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.22, 1.25), materials.darkMetal), shadows);
  beltFrame.position.set(-0.3, 0.92, -3.05);
  sorting.add(beltFrame);

  const rollers: any[] = [];
  const rollerCount = lowPower ? 8 : 16;
  for (let i = 0; i < rollerCount; i++) {
    const roller = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 1.08, 14),
      materials.galvanized,
    );
    roller.rotation.x = Math.PI / 2;
    roller.position.set(-4.25 + i * (8.15 / Math.max(1, rollerCount - 1)), 1.07, -3.05);
    sorting.add(roller);
    rollers.push(roller);
  }

  const eggGeometry = makeEggGeometry(THREE);
  const eggs: any[] = [];
  const eggCount = lowPower ? 4 : mobile ? 6 : 10;
  for (let i = 0; i < eggCount; i++) {
    const egg = addShadow(new THREE.Mesh(eggGeometry, materials.egg), shadows);
    egg.scale.setScalar(0.30);
    egg.position.set(-4.0 + i * 0.72, 1.39, -3.05);
    sorting.add(egg);
    eggs.push(egg);
  }

  const scannerArch = new THREE.Group();
  const scannerTop = addShadow(new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.28, 1.72), materials.darkMetal), shadows);
  scannerTop.position.set(0, 1.75, 0);
  scannerArch.add(scannerTop);
  for (const z of [-0.74, 0.74]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.20, 1.55, 0.20), materials.darkMetal);
    leg.position.set(0, 0.91, z);
    scannerArch.add(leg);
  }
  const scanLight = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.045, 1.36), materials.lightLens);
  scanLight.position.set(0, 1.58, 0);
  scannerArch.add(scanLight);
  scannerArch.position.set(1.15, 0.1, -3.05);
  sorting.add(scannerArch);

  const packer = addShadow(new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.0, 2.0), materials.galvanized), shadows);
  packer.position.set(3.15, 1.0, -3.05);
  sorting.add(packer);

  const packerWindow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 1.35), materials.glass);
  packerWindow.position.set(2.08, 1.22, -3.05);
  sorting.add(packerWindow);

  const palletA = createPalletStack(THREE, materials, shadows, lowPower ? 2 : 4);
  palletA.position.set(4.25, 0, 0.6);
  sorting.add(palletA);

  const palletB = createPalletStack(THREE, materials, shadows, lowPower ? 2 : 3);
  palletB.position.set(2.75, 0, 1.65);
  sorting.add(palletB);

  // ---------------------------------------------------------------------------
  // LOGISTICS / LOADING — truck, docks, canopy, pallets, safety hardware.
  // ---------------------------------------------------------------------------
  const logistics = new THREE.Group();
  logistics.position.set(2.8, 0, 7.15);
  world.add(logistics);

  const loadingDock = addShadow(new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.82, 3.7), materials.concrete), shadows);
  loadingDock.position.set(0, 0.31, -2.45);
  logistics.add(loadingDock);

  const canopy = addShadow(new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.32, 4.2), materials.galvanized), shadows);
  canopy.position.set(0, 3.75, -1.45);
  logistics.add(canopy);

  for (const x of [-4.2, -1.4, 1.4, 4.2]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.17, 3.75, 0.17), materials.galvanized);
    post.position.set(x, 1.72, -1.45);
    logistics.add(post);
  }

  const truck = createDetailedTruck(THREE, materials, detailOptions);
  truck.position.set(0.45, 0, 0.1);
  truck.rotation.y = Math.PI;
  logistics.add(truck);

  const truckSignTexture = createSignTexture(THREE, ["AGROMONT", "DISTRIBUCIJA"], {
    accent: "#e89a28",
    background: "#ece9df",
    foreground: "#173f2b",
    width: 768,
    height: 192,
  });
  const truckSignMaterial = new THREE.MeshStandardMaterial({ map: truckSignTexture, roughness: 0.72 });
  const truckSign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.60), truckSignMaterial);
  truckSign.position.set(1.7, 2.0, 1.235);
  truckSign.rotation.y = Math.PI;
  logistics.add(truckSign);

  logistics.add(createBollards(THREE, materials.amber, [
    [-4.65, 0, -0.2],
    [-4.65, 0, 0.7],
    [4.65, 0, -0.2],
    [4.65, 0, 0.7],
  ]));

  const signalMast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 12), materials.darkMetal);
  signalMast.position.set(-5.45, 1.5, 0);
  logistics.add(signalMast);

  const signal = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 12), materials.lightLens);
  signal.position.set(-5.45, 3.15, 0);
  logistics.add(signal);

  if (!lowPower) {
    const extraPallet = createPalletStack(THREE, materials, shadows, 3);
    extraPallet.position.set(-3.8, 0.0, -3.6);
    logistics.add(extraPallet);
  }

  // ---------------------------------------------------------------------------
  // MATERIAL FLOW + ATMOSPHERIC MOTION
  // ---------------------------------------------------------------------------
  const grainGeometry = new THREE.SphereGeometry(0.06, 8, 6);
  const grainCount = lowPower ? 46 : mobile ? 82 : 150;
  const grains = new THREE.InstancedMesh(grainGeometry, materials.grain, grainCount);
  intake.add(grains);
  const dummy = new THREE.Object3D();
  const grainSeeds = Array.from({ length: grainCount }, (_, i) => {
    const a = (i * 2.399963) % (Math.PI * 2);
    const radius = 0.1 + ((i * 0.618033) % 1) * 1.32;
    return {
      x: Math.cos(a) * radius,
      z: 1.45 + Math.sin(a) * radius * 0.46,
      phase: (i * 0.137) % 1,
      size: 0.70 + ((i * 0.31) % 1) * 0.72,
    };
  });

  const dustCount = lowPower ? 0 : mobile ? 20 : 52;
  let dust: any = null;
  if (dustCount) {
    const positions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      positions[i * 3] = -24 + ((i * 17.17) % 1) * 50;
      positions[i * 3 + 1] = 0.6 + ((i * 9.73) % 1) * 11;
      positions[i * 3 + 2] = -11 + ((i * 7.91) % 1) * 22;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xd6c49d,
      size: mobile ? 0.025 : 0.035,
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
    });
    dust = new THREE.Points(geometry, material);
    world.add(dust);
  }

  const update = (elapsed: number, progress: number) => {
    const grainSpeed = 0.17;
    for (let i = 0; i < grainCount; i++) {
      const seed = grainSeeds[i];
      const fall = (seed.phase + elapsed * grainSpeed) % 1;
      dummy.position.set(seed.x, 5.9 - fall * 5.35, seed.z);
      dummy.rotation.set(i * 0.21, elapsed * 0.24 + i, i * 0.07);
      dummy.scale.set(seed.size * 0.70, seed.size, seed.size * 0.56);
      dummy.updateMatrix();
      grains.setMatrixAt(i, dummy.matrix);
    }
    grains.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < pelletCount; i++) {
      const t = ((i / pelletCount) + elapsed * 0.058) % 1;
      dummy.position.set(-2.62 + t * 5.3, 2.0 + Math.sin(t * Math.PI * 8) * 0.055, ((i % 3) - 1) * 0.16);
      dummy.rotation.set(Math.PI / 2, 0, elapsed * 0.72 + i * 0.2);
      dummy.scale.setScalar(0.92);
      dummy.updateMatrix();
      pellets.setMatrixAt(i, dummy.matrix);
    }
    pellets.instanceMatrix.needsUpdate = true;

    eggs.forEach((egg, index) => {
      const t = ((index / eggs.length) + elapsed * 0.033) % 1;
      egg.position.x = -4.0 + t * 7.55;
      egg.position.y = 1.39 + Math.sin(t * Math.PI * 8) * 0.014;
      egg.rotation.z = t * 0.24;
    });

    rollers.forEach((roller, index) => {
      roller.rotation.z = elapsed * 0.8 + index * 0.13;
    });

    const cutaway = smoothstep(0.20, 0.29, progress) * (1 - smoothstep(0.43, 0.50, progress));
    materials.greenCutaway.opacity = 1 - cutaway * 0.76;
    materials.greenCutaway.depthWrite = cutaway < 0.16;

    const processPulse = 0.30 + Math.sin(elapsed * 2.0) * 0.13;
    materials.amber.emissiveIntensity = progress > 0.60 ? 0.42 + processPulse : 0.34;
    materials.lightLens.emissiveIntensity = 1.35 + Math.sin(elapsed * 2.6) * 0.25;

    if (dust) {
      dust.rotation.y = elapsed * 0.003;
      dust.position.y = Math.sin(elapsed * 0.07) * 0.10;
    }
  };

  const dispose = () => {
    spuzSignTexture.dispose();
    sortSignTexture.dispose();
    truckSignTexture.dispose();
    surfaceMaps.dispose();

    const geometries = new Set<any>();
    const sceneMaterials = new Set<any>();
    world.traverse((object: any) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) {
        if (Array.isArray(object.material)) object.material.forEach((m: any) => sceneMaterials.add(m));
        else sceneMaterials.add(object.material);
      }
    });
    geometries.forEach((geometry) => geometry.dispose?.());
    sceneMaterials.forEach((material) => material.dispose?.());
  };

  return {
    world,
    materials,
    update,
    dispose,
  };
}
