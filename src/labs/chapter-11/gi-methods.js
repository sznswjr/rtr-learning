import { createPostprocessPass } from "../../render/postprocess.js?v=20260803-4";
import { resizeCanvasToDisplaySize } from "../../render/webgl.js?v=20260803-4";

const giFragment = `#version 300 es
precision highp float;

uniform float uAoRadius;
uniform float uProbeStrength;
uniform float uBounceStrength;
uniform float uLightAngle;
uniform int uMode;

in vec2 vUv;
out vec4 outColor;

const vec3 centers[3] = vec3[3](
  vec3(-1.05, 0.64, 0.10),
  vec3(0.28, 0.48, -0.35),
  vec3(1.18, 0.76, -0.92)
);
const float radii[3] = float[3](0.64, 0.48, 0.76);
const vec3 colors[3] = vec3[3](
  vec3(0.10, 0.72, 0.61),
  vec3(0.94, 0.28, 0.15),
  vec3(0.18, 0.36, 0.92)
);

float sphereHit(vec3 origin, vec3 direction, vec3 center, float radius) {
  vec3 offset = origin - center;
  float halfB = dot(offset, direction);
  float c = dot(offset, offset) - radius * radius;
  float discriminant = halfB * halfB - c;
  if (discriminant < 0.0) return -1.0;
  float root = sqrt(discriminant);
  float nearT = -halfB - root;
  return nearT > 0.001 ? nearT : -halfB + root;
}

bool sphereOccluded(vec3 origin, vec3 direction, int ignored) {
  for (int index = 0; index < 3; index += 1) {
    if (index == ignored) continue;
    if (sphereHit(origin, direction, centers[index], radii[index]) > 0.0) return true;
  }
  return false;
}

vec3 acesApprox(vec3 color) {
  return clamp((color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec2 point = vUv * 2.0 - 1.0;
  point.x *= 1.62;
  vec3 origin = vec3(0.0, 1.38, 4.7);
  vec3 direction = normalize(vec3(point.x * 0.92, point.y * 0.68 - 0.22, -1.65));

  float bestT = 1e5;
  int hitId = -1;
  for (int index = 0; index < 3; index += 1) {
    float candidate = sphereHit(origin, direction, centers[index], radii[index]);
    if (candidate > 0.0 && candidate < bestT) {
      bestT = candidate;
      hitId = index;
    }
  }

  int surface = -1;
  if (direction.y < -0.001) {
    float floorT = -origin.y / direction.y;
    vec3 floorPoint = origin + direction * floorT;
    if (floorT > 0.0 && floorT < bestT && floorPoint.z > -2.65) {
      bestT = floorT;
      surface = 0;
      hitId = -1;
    }
  }
  if (direction.z < -0.001) {
    float wallT = (-2.65 - origin.z) / direction.z;
    vec3 wallPoint = origin + direction * wallT;
    if (wallT > 0.0 && wallT < bestT && wallPoint.y > 0.0) {
      bestT = wallT;
      surface = 1;
      hitId = -1;
    }
  }

  if (bestT == 1e5) {
    vec3 sky = mix(vec3(0.012, 0.025, 0.04), vec3(0.12, 0.22, 0.30), max(direction.y, 0.0));
    outColor = vec4(pow(sky, vec3(1.0 / 2.2)), 1.0);
    return;
  }

  vec3 position = origin + direction * bestT;
  vec3 normal;
  vec3 baseColor;
  if (hitId >= 0) {
    normal = normalize(position - centers[hitId]);
    baseColor = colors[hitId];
  } else if (surface == 0) {
    normal = vec3(0.0, 1.0, 0.0);
    float checker = mod(floor(position.x * 1.35) + floor(position.z * 1.35), 2.0);
    baseColor = mix(vec3(0.14, 0.17, 0.18), vec3(0.23, 0.26, 0.25), checker);
  } else {
    normal = vec3(0.0, 0.0, 1.0);
    baseColor = mix(vec3(0.20, 0.22, 0.23), vec3(0.11, 0.15, 0.17), smoothstep(0.0, 2.4, position.y));
  }

  float angle = radians(uLightAngle);
  vec3 lightDirection = normalize(vec3(sin(angle), 1.25, cos(angle) * 0.55));
  float visibility = sphereOccluded(position + normal * 0.015, lightDirection, hitId) ? 0.04 : 1.0;
  float nDotL = max(dot(normal, lightDirection), 0.0);
  vec3 halfVector = normalize(lightDirection - direction);
  float specular = pow(max(dot(normal, halfVector), 0.0), 48.0) * visibility;
  vec3 direct = baseColor * (0.025 + nDotL * visibility * 1.7) + specular * vec3(1.5, 1.35, 1.1);

  float occlusion = 0.0;
  for (int index = 0; index < 3; index += 1) {
    if (index == hitId) continue;
    vec3 toward = centers[index] - position;
    float gap = max(length(toward) - radii[index], 0.0);
    float facing = max(dot(normal, normalize(toward)), 0.0);
    occlusion += facing * max(0.0, 1.0 - gap / max(uAoRadius, 0.05));
  }
  if (surface != 0) {
    occlusion += max(0.0, 1.0 - position.y / max(uAoRadius, 0.05)) * max(0.0, -normal.y + 0.3);
  } else {
    for (int index = 0; index < 3; index += 1) {
      float gap = max(length(position.xz - centers[index].xz) - radii[index], 0.0);
      occlusion += max(0.0, 1.0 - gap / max(uAoRadius, 0.05)) * 0.34;
    }
  }
  float ao = clamp(1.0 - occlusion * 0.58, 0.13, 1.0);

  vec3 probeSky = mix(vec3(0.12, 0.20, 0.34), vec3(0.52, 0.68, 0.72), normal.y * 0.5 + 0.5);
  vec3 probeWarm = vec3(0.44, 0.19, 0.08) * max(0.0, 1.0 - abs(position.x + 1.1) * 0.35);
  vec3 probe = baseColor * (probeSky + probeWarm * 0.28) * uProbeStrength;

  vec3 bounce = vec3(0.0);
  for (int index = 0; index < 3; index += 1) {
    vec3 toward = centers[index] - position;
    float distanceSquared = max(dot(toward, toward), 0.3);
    float facing = max(dot(normal, normalize(toward)), 0.0);
    bounce += colors[index] * facing / distanceSquared;
  }
  bounce += vec3(0.13, 0.055, 0.025) * max(0.0, 1.0 - position.y * 0.55);
  bounce *= baseColor * uBounceStrength * 0.78;

  vec3 result = direct * ao + probe + bounce;
  if (uMode == 1) result = direct;
  if (uMode == 2) result = vec3(ao);
  if (uMode == 3) result = probe;
  if (uMode == 4) result = bounce * 2.2;
  result = acesApprox(result);
  result = pow(max(result, vec3(0.0)), vec3(1.0 / 2.2));
  outColor = vec4(result, 1.0);
}`;

const state = { aoRadius: 80, bounce: 95, lightAngle: 28, mode: "combined", probe: 85 };

const ui = {
  aoRadius: document.querySelector("#giAoRadius"),
  aoRadiusValue: document.querySelector("#giAoRadiusValue"),
  bounce: document.querySelector("#giBounce"),
  bounceEnergy: document.querySelector("#giBounceEnergy"),
  bounceValue: document.querySelector("#giBounceValue"),
  canvas: document.querySelector("#giCanvas"),
  contribution: document.querySelector("#giContribution"),
  lightAngle: document.querySelector("#giLightAngle"),
  lightAngleValue: document.querySelector("#giLightAngleValue"),
  mode: document.querySelector("#giMode"),
  probe: document.querySelector("#giProbe"),
  probeValue: document.querySelector("#giProbeValue"),
  section: document.querySelector("#gi-methods"),
  strip: [...document.querySelectorAll(".gi-contribution-strip [data-mode]")],
};

class GiRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2", { alpha: false, antialias: false, preserveDrawingBuffer: true });
    if (!this.gl) throw new Error("当前浏览器不支持 WebGL2。");
    this.pass = createPostprocessPass(this.gl, giFragment);
    this.locations = {
      aoRadius: this.gl.getUniformLocation(this.pass.program, "uAoRadius"),
      bounce: this.gl.getUniformLocation(this.pass.program, "uBounceStrength"),
      lightAngle: this.gl.getUniformLocation(this.pass.program, "uLightAngle"),
      mode: this.gl.getUniformLocation(this.pass.program, "uMode"),
      probe: this.gl.getUniformLocation(this.pass.program, "uProbeStrength"),
    };
  }

  render(nextState) {
    const gl = this.gl;
    const { width, height } = resizeCanvasToDisplaySize(this.canvas);
    this.pass.draw({
      configure: () => {
        gl.uniform1f(this.locations.aoRadius, nextState.aoRadius / 100);
        gl.uniform1f(this.locations.probe, nextState.probe / 100);
        gl.uniform1f(this.locations.bounce, nextState.bounce / 100);
        gl.uniform1f(this.locations.lightAngle, nextState.lightAngle);
        gl.uniform1i(this.locations.mode, { combined: 0, direct: 1, ao: 2, probe: 3, bounce: 4 }[nextState.mode]);
      },
      height,
      width,
    });
  }
}

function showWebglError(message) {
  ui.section?.classList.add("is-unavailable");
  const fallback = document.createElement("p");
  fallback.className = "webgl-fallback";
  fallback.textContent = `GI 实验无法启动：${message}`;
  ui.canvas?.closest(".viewport-panel")?.prepend(fallback);
}

export function initGiMethodsLab() {
  if (!ui.canvas || !ui.mode) return;
  let renderer;
  try { renderer = new GiRenderer(ui.canvas); } catch (error) { showWebglError(error.message); return; }

  let frame = 0;
  const render = () => {
    frame = 0;
    renderer.render(state);
    const names = { ao: "环境光遮蔽", bounce: "反弹光", combined: "完整照明", direct: "直接光", probe: "光照探针" };
    ui.aoRadiusValue.value = `${(state.aoRadius / 100).toFixed(2)} m`;
    ui.probeValue.value = `${(state.probe / 100).toFixed(2)}×`;
    ui.bounceValue.value = `${(state.bounce / 100).toFixed(2)}×`;
    ui.lightAngleValue.value = `${state.lightAngle}°`;
    ui.contribution.textContent = names[state.mode];
    ui.bounceEnergy.textContent = `${(state.bounce * 0.002).toFixed(2)} 相对能量`;
    ui.strip.forEach((item) => item.classList.toggle("is-active", state.mode === "combined" || item.dataset.mode === state.mode));
  };
  const schedule = () => { if (!frame) frame = window.requestAnimationFrame(render); };
  [[ui.mode, "change", "mode", String], [ui.aoRadius, "input", "aoRadius", Number], [ui.probe, "input", "probe", Number], [ui.bounce, "input", "bounce", Number], [ui.lightAngle, "input", "lightAngle", Number]].forEach(([element, eventName, key, convert]) => {
    element.addEventListener(eventName, () => { state[key] = convert(element.value); schedule(); });
  });
  window.addEventListener("resize", schedule);
  render();
}
