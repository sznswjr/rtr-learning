import {
  createOrbitCamera,
  createOrthographicMatrix,
  multiplyMat4,
} from "../../render/camera.js?v=20260803-3";
import { createCubeGeometry, createIndexedMesh } from "../../render/mesh.js?v=20260803-3";
import {
  createRotationXMatrix,
  createRotationYMatrix,
  createTranslationMatrix,
  transformPoint,
} from "../../render/transforms.js?v=20260803-3";
import { createProgram, resizeCanvasToDisplaySize } from "../../render/webgl.js?v=20260803-3";

const cubeVertexSource = `#version 300 es
in vec3 position;
in vec3 normal;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

out vec3 vNormal;
out vec3 vWorldPosition;

void main() {
  vec4 worldPosition = uModel * vec4(position, 1.0);
  vNormal = mat3(uModel) * normal;
  vWorldPosition = worldPosition.xyz;
  gl_Position = uProjection * uView * worldPosition;
}`;

const cubeFragmentSource = `#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vWorldPosition;
out vec4 outColor;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDirection = normalize(vec3(0.45, 0.82, 0.38));
  float diffuse = max(dot(normal, lightDirection), 0.0);
  float hemisphere = normal.y * 0.5 + 0.5;
  vec3 base = mix(vec3(0.08, 0.34, 0.36), vec3(0.20, 0.82, 0.66), hemisphere);
  base += abs(normal) * vec3(0.05, 0.035, 0.075);
  float originGlow = exp(-0.22 * dot(vWorldPosition, vWorldPosition));
  vec3 color = base * (0.27 + diffuse * 0.73) + originGlow * vec3(0.025, 0.06, 0.05);
  outColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
}`;

const lineVertexSource = `#version 300 es
in vec3 position;
in vec3 color;

uniform mat4 uMatrix;
uniform float uPointSize;

out vec3 vColor;

void main() {
  vColor = color;
  gl_PointSize = uPointSize;
  gl_Position = uMatrix * vec4(position, 1.0);
}`;

const lineFragmentSource = `#version 300 es
precision highp float;

in vec3 vColor;
out vec4 outColor;

void main() {
  outColor = vec4(pow(vColor, vec3(1.0 / 2.2)), 1.0);
}`;

const modelVertices = [
  [-0.7, -0.7, -0.7],
  [0.7, -0.7, -0.7],
  [-0.7, 0.7, -0.7],
  [0.7, 0.7, -0.7],
  [-0.7, -0.7, 0.7],
  [0.7, -0.7, 0.7],
  [-0.7, 0.7, 0.7],
  [0.7, 0.7, 0.7],
];

const state = {
  camera: -32,
  fov: 56,
  projection: "perspective",
  rotation: 28,
  stage: "ndc",
  translation: 58,
  vertex: 7,
};

const ui = {
  camera: document.querySelector("#transformCamera"),
  cameraValue: document.querySelector("#transformCameraValue"),
  canvas: document.querySelector("#coordinateTransformCanvas"),
  clipW: document.querySelector("#transformClipW"),
  coordinateModel: document.querySelector("#coordinateModel"),
  coordinateNdc: document.querySelector("#coordinateNdc"),
  coordinateView: document.querySelector("#coordinateView"),
  coordinateWorld: document.querySelector("#coordinateWorld"),
  fov: document.querySelector("#transformFov"),
  fovValue: document.querySelector("#transformFovValue"),
  projection: document.querySelector("#transformProjection"),
  rotation: document.querySelector("#transformRotation"),
  rotationValue: document.querySelector("#transformRotationValue"),
  section: document.querySelector("#coordinate-transforms"),
  stage: document.querySelector("#transformStage"),
  trace: document.querySelector(".coordinate-trace"),
  translation: document.querySelector("#transformTranslation"),
  translationValue: document.querySelector("#transformTranslationValue"),
  vertex: document.querySelector("#transformVertex"),
  visibility: document.querySelector("#transformVisibility"),
};

function createWorldLines() {
  const positions = [];
  const colors = [];
  const indices = [];
  const pushLine = (start, end, color) => {
    const offset = positions.length / 3;
    positions.push(...start, ...end);
    colors.push(...color, ...color);
    indices.push(offset, offset + 1);
  };

  for (let step = -10; step <= 10; step += 1) {
    const coordinate = step * 0.4;
    const major = step === 0 || step % 5 === 0;
    const color = major ? [0.16, 0.31, 0.29] : [0.075, 0.13, 0.13];
    pushLine([-4, 0, coordinate], [4, 0, coordinate], color);
    pushLine([coordinate, 0, -4], [coordinate, 0, 4], color);
  }

  pushLine([0, 0.008, 0], [1.6, 0.008, 0], [0.92, 0.30, 0.27]);
  pushLine([0, 0.008, 0], [0, 1.6, 0], [0.26, 0.86, 0.48]);
  pushLine([0, 0.008, 0], [0, 0.008, 1.6], [0.24, 0.61, 0.94]);

  return {
    colors: new Float32Array(colors),
    indices: new Uint16Array(indices),
    positions: new Float32Array(positions),
  };
}

class CoordinateRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2", { alpha: false, antialias: true, preserveDrawingBuffer: true });
    if (!this.gl) {
      throw new Error("当前浏览器不支持 WebGL2。");
    }

    const gl = this.gl;
    this.cubeProgram = createProgram(gl, cubeVertexSource, cubeFragmentSource);
    this.lineProgram = createProgram(gl, lineVertexSource, lineFragmentSource);
    this.cubeLocations = {
      model: gl.getUniformLocation(this.cubeProgram, "uModel"),
      normal: gl.getAttribLocation(this.cubeProgram, "normal"),
      position: gl.getAttribLocation(this.cubeProgram, "position"),
      projection: gl.getUniformLocation(this.cubeProgram, "uProjection"),
      view: gl.getUniformLocation(this.cubeProgram, "uView"),
    };
    this.lineLocations = {
      color: gl.getAttribLocation(this.lineProgram, "color"),
      matrix: gl.getUniformLocation(this.lineProgram, "uMatrix"),
      pointSize: gl.getUniformLocation(this.lineProgram, "uPointSize"),
      position: gl.getAttribLocation(this.lineProgram, "position"),
    };

    const cube = createCubeGeometry(1.4);
    this.cube = createIndexedMesh(gl, {
      attributes: [
        { data: cube.positions, location: this.cubeLocations.position, size: 3 },
        { data: cube.normals, location: this.cubeLocations.normal, size: 3 },
      ],
      indices: cube.indices,
    });

    const lines = createWorldLines();
    this.lines = createIndexedMesh(gl, {
      attributes: [
        { data: lines.positions, location: this.lineLocations.position, size: 3 },
        { data: lines.colors, location: this.lineLocations.color, size: 3 },
      ],
      indices: lines.indices,
      mode: gl.LINES,
    });
    this.initPoint();
  }

  initPoint() {
    const gl = this.gl;
    this.pointVao = gl.createVertexArray();
    this.pointBuffer = gl.createBuffer();
    gl.bindVertexArray(this.pointVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 12, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.lineLocations.position);
    gl.vertexAttribPointer(this.lineLocations.position, 3, gl.FLOAT, false, 0, 0);
    gl.disableVertexAttribArray(this.lineLocations.color);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  render(nextState) {
    const gl = this.gl;
    const { width, height } = resizeCanvasToDisplaySize(this.canvas);
    const aspect = width / Math.max(height, 1);
    const rotationX = createRotationXMatrix(-0.28);
    const rotationY = createRotationYMatrix((nextState.rotation * Math.PI) / 180);
    const translation = createTranslationMatrix(nextState.translation / 100, 0.72, 0);
    const model = multiplyMat4(translation, multiplyMat4(rotationY, rotationX));
    const camera = createOrbitCamera({
      aspect,
      distance: 5.8,
      far: 40,
      fovY: (nextState.fov * Math.PI) / 180,
      near: 0.1,
      pitch: 0.34,
      target: [0, 0.45, 0],
      yaw: (nextState.camera * Math.PI) / 180,
    });
    const orthographicHalfHeight = 2.15 + ((nextState.fov - 30) / 70) * 1.35;
    const projection = nextState.projection === "orthographic"
      ? createOrthographicMatrix(
          -orthographicHalfHeight * aspect,
          orthographicHalfHeight * aspect,
          -orthographicHalfHeight,
          orthographicHalfHeight,
          0.1,
          40,
        )
      : camera.projection;
    const viewProjection = multiplyMat4(projection, camera.view);

    const modelPoint = [...modelVertices[nextState.vertex], 1];
    const worldPoint = transformPoint(model, modelPoint);
    const viewPoint = transformPoint(camera.view, worldPoint);
    const clipPoint = transformPoint(projection, viewPoint);
    const safeW = Math.abs(clipPoint[3]) > Number.EPSILON ? clipPoint[3] : Number.EPSILON;
    const ndcPoint = clipPoint.map((value, index) => index < 3 ? value / safeW : value);

    gl.viewport(0, 0, width, height);
    gl.clearColor(0.025, 0.043, 0.046, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gl.useProgram(this.lineProgram);
    gl.uniformMatrix4fv(this.lineLocations.matrix, false, viewProjection);
    gl.uniform1f(this.lineLocations.pointSize, 1);
    this.lines.draw();

    gl.useProgram(this.cubeProgram);
    gl.uniformMatrix4fv(this.cubeLocations.model, false, model);
    gl.uniformMatrix4fv(this.cubeLocations.view, false, camera.view);
    gl.uniformMatrix4fv(this.cubeLocations.projection, false, projection);
    this.cube.draw();

    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(this.lineProgram);
    gl.uniformMatrix4fv(this.lineLocations.matrix, false, viewProjection);
    gl.uniform1f(this.lineLocations.pointSize, Math.min(18, 11 * (window.devicePixelRatio || 1)));
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(worldPoint.slice(0, 3)));
    gl.bindVertexArray(this.pointVao);
    gl.vertexAttrib3f(this.lineLocations.color, 1.0, 0.72, 0.18);
    gl.drawArrays(gl.POINTS, 0, 1);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return { clipPoint, modelPoint, ndcPoint, viewPoint, worldPoint };
  }
}

function showWebglError(message) {
  ui.section?.classList.add("is-unavailable");
  const fallback = document.createElement("p");
  fallback.className = "webgl-fallback";
  fallback.textContent = `坐标变换实验无法启动：${message}`;
  ui.canvas?.closest(".viewport-panel")?.prepend(fallback);
}

function formatCoordinate(point) {
  return `(${point.slice(0, 3).map((value) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}`).join(", ")})`;
}

export function initCoordinateTransformsLab() {
  if (!ui.canvas || !ui.stage) {
    return;
  }

  let renderer;
  try {
    renderer = new CoordinateRenderer(ui.canvas);
  } catch (error) {
    showWebglError(error.message);
    return;
  }

  let frame = 0;
  const render = () => {
    frame = 0;
    const coordinates = renderer.render(state);
    const inside = coordinates.clipPoint[3] > 0 && coordinates.ndcPoint.slice(0, 3).every((value) => Math.abs(value) <= 1);
    ui.rotationValue.value = `${state.rotation}°`;
    ui.translationValue.value = (state.translation / 100).toFixed(2);
    ui.cameraValue.value = `${state.camera}°`;
    ui.fovValue.value = state.projection === "perspective"
      ? `${state.fov}°`
      : `${(2.15 + ((state.fov - 30) / 70) * 1.35).toFixed(2)} 高`;
    ui.coordinateModel.textContent = formatCoordinate(coordinates.modelPoint);
    ui.coordinateWorld.textContent = formatCoordinate(coordinates.worldPoint);
    ui.coordinateView.textContent = formatCoordinate(coordinates.viewPoint);
    ui.coordinateNdc.textContent = formatCoordinate(coordinates.ndcPoint);
    ui.clipW.textContent = coordinates.clipPoint[3].toFixed(2);
    ui.visibility.textContent = inside ? "NDC 内" : "视锥外";
    ui.visibility.classList.toggle("is-warning", !inside);
    ui.trace.querySelectorAll("[data-space]").forEach((card) => {
      card.classList.toggle("is-active", card.dataset.space === state.stage);
    });
    ui.canvas.dataset.space = state.stage;
  };
  const scheduleRender = () => {
    if (!frame) {
      frame = window.requestAnimationFrame(render);
    }
  };

  const inputs = [
    [ui.stage, "change", "stage", String],
    [ui.projection, "change", "projection", String],
    [ui.rotation, "input", "rotation", Number],
    [ui.translation, "input", "translation", Number],
    [ui.camera, "input", "camera", Number],
    [ui.fov, "input", "fov", Number],
    [ui.vertex, "change", "vertex", Number],
  ];
  inputs.forEach(([element, eventName, key, convert]) => {
    element.addEventListener(eventName, () => {
      state[key] = convert(element.value);
      scheduleRender();
    });
  });

  window.addEventListener("resize", scheduleRender);
  render();
}
