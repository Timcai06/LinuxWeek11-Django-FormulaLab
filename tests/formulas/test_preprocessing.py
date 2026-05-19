from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory

from django.test import SimpleTestCase, override_settings
from PIL import Image

from apps.formulas.services.preprocessing import preprocess_image_file


class PreprocessingTests(SimpleTestCase):
    def setUp(self):
        self.media_root_context = TemporaryDirectory()
        self.settings_context = override_settings(MEDIA_ROOT=Path(self.media_root_context.name))
        self.settings_context.enable()
        self.media_root = Path(self.media_root_context.name)

    def tearDown(self):
        self.settings_context.disable()
        self.media_root_context.cleanup()

    @override_settings(FORMULA_LAB_MAX_IMAGE_SIDE=1600)
    def test_transparent_png_is_composited_to_white_rgb_output(self):
        source = self.media_root / "transparent.png"
        Image.new("RGBA", (20, 20), (0, 0, 0, 0)).save(source)

        output = preprocess_image_file(source)

        self.assertEqual(output.parent, self.media_root / "formula_preprocessed")
        self.assertEqual(output.suffix, ".png")
        with Image.open(source) as original:
            self.assertEqual(original.mode, "RGBA")
        with Image.open(output) as image:
            self.assertEqual(image.mode, "RGB")
            self.assertEqual(image.getpixel((0, 0)), (255, 255, 255))

    @override_settings(FORMULA_LAB_MAX_IMAGE_SIDE=1600)
    def test_large_image_is_resized_to_max_side(self):
        source = self.media_root / "large.jpg"
        Image.new("RGB", (3200, 1200), (10, 20, 30)).save(source)

        output = preprocess_image_file(source)

        with Image.open(output) as image:
            self.assertEqual(max(image.size), 1600)
            self.assertEqual(image.size, (1600, 600))
        with Image.open(source) as original:
            self.assertEqual(original.size, (3200, 1200))

    @override_settings(FORMULA_LAB_MAX_IMAGE_SIDE=1600)
    def test_small_rgb_image_keeps_size(self):
        source = self.media_root / "small.jpg"
        Image.new("RGB", (400, 200), (255, 255, 255)).save(source)

        output = preprocess_image_file(source)

        with Image.open(output) as image:
            self.assertEqual(image.mode, "RGB")
            self.assertEqual(image.size, (400, 200))

    @override_settings(FORMULA_LAB_MAX_IMAGE_SIDE=1600)
    def test_safe_stem_collisions_include_content_hash(self):
        first_source = self.media_root / "same name.png"
        second_source = self.media_root / "same:name.png"
        Image.new("RGB", (10, 10), (255, 0, 0)).save(first_source)
        Image.new("RGB", (10, 10), (0, 0, 255)).save(second_source)

        first_output = preprocess_image_file(first_source)
        second_output = preprocess_image_file(second_source)

        self.assertNotEqual(first_output, second_output)
        self.assertTrue(first_output.name.startswith("same_name_"))
        self.assertTrue(second_output.name.startswith("same_name_"))
        with Image.open(first_output) as first_image:
            self.assertEqual(first_image.getpixel((0, 0)), (255, 0, 0))
        with Image.open(second_output) as second_image:
            self.assertEqual(second_image.getpixel((0, 0)), (0, 0, 255))

    @override_settings(FORMULA_LAB_MAX_IMAGE_SIDE=1600)
    def test_same_safe_stem_and_same_bytes_still_use_distinct_output_paths(self):
        image_bytes = BytesIO()
        Image.new("RGB", (10, 10), (30, 40, 50)).save(image_bytes, format="PNG")
        first_source = self.media_root / "same name.png"
        second_source = self.media_root / "same:name.png"
        first_source.write_bytes(image_bytes.getvalue())
        second_source.write_bytes(image_bytes.getvalue())

        first_output = preprocess_image_file(first_source)
        second_output = preprocess_image_file(second_source)

        self.assertNotEqual(first_output, second_output)
        self.assertTrue(first_output.exists())
        self.assertTrue(second_output.exists())
        self.assertTrue(first_output.name.startswith("same_name_"))
        self.assertTrue(second_output.name.startswith("same_name_"))

    @override_settings(FORMULA_LAB_MAX_IMAGE_SIDE=1600)
    def test_palette_png_transparency_info_is_composited_to_white_rgb_output(self):
        source = self.media_root / "palette-transparent.png"
        image = Image.new("P", (2, 1))
        image.putpalette([0, 0, 0, 255, 0, 0] + [0, 0, 0] * 254)
        image.putdata([0, 1])
        image.info["transparency"] = 0
        image.save(source)

        output = preprocess_image_file(source)

        with Image.open(source) as original:
            self.assertEqual(original.mode, "P")
            self.assertIn("transparency", original.info)
        with Image.open(output) as processed:
            self.assertEqual(processed.mode, "RGB")
            self.assertEqual(processed.getpixel((0, 0)), (255, 255, 255))
            self.assertEqual(processed.getpixel((1, 0)), (255, 0, 0))
