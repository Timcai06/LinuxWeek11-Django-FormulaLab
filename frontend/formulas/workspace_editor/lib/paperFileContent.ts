import type { PaperDocument, PaperFile } from "../types";
import type { PaperFileTemplateKey } from "../components/PaperFileDialog";

export function firstRootFile(documents: PaperDocument[]): PaperFile | null {
  const document = documents[0];
  if (!document) {
    return null;
  }
  return document.files.find((file) => file.path === document.root_file_path) ?? document.files[0] ?? null;
}

export function suggestedFilePath(document: PaperDocument): string {
  return `sections/section-${document.files.length + 1}.tex`;
}

export function defaultPaperFileContent(path: string, template: PaperFileTemplateKey): string {
  if (template === "bibliography" || path.endsWith(".bib")) {
    return "% Bibliography entries\n";
  }
  if (template === "blank") {
    return "";
  }
  const title = path
    .split("/")
    .pop()
    ?.replace(/\.[^.]+$/, "")
    .replace(/[-_]/g, " ");
  return `\\section{${title || "New Section"}}\n\n`;
}

export function insertEquationBlock(content: string, latex: string): string {
  const source = latex.trim();
  if (!source) {
    return content;
  }

  const equationBlock = `\\begin{equation}\n${source}\n\\end{equation}`;
  const endDocumentToken = "\\end{document}";
  const endDocumentIndex = content.lastIndexOf(endDocumentToken);

  if (endDocumentIndex >= 0) {
    const beforeEndDocument = content.slice(0, endDocumentIndex).trimEnd();
    const afterEndDocument = content.slice(endDocumentIndex).trimStart();
    return `${beforeEndDocument}\n\n${equationBlock}\n\n${afterEndDocument}`;
  }

  const existingContent = content.trimEnd();
  if (!existingContent) {
    return `${equationBlock}\n`;
  }
  return `${existingContent}\n\n${equationBlock}\n`;
}
