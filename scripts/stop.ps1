$pidPath = Join-Path $PSScriptRoot ".server.pid"

if (-not (Test-Path $pidPath)) {
    Write-Output "No server PID file was found."
    exit 0
}

$processId = [int](Get-Content -Raw $pidPath)
$server = Get-Process -Id $processId -ErrorAction SilentlyContinue
if ($null -ne $server) {
    & taskkill.exe /PID $processId /T /F | Out-Null
}
Remove-Item -LiteralPath $pidPath
Write-Output "Project Management MVP stopped."
