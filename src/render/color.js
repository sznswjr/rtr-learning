import { clamp } from "./math.js?v=20260704-1";

export function hslToRgb(hue, saturation, lightness) {
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

export function rgbToCss(rgb, alpha = 1) {
  const [r, g, b] = rgb.map((channel) => Math.round(clamp(channel, 0, 255)));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function mixRgb(a, b, amount) {
  return a.map((channel, index) => channel + (b[index] - channel) * amount);
}

export function scaleRgb(rgb, amount) {
  return rgb.map((channel) => channel * amount);
}

export function blendOver(dst, src, alpha) {
  return src.map((channel, index) => channel * alpha + dst[index] * (1 - alpha));
}
