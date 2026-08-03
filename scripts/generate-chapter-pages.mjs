import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chapterRegistry } from "../src/app/lab-registry.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");
const cacheVersion = "20260803-4";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderChapterPage(chapter) {
  const number = chapter.id.replace("chapter-", "");
  const topics = chapter.topics.map((topic) => `            <li>${escapeHtml(topic)}</li>`).join("\n");

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeHtml(chapter.summary)}" />
    <title>${escapeHtml(chapter.title)} | RTR4 实时图形实验</title>
    <link rel="stylesheet" href="../src/styles.css?v=${cacheVersion}" />
  </head>
  <body>
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <main class="app-shell" id="main-content">
      <header class="topbar">
        <div>
          <p class="eyebrow">Real-Time Rendering 4th</p>
          <h1>${escapeHtml(chapter.title)}</h1>
        </div>
        <div class="topbar-actions">
          <a class="status-pill nav-pill" href="../index.html">实验首页</a>
          <a class="status-pill nav-pill" href="../translations/rtr4-cn.html#chapter-${number}">阅读本章</a>
        </div>
      </header>

      <section class="chapter-plan" aria-labelledby="planned-lab-title">
        <div>
          <p class="eyebrow">第一阶段 · 章节框架</p>
          <h2 id="planned-lab-title">${escapeHtml(chapter.plannedLab)}</h2>
          <p>${escapeHtml(chapter.summary)}。本页路由和实验元数据已经建立，交互实现将在后续阶段接入。</p>
        </div>

        <ul class="chapter-plan-topics" aria-label="计划覆盖的关键主题">
${topics}
        </ul>

        <div class="chapter-plan-status" role="status">
          <span>当前状态</span>
          <strong>实验规划中</strong>
        </div>
      </section>
    </main>
  </body>
</html>
`;
}

const plannedChapters = chapterRegistry.filter((chapter) => chapter.status === "planned");
const mismatches = [];

for (const chapter of plannedChapters) {
  const number = chapter.id.replace("chapter-", "");
  const target = path.join(root, "chapters", `chapter-${number}.html`);
  const expected = renderChapterPage(chapter);

  if (checkOnly) {
    const actual = await readFile(target, "utf8").catch(() => "");
    if (actual !== expected) {
      mismatches.push(path.relative(root, target));
    }
  } else {
    await writeFile(target, expected);
  }
}

if (mismatches.length > 0) {
  throw new Error(`Generated chapter pages are stale: ${mismatches.join(", ")}`);
}

console.log(`${checkOnly ? "Checked" : "Generated"} ${plannedChapters.length} planned chapter pages.`);
