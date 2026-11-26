"""Filigrane des documents : l’ancienne mention de site en bas des images devient le logo Fluentia.

Les images des questions restent immuables en base (intégrité vérifiée par SHA-256) ; le remplacement
se fait au moment de les servir, puis la version Fluentia est gardée en cache sur disque.
Une image sans cet ancien filigrane est renvoyée telle quelle.
"""

import hashlib
import io
from functools import lru_cache
from pathlib import Path

from django.conf import settings

ASSETS = Path(__file__).resolve().parent / "assets"
# Version du traitement : la changer invalide le cache des images déjà converties.
VERSION = "1"

# Le filigrane est un texte bleu (≈ #1D4ED8) en bas du document, alors que le texte du document est noir.
BAND = 0.25  # part basse de l’image où l’on cherche le filigrane
MIN_PIXELS = 20


def _is_watermark_blue(r, g, b):
    return b - r > 60 and b - g > 30 and b > 120


@lru_cache(maxsize=2)
def _logo(variant):
    from PIL import Image

    return Image.open(ASSETS / f"fluentia-logo-{variant}.png").convert("RGBA")


def find_watermark(image):
    """Cadre (gauche, haut, droite, bas) du filigrane bleu en bas de l’image, ou None."""
    width, height = image.size
    top = int(height * (1 - BAND))
    pixels = image.load()
    rows = {}
    for y in range(top, height):
        xs = [x for x in range(width) if _is_watermark_blue(*pixels[x, y][:3])]
        if xs:
            rows[y] = (min(xs), max(xs), len(xs))
    if not rows:
        return None
    # Le filigrane est une seule ligne de texte : le bloc de lignes bleues contigu le plus bas.
    ys = sorted(rows)
    block = [ys[-1]]
    for y in reversed(ys[:-1]):
        if block[-1] - y > 3:
            break
        block.append(y)
    if sum(rows[y][2] for y in block) < MIN_PIXELS:
        return None
    left = min(rows[y][0] for y in block)
    right = max(rows[y][1] for y in block)
    box_top, box_bottom = min(block), max(block)
    box_height = box_bottom - box_top + 1
    # Une ligne de texte : basse et allongée. Un aplat bleu (affiche, schéma) n’est pas touché.
    if box_height > height * 0.08 or (right - left + 1) < box_height * 3:
        return None
    return left, box_top, right + 1, box_bottom + 1


def _background(image, box):
    """Couleur médiane autour du cadre, pour effacer le filigrane sans trace."""
    width, height = image.size
    left, top, right, bottom = box
    pixels = image.load()
    samples = []
    for x in range(max(0, left), min(width, right)):
        for y in (top - 1, bottom):
            if 0 <= y < height:
                samples.append(pixels[x, y][:3])
    for y in range(max(0, top), min(height, bottom)):
        for x in (left - 1, right):
            if 0 <= x < width:
                samples.append(pixels[x, y][:3])
    if not samples:
        return (255, 255, 255)
    return tuple(sorted(channel)[len(channel) // 2] for channel in zip(*samples))


def rebrand(payload, content_type):
    """Renvoie l’image avec le logo Fluentia à la place de l’ancien filigrane (ou l’image d’origine)."""
    from PIL import Image

    with Image.open(io.BytesIO(payload)) as source:
        image = source.convert("RGB")
    found = find_watermark(image)
    if not found:
        return payload
    width, height = image.size
    left, top, right, bottom = found
    text_height = bottom - top
    pad = max(2, round(text_height * 0.6))
    erase = (max(0, left - pad), max(0, top - pad), min(width, right + pad), min(height, bottom + pad))
    background = _background(image, erase)
    image.paste(background, erase)

    # Logo : un peu plus haut que l’ancien texte, aligné sur son bord droit et centré sur sa ligne.
    dark = sum(background) / 3 < 110
    logo = _logo("dark" if dark else "light")
    logo_height = max(14, round(text_height * 1.8))
    logo_width = round(logo.width * logo_height / logo.height)
    max_width = right - 4
    if logo_width > max_width:
        logo_width = max_width
        logo_height = round(logo.height * logo_width / logo.width)
    resized = logo.resize((logo_width, logo_height), Image.LANCZOS)
    x = max(0, right - logo_width)
    y = min(height - logo_height, max(0, round((top + bottom - logo_height) / 2)))
    canvas = image.convert("RGBA")
    canvas.alpha_composite(resized, (x, y))

    output = io.BytesIO()
    if content_type == "image/png":
        canvas.convert("RGB").save(output, "PNG", optimize=True)
    else:
        canvas.convert("RGB").save(output, "JPEG", quality=92)
    return output.getvalue()


def branded_image(asset, payload):
    """Version Fluentia de l’image, calculée une fois puis lue depuis le cache disque."""
    key = hashlib.sha256(f"{VERSION}:{asset.sha256}".encode()).hexdigest()
    extension = ".png" if asset.content_type == "image/png" else ".jpg"
    cached = Path(settings.PRIVATE_MEDIA_ROOT) / "images-fluentia" / (key + extension)
    try:
        return cached.read_bytes()
    except OSError:
        pass
    try:
        result = rebrand(payload, asset.content_type)
    except Exception:
        # Image illisible pour Pillow : on sert l’original plutôt que de bloquer la question.
        return payload
    try:
        cached.parent.mkdir(parents=True, exist_ok=True)
        temporary = cached.with_suffix(cached.suffix + ".tmp")
        temporary.write_bytes(result)
        temporary.replace(cached)
    except OSError:
        pass
    return result
