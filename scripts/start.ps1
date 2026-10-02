$projectRoot = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $projectRoot "frontend"
$backendPath = Join-Path $projectRoot "backend"
$pidPath = Join-Path $PSScriptRoot ".server.pid"
$uvPath = (Get-Command uv -ErrorAction SilentlyContinue).Source
if (-not $uvPath) {
    $uvPath = Join-Path $env:USERPROFILE ".local\bin\uv.exe"
}
if (-not (Test-Path $uvPath)) {
    throw "uv is required. Install it from https://docs.astral.sh/uv/."
}

Push-Location $frontendPath
try {
    npm.cmd ci
    npm.cmd run build
} finally {
    Pop-Location
}

Push-Location $backendPath
try {
    & $uvPath sync
    $pythonPath = Join-Path $backendPath ".venv\Scripts\python.exe"
    $server = Start-Process -FilePath $pythonPath -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000") -WorkingDirectory $backendPath -PassThru -WindowStyle Hidden
    Set-Content -Path $pidPath -Value $server.Id
} finally {
    Pop-Location
}

Write-Output "Project Management MVP is running at http://127.0.0.1:8000"
