import os
import json
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.test import SimpleTestCase

from scripts import check_repository_governance
from scripts.check_repository_governance import (
    REQUIRED_GITIGNORE_ENTRIES,
    GovernanceConfig,
    check_gitignore_contains_runtime_paths,
    classify_tracked_file,
)


class RepositoryGovernanceTests(SimpleTestCase):
    def test_base_requirements_keep_pix2tex_stack_optional(self):
        base_requirements = Path("requirements.txt").read_text(encoding="utf-8").splitlines()
        paddle_requirements = Path("requirements-paddle.txt").read_text(encoding="utf-8").splitlines()
        optional_pix2tex_requirements = Path("requirements-pix2tex.txt").read_text(encoding="utf-8").splitlines()

        normalized_base = {line.strip().split("==")[0].split(">=")[0] for line in base_requirements if line.strip()}
        normalized_paddle = {line.strip().split("==")[0].split(">=")[0] for line in paddle_requirements if line.strip()}
        normalized_optional = {
            line.strip().split("==")[0].split(">=")[0] for line in optional_pix2tex_requirements if line.strip()
        }

        self.assertTrue({"pix2tex", "torch", "torchvision"}.isdisjoint(normalized_base))
        self.assertIn("tokenizers", normalized_paddle)
        self.assertTrue({"pix2tex", "torch", "torchvision"}.issubset(normalized_optional))

    def test_docker_web_entrypoint_uses_wsgi_runtime_not_runserver(self):
        entrypoint = Path("scripts/entrypoint-web.sh").read_text(encoding="utf-8")
        base_requirements = Path("requirements.txt").read_text(encoding="utf-8")
        compose = Path("docker-compose.yml").read_text(encoding="utf-8")

        self.assertIn("gunicorn", base_requirements)
        self.assertIn("collectstatic --noinput", entrypoint)
        self.assertIn("gunicorn config.wsgi:application", entrypoint)
        self.assertNotIn("runserver", entrypoint)
        self.assertIn("service_healthy", compose)
        self.assertIn("curl -fsS http://localhost:8000/", compose)

    def test_workspace_editor_build_chain_is_declared(self):
        package_json = json.loads(Path("package.json").read_text(encoding="utf-8"))
        dependencies = package_json["dependencies"]
        dev_dependencies = package_json["devDependencies"]
        scripts = package_json["scripts"]

        self.assertIn("@codemirror/state", dependencies)
        self.assertIn("@codemirror/view", dependencies)
        self.assertIn("react", dependencies)
        self.assertIn("react-dom", dependencies)
        self.assertIn("@vitejs/plugin-react", dev_dependencies)
        self.assertIn("typescript", dev_dependencies)
        self.assertIn("vite", dev_dependencies)
        self.assertIn("tsc --noEmit", scripts["check:editor"])
        self.assertIn("vite build", scripts["build:editor"])
        self.assertIn("npm run build:editor", scripts["build"])

    def test_workspace_editor_uses_formula_item_api_contract(self):
        api_source = Path("frontend/formulas/workspace_editor/api.ts").read_text(encoding="utf-8")
        component_sources = "\n".join(
            path.read_text(encoding="utf-8")
            for path in Path("frontend/formulas/workspace_editor/components").glob("*.tsx")
        )

        self.assertIn("fetchFormulaItem", api_source)
        self.assertIn("saveFormulaItem", api_source)
        self.assertIn("restoreFormulaItemVersion", api_source)
        self.assertIn("fetchFormulaItemVersions", api_source)
        self.assertIn('method: "PATCH"', api_source)
        self.assertIn('method: "POST"', api_source)
        self.assertIn('"X-CSRFToken"', api_source)
        self.assertIn("workspace-editor-form", component_sources)
        self.assertIn("workspace-editor-preview", component_sources)
        self.assertIn("workspace-editor-version-list", component_sources)
        self.assertIn("saveFormulaItem", component_sources)
        self.assertIn("fetchFormulaItemVersions", component_sources)
        self.assertIn("restoreFormulaItemVersion", component_sources)

    def test_workspace_editor_uses_paper_document_api_contract(self):
        api_source = Path("frontend/formulas/workspace_editor/api.ts").read_text(encoding="utf-8")
        component_sources = "\n".join(
            path.read_text(encoding="utf-8")
            for path in Path("frontend/formulas/workspace_editor/components").glob("*.tsx")
        )

        self.assertIn("fetchProjectDocuments", api_source)
        self.assertIn("createProjectDocument", api_source)
        self.assertIn("createPaperFile", api_source)
        self.assertIn("renamePaperFile", api_source)
        self.assertIn("savePaperFile", api_source)
        self.assertIn("/api/projects/${projectId}/documents/", api_source)
        self.assertIn("/api/documents/${documentId}/files/", api_source)
        self.assertIn("/api/document-files/${fileId}/", api_source)
        self.assertIn("EditorView", component_sources)
        self.assertIn("lineNumbers()", component_sources)
        self.assertIn('data-editor-engine="codemirror"', component_sources)
        self.assertIn("workspace-panel", component_sources)
        self.assertIn("panel-heading", component_sources)
        self.assertIn("workspace-code-editor", component_sources)
        self.assertIn("workspace-paper-file-actions", component_sources)
        self.assertIn("workspace-paper-shell", component_sources)
        self.assertIn("workspace-paper-file-tree", component_sources)
        self.assertIn("workspace-paper-source", component_sources)
        self.assertIn("workspace-paper-preview", component_sources)

    def test_required_runtime_paths_are_listed_in_gitignore(self):
        gitignore_path = Path(".gitignore")

        missing_entries = check_gitignore_contains_runtime_paths(gitignore_path)

        self.assertEqual(missing_entries, [])
        self.assertEqual(
            REQUIRED_GITIGNORE_ENTRIES,
            [".conda/", ".pip-cache/", ".model-cache/", "node_modules/", "media/", "staticfiles/", "*.sqlite3"],
        )

    def test_missing_runtime_paths_are_reported(self):
        with TemporaryDirectory() as temp_dir:
            gitignore_path = Path(temp_dir) / ".gitignore"
            gitignore_path.write_text(".conda/\nnode_modules/\nmedia/\n", encoding="utf-8")

            missing_entries = check_gitignore_contains_runtime_paths(gitignore_path)

        self.assertEqual(missing_entries, [".pip-cache/", ".model-cache/", "staticfiles/", "*.sqlite3"])

    def test_semantically_equivalent_gitignore_patterns_are_accepted(self):
        with TemporaryDirectory() as temp_dir:
            gitignore_path = Path(temp_dir) / ".gitignore"
            gitignore_path.write_text(
                "\n".join(
                    [
                        "/.conda/",
                        "/.pip-cache/",
                        "/.model-cache/",
                        "/node_modules/",
                        "/media/",
                        "/staticfiles/",
                        "**/*.sqlite3",
                    ]
                ),
                encoding="utf-8",
            )

            missing_entries = check_gitignore_contains_runtime_paths(gitignore_path)

        self.assertEqual(missing_entries, [])

    def test_main_resolves_gitignore_from_repository_root_when_run_from_subdirectory(self):
        current_dir = Path.cwd()
        try:
            os.chdir("apps/formulas")

            with redirect_stdout(StringIO()):
                exit_code = check_repository_governance.main()
        finally:
            os.chdir(current_dir)

        self.assertEqual(exit_code, 0)

    def test_main_does_not_count_lines_for_exempt_tracked_paths(self):
        exempt_paths = [
            Path("apps/formulas/static/formulas/js/generated/layout-intelligence.js"),
            Path("apps/formulas/static/formulas/vendor/katex/katex.min.js"),
            Path("docs/superpowers/plans/archive/old-plan.md"),
        ]

        with (
            patch("scripts.check_repository_governance._repo_root", return_value=Path.cwd()),
            patch("scripts.check_repository_governance._tracked_files", return_value=exempt_paths),
            patch("scripts.check_repository_governance._line_count", side_effect=AssertionError("line count called")),
        ):
            exit_code = check_repository_governance.main()

        self.assertEqual(exit_code, 0)

    def test_generated_layout_intelligence_bundle_is_allowed_when_large(self):
        finding = classify_tracked_file(
            Path("apps/formulas/static/formulas/js/generated/layout-intelligence.js"),
            line_count=10_000,
            byte_size=500_000,
            config=GovernanceConfig(),
        )

        self.assertIsNone(finding)

    def test_handwritten_static_js_is_flagged_when_over_threshold(self):
        finding = classify_tracked_file(
            Path("apps/formulas/static/formulas/js/workbench.js"),
            line_count=451,
            byte_size=20_000,
            config=GovernanceConfig(),
        )

        self.assertIsNotNone(finding)
        self.assertEqual(finding.path, Path("apps/formulas/static/formulas/js/workbench.js"))
        self.assertIn("handwritten static JS", finding.message)
        self.assertIn("451", finding.message)

    def test_repository_governance_classifies_large_tracked_sources(self):
        config = GovernanceConfig()

        cases = [
            (Path("apps/formulas/services/recognizer.py"), 351, "Python business file"),
            (Path("tests/formulas/test_views.py"), 451, "test file"),
            (Path("apps/formulas/static/formulas/css/pages/workbench.css"), 501, "page CSS"),
            (Path("docs/architecture.md"), 501, "Markdown decision document"),
        ]

        for path, line_count, expected_message in cases:
            with self.subTest(path=path):
                finding = classify_tracked_file(path, line_count, byte_size=10_000, config=config)

                self.assertIsNotNone(finding)
                self.assertIn(expected_message, finding.message)

    def test_repository_governance_ignores_generated_vendor_and_archived_plans(self):
        config = GovernanceConfig()

        paths = [
            Path("apps/formulas/static/formulas/js/generated/layout-intelligence.js"),
            Path("apps/formulas/static/formulas/vendor/katex/katex.min.js"),
            Path("docs/superpowers/plans/archive/old-plan.md"),
        ]

        for path in paths:
            with self.subTest(path=path):
                finding = classify_tracked_file(path, line_count=10_000, byte_size=500_000, config=config)

                self.assertIsNone(finding)
