"""Filigrane des documents : l’ancienne mention de site remplacée par le logo Fluentia au moment de servir l’image."""

import io
import tempfile
from types import SimpleNamespace

from django.test import SimpleTestCase, override_settings
from PIL import Image, ImageDraw

from .branding import branded_image, find_watermark, rebrand

WATERMARK_BLUE = (29, 78, 216)


def document(watermark=True, size=(1200, 900), background=(255, 255, 255)):
    image = Image.new("RGB", size, background)
    draw = ImageDraw.Draw(image)
    for line in range(5):
        draw.rectangle((60, 120 + line * 110, 1140, 150 + line * 110), fill=(20, 20, 20))  # texte noir du document
    if watermark:
        draw.rectangle((880, 840, 1170, 862), fill=WATERMARK_BLUE)  # ligne de l’ancien filigrane
    return image


def encode(image, kind="PNG"):
    buffer = io.BytesIO()
    image.save(buffer, kind)
    return buffer.getvalue()


def blue_pixels(image, box):
    pixels = image.convert("RGB").load()
    return sum(
        1 for x in range(box[0], box[2]) for y in range(box[1], box[3])
        if pixels[x, y][2] - pixels[x, y][0] > 60 and pixels[x, y][2] - pixels[x, y][1] > 30
    )


class RebrandTests(SimpleTestCase):
    def test_finds_the_blue_line_at_the_bottom(self):
        self.assertEqual(find_watermark(document()), (880, 840, 1171, 863))

    def test_document_without_watermark_is_returned_unchanged(self):
        payload = encode(document(watermark=False))
        self.assertIs(rebrand(payload, "image/png"), payload)

    def test_blue_block_is_not_mistaken_for_a_watermark(self):
        image = document(watermark=False)
        ImageDraw.Draw(image).rectangle((100, 700, 400, 880), fill=WATERMARK_BLUE)  # aplat d’une affiche
        payload = encode(image)
        self.assertIs(rebrand(payload, "image/png"), payload)

    def test_watermark_is_erased_and_logo_drawn_in_its_place(self):
        result = Image.open(io.BytesIO(rebrand(encode(document()), "image/png")))
        self.assertEqual((result.format, result.size), ("PNG", (1200, 900)))
        # L’ancien texte bleu a disparu ; ne restent que les teintes du logo, bien plus petites que la ligne d’origine.
        self.assertLess(blue_pixels(result, (870, 830, 1180, 875)), 290 * 22 // 3)
        self.assertGreater(blue_pixels(result, (870, 820, 1180, 890)), 0)
        # Le contenu du document n’est pas touché.
        self.assertEqual(result.convert("RGB").getpixel((600, 130)), (20, 20, 20))
        self.assertEqual(result.convert("RGB").getpixel((40, 860)), (255, 255, 255))

    def test_jpeg_stays_jpeg(self):
        result = Image.open(io.BytesIO(rebrand(encode(document(), "JPEG"), "image/jpeg")))
        self.assertEqual(result.format, "JPEG")

    def test_result_is_cached_on_disk(self):
        payload = encode(document())
        asset = SimpleNamespace(sha256="a" * 64, content_type="image/png")
        with tempfile.TemporaryDirectory() as root, override_settings(PRIVATE_MEDIA_ROOT=root):
            first = branded_image(asset, payload)
            self.assertNotEqual(first, payload)
            self.assertEqual(branded_image(asset, b"ignored"), first)

    def test_unreadable_image_is_served_as_is(self):
        asset = SimpleNamespace(sha256="b" * 64, content_type="image/png")
        with tempfile.TemporaryDirectory() as root, override_settings(PRIVATE_MEDIA_ROOT=root):
            self.assertEqual(branded_image(asset, b"not an image"), b"not an image")
