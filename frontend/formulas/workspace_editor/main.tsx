import { createRoot } from "react-dom/client";

import { EditorIsland } from "./components/EditorIsland";
import "./styles/workspace-editor.css";
import type { WorkspaceEditorConfig } from "./types";

const rootElement = document.getElementById("workspace-editor-root");

function readConfig(element: HTMLElement): WorkspaceEditorConfig {
  return {
    initialItemId: element.dataset.initialItemId ?? "",
    projectId: element.dataset.projectId ?? "",
    projectItemsUrl: element.dataset.projectItemsUrl ?? "",
  };
}

if (rootElement instanceof HTMLElement) {
  createRoot(rootElement).render(<EditorIsland config={readConfig(rootElement)} />);
}
