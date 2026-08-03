import { createFullscreenTriangle } from "../../render/mesh.js?v=20260803-2";
import { createProgram, resizeCanvasToDisplaySize } from "../../render/webgl.js?v=20260803-2";

const vertexSource = `#version 300 es
in vec2 position;
out vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentSource = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform vec2 uProbe;
uniform float uGridColumns;
uniform float uSampleOffset;
uniform float uSkew;
uniform int uMode;

in vec2 vUv;
out vec4 outColor;

float cross2(vec2 a, vec2 b) {
  return a.x * b.y - a.y * b.x;
}

vec3 barycentric(vec2 point, vec2 a, vec2 b, vec2 c) {
  float area = cross2(b - a, c - a);
  return vec3(
    cross2(b - point, c - point),
    cross2(c - point, a - point),
    cross2(a - point, b - point)
  ) / area;
}

vec3 attributePalette(float value) {
  vec3 cool = vec3(0.10, 0.25, 0.34);
  vec3 middle = vec3(0.20, 0.76, 0.65);
  vec3 warm = vec3(1.00, 0.68, 0.30);
  return value < 0.5
    ? mix(cool, middle, value * 2.0)
    : mix(middle, warm, (value - 0.5) * 2.0);
}

void main() {
  vec2 a = vec2(0.16, 0.17);
  vec2 b = vec2(0.84, 0.22);
  vec2 c = vec2(0.50 + uSkew * 0.22, 0.84);
  float rows = max(8.0, round(uGridColumns * uResolution.y / max(uResolution.x, 1.0)));
  vec2 cells = vec2(uGridColumns, rows);
  vec2 samplePoint = (floor(vUv * cells) + vec2(uSampleOffset)) / cells;
  vec2 point = uMode == 2 ? samplePoint : vUv;
  vec3 weights = barycentric(point, a, b, c);
  float nearestEdge = min(weights.x, min(weights.y, weights.z));
  float edgeWidth = max(fwidth(nearestEdge) * 1.35, 0.0015);
  float inside = smoothstep(-edgeWidth, edgeWidth, nearestEdge);

  vec3 background = mix(vec3(0.025, 0.043, 0.046), vec3(0.045, 0.074, 0.076), vUv.y);
  vec3 color = background;

  if (uMode == 0) {
    vec3 barycentricColor =
      weights.x * vec3(0.96, 0.32, 0.28) +
      weights.y * vec3(0.30, 0.86, 0.50) +
      weights.z * vec3(0.24, 0.82, 0.88);
    color = mix(background, barycentricColor, inside * 0.94);
  } else if (uMode == 1) {
    float interpolatedValue = dot(weights, vec3(0.08, 0.55, 1.0));
    vec3 interpolated = attributePalette(clamp(interpolatedValue, 0.0, 1.0));
    float contour = 1.0 - smoothstep(0.025, 0.065, abs(fract(interpolatedValue * 8.0) - 0.5));
    interpolated += contour * 0.12;
    color = mix(background, interpolated, inside * 0.96);
  } else {
    bool covered = all(greaterThanEqual(weights, vec3(0.0)));
    vec3 cellColor = covered ? vec3(0.20, 0.73, 0.61) : vec3(0.055, 0.082, 0.084);
    color = mix(background, cellColor, 0.84);
    vec2 cellPosition = fract(vUv * cells);
    float gridLine = 1.0 - smoothstep(0.0, 0.065, min(cellPosition.x, cellPosition.y));
    color = mix(color, vec3(0.30, 0.42, 0.41), gridLine * 0.45);
    vec2 sampleDelta = (cellPosition - vec2(uSampleOffset)) * vec2(uResolution.x / cells.x, uResolution.y / cells.y);
    float sampleDot = 1.0 - smoothstep(1.2, 2.5, length(sampleDelta));
    color = mix(color, covered ? vec3(0.94, 1.0, 0.94) : vec3(0.55, 0.62, 0.61), sampleDot);
  }

  float edgeBand = 1.0 - smoothstep(0.0, edgeWidth * 2.2, abs(nearestEdge));
  color = mix(color, vec3(0.91, 1.0, 0.97), edgeBand * 0.78);

  vec2 probePixels = (vUv - uProbe) * uResolution;
  float probeRing = 1.0 - smoothstep(1.5, 2.8, abs(length(probePixels) - 9.0));
  float probeCross = max(
    (1.0 - smoothstep(0.7, 1.6, abs(probePixels.x))) * step(abs(probePixels.y), 14.0),
    (1.0 - smoothstep(0.7, 1.6, abs(probePixels.y))) * step(abs(probePixels.x), 14.0)
  );
  color = mix(color, vec3(1.0, 0.82, 0.38), max(probeRing, probeCross));

  outColor = vec4(pow(max(color, vec3(0.0)), vec3(1.0 / 2.2)), 1.0);
}`;

const state = {
  grid: 32,
  mode: "weights",
  probe: [0.5, 0.48],
  sample: 50,
  skew: 22,
};

const ui = {
  attribute: document.querySelector("#rasterAttribute"),
  canvas: document.querySelector("#barycentricCanvas"),
  coverage: document.querySelector("#rasterCoverage"),
  grid: document.querySelector("#rasterGrid"),
  gridValue: document.querySelector("#rasterGridValue"),
  mode: document.querySelector("#rasterMode"),
  sample: document.querySelector("#rasterSample"),
  sampleValue: document.querySelector("#rasterSampleValue"),
  section: document.querySelector("#barycentric-rasterization"),
  skew: document.querySelector("#rasterSkew"),
  skewValue: document.querySelector("#rasterSkewValue"),
  weights: document.querySelector("#rasterWeights"),
};

function getTriangle() {
  return [
    [0.16, 0.17],
    [0.84, 0.22],
    [0.5 + (state.skew / 100) * 0.22, 0.84],
  ];
}

function cross2(a, b) {
  return a[0] * b[1] - a[1] * b[0];
}

function getBarycentric(point) {
  const [a, b, c] = getTriangle();
  const area = cross2([b[0] - a[0], b[1] - a[1]], [c[0] - a[0], c[1] - a[1]]);
  return [
    cross2([b[0] - point[0], b[1] - point[1]], [c[0] - point[0], c[1] - point[1]]) / area,
    cross2([c[0] - point[0], c[1] - point[1]], [a[0] - point[0], a[1] - point[1]]) / area,
    cross2([a[0] - point[0], a[1] - point[1]], [b[0] - point[0], b[1] - point[1]]) / area,
  ];
}

class BarycentricRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2", { alpha: false, antialias: true, preserveDrawingBuffer: true });
    if (!this.gl) {
      throw new Error("当前浏览器不支持 WebGL2。");
    }

    const gl = this.gl;
    this.program = createProgram(gl, vertexSource, fragmentSource);
    this.locations = {
      grid: gl.getUniformLocation(this.program, "uGridColumns"),
      mode: gl.getUniformLocation(this.program, "uMode"),
      position: gl.getAttribLocation(this.program, "position"),
      probe: gl.getUniformLocation(this.program, "uProbe"),
      resolution: gl.getUniformLocation(this.program, "uResolution"),
      sample: gl.getUniformLocation(this.program, "uSampleOffset"),
      skew: gl.getUniformLocation(this.program, "uSkew"),
    };
    this.mesh = createFullscreenTriangle(gl, this.locations.position);
  }

  render(nextState) {
    const gl = this.gl;
    const { width, height } = resizeCanvasToDisplaySize(this.canvas);
    const modeIndex = { weights: 0, interpolation: 1, coverage: 2 }[nextState.mode];
    gl.viewport(0, 0, width, height);
    gl.useProgram(this.program);
    gl.uniform2f(this.locations.resolution, width, height);
    gl.uniform2f(this.locations.probe, nextState.probe[0], nextState.probe[1]);
    gl.uniform1f(this.locations.grid, nextState.grid);
    gl.uniform1f(this.locations.sample, nextState.sample / 100);
    gl.uniform1f(this.locations.skew, nextState.skew / 100);
    gl.uniform1i(this.locations.mode, modeIndex);
    this.mesh.draw();
  }
}

function showWebglError(message) {
  ui.section?.classList.add("is-unavailable");
  const fallback = document.createElement("p");
  fallback.className = "webgl-fallback";
  fallback.textContent = `光栅化实验无法启动：${message}`;
  ui.canvas?.closest(".viewport-panel")?.prepend(fallback);
}

function formatSigned(value) {
  return `${value >= 0 ? "+" : ""}${value}%`;
}

export function initBarycentricRasterizationLab() {
  if (!ui.canvas || !ui.mode) {
    return;
  }

  let renderer;
  try {
    renderer = new BarycentricRenderer(ui.canvas);
  } catch (error) {
    showWebglError(error.message);
    return;
  }

  let frame = 0;
  const render = () => {
    frame = 0;
    renderer.render(state);
    const weights = getBarycentric(state.probe);
    const inside = weights.every((weight) => weight >= 0);
    const attribute = weights[0] * 0.08 + weights[1] * 0.55 + weights[2];
    ui.weights.textContent = `λ = (${weights.map((weight) => weight.toFixed(2)).join(", ")})`;
    ui.attribute.textContent = attribute.toFixed(2);
    ui.coverage.textContent = inside ? "三条边函数均 ≥ 0" : "至少一条边函数 < 0";
    ui.coverage.classList.toggle("is-warning", !inside);
    ui.gridValue.value = `${state.grid} 列`;
    ui.sampleValue.value = `(${(state.sample / 100).toFixed(2)}, ${(state.sample / 100).toFixed(2)})`;
    ui.skewValue.value = formatSigned(state.skew);
  };
  const scheduleRender = () => {
    if (!frame) {
      frame = window.requestAnimationFrame(render);
    }
  };

  ui.mode.addEventListener("change", () => {
    state.mode = ui.mode.value;
    scheduleRender();
  });
  ui.skew.addEventListener("input", () => {
    state.skew = Number(ui.skew.value);
    scheduleRender();
  });
  ui.grid.addEventListener("input", () => {
    state.grid = Number(ui.grid.value);
    scheduleRender();
  });
  ui.sample.addEventListener("input", () => {
    state.sample = Number(ui.sample.value);
    scheduleRender();
  });

  const updateProbe = (event) => {
    const rect = ui.canvas.getBoundingClientRect();
    state.probe = [
      Math.min(1, Math.max(0, (event.clientX - rect.left) / Math.max(rect.width, 1))),
      Math.min(1, Math.max(0, 1 - (event.clientY - rect.top) / Math.max(rect.height, 1))),
    ];
    scheduleRender();
  };
  ui.canvas.addEventListener("pointermove", updateProbe);
  ui.canvas.addEventListener("pointerdown", updateProbe);

  window.addEventListener("resize", scheduleRender);
  render();
}
