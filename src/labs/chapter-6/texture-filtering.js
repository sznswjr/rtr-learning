import { prepareCanvas } from "../../render/canvas.js?v=20260710-1";

const TEXTURE_SIZE = 256;
const FILTERS = [
  {
    id: "nearest",
    title: "无过滤",
    note: "跳变、摩尔纹",
    color: "#ff9f7a",
  },
  {
    id: "bilinear",
    title: "双线性",
    note: "近处平滑，远处仍闪",
    color: "#ffd166",
  },
  {
    id: "trilinear",
    title: "三线性",
    note: "跨 MIP 平滑",
    color: "#8ed4c7",
  },
  {
    id: "sat",
    title: "SAT",
    note: "面积平均，稳定但钝",
    color: "#7fb7ff",
  },
  {
    id: "anisotropic",
    title: "各向异性",
    note: "斜视下保细节",
    color: "#d7a5ff",
  },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function wrap(value, size) {
  return ((value % size) + size) % size;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function createSourceTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#101416";
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  for (let y = 0; y < TEXTURE_SIZE; y += 8) {
    for (let x = 0; x < TEXTURE_SIZE; x += 8) {
      const isLight = ((x / 8 + y / 8) & 1) === 0;
      ctx.fillStyle = isLight ? "#e7f4ee" : "#182122";
      ctx.fillRect(x, y, 8, 8);
    }
  }

  ctx.globalAlpha = 0.82;
  ctx.fillStyle = "#34d6bb";
  for (let x = 0; x < TEXTURE_SIZE; x += 32) {
    ctx.fillRect(x, 0, 2, TEXTURE_SIZE);
  }
  ctx.fillStyle = "#ffbd6b";
  for (let y = 0; y < TEXTURE_SIZE; y += 32) {
    ctx.fillRect(0, y, TEXTURE_SIZE, 2);
  }

  ctx.globalAlpha = 0.72;
  ctx.strokeStyle = "#ff667f";
  ctx.lineWidth = 2;
  for (let i = -TEXTURE_SIZE; i < TEXTURE_SIZE * 2; i += 24) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + TEXTURE_SIZE, TEXTURE_SIZE);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(8, 12, 13, 0.78)";
  ctx.fillRect(28, 78, 200, 78);
  ctx.fillStyle = "#f5fff9";
  ctx.font = "700 32px Inter, sans-serif";
  ctx.fillText("RTR4", 52, 116);
  ctx.font = "700 18px Inter, sans-serif";
  ctx.fillText("FILTER", 52, 142);

  return ctx.getImageData(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
}

function createMipmaps(source) {
  const levels = [{ size: source.width, data: source.data }];
  let previous = levels[0];

  while (previous.size > 1) {
    const size = previous.size >> 1;
    const data = new Uint8ClampedArray(size * size * 4);

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const dst = (y * size + x) * 4;
        const srcX = x * 2;
        const srcY = y * 2;
        const accum = [0, 0, 0, 0];

        for (let oy = 0; oy < 2; oy += 1) {
          for (let ox = 0; ox < 2; ox += 1) {
            const src = ((srcY + oy) * previous.size + srcX + ox) * 4;
            accum[0] += previous.data[src];
            accum[1] += previous.data[src + 1];
            accum[2] += previous.data[src + 2];
            accum[3] += previous.data[src + 3];
          }
        }

        data[dst] = accum[0] * 0.25;
        data[dst + 1] = accum[1] * 0.25;
        data[dst + 2] = accum[2] * 0.25;
        data[dst + 3] = accum[3] * 0.25;
      }
    }

    previous = { size, data };
    levels.push(previous);
  }

  return levels;
}

function createSat(source) {
  const size = source.width;
  const stride = size + 1;
  const sums = new Float64Array(stride * stride * 3);
  const average = [0, 0, 0];

  for (let y = 1; y <= size; y += 1) {
    for (let x = 1; x <= size; x += 1) {
      const src = ((y - 1) * size + x - 1) * 4;
      const sat = (y * stride + x) * 3;
      const left = (y * stride + x - 1) * 3;
      const top = ((y - 1) * stride + x) * 3;
      const corner = ((y - 1) * stride + x - 1) * 3;

      for (let c = 0; c < 3; c += 1) {
        const value = source.data[src + c];
        sums[sat + c] = value + sums[left + c] + sums[top + c] - sums[corner + c];
      }
    }
  }

  const total = size * size;
  const totalIndex = (size * stride + size) * 3;
  average[0] = sums[totalIndex] / total;
  average[1] = sums[totalIndex + 1] / total;
  average[2] = sums[totalIndex + 2] / total;

  return { average, size, sums, stride };
}

function sumSatRect(sat, x0, x1, y0, y1) {
  const ax = clamp(x0, 0, sat.size);
  const bx = clamp(x1, 0, sat.size);
  const ay = clamp(y0, 0, sat.size);
  const by = clamp(y1, 0, sat.size);
  const a = (ay * sat.stride + ax) * 3;
  const b = (ay * sat.stride + bx) * 3;
  const c = (by * sat.stride + ax) * 3;
  const d = (by * sat.stride + bx) * 3;

  return [
    sat.sums[d] - sat.sums[b] - sat.sums[c] + sat.sums[a],
    sat.sums[d + 1] - sat.sums[b + 1] - sat.sums[c + 1] + sat.sums[a + 1],
    sat.sums[d + 2] - sat.sums[b + 2] - sat.sums[c + 2] + sat.sums[a + 2],
  ];
}

function splitPeriodicInterval(start, end, size) {
  const a = Math.floor(start);
  const b = Math.ceil(end);
  const length = Math.max(1, b - a);
  const fullPeriods = Math.floor(length / size);
  const remainder = length % size;
  const offset = wrap(a, size);
  const segments = [];

  if (fullPeriods > 0) {
    segments.push({ from: 0, to: size, weight: fullPeriods });
  }

  if (remainder > 0) {
    const first = Math.min(remainder, size - offset);
    segments.push({ from: offset, to: offset + first, weight: 1 });
    if (remainder > first) {
      segments.push({ from: 0, to: remainder - first, weight: 1 });
    }
  }

  return { length, segments };
}

function averageSat(sat, u0, u1, v0, v1) {
  const u = splitPeriodicInterval(Math.min(u0, u1), Math.max(u0, u1), sat.size);
  const v = splitPeriodicInterval(Math.min(v0, v1), Math.max(v0, v1), sat.size);
  const sum = [0, 0, 0];

  u.segments.forEach((sx) => {
    v.segments.forEach((sy) => {
      const rect = sumSatRect(sat, sx.from, sx.to, sy.from, sy.to);
      const weight = sx.weight * sy.weight;
      sum[0] += rect[0] * weight;
      sum[1] += rect[1] * weight;
      sum[2] += rect[2] * weight;
    });
  });

  const area = u.length * v.length;
  return [sum[0] / area, sum[1] / area, sum[2] / area];
}

function sampleLevel(level, u, v, linear) {
  const scale = level.size / TEXTURE_SIZE;
  const x = u * scale;
  const y = v * scale;

  if (!linear) {
    const ix = Math.floor(wrap(Math.round(x), level.size));
    const iy = Math.floor(wrap(Math.round(y), level.size));
    const index = (iy * level.size + ix) * 4;
    return [level.data[index], level.data[index + 1], level.data[index + 2]];
  }

  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  const read = (px, py) => {
    const ix = Math.floor(wrap(px, level.size));
    const iy = Math.floor(wrap(py, level.size));
    const index = (iy * level.size + ix) * 4;
    return [level.data[index], level.data[index + 1], level.data[index + 2]];
  };

  const c00 = read(x0, y0);
  const c10 = read(x1, y0);
  const c01 = read(x0, y1);
  const c11 = read(x1, y1);

  return [
    lerp(lerp(c00[0], c10[0], tx), lerp(c01[0], c11[0], tx), ty),
    lerp(lerp(c00[1], c10[1], tx), lerp(c01[1], c11[1], tx), ty),
    lerp(lerp(c00[2], c10[2], tx), lerp(c01[2], c11[2], tx), ty),
  ];
}

function sampleTrilinear(texture, u, v, lambda, mipBias) {
  const level = clamp(lambda + mipBias, 0, texture.mips.length - 1);
  const low = Math.floor(level);
  const high = Math.min(texture.mips.length - 1, low + 1);
  const t = level - low;
  const a = sampleLevel(texture.mips[low], u, v, true);
  const b = sampleLevel(texture.mips[high], u, v, true);

  return [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
  ];
}

function getUv(px, py, width, height, state) {
  const x = px / width - 0.5;
  const y = clamp(py / height, 0, 1);
  const view = state.viewAngle / 82;
  const depth = 1 / (0.085 + Math.pow(y, 1.58) * (1.72 - view * 0.68));
  const stretch = 1 + view * 7.2;
  const detail = state.detail;

  return {
    u: ((x * stretch) + depth * 0.14) * detail * 68,
    v: (depth * 1.18 + x * view * 0.42) * detail * 76,
  };
}

function getFootprint(px, py, width, height, state) {
  const center = getUv(px, py, width, height, state);
  const dx = getUv(px + 1, py, width, height, state);
  const dy = getUv(px, py + 1, width, height, state);
  const dux = dx.u - center.u;
  const dvx = dx.v - center.v;
  const duy = dy.u - center.u;
  const dvy = dy.v - center.v;
  const xx = dux * dux + dvx * dvx;
  const yy = duy * duy + dvy * dvy;
  const xy = dux * duy + dvx * dvy;
  const trace = xx + yy;
  const det = Math.max(0, xx * yy - xy * xy);
  const disc = Math.sqrt(Math.max(0, trace * trace * 0.25 - det));
  const major = Math.sqrt(Math.max(0.0001, trace * 0.5 + disc));
  const minor = Math.sqrt(Math.max(0.0001, trace * 0.5 - disc));
  const dxLength = Math.hypot(dux, dvx);
  const dyLength = Math.hypot(duy, dvy);
  const axis = dxLength >= dyLength
    ? { u: dux / Math.max(0.0001, dxLength), v: dvx / Math.max(0.0001, dxLength) }
    : { u: duy / Math.max(0.0001, dyLength), v: dvy / Math.max(0.0001, dyLength) };

  return {
    axis,
    center,
    dux,
    duy,
    dvx,
    dvy,
    major,
    minor,
  };
}

function sampleFilter(texture, filter, footprint, state) {
  const { center, major, minor } = footprint;
  const lambda = Math.log2(Math.max(1, major));

  if (filter === "nearest") {
    return sampleLevel(texture.mips[0], center.u, center.v, false);
  }

  if (filter === "bilinear") {
    return sampleLevel(texture.mips[0], center.u, center.v, true);
  }

  if (filter === "trilinear") {
    return sampleTrilinear(texture, center.u, center.v, lambda, state.mipBias);
  }

  if (filter === "sat") {
    const halfU = Math.max(Math.abs(footprint.dux), Math.abs(footprint.duy), 1) * 0.75;
    const halfV = Math.max(Math.abs(footprint.dvx), Math.abs(footprint.dvy), 1) * 0.75;
    return averageSat(texture.sat, center.u - halfU, center.u + halfU, center.v - halfV, center.v + halfV);
  }

  const ratio = clamp(major / Math.max(1, minor), 1, 10);
  const taps = Math.ceil(clamp(ratio, 1, 8));
  const lambdaMinor = Math.log2(Math.max(1, minor));
  const color = [0, 0, 0];

  for (let i = 0; i < taps; i += 1) {
    const offset = ((i + 0.5) / taps - 0.5) * major;
    const sample = sampleTrilinear(
      texture,
      center.u + footprint.axis.u * offset,
      center.v + footprint.axis.v * offset,
      lambdaMinor,
      state.mipBias,
    );
    color[0] += sample[0];
    color[1] += sample[1];
    color[2] += sample[2];
  }

  return [color[0] / taps, color[1] / taps, color[2] / taps];
}

function renderPanels(texture, filters, width, height, displayWidth, displayHeight, state) {
  const panels = filters.map((filter) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    return { canvas, ctx, filter, image: ctx.createImageData(width, height) };
  });

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const displayX = ((x + 0.5) / width) * displayWidth;
      const displayY = ((y + 0.5) / height) * displayHeight;
      const footprint = getFootprint(displayX, displayY, displayWidth, displayHeight, state);
      const fog = clamp((displayHeight - displayY) / displayHeight, 0, 1) * 0.18;
      const index = (y * width + x) * 4;

      panels.forEach((panel) => {
        const color = sampleFilter(texture, panel.filter.id, footprint, state);
        panel.image.data[index] = clamp(color[0] * (1 - fog) + 18 * fog, 0, 255);
        panel.image.data[index + 1] = clamp(color[1] * (1 - fog) + 26 * fog, 0, 255);
        panel.image.data[index + 2] = clamp(color[2] * (1 - fog) + 28 * fog, 0, 255);
        panel.image.data[index + 3] = 255;
      });
    }
  }

  panels.forEach((panel) => panel.ctx.putImageData(panel.image, 0, 0));
  return panels.map((panel) => panel.canvas);
}

function drawPanelOverlay(ctx, panel, x, y, width, height, compact) {
  const headingHeight = compact ? 46 : 54;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = "rgba(8, 12, 13, 0.76)";
  ctx.fillRect(x, y, width, headingHeight);
  ctx.fillStyle = panel.color;
  ctx.fillRect(x, y, width, 3);

  ctx.fillStyle = "#eef4f2";
  ctx.font = compact ? "700 13px Inter, sans-serif" : "700 14px Inter, sans-serif";
  ctx.fillText(panel.title, x + 9, y + (compact ? 20 : 23));
  ctx.fillStyle = "#a9bbb7";
  ctx.font = compact ? "10px Inter, sans-serif" : "12px Inter, sans-serif";
  ctx.fillText(panel.note, x + 9, y + (compact ? 37 : 42));
}

function drawFootprintGuide(ctx, x, y, width, height, color) {
  const cx = x + width * 0.5;
  const farY = y + height * 0.18;
  const nearY = y + height * 0.82;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(cx - width * 0.34, farY);
  ctx.lineTo(cx + width * 0.34, farY);
  ctx.moveTo(cx - width * 0.18, nearY);
  ctx.lineTo(cx + width * 0.18, nearY);
  ctx.stroke();
  ctx.setLineDash([]);
}

function draw(ctx, canvas, texture, state, quality = 1) {
  const { height, width } = prepareCanvas(canvas);
  const compact = window.matchMedia("(max-width: 600px)").matches;
  const medium = !compact && window.matchMedia("(max-width: 920px)").matches;
  const columns = compact ? 2 : medium ? 3 : FILTERS.length;
  const rows = Math.ceil(FILTERS.length / columns);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b0d0e";
  ctx.fillRect(0, 0, width, height);

  const margin = compact ? 10 : 16;
  const top = compact ? 70 : medium ? 62 : 56;
  const bottom = compact ? 38 : 56;
  const gap = compact ? 8 : 10;
  const panelWidth = Math.floor((width - margin * 2 - gap * (columns - 1)) / columns);
  const panelHeight = Math.max(90, Math.floor((height - top - bottom - gap * (rows - 1)) / rows));

  ctx.fillStyle = "#e8fff8";
  ctx.font = compact ? "700 14px Inter, sans-serif" : "700 16px Inter, sans-serif";
  ctx.fillText(compact ? "高频纹理会暴露 aliasing" : "远处高频细节用于暴露 aliasing；底部文字用于观察过滤造成的清晰度损失", margin, 26);
  ctx.fillStyle = "#9fb0ad";
  ctx.font = compact ? "11px Inter, sans-serif" : "12px Inter, sans-serif";
  ctx.fillText(
    compact ? "比较五种方法的稳定性与细节保留" : "SAT 使用矩形面积平均；各向异性沿主轴多点采样，所以斜视方向更稳定也更清晰。",
    margin,
    compact ? 47 : 45,
  );

  const renderWidth = Math.max(1, Math.round(panelWidth * quality));
  const renderHeight = Math.max(1, Math.round(panelHeight * quality));
  const renderedPanels = renderPanels(
    texture,
    FILTERS,
    renderWidth,
    renderHeight,
    panelWidth,
    panelHeight,
    state,
  );
  ctx.save();
  ctx.imageSmoothingEnabled = quality >= 1;
  FILTERS.forEach((filter, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = margin + column * (panelWidth + gap);
    const y = top + row * (panelHeight + gap);
    ctx.drawImage(renderedPanels[index], x, y, panelWidth, panelHeight);
    drawPanelOverlay(ctx, filter, x, y, panelWidth, panelHeight, compact);
    drawFootprintGuide(ctx, x, y, panelWidth, panelHeight, filter.color);
  });
  ctx.restore();

  ctx.fillStyle = "#9fb0ad";
  ctx.font = compact ? "11px Inter, sans-serif" : "12px Inter, sans-serif";
  ctx.fillText(
    compact ? "调整参数，比较稳定性与细节保留。" : "虚线：远处 footprint 明显变宽。无过滤会跳采样，双线性只混合 2x2，三线性混合 MIP，SAT 平均面积，各向异性保留斜向细节。",
    margin,
    top + rows * panelHeight + (rows - 1) * gap + (compact ? 24 : 31),
  );
  canvas.dataset.layout = `${columns}x${rows}`;
  canvas.dataset.quality = quality >= 1 ? "full" : "preview";
}

function createTexture() {
  const source = createSourceTexture();
  return {
    mips: createMipmaps(source),
    sat: createSat(source),
  };
}

export function initTextureFilteringLab() {
  const canvas = document.getElementById("textureFilteringCanvas");
  if (!canvas) {
    return;
  }

  const controls = {
    detail: document.getElementById("textureDetail"),
    viewAngle: document.getElementById("textureViewAngle"),
    mipBias: document.getElementById("textureMipBias"),
  };
  const outputs = {
    detail: document.getElementById("textureDetailValue"),
    viewAngle: document.getElementById("textureViewAngleValue"),
    mipBias: document.getElementById("textureMipBiasValue"),
    footprint: document.getElementById("textureFootprintValue"),
    aniso: document.getElementById("textureAnisoValue"),
  };
  const texture = createTexture();
  let renderFrame = 0;
  let settleTimer = 0;
  let pendingQuality = 1;

  function getState() {
    return {
      detail: Number(controls.detail.value),
      mipBias: Number(controls.mipBias.value) / 100,
      viewAngle: Number(controls.viewAngle.value),
    };
  }

  function render(quality = 1) {
    const state = getState();
    outputs.detail.textContent = `${state.detail}x`;
    outputs.viewAngle.textContent = `${state.viewAngle}°`;
    outputs.mipBias.textContent = state.mipBias.toFixed(2);

    const footprint = getFootprint(320, 72, 640, 420, state);
    outputs.footprint.textContent = `${footprint.major.toFixed(1)} texels`;
    outputs.aniso.textContent = `${(footprint.major / Math.max(1, footprint.minor)).toFixed(1)}:1`;

    draw(canvas.getContext("2d"), canvas, texture, state, quality);
  }

  function scheduleRender(quality = 1) {
    pendingQuality = quality;
    if (renderFrame) {
      return;
    }
    renderFrame = window.requestAnimationFrame(() => {
      renderFrame = 0;
      render(pendingQuality);
    });
  }

  function schedulePreviewThenFull() {
    window.clearTimeout(settleTimer);
    scheduleRender(0.5);
    settleTimer = window.setTimeout(() => scheduleRender(1), 180);
  }

  Object.values(controls).forEach((control) => {
    control.addEventListener("input", schedulePreviewThenFull);
    control.addEventListener("change", () => {
      window.clearTimeout(settleTimer);
      scheduleRender(1);
    });
  });
  window.addEventListener("resize", schedulePreviewThenFull);
  render();
}
