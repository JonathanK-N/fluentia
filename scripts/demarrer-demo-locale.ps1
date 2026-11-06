# Démarre la démo locale de Fluentia : PostgreSQL (Docker), API Django et site Next.js.
# Les réglages viennent de .local-data/demo.env (jamais publié). Site : http://localhost:3111
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".local-data\demo.env"
if (-not (Test-Path $envFile)) { throw "Réglages introuvables : $envFile" }

docker start fluentia-demo-db | Out-Null
foreach ($line in Get-Content $envFile) {
  if ($line -match '^\s*([A-Z_]+)="?(.*?)"?\s*$') { Set-Item "env:$($Matches[1])" $Matches[2] }
}

$api = Join-Path $root "apps\api"
$python = Join-Path $api ".venv\Scripts\python.exe"
for ($try = 0; $try -lt 30; $try++) {
  docker exec fluentia-demo-db pg_isready -q -U fluentia
  if ($LASTEXITCODE -eq 0) { break }
  Start-Sleep -Seconds 1
}
& $python (Join-Path $api "manage.py") migrate --noinput

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$api'; & '$python' manage.py runserver 127.0.0.1:8011 --noreload"
$env:API_ORIGIN = "http://127.0.0.1:8011"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$(Join-Path $root "apps\web")'; node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3111"
Write-Host "Démo en cours de démarrage : http://localhost:3111"
