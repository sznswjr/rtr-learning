import { createFullscreenTriangle } from "../../render/mesh.js?v=20260803-7";
import { createProgram, resizeCanvasToDisplaySize } from "../../render/webgl.js?v=20260803-7";

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
uniform vec3 uBaseColor;
uniform vec3 uLightDirection;
uniform ivec2 uProbeCell;
uniform float uRoughnessOffset;
uniform float uMetallicOffset;
uniform float uIntensity;
uniform int uTerm;

in vec2 vUv;
out vec4 outColor;

const float PI = 3.14159265359;

float distributionGGX(vec3 normal, vec3 halfway, float roughness) {
  float alpha = roughness * roughness;
  float alpha2 = alpha * alpha;
  float nDotH = max(dot(normal, halfway), 0.0);
  float denominator = nDotH * nDotH * (alpha2 - 1.0) + 1.0;
  return alpha2 / max(PI * denominator * denominator, 0.0001);
}

float geometrySchlickGGX(float nDotDirection, float roughness) {
  float k = pow(roughness + 1.0, 2.0) / 8.0;
  return nDotDirection / max(nDotDirection * (1.0 - k) + k, 0.0001);
}

float geometrySmith(vec3 normal, vec3 viewDirection, vec3 lightDirection, float roughness) {
  return geometrySchlickGGX(max(dot(normal, viewDirection), 0.0), roughness)
    * geometrySchlickGGX(max(dot(normal, lightDirection), 0.0), roughness);
}

vec3 fresnelSchlick(float cosine, vec3 f0) {
  return f0 + (1.0 - f0) * pow(1.0 - cosine, 5.0);
}

void main() {
  vec2 grid = vec2(5.0, 3.0);
  vec2 cell = floor(vUv * grid);
  vec2 cellUv = fract(vUv * grid);
  vec2 local = cellUv * 2.0 - 1.0;
  float cellAspect = (uResolution.x / grid.x) / max(uResolution.y / grid.y, 1.0);
  local.x *= cellAspect;
  float radiusSquared = dot(local, local);
  vec3 background = mix(vec3(0.018, 0.029, 0.032), vec3(0.045, 0.065, 0.066), cellUv.y);
  float divider = max(
    1.0 - smoothstep(0.0, 0.025, min(cellUv.x, 1.0 - cellUv.x)),
    1.0 - smoothstep(0.0, 0.035, min(cellUv.y, 1.0 - cellUv.y))
  );
  background = mix(background, vec3(0.11, 0.16, 0.16), divider * 0.38);

  bool selected = all(equal(ivec2(cell), uProbeCell));
  float selectionBorder = selected
    ? 1.0 - smoothstep(0.0, 0.035, min(min(cellUv.x, 1.0 - cellUv.x), min(cellUv.y, 1.0 - cellUv.y)))
    : 0.0;

  if (radiusSquared > 0.72) {
    outColor = vec4(pow(mix(background, vec3(1.0, 0.70, 0.16), selectionBorder), vec3(1.0 / 2.2)), 1.0);
    return;
  }

  vec3 normal = normalize(vec3(local, sqrt(max(0.0, 1.0 - radiusSquared / 0.72))));
  vec3 viewDirection = vec3(0.0, 0.0, 1.0);
  vec3 lightDirection = normalize(uLightDirection);
  vec3 halfway = normalize(viewDirection + lightDirection);
  float roughness = clamp(mix(0.08, 0.92, cell.x / 4.0) + uRoughnessOffset, 0.04, 1.0);
  float metallic = clamp(mix(0.0, 1.0, cell.y / 2.0) + uMetallicOffset, 0.0, 1.0);
  float nDotL = max(dot(normal, lightDirection), 0.0);
  float nDotV = max(dot(normal, viewDirection), 0.0);
  float distribution = distributionGGX(normal, halfway, roughness);
  float geometry = geometrySmith(normal, viewDirection, lightDirection, roughness);
  vec3 f0 = mix(vec3(0.04), uBaseColor, metallic);
  vec3 fresnel = fresnelSchlick(max(dot(halfway, viewDirection), 0.0), f0);

  vec3 color;
  if (uTerm == 1) {
    float value = distribution / (1.0 + distribution);
    color = vec3(value);
  } else if (uTerm == 2) {
    color = fresnel;
  } else if (uTerm == 3) {
    color = vec3(geometry);
  } else {
    vec3 specular = distribution * geometry * fresnel / max(4.0 * nDotV * nDotL, 0.001);
    vec3 diffuseWeight = (1.0 - fresnel) * (1.0 - metallic);
    vec3 diffuse = diffuseWeight * uBaseColor / PI;
    color = (diffuse + specular) * nDotL * uIntensity + uBaseColor * 0.025;
    color = color / (color + vec3(0.82));
  }

  float rim = pow(1.0 - nDotV, 3.0);
  color += rim * vec3(0.045, 0.075, 0.075);
  color = mix(color, vec3(1.0, 0.70, 0.16), selectionBorder);
  outColor = vec4(pow(max(color, vec3(0.0)), vec3(1.0 / 2.2)), 1.0);
}`;

const baseColors = {
  copper: [0.95, 0.36, 0.18],
  gold: [1.0, 0.61, 0.12],
  teal: [0.08, 0.58, 0.5],
};

const state = {
  baseColor: "teal",
  intensity: 120,
  light: 38,
  metallic: 0,
  probe: [2, 1],
  roughness: 0,
  term: "full",
};

const ui = {
  alpha: document.querySelector("#brdfAlpha"),
  baseColor: document.querySelector("#brdfBaseColor"),
  canvas: document.querySelector("#microfacetBrdfCanvas"),
  diffuse: document.querySelector("#brdfDiffuse"),
  f0: document.querySelector("#brdfF0"),
  intensity: document.querySelector("#brdfIntensity"),
  intensityValue: document.querySelector("#brdfIntensityValue"),
  light: document.querySelector("#brdfLight"),
  lightValue: document.querySelector("#brdfLightValue"),
  material: document.querySelector("#brdfMaterial"),
  metallic: document.querySelector("#brdfMetallic"),
  metallicValue: document.querySelector("#brdfMetallicValue"),
  roughness: document.querySelector("#brdfRoughness"),
  roughnessValue: document.querySelector("#brdfRoughnessValue"),
  section: document.querySelector("#microfacet-brdf"),
  term: document.querySelector("#brdfTerm"),
};

class BrdfRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2", { alpha: false, antialias: true, preserveDrawingBuffer: true });
    if (!this.gl) {
      throw new Error("当前浏览器不支持 WebGL2。");
    }

    const gl = this.gl;
    this.program = createProgram(gl, vertexSource, fragmentSource);
    this.locations = {
      baseColor: gl.getUniformLocation(this.program, "uBaseColor"),
      intensity: gl.getUniformLocation(this.program, "uIntensity"),
      lightDirection: gl.getUniformLocation(this.program, "uLightDirection"),
      metallicOffset: gl.getUniformLocation(this.program, "uMetallicOffset"),
      position: gl.getAttribLocation(this.program, "position"),
      probeCell: gl.getUniformLocation(this.program, "uProbeCell"),
      resolution: gl.getUniformLocation(this.program, "uResolution"),
      roughnessOffset: gl.getUniformLocation(this.program, "uRoughnessOffset"),
      term: gl.getUniformLocation(this.program, "uTerm"),
    };
    this.mesh = createFullscreenTriangle(gl, this.locations.position);
  }

  render(nextState) {
    const gl = this.gl;
    const { width, height } = resizeCanvasToDisplaySize(this.canvas);
    const angle = (nextState.light * Math.PI) / 180;
    gl.viewport(0, 0, width, height);
    gl.useProgram(this.program);
    gl.uniform2f(this.locations.resolution, width, height);
    gl.uniform3fv(this.locations.baseColor, baseColors[nextState.baseColor]);
    gl.uniform3f(this.locations.lightDirection, Math.cos(angle) * 0.72, Math.sin(angle) * 0.72, 0.78);
    gl.uniform2i(this.locations.probeCell, nextState.probe[0], nextState.probe[1]);
    gl.uniform1f(this.locations.roughnessOffset, nextState.roughness / 100);
    gl.uniform1f(this.locations.metallicOffset, nextState.metallic / 100);
    gl.uniform1f(this.locations.intensity, nextState.intensity / 100);
    gl.uniform1i(this.locations.term, { full: 0, distribution: 1, fresnel: 2, geometry: 3 }[nextState.term]);
    this.mesh.draw();
  }
}

function showWebglError(message) {
  ui.section?.classList.add("is-unavailable");
  const fallback = document.createElement("p");
  fallback.className = "webgl-fallback";
  fallback.textContent = `微表面 BRDF 实验无法启动：${message}`;
  ui.canvas?.closest(".viewport-panel")?.prepend(fallback);
}

function formatOffset(value) {
  const normalized = value / 100;
  return `${normalized >= 0 ? "+" : ""}${normalized.toFixed(2)}`;
}

export function initMicrofacetBrdfLab() {
  if (!ui.canvas || !ui.term) {
    return;
  }

  let renderer;
  try {
    renderer = new BrdfRenderer(ui.canvas);
  } catch (error) {
    showWebglError(error.message);
    return;
  }

  let frame = 0;
  const render = () => {
    frame = 0;
    renderer.render(state);
    const roughness = Math.min(1, Math.max(0.04, 0.08 + (0.84 * state.probe[0]) / 4 + state.roughness / 100));
    const metallic = Math.min(1, Math.max(0, 0.5 * state.probe[1] + state.metallic / 100));
    const alpha = roughness * roughness;
    ui.roughnessValue.value = formatOffset(state.roughness);
    ui.metallicValue.value = formatOffset(state.metallic);
    ui.lightValue.value = `${state.light}°`;
    ui.intensityValue.value = (state.intensity / 100).toFixed(2);
    ui.material.textContent = `r ${roughness.toFixed(2)} · m ${metallic.toFixed(2)}`;
    ui.alpha.textContent = (alpha * alpha).toFixed(4);
    ui.f0.textContent = metallic > 0.98 ? "F₀ = base color" : metallic < 0.02 ? "F₀ = 0.04" : "mix(0.04, base, m)";
    ui.diffuse.textContent = `${Math.round((1 - metallic) * 100)}%`;
  };
  const scheduleRender = () => {
    if (!frame) {
      frame = window.requestAnimationFrame(render);
    }
  };

  const bindings = [
    [ui.term, "change", "term", String],
    [ui.baseColor, "change", "baseColor", String],
    [ui.roughness, "input", "roughness", Number],
    [ui.metallic, "input", "metallic", Number],
    [ui.light, "input", "light", Number],
    [ui.intensity, "input", "intensity", Number],
  ];
  bindings.forEach(([element, eventName, key, convert]) => {
    element.addEventListener(eventName, () => {
      state[key] = convert(element.value);
      scheduleRender();
    });
  });

  const selectCell = (event) => {
    const rect = ui.canvas.getBoundingClientRect();
    const x = Math.min(4, Math.max(0, Math.floor(((event.clientX - rect.left) / Math.max(rect.width, 1)) * 5)));
    const y = Math.min(2, Math.max(0, Math.floor((1 - (event.clientY - rect.top) / Math.max(rect.height, 1)) * 3)));
    state.probe = [x, y];
    scheduleRender();
  };
  ui.canvas.addEventListener("pointerdown", selectCell);
  window.addEventListener("resize", scheduleRender);
  render();
}
