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

function init() {
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

try {
  init();
} catch (error) {
  ui.gpuStatus.textContent = "WebGL2 不可用";
  ui.gpuStatus.classList.add("is-error");
  console.error(error);
}
