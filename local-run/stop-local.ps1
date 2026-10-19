# =====================================================================
# PROG2002 A3 - Stop all LOCAL services started by start-local.ps1
# Stops the two Node servers and the MySQL server.
# =====================================================================

Write-Host "Stopping local Node servers (API + static host) ..." -ForegroundColor Cyan
Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -match 'server\.js|static-host\.js' } |
  ForEach-Object { Write-Host "  stopping node PID $($_.ProcessId)"; Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

Write-Host "Stopping MySQL ..." -ForegroundColor Cyan
Get-Process mysqld -ErrorAction SilentlyContinue |
  ForEach-Object { Write-Host "  stopping mysqld PID $($_.Id)"; Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }

Write-Host "Done. Local services stopped." -ForegroundColor Green
