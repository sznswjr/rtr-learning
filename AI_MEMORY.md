# AI Project Memory

Last updated: 2026-05-30

## Project

- Name: RTR4 Web Lab
- Repository: `git@github.com:sznswjr/rtr-learning.git`
- Production domain: `https://www.jrqz776.com`
- Purpose: browser-based real-time rendering learning experiments for *Real-Time Rendering, 4th Edition*.

## Current Scope

- Chapter 5 is presented as an ordered set of interactive experiments:
  - 5.1 shading models: Lambert, Gooch, and toon-style sphere visualizations.
  - 5.2 light attenuation: inverse-square, finite radius, and windowed falloff curves.
  - 5.3.1 computation frequency: object-, vertex-, and pixel-frequency shading comparison.
  - 5.4 anti-aliasing: No AA, SSAA, and MSAA WebGL2 comparison.
  - 5.4.2 sampling patterns: center, grid, rotated grid, N-Rooks, stratified random, Poisson-like.
  - 5.5 transparency and compositing: source-over ordering and weighted OIT approximation.
  - 5.6 display encoding: linear coverage/filtering before gamma/sRGB-style encoding.
- The homepage navigation groups experiments by chapter ranges: 5.1-5.3, 5.4, and 5.5-5.6.
- Local knowledge base is tracked as a Git submodule at `knowledge/Real-Time-Rendering-4th-CN`, pinned to `9c2e724e688fc921ec0486d8fde4f516af2a5873` from `https://github.com/Morakito/Real-Time-Rendering-4th-CN.git`.

## Stack

- Static site.
- Plain HTML, CSS, and browser ES modules.
- WebGL2 for rendering.
- No Node runtime, framework, bundler, or package manager is required for production.

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
```

When changing JavaScript or CSS, update the query-string version in `index.html` because Nginx caches static assets for 7 days.

Latest production deployment:

- Date: 2026-05-30
- Deployed Chapter 5 experiment index and new Canvas/WebGL experiments.
- Asset cache version in `index.html`: `20260530-1`.
- Verification passed:
  - `node --check /home/ubuntu/rtr4-web-lab/src/main.js`
  - `git diff --check`
  - `sudo nginx -t`
  - `curl -I https://www.jrqz776.com` returned `HTTP/2 200`
  - `curl -I http://www.jrqz776.com` returned `301` to HTTPS
  - `curl -I https://proxy.jrqz776.com/api.proxy.97ae8184734ddb6e` returned expected `HTTP/2 415`

## Server Context

This server also runs a separate proxy service on `proxy.jrqz776.com`.

- Do not change `/etc/nginx/sites-available/proxy.jrqz776.com` unless explicitly asked.
- Do not touch Xray config or service files for this web project.
- `www.jrqz776.com` is intentionally isolated as its own Nginx server block.

## Verification

Useful checks:

```bash
node --check /home/ubuntu/rtr4-web-lab/src/main.js
sudo nginx -t
curl -I https://www.jrqz776.com
curl -I https://proxy.jrqz776.com/api.proxy.97ae8184734ddb6e
```

Expected:

- `https://www.jrqz776.com` returns `HTTP/2 200`.
- `http://www.jrqz776.com` redirects to HTTPS.
- The proxy gRPC path returns `HTTP/2 415` for plain curl, which means it still routes to the proxy service.

## Code Notes

- Keep the project static unless there is a concrete need for build tooling.
- Prefer WebGL2 primitives and small local helpers for experiments.
- Keep controls explicit and observable; show derived render sizes when they help understand sampling.
- Avoid adding unrelated visual polish that obscures the rendering experiment.
