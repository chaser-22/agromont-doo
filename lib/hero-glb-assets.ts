export type HeroAssetQuality = "high" | "medium" | "fallback";

const assetUrls = {
  grader: {
    high: "/assets/hero/egg-grader-high.glb",
    medium: "/assets/hero/egg-grader-medium.glb",
  },
  process: {
    high: "/assets/hero/process-skid-high.glb",
    medium: "/assets/hero/process-skid-medium.glb",
  },
} as const;

export async function loadHeroGlb(
  kind: "grader" | "process",
  quality: Exclude<HeroAssetQuality, "fallback">,
  shadows: boolean,
) {
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(assetUrls[kind][quality]);
  const root = gltf.scene;
  root.name = `AGROMONT_${kind}_${quality}_GLB`;

  root.traverse((object: any) => {
    if (!object.isMesh) return;
    object.castShadow = shadows;
    object.receiveShadow = shadows;
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) {
      if (!material) continue;
      if ("envMapIntensity" in material) material.envMapIntensity = kind === "grader" ? 0.86 : 0.76;
      if ("normalScale" in material && material.normalScale?.setScalar) {
        material.normalScale.setScalar(kind === "grader" ? 0.72 : 0.62);
      }
    }
  });

  return root;
}
