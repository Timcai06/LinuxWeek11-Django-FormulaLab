import { useMemo, useState, type CSSProperties } from "react";

import {
  FILTERS,
  STATUS_LABEL,
  filterCount,
  formatUpdatedAt,
  measureReviewCard,
  normalizeReviewStatus,
  sortReviewItems,
  summarizeItems,
  type ReviewFilter,
} from "../lib/reviewInbox";
import type { FormulaItem } from "../types";
import { MiniFormulaPreview } from "./MiniFormulaPreview";

type FormulaReviewInboxProps = {
  activeItemId?: string;
  items: FormulaItem[];
  onSelect: (itemId: string) => void;
};

type ReviewCardStyle = CSSProperties & {
  "--review-card-rows": string;
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
