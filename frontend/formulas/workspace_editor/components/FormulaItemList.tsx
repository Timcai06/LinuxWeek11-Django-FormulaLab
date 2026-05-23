import type { FormulaItem } from "../types";

type FormulaItemListProps = {
  activeItemId?: string;
  items: FormulaItem[];
  onSelect: (itemId: string) => void;
};

export function FormulaItemList({ activeItemId, items, onSelect }: FormulaItemListProps) {
  return (
    <nav className="workspace-editor-item-list" aria-label="Editor formula items">
      {items.map((item) => (
        <button
          className={item.id === activeItemId ? "is-active" : ""}
          key={item.id}
          onClick={() => onSelect(item.id)}
          type="button"
        >
          <span>{item.formula_code}</span>
          <small>{item.review_status.toUpperCase()}</small>
        </button>
      ))}
    </nav>
  );
}
