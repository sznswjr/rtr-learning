# AI Project Memory

Last updated: 2026-05-16

## Project

- Name: RTR4 Web Lab
- Repository: `git@github.com:sznswjr/rtr-learning.git`
- Production domain: `https://www.jrqz776.com`
- Purpose: browser-based real-time rendering learning experiments for *Real-Time Rendering, 4th Edition*.

## Current Scope

- Chapter 5.4 anti-aliasing experiment.
- Renders one triangle in three paths:
  - No AA: direct single-sample WebGL2 render.
  - SSAA: render to a larger texture, then downsample to the visible canvas.
  - MSAA: render to a multisampled renderbuffer, then resolve to a texture.
- UI controls:
  - Triangle rotation.
  - Triangle scale.
  - Render resolution, default `35%`, intended to make aliasing visible on high-DPI screens.
  - Sample count: `2x`, `4x`, `8x`.

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
