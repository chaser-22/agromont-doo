import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("public/assets/photoreal");
const API = "https://api.polyhaven.com";
const UA = "AGROMONT-Photoreal-Asset-Pipeline/1.0";

await mkdir(ROOT, { recursive: true });

function collectUrls(value, output = []) {
  if (typeof value === "string" && /^https?:\/\//i.test(value)) {
    output.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectUrls(item, output);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectUrls(item, output);
  }
  return output;
}

async function json(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

function choose(urls, regexes) {
  for (const regex of regexes) {
    const hit = urls.find((url) => regex.test(decodeURIComponent(url).toLowerCase()));
    if (hit) return hit;
  }
  return null;
}

async function download(url, filename) {
  const response = await fetch(url, { headers: { "User-Agent": UA } });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(path.join(ROOT, filename), bytes);
  console.log(`[photoreal] ${filename}: ${(bytes.length / 1024 / 1024).toFixed(2)} MB`);
  return { filename, bytes: bytes.length, source: url };
}

async function texture(id, prefix) {
  const tree = await json(`${API}/files/${id}`);
  const urls = collectUrls(tree);
  const defs = [
    ["basecolor", [
      new RegExp(`${id}_diff_1k\\.(jpg|jpeg)$`),
      new RegExp(`${id}_diff_2k\\.(jpg|jpeg)$`),
      new RegExp(`${id}_diff_1k\\.png$`),
    ]],
    ["normal", [
      new RegExp(`${id}_nor_gl_1k\\.(jpg|jpeg)$`),
      new RegExp(`${id}_nor_gl_2k\\.(jpg|jpeg)$`),
      new RegExp(`${id}_nor_gl_1k\\.png$`),
    ]],
    ["roughness", [
      new RegExp(`${id}_rough_1k\\.(jpg|jpeg)$`),
      new RegExp(`${id}_rough_2k\\.(jpg|jpeg)$`),
      new RegExp(`${id}_rough_1k\\.png$`),
    ]],
  ];

  const files = [];
  for (const [kind, regexes] of defs) {
    const url = choose(urls, regexes);
    if (!url) throw new Error(`Missing ${kind} map for Poly Haven asset ${id}`);
    const ext = new URL(url).pathname.toLowerCase().endsWith(".png") ? "png" : "jpg";
    files.push(await download(url, `${prefix}-${kind}.${ext}`));
  }
  return files;
}

async function hdri(id, filename) {
  const tree = await json(`${API}/files/${id}`);
  const urls = collectUrls(tree);
  const url = choose(urls, [
    new RegExp(`${id}_1k\\.hdr$`),
    new RegExp(`${id}_2k\\.hdr$`),
    new RegExp(`${id}_4k\\.hdr$`),
  ]);
  if (!url) throw new Error(`Missing HDR file for Poly Haven asset ${id}`);
  return download(url, filename);
}

const files = [
  ...(await texture("asphalt_floor", "asphalt")),
  ...(await texture("concrete_floor_01", "concrete")),
  ...(await texture("corrugated_iron_02", "corrugated")),
  await hdri("hanger_exterior_cloudy", "industrial-overcast.hdr"),
];

const manifest = {
  generatedAt: new Date().toISOString(),
  source: "Poly Haven",
  sourceUrl: "https://polyhaven.com",
  license: "CC0",
  assets: {
    asphalt: "https://polyhaven.com/a/asphalt_floor",
    concrete: "https://polyhaven.com/a/concrete_floor_01",
    corrugated: "https://polyhaven.com/a/corrugated_iron_02",
    hdri: "https://polyhaven.com/a/hanger_exterior_cloudy",
  },
  files,
};

await writeFile(path.join(ROOT, "manifest.json"), JSON.stringify(manifest, null, 2));
await writeFile(
  path.join(ROOT, "README.txt"),
  "AGROMONT photoreal material/HDR assets. Source: Poly Haven. License: CC0.\n",
);
console.log("[photoreal] complete");
