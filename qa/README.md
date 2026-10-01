# AGROMONT 3D visual QA

This harness renders the real `SupplyChainExperience` on an isolated `/qa-3d` route and drives its camera timeline deterministically.

## What it records

For desktop 1440×900 and mobile 390×844 it produces:

- a WebM recording of the complete 3D progress sequence;
- PNG screenshots at key progress milestones;
- camera position, target and FOV;
- stage/progress state;
- WebGL vendor/renderer information when available;
- DPR and measured FPS;
- draw calls, triangles, geometry count and texture count;
- browser console errors and uncaught page errors;
- an HTML review page and machine-readable JSON report.

The automated pass fails on renderer/context errors, invalid camera data, missing draw calls, suspiciously empty geometry, or camera/FOV discontinuities. FPS is recorded but deliberately not used as a hard CI gate because GitHub-hosted runners use a software-rendered GPU and are not representative of real user hardware.

## Run locally

Use Node 22+.

```bash
npm ci
npm install --no-save --package-lock=false playwright@1.63.0
npx playwright install chromium
npm run build:vercel
npm run start:vercel
```

In another terminal:

```bash
QA_BASE_URL=http://127.0.0.1:3005 node qa/3d-visual-qa.mjs
```

Open `qa-artifacts/index.html` to review the videos, screenshots and metrics.

## CI

`.github/workflows/3d-visual-qa.yml` runs automatically when the 3D implementation changes in a pull request or on `main`. It can also be started manually with **Run workflow** in GitHub Actions.

The GitHub Action installs Playwright only inside the ephemeral CI environment, so the site dependency graph and production bundle remain unchanged.
