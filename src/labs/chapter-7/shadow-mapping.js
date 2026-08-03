import {
  createLookAtMatrix,
  createOrbitCamera,
  createOrthographicMatrix,
  multiplyMat4,
} from "../../render/camera.js?v=20260803-8";
import { createDepthTarget } from "../../render/framebuffer.js?v=20260803-8";
import { createCubeGeometry, createIndexedMesh, createPlaneGeometry } from "../../render/mesh.js?v=20260803-8";
import {
  createIdentityMatrix,
  createRotationYMatrix,
  createScaleMatrix,
  createTranslationMatrix,
} from "../../render/transforms.js?v=20260803-8";
import { createProgram, resizeCanvasToDisplaySize } from "../../render/webgl.js?v=20260803-8";

const depthVertexSource = `#version 300 es
in vec3 position;
uniform mat4 uLightMatrix;
uniform mat4 uModel;

void main() {
  gl_Position = uLightMatrix * uModel * vec4(position, 1.0);
}`;

const depthFragmentSource = `#version 300 es
precision highp float;
void main() {}
`;

const sceneVertexSource = `#version 300 es
in vec3 position;
in vec3 normal;

uniform mat4 uModel;
uniform mat4 uViewProjection;
uniform mat4 uLightMatrix;

out vec3 vNormal;
out vec4 vLightClip;
out vec3 vWorldPosition;

void main() {
  vec4 world = uModel * vec4(position, 1.0);
  vNormal = mat3(uModel) * normal;
  vWorldPosition = world.xyz;
  vLightClip = uLightMatrix * world;
  gl_Position = uViewProjection * world;
}`;

const sceneFragmentSource = `#version 300 es
precision highp float;

uniform sampler2D uShadowMap;
uniform vec2 uShadowTexel;
uniform vec3 uLightDirection;
uniform vec3 uObjectColor;
uniform float uBias;
uniform float uSlopeBias;
uniform int uKernelRadius;
uniform int uMode;

in vec3 vNormal;
in vec4 vLightClip;
in vec3 vWorldPosition;
out vec4 outColor;

float sampleShadow(vec3 projected, float bias) {
  if (projected.z <= 0.0 || projected.z >= 1.0 || any(lessThan(projected.xy, vec2(0.0))) || any(greaterThan(projected.xy, vec2(1.0)))) {
    return 1.0;
  }
  float lit = 0.0;
  float samples = 0.0;
  for (int y = -2; y <= 2; y += 1) {
    for (int x = -2; x <= 2; x += 1) {
      if (abs(x) > uKernelRadius || abs(y) > uKernelRadius) {
        continue;
      }
      float storedDepth = texture(uShadowMap, projected.xy + vec2(x, y) * uShadowTexel).r;
      lit += projected.z - bias <= storedDepth ? 1.0 : 0.0;
      samples += 1.0;
    }
  }
  return lit / max(samples, 1.0);
}

void main() {
  vec3 normal = normalize(vNormal);
  float nDotL = max(dot(normal, uLightDirection), 0.0);
  vec3 projected = vLightClip.xyz / max(vLightClip.w, 0.0001) * 0.5 + 0.5;
  float bias = uBias + uSlopeBias * (1.0 - nDotL);
  float shadow = sampleShadow(projected, bias);

  if (uMode == 1) {
    vec3 shadowColor = mix(vec3(0.08, 0.12, 0.13), vec3(0.35, 0.95, 0.72), shadow);
    outColor = vec4(pow(shadowColor, vec3(1.0 / 2.2)), 1.0);
    return;
  }
  if (uMode == 2) {
    float storedDepth = texture(uShadowMap, projected.xy).r;
    float depthView = clamp((1.0 - storedDepth) * 3.4, 0.0, 1.0);
    outColor = vec4(vec3(pow(depthView, 1.0 / 2.2)), 1.0);
    return;
  }

  float checker = mod(floor(vWorldPosition.x * 2.0) + floor(vWorldPosition.z * 2.0), 2.0);
  vec3 albedo = mix(uObjectColor, uObjectColor * 0.78, checker * step(abs(normal.y), 0.99));
  vec3 ambient = albedo * 0.16;
  vec3 direct = albedo * (0.18 + nDotL * 0.82) * mix(0.22, 1.0, shadow);
  vec3 color = ambient + direct;
  outColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
}`;

const state = {
  bias: 18,
  kernel: 1,
  light: 42,
  mode: "shaded",
  resolution: 512,
  slope: 20,
};

const ui = {
  bias: document.querySelector("#shadowBias"),
  biasValue: document.querySelector("#shadowBiasValue"),
  canvas: document.querySelector("#shadowMappingCanvas"),
  compare: document.querySelector("#shadowCompare"),
  kernel: document.querySelector("#shadowKernel"),
  light: document.querySelector("#shadowLight"),
  lightValue: document.querySelector("#shadowLightValue"),
  mode: document.querySelector("#shadowMode"),
  resolution: document.querySelector("#shadowResolution"),
  samples: document.querySelector("#shadowSamples"),
  section: document.querySelector("#shadow-mapping"),
  slope: document.querySelector("#shadowSlope"),
  slopeValue: document.querySelector("#shadowSlopeValue"),
  texels: document.querySelector("#shadowTexels"),
};

function createSceneMesh(gl, geometry, locations) {
  return createIndexedMesh(gl, {
    attributes: [
      { data: geometry.positions, location: locations.position, size: 3 },
      { data: geometry.normals, location: locations.normal, size: 3 },
    ],
    indices: geometry.indices,
  });
}

class ShadowRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2", { alpha: false, antialias: true, preserveDrawingBuffer: true });
    if (!this.gl) {
      throw new Error("当前浏览器不支持 WebGL2。");
    }

    const gl = this.gl;
    this.depthProgram = createProgram(gl, depthVertexSource, depthFragmentSource);
    this.sceneProgram = createProgram(gl, sceneVertexSource, sceneFragmentSource);
    this.depthLocations = {
      lightMatrix: gl.getUniformLocation(this.depthProgram, "uLightMatrix"),
      model: gl.getUniformLocation(this.depthProgram, "uModel"),
      position: gl.getAttribLocation(this.depthProgram, "position"),
    };
    this.sceneLocations = {
      bias: gl.getUniformLocation(this.sceneProgram, "uBias"),
      color: gl.getUniformLocation(this.sceneProgram, "uObjectColor"),
      kernel: gl.getUniformLocation(this.sceneProgram, "uKernelRadius"),
      lightDirection: gl.getUniformLocation(this.sceneProgram, "uLightDirection"),
      lightMatrix: gl.getUniformLocation(this.sceneProgram, "uLightMatrix"),
      mode: gl.getUniformLocation(this.sceneProgram, "uMode"),
      model: gl.getUniformLocation(this.sceneProgram, "uModel"),
      normal: gl.getAttribLocation(this.sceneProgram, "normal"),
      position: gl.getAttribLocation(this.sceneProgram, "position"),
      shadowMap: gl.getUniformLocation(this.sceneProgram, "uShadowMap"),
      shadowTexel: gl.getUniformLocation(this.sceneProgram, "uShadowTexel"),
      slopeBias: gl.getUniformLocation(this.sceneProgram, "uSlopeBias"),
      viewProjection: gl.getUniformLocation(this.sceneProgram, "uViewProjection"),
    };

    const cubeGeometry = createCubeGeometry(1.4);
    const planeGeometry = createPlaneGeometry(8);
    this.depthCube = createIndexedMesh(gl, {
      attributes: [{ data: cubeGeometry.positions, location: this.depthLocations.position, size: 3 }],
      indices: cubeGeometry.indices,
    });
    this.depthPlane = createIndexedMesh(gl, {
      attributes: [{ data: planeGeometry.positions, location: this.depthLocations.position, size: 3 }],
      indices: planeGeometry.indices,
    });
    this.sceneCube = createSceneMesh(gl, cubeGeometry, this.sceneLocations);
    this.scenePlane = createSceneMesh(gl, planeGeometry, this.sceneLocations);
    this.depthTarget = createDepthTarget(gl, { height: state.resolution, label: "shadow map", width: state.resolution });
    this.models = [
      { color: [0.18, 0.72, 0.62], depthMesh: this.depthPlane, mesh: this.scenePlane, model: createIdentityMatrix() },
      {
        color: [0.22, 0.74, 0.68],
        depthMesh: this.depthCube,
        mesh: this.sceneCube,
        model: multiplyMat4(createTranslationMatrix(-0.55, 0.72, 0.12), createRotationYMatrix(0.42)),
      },
      {
        color: [0.75, 0.47, 0.22],
        depthMesh: this.depthCube,
        mesh: this.sceneCube,
        model: multiplyMat4(
          createTranslationMatrix(1.05, 0.48, -0.85),
          multiplyMat4(createRotationYMatrix(-0.58), createScaleMatrix(0.68)),
        ),
      },
    ];
  }

  render(nextState) {
    const gl = this.gl;
    const { width, height } = resizeCanvasToDisplaySize(this.canvas);
    if (this.depthTarget.width !== nextState.resolution) {
      this.depthTarget.resize(nextState.resolution, nextState.resolution);
    }

    const angle = (nextState.light * Math.PI) / 180;
    const lightPosition = [Math.sin(angle) * 4.7, 5.4, Math.cos(angle) * 4.7];
    const lightLength = Math.hypot(...lightPosition);
    const lightDirection = lightPosition.map((value) => value / lightLength);
    const lightView = createLookAtMatrix(lightPosition, [0, 0.25, 0]);
    const lightProjection = createOrthographicMatrix(-3.7, 3.7, -3.7, 3.7, 0.1, 14);
    const lightMatrix = multiplyMat4(lightProjection, lightView);
    const camera = createOrbitCamera({
      aspect: width / Math.max(height, 1),
      distance: 6.3,
      far: 30,
      fovY: Math.PI / 3.25,
      pitch: 0.5,
      target: [0, 0.45, 0],
      yaw: -0.72,
    });

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthTarget.framebuffer);
    gl.viewport(0, 0, nextState.resolution, nextState.resolution);
    gl.clearDepth(1);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.depthProgram);
    gl.uniformMatrix4fv(this.depthLocations.lightMatrix, false, lightMatrix);
    this.models.forEach(({ depthMesh, model }) => {
      gl.uniformMatrix4fv(this.depthLocations.model, false, model);
      depthMesh.draw();
    });

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.drawBuffers([gl.BACK]);
    gl.viewport(0, 0, width, height);
    gl.clearColor(0.018, 0.032, 0.034, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.sceneProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.depthTarget.depth);
    gl.uniform1i(this.sceneLocations.shadowMap, 0);
    gl.uniform2f(this.sceneLocations.shadowTexel, 1 / nextState.resolution, 1 / nextState.resolution);
    gl.uniform3fv(this.sceneLocations.lightDirection, lightDirection);
    gl.uniformMatrix4fv(this.sceneLocations.lightMatrix, false, lightMatrix);
    gl.uniformMatrix4fv(this.sceneLocations.viewProjection, false, camera.viewProjection);
    gl.uniform1f(this.sceneLocations.bias, nextState.bias * 0.00012);
    gl.uniform1f(this.sceneLocations.slopeBias, nextState.slope * 0.0003);
    gl.uniform1i(this.sceneLocations.kernel, nextState.kernel);
    gl.uniform1i(this.sceneLocations.mode, { shaded: 0, factor: 1, depth: 2 }[nextState.mode]);
    this.models.forEach(({ color, mesh, model }) => {
      gl.uniform3fv(this.sceneLocations.color, color);
      gl.uniformMatrix4fv(this.sceneLocations.model, false, model);
      mesh.draw();
    });
  }
}

function showWebglError(message) {
  ui.section?.classList.add("is-unavailable");
  const fallback = document.createElement("p");
  fallback.className = "webgl-fallback";
  fallback.textContent = `阴影贴图实验无法启动：${message}`;
  ui.canvas?.closest(".viewport-panel")?.prepend(fallback);
}

export function initShadowMappingLab() {
  if (!ui.canvas || !ui.mode) {
    return;
  }

  let renderer;
  try {
    renderer = new ShadowRenderer(ui.canvas);
  } catch (error) {
    showWebglError(error.message);
    return;
  }

  let frame = 0;
  const render = () => {
    frame = 0;
    renderer.render(state);
    const sampleCount = (state.kernel * 2 + 1) ** 2;
    ui.biasValue.value = (state.bias * 0.00012).toFixed(4);
    ui.slopeValue.value = (state.slope * 0.0003).toFixed(4);
    ui.lightValue.value = `${state.light}°`;
    ui.texels.textContent = (state.resolution ** 2).toLocaleString("zh-CN");
    ui.compare.textContent = "z − bias ≤ depth";
    ui.samples.textContent = `${sampleCount} 次`;
  };
  const scheduleRender = () => {
    if (!frame) {
      frame = window.requestAnimationFrame(render);
    }
  };

  const bindings = [
    [ui.mode, "change", "mode", String],
    [ui.resolution, "change", "resolution", Number],
    [ui.bias, "input", "bias", Number],
    [ui.slope, "input", "slope", Number],
    [ui.kernel, "change", "kernel", Number],
    [ui.light, "input", "light", Number],
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
