import { homeNavGroups } from "./lab-registry.js?v=20260628-4";

function appendTextElement(parent, tagName, text) {
  const element = document.createElement(tagName);
  element.textContent = text;
  parent.append(element);
  return element;
}

function createNavEntry(entry) {
  const link = document.createElement("a");
  link.href = entry.href;
  link.dataset.entryId = entry.id;

  appendTextElement(link, "strong", entry.title);
  appendTextElement(link, "small", entry.summary);

  return link;
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
