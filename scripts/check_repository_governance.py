from __future__ import annotations

import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


REQUIRED_GITIGNORE_ENTRIES = [
    ".conda/",
    ".pip-cache/",
    ".model-cache/",
    "node_modules/",
    "media/",
    "*.sqlite3",
]


@dataclass(frozen=True)
class GovernanceConfig:
    python_business_lines: int = 350
    test_lines: int = 450
    css_page_lines: int = 500
    handwritten_js_lines: int = 450
    markdown_decision_lines: int = 500


@dataclass(frozen=True)
class GovernanceFinding:
    path: Path
    message: str


def check_gitignore_contains_runtime_paths(gitignore_path: Path) -> list[str]:
    if not gitignore_path.exists():
        return REQUIRED_GITIGNORE_ENTRIES.copy()

    entries = [
        line.strip()
        for line in gitignore_path.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    ]
    return [
        required_entry
        for required_entry in REQUIRED_GITIGNORE_ENTRIES
        if not any(_gitignore_entry_matches(required_entry, entry) for entry in entries)
    ]


def _gitignore_entry_matches(required_entry: str, actual_entry: str) -> bool:
    normalized_actual = actual_entry.lstrip("/")
    if required_entry == "*.sqlite3":
        return normalized_actual in {"*.sqlite3", "**/*.sqlite3"}
    return normalized_actual == required_entry


def _is_exempt_path(path: Path) -> bool:
    path_text = path.as_posix()
    return (
        "/generated/" in path_text
        or "/vendor/" in path_text
        or path_text.startswith("docs/superpowers/plans/archive/")
    )


def classify_tracked_file(path: Path, line_count: int, byte_size: int, config: GovernanceConfig) -> GovernanceFinding | None:
    del byte_size
    path_text = path.as_posix()

    if _is_exempt_path(path):
        return None

    if path_text.startswith("apps/") and path.suffix == ".py" and line_count > config.python_business_lines:
        return GovernanceFinding(
            path=path,
            message=f"Python business file has {line_count} lines; split before exceeding {config.python_business_lines}.",
        )

    if path_text.startswith("tests/") and path.suffix == ".py" and line_count > config.test_lines:
        return GovernanceFinding(
            path=path,
            message=f"test file has {line_count} lines; split before exceeding {config.test_lines}.",
        )

    if (
        path_text.startswith("apps/")
        and path.suffix == ".css"
        and len(path.parts) >= 3
        and path.parts[-2] == "pages"
        and path.parts[-3] == "css"
        and line_count > config.css_page_lines
    ):
        return GovernanceFinding(
            path=path,
            message=f"page CSS has {line_count} lines; split before exceeding {config.css_page_lines}.",
        )

    if (
        path_text.startswith("apps/")
        and "/static/" in path_text
        and path.suffix == ".js"
        and line_count > config.handwritten_js_lines
    ):
        return GovernanceFinding(
            path=path,
            message=(
                f"handwritten static JS has {line_count} lines; "
                f"split before exceeding {config.handwritten_js_lines}."
            ),
        )

    if path_text.startswith("docs/") and path.suffix == ".md" and line_count > config.markdown_decision_lines:
        return GovernanceFinding(
            path=path,
            message=(
                f"Markdown decision document has {line_count} lines; "
                f"split before exceeding {config.markdown_decision_lines}."
            ),
        )

    return None


def _repo_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        check=True,
        capture_output=True,
        text=True,
    )
    return Path(result.stdout.strip())


def _tracked_files(repo_root: Path) -> list[Path]:
    result = subprocess.run(
        ["git", "-C", str(repo_root), "ls-files"],
        check=True,
        capture_output=True,
        text=True,
    )
    return [Path(line) for line in result.stdout.splitlines() if line.strip()]


def _line_count(path: Path) -> int:
    with path.open("rb") as file:
        return sum(1 for _ in file)


def main() -> int:
    repo_root = _repo_root()
    missing_entries = check_gitignore_contains_runtime_paths(repo_root / ".gitignore")
    findings = [
        GovernanceFinding(Path(".gitignore"), f"missing required runtime ignore entry: {entry}")
        for entry in missing_entries
    ]

    config = GovernanceConfig()
    for path in _tracked_files(repo_root):
        if _is_exempt_path(path):
            continue
        absolute_path = repo_root / path
        if not absolute_path.is_file():
            continue
        finding = classify_tracked_file(path, _line_count(absolute_path), absolute_path.stat().st_size, config)
        if finding is not None:
            findings.append(finding)

    for finding in findings:
        print(f"{finding.path}: {finding.message}")

    return 1 if missing_entries else 0


if __name__ == "__main__":
    sys.exit(main())
