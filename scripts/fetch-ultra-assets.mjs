import fs from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "public/models");
await fs.mkdir(outputDir, { recursive: true });

const assets = [
  {
    file: "luton-box-cc0.glb",
    url: "https://cdn.3dassets.dev/assets/32539/v1/model.glb",
    label: "Luton box van with a tail lift",
  },
  {
    file: "grader-scanner-cc0.glb",
    url: "https://cdn.3dassets.dev/assets/34789/v1/model.glb",
    label: "Parcel scanner arch over a belt",
  },
];

for (const asset of assets) {
  const target = path.join(outputDir, asset.file);
  try {
    const existing = await fs.stat(target).catch(() => null);
    if (existing?.size > 1024) {
      console.log(`[ultra-assets] cached ${asset.file} ${(existing.size / 1024).toFixed(1)} KiB`);
      continue;
    }

    const response = await fetch(asset.url, {
      headers: { "user-agent": "AGROMONT-build/1.0" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.byteLength < 1024) throw new Error("unexpectedly small asset");
    await fs.writeFile(target, bytes);
    console.log(`[ultra-assets] fetched ${asset.label}: ${(bytes.byteLength / 1024).toFixed(1)} KiB`);
  } catch (error) {
    // Hero GLBs are enhancements, never a hard deployment dependency.
    console.warn(`[ultra-assets] ${asset.file} unavailable; procedural fallback will remain active: ${error instanceof Error ? error.message : String(error)}`);
  }
}
