type DetailOptions = {
  mobile: boolean;
  lowPower: boolean;
  shadows: boolean;
};

function addShadow(mesh: any, shadows: boolean) {
  mesh.castShadow = shadows;
  mesh.receiveShadow = shadows;
  return mesh;
}

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967295;
  };
}

function canvasTexture(THREE: any, canvas: HTMLCanvasElement, color = false) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createIndustrialSurfaceMaps(THREE: any, lowPower: boolean) {
  const size = lowPower ? 128 : 256;

  const steelCanvas = document.createElement("canvas");
  steelCanvas.width = size;
  steelCanvas.height = size;
  const steelCtx = steelCanvas.getContext("2d")!;
  const steelRandom = seeded(13);
  steelCtx.fillStyle = "#8c918c";
  steelCtx.fillRect(0, 0, size, size);
  const steelImage = steelCtx.getImageData(0, 0, size, size);
  for (let i = 0; i < steelImage.data.length; i += 4) {
    const v = 120 + Math.round(steelRandom() * 70);
    steelImage.data[i] = v;
    steelImage.data[i + 1] = v + Math.round(steelRandom() * 7);
    steelImage.data[i + 2] = v;
    steelImage.data[i + 3] = 255;
  }
  steelCtx.putImageData(steelImage, 0, 0);
  steelCtx.globalAlpha = 0.16;
  for (let x = 0; x < size; x += 7) {
    steelCtx.fillStyle = x % 14 === 0 ? "#fff" : "#111";
    steelCtx.fillRect(x, 0, 1, size);
  }
  steelCtx.globalAlpha = 1;

  const corrugationCanvas = document.createElement("canvas");
  corrugationCanvas.width = size;
  corrugationCanvas.height = size;
  const corrCtx = corrugationCanvas.getContext("2d")!;
  for (let x = 0; x < size; x++) {
    const wave = 128 + Math.sin((x / size) * Math.PI * 32) * 92;
    corrCtx.fillStyle = `rgb(${wave},${wave},${wave})`;
    corrCtx.fillRect(x, 0, 1, size);
  }

  const concreteCanvas = document.createElement("canvas");
  concreteCanvas.width = size;
  concreteCanvas.height = size;
  const concreteCtx = concreteCanvas.getContext("2d")!;
  const concreteRandom = seeded(29);
  const concreteImage = concreteCtx.createImageData(size, size);
  for (let i = 0; i < concreteImage.data.length; i += 4) {
    const grain = 112 + Math.round(concreteRandom() * 72);
    concreteImage.data[i] = grain;
    concreteImage.data[i + 1] = grain;
    concreteImage.data[i + 2] = grain - 3;
    concreteImage.data[i + 3] = 255;
  }
  concreteCtx.putImageData(concreteImage, 0, 0);
  concreteCtx.strokeStyle = "rgba(45,42,37,.34)";
  concreteCtx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    let x = concreteRandom() * size;
    let y = concreteRandom() * size;
    concreteCtx.beginPath();
    concreteCtx.moveTo(x, y);
    for (let j = 0; j < 5; j++) {
      x += (concreteRandom() - 0.5) * 20;
      y += (concreteRandom() - 0.5) * 16;
      concreteCtx.lineTo(x, y);
    }
    concreteCtx.stroke();
  }

  const paintCanvas = document.createElement("canvas");
  paintCanvas.width = size;
  paintCanvas.height = size;
  const paintCtx = paintCanvas.getContext("2d")!;
  const paintRandom = seeded(73);
  paintCtx.fillStyle = "#888";
  paintCtx.fillRect(0, 0, size, size);
  paintCtx.globalAlpha = 0.18;
  for (let y = 0; y < size; y += 4) {
    const v = 100 + Math.round(paintRandom() * 80);
    paintCtx.fillStyle = `rgb(${v},${v},${v})`;
    paintCtx.fillRect(0, y, size, 1);
  }
  paintCtx.globalAlpha = 1;

  const rubberCanvas = document.createElement("canvas");
  rubberCanvas.width = size;
  rubberCanvas.height = size;
  const rubberCtx = rubberCanvas.getContext("2d")!;
  rubberCtx.fillStyle = "#6d6d6d";
  rubberCtx.fillRect(0, 0, size, size);
  rubberCtx.strokeStyle = "#b0b0b0";
  rubberCtx.lineWidth = 2;
  for (let i = -size; i < size * 2; i += 14) {
    rubberCtx.beginPath();
    rubberCtx.moveTo(i, 0);
    rubberCtx.lineTo(i + size, size);
    rubberCtx.stroke();
  }

  const cartonCanvas = document.createElement("canvas");
  cartonCanvas.width = size;
  cartonCanvas.height = size;
  const cartonCtx = cartonCanvas.getContext("2d")!;
  cartonCtx.fillStyle = "#777";
  cartonCtx.fillRect(0, 0, size, size);
  cartonCtx.strokeStyle = "rgba(255,255,255,.18)";
  for (let y = 0; y < size; y += 3) {
    cartonCtx.beginPath();
    cartonCtx.moveTo(0, y);
    cartonCtx.lineTo(size, y + 1);
    cartonCtx.stroke();
  }

  const maps = {
    steelNoise: canvasTexture(THREE, steelCanvas),
    corrugation: canvasTexture(THREE, corrugationCanvas),
    concrete: canvasTexture(THREE, concreteCanvas),
    paint: canvasTexture(THREE, paintCanvas),
    rubber: canvasTexture(THREE, rubberCanvas),
    carton: canvasTexture(THREE, cartonCanvas),
  };

  maps.steelNoise.repeat.set(5, 8);
  maps.corrugation.repeat.set(4, 1);
  maps.concrete.repeat.set(8, 5);
  maps.paint.repeat.set(5, 7);
  maps.rubber.repeat.set(8, 2);
  maps.carton.repeat.set(4, 8);

  return {
    ...maps,
    dispose() {
      Object.values(maps).forEach((map: any) => map.dispose?.());
    },
  };
}

export function createSignTexture(
  THREE: any,
  lines: string[],
  options?: { accent?: string; background?: string; foreground?: string; width?: number; height?: number },
) {
  const width = options?.width ?? 1024;
  const height = options?.height ?? 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = options?.background ?? "#ece9df";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = options?.accent ?? "#1d5a3a";
  ctx.fillRect(0, 0, Math.max(18, width * 0.018), height);
  ctx.fillStyle = options?.foreground ?? "#142018";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${Math.round(height * 0.25)}px Arial, sans-serif`;
  ctx.fillText(lines[0] ?? "", width * 0.065, height * 0.38);
  if (lines[1]) {
    ctx.font = `700 ${Math.round(height * 0.14)}px Arial, sans-serif`;
    ctx.fillStyle = "#496056";
    ctx.fillText(lines[1], width * 0.065, height * 0.69);
  }
  const texture = canvasTexture(THREE, canvas, true);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  return texture;
}

export function createSafetyLadder(
  THREE: any,
  material: any,
  height: number,
  radius: number,
  options: DetailOptions,
) {
  const group = new THREE.Group();
  const railGeo = new THREE.CylinderGeometry(0.025, 0.025, height, 8);
  for (const x of [-0.18, 0.18]) {
    const rail = new THREE.Mesh(railGeo, material);
    rail.position.set(x, height / 2, 0);
    group.add(rail);
  }

  const rungGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.42, 8);
  const rungCount = Math.max(8, Math.floor(height / 0.31));
  for (let i = 0; i < rungCount; i++) {
    const rung = new THREE.Mesh(rungGeo, material);
    rung.rotation.z = Math.PI / 2;
    rung.position.set(0, 0.35 + i * 0.31, 0);
    group.add(rung);
  }

  if (!options.lowPower) {
    const hoopCount = Math.max(4, Math.floor(height / 0.72));
    for (let i = 0; i < hoopCount; i++) {
      const hoop = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.018, 6, 22, Math.PI * 1.06),
        material,
      );
      hoop.rotation.y = Math.PI / 2;
      hoop.rotation.z = -Math.PI / 2;
      hoop.position.set(0, 1.1 + i * 0.72, radius * 0.54);
      group.add(hoop);
    }
  }
  return group;
}

export function createIndustrialCatwalk(
  THREE: any,
  materials: any,
  length: number,
  options: DetailOptions,
) {
  const group = new THREE.Group();
  const deck = addShadow(
    new THREE.Mesh(new THREE.BoxGeometry(length, 0.11, 0.85), materials.darkMetal),
    options.shadows,
  );
  group.add(deck);

  const postGeo = new THREE.BoxGeometry(0.045, 0.74, 0.045);
  const railGeo = new THREE.BoxGeometry(length, 0.04, 0.04);
  for (const z of [-0.39, 0.39]) {
    const topRail = new THREE.Mesh(railGeo, materials.galvanized);
    topRail.position.set(0, 0.62, z);
    group.add(topRail);

    const midRail = new THREE.Mesh(railGeo, materials.galvanized);
    midRail.position.set(0, 0.34, z);
    group.add(midRail);

    const posts = Math.max(3, Math.floor(length / 1.2));
    for (let i = 0; i <= posts; i++) {
      const post = new THREE.Mesh(postGeo, materials.galvanized);
      post.position.set(-length / 2 + (i / posts) * length, 0.33, z);
      group.add(post);
    }
  }

  if (!options.lowPower) {
    const trussGeo = new THREE.BoxGeometry(length, 0.045, 0.045);
    for (const z of [-0.34, 0.34]) {
      const braceA = new THREE.Mesh(trussGeo, materials.darkMetal);
      braceA.scale.x = 0.51;
      braceA.rotation.z = 0.18;
      braceA.position.set(-length * 0.24, -0.13, z);
      group.add(braceA);
      const braceB = braceA.clone();
      braceB.rotation.z = -0.18;
      braceB.position.x = length * 0.24;
      group.add(braceB);
    }
  }
  return group;
}

export function createDetailedSilo(
  THREE: any,
  materials: any,
  radius: number,
  height: number,
  options: DetailOptions,
) {
  const group = new THREE.Group();

  const body = addShadow(
    new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, options.mobile ? 40 : 64), materials.siloMetal),
    options.shadows,
  );
  body.position.y = height / 2;
  group.add(body);

  const baseRing = addShadow(
    new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.04, radius * 1.04, 0.20, 48), materials.darkMetal),
    options.shadows,
  );
  baseRing.position.y = 0.12;
  group.add(baseRing);

  const roof = addShadow(
    new THREE.Mesh(new THREE.ConeGeometry(radius * 1.025, radius * 0.92, options.mobile ? 40 : 64), materials.siloMetal),
    options.shadows,
  );
  roof.position.y = height + radius * 0.44;
  group.add(roof);

  const manway = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.16, 18), materials.darkMetal);
  manway.position.set(radius * 0.34, height + radius * 0.88, 0);
  group.add(manway);

  const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.52, 18), materials.darkMetal);
  vent.position.set(-radius * 0.34, height + radius * 0.98, 0.05);
  group.add(vent);

  for (const y of [height * 0.22, height * 0.47, height * 0.71, height * 0.90]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.012, 0.028, 6, 56), materials.darkMetal);
    band.rotation.x = Math.PI / 2;
    band.position.y = y;
    group.add(band);
  }

  const ladder = createSafetyLadder(THREE, materials.darkMetal, height * 0.86, Math.max(0.34, radius * 0.33), options);
  ladder.position.set(radius + 0.05, 0.22, 0);
  ladder.rotation.y = Math.PI / 2;
  group.add(ladder);

  if (!options.lowPower) {
    const roofRail = new THREE.Group();
    const postGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.42, 6);
    const rail = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.68, 0.018, 5, 48), materials.darkMetal);
    rail.rotation.x = Math.PI / 2;
    rail.position.y = 0.40;
    roofRail.add(rail);
    for (let i = 0; i < 12; i++) {
      const post = new THREE.Mesh(postGeo, materials.darkMetal);
      const a = (i / 12) * Math.PI * 2;
      post.position.set(Math.cos(a) * radius * 0.68, 0.2, Math.sin(a) * radius * 0.68);
      roofRail.add(post);
    }
    roofRail.position.y = height + radius * 0.72;
    group.add(roofRail);
  }

  return group;
}

export function createCyclone(
  THREE: any,
  materials: any,
  scale = 1,
  options: DetailOptions,
) {
  const group = new THREE.Group();
  const upper = addShadow(
    new THREE.Mesh(new THREE.CylinderGeometry(0.58 * scale, 0.58 * scale, 1.6 * scale, 24), materials.galvanized),
    options.shadows,
  );
  upper.position.y = 1.8 * scale;
  group.add(upper);

  const cone = addShadow(
    new THREE.Mesh(new THREE.ConeGeometry(0.58 * scale, 1.5 * scale, 24), materials.galvanized),
    options.shadows,
  );
  cone.rotation.x = Math.PI;
  cone.position.y = 0.26 * scale;
  group.add(cone);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.18 * scale, 0.7 * scale, 16), materials.darkMetal);
  cap.position.y = 2.95 * scale;
  group.add(cap);

  const outlet = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.12 * scale, 0.85 * scale, 12), materials.darkMetal);
  outlet.position.y = -0.72 * scale;
  group.add(outlet);

  return group;
}

export function createDetailedFarmHall(
  THREE: any,
  materials: any,
  geometry: any,
  length: number,
  width: number,
  options: DetailOptions,
) {
  const group = new THREE.Group();
  const hall = addShadow(new THREE.Mesh(geometry, materials.hallPanel), options.shadows);
  group.add(hall);

  const door = addShadow(
    new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.72, 1.25), materials.darkMetal),
    options.shadows,
  );
  door.position.set(-length / 2 - 0.02, 0.92, 0);
  group.add(door);

  const header = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.16, 1.45), materials.green);
  header.position.set(-length / 2 - 0.10, 1.88, 0);
  group.add(header);

  const fanCount = options.lowPower ? 3 : 5;
  for (let i = 0; i < fanCount; i++) {
    const z = -width / 2 - 0.055;
    const x = -length * 0.31 + i * (length * 0.62 / Math.max(1, fanCount - 1));
    const fanFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.10, 24), materials.darkMetal);
    fanFrame.rotation.x = Math.PI / 2;
    fanFrame.position.set(x, 1.35, z);
    group.add(fanFrame);
    const fanCore = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.13, 16), materials.galvanized);
    fanCore.rotation.x = Math.PI / 2;
    fanCore.position.set(x, 1.35, z - 0.01);
    group.add(fanCore);
  }

  const ridgeCount = options.lowPower ? 2 : 5;
  for (let i = 0; i < ridgeCount; i++) {
    const ridgeVent = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.36), materials.darkMetal);
    ridgeVent.position.set(-length * 0.32 + i * (length * 0.64 / Math.max(1, ridgeCount - 1)), 3.95, 0);
    group.add(ridgeVent);
  }

  const feedPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, length * 0.92, 10), materials.galvanized);
  feedPipe.rotation.z = Math.PI / 2;
  feedPipe.position.set(0, 2.25, width / 2 + 0.22);
  group.add(feedPipe);

  return group;
}

export function createDetailedTruck(
  THREE: any,
  materials: any,
  options: DetailOptions,
) {
  const group = new THREE.Group();

  const chassis = addShadow(
    new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.28, 1.9), materials.darkMetal),
    options.shadows,
  );
  chassis.position.set(0.45, 0.68, 0);
  group.add(chassis);

  const cargo = addShadow(
    new THREE.Mesh(new THREE.BoxGeometry(5.25, 2.35, 2.25), materials.trailer),
    options.shadows,
  );
  cargo.position.set(1.25, 1.90, 0);
  group.add(cargo);

  if (!options.lowPower) {
    for (let i = 0; i < 7; i++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.035, 2.15, 2.30), materials.darkMetal);
      rib.position.set(-0.85 + i * 0.72, 1.9, 0);
      group.add(rib);
    }
  }

  const cab = addShadow(
    new THREE.Mesh(new THREE.BoxGeometry(1.85, 2.10, 2.15), materials.green),
    options.shadows,
  );
  cab.position.set(-2.18, 1.58, 0);
  group.add(cab);

  const hood = addShadow(
    new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.82, 1.96), materials.green),
    options.shadows,
  );
  hood.position.set(-3.28, 1.16, 0);
  group.add(hood);

  const windscreen = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.76, 1.70), materials.glass);
  windscreen.position.set(-3.12, 1.94, 0);
  group.add(windscreen);

  const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.22, 2.08), materials.galvanized);
  bumper.position.set(-3.61, 0.77, 0);
  group.add(bumper);

  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.48, 1.20), materials.darkMetal);
  grille.position.set(-3.38, 1.05, 0);
  group.add(grille);

  for (const z of [-0.72, 0.72]) {
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.18, 0.28), materials.lightLens);
    light.position.set(-3.41, 1.28, z);
    group.add(light);

    const mirrorArm = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.50, 0.05), materials.darkMetal);
    mirrorArm.position.set(-2.72, 2.10, z * 1.46);
    group.add(mirrorArm);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.31, 0.23), materials.glass);
    mirror.position.set(-2.72, 2.19, z * 1.54);
    group.add(mirror);
  }

  const wheelGeometry = new THREE.CylinderGeometry(0.46, 0.46, 0.28, 28);
  const hubGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.30, 18);
  for (const x of [-2.36, 0.25, 2.55]) {
    for (const z of [-1.10, 1.10]) {
      const wheel = new THREE.Mesh(wheelGeometry, materials.rubber);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.47, z);
      group.add(wheel);
      const hub = new THREE.Mesh(hubGeometry, materials.galvanized);
      hub.rotation.x = Math.PI / 2;
      hub.position.set(x, 0.47, z * 1.015);
      group.add(hub);
    }
  }

  return group;
}

export function createTerrainBackdrop(THREE: any, material: any, mobile: boolean) {
  const group = new THREE.Group();
  const layers = mobile ? 2 : 3;
  for (let layer = 0; layer < layers; layer++) {
    const points = 26;
    const width = 78 + layer * 14;
    const depth = -16 - layer * 5;
    const baseY = 0.2 + layer * 0.7;
    const top: number[] = [];
    for (let i = 0; i < points; i++) {
      const t = i / (points - 1);
      top.push(
        baseY +
        2.3 +
        Math.sin(t * Math.PI * (3.2 + layer * 0.3) + layer) * 1.2 +
        Math.sin(t * Math.PI * 7.7 + layer * 1.7) * 0.42,
      );
    }
    const vertices: number[] = [];
    for (let i = 0; i < points; i++) {
      const x = -width / 2 + (i / (points - 1)) * width;
      vertices.push(x, -0.3, depth);
      vertices.push(x, top[i], depth);
    }
    const indices: number[] = [];
    for (let i = 0; i < points - 1; i++) {
      const a = i * 2;
      indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const ridge = new THREE.Mesh(geometry, material.clone());
    ridge.material.color.offsetHSL(0, 0, -layer * 0.035);
    ridge.material.transparent = true;
    ridge.material.opacity = 0.82 - layer * 0.16;
    group.add(ridge);
  }
  return group;
}
