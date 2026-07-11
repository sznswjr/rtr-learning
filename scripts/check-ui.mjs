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
    selectors: [".topbar", ".home-panel", ".home-nav-card"],
  },
  {
    name: "chapter-2",
    path: "/chapters/chapter-2.html",
    selectors: [".chapter-nav", "#rendering-pipeline", "#pipelineCanvas"],
    canvasIds: ["pipelineCanvas"],
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
    selectors: [".chapter-nav", "#texture-filtering", "#textureFilteringCanvas"],
    canvasIds: ["textureFilteringCanvas"],
  },
  {
    name: "reading",
    path: "/translations/rtr4-cn.html",
    selectors: [".translation-hero", ".translation-sidebar", ".translation-article", ".translation-action"],
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
    { name: "shading", selector: "#surfaceHue", threshold: 160 },
    { name: "texture", selector: "#textureDetail", threshold: 250 },
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

const browser = await chromium.launch();
const screenshots = [];

try {
  for (const pageConfig of pages) {
    for (const viewport of viewports) {
      screenshots.push(await checkPage(browser, pageConfig, viewport));
    }
  }
} finally {
  await browser.close();
}

console.log(`UI check passed for ${pages.length} pages x ${viewports.length} viewports.`);
if (interactionTimings.length > 0) {
  const slowest = interactionTimings.reduce((current, timing) => timing.duration > current.duration ? timing : current);
  console.log(`Slowest measured interaction: ${Math.round(slowest.duration)}ms (${slowest.label}).`);
}
console.log(`Screenshots: ${outputDir}`);
screenshots.forEach((screenshot) => console.log(`- ${screenshot}`));
