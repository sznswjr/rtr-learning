import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = (process.argv.find((argument) => /^https?:\/\//.test(argument)) ?? "http://127.0.0.1:4173").replace(/\/$/, "");
const staticOnly = process.argv.includes("--static");

async function source(relativePath) {
  try {
    return await readFile(path.join(rootDir, relativePath), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      assert.fail(`Missing required benchmark deliverable: ${relativePath}`);
    }
    throw error;
  }
}

function requireText(contents, expected, label) {
  assert.ok(contents.includes(expected), `${label}: missing ${JSON.stringify(expected)}`);
}

function hash(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function numericText(value) {
  return /\d+(?:\.\d+)?/.test(value ?? "");
}

const [chapterHtml, registrySource, entrySource, labSource, uiCheckSource] = await Promise.all([
  source("chapters/chapter-12.html"),
  source("src/app/lab-registry.js"),
  source("src/pages/chapter-12.js"),
  source("src/labs/chapter-12/screen-space-reflections.js"),
  source("scripts/check-ui.mjs"),
]);

for (const id of [
  "screen-space-reflections",
  "ssrCanvas",
  "ssrView",
  "ssrMaxSteps",
  "ssrStepSize",
  "ssrThickness",
  "ssrRoughness",
  "ssrHitRate",
  "ssrAverageSteps",
  "ssrResolution",
]) {
  assert.match(chapterHtml, new RegExp(`id=["']${id}["']`), `Chapter 12 HTML: missing #${id}`);
}

for (const view of ["composite", "reflection", "confidence", "depth", "normal"]) {
  assert.match(chapterHtml, new RegExp(`<option[^>]+value=["']${view}["']`), `Chapter 12 HTML: missing ${view} view`);
}

assert.match(registrySource, /id:\s*["']screen-space-reflections["']/, "lab registry: missing SSR id");
requireText(registrySource, "chapter-12.html#screen-space-reflections", "lab registry");
requireText(entrySource, "screen-space-reflections.js", "Chapter 12 entry");
requireText(entrySource, "initScreenSpaceReflectionsLab", "Chapter 12 entry");
requireText(labSource, "export function initScreenSpaceReflectionsLab", "SSR module");
assert.match(labSource, /getContext\(["']webgl2["']/, "SSR module: no WebGL2 context found");
assert.match(labSource, /createColorTarget|createDepthTarget|createFramebuffer/, "SSR module: no offscreen target construction found");
assert.match(labSource, /readPixels/, "SSR module: no GPU diagnostic readback found");
assert.match(labSource, /requestAnimationFrame/, "SSR module: controls are not scheduled through animation frames");
requireText(uiCheckSource, "screen-space-reflections", "UI regression check");
requireText(uiCheckSource, "ssrCanvas", "UI regression check");

if (staticOnly) {
  console.log("Chapter 12 SSR static acceptance passed.");
  process.exit(0);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const failures = [];
page.on("console", (message) => {
  if (message.type() === "error") failures.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => failures.push(`page: ${error.message}`));
page.on("requestfailed", (request) => failures.push(`network: ${request.url()} — ${request.failure()?.errorText}`));

try {
  const response = await page.goto(`${baseUrl}/chapters/chapter-12.html`, { waitUntil: "networkidle" });
  assert.equal(response?.status(), 200, "Chapter 12 route did not return 200");
  await page.locator("#ssrCanvas").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  assert.equal(await page.locator("#postprocessCanvas").count(), 1, "Existing Bloom canvas is missing");
  assert.equal(await page.locator("#screen-space-reflections .webgl-fallback").count(), 0, "SSR fell back instead of rendering");
  assert.ok((await page.locator("#ssrCanvas").getAttribute("aria-label"))?.trim(), "SSR canvas has no accessible name");

  const optionValues = await page.locator("#ssrView option").evaluateAll((options) => options.map((option) => option.value));
  for (const view of ["composite", "reflection", "confidence", "depth", "normal"]) {
    assert.ok(optionValues.includes(view), `Runtime view selector is missing ${view}`);
  }

  const canvas = page.locator("#ssrCanvas");
  const viewHashes = new Set();
  for (const view of ["composite", "reflection", "confidence", "depth", "normal"]) {
    await page.locator("#ssrView").selectOption(view);
    await page.waitForTimeout(180);
    viewHashes.add(hash(await canvas.screenshot()));
  }
  assert.equal(viewHashes.size, 5, `Expected five distinct diagnostic views, found ${viewHashes.size}`);

  const sampledPixels = await page.locator("#ssrCanvas").evaluate((element) => {
    const gl = element.getContext("webgl2");
    if (!gl) return [];
    const points = [
      [0.18, 0.20], [0.50, 0.22], [0.82, 0.20],
      [0.22, 0.56], [0.50, 0.56], [0.78, 0.56],
      [0.18, 0.82], [0.50, 0.82], [0.82, 0.82],
    ];
    return points.map(([x, y]) => {
      const pixel = new Uint8Array(4);
      gl.readPixels(Math.floor(element.width * x), Math.floor(element.height * y), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      return [...pixel].join(",");
    });
  });
  assert.ok(new Set(sampledPixels).size >= 4, "SSR canvas sample points appear blank or visually uniform");

  const maxSteps = page.locator("#ssrMaxSteps");
  const maxStepsOutput = page.locator('output[for="ssrMaxSteps"]');
  const initialOutput = (await maxStepsOutput.textContent())?.trim() ?? "";
  const minValue = await maxSteps.getAttribute("min");
  const maxValue = await maxSteps.getAttribute("max");
  assert.ok(minValue && maxValue && minValue !== maxValue, "SSR max-steps range is invalid");
  await maxSteps.evaluate((element) => {
    element.value = element.min;
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForTimeout(220);
  const minHash = hash(await canvas.screenshot());
  const minOutput = (await maxStepsOutput.textContent())?.trim() ?? "";
  await maxSteps.evaluate((element) => {
    element.value = element.max;
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForTimeout(300);
  const maxHash = hash(await canvas.screenshot());
  const maxOutput = (await maxStepsOutput.textContent())?.trim() ?? "";
  assert.notEqual(minHash, maxHash, "Changing max steps did not change the rendered result");
  assert.notEqual(minOutput, maxOutput, "Changing max steps did not update its output");
  assert.ok(initialOutput || minOutput, "Max-steps output is empty");

  await page.waitForTimeout(400);
  for (const id of ["ssrHitRate", "ssrAverageSteps", "ssrResolution"]) {
    assert.ok(numericText((await page.locator(`#${id}`).textContent())?.trim()), `${id} does not contain a measured value`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `Mobile page has ${overflow}px horizontal overflow`);
  assert.deepEqual(failures, [], failures.join("\n"));
  console.log("Chapter 12 SSR runtime acceptance passed.");
} finally {
  await browser.close();
}
