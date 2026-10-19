# build-cpanel.ps1
# Builds the cPanel deployment folder and a cpanel-deploy.zip ready to upload
# to the cPanel File Manager. The front-ends are the COMPILED Angular v22
# apps (client at public/, admin at public/admin/) produced by `ng build`.
# Node/Express/MySQL backend files are copied from LiuZA3-api.

$ErrorActionPreference = "Stop"
$root = "C:\Users\Administrator\Doubao\chats\2026-10-18\new-chat"
$out  = Join-Path $root "cpanel-deploy"
$zip  = Join-Path $root "cpanel-deploy.zip"

if (Test-Path $out) { Remove-Item $out -Recurse -Force }
if (Test-Path $zip) { Remove-Item $zip -Force }
New-Item -ItemType Directory -Path $out | Out-Null

# --- API files (no node_modules, no .env, no tests) ---
$api = Join-Path $root "LiuZA3-api"
foreach ($item in @("app.js","server.js","event_db.js","package.json","package-lock.json",".env.example","routes")) {
  $src = Join-Path $api $item
  if (Test-Path $src) { Copy-Item $src (Join-Path $out $item) -Recurse -Force }
}

# --- SQL for cPanel (remove DROP/CREATE/USE; the DB is created in the UI) ---
New-Item -ItemType Directory -Path (Join-Path $out "sql") | Out-Null
$sqlText = Get-Content (Join-Path $api "sql\charityevents_db.sql") -Raw
$pattern = '(?s)DROP DATABASE IF EXISTS charityevents_db;.*?USE charityevents_db;'
$replacement = @'
-- cPanel note: the database and database user are created in the
-- "MySQL Databases" tool (their names get the zliu58_ prefix). This file is
-- then imported with phpMyAdmin, so it only creates the tables and data.
'@
$cpanelSql = [regex]::Replace($sqlText, $pattern, $replacement)
Set-Content -Path (Join-Path $out "sql\charityevents_cpanel.sql") -Value $cpanelSql -Encoding UTF8

# --- Compiled Angular client at public/ root ---
$pub = Join-Path $out "public"
New-Item -ItemType Directory -Path $pub | Out-Null
$clientDist = Join-Path $root "LiuZA3-web\dist\client\browser"
if (-not (Test-Path (Join-Path $clientDist "index.html"))) {
  throw "Client build not found at $clientDist. Run 'ng build client' first."
}
Copy-Item (Join-Path $clientDist "*") $pub -Recurse -Force

# --- Compiled Angular admin at public/admin/ ---
$adminPub = Join-Path $pub "admin"
New-Item -ItemType Directory -Path $adminPub | Out-Null
$adminDist = Join-Path $root "LiuZA3-web\dist\admin\browser"
if (-not (Test-Path (Join-Path $adminDist "index.html"))) {
  throw "Admin build not found at $adminDist. Run 'ng build admin --base-href=/admin/' first."
}
Copy-Item (Join-Path $adminDist "*") $adminPub -Recurse -Force

# --- Zip the deployment folder ---
Compress-Archive -Path (Join-Path $out "*") -DestinationPath $zip -Force

Write-Output ("built: " + $out)
Write-Output ("zip: " + $zip + "  MB=" + [math]::Round((Get-Item $zip).Length/1MB,2))
Write-Output "--- top-level ---"
Get-ChildItem $out | ForEach-Object { $_.Name }
Write-Output "--- public ---"
Get-ChildItem $pub | ForEach-Object { $_.Name }
Write-Output "--- public/admin ---"
Get-ChildItem $adminPub | ForEach-Object { $_.Name }
