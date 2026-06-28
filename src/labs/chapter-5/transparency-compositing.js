import { prepareCanvas } from "../../render/canvas.js?v=20260628-5";
import { blendOver, mixRgb, rgbToCss } from "../../render/color.js?v=20260628-5";

const transparencyState = {
  alpha: 56,
  order: "blueFirst",
  bias: 54,
};

const ui = {
  transparentAlpha: document.querySelector("#transparentAlpha"),
  transparentAlphaValue: document.querySelector("#transparentAlphaValue"),
  transparentOrder: document.querySelector("#transparentOrder"),
  transparentOrderLabel: document.querySelector("#transparentOrderLabel"),
  transparentOverlapAlpha: document.querySelector("#transparentOverlapAlpha"),
  oitBias: document.querySelector("#oitBias"),
  oitBiasValue: document.querySelector("#oitBiasValue"),
  transparencyCanvas: document.querySelector("#transparencyCanvas"),
};

function drawTransparencyPanel(ctx, x, y, width, height, label, mode) {
  const alpha = transparencyState.alpha / 100;
  const red = [232, 94, 72];
  const blue = [66, 164, 226];
  const background = [21, 25, 26];

  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = "#dce8e5";
  ctx.font = "700 14px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(label, x + 16, y + 28);

  const rectA = { x: x + width * 0.18, y: y + height * 0.32, w: width * 0.46, h: height * 0.42 };
  const rectB = { x: x + width * 0.36, y: y + height * 0.22, w: width * 0.46, h: height * 0.42 };

  if (mode === "weighted") {
    const frontWeight = 0.5 + transparencyState.bias / 200;
    const backWeight = 1.5 - frontWeight;
    const color = mixRgb(blue, red, frontWeight / (frontWeight + backWeight));
    ctx.fillStyle = rgbToCss(color, alpha);
    ctx.fillRect(rectA.x, rectA.y, rectA.w, rectA.h);
    ctx.fillRect(rectB.x, rectB.y, rectB.w, rectB.h);
    ctx.fillStyle = "rgba(255, 211, 138, 0.9)";
    ctx.fillRect(rectB.x, rectB.y + rectB.h - 5, rectB.w, 5);
    return;
  }

  const order = mode === "reverse"
    ? (transparencyState.order === "blueFirst" ? ["red", "blue"] : ["blue", "red"])
    : (transparencyState.order === "blueFirst" ? ["blue", "red"] : ["red", "blue"]);
  const rects = {
    blue: [rectA, blue],
    red: [rectB, red],
  };

  for (const key of order) {
    const [rect, color] = rects[key];
    ctx.fillStyle = rgbToCss(color, alpha);
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }

  const overlap = order.reduce((color, key) => {
    const source = key === "red" ? red : blue;
    return blendOver(color, source, alpha);
  }, background);
  ctx.fillStyle = rgbToCss(overlap);
  ctx.fillRect(x + 16, y + height - 34, 34, 18);
  ctx.fillStyle = "#9fb0ad";
  ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("overlap", x + 58, y + height - 20);
}

function renderTransparencyLab() {
  const { ctx, height, width } = prepareCanvas(ui.transparencyCanvas);
  const pad = 24;
  const panelWidth = (width - pad * 4) / 3;
  const panelHeight = height - pad * 2;
  const alpha = transparencyState.alpha / 100;
  const overlapAlpha = 1 - (1 - alpha) * (1 - alpha);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b0d0e";
  ctx.fillRect(0, 0, width, height);

  drawTransparencyPanel(ctx, pad, pad, panelWidth, panelHeight, "当前顺序", "current");
  drawTransparencyPanel(ctx, pad * 2 + panelWidth, pad, panelWidth, panelHeight, "相反顺序", "reverse");
  drawTransparencyPanel(ctx, pad * 3 + panelWidth * 2, pad, panelWidth, panelHeight, "加权近似", "weighted");

  ui.transparentAlphaValue.value = `${transparencyState.alpha}%`;
  ui.oitBiasValue.value = `${transparencyState.bias}%`;
  ui.transparentOrderLabel.textContent = transparencyState.order === "blueFirst" ? "蓝 → 红" : "红 → 蓝";
  ui.transparentOverlapAlpha.textContent = `${Math.round(overlapAlpha * 100)}%`;
}

export function initTransparencyCompositingLab() {
  ui.transparentAlpha.addEventListener("input", () => {
    transparencyState.alpha = Number(ui.transparentAlpha.value);
    renderTransparencyLab();
  });
  ui.transparentOrder.addEventListener("change", () => {
    transparencyState.order = ui.transparentOrder.value;
    renderTransparencyLab();
  });
  ui.oitBias.addEventListener("input", () => {
    transparencyState.bias = Number(ui.oitBias.value);
    renderTransparencyLab();
  });

  window.addEventListener("resize", renderTransparencyLab);
  renderTransparencyLab();
}
