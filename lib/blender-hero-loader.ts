export type AuthoredHeroSlot = {
  mount: any;
  fallback: any;
};

export type AuthoredHeroSlots = {
  processSkid?: AuthoredHeroSlot;
  grader?: AuthoredHeroSlot;
  truck?: AuthoredHeroSlot;
};

type InstallOptions = {
  mobile: boolean;
  lowPower: boolean;
  shadows: boolean;
};

type LoadedAsset = {
  name: string;
  lod: any;
  slot: AuthoredHeroSlot;
};

const ASSETS = [
  {
    key: "processSkid" as const,
    name: "process-skid",
    distances: [0, 22, 36],
  },
  {
    key: "grader" as const,
    name: "grader",
    distances: [0, 18, 32],
  },
  {
    key: "truck" as const,
    name: "truck",
    distances: [0, 16, 30],
  },
];

function disposeObject(root: any) {
  const geometries = new Set<any>();
  const materials = new Set<any>();
  const textures = new Set<any>();

  root?.traverse?.((object: any) => {
    if (object.geometry) geometries.add(object.geometry);
    const objectMaterials = Array.isArray(object.material)
      ? object.material
      : object.material
        ? [object.material]
        : [];
    for (const material of objectMaterials) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if ((value as any)?.isTexture) textures.add(value);
      }
    }
  });

  textures.forEach((texture) => texture.dispose?.());
  materials.forEach((material) => material.dispose?.());
  geometries.forEach((geometry) => geometry.dispose?.());
}

function prepareModel(model: any, shadows: boolean) {
  model.traverse((object: any) => {
    if (!object.isMesh) return;

    object.castShadow = shadows;
    object.receiveShadow = shadows;
    object.frustumCulled = true;

    const objectMaterials = Array.isArray(object.material)
      ? object.material
      : object.material
        ? [object.material]
        : [];

    for (const material of objectMaterials) {
      if ("envMapIntensity" in material) {
        material.envMapIntensity = Math.max(material.envMapIntensity ?? 1, 0.82);
      }

      for (const key of ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap"]) {
        const texture = material[key];
        if (texture?.isTexture) {
          texture.anisotropy = Math.max(texture.anisotropy ?? 1, 4);
          texture.needsUpdate = true;
        }
      }
    }
  });
}

export async function installAuthoredHeroAssets(
  THREE: any,
  renderer: any,
  slots: AuthoredHeroSlots,
  options: InstallOptions,
) {
  if (options.mobile || options.lowPower) {
    return {
      loaded: [] as string[],
      failed: [] as string[],
      dispose() {},
    };
  }

  const [{ GLTFLoader }, { KTX2Loader }, { MeshoptDecoder }] = await Promise.all([
    import("three/addons/loaders/GLTFLoader.js"),
    import("three/addons/loaders/KTX2Loader.js"),
    import("three/addons/libs/meshopt_decoder.module.js"),
  ]);

  const ktx2Loader = new KTX2Loader()
    .setTranscoderPath("/basis/")
    .setWorkerLimit(2);

  ktx2Loader.detectSupport(renderer);

  const loader = new GLTFLoader()
    .setKTX2Loader(ktx2Loader)
    .setMeshoptDecoder(MeshoptDecoder);

  const loadedAssets: LoadedAsset[] = [];
  const loadedNames: string[] = [];
  const failedNames: string[] = [];

  const loadOne = async (config: (typeof ASSETS)[number]) => {
    const slot = slots[config.key];
    if (!slot) return;

    try {
      const gltfs = await Promise.all(
        [0, 1, 2].map((lod) =>
          loader.loadAsync(`/assets/hero/${config.name}-lod${lod}.glb`),
        ),
      );

      const lodObject = new THREE.LOD();
      lodObject.name = `Authored_${config.name}`;

      gltfs.forEach((gltf: any, index: number) => {
        const model = gltf.scene;
        model.name = `${config.name}_lod${index}`;
        prepareModel(model, options.shadows);
        lodObject.addLevel(model, config.distances[index]);
      });

      slot.mount.add(lodObject);
      slot.fallback.visible = false;
      loadedAssets.push({ name: config.name, lod: lodObject, slot });
      loadedNames.push(config.name);
    } catch (error) {
      console.warn(`[agromont] keeping procedural fallback for ${config.name}`, error);
      failedNames.push(config.name);
    }
  };

  await Promise.all(ASSETS.map(loadOne));

  return {
    loaded: loadedNames,
    failed: failedNames,
    dispose() {
      loadedAssets.forEach(({ lod, slot }) => {
        slot.fallback.visible = true;
        slot.mount.remove(lod);
        disposeObject(lod);
      });
      ktx2Loader.dispose();
    },
  };
}
