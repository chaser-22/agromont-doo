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


const textureDir = path.resolve(process.cwd(), "public/textures/ultra");
await fs.mkdir(textureDir, { recursive: true });

function collectUrls(value, prefix = "", out = []) {
  if (typeof value === "string" && /^https?:\/\//.test(value)) {
    out.push({ path: prefix.toLowerCase(), url: value });
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectUrls(item, `${prefix}/${index}`, out));
    return out;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      collectUrls(child, `${prefix}/${key}`, out);
    }
  }
  return out;
}

async function fetchPolyHavenFile(asset, matcher, file) {
  const target = path.join(textureDir, file);
  try {
    const existing = await fs.stat(target).catch(() => null);
    if (existing?.size > 1024) {
      console.log(`[ultra-assets] cached ${file} ${(existing.size / 1024).toFixed(1)} KiB`);
      return;
    }

    const metadataResponse = await fetch(`https://api.polyhaven.com/files/${asset}`, {
      signal: AbortSignal.timeout(20_000),
    });
    if (!metadataResponse.ok) throw new Error(`metadata HTTP ${metadataResponse.status}`);
    const metadata = await metadataResponse.json();
    const candidates = collectUrls(metadata);
    const chosen = candidates.find(({ path: candidatePath, url }) => matcher(candidatePath, url));
    if (!chosen) throw new Error("no matching download in Poly Haven manifest");

    const assetResponse = await fetch(chosen.url, { signal: AbortSignal.timeout(30_000) });
    if (!assetResponse.ok) throw new Error(`asset HTTP ${assetResponse.status}`);
    const bytes = Buffer.from(await assetResponse.arrayBuffer());
    if (bytes.byteLength < 1024) throw new Error("unexpectedly small texture");
    await fs.writeFile(target, bytes);
    console.log(`[ultra-assets] fetched Poly Haven ${asset}/${file}: ${(bytes.byteLength / 1024).toFixed(1)} KiB`);
  } catch (error) {
    console.warn(`[ultra-assets] ${file} unavailable; procedural surface fallback will remain active: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const is1kJpg = (path, url) =>
  /1k/.test(path) &&
  /\.(jpe?g)(\?|$)/i.test(url);

await Promise.all([
  fetchPolyHavenFile("asphalt_01", (p, u) => is1kJpg(p, u) && /diff|diffuse/.test(p), "asphalt-diffuse.jpg"),
  fetchPolyHavenFile("asphalt_01", (p, u) => is1kJpg(p, u) && /nor[_ -]?gl|normal.*gl/.test(p), "asphalt-normal.jpg"),
  fetchPolyHavenFile("asphalt_01", (p, u) => is1kJpg(p, u) && /rough/.test(p) && !/arm/.test(p), "asphalt-roughness.jpg"),
  fetchPolyHavenFile("concrete_floor_01", (p, u) => is1kJpg(p, u) && /diff|diffuse/.test(p), "concrete-diffuse.jpg"),
  fetchPolyHavenFile("concrete_floor_01", (p, u) => is1kJpg(p, u) && /nor[_ -]?gl|normal.*gl/.test(p), "concrete-normal.jpg"),
  fetchPolyHavenFile("concrete_floor_01", (p, u) => is1kJpg(p, u) && /rough/.test(p) && !/arm/.test(p), "concrete-roughness.jpg"),
  fetchPolyHavenFile(
    "factory_yard",
    (p, u) => /1k/.test(p) && /\.hdr(\?|$)/i.test(u),
    "factory-yard-1k.hdr",
  ),
]);
