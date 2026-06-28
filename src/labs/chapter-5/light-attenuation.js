import { drawCurve, prepareCanvas } from "../../render/canvas.js?v=20260628-5";
import { TAU, clamp, formatUnit } from "../../render/math.js?v=20260628-5";

const attenuationState = {
  distance: 116,
  radius: 28,
  range: 300,
};

const ui = {
  attenuationDistance: document.querySelector("#attenuationDistance"),
  attenuationDistanceValue: document.querySelector("#attenuationDistanceValue"),
  attenuationRadius: document.querySelector("#attenuationRadius"),
  attenuationRadiusValue: document.querySelector("#attenuationRadiusValue"),
  attenuationRange: document.querySelector("#attenuationRange"),
  attenuationRangeValue: document.querySelector("#attenuationRangeValue"),
  inverseSquareValue: document.querySelector("#inverseSquareValue"),
  windowValue: document.querySelector("#windowValue"),
  combinedAttenuationValue: document.querySelector("#combinedAttenuationValue"),
  lightAttenuationCanvas: document.querySelector("#lightAttenuationCanvas"),
};

function attenuationValues(distance, radius, range) {
  const r = Math.max(distance, radius);
  const inverse = 1 / (r * r);
  const windowBase = Math.max(0, 1 - Math.pow(distance / range, 4));
  const win = windowBase * windowBase;
  return {
    combined: inverse * win,
    inverse,
    win,
  };
}

function renderLightAttenuationLab() {
  const { ctx, height, width } = prepareCanvas(ui.lightAttenuationCanvas);
  const distance = attenuationState.distance / 100;
  const radius = attenuationState.radius / 100;
  const range = attenuationState.range / 100;
  const pad = 52;
  const graphWidth = width - pad * 2;
  const graphHeight = height - pad * 2;
  const graphLeft = pad;
  const graphTop = pad * 0.8;
  const yScale = 4.4;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b0d0e";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  for (let index = 0; index <= 6; index += 1) {
    const x = graphLeft + (graphWidth * index) / 6;
    const y = graphTop + (graphHeight * index) / 6;
    ctx.beginPath();
    ctx.moveTo(x, graphTop);
    ctx.lineTo(x, graphTop + graphHeight);
    ctx.moveTo(graphLeft, y);
    ctx.lineTo(graphLeft + graphWidth, y);
    ctx.stroke();
  }

  const toPoint = (r, value) => [
    graphLeft + (r / range) * graphWidth,
    graphTop + graphHeight - clamp(value / yScale, 0, 1) * graphHeight,
  ];
  const inversePoints = [];
  const windowPoints = [];
  const combinedPoints = [];

  for (let index = 0; index <= 240; index += 1) {
    const r = (range * index) / 240;
    const values = attenuationValues(r, radius, range);
    inversePoints.push(toPoint(r, values.inverse));
    windowPoints.push(toPoint(r, values.win * yScale));
    combinedPoints.push(toPoint(r, values.combined));
  }

  drawCurve(ctx, inversePoints, "#54c6da");
  drawCurve(ctx, windowPoints, "#8ed4c7");
  drawCurve(ctx, combinedPoints, "#d76f39");

  const marker = attenuationValues(distance, radius, range);
  const markerPoint = toPoint(distance, marker.combined);
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = "rgba(238, 244, 242, 0.62)";
  ctx.beginPath();
  ctx.moveTo(markerPoint[0], graphTop);
  ctx.lineTo(markerPoint[0], graphTop + graphHeight);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#ffd38a";
  ctx.beginPath();
  ctx.arc(markerPoint[0], markerPoint[1], 6, 0, TAU);
  ctx.fill();

  const legend = [
    ["平方反比", "#54c6da"],
    ["窗口函数", "#8ed4c7"],
    ["相乘结果", "#d76f39"],
  ];
  legend.forEach(([label, color], index) => {
    const x = graphLeft + 18 + index * 120;
    const y = height - 24;
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 10, 22, 4);
    ctx.fillStyle = "#b8c8c4";
    ctx.font = "13px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(label, x + 30, y - 4);
  });

  ui.attenuationDistanceValue.value = formatUnit(distance);
  ui.attenuationRadiusValue.value = formatUnit(radius);
  ui.attenuationRangeValue.value = formatUnit(range);
  ui.inverseSquareValue.textContent = formatUnit(marker.inverse);
  ui.windowValue.textContent = formatUnit(marker.win);
  ui.combinedAttenuationValue.textContent = formatUnit(marker.combined);
}

export function initLightAttenuationLab() {
  ui.attenuationDistance.addEventListener("input", () => {
    attenuationState.distance = Number(ui.attenuationDistance.value);
    renderLightAttenuationLab();
  });
  ui.attenuationRadius.addEventListener("input", () => {
    attenuationState.radius = Number(ui.attenuationRadius.value);
    renderLightAttenuationLab();
  });
  ui.attenuationRange.addEventListener("input", () => {
    attenuationState.range = Number(ui.attenuationRange.value);
    renderLightAttenuationLab();
  });

  window.addEventListener("resize", renderLightAttenuationLab);
  renderLightAttenuationLab();
}
