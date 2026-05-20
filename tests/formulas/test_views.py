"""Compatibility bridge for split view tests under tests.formulas.views."""

import sys

SPLIT_VIEW_TEST_MODULES = (
    "tests.formulas.views.test_workbench_views",
    "tests.formulas.views.test_mission_views",
    "tests.formulas.views.test_project_views",
    "tests.formulas.views.test_system_views",
)


def load_tests(loader, tests, pattern):
    if "tests.formulas.test_views" not in sys.argv:
        return tests

    suite = loader.suiteClass()
    for module_name in SPLIT_VIEW_TEST_MODULES:
        suite.addTests(loader.loadTestsFromName(module_name))
    return suite
