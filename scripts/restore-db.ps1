<#
.SYNOPSIS
    SupportPilot AI - Windows PowerShell Database Restore Script
.DESCRIPTION
    Safely restores a PostgreSQL snapshot with checksum verification and pre-restore backup.
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory=$true)]
    [string]$DumpFile,
    [string]$DbUrl = $env:DATABASE_URL
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -Path $DumpFile)) {
    Write-Error "Dump file '$DumpFile' does not exist."
    exit 1
}

if ([string]::IsNullOrWhiteSpace($DbUrl)) {
    Write-Error "DATABASE_URL environment variable is not set."
    exit 1
}

# Step 1: Checksum verification
$ChecksumFile = "$DumpFile.sha256"
if (Test-Path -Path $ChecksumFile) {
    Write-Host "🔍 [1/4] Verifying SHA256 checksum..." -ForegroundColor Cyan
    $ExpectedHash = (Get-Content -Path $ChecksumFile).Trim()
    $ActualHash = (Get-FileHash -Path $DumpFile -Algorithm SHA256).Hash
    if ($ExpectedHash -ne $ActualHash) {
        Write-Error "Checksum mismatch! Expected: $ExpectedHash, Found: $ActualHash"
        exit 1
    }
    Write-Host "✓ Checksum matches!" -ForegroundColor Green
}

# Step 2: Confirmation
Write-Host "⚠️ ================================================================" -ForegroundColor Yellow
Write-Host "⚠️ CRITICAL WARNING: RESTORING WILL OVERWRITE EXISTING DATA" -ForegroundColor Yellow
Write-Host "⚠️ Source: $DumpFile" -ForegroundColor Yellow
Write-Host "⚠️ ================================================================" -ForegroundColor Yellow
$Confirmation = Read-Host "Type 'RESTORE-CONFIRMED' to proceed"

if ($Confirmation -ne "RESTORE-CONFIRMED") {
    Write-Host "Aborting restore. Database remains untouched." -ForegroundColor Yellow
    exit 0
}

# Step 3: Safety snapshot
Write-Host "📦 [2/4] Creating safety pre-restore snapshot..." -ForegroundColor Cyan
$SafetyDir = ".\backups"
if (-not (Test-Path -Path $SafetyDir)) { New-Item -ItemType Directory -Path $SafetyDir | Out-Null }
$SafetyTimestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$SafetyFile = Join-Path -Path $SafetyDir -ChildPath "pre_restore_safety_$SafetyTimestamp.dump"
& pg_dump "$DbUrl" --format=custom --file="$SafetyFile"

# Step 4: Restore
Write-Host "🔄 [3/4] Restoring database via pg_restore..." -ForegroundColor Cyan
& pg_restore --dbname="$DbUrl" --clean --if-exists --no-owner --no-privileges "$DumpFile"

Write-Host "✅ [4/4] Database restoration completed successfully!" -ForegroundColor Green
