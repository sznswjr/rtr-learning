import assert from "node:assert/strict";

import { hslToRgb } from "../src/render/color.js";

const canonicalHues = [
  [0, [255, 0, 0]],
  [60, [255, 255, 0]],
  [120, [0, 255, 0]],
  [180, [0, 255, 255]],
  [240, [0, 0, 255]],
  [300, [255, 0, 255]],
  [360, [255, 0, 0]],
  [-60, [255, 0, 255]],
];

canonicalHues.forEach(([hue, expected]) => {
  assert.deepEqual(hslToRgb(hue, 1, 0.5), expected, `unexpected RGB value for ${hue}°`);
});

console.log(`Color checks passed for ${canonicalHues.length} canonical hues.`);
