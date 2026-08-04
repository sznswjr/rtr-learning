import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import katex from "katex";
import { Marked, Renderer } from "marked";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(rootDir, "knowledge/Real-Time-Rendering-4th-CN/sourceFile");
const outputDir = path.join(rootDir, "translations/chapters");
const figureOutputDir = path.join(rootDir, "assets/rtr4-figures");
const katexSourceDir = path.join(rootDir, "node_modules/katex/dist");
const katexOutputDir = path.join(rootDir, "vendor/katex");
const checkOnly = process.argv.includes("--check");
const styleVersion = "20260803-13";
const galleryUrl = "https://www.realtimerendering.com/figures.html";
const translationSourceUrl = "https://github.com/Morakito/Real-Time-Rendering-4th-CN";
const errors = [];

const chapters = [
  { chapter: 1, file: "Chapter 1 Introduction 简介.md" },
  { chapter: 2, file: "Chapter 2 The Graphics Rendering Pipeline 图形渲染管线.md" },
  { chapter: 3, file: "Chapter 3 The Graphics Processing Unit 图形处理单元.md" },
  { chapter: 4, file: "Chapter 4 Transform 变换.md" },
  { chapter: 5, file: "Chapter 5 Shading Basics 着色基础.md" },
];

// Figure numbers published in the official RTR4 figure gallery. Chapter 1 has no
// gallery figures, so its commercial game screenshots are intentionally omitted.
const figureWhitelist = new Map([
  [1, []],
  [2, [1, 2, 3, 4, 5, 6, 7, 8, 9]],
  [3, [1, 2, 3, 4, 5, 7, 9, 10, 12, 14, 15]],
  [4, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 15, 17, 18, 19, 20, 21]],
  [5, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 34, 37, 39, 40, 41]],
]);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeHref(value) {
  const href = String(value ?? "").trim();
  if (!href || /^(?:javascript|data|vbscript):/i.test(href)) {
    return "#";
  }
  return href;
}

function stripSourceToc(markdown) {
  const output = [];
  let inToc = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (/^#\s+/.test(line)) {
      continue;
    }
    if (line.trim() === "## 目录") {
      inToc = true;
      continue;
    }
    if (inToc) {
      if (!line.trim() || /^\s*-\s+/.test(line)) {
        continue;
      }
      inToc = false;
    }
    output.push(line);
  }
  return output.join("\n").trim();
}

function plainHeading(value) {
  return value
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/\\([\[\]])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function collectOutline(markdown) {
  const outline = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = /^(#{2,4})\s+(.+?)\s*$/.exec(line);
    if (!match) {
      continue;
    }
    outline.push({
      depth: match[1].length,
      id: `section-${outline.length + 1}`,
      text: plainHeading(match[2]),
    });
  }
  return outline;
}

function parseFigureLine(line) {
  return /^!\[(.*)]\(([^ )]+)(?:\s+"(.*)")?\)\s*$/.exec(line);
}

function figureNumber(alt, chapter) {
  const match = new RegExp(`图\\s*${chapter}\\.(\\d+)`).exec(alt);
  return match ? Number(match[1]) : null;
}

function pngDimensions(buffer, filePath) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a" || buffer.length < 24) {
    throw new Error(`Expected PNG image: ${filePath}`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function cleanCaption(value) {
  return value
    .replace(/\\(?:mathbf|mathsf|mathrm|hat|bar)\{([^{}]+)}/g, "$1")
    .replace(/\\times/g, "×")
    .replace(/\\ne/g, "≠")
    .replace(/\\([\[\]_*])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function renderMath(source, displayMode, chapter) {
  try {
    return katex.renderToString(source.trim(), {
      displayMode,
      output: "htmlAndMathml",
      strict: false,
      throwOnError: true,
      trust: false,
    });
  } catch (error) {
    throw new Error(`Chapter ${chapter} KaTeX error in ${JSON.stringify(source.trim())}: ${error.message}`);
  }
}

async function collectFigures(chapter, markdown) {
  const allowed = new Set(figureWhitelist.get(chapter));
  const figures = new Map();
  for (const line of markdown.split(/\r?\n/)) {
    const match = parseFigureLine(line);
    if (!match) {
      continue;
    }
    const [, alt, sourceReference] = match;
    const number = figureNumber(alt, chapter);
    if (!allowed.has(number) || /^https?:/i.test(sourceReference)) {
      continue;
    }
    const sourcePath = path.resolve(sourceDir, sourceReference);
    if (!sourcePath.startsWith(`${sourceDir}${path.sep}`)) {
      throw new Error(`Figure escaped source directory: ${sourceReference}`);
    }
    const data = await readFile(sourcePath);
    const outputName = `RTR4.${String(chapter).padStart(2, "0")}.${String(number).padStart(2, "0")}.png`;
    figures.set(number, {
      alt,
      data,
      outputName,
      sourcePath,
      ...pngDimensions(data, sourcePath),
    });
  }
  if (figures.size !== allowed.size) {
    throw new Error(`Chapter ${chapter} expected ${allowed.size} gallery figures, found ${figures.size}`);
  }
  return figures;
}

function createMarkdownParser(chapter, outline, figures) {
  let headingIndex = 0;
  const renderer = new Renderer();

  renderer.heading = (text, depth) => {
    const item = outline[headingIndex];
    headingIndex += 1;
    const id = item?.id ?? `section-${headingIndex}`;
    return `<h${depth} id="${id}">${text}<a class="full-reading-heading-link" href="#${id}" aria-label="链接到本节">#</a></h${depth}>\n`;
  };

  renderer.html = (html) => escapeHtml(html);
  renderer.image = () => "";
  renderer.link = (href, title, text) => {
    const safe = safeHref(href);
    const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
    const external = /^https?:/i.test(safe) ? ' target="_blank" rel="noopener"' : "";
    return `<a href="${escapeHtml(safe)}"${titleAttribute}${external}>${text}</a>`;
  };

  const parser = new Marked({ gfm: true, breaks: false, renderer });
  parser.use({
    extensions: [
      {
        name: "blockMath",
        level: "block",
        start(source) {
          const index = source.indexOf("$$");
          return index >= 0 ? index : undefined;
        },
        tokenizer(source) {
          const match = /^\$\$[ \t]*\n([\s\S]*?)\n\$\$[ \t]*(?:\n|$)/.exec(source);
          return match ? { type: "blockMath", raw: match[0], text: match[1] } : undefined;
        },
        renderer(token) {
          return `<div class="full-reading-math" role="math">${renderMath(token.text, true, chapter)}</div>\n`;
        },
      },
      {
        name: "fullFigure",
        level: "block",
        start(source) {
          const direct = source.startsWith("![") ? 0 : source.indexOf("\n![") + 1;
          return direct > 0 || source.startsWith("![") ? direct : undefined;
        },
        tokenizer(source) {
          const lineEnd = source.indexOf("\n");
          const rawLine = lineEnd >= 0 ? source.slice(0, lineEnd) : source;
          const match = parseFigureLine(rawLine);
          if (!match) {
            return undefined;
          }
          return {
            type: "fullFigure",
            raw: source.slice(0, rawLine.length + (lineEnd >= 0 ? 1 : 0)),
            alt: match[1],
          };
        },
        renderer(token) {
          const number = figureNumber(token.alt, chapter);
          const figure = figures.get(number);
          if (!figure) {
            return "";
          }
          const source = `../../assets/rtr4-figures/chapter-${chapter}/${figure.outputName}`;
          const label = `图 ${chapter}.${number}`;
          return `<figure class="full-reading-figure" data-figure="${chapter}.${number}">
  <a href="${source}" target="_blank" rel="noopener" aria-label="查看${label}原图">
    <img src="${source}" alt="${escapeHtml(cleanCaption(token.alt))}" width="${figure.width}" height="${figure.height}" loading="lazy" decoding="async">
  </a>
  <figcaption>
    <span>${escapeHtml(cleanCaption(token.alt))}</span>
    <small>《Real-Time Rendering》第 4 版，© CRC Press · <a href="${galleryUrl}" target="_blank" rel="noopener">官方图集</a></small>
  </figcaption>
</figure>\n`;
        },
      },
      {
        name: "inlineMath",
        level: "inline",
        start(source) {
          const index = source.indexOf("$");
          return index >= 0 ? index : undefined;
        },
        tokenizer(source) {
          const match = /^\$(?!\$)([^$]+?)\$(?!\$)/.exec(source);
          return match ? { type: "inlineMath", raw: match[0], text: match[1] } : undefined;
        },
        renderer(token) {
          return `<span class="full-reading-inline-math" role="math">${renderMath(token.text, false, chapter)}</span>`;
        },
      },
    ],
  });
  return parser;
}

function chapterPager(chapter, className = "full-reading-pager") {
  const previous = chapter > 1
    ? `<a href="./chapter-${chapter - 1}.html"><span>上一章</span>Chapter ${chapter - 1}</a>`
    : "<span></span>";
  const next = chapter < chapters.length
    ? `<a href="./chapter-${chapter + 1}.html"><span>下一章</span>Chapter ${chapter + 1}</a>`
    : "<span></span>";
  return `<nav class="${className}" aria-label="全文章节导航">${previous}${next}</nav>`;
}

function renderPage({ chapter, title, outline, articleHtml }) {
  const toc = outline
    .map((item) => `<a class="depth-${item.depth}" href="#${item.id}">${escapeHtml(item.text)}</a>`)
    .join("\n");
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="《Real-Time Rendering 4th》第 ${chapter} 章中文全文阅读。" />
    <title>${escapeHtml(title)} | RTR4 中文全文</title>
    <link rel="stylesheet" href="../../vendor/katex/katex.min.css?v=0.18.1" />
    <link rel="stylesheet" href="../../src/styles.css?v=${styleVersion}" />
  </head>
  <body>
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <header class="topbar full-reading-topbar">
      <a class="brand" href="../../index.html"><span>RTR4</span> 实时图形实验</a>
      <nav aria-label="本章入口">
        <a href="../rtr4-cn.html#chapter-${chapter}">导读</a>
        <a href="../../chapters/chapter-${chapter}.html">实验</a>
      </nav>
    </header>
    <main id="main-content" class="full-reading-shell" data-source-chapter="${chapter}">
      <header class="full-reading-hero">
        <p class="eyebrow">Chapter ${chapter} · 中文全文</p>
        <h1>${escapeHtml(title.replace(/^Chapter\s+\d+\s*/, ""))}</h1>
        <p>译文来源：<a href="${translationSourceUrl}" target="_blank" rel="noopener">Real-Time-Rendering-4th-CN</a>。原书文字与图片版权归原作者及 CRC Press 所有。</p>
      </header>
      ${chapterPager(chapter)}
      <div class="full-reading-layout">
        <aside class="full-reading-toc" aria-label="本章目录">
          <p class="eyebrow">本章目录</p>
          ${toc}
        </aside>
        <article class="full-reading-article">${articleHtml}</article>
      </div>
      ${chapterPager(chapter, "full-reading-pager full-reading-pager-bottom")}
    </main>
  </body>
</html>
`;
}

async function writeOrCheck(targetPath, data) {
  const expected = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (checkOnly) {
    try {
      const actual = await readFile(targetPath);
      if (!actual.equals(expected)) {
        errors.push(`Out of date: ${path.relative(rootDir, targetPath)}`);
      }
    } catch {
      errors.push(`Missing: ${path.relative(rootDir, targetPath)}`);
    }
    return;
  }
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, expected);
}

async function syncKatexAssets() {
  await writeOrCheck(
    path.join(katexOutputDir, "katex.min.css"),
    await readFile(path.join(katexSourceDir, "katex.min.css")),
  );
  const fontNames = await readdir(path.join(katexSourceDir, "fonts"));
  for (const fontName of fontNames) {
    const source = path.join(katexSourceDir, "fonts", fontName);
    const target = path.join(katexOutputDir, "fonts", fontName);
    if (checkOnly) {
      await writeOrCheck(target, await readFile(source));
    } else {
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(source, target);
    }
  }
}

for (const config of chapters) {
  const sourcePath = path.join(sourceDir, config.file);
  const rawMarkdown = await readFile(sourcePath, "utf8");
  const title = plainHeading((/^#\s+(.+)$/m.exec(rawMarkdown) ?? [null, `Chapter ${config.chapter}`])[1]);
  const markdown = stripSourceToc(rawMarkdown);
  const outline = collectOutline(markdown);
  const figures = await collectFigures(config.chapter, markdown);
  const parser = createMarkdownParser(config.chapter, outline, figures);
  const parsedArticleHtml = parser.parse(markdown);
  if (typeof parsedArticleHtml !== "string") {
    throw new Error(`Chapter ${config.chapter} parser returned a Promise unexpectedly`);
  }
  const articleHtml = parsedArticleHtml.replace(/[ \t]+$/gm, "");
  await writeOrCheck(
    path.join(outputDir, `chapter-${config.chapter}.html`),
    renderPage({ chapter: config.chapter, title, outline, articleHtml }),
  );
  for (const figure of figures.values()) {
    await writeOrCheck(
      path.join(figureOutputDir, `chapter-${config.chapter}`, figure.outputName),
      figure.data,
    );
  }
}

await syncKatexAssets();

if (errors.length) {
  throw new Error(errors.join("\n"));
}

console.log(`${checkOnly ? "Checked" : "Generated"} ${chapters.length} full translation pages.`);
