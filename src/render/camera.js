function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function normalize3(vector) {
  const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function cross3(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function multiplyMat4(a, b) {
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      let value = 0;
      for (let index = 0; index < 4; index += 1) {
        value += a[index * 4 + row] * b[column * 4 + index];
      }
      result[column * 4 + row] = value;
    }
  }
  return result;
}

export function createPerspectiveMatrix(fovY, aspect, near = 0.1, far = 100) {
  const scale = 1 / Math.tan(fovY * 0.5);
  const range = 1 / (near - far);
  return new Float32Array([
    scale / Math.max(aspect, Number.EPSILON), 0, 0, 0,
    0, scale, 0, 0,
    0, 0, (far + near) * range, -1,
    0, 0, 2 * far * near * range, 0,
  ]);
}

export function createOrthographicMatrix(left, right, bottom, top, near = 0.1, far = 100) {
  const width = Math.max(right - left, Number.EPSILON);
  const height = Math.max(top - bottom, Number.EPSILON);
  const depth = Math.max(far - near, Number.EPSILON);
  return new Float32Array([
    2 / width, 0, 0, 0,
    0, 2 / height, 0, 0,
    0, 0, -2 / depth, 0,
    -(right + left) / width, -(top + bottom) / height, -(far + near) / depth, 1,
  ]);
}

export function createLookAtMatrix(eye, target = [0, 0, 0], up = [0, 1, 0]) {
  const forward = normalize3([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
  const right = normalize3(cross3(up, forward));
  const cameraUp = cross3(forward, right);

  return new Float32Array([
    right[0], cameraUp[0], forward[0], 0,
    right[1], cameraUp[1], forward[1], 0,
    right[2], cameraUp[2], forward[2], 0,
    -dot3(right, eye), -dot3(cameraUp, eye), -dot3(forward, eye), 1,
  ]);
}

export function createOrbitCamera({
  aspect = 1,
  distance = 3.5,
  far = 100,
  fovY = Math.PI / 3,
  near = 0.1,
  pitch = 0.35,
  target = [0, 0, 0],
  yaw = 0,
} = {}) {
  const safePitch = Math.max(-Math.PI * 0.49, Math.min(Math.PI * 0.49, pitch));
  const horizontal = Math.cos(safePitch) * distance;
  const eye = [
    target[0] + Math.sin(yaw) * horizontal,
    target[1] + Math.sin(safePitch) * distance,
    target[2] + Math.cos(yaw) * horizontal,
  ];
  const view = createLookAtMatrix(eye, target);
  const projection = createPerspectiveMatrix(fovY, aspect, near, far);

  return {
    eye,
    projection,
    target: [...target],
    view,
    viewProjection: multiplyMat4(projection, view),
  };
}
