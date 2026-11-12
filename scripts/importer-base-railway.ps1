# Copie la base de la démo locale (.local-data/fluentia.dump) dans un Postgres Railway.
# ATTENTION : remplace le contenu de la base cible. À utiliser seulement sur l'environnement de test.
# Usage : .\scripts\importer-base-railway.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$dump = Join-Path $root ".local-data\fluentia.dump"
if (-not (Test-Path $dump)) { throw "Fichier introuvable : $dump" }

Write-Host "Railway > environnement de test > Postgres > Variables > DATABASE_PUBLIC_URL (bouton copier)."
$url = Read-Host "Colle DATABASE_PUBLIC_URL ici (elle n'est enregistree nulle part)"
if ($url -notmatch '^postgres(ql)?://') { throw "Ce n'est pas une adresse Postgres." }
if ($url -match '\$\{\{') { throw "Tu as copie le modele (`${{...}}). Affiche la valeur avec l'oeil dans la liste des variables, puis copie-la." }
if ($url -match 'railway\.internal') { throw "Il faut DATABASE_PUBLIC_URL, pas DATABASE_URL (adresse privee)." }

docker start fluentia-demo-db | Out-Null
docker cp $dump fluentia-demo-db:/tmp/fluentia.dump
Write-Host "Copie en cours..."
docker exec fluentia-demo-db pg_restore --clean --if-exists --no-owner --no-acl -d $url /tmp/fluentia.dump
Write-Host "Termine. Redemarre le service api sur Railway (Deployments > Restart) pour appliquer les dernieres migrations."
