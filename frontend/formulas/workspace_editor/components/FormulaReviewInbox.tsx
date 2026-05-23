import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import type { FormulaItem, ReviewCardLayout } from "../types";

type FormulaStatus = "auto_ready" | "confirmed" | "edited" | "exported" | "needs_review" | "rejected";
type ReviewFilter = "all" | FormulaStatus;

type FormulaReviewInboxProps = {
  activeItemId?: string;
  items: FormulaItem[];
  onSelect: (itemId: string) => void;
};

type ReviewCardStyle = CSSProperties & {
  "--review-card-rows": string;
};

const FILTERS: Array<{ key: ReviewFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "needs_review", label: "Review" },
  { key: "auto_ready", label: "Auto" },
  { key: "edited", label: "Edited" },
  { key: "confirmed", label: "Confirmed" },
  { key: "exported", label: "Exported" },
  { key: "rejected", label: "Rejected" },
];

const STATUS_PRIORITY: Record<FormulaStatus, number> = {
  needs_review: 0,
  edited: 1,
  auto_ready: 2,
  confirmed: 3,
  exported: 4,
  rejected: 5,
};

const STATUS_LABEL: Record<FormulaStatus, string> = {
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

export function FormulaReviewInbox({ activeItemId, items, onSelect }: FormulaReviewInboxProps) {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const counts = useMemo(() => summarizeItems(items), [items]);
  const openCount = counts.needs_review + counts.auto_ready + counts.edited;
  const sortedItems = useMemo(() => [...items].sort(sortReviewItems), [items]);
  const visibleItems = useMemo(
    () => sortedItems.filter((item) => filter === "all" || normalizeReviewStatus(item.review_status) === filter),
    [filter, sortedItems],
  );

  return (
    <aside className="workspace-review-inbox" aria-label="Formula review inbox">
      <div className="workspace-review-inbox-heading">
        <div>
          <span>REVIEW INBOX</span>
          <strong>{openCount} open</strong>
        </div>
        <small>{items.length} formulas</small>
      </div>

      <div className="workspace-review-inbox-filters" role="group" aria-label="Filter formula review inbox">
        {FILTERS.map((option) => (
          <button
            className={filter === option.key ? "is-active" : ""}
            key={option.key}
            onClick={() => setFilter(option.key)}
            type="button"
          >
            {option.label}
            <span>{filterCount(option.key, counts, items.length)}</span>
          </button>
        ))}
      </div>

      <div className="workspace-review-inbox-list">
        {visibleItems.length ? (
          visibleItems.map((item) => (
            <ReviewInboxCard active={item.id === activeItemId} item={item} key={item.id} onSelect={onSelect} />
          ))
        ) : (
          <p>No formulas match this review state.</p>
        )}
      </div>
    </aside>
  );
}

function ReviewInboxCard({
  active,
  item,
  onSelect,
}: {
  active: boolean;
  item: FormulaItem;
  onSelect: (itemId: string) => void;
}) {
  const layout = measureReviewCard(item.latex_current);
  const status = normalizeReviewStatus(item.review_status);
  const style = { "--review-card-rows": String(layout.rowSpan) } as ReviewCardStyle;

  return (
    <button
      className={active ? "is-active" : ""}
      data-review-density={layout.density}
      data-review-status={status}
      onClick={() => onSelect(item.id)}
      style={style}
      type="button"
    >
      <span className="workspace-review-inbox-card-topline">
        <strong>{item.formula_code}</strong>
        <em>{STATUS_LABEL[status]}</em>
      </span>
      <MiniFormulaPreview latex={item.latex_current} />
      <code title={item.latex_current}>{layout.previewText || "No LaTeX captured yet."}</code>
      <span className="workspace-review-inbox-meta">
        <small>{item.source_job_code || "manual"}</small>
        <small>Q{item.quality_score}</small>
        <small>{formatUpdatedAt(item.updated_at)}</small>
      </span>
      {layout.truncated ? (
        <span className="workspace-review-inbox-truncation">
          {layout.originalLineCount} measured lines
        </span>
      ) : null}
    </button>
  );
}

function MiniFormulaPreview({ latex }: { latex: string }) {
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const target = previewRef.current;
    if (!target) {
      return undefined;
    }

    function render(attempt = 0) {
      if (!target || cancelled) {
        return;
      }
      const source = latex.trim();
      target.replaceChildren();
      if (!source) {
        target.textContent = "No preview";
        return;
      }
      if (!window.katex) {
        if (attempt < 5) {
          window.setTimeout(() => render(attempt + 1), 80);
          return;
        }
        target.textContent = source;
        return;
      }
      window.katex.render(source, target, {
        displayMode: false,
        throwOnError: false,
      });
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [latex]);

  return <span className="workspace-review-inbox-katex" ref={previewRef} />;
}

function normalizeReviewStatus(status: string): FormulaStatus {
  const value = status.toLowerCase();
  if (isFormulaStatus(value)) {
    return value;
  }
  return "needs_review";
}

function isFormulaStatus(value: string): value is FormulaStatus {
  return value in STATUS_PRIORITY;
}

function summarizeItems(items: FormulaItem[]): Record<FormulaStatus, number> {
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

function sortReviewItems(first: FormulaItem, second: FormulaItem): number {
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

function filterCount(filter: ReviewFilter, counts: Record<FormulaStatus, number>, total: number): number {
  if (filter === "all") {
    return total;
  }
  return counts[filter];
}

function measureReviewCard(source: string): ReviewCardLayout {
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

function formatUpdatedAt(value: string): string {
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
