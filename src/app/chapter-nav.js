import { labRegistry } from "./lab-registry.js?v=20260704-1";

function createChapterLink(lab) {
  const link = document.createElement("a");
  link.href = `#${lab.id}`;
  link.dataset.sectionId = lab.id;

  const chapter = document.createElement("span");
  chapter.textContent = lab.chapter;

  const title = document.createElement("strong");
  title.textContent = lab.title;

  link.append(chapter, title);
  return link;
}

function setActiveLink(root, sectionId) {
  root.querySelectorAll("a").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.sectionId === sectionId);
  });
}

function observeActiveSection(root, labs) {
  if (!("IntersectionObserver" in window)) {
    setActiveLink(root, labs[0]?.id);
    return;
  }

  const visibleSections = new Map();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleSections.set(entry.target.id, entry.intersectionRatio);
        } else {
          visibleSections.delete(entry.target.id);
        }
      });

      const [activeId] = [...visibleSections.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
      if (activeId) {
        setActiveLink(root, activeId);
      }
    },
    {
      rootMargin: "-18% 0px -58% 0px",
      threshold: [0.05, 0.2, 0.45, 0.7],
    },
  );

  labs.forEach((lab) => {
    const section = document.getElementById(lab.id);
    if (section) {
      observer.observe(section);
    }
  });
}

export function renderChapterNav(root = document.querySelector(".chapter-nav")) {
  if (!root) {
    return;
  }

  const chapter = root.dataset.chapter;
  const labs = labRegistry.filter((lab) => lab.chapter.split(".")[0] === chapter);

  if (labs.length === 0) {
    root.remove();
    return;
  }

  const fragment = document.createDocumentFragment();
  labs.forEach((lab) => fragment.append(createChapterLink(lab)));
  root.replaceChildren(fragment);
  setActiveLink(root, labs[0].id);
  observeActiveSection(root, labs);
}
