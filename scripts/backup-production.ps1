[CmdletBinding()]
param(
    [string]$EnvFile = ".env.production",
    [string]$ComposeFile = "docker-compose.production.yml",
    [string]$OutputDirectory = "backups"
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
if (-not (Test-Path -LiteralPath $EnvFile -PathType Leaf)) {
    throw "No existe el archivo de entorno: $EnvFile"
}
if (-not (Test-Path -LiteralPath $ComposeFile -PathType Leaf)) {
    throw "No existe el archivo Compose: $ComposeFile"
}

$composeArgs = @("compose", "--env-file", $EnvFile, "-f", $ComposeFile)
$containerId = (& docker @composeArgs ps -q db | Out-String).Trim()
if ($LASTEXITCODE -ne 0) {
    throw "No se pudo consultar el servicio PostgreSQL."
}
if ([string]::IsNullOrWhiteSpace($containerId)) {
    throw "El servicio db no está en ejecución. Levantá primero el stack productivo."
}

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$outputRoot = (Resolve-Path -LiteralPath $OutputDirectory).Path
$timestamp = [DateTime]::UtcNow.ToString("yyyyMMdd-HHmmssZ")
$fileName = "auranails-$timestamp.dump"
$backupPath = Join-Path $outputRoot $fileName
$tempPath = "/tmp/$fileName"

try {
    $dumpCommand = (
        'pg_dump --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" ' +
        '--format=custom --compress=6 --no-owner --no-privileges ' +
        '--file="{0}" && pg_restore --list "{0}" >/dev/null'
    ) -f $tempPath

    Invoke-DockerChecked ($composeArgs + @("exec", "-T", "db", "sh", "-c", $dumpCommand))
    Invoke-DockerChecked @("cp", "${containerId}:${tempPath}", $backupPath)
}
finally {
    & docker @composeArgs exec -T db rm -f $tempPath 2>$null | Out-Null
}

if (-not (Test-Path -LiteralPath $backupPath -PathType Leaf)) {
    throw "Docker no generó el archivo de backup esperado."
}
$fileInfo = Get-Item -LiteralPath $backupPath
if ($fileInfo.Length -le 0) {
    throw "El archivo de backup está vacío."
}

$hash = (Get-FileHash -LiteralPath $backupPath -Algorithm SHA256).Hash.ToLowerInvariant()
$checksumPath = "$backupPath.sha256"
Set-Content -LiteralPath $checksumPath -Value "$hash  $fileName" -Encoding ascii

$databaseName = (& docker @composeArgs exec -T db sh -c 'printf "%s" "$POSTGRES_DB"' | Out-String).Trim()
$postgresVersion = (& docker @composeArgs exec -T db postgres --version | Out-String).Trim()
$gitCommit = $null
try {
    $gitCommit = (& git rev-parse HEAD 2>$null | Out-String).Trim()
}
catch {
    $gitCommit = $null
}

$manifest = [ordered]@{
    project = "AuraNails"
    created_at_utc = [DateTime]::UtcNow.ToString("o")
    database = $databaseName
    postgres_version = $postgresVersion
    format = "PostgreSQL custom"
    file = $fileName
    bytes = $fileInfo.Length
    sha256 = $hash
    git_commit = $gitCommit
}
$manifestPath = "$backupPath.json"
$manifest | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $manifestPath -Encoding utf8

Write-Host "Backup creado y validado correctamente."
Write-Host "Archivo: $backupPath"
Write-Host "SHA-256: $hash"
Write-Host "Manifiesto: $manifestPath"
