import { assertFramebuffer } from "./webgl.js?v=20260803-6";

export function createColorTarget(gl, {
  depth = true,
  filter = gl.LINEAR,
  format = gl.RGBA,
  height = 1,
  internalFormat = gl.RGBA8,
  label = "color target",
  type = gl.UNSIGNED_BYTE,
  width = 1,
} = {}) {
  const framebuffer = gl.createFramebuffer();
  const color = gl.createTexture();
  const depthBuffer = depth ? gl.createRenderbuffer() : null;

  const resize = (nextWidth, nextHeight) => {
    const safeWidth = Math.max(1, Math.floor(nextWidth));
    const safeHeight = Math.max(1, Math.floor(nextHeight));

    gl.bindTexture(gl.TEXTURE_2D, color);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, safeWidth, safeHeight, 0, format, type, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);
    if (depthBuffer) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, safeWidth, safeHeight);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
    }
    assertFramebuffer(gl, label);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    target.width = safeWidth;
    target.height = safeHeight;
  };

  const target = {
    color,
    depth: depthBuffer,
    dispose() {
      gl.deleteTexture(color);
      if (depthBuffer) {
        gl.deleteRenderbuffer(depthBuffer);
      }
      gl.deleteFramebuffer(framebuffer);
    },
    framebuffer,
    height: 0,
    resize,
    width: 0,
  };

  resize(width, height);
  return target;
}

export function createDepthTarget(gl, {
  height = 1,
  label = "depth target",
  width = 1,
} = {}) {
  const framebuffer = gl.createFramebuffer();
  const depth = gl.createTexture();

  const resize = (nextWidth, nextHeight) => {
    const safeWidth = Math.max(1, Math.floor(nextWidth));
    const safeHeight = Math.max(1, Math.floor(nextHeight));
    gl.bindTexture(gl.TEXTURE_2D, depth);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.DEPTH_COMPONENT24,
      safeWidth,
      safeHeight,
      0,
      gl.DEPTH_COMPONENT,
      gl.UNSIGNED_INT,
      null,
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth, 0);
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);
    assertFramebuffer(gl, label);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    target.width = safeWidth;
    target.height = safeHeight;
  };

  const target = {
    depth,
    dispose() {
      gl.deleteTexture(depth);
      gl.deleteFramebuffer(framebuffer);
    },
    framebuffer,
    height: 0,
    resize,
    width: 0,
  };

  resize(width, height);
  return target;
}
