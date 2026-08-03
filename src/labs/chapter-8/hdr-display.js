import { createColorTarget } from "../../render/framebuffer.js?v=20260803-7";
import { createPostprocessPass } from "../../render/postprocess.js?v=20260803-7";
import { resizeCanvasToDisplaySize } from "../../render/webgl.js?v=20260803-7";

const hdrSceneFragment = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

float disk(vec2 point, vec2 center, float radius) {
  return 1.0 - smoothstep(radius * 0.7, radius, length(point - center));
}

void main() {
  vec2 uv = vUv;
  vec3 color = mix(vec3(0.006, 0.012, 0.018), vec3(0.07, 0.11, 0.13), pow(uv.y, 1.8));
  float horizon = exp(-pow((uv.y - 0.34) * 7.5, 2.0));
  color += horizon * vec3(0.22, 0.36, 0.42);

  float warmLight = disk(uv, vec2(0.23, 0.62), 0.135);
  float coolLight = disk(uv, vec2(0.76, 0.67), 0.10);
  float core = disk(uv, vec2(0.76, 0.67), 0.038);
  color += warmLight * vec3(8.0, 3.0, 0.7);
  color += coolLight * vec3(1.8, 5.5, 12.0);
  color += core * vec3(12.0, 20.0, 28.0);

  vec2 floorUv = vec2((uv.x - 0.5) / max(uv.y + 0.05, 0.08), 1.0 / max(uv.y + 0.05, 0.08));
  float floorGrid = max(
    1.0 - smoothstep(0.0, 0.055, abs(fract(floorUv.x * 2.0) - 0.5)),
    1.0 - smoothstep(0.0, 0.055, abs(fract(floorUv.y * 0.22) - 0.5))
  );
  color += floorGrid * step(uv.y, 0.36) * vec3(0.22, 0.38, 0.40);

  float pedestal = step(0.41, uv.x) * step(uv.x, 0.59) * step(0.18, uv.y) * step(uv.y, 0.52);
  vec3 pedestalColor = mix(vec3(0.055, 0.075, 0.078), vec3(0.52, 0.58, 0.56), uv.y);
  color = mix(color, pedestalColor, pedestal);
  float rim = (1.0 - smoothstep(0.0, 0.018, abs(uv.x - 0.41))) + (1.0 - smoothstep(0.0, 0.018, abs(uv.x - 0.59)));
  color += rim * pedestal * vec3(1.5, 1.0, 0.5);
  outColor = vec4(color, 1.0);
}`;

const displayFragment = `#version 300 es
precision highp float;

uniform sampler2D uSource;
uniform float uExposure;
uniform float uWhitePoint;
uniform int uToneMap;
uniform int uTransfer;
uniform int uView;

in vec2 vUv;
out vec4 outColor;

vec3 acesApprox(vec3 color) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
}

vec3 falseColor(float luminance) {
  float stop = clamp((log2(max(luminance, 0.0001)) + 8.0) / 15.0, 0.0, 1.0);
  vec3 cold = vec3(0.04, 0.08, 0.28);
  vec3 cyan = vec3(0.02, 0.78, 0.84);
  vec3 yellow = vec3(1.0, 0.78, 0.12);
  vec3 hot = vec3(1.0, 0.17, 0.06);
  if (stop < 0.38) return mix(cold, cyan, stop / 0.38);
  if (stop < 0.72) return mix(cyan, yellow, (stop - 0.38) / 0.34);
  return mix(yellow, hot, (stop - 0.72) / 0.28);
}

void main() {
  vec3 hdr = texture(uSource, vUv).rgb * uExposure;
  float luminance = dot(hdr, vec3(0.2126, 0.7152, 0.0722));
  if (uView == 1) {
    outColor = vec4(falseColor(luminance), 1.0);
    return;
  }

  vec3 normalized = hdr / max(uWhitePoint, 0.001);
  vec3 mapped;
  if (uToneMap == 0) {
    mapped = clamp(normalized, 0.0, 1.0);
  } else if (uToneMap == 1) {
    mapped = normalized / (1.0 + normalized);
  } else {
    mapped = acesApprox(normalized);
  }
  if (uTransfer == 1) {
    mapped = pow(max(mapped, vec3(0.0)), vec3(1.0 / 2.2));
  }
  outColor = vec4(mapped, 1.0);
}`;

const state = {
  exposure: 0,
  toneMap: "aces",
  transfer: "srgb",
  view: "final",
  whitePoint: 800,
};

const ui = {
  canvas: document.querySelector("#hdrDisplayCanvas"),
  exposure: document.querySelector("#hdrExposure"),
  exposureValue: document.querySelector("#hdrExposureValue"),
  middleGray: document.querySelector("#hdrMiddleGray"),
  multiplier: document.querySelector("#hdrMultiplier"),
  outputCode: document.querySelector("#hdrOutputCode"),
  section: document.querySelector("#hdr-display"),
  toneMap: document.querySelector("#hdrToneMap"),
  transfer: document.querySelector("#hdrTransfer"),
  view: document.querySelector("#hdrView"),
  whitePoint: document.querySelector("#hdrWhitePoint"),
  whitePointValue: document.querySelector("#hdrWhitePointValue"),
};

function toneMapValue(value, mode) {
  if (mode === "clip") {
    return Math.min(1, Math.max(0, value));
  }
  if (mode === "reinhard") {
    return value / (1 + value);
  }
  const numerator = value * (2.51 * value + 0.03);
  const denominator = value * (2.43 * value + 0.59) + 0.14;
  return Math.min(1, Math.max(0, numerator / denominator));
}

class HdrRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2", { alpha: false, antialias: false, preserveDrawingBuffer: true });
    if (!this.gl) {
      throw new Error("当前浏览器不支持 WebGL2。");
    }
    if (!this.gl.getExtension("EXT_color_buffer_float")) {
      throw new Error("当前浏览器缺少 EXT_color_buffer_float。");
    }

    const gl = this.gl;
    this.hdrTarget = createColorTarget(gl, {
      depth: false,
      filter: gl.NEAREST,
      format: gl.RGBA,
      height: 1,
      internalFormat: gl.RGBA16F,
      label: "HDR scene",
      type: gl.HALF_FLOAT,
      width: 1,
    });
    this.scenePass = createPostprocessPass(gl, hdrSceneFragment);
    this.displayPass = createPostprocessPass(gl, displayFragment);
    this.locations = {
      exposure: gl.getUniformLocation(this.displayPass.program, "uExposure"),
      toneMap: gl.getUniformLocation(this.displayPass.program, "uToneMap"),
      transfer: gl.getUniformLocation(this.displayPass.program, "uTransfer"),
      view: gl.getUniformLocation(this.displayPass.program, "uView"),
      whitePoint: gl.getUniformLocation(this.displayPass.program, "uWhitePoint"),
    };
  }

  render(nextState) {
    const gl = this.gl;
    const { width, height } = resizeCanvasToDisplaySize(this.canvas);
    if (this.hdrTarget.width !== width || this.hdrTarget.height !== height) {
      this.hdrTarget.resize(width, height);
    }
    gl.disable(gl.DEPTH_TEST);
    this.scenePass.draw({ framebuffer: this.hdrTarget.framebuffer, height, width });
    this.displayPass.draw({
      configure: () => {
        gl.uniform1f(this.locations.exposure, 2 ** (nextState.exposure / 4));
        gl.uniform1f(this.locations.whitePoint, nextState.whitePoint / 100);
        gl.uniform1i(this.locations.toneMap, { clip: 0, reinhard: 1, aces: 2 }[nextState.toneMap]);
        gl.uniform1i(this.locations.transfer, nextState.transfer === "srgb" ? 1 : 0);
        gl.uniform1i(this.locations.view, nextState.view === "false-color" ? 1 : 0);
      },
      height,
      texture: this.hdrTarget.color,
      width,
    });
  }
}

function showWebglError(message) {
  ui.section?.classList.add("is-unavailable");
  const fallback = document.createElement("p");
  fallback.className = "webgl-fallback";
  fallback.textContent = `HDR 实验无法启动：${message}`;
  ui.canvas?.closest(".viewport-panel")?.prepend(fallback);
}

export function initHdrDisplayLab() {
  if (!ui.canvas || !ui.toneMap) {
    return;
  }

  let renderer;
  try {
    renderer = new HdrRenderer(ui.canvas);
  } catch (error) {
    showWebglError(error.message);
    return;
  }

  let frame = 0;
  const render = () => {
    frame = 0;
    renderer.render(state);
    const ev = state.exposure / 4;
    const multiplier = 2 ** ev;
    const middleGray = 0.18 * multiplier;
    const normalized = middleGray / (state.whitePoint / 100);
    let output = toneMapValue(normalized, state.toneMap);
    if (state.transfer === "srgb") {
      output = output ** (1 / 2.2);
    }
    ui.exposureValue.value = `${ev >= 0 ? "+" : ""}${ev.toFixed(2)} EV`;
    ui.whitePointValue.value = (state.whitePoint / 100).toFixed(1);
    ui.multiplier.textContent = `× ${multiplier.toFixed(2)}`;
    ui.middleGray.textContent = middleGray.toFixed(3);
    ui.outputCode.textContent = output.toFixed(3);
  };
  const scheduleRender = () => {
    if (!frame) {
      frame = window.requestAnimationFrame(render);
    }
  };

  const bindings = [
    [ui.toneMap, "change", "toneMap", String],
    [ui.exposure, "input", "exposure", Number],
    [ui.whitePoint, "input", "whitePoint", Number],
    [ui.transfer, "change", "transfer", String],
    [ui.view, "change", "view", String],
  ];
  bindings.forEach(([element, eventName, key, convert]) => {
    element.addEventListener(eventName, () => {
      state[key] = convert(element.value);
      scheduleRender();
    });
  });
  window.addEventListener("resize", scheduleRender);
  render();
}
