from pathlib import Path
from tempfile import TemporaryDirectory

from django.test import Client, TestCase, override_settings


class FormulaViewTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.media_root_context = TemporaryDirectory()
        self.settings_context = override_settings(MEDIA_ROOT=Path(self.media_root_context.name))
        self.settings_context.enable()

    def tearDown(self):
        self.settings_context.disable()
        self.media_root_context.cleanup()
