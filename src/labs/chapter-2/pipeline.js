import { drawArrow, prepareCanvas, roundedRectPath } from "../../render/canvas.js?v=20260710-1";
import { TAU } from "../../render/math.js?v=20260710-1";

const pipelineState = {
  clipMode: "frustum",
  complexity: 8,
  focus: "geometry",
};

const pipelineStageLabels = {
  application: "应用阶段",
  geometry: "几何处理",
  rasterization: "光栅化",
  pixel: "像素处理",
};

const ui = {
  pipelineFocus: document.querySelector("#pipelineFocus"),
  pipelineComplexity: document.querySelector("#pipelineComplexity"),
  pipelineComplexityValue: document.querySelector("#pipelineComplexityValue"),
  pipelineClipMode: document.querySelector("#pipelineClipMode"),
  pipelineSubmitted: document.querySelector("#pipelineSubmitted"),
  pipelineVisible: document.querySelector("#pipelineVisible"),
  pipelineFragments: document.querySelector("#pipelineFragments"),
  pipelineFocusLabel: document.querySelector("#pipelineFocusLabel"),
  pipelineCanvas: document.querySelector("#pipelineCanvas"),
};

function getPipelineObjects() {
  return Array.from({ length: pipelineState.complexity }, (_, index) => {
    const x = (((index * 73 + 19) % 100) / 100) * 1.9 - 0.95;
    const y = (((index * 41 + 11) % 100) / 100) * 1.25 - 0.62;
    const size = 0.07 + (((index * 29 + 7) % 100) / 100) * 0.075;
    const primitives = 8 + ((index * 5) % 17);
    return { primitives, size, x, y };
  });
}

function getPipelineClipBounds() {
  if (pipelineState.clipMode === "off") {
    return { xMax: 1.05, xMin: -1.05, yMax: 0.72, yMin: -0.72 };
  }

  if (pipelineState.clipMode === "aggressive") {
    return { xMax: 0.48, xMin: -0.48, yMax: 0.36, yMin: -0.36 };
  }

  return { xMax: 0.72, xMin: -0.72, yMax: 0.52, yMin: -0.52 };
}

function isPipelineObjectVisible(object, bounds) {
  return (
    object.x + object.size >= bounds.xMin &&
    object.x - object.size <= bounds.xMax &&
    object.y + object.size >= bounds.yMin &&
    object.y - object.size <= bounds.yMax
  );
}

function getPipelineMetrics() {
  const objects = getPipelineObjects();
  const bounds = getPipelineClipBounds();
  const visible = objects.filter((object) => isPipelineObjectVisible(object, bounds));
  const submitted = objects.reduce((total, object) => total + object.primitives, 0);
  const visiblePrimitives = visible.reduce((total, object) => total + object.primitives, 0);
  const fragments = visible.reduce((total, object) => total + Math.round(object.primitives * object.size * 210), 0);
  return { bounds, fragments, objects, submitted, visible, visiblePrimitives };
}

function drawPipelineStage(ctx, stage, x, y, width, height) {
  const active = pipelineState.focus === stage.key;
  roundedRectPath(ctx, x, y, width, height, 8);
  ctx.fillStyle = active ? "rgba(142, 212, 199, 0.18)" : "#131819";
  ctx.fill();
  ctx.strokeStyle = active ? "rgba(142, 212, 199, 0.8)" : "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = active ? 2 : 1;
  ctx.stroke();

  ctx.fillStyle = active ? "#e8fff8" : "#dce8e5";
  ctx.font = "700 14px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(stage.label, x + 14, y + 25);
  ctx.fillStyle = "#93a9a4";
  ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(stage.detail, x + 14, y + 47);
}

function drawPipelineScene(ctx, panel, objects, bounds, compact = false) {
  const mapX = (value) => panel.x + ((value + 1.05) / 2.1) * panel.w;
  const mapY = (value) => panel.y + panel.h - ((value + 0.72) / 1.44) * panel.h;

  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

  const clipX = mapX(bounds.xMin);
  const clipY = mapY(bounds.yMax);
  const clipW = mapX(bounds.xMax) - clipX;
  const clipH = mapY(bounds.yMin) - clipY;
  ctx.fillStyle = "rgba(142, 212, 199, 0.08)";
  ctx.fillRect(clipX, clipY, clipW, clipH);
  ctx.strokeStyle = pipelineState.focus === "geometry" ? "#8ed4c7" : "rgba(142, 212, 199, 0.42)";
  ctx.lineWidth = 2;
  ctx.strokeRect(clipX, clipY, clipW, clipH);

  for (const object of objects) {
    const visible = isPipelineObjectVisible(object, bounds);
    const radius = Math.max(5, object.size * panel.w * 0.32);
    ctx.beginPath();
    ctx.arc(mapX(object.x), mapY(object.y), radius, 0, TAU);
    ctx.fillStyle = visible ? "#d76f39" : "rgba(147, 169, 164, 0.32)";
    ctx.fill();
    ctx.strokeStyle = visible ? "rgba(255, 211, 138, 0.78)" : "rgba(147, 169, 164, 0.38)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.fillStyle = "#dce8e5";
  ctx.font = "700 13px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(compact ? "几何：变换 / 裁剪" : "几何处理：变换 / 投影 / 裁剪", panel.x + 14, panel.y + 24);
}

function drawPipelineScreen(ctx, panel, visibleObjects, bounds, compact = false) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

  const screenX = panel.x + panel.w * 0.18;
  const screenY = panel.y + panel.h * 0.18;
  const screenW = panel.w * 0.64;
  const screenH = panel.h * 0.62;
  ctx.fillStyle = "#0b0d0e";
  ctx.fillRect(screenX, screenY, screenW, screenH);
  ctx.strokeStyle = pipelineState.focus === "rasterization" ? "#8ed4c7" : "rgba(238, 244, 242, 0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(screenX, screenY, screenW, screenH);

  for (const object of visibleObjects) {
    const x = screenX + ((object.x - bounds.xMin) / (bounds.xMax - bounds.xMin || 1)) * screenW;
    const y = screenY + screenH - ((object.y - bounds.yMin) / (bounds.yMax - bounds.yMin || 1)) * screenH;
    const radius = Math.max(4, object.size * screenW * 0.32);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fillStyle = "rgba(215, 111, 57, 0.82)";
    ctx.fill();
  }

  ctx.fillStyle = "#dce8e5";
  ctx.font = "700 13px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(compact ? "光栅化：屏幕映射" : "屏幕映射：NDC → window", panel.x + 14, panel.y + 24);
}

function drawPipelineFragments(ctx, panel, fragments, compact = false) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

  const cols = 18;
  const rows = 10;
  const cell = Math.min((panel.w - 34) / cols, (panel.h - 58) / rows);
  const left = panel.x + (panel.w - cell * cols) * 0.5;
  const top = panel.y + 42;
  const activeCells = Math.min(cols * rows, Math.round(fragments / 18));

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col;
      const active = index < activeCells;
      ctx.fillStyle = active ? "#d76f39" : "#182324";
      ctx.fillRect(left + col * cell, top + row * cell, Math.ceil(cell) - 1, Math.ceil(cell) - 1);
    }
  }

  ctx.strokeStyle = pipelineState.focus === "pixel" ? "#8ed4c7" : "rgba(238, 244, 242, 0.22)";
  ctx.lineWidth = 2;
  ctx.strokeRect(left, top, cell * cols, cell * rows);
  ctx.fillStyle = "#dce8e5";
  ctx.font = "700 13px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(compact ? "像素：着色 / 合并" : "像素处理：着色 / 深度 / 合并", panel.x + 14, panel.y + 24);
}

function renderPipelineLab() {
  const { ctx, height, width } = prepareCanvas(ui.pipelineCanvas);
  const metrics = getPipelineMetrics();
  const stages = [
    { detail: "CPU: 输入、动画、提交", key: "application", label: "应用阶段" },
    { detail: "顶点、投影、裁剪", key: "geometry", label: "几何处理" },
    { detail: "图元覆盖到片元", key: "rasterization", label: "光栅化" },
    { detail: "着色、测试、混合", key: "pixel", label: "像素处理" },
  ];
  const compact = window.matchMedia("(max-width: 600px)").matches;
  const pad = compact ? 12 : 24;
  const stageGap = compact ? 12 : 16;
  const stageW = compact ? width - pad * 2 : (width - pad * 2 - stageGap * 3) / 4;
  const stageY = compact ? 12 : 24;
  const stageH = compact ? 54 : 70;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b0d0e";
  ctx.fillRect(0, 0, width, height);

  stages.forEach((stage, index) => {
    const x = compact ? pad : pad + index * (stageW + stageGap);
    const y = compact ? stageY + index * (stageH + stageGap) : stageY;
    drawPipelineStage(ctx, stage, x, y, stageW, stageH);
    if (index < stages.length - 1) {
      if (compact) {
        drawArrow(ctx, width * 0.5, y + stageH + 2, width * 0.5, y + stageH + stageGap - 2, "#5caea0");
      } else {
        drawArrow(ctx, x + stageW + 4, stageY + stageH * 0.5, x + stageW + stageGap - 4, stageY + stageH * 0.5, "#5caea0");
      }
    }
  });

  if (compact) {
    const panelTop = stageY + stages.length * stageH + (stages.length - 1) * stageGap + 22;
    const panelGap = 10;
    const panelW = (width - pad * 2 - panelGap) / 2;
    const panelH = Math.max(120, (height - panelTop - pad - panelGap) / 2);
    const secondRowY = panelTop + panelH + panelGap;
    drawPipelineScene(
      ctx,
      { h: panelH, w: panelW, x: pad, y: panelTop },
      metrics.objects,
      metrics.bounds,
      true,
    );
    drawPipelineScreen(
      ctx,
      { h: panelH, w: panelW, x: pad + panelW + panelGap, y: panelTop },
      metrics.visible,
      metrics.bounds,
      true,
    );
    drawPipelineFragments(
      ctx,
      { h: height - secondRowY - pad, w: width - pad * 2, x: pad, y: secondRowY },
      metrics.fragments,
      true,
    );
    ui.pipelineCanvas.dataset.layout = "compact";
  } else {
    const panelTop = stageY + stageH + 34;
    const panelH = height - panelTop - pad;
    const panelGap = 14;
    const panelW = (width - pad * 2 - panelGap * 2) / 3;
    drawPipelineScene(ctx, { h: panelH, w: panelW, x: pad, y: panelTop }, metrics.objects, metrics.bounds);
    drawPipelineScreen(
      ctx,
      { h: panelH, w: panelW, x: pad + panelW + panelGap, y: panelTop },
      metrics.visible,
      metrics.bounds,
    );
    drawPipelineFragments(
      ctx,
      { h: panelH, w: panelW, x: pad + panelW * 2 + panelGap * 2, y: panelTop },
      metrics.fragments,
    );
    ui.pipelineCanvas.dataset.layout = "wide";
  }

  ui.pipelineComplexityValue.value = `${pipelineState.complexity} 个物体`;
  ui.pipelineSubmitted.textContent = `${metrics.submitted}`;
  ui.pipelineVisible.textContent = `${metrics.visiblePrimitives}`;
  ui.pipelineFragments.textContent = `${metrics.fragments}`;
  ui.pipelineFocusLabel.textContent = pipelineStageLabels[pipelineState.focus];
}

export function initPipelineLab() {
  ui.pipelineFocus.addEventListener("change", () => {
    pipelineState.focus = ui.pipelineFocus.value;
    renderPipelineLab();
  });

  ui.pipelineComplexity.addEventListener("input", () => {
    pipelineState.complexity = Number(ui.pipelineComplexity.value);
    renderPipelineLab();
  });

  ui.pipelineClipMode.addEventListener("change", () => {
    pipelineState.clipMode = ui.pipelineClipMode.value;
    renderPipelineLab();
  });

  let resizeFrame = 0;
  window.addEventListener("resize", () => {
    if (resizeFrame) {
      return;
    }
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0;
      renderPipelineLab();
    });
  });
  renderPipelineLab();
}
