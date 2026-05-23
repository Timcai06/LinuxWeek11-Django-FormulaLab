import { useMemo, useState } from "react";

import type { FormulaItem } from "../types";

type ReviewFilter = "all" | "pending" | "confirmed";
type ReviewBucket = Exclude<ReviewFilter, "all">;

type FormulaReviewInboxProps = {
  activeItemId?: string;
  items: FormulaItem[];
  onSelect: (itemId: string) => void;
};

const FILTERS: Array<{ key: ReviewFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Needs Review" },
  { key: "confirmed", label: "Confirmed" },
];

export function FormulaReviewInbox({ activeItemId, items, onSelect }: FormulaReviewInboxProps) {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const counts = useMemo(() => summarizeItems(items), [items]);
  const visibleItems = useMemo(
    () => items.filter((item) => filter === "all" || normalizeReviewStatus(item.review_status) === filter),
    [filter, items],
  );

  return (
    <aside className="workspace-review-inbox" aria-label="Formula review inbox">
      <div className="workspace-review-inbox-heading">
        <div>
          <span>REVIEW INBOX</span>
          <strong>{counts.pending} open</strong>
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
            <button
              className={item.id === activeItemId ? "is-active" : ""}
              key={item.id}
              onClick={() => onSelect(item.id)}
              type="button"
            >
              <span className="workspace-review-inbox-card-topline">
                <strong>{item.formula_code}</strong>
                <em>{item.review_status.toUpperCase()}</em>
              </span>
              <code>{previewLatex(item.latex_current)}</code>
              <span className="workspace-review-inbox-meta">
                <small>{item.source_job_code || "manual"}</small>
                <small>Q{item.quality_score}</small>
              </span>
            </button>
          ))
        ) : (
          <p>No formulas match this review state.</p>
        )}
      </div>
    </aside>
  );
}

function normalizeReviewStatus(status: string): ReviewBucket {
  const value = status.toLowerCase();
  if (value === "confirmed") {
    return "confirmed";
  }
  return "pending";
}

function summarizeItems(items: FormulaItem[]) {
  return items.reduce(
    (summary, item) => {
      const status = normalizeReviewStatus(item.review_status);
      return {
        ...summary,
        [status]: summary[status] + 1,
      };
    },
    { confirmed: 0, pending: 0 },
  );
}

function filterCount(filter: ReviewFilter, counts: ReturnType<typeof summarizeItems>, total: number): number {
  if (filter === "all") {
    return total;
  }
  return counts[filter];
}

function previewLatex(source: string): string {
  const normalized = source.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return "No LaTeX captured yet.";
  }
  return normalized.length > 96 ? `${normalized.slice(0, 96)}...` : normalized;
}
