# AI Project Memory

Last updated: 2026-08-03

## Project

- Name: RTR4 Web Lab
- Repository: `git@github.com:sznswjr/rtr-learning.git`
- Production domain: `https://www.jrqz776.com`
- Purpose: browser-based real-time rendering learning experiments for *Real-Time Rendering, 4th Edition*.

## Current Scope

- Chapter 1 has a WebGL2 frame-budget lab:
  - Varies target frame rate, internal render scale, and fragment workload while graphing recent frame intervals.
  - Reports frame budget, frame interval, GPU time when timer queries are available, and derived pixel workload.
- Chapter 2 has an interactive rendering pipeline lab:
  - Visualizes application, geometry, rasterization, and pixel processing stages.
  - Controls include observed stage, scene complexity, and clipping mode.
- Chapter 3 has a WebGL2 barycentric rasterization lab:
  - Computes edge functions, barycentric weights, interpolated attributes, and sample coverage in a fragment shader.
  - Controls include display mode, triangle skew, grid density, pixel sample position, and a pointer-driven probe.
- Chapter 4 has a WebGL2 coordinate transform lab:
  - Renders a cube on a world grid and traces one vertex through model, world, view, clip, and NDC spaces.
  - Controls include inspected space, projection type, model rotation/translation, camera azimuth, field of view, and selected vertex.
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
- Chapter 7 uses a real depth texture and two-pass WebGL2 shadow-mapping pipeline with adjustable map resolution, constant/slope bias, PCF kernel, and diagnostic views.
- Chapter 8 renders an HDR scene into an `RGBA16F` framebuffer, then applies exposure, white-point normalization, clip/Reinhard/ACES tone mapping, and linear/sRGB or false-color output.
- Chapter 9 renders a GGX/Smith/Schlick Cook-Torrance material matrix and can isolate the D, F, and G terms while varying roughness, metallic offset, light angle, and intensity.
- Chapter 10.4 uses a real WebGL2 cube-map texture to compare reflection, refraction, and Fresnel mixing with adjustable roughness and index of refraction.
- Chapter 14.3 uploads a procedural 64³ density field as a WebGL2 3D texture and compares an axis slice, maximum-intensity projection, and front-to-back alpha accumulation.
- The homepage is now a chapter index instead of hosting every experiment inline.
- Chapter 1-26 each have a static route at `chapters/chapter-<n>.html`; chapters without implemented labs use generated planning shells.
- Page entry scripts live in `src/pages/`.
- The homepage navigation includes the RTR4 Chinese translation page, chapter entries, lab counts, renderer tags, and direct lab links.
- Homepage navigation metadata now lives in `src/app/lab-registry.js` and is rendered by `src/app/home-nav.js`.
- Chapter in-page navigation is rendered from the same registry by `src/app/chapter-nav.js`.
- Chapter navigation stays sticky on narrow screens and tracks the active experiment with `aria-current`.
- Chapter 2 and Chapter 6 use dedicated narrow-screen Canvas layouts; core diagrams are no longer compressed or clipped on phones.
- Keyboard skip links, visible focus rings, Canvas accessible names, range `aria-valuetext`, reduced-motion behavior, and WebGL2 failure feedback are included site-wide.
- Chapter 2 rendering pipeline code now lives in `src/labs/chapter-2/pipeline.js`.
- Chapter 1 frame-budget code lives in `src/labs/chapter-1/frame-budget.js`.
- Chapter 3 rasterization code lives in `src/labs/chapter-3/barycentric-rasterization.js`.
- Chapter 4 transform code lives in `src/labs/chapter-4/coordinate-transforms.js`.
- Chapter 5 lab code now lives in `src/labs/chapter-5/`:
  - `anti-aliasing.js`
  - `display-encoding.js`
  - `light-attenuation.js`
  - `sampling-patterns.js`
  - `shading-frequency.js`
  - `shading-models.js`
  - `transparency-compositing.js`
- Chapter 6 now owns texture filtering only. Its old environment and volume anchors remain as migration cards linking to Chapter 10.4 and Chapter 14.3.
- Chapter 7 shadow mapping, Chapter 8 HDR display transform, and Chapter 9 microfacet BRDF live under their corresponding `src/labs/chapter-7/`, `chapter-8/`, and `chapter-9/` directories.
- Environment mapping lives in `src/labs/chapter-10/`; volume textures live in `src/labs/chapter-14/`.
- Shared Canvas, color, math, shading, and WebGL helpers now live in `src/render/`.
- Shared camera, orthographic projection, transform matrices, cube/plane geometry, depth/float framebuffer, GPU timing, and postprocess foundations also live in `src/render/`.
- The HSL hue normalization bug in `src/render/color.js` is covered by `scripts/check-color.mjs`.
- Expensive shading and texture controls render a coalesced preview while dragging and restore full quality after interaction settles.
- `src/main.js` is now a small module entrypoint that initializes labs.
- The translation page is available at `translations/rtr4-cn.html` and includes organized Chinese reading content for Chapter 0-26, with a complete chapter index, topic summaries, source links, and related lab entry points.
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
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-1
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-1/*.js /var/www/www.jrqz776.com/src/labs/chapter-1/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-2
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-2/*.js /var/www/www.jrqz776.com/src/labs/chapter-2/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-3
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-3/*.js /var/www/www.jrqz776.com/src/labs/chapter-3/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-4
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-4/*.js /var/www/www.jrqz776.com/src/labs/chapter-4/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-5
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-5/*.js /var/www/www.jrqz776.com/src/labs/chapter-5/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-6
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-6/*.js /var/www/www.jrqz776.com/src/labs/chapter-6/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-7
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-7/*.js /var/www/www.jrqz776.com/src/labs/chapter-7/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-8
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-8/*.js /var/www/www.jrqz776.com/src/labs/chapter-8/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-9
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-9/*.js /var/www/www.jrqz776.com/src/labs/chapter-9/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-10
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-10/*.js /var/www/www.jrqz776.com/src/labs/chapter-10/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-14
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-14/*.js /var/www/www.jrqz776.com/src/labs/chapter-14/
sudo mkdir -p /var/www/www.jrqz776.com/translations
sudo cp /home/ubuntu/rtr4-web-lab/translations/rtr4-cn.html /var/www/www.jrqz776.com/translations/rtr4-cn.html
```

When changing JavaScript or CSS, update the query-string version in `index.html` and any static import URLs because Nginx caches static assets for 7 days.

This is a remote server. The user cannot open `127.0.0.1` from their machine. Local HTTP servers may be used only for server-side self-checks; user-facing verification should deploy to `/var/www/www.jrqz776.com` and check `https://www.jrqz776.com`.

Latest production deployment:

- Date: 2026-08-03
- Expanded the second implementation phase with active WebGL2 labs in Chapters 1, 3, 4, 7, 8, and 9; 15 generated planning pages remain.
- Chapter 1 visualizes the relationship between frame-rate targets, frame budgets, resolution, fragment workload, measured frame intervals, and GPU timing support.
- Chapter 3 visualizes edge functions, barycentric weights, interpolated attributes, sample coverage, and a pointer-driven pixel probe.
- Chapter 4 renders a transformed cube and traces a selected vertex through model, world, view, clip, and NDC spaces under perspective or orthographic projection.
- Chapter 7 demonstrates depth-only light rendering, shadow comparison, bias, and PCF filtering.
- Chapter 8 demonstrates HDR intermediate storage, exposure, tone mapping, and display encoding.
- Chapter 9 demonstrates the GGX, Smith, and Schlick terms of a microfacet BRDF across roughness and metallic values.
- Added reusable orthographic projection, transform/scale matrices, point transformation, cube/plane geometry, depth targets, and float framebuffer support to `src/render/`.
- Asset cache version: `20260803-2` for CSS, navigation modules, page entry modules, and WebGL lab imports.
- Verification passed:
  - `npm run check:js`
  - `npm run check:color`
  - `npm run check:chapters`
  - `npm run check:ui`
  - `git diff --check`
  - `sudo nginx -t`
  - `curl -I https://www.jrqz776.com` returned `HTTP/2 200`
  - Production route check passed for all Chapter 1-26 pages.
  - Production UI check passed for 13 pages across desktop, laptop, tablet, and mobile viewports.
  - Production shared WebGL render-foundation check passed.
  - Chapters 1, 3, 4, 7, 8, and 9 pages and their lab modules returned `HTTP/2 200`.
  - `curl -I https://www.jrqz776.com/src/render/transforms.js?v=20260803-2` returned `HTTP/2 200`.

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
