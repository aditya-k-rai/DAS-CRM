# build_release.ps1 — Build Single Universal Release APK for DAS CRM Android on Windows
# Usage: .\build_release.ps1 [-Clean]

param(
    [switch]$Clean
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$AndroidDir = Join-Path $ScriptDir "android"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  DAS CRM — Building Single Universal Release APK" -ForegroundColor Cyan
Write-Host "  (Compatible with 100% of Android phones & emulators)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if ($Clean) {
    Write-Host "Cleaning build directories..." -ForegroundColor Yellow
    Remove-Item -Path (Join-Path $AndroidDir "app\build") -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path (Join-Path $AndroidDir "build") -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Clean complete." -ForegroundColor Green
}

Set-Location -Path $AndroidDir

Write-Host "Running Gradle assembleRelease for Universal APK..." -ForegroundColor Cyan
& .\gradlew.bat assembleRelease -PreactNativeArchitectures="arm64-v8a,armeabi-v7a,x86,x86_64" -PreactNativeArchitecturesOnly=false --no-daemon

$ApkPath = Get-ChildItem -Path (Join-Path $AndroidDir "app\build\outputs\apk\release\*.apk") -ErrorAction SilentlyContinue | Select-Object -First 1

if ($ApkPath) {
    $DestPath = Join-Path $AndroidDir "app\build\outputs\apk\release\app-universal-release.apk"
    Copy-Item -Path $ApkPath.FullName -Destination $DestPath -Force -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  ✓ Universal APK Built Successfully!" -ForegroundColor Green
    Write-Host "  Location: $($ApkPath.FullName)" -ForegroundColor White
    Write-Host "============================================================" -ForegroundColor Green
} else {
    Write-Host "✗ Universal APK build failed." -ForegroundColor Red
    exit 1
}
