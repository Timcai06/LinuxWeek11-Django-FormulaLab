import {
  prepare,
  layout,
  prepareWithSegments,
  measureLineStats,
  walkLineRanges,
} from "@chenglou/pretext";

const preparedCache = new Map();

function normalizeText(text) {
  return String(text || "");
}

function hasText(text) {
  return normalizeText(text).length > 0;
}

function toPositiveNumber(value, fallback) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback;
}

function cacheKey(text, font, options) {
  return JSON.stringify([text, font, options || {}]);
}

function getPrepared(text, font, options = {}) {
  const normalized = normalizeText(text);
  const key = cacheKey(normalized, font, options);
  if (!preparedCache.has(key)) {
    preparedCache.set(key, prepare(normalized, font, options));
  }
  return preparedCache.get(key);
}

function measureTextBlock(text, config = {}) {
  const width = toPositiveNumber(config.width, 320);
  const lineHeight = toPositiveNumber(config.lineHeight, 20);
  const font = config.font || "14px JetBrains Mono, ui-monospace, monospace";
  const options = config.whiteSpace ? { whiteSpace: config.whiteSpace } : {};
  if (!hasText(text)) {
    return { lineCount: 0, height: 0 };
  }
  const prepared = getPrepared(text, font, options);
  return layout(prepared, width, lineHeight);
}

function measureLatexSummary(text, config = {}) {
  const width = toPositiveNumber(config.width, 420);
  const lineHeight = toPositiveNumber(config.lineHeight, 18);
  const font = config.font || "13px JetBrains Mono, ui-monospace, monospace";
  if (!hasText(text)) {
    return { lineCount: 0, maxLineWidth: 0 };
  }
  const prepared = prepareWithSegments(normalizeText(text), font, { whiteSpace: "pre-wrap" });
  return measureLineStats(prepared, width, lineHeight);
}

function findTightWidth(text, config = {}) {
  const maxWidth = toPositiveNumber(config.maxWidth, 520);
  const minWidth = Math.min(toPositiveNumber(config.minWidth, 160), maxWidth);
  const lineHeight = toPositiveNumber(config.lineHeight, 18);
  const font = config.font || "13px JetBrains Mono, ui-monospace, monospace";
  if (!hasText(text)) {
    return {
      width: minWidth,
      lineCount: 0,
      maxLineWidth: 0,
      targetLineCount: 0,
    };
  }
  const prepared = prepareWithSegments(normalizeText(text), font, { whiteSpace: "pre-wrap" });
  const targetLineCount = measureLineStats(prepared, maxWidth, lineHeight).lineCount;
  let low = minWidth;
  let high = maxWidth;

  while (high - low > 4) {
    const mid = Math.floor((low + high) / 2);
    const lineCount = measureLineStats(prepared, mid, lineHeight).lineCount;
    if (lineCount > targetLineCount) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  const stats = measureLineStats(prepared, high, lineHeight);
  return {
    width: high,
    lineCount: stats.lineCount,
    maxLineWidth: stats.maxLineWidth,
    targetLineCount,
  };
}

function collectLineWidths(text, config = {}) {
  const width = toPositiveNumber(config.width, 420);
  const font = config.font || "13px JetBrains Mono, ui-monospace, monospace";
  if (!hasText(text)) {
    return [];
  }
  const prepared = prepareWithSegments(normalizeText(text), font, { whiteSpace: "pre-wrap" });
  const widths = [];
  walkLineRanges(prepared, width, (line) => {
    widths.push(Math.round(line.width));
  });
  return widths;
}

const formulaLayoutTarget = globalThis.window || globalThis;

formulaLayoutTarget.FormulaLayout = {
  measureTextBlock,
  measureLatexSummary,
  findTightWidth,
  collectLineWidths,
};
