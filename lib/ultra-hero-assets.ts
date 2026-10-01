type HeroOptions = {
  mobile: boolean;
  lowPower: boolean;
  shadows: boolean;
};

function shadow(mesh: any, enabled: boolean) {
  mesh.castShadow = enabled;
  mesh.receiveShadow = enabled;
  return mesh;
}

function box(THREE: any, size: [number, number, number], material: any, position: [number, number, number], shadows: boolean) {
  const mesh = shadow(new THREE.Mesh(new THREE.BoxGeometry(...size), material), shadows);
  mesh.position.set(...position);
  return mesh;
}

function pipe(THREE: any, radius: number, length: number, material: any, position: [number, number, number], rotation: [number, number, number], shadows: boolean, segments = 18) {
  const mesh = shadow(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, segments), material), shadows);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  return mesh;
}

function makeCabGeometry(THREE: any) {
  const shape = new THREE.Shape();
  shape.moveTo(-3.56, 0.70);
  shape.lineTo(-3.50, 0.98);
  shape.lineTo(-3.19, 2.26);
  shape.quadraticCurveTo(-3.08, 2.52, -2.76, 2.68);
  shape.lineTo(-2.36, 2.78);
  shape.lineTo(-1.42, 2.74);
  shape.quadraticCurveTo(-1.22, 2.70, -1.14, 2.44);
  shape.lineTo(-1.12, 0.70);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 2.06,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.055,
    bevelThickness: 0.045,
    curveSegments: 5,
    steps: 1,
  });
  geometry.translate(0, 0, -1.03);
  geometry.computeVertexNormals();
  return geometry;
}

export function createUltraRigidTruck(THREE: any, materials: any, options: HeroOptions) {
  const group = new THREE.Group();
  group.name = "UltraRigidTruck";
  const shadows = options.shadows;

  const body = shadow(new THREE.Mesh(makeCabGeometry(THREE), materials.offWhite), shadows);
  group.add(body);

  const windscreen = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.82, 1.72), materials.glass);
  windscreen.position.set(-3.075, 2.04, 0);
  windscreen.rotation.z = -0.27;
  group.add(windscreen);

  const divider = box(THREE, [0.065, 0.83, 0.04], materials.darkMetal, [-3.11, 2.04, 0], false);
  divider.rotation.z = -0.27;
  group.add(divider);

  for (const z of [-1.055, 1.055]) {
    const sideWindow = box(THREE, [0.92, 0.64, 0.035], materials.glass, [-2.17, 2.05, z], false);
    group.add(sideWindow);
    group.add(box(THREE, [0.04, 1.38, 0.028], materials.darkMetal, [-2.68, 1.58, z * 1.004], false));
    group.add(box(THREE, [0.04, 1.38, 0.028], materials.darkMetal, [-1.48, 1.58, z * 1.004], false));
    group.add(box(THREE, [0.20, 0.045, 0.032], materials.darkMetal, [-1.76, 1.70, z * 1.01], false));

    const mirrorArm = box(THREE, [0.28, 0.045, 0.045], materials.darkMetal, [-2.96, 2.32, z * 1.12], false);
    mirrorArm.rotation.y = z > 0 ? -0.28 : 0.28;
    group.add(mirrorArm);
    group.add(box(THREE, [0.17, 0.32, 0.08], materials.darkMetal, [-3.00, 2.28, z * 1.29], false));
    group.add(box(THREE, [0.76, 0.10, 0.24], materials.galvanized, [-1.58, 0.73, z * 1.10], shadows));
  }

  const visor = box(THREE, [0.46, 0.07, 1.88], materials.darkMetal, [-2.94, 2.54, 0], false);
  visor.rotation.z = -0.15;
  group.add(visor);

  group.add(box(THREE, [0.20, 0.24, 2.08], materials.darkMetal, [-3.60, 0.76, 0], shadows));
  group.add(box(THREE, [0.05, 0.50, 1.18], materials.darkMetal, [-3.49, 1.10, 0], false));

  const slatGeo = new THREE.BoxGeometry(0.035, 0.032, 1.02);
  const slats = new THREE.InstancedMesh(slatGeo, materials.galvanized, 6);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 6; i++) {
    dummy.position.set(-3.525, 0.90 + i * 0.075, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    slats.setMatrixAt(i, dummy.matrix);
  }
  slats.instanceMatrix.needsUpdate = true;
  group.add(slats);

  for (const z of [-0.73, 0.73]) {
    group.add(box(THREE, [0.08, 0.21, 0.34], materials.lightLens, [-3.55, 1.38, z], false));
  }

  const chassis = box(THREE, [6.75, 0.22, 1.78], materials.darkMetal, [0.15, 0.63, 0], shadows);
  group.add(chassis);

  const cargo = box(THREE, [5.28, 2.26, 2.14], materials.trailer, [1.32, 1.88, 0], shadows);
  group.add(cargo);

  for (const y of [0.77, 3.03]) {
    for (const z of [-1.10, 1.10]) group.add(box(THREE, [5.34, 0.065, 0.05], materials.galvanized, [1.32, y, z], false));
  }

  if (!options.lowPower) {
    const ribGeo = new THREE.BoxGeometry(0.04, 2.08, 0.045);
    const ribs = new THREE.InstancedMesh(ribGeo, materials.galvanized, 16);
    let ribIndex = 0;
    for (const z of [-1.105, 1.105]) {
      for (let i = 0; i < 8; i++) {
        dummy.position.set(-1.05 + i * 0.68, 1.88, z);
        dummy.updateMatrix();
        ribs.setMatrixAt(ribIndex++, dummy.matrix);
      }
    }
    ribs.instanceMatrix.needsUpdate = true;
    group.add(ribs);
  }

  const fairingShape = new THREE.Shape();
  fairingShape.moveTo(-1.48, 2.62);
  fairingShape.lineTo(-0.92, 3.13);
  fairingShape.lineTo(-0.12, 3.13);
  fairingShape.lineTo(-0.12, 2.62);
  fairingShape.closePath();
  const fairingGeometry = new THREE.ExtrudeGeometry(fairingShape, {
    depth: 1.98,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.035,
    bevelThickness: 0.03,
    steps: 1,
  });
  fairingGeometry.translate(0, 0, -0.99);
  group.add(shadow(new THREE.Mesh(fairingGeometry, materials.offWhite), shadows));

  group.add(pipe(THREE, 0.075, 1.72, materials.darkMetal, [-1.30, 2.02, 0.91], [0, 0, 0], shadows, 12));
  for (const z of [-0.92, 0.92]) {
    group.add(pipe(THREE, 0.26, 1.18, materials.galvanized, [-0.78, 0.86, z], [0, 0, Math.PI / 2], shadows, 20));
    group.add(box(THREE, [4.52, 0.11, 0.075], materials.galvanized, [1.20, 0.62, z * 1.04], shadows));
  }

  const wheelGeometry = new THREE.CylinderGeometry(0.46, 0.46, 0.31, 32);
  const hubGeometry = new THREE.CylinderGeometry(0.19, 0.19, 0.325, 24);
  const treadGeo = new THREE.BoxGeometry(0.105, 0.052, 0.33);
  for (const x of [-2.35, 0.25, 2.55]) {
    for (const z of [-1.08, 1.08]) {
      const wheel = shadow(new THREE.Mesh(wheelGeometry, materials.rubber), shadows);
      wheel.position.set(x, 0.47, z);
      group.add(wheel);
      const hub = new THREE.Mesh(hubGeometry, materials.galvanized);
      hub.position.set(x, 0.47, z * 1.012);
      group.add(hub);

      if (!options.lowPower) {
        const treads = new THREE.InstancedMesh(treadGeo, materials.rubber, 12);
        for (let i = 0; i < 12; i++) {
          const angle = i / 12 * Math.PI * 2;
          dummy.position.set(x + Math.cos(angle) * 0.48, 0.47 + Math.sin(angle) * 0.48, z);
          dummy.rotation.set(0, 0, angle);
          dummy.updateMatrix();
          treads.setMatrixAt(i, dummy.matrix);
        }
        treads.instanceMatrix.needsUpdate = true;
        group.add(treads);
      }
    }
  }

  for (const x of [0.25, 2.55]) {
    for (const z of [-1.02, 1.02]) group.add(box(THREE, [0.10, 0.62, 0.34], materials.rubber, [x + 0.43, 0.42, z], false));
  }

  group.add(box(THREE, [0.18, 0.22, 2.05], materials.darkMetal, [3.94, 0.66, 0], shadows));
  group.add(box(THREE, [2.3, 0.66, 0.025], materials.green, [1.70, 2.0, 1.09], false));

  return group;
}

export function createUltraEggGrader(THREE: any, materials: any, options: HeroOptions) {
  const group = new THREE.Group();
  group.name = "UltraEggGrader";
  const shadows = options.shadows;
  const length = 8.8;
  const rows = options.lowPower ? 3 : 6;
  const rowSpacing = 0.22;
  const dummy = new THREE.Object3D();

  for (const z of [-0.84, 0.84]) {
    for (const y of [0.56, 1.43]) group.add(box(THREE, [length, 0.085, 0.085], materials.stainless, [-0.15, y, z], shadows));
  }

  const legGeo = new THREE.BoxGeometry(0.095, 1.08, 0.095);
  const legCount = options.lowPower ? 8 : 14;
  const legs = new THREE.InstancedMesh(legGeo, materials.stainless, legCount);
  for (let i = 0; i < legCount / 2; i++) {
    const x = -4.0 + i * (8.0 / Math.max(1, legCount / 2 - 1));
    for (const z of [-0.77, 0.77]) {
      const index = i * 2 + (z > 0 ? 1 : 0);
      dummy.position.set(x, 0.55, z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      legs.setMatrixAt(index, dummy.matrix);
    }
  }
  legs.instanceMatrix.needsUpdate = true;
  group.add(legs);

  const trackGeo = new THREE.BoxGeometry(8.3, 0.07, 0.11);
  const tracks = new THREE.InstancedMesh(trackGeo, materials.darkMetal, rows);
  for (let r = 0; r < rows; r++) {
    dummy.position.set(-0.10, 1.16, (r - (rows - 1) / 2) * rowSpacing);
    dummy.updateMatrix();
    tracks.setMatrixAt(r, dummy.matrix);
  }
  tracks.instanceMatrix.needsUpdate = true;
  group.add(tracks);

  const carrierGeo = new THREE.CylinderGeometry(0.064, 0.064, 0.17, 12);
  const carrierCount = options.lowPower ? 42 : 110;
  const carriers = new THREE.InstancedMesh(carrierGeo, materials.stainless, carrierCount);
  for (let i = 0; i < carrierCount; i++) {
    const row = i % rows;
    const col = Math.floor(i / rows);
    const cols = Math.ceil(carrierCount / rows);
    dummy.position.set(-4.05 + col / Math.max(1, cols - 1) * 7.8, 1.21, (row - (rows - 1) / 2) * rowSpacing);
    dummy.rotation.set(Math.PI / 2, 0, 0);
    dummy.updateMatrix();
    carriers.setMatrixAt(i, dummy.matrix);
  }
  carriers.instanceMatrix.needsUpdate = true;
  group.add(carriers);

  const eggGeometry = new THREE.LatheGeometry([
    new THREE.Vector2(0, -0.58),
    new THREE.Vector2(0.22, -0.53),
    new THREE.Vector2(0.36, -0.29),
    new THREE.Vector2(0.405, 0.02),
    new THREE.Vector2(0.33, 0.31),
    new THREE.Vector2(0.18, 0.50),
    new THREE.Vector2(0, 0.62),
  ], options.lowPower ? 20 : 34);

  const eggs: any[] = [];
  const eggCount = options.lowPower ? 8 : 20;
  for (let i = 0; i < eggCount; i++) {
    const egg = shadow(new THREE.Mesh(eggGeometry, materials.egg), shadows);
    egg.scale.setScalar(0.065);
    egg.position.set(-3.82 + i * (7.15 / Math.max(1, eggCount - 1)), 1.46, ((i % rows) - (rows - 1) / 2) * rowSpacing);
    group.add(egg);
    eggs.push(egg);
  }

  group.add(box(THREE, [0.78, 0.44, 1.70], materials.stainless, [-3.95, 1.64, 0], shadows));
  group.add(box(THREE, [1.24, 0.23, 1.80], materials.stainless, [-0.56, 1.94, 0], shadows));
  group.add(box(THREE, [0.82, 0.18, 0.035], materials.glass, [-0.56, 1.92, 0.92], false));
  for (const z of [-0.78, 0.78]) group.add(box(THREE, [0.10, 1.47, 0.10], materials.stainless, [-0.56, 1.20, z], shadows));

  const cabinet = box(THREE, [0.62, 1.02, 0.38], materials.offWhite, [2.62, 1.26, -1.04], shadows);
  group.add(cabinet);
  group.add(box(THREE, [0.36, 0.22, 0.035], materials.glass, [2.62, 1.48, -1.235], false));
  group.add(pipe(THREE, 0.24, 0.58, materials.darkMetal, [4.14, 0.90, 0.96], [0, 0, Math.PI / 2], shadows, 18));

  const laneCount = options.lowPower ? 3 : 6;
  for (let lane = 0; lane < laneCount; lane++) {
    const z = -1.32 + lane * (2.64 / Math.max(1, laneCount - 1));
    group.add(box(THREE, [2.35, 0.09, 0.26], materials.stainless, [3.05, 0.96, z], shadows));
    group.add(box(THREE, [2.20, 0.045, 0.045], materials.darkMetal, [3.05, 1.20, z + 0.12], false));
    group.add(box(THREE, [0.38, 0.42, 0.34], materials.offWhite, [4.03, 1.17, z], shadows));
    if (!options.lowPower && lane % 2 === 0) group.add(box(THREE, [0.42, 0.13, 0.32], materials.carton, [3.47, 1.11, z], shadows));
  }

  group.add(box(THREE, [8.2, 0.055, 0.16], materials.galvanized, [-0.10, 0.28, -0.98], shadows));

  group.userData.eggs = eggs;
  return group;
}

export function createUltraProcessSkid(THREE: any, materials: any, options: HeroOptions) {
  const group = new THREE.Group();
  group.name = "UltraProcessSkid";
  const shadows = options.shadows;
  const dummy = new THREE.Object3D();

  const columnGeo = new THREE.BoxGeometry(0.15, 7.4, 0.15);
  const columns = new THREE.InstancedMesh(columnGeo, materials.galvanized, 6);
  let index = 0;
  for (const x of [-2.75, 0, 2.75]) {
    for (const z of [-1.55, 1.55]) {
      dummy.position.set(x, 3.7, z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      columns.setMatrixAt(index++, dummy.matrix);
    }
  }
  columns.instanceMatrix.needsUpdate = true;
  group.add(columns);

  for (const y of [1.4, 3.8, 6.2, 7.35]) {
    for (const z of [-1.55, 1.55]) group.add(box(THREE, [5.7, 0.13, 0.15], materials.galvanized, [0, y, z], shadows));
  }

  if (!options.lowPower) {
    const braceGeo = new THREE.BoxGeometry(3.20, 0.07, 0.07);
    const braces = new THREE.InstancedMesh(braceGeo, materials.darkMetal, 8);
    index = 0;
    for (const z of [-1.60, 1.60]) {
      for (const x of [-1.38, 1.38]) {
        for (const sign of [-1, 1]) {
          dummy.position.set(x, sign < 0 ? 2.58 : 5.0, z);
          dummy.rotation.set(0, 0, sign * 0.72);
          dummy.updateMatrix();
          braces.setMatrixAt(index++, dummy.matrix);
        }
      }
    }
    braces.instanceMatrix.needsUpdate = true;
    group.add(braces);
  }

  for (const x of [-1.55, 0, 1.55]) {
    group.add(pipe(THREE, 0.56, 2.45, materials.stainless, [x, 5.15, -0.60], [0, 0, 0], shadows, 28));
    const cone = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.56, 1.05, 28), materials.stainless), shadows);
    cone.rotation.x = Math.PI;
    cone.position.set(x, 3.38, -0.60);
    group.add(cone);
    if (!options.lowPower) {
      for (const y of [3.87, 4.02, 6.38]) {
        const flange = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.032, 7, 22), materials.darkMetal);
        flange.rotation.x = Math.PI / 2;
        flange.position.set(x, y, -0.60);
        group.add(flange);
      }
    }
  }

  const collector = box(THREE, [1.52, 2.25, 1.16], materials.dustBlue, [3.42, 5.10, 0.50], shadows);
  group.add(collector);
  const hopper = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.76, 1.25, 4), materials.dustBlue), shadows);
  hopper.rotation.x = Math.PI;
  hopper.rotation.y = Math.PI / 4;
  hopper.position.set(3.42, 3.28, 0.50);
  group.add(hopper);

  group.add(pipe(THREE, 0.17, 5.4, materials.galvanized, [0.05, 7.45, 0.68], [0, 0, Math.PI / 2], shadows, 18));
  group.add(pipe(THREE, 0.19, 3.0, materials.galvanized, [2.25, 6.18, 0.50], [0, 0, Math.PI / 2], shadows, 18));

  for (const y of [3.90, 6.48]) {
    group.add(box(THREE, [5.4, 0.10, 0.92], materials.darkMetal, [0, y, 1.70], shadows));
    if (!options.lowPower) {
      for (let x = -2.5; x <= 2.5; x += 1.0) group.add(box(THREE, [0.045, 0.82, 0.045], materials.galvanized, [x, y + 0.47, 2.12], false));
      group.add(box(THREE, [5.35, 0.045, 0.045], materials.galvanized, [0, y + 0.86, 2.12], false));
    }
  }

  for (const x of [2.68, 3.30]) group.add(box(THREE, [0.045, 7.0, 0.045], materials.safetyYellow, [x, 3.58, -1.72], false));
  for (let y = 0.55; y < 6.9; y += 0.48) group.add(box(THREE, [0.62, 0.04, 0.04], materials.safetyYellow, [2.99, y, -1.72], false));

  group.add(pipe(THREE, 0.70, 1.20, materials.stainless, [2.10, 2.10, 0.40], [0, 0, 0], shadows, 24));
  const loadCone = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.70, 1.12, 24), materials.stainless), shadows);
  loadCone.rotation.x = Math.PI;
  loadCone.position.set(2.10, 0.92, 0.40);
  group.add(loadCone);

  return group;
}
