export type SupplyQualityTier = "ultra" | "standard" | "mobile" | "low";

export type SupplyQualityProfile = {
  tier: SupplyQualityTier;
  preferWebGPU: boolean;
  maxDpr: number;
  minDpr: number;
  targetFps: number;
  shadowMapSize: number;
  surfaceMapSize: number;
  anisotropy: number;
  transmissionScale: number;
  ultra: boolean;
};

type ResolveQualityArgs = {
  qaMode: boolean;
  reducedMotion: boolean;
  width: number;
  devicePixelRatio: number;
  hardwareConcurrency: number;
  deviceMemory?: number;
  webGPUAvailable: boolean;
};

export function resolveSupplyQuality({
  qaMode,
  reducedMotion,
  width,
  devicePixelRatio,
  hardwareConcurrency,
  deviceMemory,
  webGPUAvailable,
}: ResolveQualityArgs): SupplyQualityProfile {
  if (qaMode) {
    return {
      tier: "standard",
      preferWebGPU: false,
      maxDpr: 0.70,
      minDpr: 0.70,
      targetFps: 44,
      shadowMapSize: 2048,
      surfaceMapSize: 256,
      anisotropy: 4,
      transmissionScale: 0.68,
      ultra: false,
    };
  }

  if (width <= 900) {
    const low = width <= 430 || hardwareConcurrency <= 4;
    return low
      ? {
          tier: "low",
          preferWebGPU: false,
          maxDpr: Math.min(devicePixelRatio, 0.78),
          minDpr: 0.60,
          targetFps: 28,
          shadowMapSize: 0,
          surfaceMapSize: 128,
          anisotropy: 2,
          transmissionScale: 0.45,
          ultra: false,
        }
      : {
          tier: "mobile",
          preferWebGPU: false,
          maxDpr: Math.min(devicePixelRatio, 1.0),
          minDpr: 0.72,
          targetFps: 32,
          shadowMapSize: 0,
          surfaceMapSize: 192,
          anisotropy: 4,
          transmissionScale: 0.52,
          ultra: false,
        };
  }

  const memoryIsHealthy = deviceMemory == null || deviceMemory >= 8;
  const ultra =
    !reducedMotion &&
    webGPUAvailable &&
    width >= 1180 &&
    hardwareConcurrency >= 8 &&
    memoryIsHealthy;

  if (ultra) {
    return {
      tier: "ultra",
      preferWebGPU: true,
      maxDpr: Math.min(devicePixelRatio, 1.65),
      minDpr: 1.0,
      targetFps: 50,
      shadowMapSize: 4096,
      surfaceMapSize: 512,
      anisotropy: 12,
      transmissionScale: 0.82,
      ultra: true,
    };
  }

  return {
    tier: "standard",
    preferWebGPU: false,
    maxDpr: Math.min(devicePixelRatio, 1.4),
    minDpr: 0.9,
    targetFps: 44,
    shadowMapSize: 2048,
    surfaceMapSize: 256,
    anisotropy: 8,
    transmissionScale: 0.70,
    ultra: false,
  };
}
