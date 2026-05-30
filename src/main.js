const TAU = Math.PI * 2;

const vertexSource = `#version 300 es
in vec2 position;
in vec3 color;

uniform float uRotation;
uniform float uScale;
uniform vec2 uOffset;

out vec3 vColor;

void main() {
  float s = sin(uRotation);
  float c = cos(uRotation);
  mat2 rot = mat2(c, s, -s, c);
  vec2 p = rot * (position * uScale) + uOffset;
  gl_Position = vec4(p, 0.0, 1.0);
  vColor = color;
}`;

const fragmentSource = `#version 300 es
precision highp float;

in vec3 vColor;
out vec4 outColor;

void main() {
  outColor = vec4(vColor, 1.0);
}`;

const presentVertexSource = `#version 300 es
in vec2 position;
out vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const presentFragmentSource = `#version 300 es
precision highp float;

uniform sampler2D uTexture;
in vec2 vUv;
out vec4 outColor;

void main() {
  outColor = texture(uTexture, vUv);
}`;

const triangleData = new Float32Array([
  -0.86, -0.62, 1.0, 0.28, 0.16,
  0.78, -0.52, 1.0, 0.82, 0.25,
  -0.19, 0.72, 0.35, 0.98, 0.83,
]);

const quadData = new Float32Array([
  -1, -1,
  1, -1,
  -1, 1,
  1, 1,
]);

const state = {
  rotation: 12,
  renderResolution: 35,
  scale: 58,
  samples: 4,
};

const samplingState = {
  edgeAngle: 28,
  edgeOffset: 0,
  pattern: "grid",
  sampleCount: 4,
  seed: 7,
};

const shadingState = {
  model: "gooch",
  lightAngle: -42,
  surfaceHue: 176,
  highlightStrength: 58,
};

const attenuationState = {
  distance: 116,
  radius: 28,
  range: 300,
};

const frequencyState = {
  lightAngle: -54,
  bands: 7,
};

const transparencyState = {
  alpha: 56,
  order: "blueFirst",
  bias: 54,
};

const encodingState = {
  gamma: 220,
  contrast: 100,
};

const patternLabels = {
  center: "中心点",
  grid: "规则网格",
  rotatedGrid: "旋转网格",
  nrooks: "N-Rooks",
  stratified: "分层随机",
  poisson: "Poisson 分布",
};

const poissonSamples = [
  [0.5, 0.5],
  [0.28, 0.32],
  [0.72, 0.68],
  [0.33, 0.74],
  [0.76, 0.27],
  [0.18, 0.57],
  [0.57, 0.17],
  [0.88, 0.51],
  [0.49, 0.87],
  [0.12, 0.18],
  [0.39, 0.48],
  [0.63, 0.43],
  [0.22, 0.86],
  [0.84, 0.82],
  [0.08, 0.42],
  [0.93, 0.12],
];

const ui = {
  gpuStatus: document.querySelector("#gpuStatus"),
  rotation: document.querySelector("#rotation"),
  rotationValue: document.querySelector("#rotationValue"),
  scale: document.querySelector("#scale"),
  scaleValue: document.querySelector("#scaleValue"),
  renderResolution: document.querySelector("#renderResolution"),
  renderResolutionValue: document.querySelector("#renderResolutionValue"),
  samples: document.querySelector("#samples"),
  basePixels: document.querySelector("#basePixels"),
  ssaaPixels: document.querySelector("#ssaaPixels"),
  maxSamples: document.querySelector("#maxSamples"),
  ssaaLabel: document.querySelector("#ssaaLabel"),
  msaaLabel: document.querySelector("#msaaLabel"),
  samplePattern: document.querySelector("#samplePattern"),
  sampleCount: document.querySelector("#sampleCount"),
  edgeAngle: document.querySelector("#edgeAngle"),
  edgeAngleValue: document.querySelector("#edgeAngleValue"),
  edgeOffset: document.querySelector("#edgeOffset"),
  edgeOffsetValue: document.querySelector("#edgeOffsetValue"),
  sampleSeed: document.querySelector("#sampleSeed"),
  sampleSeedValue: document.querySelector("#sampleSeedValue"),
  activePatternLabel: document.querySelector("#activePatternLabel"),
  coveredSamples: document.querySelector("#coveredSamples"),
  averageCoverage: document.querySelector("#averageCoverage"),
  samplingPatternLabel: document.querySelector("#samplingPatternLabel"),
  samplingCoverageLabel: document.querySelector("#samplingCoverageLabel"),
  samplingPatternCanvas: document.querySelector("#samplingPatternCanvas"),
  samplingCoverageCanvas: document.querySelector("#samplingCoverageCanvas"),
  shadingModel: document.querySelector("#shadingModel"),
  lightAngle: document.querySelector("#lightAngle"),
  lightAngleValue: document.querySelector("#lightAngleValue"),
  surfaceHue: document.querySelector("#surfaceHue"),
  surfaceHueValue: document.querySelector("#surfaceHueValue"),
  highlightStrength: document.querySelector("#highlightStrength"),
  highlightStrengthValue: document.querySelector("#highlightStrengthValue"),
  normalDotLight: document.querySelector("#normalDotLight"),
  shadingOperation: document.querySelector("#shadingOperation"),
  shadingModelLabel: document.querySelector("#shadingModelLabel"),
  shadingModelCanvas: document.querySelector("#shadingModelCanvas"),
  attenuationDistance: document.querySelector("#attenuationDistance"),
  attenuationDistanceValue: document.querySelector("#attenuationDistanceValue"),
  attenuationRadius: document.querySelector("#attenuationRadius"),
  attenuationRadiusValue: document.querySelector("#attenuationRadiusValue"),
  attenuationRange: document.querySelector("#attenuationRange"),
  attenuationRangeValue: document.querySelector("#attenuationRangeValue"),
  inverseSquareValue: document.querySelector("#inverseSquareValue"),
  windowValue: document.querySelector("#windowValue"),
  combinedAttenuationValue: document.querySelector("#combinedAttenuationValue"),
  lightAttenuationCanvas: document.querySelector("#lightAttenuationCanvas"),
  frequencyLightAngle: document.querySelector("#frequencyLightAngle"),
  frequencyLightAngleValue: document.querySelector("#frequencyLightAngleValue"),
  frequencyBands: document.querySelector("#frequencyBands"),
  frequencyBandsValue: document.querySelector("#frequencyBandsValue"),
  vertexFrequencyCount: document.querySelector("#vertexFrequencyCount"),
  objectFrequencyCanvas: document.querySelector("#objectFrequencyCanvas"),
  vertexFrequencyCanvas: document.querySelector("#vertexFrequencyCanvas"),
  pixelFrequencyCanvas: document.querySelector("#pixelFrequencyCanvas"),
  transparentAlpha: document.querySelector("#transparentAlpha"),
  transparentAlphaValue: document.querySelector("#transparentAlphaValue"),
  transparentOrder: document.querySelector("#transparentOrder"),
  transparentOrderLabel: document.querySelector("#transparentOrderLabel"),
  transparentOverlapAlpha: document.querySelector("#transparentOverlapAlpha"),
  oitBias: document.querySelector("#oitBias"),
  oitBiasValue: document.querySelector("#oitBiasValue"),
  transparencyCanvas: document.querySelector("#transparencyCanvas"),
  gammaValue: document.querySelector("#gammaValue"),
  gammaValueLabel: document.querySelector("#gammaValueLabel"),
  edgeContrast: document.querySelector("#edgeContrast"),
  edgeContrastValue: document.querySelector("#edgeContrastValue"),
  encodedMidtone: document.querySelector("#encodedMidtone"),
  displayEncodingCanvas: document.querySelector("#displayEncodingCanvas"),
};

class WebGlLabRenderer {
  constructor(canvas, mode) {
    this.canvas = canvas;
    this.mode = mode;
    this.gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
    });

    if (!this.gl) {
      throw new Error("WebGL2 is not supported by this browser.");
    }

    this.width = 0;
    this.height = 0;
    this.resources = {};
    this.initPrograms();
    this.initGeometry();
  }

  initPrograms() {
    const gl = this.gl;
    this.sceneProgram = createProgram(gl, vertexSource, fragmentSource);
    this.presentProgram = createProgram(gl, presentVertexSource, presentFragmentSource);

    this.sceneLocations = {
      position: gl.getAttribLocation(this.sceneProgram, "position"),
      color: gl.getAttribLocation(this.sceneProgram, "color"),
      rotation: gl.getUniformLocation(this.sceneProgram, "uRotation"),
      scale: gl.getUniformLocation(this.sceneProgram, "uScale"),
      offset: gl.getUniformLocation(this.sceneProgram, "uOffset"),
    };

    this.presentLocations = {
      position: gl.getAttribLocation(this.presentProgram, "position"),
      texture: gl.getUniformLocation(this.presentProgram, "uTexture"),
    };
  }

  initGeometry() {
    const gl = this.gl;
    this.triangleVao = gl.createVertexArray();
    this.triangleBuffer = gl.createBuffer();

    gl.bindVertexArray(this.triangleVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.triangleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangleData, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.sceneLocations.position);
    gl.vertexAttribPointer(this.sceneLocations.position, 2, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(this.sceneLocations.color);
    gl.vertexAttribPointer(this.sceneLocations.color, 3, gl.FLOAT, false, 20, 8);

    this.quadVao = gl.createVertexArray();
    this.quadBuffer = gl.createBuffer();
    gl.bindVertexArray(this.quadVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.presentLocations.position);
    gl.vertexAttribPointer(this.presentLocations.position, 2, gl.FLOAT, false, 8, 0);

    gl.bindVertexArray(null);
  }

  render(nextState) {
    this.resize(nextState);

    if (this.mode === "ssaa") {
      this.renderSsaa(nextState);
      return;
    }

    if (this.mode === "msaa") {
      this.renderMsaa(nextState);
      return;
    }

    this.renderScene(null, this.width, this.height, nextState);
  }

  resize(nextState) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resolutionScale = nextState.renderResolution / 100;
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width * dpr * resolutionScale));
    const height = Math.max(1, Math.round(rect.height * dpr * resolutionScale));

    if (this.width === width && this.height === height) {
      return;
    }

    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.deleteFrameResources();
  }

  renderScene(framebuffer, width, height, nextState) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, width, height);
    gl.disable(gl.BLEND);
    gl.clearColor(0.045, 0.052, 0.055, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.sceneProgram);
    gl.bindVertexArray(this.triangleVao);
    gl.uniform1f(this.sceneLocations.rotation, (nextState.rotation / 360) * TAU);
    gl.uniform1f(this.sceneLocations.scale, nextState.scale / 100);
    gl.uniform2f(this.sceneLocations.offset, 0.02, -0.02);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  renderSsaa(nextState) {
    const gl = this.gl;
    const scale = getSsaaScale(nextState.samples);
    const renderWidth = Math.max(1, Math.round(this.width * scale));
    const renderHeight = Math.max(1, Math.round(this.height * scale));
    const resources = this.ensureTextureFramebuffer("ssaa", renderWidth, renderHeight, gl.LINEAR);

    this.renderScene(resources.framebuffer, renderWidth, renderHeight, nextState);
    this.presentTexture(resources.texture);
  }

  renderMsaa(nextState) {
    const gl = this.gl;
    const samples = Math.max(1, Math.min(nextState.samples, getMaxSamples(gl)));
    const msaa = this.ensureMsaaFramebuffer(samples);
    const resolved = this.ensureTextureFramebuffer("msaaResolve", this.width, this.height, gl.NEAREST);

    this.renderScene(msaa.framebuffer, this.width, this.height, nextState);

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, msaa.framebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, resolved.framebuffer);
    gl.blitFramebuffer(
      0,
      0,
      this.width,
      this.height,
      0,
      0,
      this.width,
      this.height,
      gl.COLOR_BUFFER_BIT,
      gl.NEAREST,
    );

    this.presentTexture(resolved.texture);
  }

  presentTexture(texture) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0.045, 0.052, 0.055, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.presentProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(this.presentLocations.texture, 0);
    gl.bindVertexArray(this.quadVao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  ensureTextureFramebuffer(key, width, height, filter) {
    const cached = this.resources[key];
    if (cached && cached.width === width && cached.height === height && cached.filter === filter) {
      return cached;
    }

    if (cached) {
      this.deleteTextureFramebuffer(cached);
    }

    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, width, height);

    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    assertFramebuffer(gl, key);

    this.resources[key] = { framebuffer, filter, height, texture, width };
    return this.resources[key];
  }

  ensureMsaaFramebuffer(samples) {
    const cached = this.resources.msaa;
    if (
      cached &&
      cached.width === this.width &&
      cached.height === this.height &&
      cached.samples === samples
    ) {
      return cached;
    }

    if (cached) {
      const gl = this.gl;
      gl.deleteRenderbuffer(cached.renderbuffer);
      gl.deleteFramebuffer(cached.framebuffer);
    }

    const gl = this.gl;
    const renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, this.width, this.height);

    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, renderbuffer);
    assertFramebuffer(gl, "msaa");

    this.resources.msaa = {
      framebuffer,
      height: this.height,
      renderbuffer,
      samples,
      width: this.width,
    };
    return this.resources.msaa;
  }

  deleteFrameResources() {
    const gl = this.gl;
    for (const [key, resource] of Object.entries(this.resources)) {
      if (resource.texture) {
        this.deleteTextureFramebuffer(resource);
      }
      if (resource.renderbuffer) {
        gl.deleteRenderbuffer(resource.renderbuffer);
        gl.deleteFramebuffer(resource.framebuffer);
      }
      delete this.resources[key];
    }
  }

  deleteTextureFramebuffer(resource) {
    const gl = this.gl;
    gl.deleteTexture(resource.texture);
    gl.deleteFramebuffer(resource.framebuffer);
  }
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Unknown shader compile error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function createProgram(gl, vertex, fragment) {
  const program = gl.createProgram();
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertex);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragment);

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "Unknown program link error.";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

function assertFramebuffer(gl, label) {
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(`${label} framebuffer is incomplete: ${status}`);
  }
}

function getMaxSamples(gl) {
  return gl.getParameter(gl.MAX_SAMPLES) || 1;
}

function getSsaaScale(samples) {
  return samples === 2 ? Math.SQRT2 : Math.sqrt(samples);
}

function updateLabels(renderers) {
  const maxSamples = Math.min(...renderers.map((renderer) => getMaxSamples(renderer.gl)));
  const msaaSamples = Math.min(state.samples, maxSamples);
  const scale = getSsaaScale(state.samples);
  const base = renderers.find((renderer) => renderer.mode === "noaa");
  const ssaaWidth = Math.round((base?.width || 0) * scale);
  const ssaaHeight = Math.round((base?.height || 0) * scale);

  ui.rotationValue.value = `${state.rotation}°`;
  ui.scaleValue.value = `${state.scale}%`;
  ui.renderResolutionValue.value = `${state.renderResolution}%`;
  ui.ssaaLabel.textContent = `${state.samples}x supersampling`;
  ui.msaaLabel.textContent = `${msaaSamples}x multisampling`;
  ui.maxSamples.textContent = `${maxSamples}x`;
  ui.basePixels.textContent = base?.width && base?.height ? `${base.width} × ${base.height}` : "-";
  ui.ssaaPixels.textContent = ssaaWidth && ssaaHeight ? `${ssaaWidth} × ${ssaaHeight}` : "-";
}

function renderAll(renderers) {
  for (const renderer of renderers) {
    renderer.render(state);
  }
  updateLabels(renderers);
}

function initWebGlLab() {
  const renderers = [
    new WebGlLabRenderer(document.querySelector("#noaaCanvas"), "noaa"),
    new WebGlLabRenderer(document.querySelector("#ssaaCanvas"), "ssaa"),
    new WebGlLabRenderer(document.querySelector("#msaaCanvas"), "msaa"),
  ];

  ui.gpuStatus.textContent = "WebGL2 已启用";

  ui.rotation.addEventListener("input", () => {
    state.rotation = Number(ui.rotation.value);
    renderAll(renderers);
  });

  ui.scale.addEventListener("input", () => {
    state.scale = Number(ui.scale.value);
    renderAll(renderers);
  });

  ui.renderResolution.addEventListener("input", () => {
    state.renderResolution = Number(ui.renderResolution.value);
    renderAll(renderers);
  });

  ui.samples.addEventListener("change", () => {
    state.samples = Number(ui.samples.value);
    renderAll(renderers);
  });

  window.addEventListener("resize", () => renderAll(renderers));
  renderAll(renderers);
}

function getEffectiveSampleCount() {
  return samplingState.pattern === "center" ? 1 : samplingState.sampleCount;
}

function createGridSamples(count) {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const samples = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (samples.length >= count) {
        break;
      }
      samples.push([(col + 0.5) / cols, (row + 0.5) / rows]);
    }
  }

  return samples;
}

function createRotatedGridSamples(count) {
  if (count === 1) {
    return [[0.5, 0.5]];
  }

  const base = createGridSamples(count);
  const angle = 26.565 * (Math.PI / 180);
  const s = Math.sin(angle);
  const c = Math.cos(angle);
  const rotated = base.map(([x, y]) => {
    const dx = x - 0.5;
    const dy = y - 0.5;
    return [dx * c - dy * s + 0.5, dx * s + dy * c + 0.5];
  });

  const xs = rotated.map(([x]) => x);
  const ys = rotated.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  return rotated.map(([x, y]) => [
    0.14 + ((x - minX) / rangeX) * 0.72,
    0.14 + ((y - minY) / rangeY) * 0.72,
  ]);
}

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) {
    value += 2147483646;
  }

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function createStratifiedSamples(count, seed) {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const random = seededRandom(seed * 997 + count * 37);
  const samples = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (samples.length >= count) {
        break;
      }
      samples.push([(col + random()) / cols, (row + random()) / rows]);
    }
  }

  return samples;
}

function createNRooksSamples(count, seed) {
  if (count === 1) {
    return [[0.5, 0.5]];
  }

  const random = seededRandom(seed * 6151 + count * 101);
  const rows = Array.from({ length: count }, (_, index) => index);

  for (let index = rows.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [rows[index], rows[swapIndex]] = [rows[swapIndex], rows[index]];
  }

  return rows.map((row, col) => [
    (col + 0.5) / count,
    (row + 0.5) / count,
  ]);
}

function createPoissonSamples(count, seed) {
  const offset = seed % poissonSamples.length;
  return Array.from({ length: count }, (_, index) => poissonSamples[(index + offset) % poissonSamples.length]);
}

function getSamplingPositions() {
  const count = getEffectiveSampleCount();

  if (samplingState.pattern === "center") {
    return [[0.5, 0.5]];
  }

  if (samplingState.pattern === "rotatedGrid") {
    return createRotatedGridSamples(count);
  }

  if (samplingState.pattern === "stratified") {
    return createStratifiedSamples(count, samplingState.seed);
  }

  if (samplingState.pattern === "nrooks") {
    return createNRooksSamples(count, samplingState.seed);
  }

  if (samplingState.pattern === "poisson") {
    return createPoissonSamples(count, samplingState.seed);
  }

  return createGridSamples(count);
}

function getEdge() {
  const angle = samplingState.edgeAngle * (Math.PI / 180);
  const dir = [Math.cos(angle), Math.sin(angle)];
  return {
    normal: [-dir[1], dir[0]],
    offset: samplingState.edgeOffset / 100,
  };
}

function getSignedDistance(x, y, edge) {
  return (x - 0.5) * edge.normal[0] + (y - 0.5) * edge.normal[1] - edge.offset;
}

function isCovered(x, y, edge) {
  return getSignedDistance(x, y, edge) <= 0;
}

function clipPolygonToEdge(points, edge) {
  const clipped = [];

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const previous = points[(index + points.length - 1) % points.length];
    const currentInside = isCovered(current[0], current[1], edge);
    const previousInside = isCovered(previous[0], previous[1], edge);

    if (currentInside !== previousInside) {
      const previousDistance = getSignedDistance(previous[0], previous[1], edge);
      const currentDistance = getSignedDistance(current[0], current[1], edge);
      const t = previousDistance / (previousDistance - currentDistance);
      clipped.push([
        previous[0] + (current[0] - previous[0]) * t,
        previous[1] + (current[1] - previous[1]) * t,
      ]);
    }

    if (currentInside) {
      clipped.push(current);
    }
  }

  return clipped;
}

function prepareCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, height: rect.height, width: rect.width };
}

function drawPixelExperiment(canvas, samples, edge) {
  const { ctx, height, width } = prepareCanvas(canvas);
  const size = Math.min(width - 56, height - 70);
  const left = (width - size) * 0.5;
  const top = (height - size) * 0.5 + 12;
  const coveredPolygon = clipPolygonToEdge(
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    edge,
  );

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b0d0e";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#182324";
  ctx.fillRect(left, top, size, size);

  if (coveredPolygon.length > 0) {
    ctx.beginPath();
    coveredPolygon.forEach(([x, y], index) => {
      const px = left + x * size;
      const py = top + y * size;
      if (index === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    });
    ctx.closePath();
    ctx.fillStyle = "#d76f39";
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  for (let index = 1; index < 4; index += 1) {
    const x = left + (size * index) / 4;
    const y = top + (size * index) / 4;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + size);
    ctx.moveTo(left, y);
    ctx.lineTo(left + size, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(238, 244, 242, 0.9)";
  ctx.lineWidth = 2;
  ctx.strokeRect(left, top, size, size);

  const centerX = left + (0.5 + edge.normal[0] * edge.offset) * size;
  const centerY = top + (0.5 + edge.normal[1] * edge.offset) * size;
  const dir = [edge.normal[1], -edge.normal[0]];
  ctx.beginPath();
  ctx.moveTo(centerX - dir[0] * size, centerY - dir[1] * size);
  ctx.lineTo(centerX + dir[0] * size, centerY + dir[1] * size);
  ctx.strokeStyle = "#eef4f2";
  ctx.lineWidth = 3;
  ctx.stroke();

  let coveredCount = 0;
  for (const [x, y] of samples) {
    const covered = isCovered(x, y, edge);
    if (covered) {
      coveredCount += 1;
    }

    const px = left + x * size;
    const py = top + y * size;
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, TAU);
    ctx.fillStyle = covered ? "#ffd38a" : "#54c6da";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#101314";
    ctx.stroke();
  }

  ctx.fillStyle = "#b8c8c4";
  ctx.font = "13px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("1 像素", left, top - 16);

  return coveredCount;
}

function mixColor(a, b, amount) {
  return a.map((channel, index) => Math.round(channel + (b[index] - channel) * amount));
}

function drawCoverageExperiment(canvas, samples, edge) {
  const { ctx, height, width } = prepareCanvas(canvas);
  const cols = 28;
  const rows = 18;
  const pad = 28;
  const cell = Math.min((width - pad * 2) / cols, (height - pad * 2) / rows);
  const gridWidth = cols * cell;
  const gridHeight = rows * cell;
  const left = (width - gridWidth) * 0.5;
  const top = (height - gridHeight) * 0.5;
  const empty = [18, 25, 26];
  const full = [215, 111, 57];
  let coverageTotal = 0;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b0d0e";
  ctx.fillRect(0, 0, width, height);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      let covered = 0;
      for (const [sampleX, sampleY] of samples) {
        const x = (col + sampleX) / cols;
        const y = (row + sampleY) / rows;
        if (isCovered(x, y, edge)) {
          covered += 1;
        }
      }

      const coverage = covered / samples.length;
      coverageTotal += coverage;
      const color = mixColor(empty, full, coverage);
      ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      ctx.fillRect(left + col * cell, top + row * cell, Math.ceil(cell), Math.ceil(cell));
    }
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  for (let col = 0; col <= cols; col += 1) {
    const x = left + col * cell;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + gridHeight);
    ctx.stroke();
  }
  for (let row = 0; row <= rows; row += 1) {
    const y = top + row * cell;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + gridWidth, y);
    ctx.stroke();
  }

  const centerX = left + (0.5 + edge.normal[0] * edge.offset) * gridWidth;
  const centerY = top + (0.5 + edge.normal[1] * edge.offset) * gridHeight;
  const dir = [edge.normal[1], -edge.normal[0]];
  ctx.beginPath();
  ctx.moveTo(centerX - dir[0] * gridWidth, centerY - dir[1] * gridHeight);
  ctx.lineTo(centerX + dir[0] * gridWidth, centerY + dir[1] * gridHeight);
  ctx.strokeStyle = "rgba(238, 244, 242, 0.88)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = "rgba(238, 244, 242, 0.75)";
  ctx.lineWidth = 2;
  ctx.strokeRect(left, top, gridWidth, gridHeight);

  return coverageTotal / (cols * rows);
}

function renderSamplingLab() {
  const samples = getSamplingPositions();
  const edge = getEdge();
  const coveredCount = drawPixelExperiment(ui.samplingPatternCanvas, samples, edge);
  const averageCoverage = drawCoverageExperiment(ui.samplingCoverageCanvas, samples, edge);
  const label = patternLabels[samplingState.pattern];

  ui.edgeAngleValue.value = `${samplingState.edgeAngle}°`;
  ui.edgeOffsetValue.value = `${samplingState.edgeOffset}%`;
  ui.sampleSeedValue.value = `${samplingState.seed}`;
  ui.activePatternLabel.textContent = label;
  ui.coveredSamples.textContent = `${coveredCount} / ${samples.length}`;
  ui.averageCoverage.textContent = `${Math.round(averageCoverage * 100)}%`;
  ui.samplingPatternLabel.textContent = `${samples.length} samples`;
  ui.samplingCoverageLabel.textContent = label;
}

function initSamplingLab() {
  ui.samplePattern.addEventListener("change", () => {
    samplingState.pattern = ui.samplePattern.value;
    renderSamplingLab();
  });

  ui.sampleCount.addEventListener("change", () => {
    samplingState.sampleCount = Number(ui.sampleCount.value);
    renderSamplingLab();
  });

  ui.edgeAngle.addEventListener("input", () => {
    samplingState.edgeAngle = Number(ui.edgeAngle.value);
    renderSamplingLab();
  });

  ui.edgeOffset.addEventListener("input", () => {
    samplingState.edgeOffset = Number(ui.edgeOffset.value);
    renderSamplingLab();
  });

  ui.sampleSeed.addEventListener("input", () => {
    samplingState.seed = Number(ui.sampleSeed.value);
    renderSamplingLab();
  });

  window.addEventListener("resize", renderSamplingLab);
  renderSamplingLab();
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function formatUnit(value) {
  return value.toFixed(2);
}

function hslToRgb(hue, saturation, lightness) {
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const hp = ((hue % 360) + 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rgb = [0, 0, 0];

  if (hp >= 0 && hp < 1) {
    rgb = [c, x, 0];
  } else if (hp < 2) {
    rgb = [x, c, 0];
  } else if (hp < 3) {
    rgb = [0, c, x];
  } else if (hp < 4) {
    rgb = [0, x, c];
  } else if (hp < 5) {
    rgb = [x, 0, c];
  } else {
    rgb = [c, 0, x];
  }

  const m = lightness - c / 2;
  return rgb.map((channel) => Math.round((channel + m) * 255));
}

function rgbToCss(rgb, alpha = 1) {
  const [r, g, b] = rgb.map((channel) => Math.round(clamp(channel, 0, 255)));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixRgb(a, b, amount) {
  return a.map((channel, index) => channel + (b[index] - channel) * amount);
}

function scaleRgb(rgb, amount) {
  return rgb.map((channel) => channel * amount);
}

function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function normalize3(v) {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}

function getLightVector(angleDeg, lift = 0.52) {
  const angle = (angleDeg / 180) * Math.PI;
  return normalize3([Math.cos(angle), Math.sin(angle), lift]);
}

function getSphereColor(normal, light, model, baseColor, highlightStrength) {
  const ndotl = dot3(normal, light);
  const diffuse = clamp(ndotl, 0, 1);
  const view = [0, 0, 1];

  if (model === "lambert") {
    const ambient = 0.14;
    return scaleRgb(baseColor, ambient + diffuse * 0.86);
  }

  if (model === "toon") {
    const level = diffuse > 0.78 ? 1 : diffuse > 0.48 ? 0.72 : diffuse > 0.22 ? 0.42 : 0.18;
    const rim = Math.pow(1 - clamp(normal[2], 0, 1), 3) * 0.35;
    return mixRgb(scaleRgb(baseColor, level), [255, 246, 210], rim);
  }

  const cool = mixRgb([34, 66, 154], baseColor, 0.24);
  const warm = mixRgb([230, 176, 58], baseColor, 0.32);
  const t = (ndotl + 1) * 0.5;
  const reflected = normalize3([
    2 * ndotl * normal[0] - light[0],
    2 * ndotl * normal[1] - light[1],
    2 * ndotl * normal[2] - light[2],
  ]);
  const specular = Math.pow(clamp(dot3(reflected, view), 0, 1), 48) * (highlightStrength / 100);
  return mixRgb(mixRgb(cool, warm, t), [255, 255, 255], clamp(specular, 0, 1));
}

function drawShadedSphere(ctx, cx, cy, radius, options) {
  const step = Math.max(2, Math.floor(radius / 92));
  for (let y = -radius; y <= radius; y += step) {
    for (let x = -radius; x <= radius; x += step) {
      const nx = (x + step * 0.5) / radius;
      const ny = (y + step * 0.5) / radius;
      const rr = nx * nx + ny * ny;
      if (rr > 1) {
        continue;
      }

      const normal = [nx, ny, Math.sqrt(1 - rr)];
      const color = getSphereColor(
        normal,
        options.light,
        options.model,
        options.baseColor,
        options.highlightStrength,
      );
      ctx.fillStyle = rgbToCss(color);
      ctx.fillRect(cx + x, cy + y, step + 0.7, step + 0.7);
    }
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, TAU);
  ctx.strokeStyle = "rgba(238, 244, 242, 0.46)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawVectorGlyph(ctx, x, y, angle, color, label) {
  const length = 78;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-length * 0.5, 0);
  ctx.lineTo(length * 0.5, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(length * 0.5, 0);
  ctx.lineTo(length * 0.5 - 12, -7);
  ctx.lineTo(length * 0.5 - 12, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = color;
  ctx.font = "700 13px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(label, x + 48, y - 8);
}

function renderShadingModelLab() {
  const { ctx, height, width } = prepareCanvas(ui.shadingModelCanvas);
  const light = getLightVector(shadingState.lightAngle);
  const baseColor = hslToRgb(shadingState.surfaceHue, 0.6, 0.56);
  const radius = Math.min(width * 0.26, height * 0.42);
  const cx = width * 0.34;
  const cy = height * 0.55;
  const ndotl = dot3([0, 0, 1], light);
  const modelLabels = {
    gooch: "Gooch 冷暖插值",
    lambert: "Lambert 漫反射",
    toon: "分段卡通",
  };
  const operationLabels = {
    gooch: "mix + reflect",
    lambert: "max(n·l, 0)",
    toon: "quantize",
  };

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b0d0e";
  ctx.fillRect(0, 0, width, height);
  drawShadedSphere(ctx, cx, cy, radius, {
    baseColor,
    highlightStrength: shadingState.highlightStrength,
    light,
    model: shadingState.model,
  });

  const panelX = width * 0.66;
  ctx.fillStyle = "rgba(238, 244, 242, 0.08)";
  ctx.fillRect(panelX - 60, height * 0.18, width * 0.25, height * 0.62);
  ctx.strokeStyle = "rgba(238, 244, 242, 0.18)";
  ctx.strokeRect(panelX - 60, height * 0.18, width * 0.25, height * 0.62);

  const angle = (shadingState.lightAngle / 180) * Math.PI;
  drawVectorGlyph(ctx, panelX, height * 0.36, angle, "#ffd38a", "l");
  drawVectorGlyph(ctx, panelX, height * 0.52, -Math.PI / 2, "#8ed4c7", "n");
  drawVectorGlyph(ctx, panelX, height * 0.68, -Math.PI / 10, "#54c6da", "v");

  ctx.fillStyle = "#dce8e5";
  ctx.font = "700 15px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("单位向量输入", panelX - 42, height * 0.24);
  ctx.font = "13px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "#9fb0ad";
  ctx.fillText("n · l 控制受光强度，模型决定颜色响应。", panelX - 42, height * 0.78);

  ui.lightAngleValue.value = `${shadingState.lightAngle}°`;
  ui.surfaceHueValue.value = `${shadingState.surfaceHue}°`;
  ui.highlightStrengthValue.value = `${shadingState.highlightStrength}%`;
  ui.normalDotLight.textContent = formatUnit(ndotl);
  ui.shadingOperation.textContent = operationLabels[shadingState.model];
  ui.shadingModelLabel.textContent = modelLabels[shadingState.model];
}

function attenuationValues(distance, radius, range) {
  const r = Math.max(distance, radius);
  const inverse = 1 / (r * r);
  const windowBase = Math.max(0, 1 - Math.pow(distance / range, 4));
  const win = windowBase * windowBase;
  return {
    combined: inverse * win,
    inverse,
    win,
  };
}

function drawCurve(ctx, points, color) {
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function renderLightAttenuationLab() {
  const { ctx, height, width } = prepareCanvas(ui.lightAttenuationCanvas);
  const distance = attenuationState.distance / 100;
  const radius = attenuationState.radius / 100;
  const range = attenuationState.range / 100;
  const pad = 52;
  const graphWidth = width - pad * 2;
  const graphHeight = height - pad * 2;
  const graphLeft = pad;
  const graphTop = pad * 0.8;
  const yScale = 4.4;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b0d0e";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  for (let index = 0; index <= 6; index += 1) {
    const x = graphLeft + (graphWidth * index) / 6;
    const y = graphTop + (graphHeight * index) / 6;
    ctx.beginPath();
    ctx.moveTo(x, graphTop);
    ctx.lineTo(x, graphTop + graphHeight);
    ctx.moveTo(graphLeft, y);
    ctx.lineTo(graphLeft + graphWidth, y);
    ctx.stroke();
  }

  const toPoint = (r, value) => [
    graphLeft + (r / range) * graphWidth,
    graphTop + graphHeight - clamp(value / yScale, 0, 1) * graphHeight,
  ];
  const inversePoints = [];
  const windowPoints = [];
  const combinedPoints = [];

  for (let index = 0; index <= 240; index += 1) {
    const r = (range * index) / 240;
    const values = attenuationValues(r, radius, range);
    inversePoints.push(toPoint(r, values.inverse));
    windowPoints.push(toPoint(r, values.win * yScale));
    combinedPoints.push(toPoint(r, values.combined));
  }

  drawCurve(ctx, inversePoints, "#54c6da");
  drawCurve(ctx, windowPoints, "#8ed4c7");
  drawCurve(ctx, combinedPoints, "#d76f39");

  const marker = attenuationValues(distance, radius, range);
  const markerPoint = toPoint(distance, marker.combined);
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = "rgba(238, 244, 242, 0.62)";
  ctx.beginPath();
  ctx.moveTo(markerPoint[0], graphTop);
  ctx.lineTo(markerPoint[0], graphTop + graphHeight);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#ffd38a";
  ctx.beginPath();
  ctx.arc(markerPoint[0], markerPoint[1], 6, 0, TAU);
  ctx.fill();

  const legend = [
    ["平方反比", "#54c6da"],
    ["窗口函数", "#8ed4c7"],
    ["相乘结果", "#d76f39"],
  ];
  legend.forEach(([label, color], index) => {
    const x = graphLeft + 18 + index * 120;
    const y = height - 24;
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 10, 22, 4);
    ctx.fillStyle = "#b8c8c4";
    ctx.font = "13px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(label, x + 30, y - 4);
  });

  ui.attenuationDistanceValue.value = formatUnit(distance);
  ui.attenuationRadiusValue.value = formatUnit(radius);
  ui.attenuationRangeValue.value = formatUnit(range);
  ui.inverseSquareValue.textContent = formatUnit(marker.inverse);
  ui.windowValue.textContent = formatUnit(marker.win);
  ui.combinedAttenuationValue.textContent = formatUnit(marker.combined);
}

function drawFrequencySphere(canvas, mode) {
  const { ctx, height, width } = prepareCanvas(canvas);
  const radius = Math.min(width, height) * 0.34;
  const cx = width * 0.5;
  const cy = height * 0.54;
  const light = getLightVector(frequencyState.lightAngle, 0.48);
  const baseColor = [96, 214, 190];

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b0d0e";
  ctx.fillRect(0, 0, width, height);

  if (mode === "object") {
    const color = getSphereColor([0, 0, 1], light, "lambert", baseColor, 0);
    ctx.fillStyle = rgbToCss(color);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, TAU);
    ctx.fill();
  } else {
    const cells = mode === "vertex" ? frequencyState.bands : Math.max(38, frequencyState.bands * 8);
    const cell = (radius * 2) / cells;
    for (let row = 0; row < cells; row += 1) {
      for (let col = 0; col < cells; col += 1) {
        const x = -radius + col * cell + cell * 0.5;
        const y = -radius + row * cell + cell * 0.5;
        const nx = x / radius;
        const ny = y / radius;
        const rr = nx * nx + ny * ny;
        if (rr > 1) {
          continue;
        }
        const normal = [nx, ny, Math.sqrt(1 - rr)];
        const color = getSphereColor(normal, light, "lambert", baseColor, 0);
        ctx.fillStyle = rgbToCss(color);
        ctx.fillRect(cx - radius + col * cell, cy - radius + row * cell, cell + 0.8, cell + 0.8);
      }
    }

    if (mode === "vertex") {
      ctx.strokeStyle = "rgba(16, 19, 20, 0.28)";
      ctx.lineWidth = 1;
      for (let index = 0; index <= cells; index += 1) {
        const p = -radius + index * cell;
        ctx.beginPath();
        ctx.moveTo(cx - radius, cy + p);
        ctx.lineTo(cx + radius, cy + p);
        ctx.moveTo(cx + p, cy - radius);
        ctx.lineTo(cx + p, cy + radius);
        ctx.stroke();
      }
    }
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, TAU);
  ctx.strokeStyle = "rgba(238, 244, 242, 0.46)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function renderFrequencyLab() {
  drawFrequencySphere(ui.objectFrequencyCanvas, "object");
  drawFrequencySphere(ui.vertexFrequencyCanvas, "vertex");
  drawFrequencySphere(ui.pixelFrequencyCanvas, "pixel");
  ui.frequencyLightAngleValue.value = `${frequencyState.lightAngle}°`;
  ui.frequencyBandsValue.value = `${frequencyState.bands}`;
  ui.vertexFrequencyCount.textContent = `${frequencyState.bands * frequencyState.bands} 格`;
}

function blendOver(dst, src, alpha) {
  return src.map((channel, index) => channel * alpha + dst[index] * (1 - alpha));
}

function drawTransparencyPanel(ctx, x, y, width, height, label, mode) {
  const alpha = transparencyState.alpha / 100;
  const red = [232, 94, 72];
  const blue = [66, 164, 226];
  const background = [21, 25, 26];

  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = "#dce8e5";
  ctx.font = "700 14px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(label, x + 16, y + 28);

  const rectA = { x: x + width * 0.18, y: y + height * 0.32, w: width * 0.46, h: height * 0.42 };
  const rectB = { x: x + width * 0.36, y: y + height * 0.22, w: width * 0.46, h: height * 0.42 };

  if (mode === "weighted") {
    const frontWeight = 0.5 + transparencyState.bias / 200;
    const backWeight = 1.5 - frontWeight;
    const color = mixRgb(blue, red, frontWeight / (frontWeight + backWeight));
    ctx.fillStyle = rgbToCss(color, alpha);
    ctx.fillRect(rectA.x, rectA.y, rectA.w, rectA.h);
    ctx.fillRect(rectB.x, rectB.y, rectB.w, rectB.h);
    ctx.fillStyle = "rgba(255, 211, 138, 0.9)";
    ctx.fillRect(rectB.x, rectB.y + rectB.h - 5, rectB.w, 5);
    return;
  }

  const order = mode === "reverse"
    ? (transparencyState.order === "blueFirst" ? ["red", "blue"] : ["blue", "red"])
    : (transparencyState.order === "blueFirst" ? ["blue", "red"] : ["red", "blue"]);
  const rects = {
    blue: [rectA, blue],
    red: [rectB, red],
  };

  for (const key of order) {
    const [rect, color] = rects[key];
    ctx.fillStyle = rgbToCss(color, alpha);
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }

  const overlap = order.reduce((color, key) => {
    const source = key === "red" ? red : blue;
    return blendOver(color, source, alpha);
  }, background);
  ctx.fillStyle = rgbToCss(overlap);
  ctx.fillRect(x + 16, y + height - 34, 34, 18);
  ctx.fillStyle = "#9fb0ad";
  ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("overlap", x + 58, y + height - 20);
}

function renderTransparencyLab() {
  const { ctx, height, width } = prepareCanvas(ui.transparencyCanvas);
  const pad = 24;
  const panelWidth = (width - pad * 4) / 3;
  const panelHeight = height - pad * 2;
  const alpha = transparencyState.alpha / 100;
  const overlapAlpha = 1 - (1 - alpha) * (1 - alpha);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b0d0e";
  ctx.fillRect(0, 0, width, height);

  drawTransparencyPanel(ctx, pad, pad, panelWidth, panelHeight, "当前顺序", "current");
  drawTransparencyPanel(ctx, pad * 2 + panelWidth, pad, panelWidth, panelHeight, "相反顺序", "reverse");
  drawTransparencyPanel(ctx, pad * 3 + panelWidth * 2, pad, panelWidth, panelHeight, "加权近似", "weighted");

  ui.transparentAlphaValue.value = `${transparencyState.alpha}%`;
  ui.oitBiasValue.value = `${transparencyState.bias}%`;
  ui.transparentOrderLabel.textContent = transparencyState.order === "blueFirst" ? "蓝 → 红" : "红 → 蓝";
  ui.transparentOverlapAlpha.textContent = `${Math.round(overlapAlpha * 100)}%`;
}

function encodeLinear(value, gamma) {
  return Math.pow(clamp(value), 1 / gamma);
}

function drawEncodingBars(ctx, x, y, width, height, gamma, contrast) {
  const coverages = [0.125, 0.375, 0.625, 0.875];
  const barGap = 10;
  const rowHeight = (height - barGap) / 2;
  const cellWidth = width / coverages.length;

  ctx.fillStyle = "#dce8e5";
  ctx.font = "700 14px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("先在线性空间滤波，再编码显示", x, y - 12);

  coverages.forEach((coverage, index) => {
    const encoded = encodeLinear(coverage * contrast, gamma);
    ctx.fillStyle = rgbToCss([encoded * 255, encoded * 255, encoded * 255]);
    ctx.fillRect(x + index * cellWidth, y, cellWidth, rowHeight);
    ctx.fillStyle = "#101314";
    ctx.font = "700 13px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(`${Math.round(coverage * 100)}%`, x + index * cellWidth + 12, y + 28);
  });

  ctx.fillStyle = "#dce8e5";
  ctx.font = "700 14px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("直接把覆盖率当显示值", x, y + rowHeight + barGap - 12);

  coverages.forEach((coverage, index) => {
    const value = coverage * contrast;
    ctx.fillStyle = rgbToCss([value * 255, value * 255, value * 255]);
    ctx.fillRect(x + index * cellWidth, y + rowHeight + barGap, cellWidth, rowHeight);
  });

  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.strokeRect(x, y, width, rowHeight);
  ctx.strokeRect(x, y + rowHeight + barGap, width, rowHeight);
}

function renderDisplayEncodingLab() {
  const { ctx, height, width } = prepareCanvas(ui.displayEncodingCanvas);
  const gamma = encodingState.gamma / 100;
  const contrast = encodingState.contrast / 100;
  const pad = 46;
  const graphWidth = width * 0.36;
  const graphHeight = height - pad * 2;
  const left = pad;
  const top = pad;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b0d0e";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.strokeRect(left, top, graphWidth, graphHeight);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  for (let index = 1; index < 5; index += 1) {
    const x = left + (graphWidth * index) / 5;
    const y = top + (graphHeight * index) / 5;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + graphHeight);
    ctx.moveTo(left, y);
    ctx.lineTo(left + graphWidth, y);
    ctx.stroke();
  }

  const linear = [];
  const encoded = [];
  for (let index = 0; index <= 140; index += 1) {
    const x = index / 140;
    linear.push([left + x * graphWidth, top + graphHeight - x * graphHeight]);
    encoded.push([left + x * graphWidth, top + graphHeight - encodeLinear(x, gamma) * graphHeight]);
  }
  drawCurve(ctx, linear, "#54c6da");
  drawCurve(ctx, encoded, "#d76f39");

  ctx.fillStyle = "#b8c8c4";
  ctx.font = "13px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("线性值", left + 14, top + graphHeight - 12);
  ctx.fillText("编码值", left + graphWidth - 64, top + 24);

  drawEncodingBars(ctx, width * 0.48, height * 0.25, width * 0.42, height * 0.48, gamma, contrast);

  ui.gammaValueLabel.value = formatUnit(gamma);
  ui.edgeContrastValue.value = `${encodingState.contrast}%`;
  ui.encodedMidtone.textContent = formatUnit(encodeLinear(0.5, gamma));
}

function initChapterFiveLabs() {
  ui.shadingModel.addEventListener("change", () => {
    shadingState.model = ui.shadingModel.value;
    renderShadingModelLab();
  });
  ui.lightAngle.addEventListener("input", () => {
    shadingState.lightAngle = Number(ui.lightAngle.value);
    renderShadingModelLab();
  });
  ui.surfaceHue.addEventListener("input", () => {
    shadingState.surfaceHue = Number(ui.surfaceHue.value);
    renderShadingModelLab();
  });
  ui.highlightStrength.addEventListener("input", () => {
    shadingState.highlightStrength = Number(ui.highlightStrength.value);
    renderShadingModelLab();
  });

  ui.attenuationDistance.addEventListener("input", () => {
    attenuationState.distance = Number(ui.attenuationDistance.value);
    renderLightAttenuationLab();
  });
  ui.attenuationRadius.addEventListener("input", () => {
    attenuationState.radius = Number(ui.attenuationRadius.value);
    renderLightAttenuationLab();
  });
  ui.attenuationRange.addEventListener("input", () => {
    attenuationState.range = Number(ui.attenuationRange.value);
    renderLightAttenuationLab();
  });

  ui.frequencyLightAngle.addEventListener("input", () => {
    frequencyState.lightAngle = Number(ui.frequencyLightAngle.value);
    renderFrequencyLab();
  });
  ui.frequencyBands.addEventListener("input", () => {
    frequencyState.bands = Number(ui.frequencyBands.value);
    renderFrequencyLab();
  });

  ui.transparentAlpha.addEventListener("input", () => {
    transparencyState.alpha = Number(ui.transparentAlpha.value);
    renderTransparencyLab();
  });
  ui.transparentOrder.addEventListener("change", () => {
    transparencyState.order = ui.transparentOrder.value;
    renderTransparencyLab();
  });
  ui.oitBias.addEventListener("input", () => {
    transparencyState.bias = Number(ui.oitBias.value);
    renderTransparencyLab();
  });

  ui.gammaValue.addEventListener("input", () => {
    encodingState.gamma = Number(ui.gammaValue.value);
    renderDisplayEncodingLab();
  });
  ui.edgeContrast.addEventListener("input", () => {
    encodingState.contrast = Number(ui.edgeContrast.value);
    renderDisplayEncodingLab();
  });

  window.addEventListener("resize", () => {
    renderShadingModelLab();
    renderLightAttenuationLab();
    renderFrequencyLab();
    renderTransparencyLab();
    renderDisplayEncodingLab();
  });

  renderShadingModelLab();
  renderLightAttenuationLab();
  renderFrequencyLab();
  renderTransparencyLab();
  renderDisplayEncodingLab();
}

function init() {
  initChapterFiveLabs();

  try {
    initWebGlLab();
  } catch (error) {
    ui.gpuStatus.textContent = "WebGL2 不可用";
    ui.gpuStatus.classList.add("is-error");
    console.error(error);
  }

  initSamplingLab();
}

init();
