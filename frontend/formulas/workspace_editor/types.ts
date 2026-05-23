export type FormulaItem = {
  batch_title: string;
  id: string;
  formula_code: string;
  latex_current: string;
  latest_version?: FormulaItemVersion | null;
  quality_score: number;
  review_status: string;
  source_job_code: string;
  updated_at: string;
};

export type PaperFile = {
  id: string;
  document_id: string;
  path: string;
  file_type: string;
  content: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PaperDocument = {
  id: string;
  document_code: string;
  project_id: string;
  title: string;
  root_file_path: string;
  files: PaperFile[];
  created_at: string;
  updated_at: string;
};

export type ProjectDocumentsResponse = {
  project: {
    id: string;
    project_code: string;
    name: string;
  };
  documents: PaperDocument[];
};

export type ProjectDocumentCreateResponse = {
  document: Omit<PaperDocument, "files">;
  files: PaperFile[];
};

export type FormulaItemVersion = {
  id: number;
  latex: string;
  source: string;
  created_by_label: string;
  note: string;
  created_at: string;
};

export type FormulaItemVersionsResponse = {
  item_id: string;
  versions: FormulaItemVersion[];
};

export type FormulaItemVersionRestoreResponse = {
  item: FormulaItem;
  version: FormulaItemVersion;
};

export type ProjectItemsResponse = {
  project: {
    id: string;
    project_code: string;
    name: string;
  };
  items: FormulaItem[];
};

export type WorkspaceEditorConfig = {
  projectId: string;
  initialItemId: string;
  projectItemsUrl: string;
};

export type KatexRenderer = {
  render: (
    source: string,
    target: HTMLElement,
    options: {
      displayMode: boolean;
      throwOnError: boolean;
    },
  ) => void;
};

declare global {
  interface Window {
    katex?: KatexRenderer;
  }
}
