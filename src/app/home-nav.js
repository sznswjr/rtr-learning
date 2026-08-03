import { homeNavGroups, labRegistry } from "./lab-registry.js?v=20260803-9";

function appendTextElement(parent, tagName, text) {
  const element = document.createElement(tagName);
  element.textContent = text;
  parent.append(element);
  return element;
}

function getChapterLabs(entry) {
  const chapterNumber = entry.id.replace("chapter-", "");
  return labRegistry.filter((lab) => lab.chapter.split(".")[0] === chapterNumber);
}

function createEntryMeta(entry, labs) {
  const meta = document.createElement("div");
  meta.className = "home-nav-meta";

  if (entry.range) {
    appendTextElement(meta, "span", entry.range);
  }

  if (entry.status === "planned") {
    const status = appendTextElement(meta, "span", "实验规划中");
    status.className = "is-planned";
  }

  if (labs.length > 0) {
    const rendererLabels = {
      canvas2d: "Canvas 2D",
      webgl2: "WebGL 2",
    };
    const renderers = [...new Set(labs.map((lab) => rendererLabels[lab.renderer] ?? lab.renderer))].join(" / ");
    appendTextElement(meta, "span", `${labs.length} 个实验`);
    appendTextElement(meta, "span", renderers);
  }

  return meta;
}

function createLabLink(lab) {
  const link = document.createElement("a");
  link.className = "home-nav-lab";
  link.href = lab.href;
  link.dataset.entryId = lab.id;
  link.textContent = `${lab.chapter} ${lab.title}`;
  return link;
}

function createNavEntry(entry) {
  const item = document.createElement("article");
  item.className = "home-nav-entry";
  if (entry.status === "planned") {
    item.classList.add("is-planned");
  }

  const labs = getChapterLabs(entry);
  const link = document.createElement("a");
  link.className = "home-nav-card";
  link.href = entry.href;
  link.dataset.entryId = entry.id;

  appendTextElement(link, "strong", entry.title);
  appendTextElement(link, "small", entry.summary);
  link.append(createEntryMeta(entry, labs));

  item.append(link);

  return item;
}

function createNavGroup(group) {
  const groupElement = document.createElement("div");
  groupElement.className = group.feature
    ? "home-nav-group home-nav-feature"
    : "home-nav-group";

  appendTextElement(groupElement, "span", group.label);
  group.entries.forEach((entry) => groupElement.append(createNavEntry(entry)));

  return groupElement;
}

function createLabDirectory() {
  const group = document.createElement("div");
  group.className = "home-nav-group home-nav-lab-directory";
  appendTextElement(group, "span", "实验直达");

  const links = document.createElement("div");
  links.className = "home-nav-lab-grid";
  labRegistry.forEach((lab) => links.append(createLabLink(lab)));
  group.append(links);
  return group;
}

export function renderHomeNav(root = document.querySelector(".home-nav")) {
  if (!root) {
    return;
  }

  const fragment = document.createDocumentFragment();
  homeNavGroups.forEach((group) => fragment.append(createNavGroup(group)));
  fragment.append(createLabDirectory());
  root.replaceChildren(fragment);
}
