import { mixRgb, scaleRgb } from "./color.js?v=20260628-4";
import { clamp, dot3, normalize3 } from "./math.js?v=20260628-4";

export function getSphereColor(normal, light, model, baseColor, highlightStrength) {
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
