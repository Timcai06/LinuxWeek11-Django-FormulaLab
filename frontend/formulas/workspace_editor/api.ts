import type { FormulaItem, FormulaItemVersionsResponse, ProjectItemsResponse } from "./types";

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
