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
- Chapter 10.2 compares a center-point approximation, discrete rectangular-light integration, and an LTC-style analytic approximation.
- Chapter 11 analytically intersects three spheres and room planes so direct lighting, AO, probe lighting, and approximate color bounce can be isolated at the same visible surface point.
- Chapter 12 uses four `RGBA16F` render targets for a five-pass image-space framegraph: HDR scene, soft-threshold bright extraction, horizontal blur, vertical blur, and Bloom/tone-map composition.
  - Controls expose the scene, bright-pass, blurred, and final buffers, plus threshold, soft knee, blur radius, Bloom strength, and exposure.
- Chapter 13 compares mesh, billboard, particle, and point-cloud representations of one object with adjustable density, view angle, sample size, and primitive-cost metrics.
- Chapter 14.3 uploads a procedural 64³ density field as a WebGL2 3D texture and compares an axis slice, maximum-intensity projection, and front-to-back alpha accumulation.
- Chapter 14.4 ray-marches participating media with Beer–Lambert transmittance and a Henyey–Greenstein phase function.
- Chapter 15 composes quantized toon lighting, normal/depth-style outlines, and screen-space hatching, with each layer independently observable.
- Chapter 16 visualizes reference and selected mesh LODs with surface, wireframe, and error views driven by distance, pixel tolerance, and silhouette preservation.
- Chapter 17 edits a cubic Bézier curve and compares uniform parameter samples with curvature-focused adaptive samples while exposing the point and tangent at `t`.
- Chapter 18 models application, geometry, fragment, and bandwidth costs while visualizing the dominant pipeline stage and using GPU timer queries when available.
- Chapter 19 compares no culling, frustum culling, hierarchical occlusion, and screen-error LOD in a top-down instanced scene.
- Chapter 20 compares Forward, Deferred, Tiled, and Clustered many-light evaluation domains with light-density and partition overlays.
- Chapter 21 combines stereo disparity, inverse lens distortion, and foveated sampling zones in a dual-eye view.
- Chapter 22 performs actual ray/AABB and ray/triangle candidate tests while exposing BVH, box, primitive, and nearest-hit stages.
- Chapter 23 models framebuffer traffic for coherent/random access, overdraw, depth prepass, MSAA, MRTs, and color compression.
- Chapter 24 compares raster, SSR, software-ray, and hybrid fallback coverage in one reflective scene.
- Chapter 25 visualizes broad-, mid-, and narrow-phase collision candidate reduction over a deterministic dynamic scene.
- Chapter 26 is a progressive WebGL2 software path tracer with analytic intersections, multi-bounce sampling, and floating-point ping-pong accumulation.
- The homepage is now a chapter index instead of hosting every experiment inline.
- Chapter 1-26 each have a static route at `chapters/chapter-<n>.html`; chapters without implemented labs use generated planning shells.
- Page entry scripts live in `src/pages/`.
- The homepage navigation includes the RTR4 Chinese translation page, chapter entries, lab counts, renderer tags, and direct lab links.
- Homepage navigation metadata now lives in `src/app/lab-registry.js` and is rendered by `src/app/home-nav.js`.
- Chapter in-page navigation is rendered from the same registry by `src/app/chapter-nav.js`.
- `src/app/reading-embeds.js` renders one experiment card per chapter in the Chinese reading page from the same registry. Frames are lazy-loaded on expansion, and the previous frame is unloaded whenever another card opens.
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
- Environment mapping and rectangular-area-light integration live in `src/labs/chapter-10/`; GI analysis in `chapter-11/`; the Bloom framegraph in `chapter-12/`; representation comparison in `chapter-13/`; volume textures and participating media in `chapter-14/`.
- Stylized rendering, mesh LOD, and curve tessellation live in `src/labs/chapter-15/`, `chapter-16/`, and `chapter-17/`.
- GPU bottleneck analysis, scene culling, and many-light shading live in `src/labs/chapter-18/`, `chapter-19/`, and `chapter-20/`.
- Stereo/foveated rendering, ray picking, and bandwidth/cache analysis live in `src/labs/chapter-21/`, `chapter-22/`, and `chapter-23/`.
- Hybrid rendering, collision staging, and progressive path tracing live in `src/labs/chapter-24/`, `chapter-25/`, and `chapter-26/`.
- Shared Canvas, color, math, shading, and WebGL helpers now live in `src/render/`.
- Shared camera, orthographic projection, transform matrices, cube/plane geometry, depth/float framebuffer, GPU timing, and postprocess foundations also live in `src/render/`.
- The HSL hue normalization bug in `src/render/color.js` is covered by `scripts/check-color.mjs`.
- Expensive shading and texture controls render a coalesced preview while dragging and restore full quality after interaction settles.
- `src/main.js` is now a small module entrypoint that initializes labs.
- The translation page is available at `translations/rtr4-cn.html` and includes Chinese reading content for Chapter 0-26, with a complete chapter index, topic summaries, source links, and lazily embedded related labs.
- Chapter 1-5 have complete Chinese reading routes at `translations/chapters/chapter-<n>.html`, linked from the guide with a quiet `全文` action. They are generated from the pinned knowledge-base Markdown by `scripts/generate-full-translations.mjs` and committed as static HTML.
- The full Chapter 1-5 translations include 69 locally hosted figures verified against the official RTR4 figure gallery. They live in `assets/rtr4-figures/`, use lazy loading and official-gallery credits, and open at full size. Chapter 1 remains image-free because its two commercial game screenshots are not present in the official gallery whitelist.
- Full translation formulas are rendered to static KaTeX HTML/MathML. The production CSS and fonts are committed under `vendor/katex/`; Marked and KaTeX are generation-only development dependencies.
- Local knowledge base is tracked as a Git submodule at `knowledge/Real-Time-Rendering-4th-CN`, pinned to `9c2e724e688fc921ec0486d8fde4f516af2a5873` from `https://github.com/Morakito/Real-Time-Rendering-4th-CN.git`.

## Stack

- Static site.
- Plain HTML, CSS, and browser ES modules.
- WebGL2 for rendering.
- No Node runtime, framework, bundler, or package manager is required for production.
- `package.json` provides local generation and verification scripts; production serves only committed static files.

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
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-11
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-11/*.js /var/www/www.jrqz776.com/src/labs/chapter-11/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-12
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-12/*.js /var/www/www.jrqz776.com/src/labs/chapter-12/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-13
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-13/*.js /var/www/www.jrqz776.com/src/labs/chapter-13/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-14
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-14/*.js /var/www/www.jrqz776.com/src/labs/chapter-14/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-15
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-15/*.js /var/www/www.jrqz776.com/src/labs/chapter-15/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-16
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-16/*.js /var/www/www.jrqz776.com/src/labs/chapter-16/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-17
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-17/*.js /var/www/www.jrqz776.com/src/labs/chapter-17/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-18
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-18/*.js /var/www/www.jrqz776.com/src/labs/chapter-18/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-19
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-19/*.js /var/www/www.jrqz776.com/src/labs/chapter-19/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-20
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-20/*.js /var/www/www.jrqz776.com/src/labs/chapter-20/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-21
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-21/*.js /var/www/www.jrqz776.com/src/labs/chapter-21/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-22
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-22/*.js /var/www/www.jrqz776.com/src/labs/chapter-22/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-23
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-23/*.js /var/www/www.jrqz776.com/src/labs/chapter-23/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-24
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-24/*.js /var/www/www.jrqz776.com/src/labs/chapter-24/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-25
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-25/*.js /var/www/www.jrqz776.com/src/labs/chapter-25/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-26
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-26/*.js /var/www/www.jrqz776.com/src/labs/chapter-26/
sudo mkdir -p /var/www/www.jrqz776.com/translations
sudo cp /home/ubuntu/rtr4-web-lab/translations/rtr4-cn.html /var/www/www.jrqz776.com/translations/rtr4-cn.html
sudo mkdir -p /var/www/www.jrqz776.com/translations/chapters
sudo cp /home/ubuntu/rtr4-web-lab/translations/chapters/*.html /var/www/www.jrqz776.com/translations/chapters/
sudo mkdir -p /var/www/www.jrqz776.com/assets/rtr4-figures
sudo cp -R /home/ubuntu/rtr4-web-lab/assets/rtr4-figures/chapter-* /var/www/www.jrqz776.com/assets/rtr4-figures/
sudo mkdir -p /var/www/www.jrqz776.com/vendor/katex/fonts
sudo cp /home/ubuntu/rtr4-web-lab/vendor/katex/katex.min.css /var/www/www.jrqz776.com/vendor/katex/katex.min.css
sudo cp /home/ubuntu/rtr4-web-lab/vendor/katex/fonts/* /var/www/www.jrqz776.com/vendor/katex/fonts/
```

When changing JavaScript or CSS, update the query-string version in `index.html` and any static import URLs because Nginx caches static assets for 7 days.

This is a remote server. The user cannot open `127.0.0.1` from their machine. Local HTTP servers may be used only for server-side self-checks; user-facing verification should deploy to `/var/www/www.jrqz776.com` and check `https://www.jrqz776.com`.

Latest production deployment:

- Date: 2026-08-03
- Added complete static Chinese translations for Chapter 1-5 with generated in-page outlines, tables, server-rendered KaTeX formulas, previous/next navigation, and links back to each guide and experiment page.
- Expanded the official-gallery image set to all 69 whitelisted figures used by Chapter 2-5; Chapter 1 remains image-free because its screenshots are absent from the official gallery.
- Added eight whitelisted original-book figures to Chapters 2-5 of the Chinese reading page, with responsive lazy-loaded presentation, full-size links, concise Chinese captions, and official gallery credits; Chapter 1 remains image-free because its screenshots are absent from the official gallery.
- Removed editorial progress labels (`已整理` / `待整理`), the redundant `完整导读` kicker, and per-chapter experiment CTA links from the Chinese reading page; embedded lab cards remain the single experiment entry point in each chapter.
- Embedded every registered chapter experiment into the full Chinese reading page through collapsed, registry-driven cards; only one same-origin experiment frame is active at a time, and iframe height is synchronized with the chapter lab page.
- Added active Chapter 24 hybrid-rendering, Chapter 25 collision-pipeline, and Chapter 26 progressive software path-tracing labs; all Chapter 1–26 experiments are now implemented.
- Strengthened Chapter 10 with rectangular-area-light integration and Chapter 14 with participating-media single scattering.
- Chapter 21–23 provide stereo/foveated, ray-picking, and bandwidth/cache labs.
- Chapter 18–20 provide GPU bottleneck, scene-culling, and many-light architecture labs.
- Chapter 15–17 provide stylized rendering, mesh LOD, and curve tessellation labs.
- Chapter 15 separates toon bands, outlines, and hatching; Chapter 16 compares reference and selected LODs; Chapter 17 exposes cubic Bézier control and sampling.
- Chapter 11 isolates direct light, analytic AO, low-frequency probe light, and colored bounce light in one shared ray-intersection scene.
- Chapter 13 compares mesh, billboard, particles, and point-cloud representations while exposing view dependence and primitive counts.
- Chapter 12 uses four floating-point intermediate targets and exposes the HDR scene, soft-threshold bright pass, separable blur, Bloom composition, and tone-mapped display output.
- Chapter 1 visualizes the relationship between frame-rate targets, frame budgets, resolution, fragment workload, measured frame intervals, and GPU timing support.
- Chapter 3 visualizes edge functions, barycentric weights, interpolated attributes, sample coverage, and a pointer-driven pixel probe.
- Chapter 4 renders a transformed cube and traces a selected vertex through model, world, view, clip, and NDC spaces under perspective or orthographic projection.
- Chapter 7 demonstrates depth-only light rendering, shadow comparison, bias, and PCF filtering.
- Chapter 8 demonstrates HDR intermediate storage, exposure, tone mapping, and display encoding.
- Chapter 9 demonstrates the GGX, Smith, and Schlick terms of a microfacet BRDF across roughness and metallic values.
- Added reusable orthographic projection, transform/scale matrices, point transformation, cube/plane geometry, depth targets, and float framebuffer support to `src/render/`.
- Asset cache version: `20260803-13` for CSS and `20260803-10` for navigation modules, page entry modules, and WebGL lab imports.
- Verification passed:
  - `npm run check:js`
  - `npm run check:color`
  - `npm run check:chapters`
  - `npm run check:translations`
  - `npm run check:ui`
  - `git diff --check`
  - `sudo nginx -t`
  - `curl -I https://www.jrqz776.com` returned `HTTP/2 200`
  - Production route check passed for all Chapter 1-26 pages.
  - Production UI check passed for 28 pages across desktop, laptop, tablet, and mobile viewports.
  - Production shared WebGL render-foundation check passed.
  - Production reading embeds passed registry coverage, single-frame unload, automatic height, and Chapter 3/6/10/14/26 canvas pilot checks.
  - Production desktop and mobile reading-page checks confirmed zero progress labels, pseudo labels, redundant CTAs, console errors, and horizontal overflow.
  - `curl -I https://www.jrqz776.com/src/app/reading-embeds.js?v=20260803-10` returned `HTTP/2 200`.
  - The Chapter 10 and 14 pages and new lab modules returned `HTTP/2 200`.
  - `curl -I https://www.jrqz776.com/src/labs/chapter-14/participating-media.js?v=20260803-10` returned `HTTP/2 200`.

## Server Context

This server also runs a separate proxy service on `proxy.jrqz776.com`.

- Do not change `/etc/nginx/sites-available/proxy.jrqz776.com` unless explicitly asked.
- Do not touch Xray config or service files for this web project.
- `www.jrqz776.com` is intentionally isolated as its own Nginx server block.

## Verification

Useful checks:

```bash
npm run check:js
npm run check:translations
npm run check:ui
sudo nginx -t
curl -I https://www.jrqz776.com
curl -I https://proxy.jrqz776.com/api.proxy.97ae8184734ddb6e
```

Expected:

- `https://www.jrqz776.com` returns `HTTP/2 200`.
- `http://www.jrqz776.com` redirects to HTTPS.
- The proxy gRPC path returns `HTTP/2 415` for plain curl, which means it still routes to the proxy service.
- `npm run check:translations` byte-compares the committed Chapter 1-5 HTML, official-gallery figures, and KaTeX assets with a fresh generation.
- `npm run check:ui` uses Playwright Chromium against production, checks Chapter 1-5 full-translation routes and responsive layouts in addition to the guide and lab pages, and catches console/network errors, horizontal overflow, crushed headings, broken formulas or figures, and key canvas failures. Screenshots are written to `.tmp/ui-checks/`.

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
