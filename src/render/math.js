export const TAU = Math.PI * 2;

export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function formatUnit(value) {
  return value.toFixed(2);
}

export function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function normalize3(v) {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}

export function getLightVector(angleDeg, lift = 0.52) {
  const angle = (angleDeg / 180) * Math.PI;
  return normalize3([Math.cos(angle), Math.sin(angle), lift]);
}
