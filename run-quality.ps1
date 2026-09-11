param(
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"


function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)]
        [scriptblock]$Command,

        [Parameter(Mandatory = $true)]
        [string]$Description
    )

    Write-Host ""
    Write-Host $Description -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Description failed with exit code $LASTEXITCODE."
    }
}


Invoke-CheckedCommand `
    -Description "Running the complete backend quality suite..." `
    -Command { & "$PSScriptRoot/run-tests.ps1" all }

Push-Location "$PSScriptRoot/frontend"
try {
    if (-not $SkipInstall) {
        Invoke-CheckedCommand `
            -Description "Installing the locked frontend dependencies..." `
            -Command { & npm ci }
    }

    Invoke-CheckedCommand `
        -Description "Running frontend unit tests..." `
        -Command { & npm test }

    Invoke-CheckedCommand `
        -Description "Running frontend lint..." `
        -Command { & npm run lint }

    Invoke-CheckedCommand `
        -Description "Running strict TypeScript checks..." `
        -Command { & npx tsc --noEmit }

    Invoke-CheckedCommand `
        -Description "Building the production frontend..." `
        -Command { & npm run build }
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "All backend and frontend quality checks passed." `
    -ForegroundColor Green
