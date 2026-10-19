# =====================================================================
# PROG2002 A3 - One-click LOCAL runner
# Starts: MySQL (port 3306) -> API (port 3000) -> websites (port 5000)
# Right-click this file -> "Run with PowerShell", or run from a terminal.
# =====================================================================

$ErrorActionPreference = "Continue"
$Proj = "C:\Users\Administrator\Doubao\chats\2026-10-18\new-chat"
$DB   = "C:\Users\Administrator\db"
$mysqld = "$DB\mysql\bin\mysqld.exe"
$ini    = "$DB\mysql\my.ini"

function Test-Port($port) {
  try { $c = New-Object System.Net.Sockets.TcpClient
        $c.Connect('127.0.0.1', $port); $c.Close(); return $true }
  catch { return $false }
}
function Wait-Port($port, $seconds) {
  for ($i = 0; $i -lt $seconds; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Port $port) { return $true }
  }
  return $false
}

# 1) MySQL
if (-not (Test-Port 3306)) {
  Write-Host "Starting MySQL on port 3306 ..." -ForegroundColor Cyan
  Start-Process -FilePath $mysqld -ArgumentList "--defaults-file=$ini" -WindowStyle Hidden
  if (-not (Wait-Port 3306 30)) { Write-Host "MySQL failed to start." -ForegroundColor Red; exit 1 }
} else { Write-Host "MySQL already running on 3306." -ForegroundColor DarkGray }

# 2) API
if (-not (Test-Port 3000)) {
  Write-Host "Starting the API on port 3000 ..." -ForegroundColor Cyan
  Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "$Proj\LiuZA3-api" -WindowStyle Hidden
  if (-not (Wait-Port 3000 20)) { Write-Host "API failed to start." -ForegroundColor Red; exit 1 }
} else { Write-Host "API already running on 3000." -ForegroundColor DarkGray }

# 3) Static front-end sites
if (-not (Test-Port 5000)) {
  Write-Host "Starting the websites on port 5000 ..." -ForegroundColor Cyan
  Start-Process -FilePath "node" -ArgumentList "$PSScriptRoot\static-host.js" -WindowStyle Hidden
  if (-not (Wait-Port 5000 20)) { Write-Host "Static host failed to start." -ForegroundColor Red; exit 1 }
} else { Write-Host "Websites already running on 5000." -ForegroundColor DarkGray }

Write-Host ""
Write-Host "All services are running:" -ForegroundColor Green
Write-Host "  Client site (public): http://localhost:5000/client/" -ForegroundColor Yellow
Write-Host "  Admin  site (staff) : http://localhost:5000/admin/"  -ForegroundColor Yellow
Write-Host "  API root            : http://localhost:3000/"        -ForegroundColor Yellow
Write-Host ""
Start-Process "http://localhost:5000/client/"
