import { createFullscreenTriangle } from "./mesh.js?v=20260803-9";
import { createProgram } from "./webgl.js?v=20260803-9";

export const fullscreenVertexSource = `#version 300 es
in vec2 position;
out vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

export function createPostprocessPass(gl, fragmentSource) {
  const program = createProgram(gl, fullscreenVertexSource, fragmentSource);
  const position = gl.getAttribLocation(program, "position");
  const source = gl.getUniformLocation(program, "uSource");
  const mesh = createFullscreenTriangle(gl, position);

  return {
    dispose() {
      mesh.dispose();
      gl.deleteProgram(program);
    },
    draw({ configure, framebuffer = null, height, texture, width }) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.viewport(0, 0, width, height);
      gl.useProgram(program);
      if (texture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        if (source) {
          gl.uniform1i(source, 0);
        }
      }
      configure?.(gl, program);
      mesh.draw();
    },
    program,
  };
}
