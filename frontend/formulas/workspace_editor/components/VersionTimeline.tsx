import type { FormulaItemVersion } from "../types";

type VersionTimelineProps = {
  onRestore: (versionId: number) => void;
  restoringVersionId: number | null;
  versions: FormulaItemVersion[];
};

export function VersionTimeline({ onRestore, restoringVersionId, versions }: VersionTimelineProps) {
  return (
    <aside className="workspace-editor-version-list" aria-label="Formula version timeline">
      <span>VERSION TIMELINE</span>
      {versions.length ? (
        <ol>
          {versions.map((version) => (
            <li key={version.id}>
              <div>
                <strong>{version.source.toUpperCase()}</strong>
                <small>{version.created_by_label || "system"}</small>
              </div>
              <code>{version.latex}</code>
              <button
                disabled={restoringVersionId !== null}
                onClick={() => onRestore(version.id)}
                type="button"
              >
                {restoringVersionId === version.id ? "RESTORING" : "RESTORE"}
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p>No versions recorded.</p>
      )}
    </aside>
  );
}
