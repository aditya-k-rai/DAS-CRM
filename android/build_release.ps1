# build_release.ps1 — Build Single Universal Release APK for DAS CRM Android on Windows
# Usage: .\build_release.ps1 [-Clean]

param(
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

# Auto-detect ANDROID_HOME and JAVA_HOME if not present in current session
if (-not $env:ANDROID_HOME) {
    if (Test-Path "$env:LOCALAPPDATA\Android\Sdk") {
        $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
    }
}
if (-not $env:JAVA_HOME) {
    if (Test-Path "C:\Program Files\Java\jdk-21") {
        $env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
    }
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$AndroidDir = Join-Path $ScriptDir "android"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  DAS CRM - Building Single Universal Release APK" -ForegroundColor Cyan
Write-Host "  (Compatible with 100% of Android phones and emulators)" -ForegroundColor Cyan
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
cmd.exe /c "gradlew.bat assembleRelease -PreactNativeArchitectures=""arm64-v8a,armeabi-v7a,x86,x86_64"" -PreactNativeArchitecturesOnly=false --no-daemon"

$ApkItems = Get-ChildItem -Path (Join-Path $AndroidDir "app\build\outputs\apk\release\*.apk") -ErrorAction SilentlyContinue

if ($ApkItems) {
    $ApkPath = $ApkItems | Select-Object -First 1
    $DestPath = Join-Path $AndroidDir "app\build\outputs\apk\release\app-universal-release.apk"
    Copy-Item -Path $ApkPath.FullName -Destination $DestPath -Force -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  Universal APK Built Successfully!" -ForegroundColor Green
    Write-Host "  Location: $($ApkPath.FullName)" -ForegroundColor White
    Write-Host "============================================================" -ForegroundColor Green
} else {
    Write-Host "Universal APK build failed." -ForegroundColor Red
    exit 1
}
