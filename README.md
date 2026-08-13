# AgroMont corporate website

Responsive AgroMont marketing site with two supported deployment targets:

- OpenAI Sites / Cloudflare through Vinext
- Vercel through native Next.js 16

## Requirements

- Node.js 22.13 or newer
- npm

## Local development

The default Sites/Vinext development server uses port `3005`:

```bash
npm ci
npm run dev
```

To test the native Vercel/Next.js target on the same port:

```bash
npm run dev:vercel
```

## Release verification

```bash
npm test
npm run lint
npm audit --omit=dev
```

`npm test` builds both deployment targets and runs the security, request-boundary,
responsive-structure, and server-rendering regression suite.

## OpenAI Sites deployment

```bash
npm run build:sites
```

The `.openai/hosting.json` file identifies the existing private Sites project.
Use the Sites publishing workflow to package and deploy the generated `dist`
output.

## Vercel deployment

The repository includes `vercel.json`, a native Next.js build, strict request
proxy protections, and Vercel-compatible response headers.

```bash
npm run build:vercel
npm run start:vercel
```

Import the repository into Vercel without overriding the committed build or
install commands. Vercel runs `npm ci` followed by `npm run build:vercel`.

## Security model

- per-request nonce-based Content Security Policy on rendered HTML
- HSTS and restrictive browser security headers
- unsupported-method and oversized-URL rejection
- local-only, traversal-resistant image optimizer sources
- fixed canonical host allowlist
- sanitized, length-limited contact values and a bot honeypot
- no application database, authentication surface, uploads, or server-side form storage

The contact form deliberately prepares a user-controlled email draft. It does
not transmit or retain personal information on the website.

## Program imagery

The six product-category photographs are original AI-generated assets created
specifically for the AgroMont website and optimized locally as WebP files.
