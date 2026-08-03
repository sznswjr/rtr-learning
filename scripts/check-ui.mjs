import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = (process.argv[2] ?? process.env.UI_CHECK_BASE_URL ?? "https://www.jrqz776.com").replace(/\/$/, "");
const outputDir = path.resolve(".tmp/ui-checks");
const interactionTimings = [];

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

const pages = [
  {
    name: "home",
    path: "/",
    selectors: [".topbar", ".home-panel", ".home-nav-card", ".home-nav-lab-directory", ".home-nav-lab"],
  },
  {
    name: "chapter-1",
    path: "/chapters/chapter-1.html",
    selectors: [".chapter-nav", "#frame-budget", "#frameBudgetCanvas", "#frameTarget", ".frame-trace"],
    canvasIds: ["frameBudgetCanvas"],
  },
  {
    name: "chapter-2",
    path: "/chapters/chapter-2.html",
    selectors: [".chapter-nav", "#rendering-pipeline", "#pipelineCanvas"],
    canvasIds: ["pipelineCanvas"],
  },
  {
    name: "chapter-3",
    path: "/chapters/chapter-3.html",
    selectors: [
      ".chapter-nav",
      "#barycentric-rasterization",
      "#barycentricCanvas",
      "#rasterMode",
      ".raster-legend",
    ],
    canvasIds: ["barycentricCanvas"],
  },
  {
    name: "chapter-4",
    path: "/chapters/chapter-4.html",
    selectors: [
      ".chapter-nav",
      "#coordinate-transforms",
      "#coordinateTransformCanvas",
      "#transformStage",
      ".coordinate-trace [data-space='ndc']",
    ],
    canvasIds: ["coordinateTransformCanvas"],
  },
  {
    name: "chapter-5",
    path: "/chapters/chapter-5.html",
    selectors: [".chapter-nav", "#shading-models", "#aa-compare", "#noaaCanvas", "#displayEncodingCanvas"],
    canvasIds: ["shadingModelCanvas", "displayEncodingCanvas"],
  },
  {
    name: "chapter-6",
    path: "/chapters/chapter-6.html",
    selectors: [
      ".chapter-nav",
      "#texture-filtering",
      "#textureFilteringCanvas",
      "#environment-mapping",
      "#volume-textures",
      'a[href="./chapter-10.html#environment-mapping"]',
      'a[href="./chapter-14.html#volume-textures"]',
    ],
    canvasIds: ["textureFilteringCanvas"],
  },
  {
    name: "chapter-7",
    path: "/chapters/chapter-7.html",
    selectors: [".chapter-nav", "#shadow-mapping", "#shadowMappingCanvas", "#shadowBias", ".shadow-pipeline"],
    canvasIds: ["shadowMappingCanvas"],
  },
  {
    name: "chapter-8",
    path: "/chapters/chapter-8.html",
    selectors: [".chapter-nav", "#hdr-display", "#hdrDisplayCanvas", "#hdrExposure", ".hdr-stop-strip"],
    canvasIds: ["hdrDisplayCanvas"],
  },
  {
    name: "chapter-9",
    path: "/chapters/chapter-9.html",
    selectors: [".chapter-nav", "#microfacet-brdf", "#microfacetBrdfCanvas", "#brdfTerm", ".brdf-formula"],
    canvasIds: ["microfacetBrdfCanvas"],
  },
  {
    name: "chapter-10",
    path: "/chapters/chapter-10.html",
    selectors: [".chapter-nav", "#environment-mapping", "#environmentMappingCanvas"],
    canvasIds: ["environmentMappingCanvas"],
  },
  {
    name: "chapter-11",
    path: "/chapters/chapter-11.html",
    selectors: [".chapter-nav", "#gi-methods", "#giCanvas", "#giAoRadius", ".gi-contribution-strip"],
    canvasIds: ["giCanvas"],
  },
  {
    name: "chapter-12",
    path: "/chapters/chapter-12.html",
    selectors: [
      ".chapter-nav",
      "#postprocess-framegraph",
      "#postprocessCanvas",
      "#postprocessThreshold",
      ".postprocess-chain",
    ],
    canvasIds: ["postprocessCanvas"],
  },
  {
    name: "chapter-13",
    path: "/chapters/chapter-13.html",
    selectors: [
      ".chapter-nav",
      "#scene-representations",
      "#representationCanvas",
      "#representationDetail",
      ".representation-guide",
    ],
    canvasIds: ["representationCanvas"],
  },
  {
    name: "chapter-14",
    path: "/chapters/chapter-14.html",
    selectors: [".chapter-nav", "#volume-textures", "#volumeTextureCanvas"],
    canvasIds: ["volumeTextureCanvas"],
  },
  {
    name: "reading",
    path: "/translations/rtr4-cn.html",
    selectors: [
      ".translation-hero",
      ".translation-sidebar",
      ".translation-article",
      "#chapter-3",
      "#chapter-26",
      ".translation-action",
    ],
  },
];

function pageUrl(pagePath) {
  return new URL(pagePath, `${baseUrl}/`).toString();
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function checkChapterRoutes() {
  for (let chapter = 1; chapter <= 26; chapter += 1) {
    const response = await fetch(pageUrl(`/chapters/chapter-${chapter}.html`));
    assert(response.ok, `chapter-${chapter}: route returned ${response.status}`);
    const html = await response.text();
    assert(html.includes('id="main-content"'), `chapter-${chapter}: #main-content is missing from source`);
    assert(html.includes(`<title>Chapter ${chapter} `), `chapter-${chapter}: title does not match route`);
  }
}

async function checkRenderFoundations(browser) {
  const page = await browser.newPage({ viewport: viewports[0] });
  try {
    await page.goto(pageUrl("/"), { waitUntil: "networkidle", timeout: 30000 });
    const result = await page.evaluate(async (urls) => {
      const [cameraModule, framebufferModule, gpuQueryModule, meshModule, postprocessModule, transformsModule] = await Promise.all([
        import(urls.camera),
        import(urls.framebuffer),
        import(urls.gpuQuery),
        import(urls.mesh),
        import(urls.postprocess),
        import(urls.transforms),
      ]);

      const camera = cameraModule.createOrbitCamera({ aspect: 16 / 9, distance: 4, pitch: 0.3, yaw: 0.7 });
      const matrixValues = [...camera.viewProjection];
      const orthographicValues = [...cameraModule.createOrthographicMatrix(-2, 2, -1, 1, 0.1, 10)];
      const translatedPoint = transformsModule.transformPoint(
        transformsModule.createTranslationMatrix(2, 3, 4),
        [1, 1, 1, 1],
      );
      const cube = meshModule.createCubeGeometry(2);

      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;
      const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true });
      if (!gl) {
        return { webgl2: false };
      }

      const target = framebufferModule.createColorTarget(gl, { height: 8, label: "foundation check", width: 8 });
      target.resize(12, 10);
      const depthTarget = framebufferModule.createDepthTarget(gl, { height: 7, label: "depth foundation check", width: 9 });
      const timer = gpuQueryModule.createGpuTimer(gl);
      const fragment = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
void main() { outColor = vec4(vUv, 0.25, 1.0); }`;
      const pass = postprocessModule.createPostprocessPass(gl, fragment);
      pass.draw({ height: 16, width: 16 });
      const pixel = new Uint8Array(4);
      gl.readPixels(8, 8, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

      const output = {
        cameraFinite: matrixValues.length === 16 && matrixValues.every(Number.isFinite),
        cubeGeometry: [cube.positions.length, cube.normals.length, cube.indices.length],
        depthTargetSize: [depthTarget.width, depthTarget.height],
        framebufferSize: [target.width, target.height],
        gpuTimerAvailableType: typeof timer.available,
        orthographicFinite: orthographicValues.length === 16 && orthographicValues.every(Number.isFinite),
        pixel: [...pixel],
        planeGeometry: (() => {
          const plane = meshModule.createPlaneGeometry(2);
          return [plane.positions.length, plane.normals.length, plane.indices.length];
        })(),
        scaledPoint: transformsModule.transformPoint(transformsModule.createScaleMatrix(2), [1, 2, 3, 1]),
        translatedPoint,
        webgl2: true,
      };
      pass.dispose();
      timer.dispose();
      depthTarget.dispose();
      target.dispose();
      return output;
    }, {
      camera: pageUrl("/src/render/camera.js?v=20260803-4"),
      framebuffer: pageUrl("/src/render/framebuffer.js?v=20260803-4"),
      gpuQuery: pageUrl("/src/render/gpu-query.js?v=20260803-4"),
      mesh: pageUrl("/src/render/mesh.js?v=20260803-4"),
      postprocess: pageUrl("/src/render/postprocess.js?v=20260803-4"),
      transforms: pageUrl("/src/render/transforms.js?v=20260803-4"),
    });

    assert(result.webgl2, "render foundations: WebGL2 is unavailable");
    assert(result.cameraFinite, "render foundations: camera matrix contains invalid values");
    assert(result.orthographicFinite, "render foundations: orthographic matrix contains invalid values");
    assert(result.translatedPoint.join(",") === "3,4,5,1", `render foundations: point transform failed ${result.translatedPoint}`);
    assert(result.scaledPoint.join(",") === "2,4,6,1", `render foundations: point scale failed ${result.scaledPoint}`);
    assert(result.cubeGeometry.join("x") === "72x72x36", `render foundations: cube geometry is invalid ${result.cubeGeometry}`);
    assert(result.planeGeometry.join("x") === "12x12x6", `render foundations: plane geometry is invalid ${result.planeGeometry}`);
    assert(result.depthTargetSize.join("x") === "9x7", `render foundations: depth target is invalid ${result.depthTargetSize}`);
    assert(result.framebufferSize.join("x") === "12x10", `render foundations: framebuffer resize failed ${result.framebufferSize}`);
    assert(result.gpuTimerAvailableType === "boolean", "render foundations: GPU timer availability is invalid");
    assert(result.pixel[3] > 200 && result.pixel[2] > 32, `render foundations: postprocess output is blank ${result.pixel}`);
  } finally {
    await page.close();
  }
}

async function checkRequiredSelectors(page, selectors, label) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    await locator.waitFor({ state: "visible", timeout: 8000 });
    const box = await locator.boundingBox();
    assert(box && box.width >= 1 && box.height >= 1, `${label}: ${selector} has an invalid bounding box`);
  }
}

async function checkHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const offenders = [...document.querySelectorAll("body *")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          className: element.className?.toString() ?? "",
          id: element.id,
          tagName: element.tagName.toLowerCase(),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((rect) => rect.width > 0 && (rect.left < -2 || rect.right > doc.clientWidth + 2))
      .slice(0, 8);

    return {
      bodyScrollWidth: body.scrollWidth,
      clientWidth: doc.clientWidth,
      offenders,
      scrollWidth: doc.scrollWidth,
    };
  });

  const extra = Math.max(overflow.scrollWidth, overflow.bodyScrollWidth) - overflow.clientWidth;
  assert(extra <= 2, `${label}: horizontal overflow ${extra}px ${JSON.stringify(overflow.offenders)}`);
}

async function checkCrushedText(page, label) {
  const crushed = await page.evaluate(() => {
    return [...document.querySelectorAll("h1, .section-heading h2, .panel-heading h2, .home-nav-card > strong")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const styles = getComputedStyle(element);
        const lineHeight = Number.parseFloat(styles.lineHeight) || Number.parseFloat(styles.fontSize) * 1.2;
        return {
          height: Math.round(rect.height),
          lineHeight,
          text: element.textContent?.trim() ?? "",
          width: Math.round(rect.width),
        };
      })
      .filter((item) => item.text && item.width > 0 && item.width < 72 && item.height > item.lineHeight * 3.5)
      .slice(0, 6);
  });

  assert(crushed.length === 0, `${label}: text appears crushed into a narrow column ${JSON.stringify(crushed)}`);
}

async function checkCanvasPixels(page, canvasIds, label) {
  if (!canvasIds?.length) {
    return;
  }

  const stats = await page.evaluate((ids) => {
    return ids.map((id) => {
      const canvas = document.getElementById(id);
      if (!canvas) {
        return { id, missing: true };
      }

      const sample = document.createElement("canvas");
      sample.width = 64;
      sample.height = 64;
      const ctx = sample.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(canvas, 0, 0, sample.width, sample.height);
      const data = ctx.getImageData(0, 0, sample.width, sample.height).data;
      let alphaPixels = 0;
      let colorPixels = 0;
      let luminanceSum = 0;
      let luminanceSquares = 0;

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        const luminance = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
        if (alpha > 8) {
          alphaPixels += 1;
        }
        if (luminance > 6) {
          colorPixels += 1;
        }
        luminanceSum += luminance;
        luminanceSquares += luminance * luminance;
      }

      const total = data.length / 4;
      const mean = luminanceSum / total;
      const variance = luminanceSquares / total - mean * mean;

      return {
        colorPixels,
        height: canvas.height,
        id,
        opaqueRatio: alphaPixels / total,
        variance,
        width: canvas.width,
      };
    });
  }, canvasIds);

  stats.forEach((stat) => {
    assert(!stat.missing, `${label}: #${stat.id} is missing`);
    assert(stat.width > 0 && stat.height > 0, `${label}: #${stat.id} has zero backing size`);
    assert(stat.opaqueRatio > 0.2, `${label}: #${stat.id} looks transparent ${JSON.stringify(stat)}`);
    assert(stat.colorPixels > 16 || stat.variance > 4, `${label}: #${stat.id} looks blank ${JSON.stringify(stat)}`);
  });
}

async function checkAccessibility(page, label) {
  const audit = await page.evaluate(() => {
    const labelledElementExists = (element) => {
      const labelledBy = element.getAttribute("aria-labelledby");
      return Boolean(labelledBy && labelledBy.split(/\s+/).every((id) => document.getElementById(id)));
    };

    return {
      canvasIssues: [...document.querySelectorAll("canvas")]
        .filter((canvas) => canvas.getAttribute("role") !== "img" || !labelledElementExists(canvas))
        .map((canvas) => canvas.id),
      currentChapterLinks: document.querySelectorAll('.chapter-nav a[aria-current="location"]').length,
      hasChapterNav: Boolean(document.querySelector(".chapter-nav")),
      mainTargetExists: Boolean(document.getElementById("main-content")),
      rangeIssues: [...document.querySelectorAll('input[type="range"]')]
        .filter((input) => !input.getAttribute("aria-valuetext"))
        .map((input) => input.id),
      skipTarget: document.querySelector(".skip-link")?.getAttribute("href"),
    };
  });

  assert(audit.mainTargetExists, `${label}: #main-content is missing`);
  assert(audit.skipTarget === "#main-content", `${label}: skip link is missing or points to the wrong target`);
  assert(audit.canvasIssues.length === 0, `${label}: inaccessible canvases ${JSON.stringify(audit.canvasIssues)}`);
  assert(audit.rangeIssues.length === 0, `${label}: ranges missing aria-valuetext ${JSON.stringify(audit.rangeIssues)}`);
  if (audit.hasChapterNav) {
    assert(audit.currentChapterLinks === 1, `${label}: expected one current chapter link, got ${audit.currentChapterLinks}`);
  }
}

async function checkResponsiveNavigation(page, viewport, label) {
  const chapterNav = page.locator(".chapter-nav");
  if ((await chapterNav.count()) === 0) {
    const readingNav = page.locator(".translation-sidebar");
    if ((await readingNav.count()) > 0 && viewport.width <= 820) {
      const position = await readingNav.evaluate((element) => getComputedStyle(element).position);
      assert(position === "sticky", `${label}: reading navigation should remain sticky, got ${position}`);
    }
    return;
  }

  const position = await chapterNav.evaluate((element) => getComputedStyle(element).position);
  assert(position === "sticky", `${label}: chapter navigation should remain sticky, got ${position}`);

  if (viewport.width <= 820) {
    const touchIssues = await page.evaluate(() => {
      return [...document.querySelectorAll(".chapter-nav a, .status-pill, select")]
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && rect.height < 40;
        })
        .map((element) => ({ height: Math.round(element.getBoundingClientRect().height), text: element.textContent?.trim() }));
    });
    assert(touchIssues.length === 0, `${label}: undersized touch targets ${JSON.stringify(touchIssues)}`);
  }
}

async function checkResponsiveCanvasLayout(page, viewport, label) {
  const pipeline = page.locator("#pipelineCanvas");
  if ((await pipeline.count()) > 0) {
    const layout = await pipeline.getAttribute("data-layout");
    const expected = viewport.width <= 600 ? "compact" : "wide";
    assert(layout === expected, `${label}: pipeline layout ${layout}, expected ${expected}`);
  }

  const texture = page.locator("#textureFilteringCanvas");
  if ((await texture.count()) > 0) {
    const layout = await texture.getAttribute("data-layout");
    const expected = viewport.width <= 600 ? "2x3" : viewport.width <= 920 ? "3x2" : "5x1";
    assert(layout === expected, `${label}: texture layout ${layout}, expected ${expected}`);
  }
}

async function checkKeyboardEntry(page, label) {
  await page.locator("body").press("Tab");
  const activeClass = await page.evaluate(() => document.activeElement?.className ?? "");
  assert(activeClass.includes("skip-link"), `${label}: first keyboard target should be the skip link, got ${activeClass}`);
}

async function checkInteractionLatency(page, label) {
  const interactions = [
    { name: "frame-budget", selector: "#frameResolution", threshold: 260 },
    { name: "raster", selector: "#rasterSkew", threshold: 180 },
    { name: "transform", selector: "#transformRotation", threshold: 180 },
    { name: "shading", selector: "#surfaceHue", threshold: 160 },
    { name: "texture", selector: "#textureDetail", threshold: 250 },
    { name: "environment", selector: "#environmentRoughness", threshold: 180 },
    { name: "volume", selector: "#volumeSteps", threshold: 250 },
    { name: "shadow", selector: "#shadowBias", threshold: 220 },
    { name: "hdr", selector: "#hdrExposure", threshold: 220 },
    { name: "brdf", selector: "#brdfRoughness", threshold: 220 },
    { name: "postprocess", selector: "#postprocessThreshold", threshold: 240 },
    { name: "gi", selector: "#giAoRadius", threshold: 240 },
    { name: "representations", selector: "#representationDetail", threshold: 240 },
  ];

  for (const interaction of interactions) {
    const control = page.locator(interaction.selector);
    if ((await control.count()) === 0) {
      continue;
    }

    const duration = await control.evaluate(async (input) => {
      const start = performance.now();
      input.value = input.value === input.max ? input.min : input.max;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return performance.now() - start;
    });
    interactionTimings.push({ duration, label: `${label}/${interaction.name}` });
    assert(
      duration < interaction.threshold,
      `${label}: ${interaction.name} interaction took ${Math.round(duration)}ms`,
    );
  }
}

async function checkPage(browser, pageConfig, viewport) {
  const label = `${pageConfig.name}/${viewport.name}`;
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  const pageErrors = [];
  const networkErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    networkErrors.push(`${request.failure()?.errorText ?? "failed"} ${request.url()}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      networkErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  try {
    await page.goto(pageUrl(pageConfig.path), { waitUntil: "networkidle", timeout: 30000 });
    await checkRequiredSelectors(page, pageConfig.selectors, label);
    await page.waitForTimeout(350);
    await checkHorizontalOverflow(page, label);
    await checkCrushedText(page, label);
    await checkCanvasPixels(page, pageConfig.canvasIds, label);
    await checkAccessibility(page, label);
    await checkResponsiveNavigation(page, viewport, label);
    await checkResponsiveCanvasLayout(page, viewport, label);

    const screenshotPath = path.join(outputDir, `${pageConfig.name}-${viewport.name}.png`);
    await page.screenshot({ fullPage: true, path: screenshotPath });
    await checkKeyboardEntry(page, label);
    await checkInteractionLatency(page, label);

    assert(consoleErrors.length === 0, `${label}: console errors\n${consoleErrors.join("\n")}`);
    assert(pageErrors.length === 0, `${label}: page errors\n${pageErrors.join("\n")}`);
    assert(networkErrors.length === 0, `${label}: network errors\n${networkErrors.join("\n")}`);

    return screenshotPath;
  } finally {
    await page.close();
  }
}

await mkdir(outputDir, { recursive: true });
await checkChapterRoutes();

const browser = await chromium.launch();
const screenshots = [];

try {
  await checkRenderFoundations(browser);
  for (const pageConfig of pages) {
    for (const viewport of viewports) {
      screenshots.push(await checkPage(browser, pageConfig, viewport));
    }
  }
} finally {
  await browser.close();
}

console.log("Chapter route check passed for Chapter 1-26.");
console.log("Shared WebGL render foundation check passed.");
console.log(`UI check passed for ${pages.length} pages x ${viewports.length} viewports.`);
if (interactionTimings.length > 0) {
  const slowest = interactionTimings.reduce((current, timing) => timing.duration > current.duration ? timing : current);
  console.log(`Slowest measured interaction: ${Math.round(slowest.duration)}ms (${slowest.label}).`);
}
console.log(`Screenshots: ${outputDir}`);
screenshots.forEach((screenshot) => console.log(`- ${screenshot}`));
