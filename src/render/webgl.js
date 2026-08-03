export function createShader(gl, type, source) {
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

export function createProgram(gl, vertex, fragment) {
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

export function assertFramebuffer(gl, label) {
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(`${label} framebuffer is incomplete: ${status}`);
  }
}

export function getMaxSamples(gl) {
  return gl.getParameter(gl.MAX_SAMPLES) || 1;
}

export function resizeCanvasToDisplaySize(canvas, maxDevicePixelRatio = 2) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, maxDevicePixelRatio);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  const changed = canvas.width !== width || canvas.height !== height;
  if (changed) {
    canvas.width = width;
    canvas.height = height;
  }
  return { changed, dpr, height, width };
}
