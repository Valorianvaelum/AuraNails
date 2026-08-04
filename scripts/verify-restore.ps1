[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BackupPath,
    [string]$EnvFile = ".env.production",
    [string]$ComposeFile = "docker-compose.restore.yml",
    [string]$ExpectedUserEmail,
    [switch]$KeepEnvironment
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-DockerChecked {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    & docker @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Docker terminó con código $LASTEXITCODE: docker $($Arguments -join ' ')"
    }
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker no está disponible en PATH."
}
if (-not (Test-Path -LiteralPath $BackupPath -PathType Leaf)) {
    throw "No existe el backup: $BackupPath"
}
if (-not (Test-Path -LiteralPath $EnvFile -PathType Leaf)) {
    throw "No existe el archivo de entorno: $EnvFile"
}
if (-not (Test-Path -LiteralPath $ComposeFile -PathType Leaf)) {
    throw "No existe el archivo Compose de restauración: $ComposeFile"
}

$composeContent = Get-Content -LiteralPath $ComposeFile -Raw
if ($composeContent -notmatch '(?m)^name:\s*auranails-restore\s*$') {
    throw "El Compose de restauración no declara el proyecto aislado auranails-restore."
}

$resolvedBackup = (Resolve-Path -LiteralPath $BackupPath).Path
$checksumPath = "$resolvedBackup.sha256"
if (Test-Path -LiteralPath $checksumPath -PathType Leaf) {
    $expectedHash = ((Get-Content -LiteralPath $checksumPath -Raw).Trim() -split '\s+')[0].ToLowerInvariant()
    $actualHash = (Get-FileHash -LiteralPath $resolvedBackup -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualHash -ne $expectedHash) {
        throw "El SHA-256 del backup no coincide. No se iniciará la restauración."
    }
    Write-Host "Checksum SHA-256 verificado."
}
else {
    Write-Warning "No se encontró $checksumPath; se continuará sin verificar checksum externo."
}

$composeArgs = @("compose", "--env-file", $EnvFile, "-f", $ComposeFile)
$containerId = $null
$success = $false
$tempPath = "/tmp/auranails-restore.dump"

try {
    Invoke-DockerChecked ($composeArgs + @("down", "-v", "--remove-orphans"))
    Invoke-DockerChecked ($composeArgs + @("up", "-d", "db"))

    $containerId = (& docker @composeArgs ps -q db | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($containerId)) {
        throw "No se pudo identificar el contenedor PostgreSQL de restauración."
    }

    $healthy = $false
    for ($attempt = 1; $attempt -le 30; $attempt++) {
        $health = (& docker inspect --format '{{.State.Health.Status}}' $containerId 2>$null | Out-String).Trim()
        if ($health -eq "healthy") {
            $healthy = $true
            break
        }
        if ($health -eq "unhealthy") {
            throw "El PostgreSQL de restauración quedó unhealthy."
        }
        Start-Sleep -Seconds 2
    }
    if (-not $healthy) {
        throw "PostgreSQL no quedó healthy dentro del tiempo esperado."
    }

    Invoke-DockerChecked @("cp", $resolvedBackup, "${containerId}:${tempPath}")

    $restoreCommand = (
        'pg_restore --list "{0}" >/dev/null && ' +
        'pg_restore --exit-on-error --clean --if-exists --no-owner --no-privileges ' +
        '--username="$POSTGRES_USER" --dbname="$POSTGRES_DB" "{0}"'
    ) -f $tempPath
    Invoke-DockerChecked ($composeArgs + @("exec", "-T", "db", "sh", "-c", $restoreCommand))

    Invoke-DockerChecked ($composeArgs + @("--profile", "verify", "run", "--rm", "--build", "verifier", "check"))
    Invoke-DockerChecked ($composeArgs + @("--profile", "verify", "run", "--rm", "verifier", "migrate", "--check"))

    $verifyArguments = $composeArgs + @(
        "--profile", "verify", "run", "--rm", "verifier", "verify_restore", "--json"
    )
    if (-not [string]::IsNullOrWhiteSpace($ExpectedUserEmail)) {
        $verifyArguments += @("--expect-user-email", $ExpectedUserEmail)
    }
    Invoke-DockerChecked $verifyArguments

    $success = $true
    Write-Host "Restauración aislada verificada correctamente."
}
finally {
    if (-not [string]::IsNullOrWhiteSpace($containerId)) {
        & docker @composeArgs exec -T db rm -f $tempPath 2>$null | Out-Null
    }

    if ($success -and -not $KeepEnvironment) {
        & docker @composeArgs down -v --remove-orphans | Out-Null
        Write-Host "Entorno temporal de restauración eliminado."
    }
    elseif ($success -and $KeepEnvironment) {
        Write-Host "Entorno de restauración conservado para inspección."
    }
    elseif (-not $success) {
        Write-Warning (
            "La verificación falló. El entorno auranails-restore se conserva para diagnóstico; " +
            "el stack productivo no fue modificado."
        )
    }
}
