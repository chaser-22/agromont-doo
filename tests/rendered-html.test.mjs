import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function invoke(url = "http://localhost:3005/", init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(url, init),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

function render(url = "http://localhost:3005/") {
  return invoke(url, { headers: { accept: "text/html" } });
}

test("server-renders the Agromont site with a nonce-protected CSP", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");

  const csp = response.headers.get("content-security-policy") ?? "";
  const nonce = csp.match(/'nonce-([a-f0-9]+)'/)?.[1];
  assert.ok(nonce, "CSP should include a per-response nonce");
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /base-uri 'self'/);
  assert.match(csp, /style-src [^;]*https:\/\/fonts\.googleapis\.com/);
  assert.match(csp, /font-src [^;]*https:\/\/fonts\.gstatic\.com/);

  const html = await response.text();
  assert.match(html, /<html lang="sr-ME"/);
  assert.match(html, /<title>AgroMont/);
  assert.match(html, /%2Fimages%2Fagromont-logo\.jpg/i);

  const scriptTags = [...html.matchAll(/<script\b[^>]*>/gi)].map(([tag]) => tag);
  assert.ok(scriptTags.length > 0, "rendered page should contain hydration scripts");
  for (const tag of scriptTags) {
    assert.match(tag, new RegExp(`\\bnonce="${nonce}"`));
  }
});

test("keeps sensitive security decisions server-controlled on both deployment targets", async () => {
  const [worker, policy, proxy, layout, page, config, vercel] = await Promise.all([
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../security/policy.ts", import.meta.url), "utf8"),
    readFile(new URL("../proxy.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../vercel.json", import.meta.url), "utf8"),
  ]);

  assert.match(worker, /ALLOWED_METHODS/);
  assert.match(worker, /isAllowedImageSource/);
  assert.match(worker, /createContentSecurityPolicy/);
  assert.match(policy, /source\.includes\("\.\."\)/);
  assert.match(policy, /\^\\\/images/);
  assert.match(policy, /Strict-Transport-Security|STRICT_TRANSPORT_SECURITY/);
  assert.match(proxy, /Content-Security-Policy/);
  assert.match(proxy, /requestHeaders\.set\("x-nonce"/);
  assert.match(proxy, /request\.nextUrl\.pathname === "\/_next\/image"/);
  assert.match(layout, /allowedHosts/);
  assert.match(layout, /agromont-crna-gora\.ennnyy\.chatgpt\.site/);
  assert.match(page, /rel="noopener noreferrer"/);
  assert.match(page, /name="website"/);
  assert.match(config, /poweredByHeader:\s*false/);
  assert.match(config, /dangerouslyAllowSVG:\s*false/);
  assert.match(config, /BASELINE_SECURITY_HEADERS/);
  assert.equal(JSON.parse(vercel).framework, "nextjs");
  assert.equal(JSON.parse(vercel).buildCommand, "npm run build:vercel");
});

test("includes responsive and accessible interaction safeguards", async () => {
  const [css, page] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(css, /@media \(max-width: 1080px\)/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(max-width: 420px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /min-width:\s*44px/);
  assert.match(page, /aria-expanded=\{menuOpen\}/);
  assert.match(page, /requestAnimationFrame\(\(\) => menuButtonRef\.current\?\.focus\(\)\)/);
  assert.match(page, /event\.key === "Escape"/);
  assert.match(page, /role="tablist"/);
  assert.match(page, /selectLocationWithKeyboard/);
  assert.match(page, /aria-controls="location-panel"/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /acceptCharset="UTF-8"/);
  assert.match(page, /rel="noopener noreferrer"/);
});

test("rejects unsupported requests and ignores untrusted hosts", async () => {
  const [post, options, remoteImage, traversalImage, poisonedHost] = await Promise.all([
    invoke("https://agromont-crna-gora.ennnyy.chatgpt.site/", { method: "POST" }),
    invoke("https://agromont-crna-gora.ennnyy.chatgpt.site/", { method: "OPTIONS" }),
    invoke("https://agromont-crna-gora.ennnyy.chatgpt.site/_next/image?url=https%3A%2F%2Fevil.example%2Fx.jpg&w=640&q=75"),
    invoke("https://agromont-crna-gora.ennnyy.chatgpt.site/_next/image?url=%2Fimages%2F..%2Fsecret.jpg&w=640&q=75"),
    render("https://evil.example/"),
  ]);

  assert.equal(post.status, 405);
  assert.equal(post.headers.get("allow"), "GET, HEAD, OPTIONS");
  assert.equal(options.status, 204);
  assert.equal(remoteImage.status, 400);
  assert.equal(traversalImage.status, 400);
  assert.equal(poisonedHost.headers.get("strict-transport-security"), "max-age=63072000; includeSubDomains");

  const poisonedHtml = await poisonedHost.text();
  assert.doesNotMatch(poisonedHtml, /evil\.example/i);
  assert.match(poisonedHtml, /https:\/\/agromont-crna-gora\.ennnyy\.chatgpt\.site/i);
});
