import { createFullscreenTriangle } from "../../render/mesh.js?v=20260803-7";
import { createProgram, resizeCanvasToDisplaySize } from "../../render/webgl.js?v=20260803-7";

const VOLUME_SIZE = 64;

const vertexSource = `#version 300 es
in vec2 position;
out vec2 vPosition;

void main() {
  vPosition = position;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentSource = `#version 300 es
precision highp float;
precision highp sampler3D;

uniform sampler3D uVolume;
uniform vec2 uResolution;
uniform float uSlice;
uniform float uThreshold;
uniform int uAxis;
uniform int uSteps;
uniform int uStacked;

in vec2 vPosition;
out vec4 outColor;

vec2 intersectBox(vec3 origin, vec3 direction) {
  vec3 inverseDirection = 1.0 / direction;
  vec3 nearPlane = (-vec3(1.0) - origin) * inverseDirection;
  vec3 farPlane = (vec3(1.0) - origin) * inverseDirection;
  vec3 minimum = min(nearPlane, farPlane);
  vec3 maximum = max(nearPlane, farPlane);
  return vec2(max(max(minimum.x, minimum.y), minimum.z), min(min(maximum.x, maximum.y), maximum.z));
}

vec3 densityColor(float density, vec3 position) {
  vec3 cool = vec3(0.16, 0.76, 0.69);
  vec3 warm = vec3(1.0, 0.53, 0.25);
  return mix(cool, warm, smoothstep(-0.4, 0.7, position.y + density * 0.35));
}

void main() {
  float panelPosition = uStacked == 1 ? (1.0 - vPosition.y) * 1.5 : (vPosition.x + 1.0) * 1.5;
  int panel = min(2, int(floor(panelPosition)));
  float panelUv = fract(panelPosition);
  vec2 local = uStacked == 1
    ? vec2(vPosition.x, 1.0 - panelUv * 2.0)
    : vec2(panelUv * 2.0 - 1.0, vPosition.y);
  float panelEdge = smoothstep(0.0, 0.025, panelUv) * smoothstep(1.0, 0.975, panelUv);

  vec3 background = mix(vec3(0.028, 0.035, 0.037), vec3(0.055, 0.075, 0.073), local.y * 0.5 + 0.5);
  vec3 color = background;

  if (panel == 0) {
    vec2 uv2 = local * 0.52 + 0.5;
    if (all(greaterThanEqual(uv2, vec2(0.0))) && all(lessThanEqual(uv2, vec2(1.0)))) {
      vec3 coordinate;
      if (uAxis == 0) {
        coordinate = vec3(uSlice, uv2.y, uv2.x);
      } else if (uAxis == 1) {
        coordinate = vec3(uv2.x, uSlice, uv2.y);
      } else {
        coordinate = vec3(uv2.x, uv2.y, uSlice);
      }
      float density = texture(uVolume, coordinate).r;
      float visibleDensity = smoothstep(uThreshold, 1.0, density);
      color = mix(vec3(0.018, 0.024, 0.026), densityColor(density, coordinate * 2.0 - 1.0), visibleDensity);
      float border = step(min(min(uv2.x, 1.0 - uv2.x), min(uv2.y, 1.0 - uv2.y)), 0.008);
      color = mix(color, vec3(0.42, 0.68, 0.64), border);
    }
  } else {
    float aspect = uStacked == 1
      ? uResolution.x / max(uResolution.y / 3.0, 1.0)
      : (uResolution.x / 3.0) / max(uResolution.y, 1.0);
    vec3 eye = vec3(2.35, 1.55, 2.8);
    vec3 forward = normalize(-eye);
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);
    vec3 direction = normalize(forward * 1.8 + right * local.x * aspect + up * local.y);
    vec2 hit = intersectBox(eye, direction);

    if (hit.x <= hit.y && hit.y > 0.0) {
      float start = max(hit.x, 0.0);
      float distanceInside = hit.y - start;
      float stepSize = distanceInside / float(max(uSteps, 1));
      float maximumDensity = 0.0;
      vec4 accumulated = vec4(0.0);

      for (int index = 0; index < 160; index += 1) {
        if (index >= uSteps) {
          break;
        }
        float travel = start + (float(index) + 0.5) * stepSize;
        vec3 position = eye + direction * travel;
        vec3 coordinate = position * 0.5 + 0.5;
        float density = texture(uVolume, coordinate).r;
        maximumDensity = max(maximumDensity, density);

        float opacity = smoothstep(uThreshold, 1.0, density) * 0.105;
        vec3 sampleColor = densityColor(density, position) * (0.5 + density * 0.85);
        accumulated.rgb += (1.0 - accumulated.a) * opacity * sampleColor;
        accumulated.a += (1.0 - accumulated.a) * opacity;
        if (accumulated.a > 0.985) {
          break;
        }
      }

      if (panel == 1) {
        float visibleDensity = smoothstep(uThreshold, 1.0, maximumDensity);
        color = mix(background, densityColor(maximumDensity, vec3(0.0, maximumDensity, 0.0)), visibleDensity);
      } else {
        color = mix(background, accumulated.rgb, accumulated.a);
      }
    }
  }

  color *= panelEdge;
  color = pow(max(color, vec3(0.0)), vec3(1.0 / 2.2));
  outColor = vec4(color, 1.0);
}`;

const state = {
  axis: 2,
  slice: 52,
  steps: 80,
  threshold: 24,
  filter: "linear",
};

const ui = {
  section: document.querySelector("#volume-textures"),
  canvas: document.querySelector("#volumeTextureCanvas"),
  axis: document.querySelector("#volumeAxis"),
  slice: document.querySelector("#volumeSlice"),
  sliceValue: document.querySelector("#volumeSliceValue"),
  steps: document.querySelector("#volumeSteps"),
  stepsValue: document.querySelector("#volumeStepsValue"),
  threshold: document.querySelector("#volumeThreshold"),
  thresholdValue: document.querySelector("#volumeThresholdValue"),
  filter: document.querySelector("#volumeFilter"),
  dimensions: document.querySelector("#volumeDimensions"),
  samples: document.querySelector("#volumeSamples"),
  operation: document.querySelector("#volumeOperation"),
};

function hash3(x, y, z) {
  let value = Math.imul(x + 17, 374761393) ^ Math.imul(y + 31, 668265263) ^ Math.imul(z + 47, 2147483647);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function createVolumeData() {
  const data = new Uint8Array(VOLUME_SIZE ** 3);
  for (let z = 0; z < VOLUME_SIZE; z += 1) {
    for (let y = 0; y < VOLUME_SIZE; y += 1) {
      for (let x = 0; x < VOLUME_SIZE; x += 1) {
        const px = (x / (VOLUME_SIZE - 1)) * 2 - 1;
        const py = (y / (VOLUME_SIZE - 1)) * 2 - 1;
        const pz = (z / (VOLUME_SIZE - 1)) * 2 - 1;
        const sphereA = Math.max(0, 1 - Math.hypot(px + 0.28, py + 0.12, pz) / 0.72);
        const sphereB = Math.max(0, 1 - Math.hypot(px - 0.35, py - 0.22, pz + 0.18) / 0.56);
        const shell = Math.max(0, 1 - Math.abs(Math.hypot(px, py, pz) - 0.7) / 0.12) * 0.46;
        const waves = (Math.sin(px * 13 + pz * 8) * Math.sin(py * 11 - pz * 6) + 1) * 0.08;
        const noise = (hash3(x, y, z) - 0.5) * 0.1;
        const edgeFade = Math.max(0, 1 - Math.max(Math.abs(px), Math.abs(py), Math.abs(pz)) ** 5);
        const density = Math.max(0, Math.min(1, (sphereA * 0.76 + sphereB * 0.68 + shell + waves + noise) * edgeFade));
        data[(z * VOLUME_SIZE + y) * VOLUME_SIZE + x] = Math.round(density * 255);
      }
    }
  }
  return data;
}

class VolumeRenderer {
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
      volume: gl.getUniformLocation(this.program, "uVolume"),
      resolution: gl.getUniformLocation(this.program, "uResolution"),
      slice: gl.getUniformLocation(this.program, "uSlice"),
      threshold: gl.getUniformLocation(this.program, "uThreshold"),
      axis: gl.getUniformLocation(this.program, "uAxis"),
      steps: gl.getUniformLocation(this.program, "uSteps"),
      stacked: gl.getUniformLocation(this.program, "uStacked"),
    };
    this.mesh = createFullscreenTriangle(gl, this.locations.position);
    this.initVolumeTexture();
  }

  initVolumeTexture() {
    const gl = this.gl;
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_3D, this.texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage3D(
      gl.TEXTURE_3D,
      0,
      gl.R8,
      VOLUME_SIZE,
      VOLUME_SIZE,
      VOLUME_SIZE,
      0,
      gl.RED,
      gl.UNSIGNED_BYTE,
      createVolumeData(),
    );
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    this.setFilter(state.filter);
  }

  setFilter(filter) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_3D, this.texture);
    const value = filter === "nearest" ? gl.NEAREST : gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, value);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, value);
  }

  render(nextState) {
    const gl = this.gl;
    const rect = this.canvas.getBoundingClientRect();
    const { width, height } = resizeCanvasToDisplaySize(this.canvas, nextState.preview ? 1 : 2);

    gl.viewport(0, 0, width, height);
    gl.useProgram(this.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, this.texture);
    gl.uniform1i(this.locations.volume, 0);
    gl.uniform2f(this.locations.resolution, width, height);
    gl.uniform1f(this.locations.slice, nextState.slice / 100);
    gl.uniform1f(this.locations.threshold, nextState.threshold / 100);
    gl.uniform1i(this.locations.axis, nextState.axis);
    gl.uniform1i(this.locations.steps, nextState.steps);
    gl.uniform1i(this.locations.stacked, rect.width <= 700 ? 1 : 0);
    this.mesh.draw();
  }
}

function showWebglError(message) {
  ui.section?.classList.add("is-unavailable");
  const fallback = document.createElement("p");
  fallback.className = "webgl-fallback";
  fallback.textContent = `体积纹理实验无法启动：${message}`;
  ui.canvas?.closest(".viewport-panel")?.prepend(fallback);
}

export function initVolumeTexturesLab() {
  if (!ui.canvas || !ui.axis) {
    return;
  }

  let renderer;
  try {
    renderer = new VolumeRenderer(ui.canvas);
  } catch (error) {
    showWebglError(error.message);
    return;
  }

  let frame = 0;
  let settleTimer = 0;
  let pendingPreview = false;
  const render = () => {
    frame = 0;
    renderer.render({
      ...state,
      preview: pendingPreview,
      steps: pendingPreview ? Math.min(state.steps, 24) : state.steps,
    });
    ui.sliceValue.value = `${state.slice}%`;
    ui.stepsValue.value = `${state.steps}`;
    ui.thresholdValue.value = `${state.threshold}%`;
    ui.dimensions.textContent = `${VOLUME_SIZE}³ voxels`;
    ui.samples.textContent = `${state.steps} / ray`;
    ui.operation.textContent = state.filter === "nearest" ? "nearest" : "trilinear";
  };
  const scheduleRender = (preview = false) => {
    pendingPreview = preview;
    if (!frame) {
      frame = window.requestAnimationFrame(render);
    }
  };
  const schedulePreviewThenFull = () => {
    window.clearTimeout(settleTimer);
    scheduleRender(true);
    settleTimer = window.setTimeout(() => scheduleRender(false), 160);
  };

  ui.axis.addEventListener("change", () => {
    state.axis = Number(ui.axis.value);
    scheduleRender();
  });
  ui.slice.addEventListener("input", () => {
    state.slice = Number(ui.slice.value);
    schedulePreviewThenFull();
  });
  ui.steps.addEventListener("input", () => {
    state.steps = Number(ui.steps.value);
    schedulePreviewThenFull();
  });
  ui.threshold.addEventListener("input", () => {
    state.threshold = Number(ui.threshold.value);
    schedulePreviewThenFull();
  });
  ui.filter.addEventListener("change", () => {
    state.filter = ui.filter.value;
    renderer.setFilter(state.filter);
    scheduleRender();
  });
  [ui.slice, ui.steps, ui.threshold].forEach((control) => {
    control.addEventListener("change", () => {
      window.clearTimeout(settleTimer);
      scheduleRender(false);
    });
  });
  window.addEventListener("resize", schedulePreviewThenFull);
  render();
}
