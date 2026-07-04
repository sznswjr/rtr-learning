import { drawCurve, prepareCanvas } from "../../render/canvas.js?v=20260704-1";
import { rgbToCss } from "../../render/color.js?v=20260704-1";
import { clamp, formatUnit } from "../../render/math.js?v=20260704-1";

const encodingState = {
  gamma: 220,
  contrast: 100,
};

const ui = {
  gammaValue: document.querySelector("#gammaValue"),
  gammaValueLabel: document.querySelector("#gammaValueLabel"),
  edgeContrast: document.querySelector("#edgeContrast"),
  edgeContrastValue: document.querySelector("#edgeContrastValue"),
  encodedMidtone: document.querySelector("#encodedMidtone"),
  displayEncodingCanvas: document.querySelector("#displayEncodingCanvas"),
};

function encodeLinear(value, gamma) {
  return Math.pow(clamp(value), 1 / gamma);
}

function drawEncodingBars(ctx, x, y, width, height, gamma, contrast) {
  const coverages = [0.125, 0.375, 0.625, 0.875];
  const barGap = 10;
  const rowHeight = (height - barGap) / 2;
  const cellWidth = width / coverages.length;

  ctx.fillStyle = "#dce8e5";
  ctx.font = "700 14px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("先在线性空间滤波，再编码显示", x, y - 12);

  coverages.forEach((coverage, index) => {
    const encoded = encodeLinear(coverage * contrast, gamma);
    ctx.fillStyle = rgbToCss([encoded * 255, encoded * 255, encoded * 255]);
    ctx.fillRect(x + index * cellWidth, y, cellWidth, rowHeight);
    ctx.fillStyle = "#101314";
    ctx.font = "700 13px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(`${Math.round(coverage * 100)}%`, x + index * cellWidth + 12, y + 28);
  });

  ctx.fillStyle = "#dce8e5";
  ctx.font = "700 14px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("直接把覆盖率当显示值", x, y + rowHeight + barGap - 12);

  coverages.forEach((coverage, index) => {
    const value = coverage * contrast;
    ctx.fillStyle = rgbToCss([value * 255, value * 255, value * 255]);
    ctx.fillRect(x + index * cellWidth, y + rowHeight + barGap, cellWidth, rowHeight);
  });

  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.strokeRect(x, y, width, rowHeight);
  ctx.strokeRect(x, y + rowHeight + barGap, width, rowHeight);
}

function renderDisplayEncodingLab() {
  const { ctx, height, width } = prepareCanvas(ui.displayEncodingCanvas);
  const gamma = encodingState.gamma / 100;
  const contrast = encodingState.contrast / 100;
  const pad = 46;
  const graphWidth = width * 0.36;
  const graphHeight = height - pad * 2;
  const left = pad;
  const top = pad;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b0d0e";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.strokeRect(left, top, graphWidth, graphHeight);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  for (let index = 1; index < 5; index += 1) {
    const x = left + (graphWidth * index) / 5;
    const y = top + (graphHeight * index) / 5;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + graphHeight);
    ctx.moveTo(left, y);
    ctx.lineTo(left + graphWidth, y);
    ctx.stroke();
  }

  const linear = [];
  const encoded = [];
  for (let index = 0; index <= 140; index += 1) {
    const x = index / 140;
    linear.push([left + x * graphWidth, top + graphHeight - x * graphHeight]);
    encoded.push([left + x * graphWidth, top + graphHeight - encodeLinear(x, gamma) * graphHeight]);
  }
  drawCurve(ctx, linear, "#54c6da");
  drawCurve(ctx, encoded, "#d76f39");

  ctx.fillStyle = "#b8c8c4";
  ctx.font = "13px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("线性值", left + 14, top + graphHeight - 12);
  ctx.fillText("编码值", left + graphWidth - 64, top + 24);

  drawEncodingBars(ctx, width * 0.48, height * 0.25, width * 0.42, height * 0.48, gamma, contrast);

  ui.gammaValueLabel.value = formatUnit(gamma);
  ui.edgeContrastValue.value = `${encodingState.contrast}%`;
  ui.encodedMidtone.textContent = formatUnit(encodeLinear(0.5, gamma));
}

export function initDisplayEncodingLab() {
  ui.gammaValue.addEventListener("input", () => {
    encodingState.gamma = Number(ui.gammaValue.value);
    renderDisplayEncodingLab();
  });
  ui.edgeContrast.addEventListener("input", () => {
    encodingState.contrast = Number(ui.edgeContrast.value);
    renderDisplayEncodingLab();
  });

  window.addEventListener("resize", renderDisplayEncodingLab);
  renderDisplayEncodingLab();
}
