import { createGpuTimer } from "../../render/gpu-query.js?v=20260803-9";
import { createFullscreenTriangle } from "../../render/mesh.js?v=20260803-9";
import { createProgram } from "../../render/webgl.js?v=20260803-9";

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
uniform float uTime;
uniform int uWorkload;

in vec2 vUv;
out vec4 outColor;

mat2 rotate2(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 point = (vUv * 2.0 - 1.0) * vec2(aspect, 1.0);
  vec2 orbit = vec2(sin(uTime * 0.37), cos(uTime * 0.29)) * 0.18;
  vec3 energy = vec3(0.0);
  float density = 0.0;

  for (int index = 0; index < 80; index += 1) {
    if (index >= uWorkload) {
      break;
    }
    float iteration = float(index) + 1.0;
    point = rotate2(0.13 + iteration * 0.003) * point;
    point = abs(fract((point + orbit) * (1.08 + iteration * 0.0015)) - 0.5);
    float distanceToCell = length(point - vec2(0.18 + sin(iteration) * 0.035));
    float glow = 0.0045 / max(distanceToCell, 0.012);
    density += glow;
    energy += glow * (0.5 + 0.5 * cos(vec3(0.4, 1.9, 3.7) + iteration * 0.11 + uTime * 0.22));
  }

  vec3 background = mix(vec3(0.007, 0.018, 0.021), vec3(0.025, 0.055, 0.058), vUv.y);
  vec3 color = background + energy / max(float(uWorkload) * 0.18, 1.0);
  color += vec3(0.04, 0.12, 0.11) * smoothstep(0.2, 2.2, density);
  color = color / (color + vec3(0.78));
  outColor = vec4(pow(max(color, vec3(0.0)), vec3(1.0 / 2.2)), 1.0);
}`;

const state = {
  running: true,
  scale: 75,
  targetFps: 60,
  workload: 28,
};

const ui = {
  budget: document.querySelector("#frameBudgetValue"),
  canvas: document.querySelector("#frameBudgetCanvas"),
  gpuTime: document.querySelector("#frameGpuTime"),
  interval: document.querySelector("#frameInterval"),
  motion: document.querySelector("#frameMotion"),
  pixelCount: document.querySelector("#framePixelCount"),
  renderSize: document.querySelector("#frameRenderSize"),
  resolution: document.querySelector("#frameResolution"),
  resolutionValue: document.querySelector("#frameResolutionValue"),
  section: document.querySelector("#frame-budget"),
  status: document.querySelector("#frameStatus"),
  target: document.querySelector("#frameTarget"),
  trace: document.querySelector("#frameTrace"),
  workload: document.querySelector("#frameWorkload"),
  workloadValue: document.querySelector("#frameWorkloadValue"),
};

class FrameBudgetRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2", { alpha: false, antialias: false, preserveDrawingBuffer: true });
    if (!this.gl) {
      throw new Error("当前浏览器不支持 WebGL2。");
    }

    const gl = this.gl;
    this.program = createProgram(gl, vertexSource, fragmentSource);
    this.locations = {
      position: gl.getAttribLocation(this.program, "position"),
      resolution: gl.getUniformLocation(this.program, "uResolution"),
      time: gl.getUniformLocation(this.program, "uTime"),
      workload: gl.getUniformLocation(this.program, "uWorkload"),
    };
    this.mesh = createFullscreenTriangle(gl, this.locations.position);
    this.timer = createGpuTimer(gl);
    this.frame = 0;
    this.lastGpuMilliseconds = null;
  }

  resize(scale) {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const factor = scale / 100;
    const width = Math.max(1, Math.round(rect.width * dpr * factor));
    const height = Math.max(1, Math.round(rect.height * dpr * factor));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    return { height, width };
  }

  render(nextState, time) {
    const gl = this.gl;
    const { width, height } = this.resize(nextState.scale);
    const gpuResult = this.timer.poll();
    if (gpuResult?.milliseconds != null) {
      this.lastGpuMilliseconds = gpuResult.milliseconds;
    }
    const shouldQuery = this.timer.available && this.frame % 18 === 0;
    const queryStarted = shouldQuery && this.timer.begin("procedural fragments");
    const start = performance.now();

    gl.viewport(0, 0, width, height);
    gl.useProgram(this.program);
    gl.uniform2f(this.locations.resolution, width, height);
    gl.uniform1f(this.locations.time, time * 0.001);
    gl.uniform1i(this.locations.workload, nextState.workload);
    this.mesh.draw();

    if (queryStarted) {
      this.timer.end();
    }
    this.frame += 1;
    return {
      cpuMilliseconds: performance.now() - start,
      gpuMilliseconds: this.lastGpuMilliseconds,
      height,
      width,
    };
  }
}

function showWebglError(message) {
  ui.section?.classList.add("is-unavailable");
  const fallback = document.createElement("p");
  fallback.className = "webgl-fallback";
  fallback.textContent = `帧预算实验无法启动：${message}`;
  ui.canvas?.closest(".viewport-panel")?.prepend(fallback);
}

function createTraceBars() {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 48; index += 1) {
    fragment.append(document.createElement("i"));
  }
  ui.trace.replaceChildren(fragment);
}

export function initFrameBudgetLab() {
  if (!ui.canvas || !ui.target) {
    return;
  }

  let renderer;
  try {
    renderer = new FrameBudgetRenderer(ui.canvas);
  } catch (error) {
    showWebglError(error.message);
    return;
  }

  createTraceBars();
  const frameSamples = [];
  let lastTime = performance.now();
  let frozenTime = lastTime;
  let displayFrame = 0;

  const updateTrace = (frameMilliseconds, budget) => {
    frameSamples.push(frameMilliseconds);
    if (frameSamples.length > 48) {
      frameSamples.shift();
    }
    [...ui.trace.children].forEach((bar, index) => {
      const sample = frameSamples[index] ?? 0;
      bar.style.height = `${Math.min(100, (sample / Math.max(budget * 1.8, 1)) * 100)}%`;
      bar.classList.toggle("is-over", sample > budget);
    });
  };

  const loop = (time) => {
    const frameMilliseconds = Math.min(100, time - lastTime);
    lastTime = time;
    if (state.running) {
      frozenTime = time;
    }
    const metrics = renderer.render(state, frozenTime);
    const budget = 1000 / state.targetFps;
    updateTrace(frameMilliseconds, budget);

    if (displayFrame % 6 === 0) {
      const overBudget = frameMilliseconds > budget * 1.08;
      ui.resolutionValue.value = `${state.scale}%`;
      ui.workloadValue.value = `${state.workload} 次`;
      ui.renderSize.textContent = `${metrics.width} × ${metrics.height}`;
      ui.pixelCount.textContent = `${(metrics.width * metrics.height / 1_000_000).toFixed(2)} MP`;
      ui.budget.textContent = `${budget.toFixed(2)} ms`;
      ui.interval.textContent = `${frameMilliseconds.toFixed(2)} ms`;
      ui.gpuTime.textContent = metrics.gpuMilliseconds == null
        ? (renderer.timer.available ? "查询中" : "扩展不可用")
        : `${metrics.gpuMilliseconds.toFixed(2)} ms`;
      ui.status.textContent = overBudget ? "超出预算" : "预算内";
      ui.status.classList.toggle("is-warning", overBudget);
    }
    displayFrame += 1;
    window.requestAnimationFrame(loop);
  };

  ui.target.addEventListener("change", () => {
    state.targetFps = Number(ui.target.value);
  });
  ui.resolution.addEventListener("input", () => {
    state.scale = Number(ui.resolution.value);
  });
  ui.workload.addEventListener("input", () => {
    state.workload = Number(ui.workload.value);
  });
  ui.motion.addEventListener("change", () => {
    state.running = ui.motion.value === "run";
  });

  window.requestAnimationFrame(loop);
}
