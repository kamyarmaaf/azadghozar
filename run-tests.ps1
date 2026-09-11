param(
    [ValidateSet(
        "fast",
        "all",
        "type",
        "unit",
        "component",
        "integration",
        "migration",
        "e2e",
        "regression",
        "smoke",
        "api",
        "security",
        "load",
        "stress",
        "spike"
    )]
    [string]$Suite = "fast"
)

$ErrorActionPreference = "Stop"

$ComposeFiles = @(
    "-p",
    "karvo-test",
    "-f",
    "compose.yaml",
    "-f",
    "compose.test.yaml"
)


function Invoke-Compose {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    Write-Host ""
    Write-Host "docker compose $($Arguments -join ' ')" `
        -ForegroundColor DarkGray

    & docker compose @ComposeFiles @Arguments

    if ($LASTEXITCODE -ne 0) {
        throw (
            "Docker Compose command failed " +
            "with exit code $LASTEXITCODE."
        )
    }
}


function Run-PytestMarker {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Marker
    )

    Invoke-Compose -Arguments @(
        "run",
        "--rm",
        "test",
        "pytest",
        "-m",
        $Marker
    )
}


function Wait-ForBackend {
    param(
        [int]$TimeoutSeconds = 60
    )

    $HealthUrl = "http://localhost:8001/api/health/"
    $Deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    Write-Host ""
    Write-Host "Waiting for backend health check..." `
        -ForegroundColor Cyan

    while ((Get-Date) -lt $Deadline) {
        try {
            $Response = Invoke-WebRequest `
                -Uri $HealthUrl `
                -Method Get `
                -UseBasicParsing `
                -TimeoutSec 2

            if ($Response.StatusCode -eq 200) {
                Write-Host "Backend is ready." `
                    -ForegroundColor Green

                return
            }
        }
        catch {
            Start-Sleep -Seconds 2
        }
    }

    throw (
        "Backend did not become ready within " +
        "$TimeoutSeconds seconds. " +
        "Check: docker compose logs backend"
    )
}


function Run-LocustProfile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProfileName,

        [Parameter(Mandatory = $true)]
        [int]$Users,

        [Parameter(Mandatory = $true)]
        [int]$SpawnRate,

        [Parameter(Mandatory = $true)]
        [string]$Duration
    )

    Write-Host ""
    Write-Host "Starting $ProfileName test" `
        -ForegroundColor Cyan

    Write-Host "Users: $Users"
    Write-Host "Spawn rate: $SpawnRate users/second"
    Write-Host "Duration: $Duration"

    # Start Django without attaching the terminal to its logs.
    Invoke-Compose -Arguments @(
        "up",
        "--detach",
        "backend"
    )

    Wait-ForBackend -TimeoutSeconds 60

    $LocustArguments = @(
        "run",
        "--rm"
    )

    # Pass JWT to Locust when it has been defined in PowerShell.
    if (
        -not [string]::IsNullOrWhiteSpace(
            $env:LOCUST_ACCESS_TOKEN
        )
    ) {
        Write-Host (
            "JWT detected. " +
            "The protected /me/ endpoint will also be tested."
        ) -ForegroundColor Green

        $LocustArguments += @(
            "-e",
            "LOCUST_ACCESS_TOKEN=$($env:LOCUST_ACCESS_TOKEN)"
        )
    }
    else {
        Write-Host (
            "No JWT detected. " +
            "The test will mainly target the health endpoint."
        ) -ForegroundColor Yellow
    }

    $LocustArguments += @(
        "test",
        "locust",
        "-f",
        "tests/load/locustfile.py",
        "--headless",
        "--host",
        "http://backend:8000",
        "-u",
        "$Users",
        "-r",
        "$SpawnRate",
        "-t",
        "$Duration",
        "--only-summary"
    )

    Invoke-Compose -Arguments $LocustArguments

    Write-Host ""
    Write-Host "$ProfileName test completed." `
        -ForegroundColor Green
}


Write-Host ""
Write-Host "Building test image..." `
    -ForegroundColor Cyan

Invoke-Compose -Arguments @(
    "build",
    "test"
)


switch ($Suite) {
    "type" {
        Invoke-Compose -Arguments @(
            "run",
            "--rm",
            "test",
            "mypy",
            "apps",
            "config"
        )
    }

    "unit" {
        Run-PytestMarker -Marker "unit"
    }

    "component" {
        Run-PytestMarker -Marker "component"
    }

    "integration" {
        Run-PytestMarker -Marker "integration"
    }

    "migration" {
        Run-PytestMarker -Marker "migration"
    }

    "e2e" {
        Run-PytestMarker -Marker "e2e"
    }

    "regression" {
        Run-PytestMarker -Marker "regression"
    }

    "smoke" {
        Run-PytestMarker -Marker "smoke"
    }

    "api" {
        Run-PytestMarker -Marker "api"
    }

    "security" {
        Run-PytestMarker -Marker "security"

        Invoke-Compose -Arguments @(
            "run",
            "--rm",
            "test",
            "bandit",
            "-r",
            "apps",
            "config",
            "-x",
            "apps/accounts/migrations,apps/businesses/migrations,apps/catalog/migrations,tests"
        )

        Invoke-Compose -Arguments @(
            "run",
            "--rm",
            "test",
            "pip-audit",
            "-r",
            "requirements.txt"
        )
    }

    "load" {
        Run-LocustProfile `
            -ProfileName "Load" `
            -Users 20 `
            -SpawnRate 5 `
            -Duration "2m"
    }

    "stress" {
        Run-LocustProfile `
            -ProfileName "Stress" `
            -Users 75 `
            -SpawnRate 10 `
            -Duration "3m"
    }

    "spike" {
        Run-LocustProfile `
            -ProfileName "Spike" `
            -Users 150 `
            -SpawnRate 150 `
            -Duration "45s"
    }

    "fast" {
        Invoke-Compose -Arguments @(
            "run",
            "--rm",
            "test",
            "python",
            "manage.py",
            "makemigrations",
            "--check",
            "--dry-run"
        )

        Invoke-Compose -Arguments @(
            "run",
            "--rm",
            "test",
            "mypy",
            "apps",
            "config"
        )

        Invoke-Compose -Arguments @(
            "run",
            "--rm",
            "test",
            "pytest",
            "-m",
            (
                "unit or component or regression " +
                "or smoke or api or security"
            )
        )
    }

    "all" {
        Invoke-Compose -Arguments @(
            "run",
            "--rm",
            "test",
            "python",
            "manage.py",
            "makemigrations",
            "--check",
            "--dry-run"
        )

        Invoke-Compose -Arguments @(
            "run",
            "--rm",
            "test",
            "mypy",
            "apps",
            "config"
        )

        Invoke-Compose -Arguments @(
            "run",
            "--rm",
            "test",
            "pytest",
            "--cov=apps",
            "--cov=config",
            "--cov-report=term-missing",
            "--cov-report=html"
        )

        Invoke-Compose -Arguments @(
            "run",
            "--rm",
            "test",
            "bandit",
            "-r",
            "apps",
            "config",
            "-x",
            "apps/accounts/migrations,apps/businesses/migrations,apps/catalog/migrations,tests"
        )

        Invoke-Compose -Arguments @(
            "run",
            "--rm",
            "test",
            "pip-audit",
            "-r",
            "requirements.txt"
        )
    }
}
