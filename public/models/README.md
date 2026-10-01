# AGROMONT hero asset sources

The production build generates original AGROMONT hero assets in this directory.

For the desktop logistics truck, the build also attempts to fetch the following
CC0 1.0 Universal asset as the preferred high-detail source:

- **Box truck with a roller shutter (Car Park and Road Vehicle Fleet)**
- Source: https://3dassets.dev/assets/car-park-and-road-vehicle-fleet-box-truck-4574c765
- Model: https://cdn.3dassets.dev/assets/32533/v1/model.glb
- License: CC0 1.0 Universal
- Declared size: 2.652 × 3.484 × 7.542 m
- Declared geometry: 25,972 triangles

The generated `truck-ultra.glb` remains the deterministic fallback if the
external CC0 source cannot be fetched during a build.
