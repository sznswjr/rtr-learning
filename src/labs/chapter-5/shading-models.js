import { prepareCanvas } from "../../render/canvas.js?v=20260704-1";
import { hslToRgb, rgbToCss } from "../../render/color.js?v=20260704-1";
import { TAU, dot3, formatUnit, getLightVector } from "../../render/math.js?v=20260704-1";
import { getSphereColor } from "../../render/shading.js?v=20260704-1";

const shadingState = {
  model: "gooch",
  lightAngle: -42,
  surfaceHue: 176,
  highlightStrength: 58,
};

const ui = {
  shadingModel: document.querySelector("#shadingModel"),
  lightAngle: document.querySelector("#lightAngle"),
  lightAngleValue: document.querySelector("#lightAngleValue"),
  surfaceHue: document.querySelector("#surfaceHue"),
  surfaceHueValue: document.querySelector("#surfaceHueValue"),
  highlightStrength: document.querySelector("#highlightStrength"),
  highlightStrengthValue: document.querySelector("#highlightStrengthValue"),
  normalDotLight: document.querySelector("#normalDotLight"),
  shadingOperation: document.querySelector("#shadingOperation"),
  shadingModelLabel: document.querySelector("#shadingModelLabel"),
  shadingModelCanvas: document.querySelector("#shadingModelCanvas"),
};

function drawShadedSphere(ctx, cx, cy, radius, options) {
  const step = Math.max(2, Math.floor(radius / 92));
  for (let y = -radius; y <= radius; y += step) {
    for (let x = -radius; x <= radius; x += step) {
      const nx = (x + step * 0.5) / radius;
      const ny = (y + step * 0.5) / radius;
      const rr = nx * nx + ny * ny;
      if (rr > 1) {
        continue;
      }

      const normal = [nx, ny, Math.sqrt(1 - rr)];
      const color = getSphereColor(
        normal,
        options.light,
        options.model,
        options.baseColor,
        options.highlightStrength,
      );
      ctx.fillStyle = rgbToCss(color);
      ctx.fillRect(cx + x, cy + y, step + 0.7, step + 0.7);
    }
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, TAU);
  ctx.strokeStyle = "rgba(238, 244, 242, 0.46)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawVectorGlyph(ctx, x, y, angle, color, label) {
  const length = 78;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-length * 0.5, 0);
  ctx.lineTo(length * 0.5, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(length * 0.5, 0);
  ctx.lineTo(length * 0.5 - 12, -7);
  ctx.lineTo(length * 0.5 - 12, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = color;
  ctx.font = "700 13px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(label, x + 48, y - 8);
}

function renderShadingModelLab() {
  const { ctx, height, width } = prepareCanvas(ui.shadingModelCanvas);
  const light = getLightVector(shadingState.lightAngle);
  const baseColor = hslToRgb(shadingState.surfaceHue, 0.6, 0.56);
  const radius = Math.min(width * 0.26, height * 0.42);
  const cx = width * 0.34;
  const cy = height * 0.55;
  const ndotl = dot3([0, 0, 1], light);
  const modelLabels = {
    gooch: "Gooch 冷暖插值",
    lambert: "Lambert 漫反射",
    toon: "分段卡通",
  };
  const operationLabels = {
    gooch: "mix + reflect",
    lambert: "max(n·l, 0)",
    toon: "quantize",
  };

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b0d0e";
  ctx.fillRect(0, 0, width, height);
  drawShadedSphere(ctx, cx, cy, radius, {
    baseColor,
    highlightStrength: shadingState.highlightStrength,
    light,
    model: shadingState.model,
  });

  const panelX = width * 0.66;
  ctx.fillStyle = "rgba(238, 244, 242, 0.08)";
  ctx.fillRect(panelX - 60, height * 0.18, width * 0.25, height * 0.62);
  ctx.strokeStyle = "rgba(238, 244, 242, 0.18)";
  ctx.strokeRect(panelX - 60, height * 0.18, width * 0.25, height * 0.62);

  const angle = (shadingState.lightAngle / 180) * Math.PI;
  drawVectorGlyph(ctx, panelX, height * 0.36, angle, "#ffd38a", "l");
  drawVectorGlyph(ctx, panelX, height * 0.52, -Math.PI / 2, "#8ed4c7", "n");
  drawVectorGlyph(ctx, panelX, height * 0.68, -Math.PI / 10, "#54c6da", "v");

  ctx.fillStyle = "#dce8e5";
  ctx.font = "700 15px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("单位向量输入", panelX - 42, height * 0.24);
  ctx.font = "13px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "#9fb0ad";
  ctx.fillText("n · l 控制受光强度，模型决定颜色响应。", panelX - 42, height * 0.78);

  ui.lightAngleValue.value = `${shadingState.lightAngle}°`;
  ui.surfaceHueValue.value = `${shadingState.surfaceHue}°`;
  ui.highlightStrengthValue.value = `${shadingState.highlightStrength}%`;
  ui.normalDotLight.textContent = formatUnit(ndotl);
  ui.shadingOperation.textContent = operationLabels[shadingState.model];
  ui.shadingModelLabel.textContent = modelLabels[shadingState.model];
}

export function initShadingModelsLab() {
  ui.shadingModel.addEventListener("change", () => {
    shadingState.model = ui.shadingModel.value;
    renderShadingModelLab();
  });
  ui.lightAngle.addEventListener("input", () => {
    shadingState.lightAngle = Number(ui.lightAngle.value);
    renderShadingModelLab();
  });
  ui.surfaceHue.addEventListener("input", () => {
    shadingState.surfaceHue = Number(ui.surfaceHue.value);
    renderShadingModelLab();
  });
  ui.highlightStrength.addEventListener("input", () => {
    shadingState.highlightStrength = Number(ui.highlightStrength.value);
    renderShadingModelLab();
  });

  window.addEventListener("resize", renderShadingModelLab);
  renderShadingModelLab();
}
