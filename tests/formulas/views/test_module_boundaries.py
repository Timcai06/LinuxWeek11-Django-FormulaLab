import importlib
import importlib.util
import types

from django.test import SimpleTestCase

import apps.formulas.views as formula_views


class FormulaViewModuleBoundaryTests(SimpleTestCase):
    def test_surface_modules_have_non_colliding_module_names(self):
        expected_exports = {
            "workbench_views": ("landing", "workbench", "create_job"),
            "mission_views": ("mission_progress", "mission_report", "retry_mission", "mission_status_api", "history"),
            "project_views": ("projects", "project_workspace", "export_project", "review_formula_item"),
            "system_views": ("system_page", "health_api", "warmup_api"),
        }

        for module_basename, public_names in expected_exports.items():
            module_name = f"apps.formulas.views.{module_basename}"
            with self.subTest(module_name=module_name):
                self.assertIsNotNone(importlib.util.find_spec(module_name))
                module = importlib.import_module(module_name)

                self.assertIsInstance(module, types.ModuleType)
                for public_name in public_names:
                    self.assertTrue(callable(getattr(module, public_name)))

    def test_package_root_keeps_url_callable_exports(self):
        for public_name in (
            "landing",
            "projects",
            "project_workspace",
            "export_project",
            "workbench",
            "create_job",
            "review_formula_item",
            "mission_progress",
            "mission_report",
            "retry_mission",
            "history",
            "system_page",
            "mission_status_api",
            "health_api",
            "warmup_api",
        ):
            with self.subTest(public_name=public_name):
                self.assertTrue(callable(getattr(formula_views, public_name)))
