type SurfaceInstallOptions = {
  mobile: boolean;
  lowPower: boolean;
};

function configureTexture(THREE: any, texture: any, repeatX: number, repeatY: number, srgb = false) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.max(texture.anisotropy ?? 1, 8);
  texture.needsUpdate = true;
  return texture;
}

async function loadTextureSet(
  THREE: any,
  loader: any,
  prefix: string,
  repeatX: number,
  repeatY: number,
) {
  const [basecolor, normal, roughness] = await Promise.all([
    loader.loadAsync(`/assets/photoreal/${prefix}-basecolor.jpg`),
    loader.loadAsync(`/assets/photoreal/${prefix}-normal.jpg`),
    loader.loadAsync(`/assets/photoreal/${prefix}-roughness.jpg`),
  ]);

  configureTexture(THREE, basecolor, repeatX, repeatY, true);
  configureTexture(THREE, normal, repeatX, repeatY);
  configureTexture(THREE, roughness, repeatX, repeatY);

  return { basecolor, normal, roughness };
}

function applySet(material: any, set: any, options: { color?: number; roughness?: number; metalness?: number; normalScale?: number }) {
  material.map = set.basecolor;
  material.normalMap = set.normal;
  material.roughnessMap = set.roughness;
  material.bumpMap = null;
  if (options.color !== undefined) material.color.setHex(options.color);
  if (options.roughness !== undefined) material.roughness = options.roughness;
  if (options.metalness !== undefined) material.metalness = options.metalness;
  if (options.normalScale !== undefined && material.normalScale?.setScalar) {
    material.normalScale.setScalar(options.normalScale);
  }
  material.needsUpdate = true;
}

// Desktop photoreal tier: local CC0 scan maps + a web-optimized 1K industrial HDRI.
export async function installPhotorealEnvironment(
  THREE: any,
  renderer: any,
  scene: any,
  materials: any,
  options: SurfaceInstallOptions,
) {
  if (options.mobile || options.lowPower) {
    return {
      loaded: [] as string[],
      failed: [] as string[],
      environmentTarget: null as any,
    };
  }

  const loaded: string[] = [];
  const failed: string[] = [];
  const textureLoader = new THREE.TextureLoader();

  const sets = await Promise.allSettled([
    loadTextureSet(THREE, textureLoader, "concrete", 9.5, 5.0),
    loadTextureSet(THREE, textureLoader, "asphalt", 14.0, 2.2),
    loadTextureSet(THREE, textureLoader, "corrugated", 7.5, 3.0),
  ]);

  if (sets[0].status === "fulfilled") {
    applySet(materials.concrete, sets[0].value, {
      color: 0xd0cec5,
      roughness: 0.91,
      metalness: 0,
      normalScale: 0.48,
    });
    loaded.push("concrete-scan");
  } else {
    failed.push("concrete-scan");
  }

  if (sets[1].status === "fulfilled") {
    applySet(materials.asphalt, sets[1].value, {
      color: 0x8a8983,
      roughness: 0.96,
      metalness: 0,
      normalScale: 0.55,
    });
    loaded.push("asphalt-scan");
  } else {
    failed.push("asphalt-scan");
  }

  if (sets[2].status === "fulfilled") {
    applySet(materials.roofMetal, sets[2].value, {
      color: 0xb7b9b4,
      roughness: 0.57,
      metalness: 0.58,
      normalScale: 0.62,
    });
    loaded.push("corrugated-scan");
  } else {
    failed.push("corrugated-scan");
  }

  let environmentTarget: any = null;
  try {
    const { RGBELoader } = await import("three/addons/loaders/RGBELoader.js");
    const hdr = await new RGBELoader().loadAsync("/assets/photoreal/industrial-overcast.hdr");
    hdr.mapping = THREE.EquirectangularReflectionMapping;

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader?.();
    environmentTarget = pmrem.fromEquirectangular(hdr);
    scene.environment = environmentTarget.texture;
    scene.environmentIntensity = 0.74;
    if (scene.environmentRotation) scene.environmentRotation.y = -0.58;

    hdr.dispose();
    pmrem.dispose();
    loaded.push("industrial-hdri");
  } catch {
    failed.push("industrial-hdri");
  }

  return { loaded, failed, environmentTarget };
}
