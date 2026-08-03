export function createFullscreenTriangle(gl, positionLocation) {
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return {
    draw() {
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    },
    dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
    },
    vao,
  };
}

export function createIndexedMesh(gl, { attributes, indices, mode = gl.TRIANGLES }) {
  const vao = gl.createVertexArray();
  const buffers = [];
  gl.bindVertexArray(vao);

  attributes.forEach(({ data, location, normalized = false, size, type = gl.FLOAT }) => {
    const buffer = gl.createBuffer();
    buffers.push(buffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, type, normalized, 0, 0);
  });

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  const indexType = indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
  return {
    draw() {
      gl.bindVertexArray(vao);
      gl.drawElements(mode, indices.length, indexType, 0);
      gl.bindVertexArray(null);
    },
    dispose() {
      buffers.forEach((buffer) => gl.deleteBuffer(buffer));
      gl.deleteBuffer(indexBuffer);
      gl.deleteVertexArray(vao);
    },
    vao,
  };
}
