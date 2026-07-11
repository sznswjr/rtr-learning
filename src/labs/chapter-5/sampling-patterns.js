import { prepareCanvas } from "../../render/canvas.js?v=20260710-1";
import { TAU } from "../../render/math.js?v=20260710-1";

const samplingState = {
  edgeAngle: 28,
  edgeOffset: 0,
  pattern: "grid",
  sampleCount: 4,
  seed: 7,
};

const patternLabels = {
  center: "中心点",
  grid: "规则网格",
  rotatedGrid: "旋转网格",
  nrooks: "N-Rooks",
  stratified: "分层随机",
  poisson: "Poisson 分布",
};

const poissonSamples = [
  [0.5, 0.5],
  [0.28, 0.32],
  [0.72, 0.68],
  [0.33, 0.74],
  [0.76, 0.27],
  [0.18, 0.57],
  [0.57, 0.17],
  [0.88, 0.51],
  [0.49, 0.87],
  [0.12, 0.18],
  [0.39, 0.48],
  [0.63, 0.43],
  [0.22, 0.86],
  [0.84, 0.82],
  [0.08, 0.42],
  [0.93, 0.12],
];

const ui = {
  samplePattern: document.querySelector("#samplePattern"),
  sampleCount: document.querySelector("#sampleCount"),
  edgeAngle: document.querySelector("#edgeAngle"),
  edgeAngleValue: document.querySelector("#edgeAngleValue"),
  edgeOffset: document.querySelector("#edgeOffset"),
  edgeOffsetValue: document.querySelector("#edgeOffsetValue"),
  sampleSeed: document.querySelector("#sampleSeed"),
  sampleSeedValue: document.querySelector("#sampleSeedValue"),
  activePatternLabel: document.querySelector("#activePatternLabel"),
  coveredSamples: document.querySelector("#coveredSamples"),
  averageCoverage: document.querySelector("#averageCoverage"),
  samplingPatternLabel: document.querySelector("#samplingPatternLabel"),
  samplingCoverageLabel: document.querySelector("#samplingCoverageLabel"),
  samplingPatternCanvas: document.querySelector("#samplingPatternCanvas"),
  samplingCoverageCanvas: document.querySelector("#samplingCoverageCanvas"),
};

function getEffectiveSampleCount() {
  return samplingState.pattern === "center" ? 1 : samplingState.sampleCount;
}

function createGridSamples(count) {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const samples = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (samples.length >= count) {
        break;
      }
      samples.push([(col + 0.5) / cols, (row + 0.5) / rows]);
    }
  }

  return samples;
}

function createRotatedGridSamples(count) {
  if (count === 1) {
    return [[0.5, 0.5]];
  }

  const base = createGridSamples(count);
  const angle = 26.565 * (Math.PI / 180);
  const s = Math.sin(angle);
  const c = Math.cos(angle);
  const rotated = base.map(([x, y]) => {
    const dx = x - 0.5;
    const dy = y - 0.5;
    return [dx * c - dy * s + 0.5, dx * s + dy * c + 0.5];
  });

  const xs = rotated.map(([x]) => x);
  const ys = rotated.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  return rotated.map(([x, y]) => [
    0.14 + ((x - minX) / rangeX) * 0.72,
    0.14 + ((y - minY) / rangeY) * 0.72,
  ]);
}

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) {
    value += 2147483646;
  }

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function createStratifiedSamples(count, seed) {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const random = seededRandom(seed * 997 + count * 37);
  const samples = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (samples.length >= count) {
        break;
      }
      samples.push([(col + random()) / cols, (row + random()) / rows]);
    }
  }

  return samples;
}

function createNRooksSamples(count, seed) {
  if (count === 1) {
    return [[0.5, 0.5]];
  }

  const random = seededRandom(seed * 6151 + count * 101);
  const rows = Array.from({ length: count }, (_, index) => index);

  for (let index = rows.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [rows[index], rows[swapIndex]] = [rows[swapIndex], rows[index]];
  }

  return rows.map((row, col) => [
    (col + 0.5) / count,
    (row + 0.5) / count,
  ]);
}

function createPoissonSamples(count, seed) {
  const offset = seed % poissonSamples.length;
  return Array.from({ length: count }, (_, index) => poissonSamples[(index + offset) % poissonSamples.length]);
}

function getSamplingPositions() {
  const count = getEffectiveSampleCount();

  if (samplingState.pattern === "center") {
    return [[0.5, 0.5]];
  }

  if (samplingState.pattern === "rotatedGrid") {
    return createRotatedGridSamples(count);
  }

  if (samplingState.pattern === "stratified") {
    return createStratifiedSamples(count, samplingState.seed);
  }

  if (samplingState.pattern === "nrooks") {
    return createNRooksSamples(count, samplingState.seed);
  }

  if (samplingState.pattern === "poisson") {
    return createPoissonSamples(count, samplingState.seed);
  }

  return createGridSamples(count);
}

function getEdge() {
  const angle = samplingState.edgeAngle * (Math.PI / 180);
  const dir = [Math.cos(angle), Math.sin(angle)];
  return {
    normal: [-dir[1], dir[0]],
    offset: samplingState.edgeOffset / 100,
  };
}

function getSignedDistance(x, y, edge) {
  return (x - 0.5) * edge.normal[0] + (y - 0.5) * edge.normal[1] - edge.offset;
}

function isCovered(x, y, edge) {
  return getSignedDistance(x, y, edge) <= 0;
}

function clipPolygonToEdge(points, edge) {
  const clipped = [];

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const previous = points[(index + points.length - 1) % points.length];
    const currentInside = isCovered(current[0], current[1], edge);
    const previousInside = isCovered(previous[0], previous[1], edge);

    if (currentInside !== previousInside) {
      const previousDistance = getSignedDistance(previous[0], previous[1], edge);
      const currentDistance = getSignedDistance(current[0], current[1], edge);
      const t = previousDistance / (previousDistance - currentDistance);
      clipped.push([
        previous[0] + (current[0] - previous[0]) * t,
        previous[1] + (current[1] - previous[1]) * t,
      ]);
    }

    if (currentInside) {
      clipped.push(current);
    }
  }

  return clipped;
}

function drawPixelExperiment(canvas, samples, edge) {
  const { ctx, height, width } = prepareCanvas(canvas);
  const size = Math.min(width - 56, height - 70);
  const left = (width - size) * 0.5;
  const top = (height - size) * 0.5 + 12;
  const coveredPolygon = clipPolygonToEdge(
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    edge,
  );

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b0d0e";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#182324";
  ctx.fillRect(left, top, size, size);

  if (coveredPolygon.length > 0) {
    ctx.beginPath();
    coveredPolygon.forEach(([x, y], index) => {
      const px = left + x * size;
      const py = top + y * size;
      if (index === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    });
    ctx.closePath();
    ctx.fillStyle = "#d76f39";
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  for (let index = 1; index < 4; index += 1) {
    const x = left + (size * index) / 4;
    const y = top + (size * index) / 4;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + size);
    ctx.moveTo(left, y);
    ctx.lineTo(left + size, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(238, 244, 242, 0.9)";
  ctx.lineWidth = 2;
  ctx.strokeRect(left, top, size, size);

  const centerX = left + (0.5 + edge.normal[0] * edge.offset) * size;
  const centerY = top + (0.5 + edge.normal[1] * edge.offset) * size;
  const dir = [edge.normal[1], -edge.normal[0]];
  ctx.beginPath();
  ctx.moveTo(centerX - dir[0] * size, centerY - dir[1] * size);
  ctx.lineTo(centerX + dir[0] * size, centerY + dir[1] * size);
  ctx.strokeStyle = "#eef4f2";
  ctx.lineWidth = 3;
  ctx.stroke();

  let coveredCount = 0;
  for (const [x, y] of samples) {
    const covered = isCovered(x, y, edge);
    if (covered) {
      coveredCount += 1;
    }

    const px = left + x * size;
    const py = top + y * size;
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, TAU);
    ctx.fillStyle = covered ? "#ffd38a" : "#54c6da";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#101314";
    ctx.stroke();
  }

  ctx.fillStyle = "#b8c8c4";
  ctx.font = "13px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("1 像素", left, top - 16);

  return coveredCount;
}

function mixColor(a, b, amount) {
  return a.map((channel, index) => Math.round(channel + (b[index] - channel) * amount));
}

function drawCoverageExperiment(canvas, samples, edge) {
  const { ctx, height, width } = prepareCanvas(canvas);
  const cols = 28;
  const rows = 18;
  const pad = 28;
  const cell = Math.min((width - pad * 2) / cols, (height - pad * 2) / rows);
  const gridWidth = cols * cell;
  const gridHeight = rows * cell;
  const left = (width - gridWidth) * 0.5;
  const top = (height - gridHeight) * 0.5;
  const empty = [18, 25, 26];
  const full = [215, 111, 57];
  let coverageTotal = 0;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b0d0e";
  ctx.fillRect(0, 0, width, height);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      let covered = 0;
      for (const [sampleX, sampleY] of samples) {
        const x = (col + sampleX) / cols;
        const y = (row + sampleY) / rows;
        if (isCovered(x, y, edge)) {
          covered += 1;
        }
      }

      const coverage = covered / samples.length;
      coverageTotal += coverage;
      const color = mixColor(empty, full, coverage);
      ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      ctx.fillRect(left + col * cell, top + row * cell, Math.ceil(cell), Math.ceil(cell));
    }
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  for (let col = 0; col <= cols; col += 1) {
    const x = left + col * cell;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + gridHeight);
    ctx.stroke();
  }
  for (let row = 0; row <= rows; row += 1) {
    const y = top + row * cell;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + gridWidth, y);
    ctx.stroke();
  }

  const centerX = left + (0.5 + edge.normal[0] * edge.offset) * gridWidth;
  const centerY = top + (0.5 + edge.normal[1] * edge.offset) * gridHeight;
  const dir = [edge.normal[1], -edge.normal[0]];
  ctx.beginPath();
  ctx.moveTo(centerX - dir[0] * gridWidth, centerY - dir[1] * gridHeight);
  ctx.lineTo(centerX + dir[0] * gridWidth, centerY + dir[1] * gridHeight);
  ctx.strokeStyle = "rgba(238, 244, 242, 0.88)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = "rgba(238, 244, 242, 0.75)";
  ctx.lineWidth = 2;
  ctx.strokeRect(left, top, gridWidth, gridHeight);

  return coverageTotal / (cols * rows);
}

function renderSamplingLab() {
  const samples = getSamplingPositions();
  const edge = getEdge();
  const coveredCount = drawPixelExperiment(ui.samplingPatternCanvas, samples, edge);
  const averageCoverage = drawCoverageExperiment(ui.samplingCoverageCanvas, samples, edge);
  const label = patternLabels[samplingState.pattern];

  ui.edgeAngleValue.value = `${samplingState.edgeAngle}°`;
  ui.edgeOffsetValue.value = `${samplingState.edgeOffset}%`;
  ui.sampleSeedValue.value = `${samplingState.seed}`;
  ui.activePatternLabel.textContent = label;
  ui.coveredSamples.textContent = `${coveredCount} / ${samples.length}`;
  ui.averageCoverage.textContent = `${Math.round(averageCoverage * 100)}%`;
  ui.samplingPatternLabel.textContent = `${samples.length} 个样本`;
  ui.samplingCoverageLabel.textContent = label;
}

export function initSamplingPatternsLab() {
  ui.samplePattern.addEventListener("change", () => {
    samplingState.pattern = ui.samplePattern.value;
    renderSamplingLab();
  });

  ui.sampleCount.addEventListener("change", () => {
    samplingState.sampleCount = Number(ui.sampleCount.value);
    renderSamplingLab();
  });

  ui.edgeAngle.addEventListener("input", () => {
    samplingState.edgeAngle = Number(ui.edgeAngle.value);
    renderSamplingLab();
  });

  ui.edgeOffset.addEventListener("input", () => {
    samplingState.edgeOffset = Number(ui.edgeOffset.value);
    renderSamplingLab();
  });

  ui.sampleSeed.addEventListener("input", () => {
    samplingState.seed = Number(ui.sampleSeed.value);
    renderSamplingLab();
  });

  window.addEventListener("resize", renderSamplingLab);
  renderSamplingLab();
}
