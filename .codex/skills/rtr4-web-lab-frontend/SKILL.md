---
name: rtr4-web-lab-frontend
description: Use when extending this RTR4 Web Lab project with new rendering experiments, chapter pages, navigation entries, Canvas/WebGL modules, or static deployment changes. Follow the existing static-site architecture, experiment registry, UI controls, cache-versioning, and verification workflow.
---

# RTR4 Web Lab Frontend

## Workflow

1. Keep production static unless the task clearly requires a build step.
2. Keep the homepage as a chapter index. Do not put all experiments inline on `index.html`.
3. Add or update experiment metadata in `src/app/lab-registry.js` before changing homepage navigation.
4. Keep each experiment's visible controls explicit: parameter inputs, derived metrics, and one primary viewport or comparison grid.
5. Prefer small Canvas/WebGL helpers over framework abstractions. Introduce Vite/TypeScript only when module growth or type safety justifies the migration.
6. When JavaScript modules change, update cache versions in HTML entry scripts and any static import query strings.
7. Update deployment docs when adding files that must be copied to `/var/www/www.jrqz776.com`.
8. This is a remote server. Do not hand off `127.0.0.1` as the user preview URL; deploy to production and verify `https://www.jrqz776.com`.

## Architecture Rules

- `index.html` owns page structure and stable experiment mount points.
- `src/app/lab-registry.js` owns lab/content metadata used by navigation and future chapter indexes.
- `src/app/home-nav.js` renders homepage navigation from registry data.
- `chapters/chapter-1.html` through `chapters/chapter-26.html` own chapter page structure.
- Planned chapter shells are generated from `chapterRegistry` by `scripts/generate-chapter-pages.mjs`; keep their generated HTML committed.
- `src/pages/` owns page entry scripts.
- `src/labs/chapter-1/` owns frame-budget measurement, `src/labs/chapter-2/pipeline.js` owns the rendering pipeline lab, `src/labs/chapter-3/` owns barycentric rasterization, and `src/labs/chapter-4/` owns coordinate transforms.
- `src/labs/chapter-5/` owns the Chapter 5 labs, `src/labs/chapter-6/` owns texture filtering, `src/labs/chapter-7/` owns shadow mapping, `src/labs/chapter-8/` owns HDR/display transforms, and `src/labs/chapter-9/` owns the microfacet BRDF lab.
- `src/labs/chapter-10/` owns environment mapping, `src/labs/chapter-12/` owns the image-space postprocess framegraph, and `src/labs/chapter-14/` owns volume sampling.
- `src/main.js` is a small entrypoint only; do not grow it with experiment state or drawing code.
- Shared Canvas, camera/projection, color, framebuffer, GPU query, math, mesh geometry, postprocess, shading, transforms, and WebGL helpers live in `src/render/`.

## UI Rules

- Match the current quiet, technical dark UI.
- Use compact controls and metrics. Avoid marketing sections.
- Keep text inside controls short enough for mobile.
- For RTR4 concepts, favor direct visual comparison over explanatory prose.

## Verification

Run these checks before handing off:

```bash
npm run check:js
npm run check:chapters
git diff --check
sudo nginx -t
```

For visual or interaction-heavy changes, deploy the static files and verify the public URL:

```bash
curl -I https://www.jrqz776.com
```
