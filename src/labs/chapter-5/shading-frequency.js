import { prepareCanvas } from "../../render/canvas.js?v=20260710-1";
import { rgbToCss } from "../../render/color.js?v=20260710-1";
import { TAU, getLightVector } from "../../render/math.js?v=20260710-1";
import { getSphereColor } from "../../render/shading.js?v=20260710-1";

const frequencyState = {
  lightAngle: -54,
  bands: 7,
};

const ui = {
  frequencyLightAngle: document.querySelector("#frequencyLightAngle"),
  frequencyLightAngleValue: document.querySelector("#frequencyLightAngleValue"),
  frequencyBands: document.querySelector("#frequencyBands"),
  frequencyBandsValue: document.querySelector("#frequencyBandsValue"),
  vertexFrequencyCount: document.querySelector("#vertexFrequencyCount"),
  objectFrequencyCanvas: document.querySelector("#objectFrequencyCanvas"),
  vertexFrequencyCanvas: document.querySelector("#vertexFrequencyCanvas"),
  pixelFrequencyCanvas: document.querySelector("#pixelFrequencyCanvas"),
};

function drawFrequencySphere(canvas, mode) {
  const { ctx, height, width } = prepareCanvas(canvas);
  const radius = Math.min(width, height) * 0.34;
  const cx = width * 0.5;
  const cy = height * 0.54;
  const light = getLightVector(frequencyState.lightAngle, 0.48);
  const baseColor = [96, 214, 190];

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b0d0e";
  ctx.fillRect(0, 0, width, height);

  if (mode === "object") {
    const color = getSphereColor([0, 0, 1], light, "lambert", baseColor, 0);
    ctx.fillStyle = rgbToCss(color);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, TAU);
    ctx.fill();
  } else {
    const cells = mode === "vertex" ? frequencyState.bands : Math.max(38, frequencyState.bands * 8);
    const cell = (radius * 2) / cells;
    for (let row = 0; row < cells; row += 1) {
      for (let col = 0; col < cells; col += 1) {
        const x = -radius + col * cell + cell * 0.5;
        const y = -radius + row * cell + cell * 0.5;
        const nx = x / radius;
        const ny = y / radius;
        const rr = nx * nx + ny * ny;
        if (rr > 1) {
          continue;
        }
        const normal = [nx, ny, Math.sqrt(1 - rr)];
        const color = getSphereColor(normal, light, "lambert", baseColor, 0);
        ctx.fillStyle = rgbToCss(color);
        ctx.fillRect(cx - radius + col * cell, cy - radius + row * cell, cell + 0.8, cell + 0.8);
      }
    }

    if (mode === "vertex") {
      ctx.strokeStyle = "rgba(16, 19, 20, 0.28)";
      ctx.lineWidth = 1;
      for (let index = 0; index <= cells; index += 1) {
        const p = -radius + index * cell;
        ctx.beginPath();
        ctx.moveTo(cx - radius, cy + p);
        ctx.lineTo(cx + radius, cy + p);
        ctx.moveTo(cx + p, cy - radius);
        ctx.lineTo(cx + p, cy + radius);
        ctx.stroke();
      }
    }
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, TAU);
  ctx.strokeStyle = "rgba(238, 244, 242, 0.46)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function renderFrequencyLab() {
  drawFrequencySphere(ui.objectFrequencyCanvas, "object");
  drawFrequencySphere(ui.vertexFrequencyCanvas, "vertex");
  drawFrequencySphere(ui.pixelFrequencyCanvas, "pixel");
  ui.frequencyLightAngleValue.value = `${frequencyState.lightAngle}°`;
  ui.frequencyBandsValue.value = `${frequencyState.bands}`;
  ui.vertexFrequencyCount.textContent = `${frequencyState.bands * frequencyState.bands} 格`;
}

export function initShadingFrequencyLab() {
  ui.frequencyLightAngle.addEventListener("input", () => {
    frequencyState.lightAngle = Number(ui.frequencyLightAngle.value);
    renderFrequencyLab();
  });
  ui.frequencyBands.addEventListener("input", () => {
    frequencyState.bands = Number(ui.frequencyBands.value);
    renderFrequencyLab();
  });

  window.addEventListener("resize", renderFrequencyLab);
  renderFrequencyLab();
}
