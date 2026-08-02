import { homeNavGroups, labRegistry } from "./lab-registry.js?v=20260802-1";

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

  const labs = getChapterLabs(entry);
  const link = document.createElement("a");
  link.className = "home-nav-card";
  link.href = entry.href;
  link.dataset.entryId = entry.id;

  appendTextElement(link, "strong", entry.title);
  appendTextElement(link, "small", entry.summary);
  link.append(createEntryMeta(entry, labs));

  item.append(link);

  if (labs.length > 0) {
    const labList = document.createElement("div");
    labList.className = "home-nav-labs";
    labs.forEach((lab) => labList.append(createLabLink(lab)));
    item.append(labList);
  }

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

export function renderHomeNav(root = document.querySelector(".home-nav")) {
  if (!root) {
    return;
  }

  const fragment = document.createDocumentFragment();
  homeNavGroups.forEach((group) => fragment.append(createNavGroup(group)));
  root.replaceChildren(fragment);
}
