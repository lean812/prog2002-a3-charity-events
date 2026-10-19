# build-submission.ps1
# Repackages the three submission ZIPs from the latest project code.
#   LiuZA3-api.zip        -> Node/Express/MySQL backend
#   LiuZA3-clientside.zip -> Angular v22 client app (standalone, self-contained workspace)
#   LiuZA3-adminside.zip  -> Angular v22 admin app  (standalone, self-contained workspace)
# Excludes node_modules, dist, the real .env, and runtime log files.

$ErrorActionPreference = "Stop"
$root = "C:\Users\Administrator\Doubao\chats\2026-10-18\new-chat"
$web  = Join-Path $root "LiuZA3-web"
$tmp  = Join-Path $root "_pkg"
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
New-Item -ItemType Directory -Path $tmp | Out-Null

function Copy-Tree($src, $dst, $excludeDirs) {
  Get-ChildItem $src -Recurse -Force | ForEach-Object {
    $rel = $_.FullName.Substring($src.Length + 1)
    $parts = $rel -split '[\\/]'
    $skip = $false
    foreach ($d in $excludeDirs) { if ($parts -contains $d) { $skip = $true } }
    if ($parts[0] -eq '.env') { $skip = $true }
    if ($_.Name -like '*.log') { $skip = $true }
    if (-not $skip -and -not $_.PSIsContainer) {
      $target = Join-Path $dst $rel
      $tdir = Split-Path $target -Parent
      if (-not (Test-Path $tdir)) { New-Item -ItemType Directory -Path $tdir -Force | Out-Null }
      Copy-Item $_.FullName $target -Force
    }
  }
}

# ---------- 1) API zip ----------
$apiDst = Join-Path $tmp "LiuZA3-api"
New-Item -ItemType Directory -Path $apiDst | Out-Null
Copy-Tree (Join-Path $root "LiuZA3-api") $apiDst @('node_modules','.git')
$apiZip = Join-Path $root "LiuZA3-api.zip"
if (Test-Path $apiZip) { Remove-Item $apiZip -Force }
Compress-Archive -Path (Join-Path $apiDst "*") -DestinationPath $apiZip -Force
Write-Output ("packed LiuZA3-api.zip  KB=" + [math]::Round((Get-Item $apiZip).Length/1KB,1))

# ---------- Angular single-app workspaces ----------
$rootFiles = @("package.json","package-lock.json","tsconfig.json",".editorconfig",".prettierrc",".gitignore","README.md")
$ngExclude = @('node_modules','dist','.angular','.git')

function Build-AngularZip($appName, $zipName) {
  $w = Join-Path $tmp ("LiuZA3-" + $appName.Replace("client","clientside").Replace("admin","adminside"))
  New-Item -ItemType Directory -Path $w | Out-Null

  # root config files
  foreach ($f in $rootFiles) {
    $s = Join-Path $web $f
    if (Test-Path $s) { Copy-Item $s (Join-Path $w $f) -Force }
  }

  # single-project angular.json (remove the other app)
  $aj = Get-Content (Join-Path $web "angular.json") -Raw | ConvertFrom-Json
  $other = if ($appName -eq 'client') { 'admin' } else { 'client' }
  $aj.projects.PSObject.Properties.Remove($other)
  $aj | ConvertTo-Json -Depth 60 | Set-Content (Join-Path $w "angular.json") -Encoding UTF8

  # the single app source tree
  $appDst = Join-Path $w ("projects\" + $appName)
  New-Item -ItemType Directory -Path $appDst | Out-Null
  Copy-Tree (Join-Path $web ("projects\" + $appName)) $appDst @('node_modules','dist','.angular')

  $z = Join-Path $root $zipName
  if (Test-Path $z) { Remove-Item $z -Force }
  Compress-Archive -Path (Join-Path $w "*") -DestinationPath $z -Force
  Write-Output ("packed " + $zipName + "  KB=" + [math]::Round((Get-Item $z).Length/1KB,1))
}

# ---------- 2) client zip ----------
Build-AngularZip "client" "LiuZA3-clientside.zip"

# ---------- 3) admin zip ----------
Build-AngularZip "admin" "LiuZA3-adminside.zip"

Remove-Item $tmp -Recurse -Force
Write-Output "done."
