"""Compatibility bridge for split view tests under tests.formulas.views."""

import sys

from tests.formulas.views.test_mission_views import FormulaMissionViewTests
from tests.formulas.views.test_project_views import FormulaProjectViewTests
from tests.formulas.views.test_system_views import FormulaSystemViewTests
from tests.formulas.views.test_workbench_views import FormulaWorkbenchViewTests

SPLIT_VIEW_TEST_MODULES = (
    "tests.formulas.views.test_workbench_views",
    "tests.formulas.views.test_mission_views",
    "tests.formulas.views.test_project_views",
    "tests.formulas.views.test_system_views",
)

class FormulaViewTests(
    FormulaWorkbenchViewTests,
    FormulaMissionViewTests,
    FormulaProjectViewTests,
    FormulaSystemViewTests,
):
    pass


def load_tests(loader, tests, pattern):
    if "tests.formulas.test_views" not in sys.argv:
        return loader.suiteClass()

    suite = loader.suiteClass()
    for module_name in SPLIT_VIEW_TEST_MODULES:
        suite.addTests(loader.loadTestsFromName(module_name))
    return suite
