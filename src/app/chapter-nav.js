import { labRegistry } from "./lab-registry.js?v=20260802-1";

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
  let activeLink = null;
  root.querySelectorAll("a").forEach((link) => {
    const isActive = link.dataset.sectionId === sectionId;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "location");
      activeLink = link;
    } else {
      link.removeAttribute("aria-current");
    }
  });

  if (activeLink && root.dataset.activeSection !== sectionId) {
    root.dataset.activeSection = sectionId;
    const targetLeft = activeLink.offsetLeft - (root.clientWidth - activeLink.offsetWidth) * 0.5;
    root.scrollTo({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      left: Math.max(0, targetLeft),
    });
  }
}

function enhanceCanvasSemantics(labs) {
  labs.forEach((lab) => {
    const section = document.getElementById(lab.id);
    if (!section) {
      return;
    }

    section.querySelectorAll("canvas").forEach((canvas) => {
      const canvasHeading = canvas.closest(".viewport-panel")?.querySelector(".panel-heading h2");
      if (!canvasHeading) {
        return;
      }
      canvasHeading.id ||= `${canvas.id}-title`;
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-labelledby", canvasHeading.id);
      canvas.textContent = `${canvasHeading.textContent?.trim() || lab.title}可视化；请使用本实验控件改变参数。`;
    });
  });
}

function enhanceRangeSemantics() {
  document.querySelectorAll('input[type="range"]').forEach((input) => {
    const output = document.querySelector(`output[for="${input.id}"]`);
    if (!output) {
      return;
    }

    let syncFrame = 0;
    const syncValueText = () => {
      window.cancelAnimationFrame(syncFrame);
      syncFrame = window.requestAnimationFrame(() => {
        syncFrame = window.requestAnimationFrame(() => {
          syncFrame = 0;
          input.setAttribute("aria-valuetext", output.value || output.textContent?.trim() || input.value);
        });
      });
    };
    input.addEventListener("input", syncValueText);
    input.addEventListener("change", syncValueText);
    syncValueText();
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
  enhanceCanvasSemantics(labs);
  enhanceRangeSemantics();
  observeActiveSection(root, labs);
}
