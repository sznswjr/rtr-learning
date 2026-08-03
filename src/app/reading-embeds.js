import { labRegistry } from "./lab-registry.js?v=20260803-10";

const cardsByLabId = new Map();
let activeCard = null;

function chapterNumber(lab) {
  return Number.parseInt(lab.chapter.split(".")[0], 10);
}

function readingHref(lab) {
  return lab.href.startsWith("./") ? `../${lab.href.slice(2)}` : lab.href;
}

function embeddedHref(lab) {
  const url = new URL(readingHref(lab), window.location.href);
  url.searchParams.set("embed", lab.id);
  url.hash = lab.id;
  return url.href;
}

function selectedLab(card) {
  const id = card.querySelector("select")?.value ?? card.dataset.defaultLab;
  return labRegistry.find((lab) => lab.id === id);
}

function updateCardSelection(card) {
  const lab = selectedLab(card);
  if (!lab) {
    return;
  }

  const frame = card.querySelector("iframe");
  const fullLink = card.querySelector(".translation-lab-full-link");
  card.dataset.selectedLab = lab.id;
  frame.title = `${lab.chapter} ${lab.title}交互实验`;
  fullLink.href = readingHref(lab);
  fullLink.setAttribute("aria-label", `在独立页面打开${lab.title}`);
}

function unloadCard(card) {
  const frame = card.querySelector("iframe");
  frame.hidden = true;
  frame.style.height = "";
  frame.dataset.labId = "";
  frame.src = "about:blank";
  card.classList.remove("is-loading");
  if (activeCard === card) {
    activeCard = null;
  }
}

function loadCard(card) {
  const lab = selectedLab(card);
  if (!lab) {
    return;
  }

  if (activeCard && activeCard !== card) {
    activeCard.open = false;
    unloadCard(activeCard);
  }

  activeCard = card;
  updateCardSelection(card);
  const frame = card.querySelector("iframe");
  frame.hidden = false;
  frame.dataset.labId = lab.id;
  card.classList.add("is-loading");
  frame.src = embeddedHref(lab);
}

function createLabCard(chapter, labs) {
  const card = document.createElement("details");
  card.className = "translation-lab-embed";
  card.dataset.chapter = String(chapter);
  card.dataset.defaultLab = labs[0].id;

  const summary = document.createElement("summary");
  summary.innerHTML = `
    <span class="translation-lab-kicker">本章实验</span>
    <strong>${labs.length === 1 ? labs[0].title : `${labs.length} 个交互实验`}</strong>
    <span class="translation-lab-toggle" aria-hidden="true"></span>
  `;

  const body = document.createElement("div");
  body.className = "translation-lab-embed-body";

  const toolbar = document.createElement("div");
  toolbar.className = "translation-lab-toolbar";

  if (labs.length > 1) {
    const label = document.createElement("label");
    label.htmlFor = `translation-lab-select-${chapter}`;
    label.textContent = "选择实验";

    const select = document.createElement("select");
    select.className = "translation-lab-select";
    select.id = label.htmlFor;
    labs.forEach((lab) => {
      const option = document.createElement("option");
      option.value = lab.id;
      option.textContent = `${lab.chapter} ${lab.title}`;
      select.append(option);
      cardsByLabId.set(lab.id, card);
    });
    toolbar.append(label, select);
  } else {
    const title = document.createElement("span");
    title.className = "translation-lab-selected-title";
    title.textContent = `${labs[0].chapter} ${labs[0].title}`;
    toolbar.append(title);
    cardsByLabId.set(labs[0].id, card);
  }

  const fullLink = document.createElement("a");
  fullLink.className = "translation-lab-full-link";
  fullLink.target = "_blank";
  fullLink.rel = "noopener";
  fullLink.textContent = "独立页面打开 ↗";
  toolbar.append(fullLink);

  const frameShell = document.createElement("div");
  frameShell.className = "translation-lab-frame-shell";

  const loading = document.createElement("p");
  loading.className = "translation-lab-loading";
  loading.setAttribute("role", "status");
  loading.textContent = "正在载入实验…";

  const frame = document.createElement("iframe");
  frame.className = "translation-lab-frame";
  frame.loading = "lazy";
  frame.hidden = true;
  frame.addEventListener("load", () => {
    if (frame.dataset.labId) {
      card.classList.remove("is-loading");
    }
  });

  frameShell.append(loading, frame);
  body.append(toolbar, frameShell);
  card.append(summary, body);

  card.addEventListener("toggle", () => {
    if (card.open) {
      loadCard(card);
    } else {
      unloadCard(card);
    }
  });

  card.querySelector("select")?.addEventListener("change", () => {
    updateCardSelection(card);
    if (card.open) {
      unloadCard(card);
      activeCard = card;
      window.requestAnimationFrame(() => loadCard(card));
    }
  });

  updateCardSelection(card);
  return card;
}

function renderReadingEmbeds() {
  for (let chapter = 1; chapter <= 26; chapter += 1) {
    const labs = labRegistry.filter((lab) => chapterNumber(lab) === chapter);
    const section = document.getElementById(`chapter-${chapter}`);
    if (section && labs.length > 0) {
      section.append(createLabCard(chapter, labs));
    }
  }
}

window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin || event.data?.type !== "rtr4-lab-height") {
    return;
  }

  const card = cardsByLabId.get(event.data.labId);
  const frame = card?.querySelector("iframe");
  const height = Number(event.data.height);
  if (
    !card?.open ||
    card.dataset.selectedLab !== event.data.labId ||
    frame?.contentWindow !== event.source ||
    !Number.isFinite(height)
  ) {
    return;
  }

  frame.style.height = `${Math.min(5000, Math.max(560, Math.ceil(height)))}px`;
});

renderReadingEmbeds();
