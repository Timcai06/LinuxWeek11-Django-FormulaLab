import type {
  FormulaItem,
  FormulaItemVersionRestoreResponse,
  FormulaItemVersionsResponse,
  PaperFile,
  ProjectDocumentCreateResponse,
  ProjectDocumentsResponse,
  ProjectItemsResponse,
} from "./types";

export async function fetchProjectItems(url: string, signal?: AbortSignal): Promise<ProjectItemsResponse> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Unable to load project items: ${response.status}`);
  }

  return response.json() as Promise<ProjectItemsResponse>;
}

export async function fetchFormulaItem(itemId: string, signal?: AbortSignal): Promise<FormulaItem> {
  const response = await fetch(`/api/formula-items/${itemId}/`, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Unable to load formula item: ${response.status}`);
  }

  return response.json() as Promise<FormulaItem>;
}

export async function fetchFormulaItemVersions(
  itemId: string,
  signal?: AbortSignal,
): Promise<FormulaItemVersionsResponse> {
  const response = await fetch(`/api/formula-items/${itemId}/versions/`, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Unable to load formula versions: ${response.status}`);
  }

  return response.json() as Promise<FormulaItemVersionsResponse>;
}

export async function saveFormulaItem(itemId: string, latexCurrent: string, csrfToken: string): Promise<FormulaItem> {
  const response = await fetch(`/api/formula-items/${itemId}/`, {
    body: JSON.stringify({ latex_current: latexCurrent }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error(`Unable to save formula item: ${response.status}`);
  }

  return response.json() as Promise<FormulaItem>;
}

export async function restoreFormulaItemVersion(
  itemId: string,
  versionId: number,
  csrfToken: string,
): Promise<FormulaItemVersionRestoreResponse> {
  const response = await fetch(`/api/formula-items/${itemId}/versions/${versionId}/restore/`, {
    headers: {
      Accept: "application/json",
      "X-CSRFToken": csrfToken,
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Unable to restore formula version: ${response.status}`);
  }

  return response.json() as Promise<FormulaItemVersionRestoreResponse>;
}

export async function fetchProjectDocuments(
  projectId: string,
  signal?: AbortSignal,
): Promise<ProjectDocumentsResponse> {
  const response = await fetch(`/api/projects/${projectId}/documents/`, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Unable to load project documents: ${response.status}`);
  }

  return response.json() as Promise<ProjectDocumentsResponse>;
}

export async function createProjectDocument(
  projectId: string,
  title: string,
  csrfToken: string,
): Promise<ProjectDocumentCreateResponse> {
  const response = await fetch(`/api/projects/${projectId}/documents/`, {
    body: JSON.stringify({ title }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Unable to create project document: ${response.status}`);
  }

  return response.json() as Promise<ProjectDocumentCreateResponse>;
}

export async function createPaperFile(
  documentId: string,
  path: string,
  content: string,
  csrfToken: string,
): Promise<PaperFile> {
  const response = await fetch(`/api/documents/${documentId}/files/`, {
    body: JSON.stringify({ content, path }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Unable to create paper file: ${response.status}`);
  }

  return response.json() as Promise<PaperFile>;
}

export async function savePaperFile(fileId: string, content: string, csrfToken: string): Promise<PaperFile> {
  const response = await fetch(`/api/document-files/${fileId}/`, {
    body: JSON.stringify({ content }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error(`Unable to save paper file: ${response.status}`);
  }

  return response.json() as Promise<PaperFile>;
}

export async function renamePaperFile(fileId: string, path: string, csrfToken: string): Promise<PaperFile> {
  const response = await fetch(`/api/document-files/${fileId}/`, {
    body: JSON.stringify({ path }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error(`Unable to rename paper file: ${response.status}`);
  }

  return response.json() as Promise<PaperFile>;
}
