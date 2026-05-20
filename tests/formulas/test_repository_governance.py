import os
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
    def test_required_runtime_paths_are_listed_in_gitignore(self):
        gitignore_path = Path(".gitignore")

        missing_entries = check_gitignore_contains_runtime_paths(gitignore_path)

        self.assertEqual(missing_entries, [])
        self.assertEqual(
            REQUIRED_GITIGNORE_ENTRIES,
            [".conda/", ".pip-cache/", ".model-cache/", "node_modules/", "media/", "*.sqlite3"],
        )

    def test_missing_runtime_paths_are_reported(self):
        with TemporaryDirectory() as temp_dir:
            gitignore_path = Path(temp_dir) / ".gitignore"
            gitignore_path.write_text(".conda/\nnode_modules/\nmedia/\n", encoding="utf-8")

            missing_entries = check_gitignore_contains_runtime_paths(gitignore_path)

        self.assertEqual(missing_entries, [".pip-cache/", ".model-cache/", "*.sqlite3"])

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
