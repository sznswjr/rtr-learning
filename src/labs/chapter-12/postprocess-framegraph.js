import { createColorTarget } from "../../render/framebuffer.js?v=20260803-7";
import { createPostprocessPass } from "../../render/postprocess.js?v=20260803-7";
import { resizeCanvasToDisplaySize } from "../../render/webgl.js?v=20260803-7";

const sceneFragment = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

float sdBox(vec2 point, vec2 halfSize) {
  vec2 delta = abs(point) - halfSize;
  return length(max(delta, 0.0)) + min(max(delta.x, delta.y), 0.0);
}

float boxMask(vec2 point, vec2 halfSize, float feather) {
  return 1.0 - smoothstep(-feather, feather, sdBox(point, halfSize));
}

float lineGlow(float distanceToLine, float width, float spread) {
  float core = 1.0 - smoothstep(width * 0.35, width, distanceToLine);
  float halo = exp(-max(distanceToLine - width, 0.0) * spread);
  return core * 1.8 + halo * 0.42;
}

void main() {
  vec2 uv = vUv;
  vec2 point = (uv * 2.0 - 1.0) * vec2(1.72, 1.0);
  vec3 color = mix(vec3(0.004, 0.008, 0.015), vec3(0.025, 0.055, 0.075), pow(uv.y, 1.7));

  float horizon = exp(-pow((uv.y - 0.35) * 8.0, 2.0));
  color += horizon * vec3(0.12, 0.18, 0.24);

  float buildingA = boxMask(point - vec2(-1.12, -0.47), vec2(0.28, 0.44), 0.01);
  float buildingB = boxMask(point - vec2(-0.56, -0.58), vec2(0.22, 0.33), 0.01);
  float buildingC = boxMask(point - vec2(0.92, -0.52), vec2(0.36, 0.39), 0.01);
  float buildings = max(buildingA, max(buildingB, buildingC));
  color = mix(color, vec3(0.018, 0.026, 0.035), buildings);

  vec2 windowGrid = fract((point + vec2(1.45, 0.86)) * vec2(7.0, 9.0));
  float windowShape = boxMask(windowGrid - 0.5, vec2(0.22, 0.27), 0.07);
  float windowPattern = step(0.44, fract(floor((point.x + 1.7) * 7.0) * 0.37 + floor((point.y + 1.0) * 9.0) * 0.61));
  color += buildings * windowShape * windowPattern * vec3(0.8, 1.4, 2.8);

  vec2 ringPoint = point - vec2(0.08, 0.17);
  float ringDistance = abs(length(ringPoint) - 0.245);
  float ring = lineGlow(ringDistance, 0.011, 24.0);
  color += ring * vec3(2.6, 0.18, 1.7) * 4.2;

  float slashDistance = abs(ringPoint.y - ringPoint.x * 0.58);
  float slash = lineGlow(slashDistance, 0.009, 28.0) * step(abs(ringPoint.x), 0.18);
  color += slash * vec3(0.1, 2.1, 3.5) * 3.5;

  float sign = boxMask(point - vec2(1.08, 0.27), vec2(0.31, 0.16), 0.012);
  float signEdge = lineGlow(abs(sdBox(point - vec2(1.08, 0.27), vec2(0.31, 0.16))), 0.008, 27.0);
  color += sign * vec3(0.10, 0.18, 0.24);
  color += signEdge * vec3(3.5, 1.35, 0.12) * 3.4;

  float signBarA = lineGlow(abs(point.y - 0.31), 0.006, 38.0) * step(abs(point.x - 1.08), 0.22);
  float signBarB = lineGlow(abs(point.y - 0.23), 0.006, 38.0) * step(abs(point.x - 1.08), 0.15);
  color += (signBarA + signBarB) * vec3(3.8, 0.36, 0.05) * 2.6;

  float road = 1.0 - smoothstep(0.0, 0.03, point.y + 0.88);
  color = mix(color, vec3(0.012, 0.017, 0.022), road * 0.86);
  float roadGlow = lineGlow(abs(point.y + 0.79), 0.004, 32.0) * road;
  color += roadGlow * vec3(0.05, 1.8, 1.6) * 1.8;

  float reflection = exp(-abs(point.x - 0.08) * 5.0) * smoothstep(-0.18, -0.82, point.y);
  color += reflection * vec3(0.32, 0.035, 0.24);

  outColor = vec4(color, 1.0);
}`;

const brightFragment = `#version 300 es
precision highp float;

uniform sampler2D uSource;
uniform float uThreshold;
uniform float uKnee;

in vec2 vUv;
out vec4 outColor;

void main() {
  vec3 hdr = texture(uSource, vUv).rgb;
  float luminance = dot(hdr, vec3(0.2126, 0.7152, 0.0722));
  float knee = max(uKnee, 0.0001);
  float soft = clamp(luminance - uThreshold + knee, 0.0, 2.0 * knee);
  soft = soft * soft / (4.0 * knee + 0.0001);
  float contribution = max(luminance - uThreshold, soft);
  outColor = vec4(hdr * contribution / max(luminance, 0.0001), 1.0);
}`;

const blurFragment = `#version 300 es
precision highp float;

uniform sampler2D uSource;
uniform vec2 uDirection;
uniform float uRadius;

in vec2 vUv;
out vec4 outColor;

void main() {
  vec2 stepUv = uDirection * uRadius;
  vec3 color = texture(uSource, vUv).rgb * 0.227027;
  color += texture(uSource, vUv + stepUv * 1.384615).rgb * 0.1945946;
  color += texture(uSource, vUv - stepUv * 1.384615).rgb * 0.1945946;
  color += texture(uSource, vUv + stepUv * 3.230769).rgb * 0.1216216;
  color += texture(uSource, vUv - stepUv * 3.230769).rgb * 0.1216216;
  outColor = vec4(color, 1.0);
}`;

const compositeFragment = `#version 300 es
precision highp float;

uniform sampler2D uSource;
uniform sampler2D uBright;
uniform sampler2D uBloom;
uniform float uBloomStrength;
uniform float uExposure;
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

void main() {
  vec3 scene = texture(uSource, vUv).rgb;
  vec3 bright = texture(uBright, vUv).rgb;
  vec3 bloom = texture(uBloom, vUv).rgb;
  vec3 hdr = scene + bloom * uBloomStrength;
  if (uView == 1) hdr = scene;
  if (uView == 2) hdr = bright;
  if (uView == 3) hdr = bloom;
  vec3 mapped = acesApprox(hdr * uExposure);
  mapped = pow(max(mapped, vec3(0.0)), vec3(1.0 / 2.2));
  outColor = vec4(mapped, 1.0);
}`;

const state = {
  bloom: 105,
  exposure: 0,
  knee: 65,
  radius: 140,
  threshold: 180,
  view: "final",
};

const ui = {
  bloom: document.querySelector("#postprocessBloom"),
  bloomValue: document.querySelector("#postprocessBloomValue"),
  bufferName: document.querySelector("#postprocessBufferName"),
  canvas: document.querySelector("#postprocessCanvas"),
  chain: [...document.querySelectorAll(".postprocess-chain [data-buffer]")],
  exposure: document.querySelector("#postprocessExposure"),
  exposureValue: document.querySelector("#postprocessExposureValue"),
  knee: document.querySelector("#postprocessKnee"),
  kneeValue: document.querySelector("#postprocessKneeValue"),
  radius: document.querySelector("#postprocessRadius"),
  radiusValue: document.querySelector("#postprocessRadiusValue"),
  resolution: document.querySelector("#postprocessResolution"),
  section: document.querySelector("#postprocess-framegraph"),
  threshold: document.querySelector("#postprocessThreshold"),
  thresholdValue: document.querySelector("#postprocessThresholdValue"),
  view: document.querySelector("#postprocessView"),
};

class PostprocessRenderer {
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
    const targetOptions = {
      depth: false,
      filter: gl.LINEAR,
      format: gl.RGBA,
      height: 1,
      internalFormat: gl.RGBA16F,
      type: gl.HALF_FLOAT,
      width: 1,
    };
    this.sceneTarget = createColorTarget(gl, { ...targetOptions, label: "postprocess HDR scene" });
    this.brightTarget = createColorTarget(gl, { ...targetOptions, label: "postprocess bright pass" });
    this.blurXTarget = createColorTarget(gl, { ...targetOptions, label: "postprocess horizontal blur" });
    this.blurYTarget = createColorTarget(gl, { ...targetOptions, label: "postprocess vertical blur" });
    this.scenePass = createPostprocessPass(gl, sceneFragment);
    this.brightPass = createPostprocessPass(gl, brightFragment);
    this.blurPass = createPostprocessPass(gl, blurFragment);
    this.compositePass = createPostprocessPass(gl, compositeFragment);
    this.brightLocations = {
      knee: gl.getUniformLocation(this.brightPass.program, "uKnee"),
      threshold: gl.getUniformLocation(this.brightPass.program, "uThreshold"),
    };
    this.blurLocations = {
      direction: gl.getUniformLocation(this.blurPass.program, "uDirection"),
      radius: gl.getUniformLocation(this.blurPass.program, "uRadius"),
    };
    this.compositeLocations = {
      bloom: gl.getUniformLocation(this.compositePass.program, "uBloom"),
      bright: gl.getUniformLocation(this.compositePass.program, "uBright"),
      exposure: gl.getUniformLocation(this.compositePass.program, "uExposure"),
      strength: gl.getUniformLocation(this.compositePass.program, "uBloomStrength"),
      view: gl.getUniformLocation(this.compositePass.program, "uView"),
    };
  }

  render(nextState) {
    const gl = this.gl;
    const { width, height } = resizeCanvasToDisplaySize(this.canvas);
    const bloomWidth = Math.max(1, Math.round(width * 0.5));
    const bloomHeight = Math.max(1, Math.round(height * 0.5));
    if (this.sceneTarget.width !== width || this.sceneTarget.height !== height) {
      this.sceneTarget.resize(width, height);
    }
    [this.brightTarget, this.blurXTarget, this.blurYTarget].forEach((target) => {
      if (target.width !== bloomWidth || target.height !== bloomHeight) {
        target.resize(bloomWidth, bloomHeight);
      }
    });

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    this.scenePass.draw({ framebuffer: this.sceneTarget.framebuffer, height, width });
    this.brightPass.draw({
      configure: () => {
        gl.uniform1f(this.brightLocations.threshold, nextState.threshold / 100);
        gl.uniform1f(this.brightLocations.knee, nextState.knee / 100);
      },
      framebuffer: this.brightTarget.framebuffer,
      height: bloomHeight,
      texture: this.sceneTarget.color,
      width: bloomWidth,
    });
    this.blurPass.draw({
      configure: () => {
        gl.uniform2f(this.blurLocations.direction, 1 / bloomWidth, 0);
        gl.uniform1f(this.blurLocations.radius, nextState.radius / 100);
      },
      framebuffer: this.blurXTarget.framebuffer,
      height: bloomHeight,
      texture: this.brightTarget.color,
      width: bloomWidth,
    });
    this.blurPass.draw({
      configure: () => {
        gl.uniform2f(this.blurLocations.direction, 0, 1 / bloomHeight);
        gl.uniform1f(this.blurLocations.radius, nextState.radius / 100);
      },
      framebuffer: this.blurYTarget.framebuffer,
      height: bloomHeight,
      texture: this.blurXTarget.color,
      width: bloomWidth,
    });
    this.compositePass.draw({
      configure: () => {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.brightTarget.color);
        gl.uniform1i(this.compositeLocations.bright, 1);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.blurYTarget.color);
        gl.uniform1i(this.compositeLocations.bloom, 2);
        gl.uniform1f(this.compositeLocations.strength, nextState.bloom / 100);
        gl.uniform1f(this.compositeLocations.exposure, 2 ** (nextState.exposure / 4));
        gl.uniform1i(this.compositeLocations.view, { final: 0, scene: 1, bright: 2, blur: 3 }[nextState.view]);
      },
      height,
      texture: this.sceneTarget.color,
      width,
    });
    return { bloomHeight, bloomWidth };
  }
}

function showWebglError(message) {
  ui.section?.classList.add("is-unavailable");
  const fallback = document.createElement("p");
  fallback.className = "webgl-fallback";
  fallback.textContent = `后处理实验无法启动：${message}`;
  ui.canvas?.closest(".viewport-panel")?.prepend(fallback);
}

export function initPostprocessFramegraphLab() {
  if (!ui.canvas || !ui.view) {
    return;
  }

  let renderer;
  try {
    renderer = new PostprocessRenderer(ui.canvas);
  } catch (error) {
    showWebglError(error.message);
    return;
  }

  let frame = 0;
  const render = () => {
    frame = 0;
    const { bloomHeight, bloomWidth } = renderer.render(state);
    const exposure = state.exposure / 4;
    const bufferNames = {
      blur: "垂直模糊",
      bright: "亮度提取",
      final: "最终合成",
      scene: "HDR 场景",
    };
    ui.thresholdValue.value = (state.threshold / 100).toFixed(2);
    ui.kneeValue.value = (state.knee / 100).toFixed(2);
    ui.radiusValue.value = `${(state.radius / 100).toFixed(2)}×`;
    ui.bloomValue.value = `${(state.bloom / 100).toFixed(2)}×`;
    ui.exposureValue.value = `${exposure >= 0 ? "+" : ""}${exposure.toFixed(2)} EV`;
    ui.bufferName.textContent = bufferNames[state.view];
    ui.resolution.textContent = `${bloomWidth.toLocaleString("zh-CN")} × ${bloomHeight.toLocaleString("zh-CN")}`;
    ui.chain.forEach((stage) => stage.classList.toggle("is-active", stage.dataset.buffer === state.view));
  };
  const scheduleRender = () => {
    if (!frame) {
      frame = window.requestAnimationFrame(render);
    }
  };

  const bindings = [
    [ui.view, "change", "view", String],
    [ui.threshold, "input", "threshold", Number],
    [ui.knee, "input", "knee", Number],
    [ui.radius, "input", "radius", Number],
    [ui.bloom, "input", "bloom", Number],
    [ui.exposure, "input", "exposure", Number],
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
