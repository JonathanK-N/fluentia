"""Vérifier les assets officiels et les contrastes. Responsable : Jonathan Kakesa."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parents[1]
archive = Path.home() / 'Downloads/Fluentia_Logo_Assets_PWA_Complet.zip'
public = root / 'apps/web/public/branding'
results = []
with zipfile.ZipFile(archive) as source:
    for path in sorted(public.rglob('*')):
        if path.suffix.lower() not in ('.png', '.ico'):
            continue
        relative = path.relative_to(public).as_posix()
        candidates = [n for n in source.namelist() if n.endswith(relative)]
        assert len(candidates) == 1, relative
        raw = path.read_bytes()
        assert raw == source.read(candidates[0]), relative
        results.append({'path': relative, 'sha256': hashlib.sha256(raw).hexdigest()})
references = []
for folder in ['app', 'components', 'features', 'lib']:
    for path in (root / 'apps/web' / folder).rglob('*'):
        if path.suffix in ('.tsx', '.ts', '.css') and '04_SVG' in path.read_text(encoding='utf-8'):
            references.append(str(path.relative_to(root)))
assert not references, references

def luminance(hexadecimal):
    channels = [int(hexadecimal[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    linear = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in channels]
    return sum(a * b for a, b in zip(linear, [.2126, .7152, .0722]))

pairs = [('texte clair', '081b35', 'f8fafc', 4.5), ('texte secondaire clair', '52647a', 'ffffff', 4.5), ('action claire', 'ffffff', '1769e0', 4.5), ('accent clair', '086b82', 'eaf1fc', 4.5), ('erreur claire', 'a12535', 'ffffff', 4.5), ('champ clair', '71829a', 'f8fafc', 3), ('champ clair sur surface', '71829a', 'ffffff', 3), ('texte sombre', 'f7faff', '081b35', 4.5), ('texte secondaire sombre', 'b7c9df', '102944', 4.5), ('action sombre', '081b35', '21d4f4', 4.5), ('erreur sombre', 'ffb1b9', '102944', 4.5), ('champ sombre', '7e94ae', '081b35', 3), ('champ sombre sur surface', '7e94ae', '102944', 3)]
contrasts = []
for name, foreground, background, minimum in pairs:
    a, b = sorted([luminance(foreground), luminance(background)])
    ratio = (b + .05) / (a + .05)
    assert ratio >= minimum, (name, ratio)
    contrasts.append({'name': name, 'foreground': foreground, 'background': background, 'ratio': round(ratio, 3), 'minimum': minimum})
output = {'archive': archive.name, 'archiveSha256': hashlib.sha256(archive.read_bytes()).hexdigest(), 'assets': results, 'approximateSvgReferences': references, 'contrasts': contrasts}
destination = root / 'docs/evidence/brand-assets-and-contrast.json'
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'assetsIdentiques': len(results), 'pairesDeContraste': len(contrasts), 'referencesSvgApproximatifs': len(references)}, ensure_ascii=False))
