# AI Project Memory

Last updated: 2026-07-11

## Project

- Name: RTR4 Web Lab
- Repository: `git@github.com:sznswjr/rtr-learning.git`
- Production domain: `https://www.jrqz776.com`
- Purpose: browser-based real-time rendering learning experiments for *Real-Time Rendering, 4th Edition*.

## Current Scope

- Chapter 2 has an interactive rendering pipeline lab:
  - Visualizes application, geometry, rasterization, and pixel processing stages.
  - Controls include observed stage, scene complexity, and clipping mode.
- Chapter 5 is presented as an ordered set of interactive experiments:
  - 5.1 shading models: Lambert, Gooch, and toon-style sphere visualizations.
  - 5.2 light attenuation: inverse-square, finite radius, and windowed falloff curves.
  - 5.3.1 computation frequency: object-, vertex-, and pixel-frequency shading comparison.
  - 5.4 anti-aliasing: No AA, SSAA, and MSAA WebGL2 comparison.
  - 5.4.2 sampling patterns: center, grid, rotated grid, N-Rooks, stratified random, Poisson-like.
  - 5.5 transparency and compositing: source-over ordering and weighted OIT approximation.
  - 5.6 display encoding: linear coverage/filtering before gamma/sRGB-style encoding.
- Chapter 6 has a texture filtering comparison lab:
  - Compares nearest/no filtering, bilinear, trilinear, SAT-style area averaging, and anisotropic sampling.
  - Uses a grazing-angle high-frequency procedural texture so aliasing, MIP blur, SAT stability, and anisotropic detail retention are visually obvious.
- Chapter 6.4 uses a real WebGL2 cube-map texture to compare reflection, refraction, and Fresnel mixing with adjustable roughness and index of refraction.
- Chapter 6.5 uploads a procedural 64³ density field as a WebGL2 3D texture and compares an axis slice, maximum-intensity projection, and front-to-back alpha accumulation.
- The homepage is now a chapter index instead of hosting every experiment inline.
- Chapter pages:
  - `chapters/chapter-2.html`
  - `chapters/chapter-5.html`
  - `chapters/chapter-6.html`
- Page entry scripts live in `src/pages/`.
- The homepage navigation includes the RTR4 Chinese translation page, chapter entries, lab counts, renderer tags, and direct lab links.
- Homepage navigation metadata now lives in `src/app/lab-registry.js` and is rendered by `src/app/home-nav.js`.
- Chapter in-page navigation is rendered from the same registry by `src/app/chapter-nav.js`.
- Chapter navigation stays sticky on narrow screens and tracks the active experiment with `aria-current`.
- Chapter 2 and Chapter 6 use dedicated narrow-screen Canvas layouts; core diagrams are no longer compressed or clipped on phones.
- Keyboard skip links, visible focus rings, Canvas accessible names, range `aria-valuetext`, reduced-motion behavior, and WebGL2 failure feedback are included site-wide.
- Chapter 2 rendering pipeline code now lives in `src/labs/chapter-2/pipeline.js`.
- Chapter 5 lab code now lives in `src/labs/chapter-5/`:
  - `anti-aliasing.js`
  - `display-encoding.js`
  - `light-attenuation.js`
  - `sampling-patterns.js`
  - `shading-frequency.js`
  - `shading-models.js`
  - `transparency-compositing.js`
- Chapter 6 lab code now lives in `src/labs/chapter-6/texture-filtering.js`.
- Shared Canvas, color, math, shading, and WebGL helpers now live in `src/render/`.
- The HSL hue normalization bug in `src/render/color.js` is covered by `scripts/check-color.mjs`.
- Expensive shading and texture controls render a coalesced preview while dragging and restore full quality after interaction settles.
- `src/main.js` is now a small module entrypoint that initializes labs.
- The translation page is available at `translations/rtr4-cn.html` and currently includes organized Chinese reading content for Chapter 0-2.
- Local knowledge base is tracked as a Git submodule at `knowledge/Real-Time-Rendering-4th-CN`, pinned to `9c2e724e688fc921ec0486d8fde4f516af2a5873` from `https://github.com/Morakito/Real-Time-Rendering-4th-CN.git`.

## Stack

- Static site.
- Plain HTML, CSS, and browser ES modules.
- WebGL2 for rendering.
- No Node runtime, framework, bundler, or package manager is required for production.
- `package.json` currently only provides local verification scripts.

## Important Paths

- Source root: `/home/ubuntu/rtr4-web-lab`
- Production web root: `/var/www/www.jrqz776.com`
- Nginx site config: `/etc/nginx/sites-available/www.jrqz776.com`
- Enabled Nginx symlink: `/etc/nginx/sites-enabled/www.jrqz776.com`
- TLS certificate: `/etc/letsencrypt/live/www.jrqz776.com/fullchain.pem`
- TLS private key: `/etc/letsencrypt/live/www.jrqz776.com/privkey.pem`

## Deployment

The site is deployed by copying static files to the Nginx web root:

```bash
sudo cp /home/ubuntu/rtr4-web-lab/index.html /var/www/www.jrqz776.com/index.html
sudo cp /home/ubuntu/rtr4-web-lab/src/main.js /var/www/www.jrqz776.com/src/main.js
sudo cp /home/ubuntu/rtr4-web-lab/src/styles.css /var/www/www.jrqz776.com/src/styles.css
sudo mkdir -p /var/www/www.jrqz776.com/chapters
sudo cp /home/ubuntu/rtr4-web-lab/chapters/*.html /var/www/www.jrqz776.com/chapters/
sudo mkdir -p /var/www/www.jrqz776.com/src/app
sudo cp /home/ubuntu/rtr4-web-lab/src/app/*.js /var/www/www.jrqz776.com/src/app/
sudo mkdir -p /var/www/www.jrqz776.com/src/pages
sudo cp /home/ubuntu/rtr4-web-lab/src/pages/*.js /var/www/www.jrqz776.com/src/pages/
sudo mkdir -p /var/www/www.jrqz776.com/src/render
sudo cp /home/ubuntu/rtr4-web-lab/src/render/*.js /var/www/www.jrqz776.com/src/render/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-2
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-2/*.js /var/www/www.jrqz776.com/src/labs/chapter-2/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-5
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-5/*.js /var/www/www.jrqz776.com/src/labs/chapter-5/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-6
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-6/*.js /var/www/www.jrqz776.com/src/labs/chapter-6/
sudo mkdir -p /var/www/www.jrqz776.com/translations
sudo cp /home/ubuntu/rtr4-web-lab/translations/rtr4-cn.html /var/www/www.jrqz776.com/translations/rtr4-cn.html
```

When changing JavaScript or CSS, update the query-string version in `index.html` and any static import URLs because Nginx caches static assets for 7 days.

This is a remote server. The user cannot open `127.0.0.1` from their machine. Local HTTP servers may be used only for server-side self-checks; user-facing verification should deploy to `/var/www/www.jrqz776.com` and check `https://www.jrqz776.com`.

Latest production deployment:

- Date: 2026-07-11
- Added Chapter 6.4 cube-map environment mapping and Chapter 6.5 WebGL2 3D texture experiments, including responsive layouts and coalesced low-resolution volume previews while controls are moving.
- Asset cache version: `20260711-2` for CSS and the environment modules; `20260711-3` for the final volume interaction update.
- Verification passed:
  - `npm run check:js`
  - `npm run check:color`
  - `npm run check:ui`
  - `git diff --check`
  - `sudo nginx -t`
  - `curl -I https://www.jrqz776.com` returned `HTTP/2 200`
  - `curl -I https://www.jrqz776.com/chapters/chapter-2.html` returned `HTTP/2 200`
  - `curl -I https://www.jrqz776.com/chapters/chapter-5.html` returned `HTTP/2 200`
  - `curl -I https://www.jrqz776.com/chapters/chapter-6.html` returned `HTTP/2 200`
  - `curl -I https://www.jrqz776.com/src/main.js?v=20260711-2` returned `HTTP/2 200`
  - `curl -I https://www.jrqz776.com/src/app/chapter-nav.js?v=20260711-2` returned `HTTP/2 200`
  - `curl -I https://www.jrqz776.com/src/pages/chapter-2.js?v=20260711-1` returned `HTTP/2 200`
  - `curl -I https://www.jrqz776.com/src/pages/chapter-5.js?v=20260711-1` returned `HTTP/2 200`
  - `curl -I https://www.jrqz776.com/src/pages/chapter-6.js?v=20260711-3` returned `HTTP/2 200`
  - `curl -I https://www.jrqz776.com/src/labs/chapter-6/texture-filtering.js?v=20260710-1` returned `HTTP/2 200`
  - `curl -I https://www.jrqz776.com/src/labs/chapter-6/environment-mapping.js?v=20260711-2` returned `HTTP/2 200`
  - `curl -I https://www.jrqz776.com/src/labs/chapter-6/volume-textures.js?v=20260711-3` returned `HTTP/2 200`
  - `curl -I https://www.jrqz776.com/translations/rtr4-cn.html` returned `HTTP/2 200`
  - `curl -I http://www.jrqz776.com` returned `301` to HTTPS

## Server Context

This server also runs a separate proxy service on `proxy.jrqz776.com`.

- Do not change `/etc/nginx/sites-available/proxy.jrqz776.com` unless explicitly asked.
- Do not touch Xray config or service files for this web project.
- `www.jrqz776.com` is intentionally isolated as its own Nginx server block.

## Verification

Useful checks:

```bash
npm run check:js
npm run check:ui
sudo nginx -t
curl -I https://www.jrqz776.com
curl -I https://proxy.jrqz776.com/api.proxy.97ae8184734ddb6e
```

Expected:

- `https://www.jrqz776.com` returns `HTTP/2 200`.
- `http://www.jrqz776.com` redirects to HTTPS.
- The proxy gRPC path returns `HTTP/2 415` for plain curl, which means it still routes to the proxy service.
- `npm run check:ui` uses Playwright Chromium against production, checks responsive screenshots, console/network errors, horizontal overflow, crushed headings, and key 2D canvas nonblank pixels. Screenshots are written to `.tmp/ui-checks/`.

## Code Notes

- Keep the project static unless there is a concrete need for build tooling.
- Register navigation-facing lab/content metadata in `src/app/lab-registry.js`.
- Keep homepage navigation rendering in `src/app/home-nav.js`.
- Keep chapter in-page navigation rendering in `src/app/chapter-nav.js`.
- Keep page entry scripts in `src/pages/`.
- Put chapter-specific labs under `src/labs/<chapter>/`.
- Put shared rendering helpers under `src/render/`.
- Keep `src/main.js` as a small entrypoint only.
- Prefer WebGL2 primitives and small local helpers for experiments.
- Keep controls explicit and observable; show derived render sizes when they help understand sampling.
- Avoid adding unrelated visual polish that obscures the rendering experiment.
