import { createPostprocessPass } from "../../render/postprocess.js?v=20260803-7";
import { resizeCanvasToDisplaySize } from "../../render/webgl.js?v=20260803-7";

const representationFragment = `#version 300 es
precision highp float;

uniform float uAngle;
uniform float uDetail;
uniform float uPointSize;
uniform int uSelected;

in vec2 vUv;
out vec4 outColor;

float hash(float value) { return fract(sin(value * 91.173) * 43758.5453); }

float circle(vec2 point, vec2 center, float radius) {
  return 1.0 - smoothstep(radius * 0.82, radius, length(point - center));
}

float box(vec2 point, vec2 halfSize) {
  vec2 delta = abs(point) - halfSize;
  float distanceToBox = length(max(delta, 0.0)) + min(max(delta.x, delta.y), 0.0);
  return 1.0 - smoothstep(-0.012, 0.012, distanceToBox);
}

vec3 meshTree(vec2 point, float angle) {
  vec3 color = vec3(0.0);
  float trunk = box(point - vec2(0.0, -0.48), vec2(0.12, 0.42));
  color += trunk * vec3(0.33, 0.16, 0.07);
  vec2 crownPoint = point - vec2(0.0, 0.18);
  float radiusSquared = dot(crownPoint / vec2(0.64, 0.60), crownPoint / vec2(0.64, 0.60));
  if (radiusSquared < 1.0) {
    float depth = sqrt(max(1.0 - radiusSquared, 0.0));
    vec3 normal = normalize(vec3(crownPoint.x / 0.64, crownPoint.y / 0.60, depth));
    float cosine = cos(angle);
    float sine = sin(angle);
    normal.xz = mat2(cosine, -sine, sine, cosine) * normal.xz;
    float bands = max(3.0, floor(uDetail * 0.45));
    vec3 faceted = normalize(floor(normal * bands + 0.5) / bands);
    float lighting = 0.22 + max(dot(faceted, normalize(vec3(-0.5, 0.8, 0.6))), 0.0) * 0.92;
    float wireA = 1.0 - smoothstep(0.02, 0.06, abs(fract((crownPoint.x + crownPoint.y) * bands) - 0.5));
    float wireB = 1.0 - smoothstep(0.02, 0.06, abs(fract((crownPoint.x - crownPoint.y) * bands) - 0.5));
    color = mix(vec3(0.025, 0.12, 0.08), vec3(0.10, 0.73, 0.44) * lighting, 1.0 - max(wireA, wireB) * 0.45);
  }
  return color;
}

vec3 billboardTree(vec2 point, float angle) {
  float widthScale = max(0.07, abs(cos(angle)));
  vec2 spritePoint = vec2(point.x / widthScale, point.y);
  float trunk = box(spritePoint - vec2(0.0, -0.48), vec2(0.12, 0.42));
  float crown = circle(spritePoint, vec2(0.0, 0.18), 0.63);
  float edge = exp(-abs(point.x) * 48.0) * (1.0 - smoothstep(0.88, 0.96, abs(point.y)));
  vec3 sprite = trunk * vec3(0.32, 0.14, 0.05);
  sprite = mix(sprite, vec3(0.06, 0.62, 0.38) * (0.72 + spritePoint.y * 0.18), crown);
  return sprite + edge * vec3(0.18, 0.95, 0.78) * step(widthScale, 0.24);
}

vec3 particleTree(vec2 point) {
  vec3 color = vec3(0.0);
  float coverage = 0.0;
  float count = min(48.0, uDetail * 2.0 + 6.0);
  for (int index = 0; index < 48; index += 1) {
    float enabled = 1.0 - step(count, float(index));
    float seed = float(index) + 1.0;
    float radius = sqrt(hash(seed * 1.7)) * 0.58;
    float theta = hash(seed * 2.9) * 6.2831853;
    vec2 center = vec2(cos(theta) * radius, sin(theta) * radius * 0.88) + vec2(0.0, 0.18);
    float particle = circle(point, center, (0.055 + hash(seed * 5.1) * 0.055) * uPointSize) * enabled;
    vec3 particleColor = mix(vec3(0.08, 0.50, 0.28), vec3(0.28, 0.90, 0.55), hash(seed * 7.3));
    color += particleColor * particle * (1.0 - coverage * 0.48);
    coverage = clamp(coverage + particle * 0.42, 0.0, 1.0);
  }
  float trunk = box(point - vec2(0.0, -0.48), vec2(0.085, 0.40));
  return mix(color, vec3(0.35, 0.17, 0.07), trunk);
}

vec3 pointTree(vec2 point, float angle) {
  float detail = max(4.0, floor(uDetail));
  vec2 crownPoint = point - vec2(0.0, 0.18);
  float normalizedRadius = length(crownPoint / vec2(0.64, 0.60));
  float depth = sqrt(max(1.0 - normalizedRadius * normalizedRadius, 0.0));
  vec2 warped = point;
  warped.x -= sin(angle) * depth * 0.28;
  vec2 cell = fract((warped + 1.1) * detail * 0.56) - 0.5;
  float dotMask = 1.0 - smoothstep(0.10 * uPointSize, 0.20 * uPointSize, length(cell));
  float crown = step(normalizedRadius, 1.0) * dotMask;
  float trunkRegion = box(point - vec2(0.0, -0.48), vec2(0.12, 0.42));
  float trunkDots = trunkRegion * dotMask;
  vec3 color = crown * mix(vec3(0.06, 0.38, 0.78), vec3(0.30, 0.92, 0.77), depth);
  color += trunkDots * vec3(0.56, 0.34, 0.16);
  return color;
}

void main() {
  float panelCoordinate = min(floor(vUv.x * 4.0), 3.0);
  int panel = int(panelCoordinate);
  vec2 point = vec2(fract(vUv.x * 4.0) * 2.0 - 1.0, vUv.y * 2.0 - 1.0);
  point.x *= 0.92;
  float angle = radians(uAngle);

  vec3 background = mix(vec3(0.014, 0.025, 0.029), vec3(0.035, 0.075, 0.083), vUv.y);
  float floorLine = 1.0 - smoothstep(0.0, 0.018, abs(point.y + 0.89));
  background += floorLine * vec3(0.08, 0.24, 0.22);
  vec3 objectColor;
  if (panel == 0) objectColor = meshTree(point, angle);
  else if (panel == 1) objectColor = billboardTree(point, angle);
  else if (panel == 2) objectColor = particleTree(point);
  else objectColor = pointTree(point, angle);

  float selected = uSelected < 0 || panel == uSelected ? 1.0 : 0.24;
  vec3 color = background + objectColor * selected;
  float divider = 1.0 - smoothstep(0.0, 0.004, abs(fract(vUv.x * 4.0)));
  color += divider * vec3(0.13, 0.20, 0.20);
  outColor = vec4(pow(max(color, vec3(0.0)), vec3(1.0 / 2.2)), 1.0);
}`;

const state = { angle: 28, detail: 14, mode: "all", pointSize: 62 };
const ui = {
  angle: document.querySelector("#representationAngle"), angleValue: document.querySelector("#representationAngleValue"),
  canvas: document.querySelector("#representationCanvas"), detail: document.querySelector("#representationDetail"),
  detailValue: document.querySelector("#representationDetailValue"), guide: [...document.querySelectorAll(".representation-guide [data-representation]")],
  mode: document.querySelector("#representationMode"), name: document.querySelector("#representationName"),
  particles: document.querySelector("#representationParticles"), pointSize: document.querySelector("#representationPointSize"),
  pointSizeValue: document.querySelector("#representationPointSizeValue"), points: document.querySelector("#representationPoints"),
  section: document.querySelector("#scene-representations"), triangles: document.querySelector("#representationTriangles"),
};

class RepresentationRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2", { alpha: false, antialias: false, preserveDrawingBuffer: true });
    if (!this.gl) throw new Error("当前浏览器不支持 WebGL2。");
    this.pass = createPostprocessPass(this.gl, representationFragment);
    this.locations = {
      angle: this.gl.getUniformLocation(this.pass.program, "uAngle"), detail: this.gl.getUniformLocation(this.pass.program, "uDetail"),
      pointSize: this.gl.getUniformLocation(this.pass.program, "uPointSize"), selected: this.gl.getUniformLocation(this.pass.program, "uSelected"),
    };
  }
  render(nextState) {
    const gl = this.gl;
    const { width, height } = resizeCanvasToDisplaySize(this.canvas);
    this.pass.draw({ configure: () => {
      gl.uniform1f(this.locations.angle, nextState.angle); gl.uniform1f(this.locations.detail, nextState.detail);
      gl.uniform1f(this.locations.pointSize, nextState.pointSize / 100);
      gl.uniform1i(this.locations.selected, { all: -1, mesh: 0, billboard: 1, particles: 2, points: 3 }[nextState.mode]);
    }, height, width });
  }
}

function showWebglError(message) {
  ui.section?.classList.add("is-unavailable");
  const fallback = document.createElement("p"); fallback.className = "webgl-fallback";
  fallback.textContent = `场景表示实验无法启动：${message}`; ui.canvas?.closest(".viewport-panel")?.prepend(fallback);
}

export function initSceneRepresentationsLab() {
  if (!ui.canvas || !ui.mode) return;
  let renderer; try { renderer = new RepresentationRenderer(ui.canvas); } catch (error) { showWebglError(error.message); return; }
  let frame = 0;
  const render = () => {
    frame = 0; renderer.render(state);
    const names = { all: "并排比较", billboard: "广告牌", mesh: "三角形网格", particles: "粒子", points: "点云" };
    ui.detailValue.value = `${state.detail} 级`; ui.angleValue.value = `${state.angle}°`;
    ui.pointSizeValue.value = `${(state.pointSize / 100).toFixed(2)}×`; ui.name.textContent = names[state.mode];
    ui.triangles.textContent = `${(state.detail * state.detail * 2).toLocaleString("zh-CN")} 三角形`;
    ui.particles.textContent = `${Math.min(48, state.detail * 2 + 6)} 粒子`;
    ui.points.textContent = `${(state.detail * state.detail).toLocaleString("zh-CN")} 点`;
    ui.guide.forEach((item) => item.classList.toggle("is-active", state.mode === "all" || item.dataset.representation === state.mode));
  };
  const schedule = () => { if (!frame) frame = window.requestAnimationFrame(render); };
  [[ui.mode, "change", "mode", String], [ui.detail, "input", "detail", Number], [ui.angle, "input", "angle", Number], [ui.pointSize, "input", "pointSize", Number]].forEach(([element, eventName, key, convert]) => {
    element.addEventListener(eventName, () => { state[key] = convert(element.value); schedule(); });
  });
  window.addEventListener("resize", schedule); render();
}
