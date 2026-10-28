<#
.SYNOPSIS
    SupportPilot AI - Windows PowerShell Database Backup Script
.DESCRIPTION
    Creates a compressed, timestamped, checksummed PostgreSQL snapshot using pg_dump.
#>

[CmdletBinding()]
param (
    [string]$BackupDir = ".\backups",
    [string]$DbUrl = $env:DATABASE_URL
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DbUrl)) {
    Write-Error "DATABASE_URL environment variable is not set."
    exit 1
}

if (-not (Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$Filename = "supportpilot_backup_$Timestamp.dump"
$FilePath = Join-Path -Path $BackupDir -ChildPath $Filename

Write-Host "📦 [1/3] Initiating PostgreSQL snapshot..." -ForegroundColor Cyan
& pg_dump "$DbUrl" --format=custom --blobs --file="$FilePath"

if ($LASTEXITCODE -ne 0) {
    Write-Error "pg_dump failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "🔒 [2/3] Generating SHA256 integrity checksum..." -ForegroundColor Cyan
$Hash = Get-FileHash -Path $FilePath -Algorithm SHA256
$Hash.Hash | Out-File -FilePath "$FilePath.sha256" -Encoding ascii

$FileSize = (Get-Item $FilePath).Length / 1MB

Write-Host "✅ [3/3] Backup completed successfully!" -ForegroundColor Green
Write-Host "--------------------------------------------------"
Write-Host "File:      $FilePath"
Write-Host "Size:      $([math]::Round($FileSize, 2)) MB"
Write-Host "SHA256:    $($Hash.Hash)"
Write-Host "Timestamp: $Timestamp"
Write-Host "--------------------------------------------------"
