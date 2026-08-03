import { createFullscreenTriangle } from "../../render/mesh.js?v=20260803-6";
import { createProgram, resizeCanvasToDisplaySize } from "../../render/webgl.js?v=20260803-6";

const vertexSource = `#version 300 es
in vec2 position;
out vec2 vPosition;

void main() {
  vPosition = position;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentSource = `#version 300 es
precision highp float;

uniform samplerCube uEnvironment;
uniform vec2 uResolution;
uniform float uRotation;
uniform float uRoughness;
uniform float uIor;
uniform int uMode;

in vec2 vPosition;
out vec4 outColor;

mat3 rotateY(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
}

vec3 sampleEnvironment(vec3 direction, float roughness) {
  return textureLod(uEnvironment, direction, roughness * 5.0).rgb;
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 screen = vec2(vPosition.x * aspect, vPosition.y);
  vec3 eye = rotateY(uRotation) * vec3(0.0, 0.0, 3.2);
  vec3 forward = normalize(-eye);
  vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, forward);
  vec3 ray = normalize(forward * 1.9 + right * screen.x + up * screen.y);

  vec3 color = sampleEnvironment(ray, 0.12) * 0.58;
  float horizon = smoothstep(-0.35, 0.2, ray.y);
  color *= mix(0.52, 1.0, horizon);

  float b = dot(eye, ray);
  float c = dot(eye, eye) - 1.0;
  float discriminant = b * b - c;

  if (discriminant > 0.0) {
    float distanceToSphere = -b - sqrt(discriminant);
    if (distanceToSphere > 0.0) {
      vec3 point = eye + ray * distanceToSphere;
      vec3 normal = normalize(point);
      vec3 reflected = reflect(ray, normal);
      vec3 refracted = refract(ray, normal, 1.0 / uIor);
      float cosTheta = clamp(dot(-ray, normal), 0.0, 1.0);
      float f0 = pow((uIor - 1.0) / (uIor + 1.0), 2.0);
      float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
      vec3 reflection = sampleEnvironment(reflected, uRoughness);
      vec3 refraction = sampleEnvironment(refracted, uRoughness * 0.42);

      if (uMode == 0) {
        color = reflection;
      } else if (uMode == 1) {
        color = refraction * vec3(0.78, 0.96, 0.92);
      } else {
        color = mix(refraction * vec3(0.76, 0.94, 0.9), reflection, fresnel);
      }

      float rim = pow(1.0 - cosTheta, 2.2);
      color += rim * vec3(0.18, 0.42, 0.39);
    }
  }

  color = color / (color + vec3(0.72));
  color = pow(color, vec3(1.0 / 2.2));
  outColor = vec4(color, 1.0);
}`;

const faceDefinitions = [
  { target: "POSITIVE_X", label: "+X", colors: ["#f06f5f", "#63293b"] },
  { target: "NEGATIVE_X", label: "−X", colors: ["#f2a65a", "#684224"] },
  { target: "POSITIVE_Y", label: "+Y", colors: ["#77d7c8", "#214c52"] },
  { target: "NEGATIVE_Y", label: "−Y", colors: ["#536d83", "#192631"] },
  { target: "POSITIVE_Z", label: "+Z", colors: ["#72a8ff", "#2d315f"] },
  { target: "NEGATIVE_Z", label: "−Z", colors: ["#c18cff", "#4b285e"] },
];

const state = {
  mode: 2,
  rotation: 28,
  roughness: 18,
  ior: 150,
};

const ui = {
  section: document.querySelector("#environment-mapping"),
  canvas: document.querySelector("#environmentMappingCanvas"),
  mode: document.querySelector("#environmentMode"),
  rotation: document.querySelector("#environmentRotation"),
  rotationValue: document.querySelector("#environmentRotationValue"),
  roughness: document.querySelector("#environmentRoughness"),
  roughnessValue: document.querySelector("#environmentRoughnessValue"),
  ior: document.querySelector("#environmentIor"),
  iorValue: document.querySelector("#environmentIorValue"),
  operation: document.querySelector("#environmentOperation"),
  fresnel: document.querySelector("#environmentFresnel"),
  direction: document.querySelector("#environmentDirection"),
};

function createFaceCanvas(definition) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, definition.colors[0]);
  gradient.addColorStop(1, definition.colors[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  for (let position = 0; position <= 256; position += 32) {
    ctx.beginPath();
    ctx.moveTo(position, 0);
    ctx.lineTo(position, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, position);
    ctx.lineTo(256, position);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(8, 13, 14, 0.52)";
  ctx.fillRect(54, 72, 148, 112);
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.strokeRect(54, 72, 148, 112);
  ctx.fillStyle = "#f7fffc";
  ctx.textAlign = "center";
  ctx.font = "800 52px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(definition.label, 128, 139);
  ctx.font = "700 15px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("CUBE MAP", 128, 166);
  return canvas;
}

class EnvironmentRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2", { alpha: false, antialias: true, preserveDrawingBuffer: true });
    if (!this.gl) {
      throw new Error("当前浏览器不支持 WebGL2。");
    }

    const gl = this.gl;
    this.program = createProgram(gl, vertexSource, fragmentSource);
    this.locations = {
      position: gl.getAttribLocation(this.program, "position"),
      environment: gl.getUniformLocation(this.program, "uEnvironment"),
      resolution: gl.getUniformLocation(this.program, "uResolution"),
      rotation: gl.getUniformLocation(this.program, "uRotation"),
      roughness: gl.getUniformLocation(this.program, "uRoughness"),
      ior: gl.getUniformLocation(this.program, "uIor"),
      mode: gl.getUniformLocation(this.program, "uMode"),
    };
    this.mesh = createFullscreenTriangle(gl, this.locations.position);
    this.initCubeMap();
  }

  initCubeMap() {
    const gl = this.gl;
    this.cubeMap = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubeMap);
    faceDefinitions.forEach((face) => {
      gl.texImage2D(
        gl[`TEXTURE_CUBE_MAP_${face.target}`],
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        createFaceCanvas(face),
      );
    });
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  }

  render(nextState) {
    const gl = this.gl;
    const { width, height } = resizeCanvasToDisplaySize(this.canvas);

    gl.viewport(0, 0, width, height);
    gl.useProgram(this.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubeMap);
    gl.uniform1i(this.locations.environment, 0);
    gl.uniform2f(this.locations.resolution, width, height);
    gl.uniform1f(this.locations.rotation, (nextState.rotation * Math.PI) / 180);
    gl.uniform1f(this.locations.roughness, nextState.roughness / 100);
    gl.uniform1f(this.locations.ior, nextState.ior / 100);
    gl.uniform1i(this.locations.mode, nextState.mode);
    this.mesh.draw();
  }
}

function showWebglError(message) {
  ui.section?.classList.add("is-unavailable");
  const fallback = document.createElement("p");
  fallback.className = "webgl-fallback";
  fallback.textContent = `环境映射实验无法启动：${message}`;
  ui.canvas?.closest(".viewport-panel")?.prepend(fallback);
}

export function initEnvironmentMappingLab() {
  if (!ui.canvas || !ui.mode) {
    return;
  }

  let renderer;
  try {
    renderer = new EnvironmentRenderer(ui.canvas);
  } catch (error) {
    showWebglError(error.message);
    return;
  }

  let frame = 0;
  const render = () => {
    frame = 0;
    renderer.render(state);
    const ior = state.ior / 100;
    const f0 = ((ior - 1) / (ior + 1)) ** 2;
    const operations = ["reflect(I, N)", "refract(I, N, η)", "mix(refract, reflect, F)"];
    ui.rotationValue.value = `${state.rotation}°`;
    ui.roughnessValue.value = `${state.roughness}%`;
    ui.iorValue.value = ior.toFixed(2);
    ui.operation.textContent = operations[state.mode];
    ui.fresnel.textContent = `${(f0 * 100).toFixed(1)}%`;
    ui.direction.textContent = "samplerCube(direction)";
  };
  const scheduleRender = () => {
    if (!frame) {
      frame = window.requestAnimationFrame(render);
    }
  };

  ui.mode.addEventListener("change", () => {
    state.mode = Number(ui.mode.value);
    scheduleRender();
  });
  ui.rotation.addEventListener("input", () => {
    state.rotation = Number(ui.rotation.value);
    scheduleRender();
  });
  ui.roughness.addEventListener("input", () => {
    state.roughness = Number(ui.roughness.value);
    scheduleRender();
  });
  ui.ior.addEventListener("input", () => {
    state.ior = Number(ui.ior.value);
    scheduleRender();
  });
  window.addEventListener("resize", scheduleRender);
  render();
}
