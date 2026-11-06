"""Synthèse locale libre d'une proposition originale ; aucune validation humaine."""

import json
import pathlib
import shutil
import subprocess
import wave
import hashlib

root = pathlib.Path(__file__).resolve().parents[1] / "docs/backend/lot-03/exemples"
root.mkdir(parents=True, exist_ok=True)
text = "Attention. En raison de travaux sur le quai habituel, le train à destination de Laval partira aujourd'hui du quai quatre. L'horaire de départ ne change pas. Question. Pourquoi les voyageurs doivent-ils changer de quai ?"
source = root / "annonce-originale.txt"
source.write_text(text + "\n", encoding="utf-8")
binary = shutil.which("espeak-ng")
if binary is None:
    raise SystemExit(
        "Synthétiseur français local absent. Aucun service externe ou payant utilisé."
    )
output = root / "annonce-originale.wav"
subprocess.run(
    [binary, "-v", "fr", "-s", "155", "-f", str(source), "-w", str(output)], check=True
)
with wave.open(str(output), "rb") as audio:
    duration = audio.getnframes() / audio.getframerate()
version = subprocess.run(
    [binary, "--version"], capture_output=True, text=True, check=True
).stdout.splitlines()[0]
metadata = {
    "status": "draft",
    "notice": "Voix synthétique ; aucun locuteur réel, aucune relecture ou validation pédagogique humaine.",
    "text_origin": "Proposition originale du lot 03 ; aucune banque propriétaire copiée.",
    "synthesis": version,
    "synthesis_source": "https://github.com/espeak-ng/espeak-ng",
    "voice": "fr",
    "duration_seconds": duration,
    "sha256": hashlib.sha256(output.read_bytes()).hexdigest(),
    "transcript": source.name,
}
(root / "provenance-audio.json").write_text(
    json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
print("Proposition audio française synthétisée localement ; statut brouillon maintenu.")
