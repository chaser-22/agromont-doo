import { chromium } from "playwright";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = (process.env.QA_BASE_URL || "http://127.0.0.1:3005").replace(/\/$/, "");
const outputRoot = path.resolve(process.env.QA_OUTPUT_DIR || "qa-artifacts");
const milestones = [0, 0.06, 0.13, 0.19, 0.27, 0.35, 0.43, 0.51, 0.59, 0.67, 0.75, 0.83, 0.92, 1];

const profiles = [
  {
    name: "desktop-1440x900",
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
  {
    name: "mobile-390x844",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  },
];

function finiteArray(values) {
  return Array.isArray(values) && values.length > 0 && values.every(Number.isFinite);
}

function distance(a, b) {
  if (!a || !b || a.length !== 3 || b.length !== 3) return 0;
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function htmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: [
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--enable-unsafe-swiftshader",
    "--use-angle=swiftshader-webgl",
    "--disable-dev-shm-usage",
  ],
});

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  playwright: "1.63.0",
  profiles: [],
  failures: [],
};

for (const profile of profiles) {
  const profileDir = path.join(outputRoot, profile.name);
  await mkdir(profileDir, { recursive: true });

  const context = await browser.newContext({
    viewport: profile.viewport,
    screen: profile.viewport,
    deviceScaleFactor: profile.deviceScaleFactor,
    isMobile: profile.isMobile,
    hasTouch: profile.hasTouch,
    reducedMotion: "no-preference",
    colorScheme: "dark",
  });

  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.stack || error.message || String(error));
  });

  await page.goto(`${baseUrl}/qa-3d`, { waitUntil: "networkidle", timeout: 60_000 });

  await page.waitForFunction(
    () => {
      const qa = window.__AGROMONT_3D_QA__;
      return Boolean(qa?.ready && qa.snapshot?.().ready);
    },
    undefined,
    { timeout: 35_000 },
  );

  await page.waitForTimeout(600);

  const milestoneSnapshots = [];
  for (let index = 0; index < milestones.length; index += 1) {
    const progress = milestones[index];

    await page.evaluate((value) => window.__AGROMONT_3D_QA__.setProgress(value), progress);
    await page.waitForTimeout(profile.isMobile ? 420 : 520);

    const snapshot = await page.evaluate(() => window.__AGROMONT_3D_QA__.snapshot());
    milestoneSnapshots.push(snapshot);

    const label = String(index).padStart(2, "0");
    const percent = String(Math.round(progress * 100)).padStart(3, "0");
    await page.screenshot({
      path: path.join(profileDir, `frame-${label}-p${percent}.png`),
      type: "png",
    });

    if (snapshot.failed) {
      report.failures.push(`${profile.name}: WebGL context failed at progress ${progress}`);
    }
    if (!finiteArray(snapshot.camera?.position) || !finiteArray(snapshot.camera?.target)) {
      report.failures.push(`${profile.name}: invalid camera data at progress ${progress}`);
    }
    if (!Number.isFinite(snapshot.camera?.fov) || snapshot.camera.fov <= 0) {
      report.failures.push(`${profile.name}: invalid camera FOV at progress ${progress}`);
    }
    if (!Number.isFinite(snapshot.renderer?.calls) || snapshot.renderer.calls <= 0) {
      report.failures.push(`${profile.name}: renderer produced no draw calls at progress ${progress}`);
    }
    if (!Number.isFinite(snapshot.renderer?.triangles) || snapshot.renderer.triangles <= 100) {
      report.failures.push(`${profile.name}: suspiciously low triangle count at progress ${progress}`);
    }
  }

  const videoPath = path.join(profileDir, "scroll-sequence.webm");
  let screencastStarted = false;
  try {
    await page.screencast.start({
      path: videoPath,
      size: profile.viewport,
    });
    screencastStarted = true;

    await page.evaluate(() => window.__AGROMONT_3D_QA__.setProgress(0));
    await page.waitForTimeout(350);

    const motionSamples = [];
    const frameCount = profile.isMobile ? 180 : 210;
    let previous = null;
    let maxCameraStep = 0;
    let maxTargetStep = 0;
    let maxFovStep = 0;

    for (let frame = 0; frame <= frameCount; frame += 1) {
      const t = frame / frameCount;
      const eased = t * t * (3 - 2 * t);
      const snapshot = await page.evaluate(
        (value) => window.__AGROMONT_3D_QA__.setProgress(value),
        eased,
      );

      if (previous) {
        maxCameraStep = Math.max(maxCameraStep, distance(snapshot.camera.position, previous.camera.position));
        maxTargetStep = Math.max(maxTargetStep, distance(snapshot.camera.target, previous.camera.target));
        maxFovStep = Math.max(maxFovStep, Math.abs(snapshot.camera.fov - previous.camera.fov));
      }
      previous = snapshot;

      if (frame % 15 === 0 || frame === frameCount) {
        motionSamples.push(snapshot);
      }
      await page.waitForTimeout(profile.isMobile ? 32 : 28);
    }

    await page.waitForTimeout(450);
    await page.screencast.stop();
    screencastStarted = false;

    const finalSnapshot = await page.evaluate(() => window.__AGROMONT_3D_QA__.snapshot());

    if (maxCameraStep > 1.25) {
      report.failures.push(`${profile.name}: camera step discontinuity ${maxCameraStep.toFixed(3)}`);
    }
    if (maxTargetStep > 1.25) {
      report.failures.push(`${profile.name}: target step discontinuity ${maxTargetStep.toFixed(3)}`);
    }
    if (maxFovStep > 2.0) {
      report.failures.push(`${profile.name}: FOV step discontinuity ${maxFovStep.toFixed(3)}`);
    }

    const profileReport = {
      ...profile,
      consoleErrors,
      pageErrors,
      milestones: milestoneSnapshots,
      motion: {
        samples: motionSamples,
        maxCameraStep,
        maxTargetStep,
        maxFovStep,
      },
      final: finalSnapshot,
    };

    report.profiles.push(profileReport);
    await writeFile(
      path.join(profileDir, "metrics.json"),
      JSON.stringify(profileReport, null, 2),
      "utf8",
    );
  } finally {
    if (screencastStarted) {
      try {
        await page.screencast.stop();
      } catch {}
    }
    await context.close();
  }

  if (consoleErrors.length) {
    report.failures.push(`${profile.name}: ${consoleErrors.length} console error(s)`);
  }
  if (pageErrors.length) {
    report.failures.push(`${profile.name}: ${pageErrors.length} page error(s)`);
  }
}

await browser.close();

const cards = report.profiles.map((profile) => {
  const first = profile.milestones[0];
  const last = profile.milestones[profile.milestones.length - 1];
  const images = milestones.map((progress, index) => {
    const label = String(index).padStart(2, "0");
    const percent = String(Math.round(progress * 100)).padStart(3, "0");
    return `
      <figure>
        <img src="./${profile.name}/frame-${label}-p${percent}.png" alt="${profile.name} at ${percent}% progress">
        <figcaption>${percent}% · stage ${profile.milestones[index]?.stage ?? "?"}</figcaption>
      </figure>`;
  }).join("");

  return `
    <section>
      <h2>${htmlEscape(profile.name)}</h2>
      <p>
        GPU: <code>${htmlEscape(last?.gpu?.renderer || "unknown")}</code><br>
        DPR: <strong>${Number(last?.dpr || 0).toFixed(2)}</strong> ·
        Draw calls: <strong>${last?.renderer?.calls ?? "?"}</strong> ·
        Triangles: <strong>${last?.renderer?.triangles ?? "?"}</strong><br>
        Camera max step: <strong>${profile.motion.maxCameraStep.toFixed(3)}</strong> ·
        Target max step: <strong>${profile.motion.maxTargetStep.toFixed(3)}</strong> ·
        FOV max step: <strong>${profile.motion.maxFovStep.toFixed(3)}</strong>
      </p>
      <video controls muted loop preload="metadata" src="./${profile.name}/scroll-sequence.webm"></video>
      <div class="frames">${images}</div>
      <details><summary>Renderer metrics</summary><pre>${htmlEscape(JSON.stringify({ first, last }, null, 2))}</pre></details>
    </section>`;
}).join("");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AGROMONT 3D Visual QA</title>
<style>
  :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  body { margin:0; background:#0c110d; color:#f2eee4; }
  main { width:min(1500px,calc(100% - 32px)); margin:0 auto; padding:32px 0 80px; }
  h1 { font-size:clamp(32px,5vw,72px); margin:0 0 12px; letter-spacing:-.05em; }
  h2 { margin-top:52px; font-size:28px; }
  p { color:#b9c0b9; line-height:1.6; }
  code { color:#e2a348; }
  video { width:min(100%,1100px); border:1px solid #344038; background:#000; display:block; }
  .frames { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:12px; margin-top:20px; }
  figure { margin:0; border:1px solid #2a342d; background:#111814; }
  img { width:100%; display:block; }
  figcaption { padding:8px 10px; color:#aeb8b0; font-size:12px; }
  pre { white-space:pre-wrap; overflow:auto; color:#cbd3cc; }
  .pass { color:#81c995; } .fail { color:#ff8a80; }
</style>
</head>
<body>
<main>
  <h1>AGROMONT 3D Visual QA</h1>
  <p>Generated ${htmlEscape(report.generatedAt)} against <code>${htmlEscape(report.baseUrl)}</code>.</p>
  <p class="${report.failures.length ? "fail" : "pass"}">
    ${report.failures.length ? `${report.failures.length} automated failure(s)` : "Automated structural checks passed"}
  </p>
  ${report.failures.length ? `<pre>${htmlEscape(report.failures.join("\n"))}</pre>` : ""}
  ${cards}
</main>
</body>
</html>`;

await writeFile(path.join(outputRoot, "index.html"), html, "utf8");
await writeFile(path.join(outputRoot, "report.json"), JSON.stringify(report, null, 2), "utf8");

const summary = [
  "# AGROMONT 3D Visual QA",
  "",
  `Target: \`${baseUrl}\``,
  `Profiles: ${profiles.map((profile) => profile.name).join(", ")}`,
  `Result: ${report.failures.length ? `❌ ${report.failures.length} failure(s)` : "✅ structural checks passed"}`,
  "",
  "Artifacts include a WebM scroll recording, milestone PNGs, renderer metrics JSON, and an HTML review page for each profile.",
  "",
  ...report.failures.map((failure) => `- ${failure}`),
].join("\n");

await writeFile(path.join(outputRoot, "summary.md"), summary, "utf8");
console.log(summary);

if (report.failures.length) process.exitCode = 1;
