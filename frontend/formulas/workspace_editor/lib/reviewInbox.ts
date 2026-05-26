import type { FormulaItem, ReviewCardLayout } from "../types";

export type FormulaStatus = "auto_ready" | "confirmed" | "edited" | "exported" | "needs_review" | "rejected";
export type ReviewFilter = "all" | FormulaStatus;

export const FILTERS: Array<{ key: ReviewFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "needs_review", label: "Review" },
  { key: "auto_ready", label: "Auto" },
  { key: "edited", label: "Edited" },
  { key: "confirmed", label: "Confirmed" },
  { key: "exported", label: "Exported" },
  { key: "rejected", label: "Rejected" },
];

export const STATUS_PRIORITY: Record<FormulaStatus, number> = {
  needs_review: 0,
  edited: 1,
  auto_ready: 2,
  confirmed: 3,
  exported: 4,
  rejected: 5,
};

export const STATUS_LABEL: Record<FormulaStatus, string> = {
  auto_ready: "AUTO READY",
  confirmed: "CONFIRMED",
  edited: "EDITED",
  exported: "EXPORTED",
  needs_review: "NEEDS REVIEW",
  rejected: "REJECTED",
};

const FALLBACK_LAYOUT: ReviewCardLayout = {
  density: "normal",
  estimatedHeight: 130,
  originalLineCount: 1,
  previewText: "",
  rowSpan: 16,
  truncated: false,
  visibleLineCount: 1,
};

export function normalizeReviewStatus(status: string): FormulaStatus {
  const value = status.toLowerCase();
  if (isFormulaStatus(value)) {
    return value;
  }
  return "needs_review";
}

export function summarizeItems(items: FormulaItem[]): Record<FormulaStatus, number> {
  return items.reduce(
    (summary, item) => {
      const status = normalizeReviewStatus(item.review_status);
      return {
        ...summary,
        [status]: summary[status] + 1,
      };
    },
    { auto_ready: 0, confirmed: 0, edited: 0, exported: 0, needs_review: 0, rejected: 0 },
  );
}

export function sortReviewItems(first: FormulaItem, second: FormulaItem): number {
  const firstStatus = normalizeReviewStatus(first.review_status);
  const secondStatus = normalizeReviewStatus(second.review_status);
  const statusDelta = STATUS_PRIORITY[firstStatus] - STATUS_PRIORITY[secondStatus];
  if (statusDelta !== 0) {
    return statusDelta;
  }
  const qualityDelta = first.quality_score - second.quality_score;
  if (qualityDelta !== 0) {
    return qualityDelta;
  }
  return second.updated_at.localeCompare(first.updated_at);
}

export function filterCount(filter: ReviewFilter, counts: Record<FormulaStatus, number>, total: number): number {
  if (filter === "all") {
    return total;
  }
  return counts[filter];
}

export function measureReviewCard(source: string): ReviewCardLayout {
  const normalized = source.trim().replace(/\s+/g, " ");
  const layout = window.FormulaLayout?.measureReviewCard?.(normalized, {
    chromeHeight: 124,
    lineHeight: 17,
    maxLines: 3,
    rowUnit: 8,
    width: 230,
  });
  if (layout) {
    return layout;
  }
  if (!normalized) {
    return { ...FALLBACK_LAYOUT, previewText: "No LaTeX captured yet." };
  }
  return {
    ...FALLBACK_LAYOUT,
    previewText: normalized.length > 96 ? `${normalized.slice(0, 96)}...` : normalized,
    truncated: normalized.length > 96,
  };
}

export function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "updated";
  }
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
}

function isFormulaStatus(value: string): value is FormulaStatus {
  return value in STATUS_PRIORITY;
}
