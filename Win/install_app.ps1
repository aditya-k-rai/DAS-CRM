<#
install_app.ps1 — Installs DAS CRM locally for the current user
Creates Start Menu shortcut, Desktop shortcut, and registers in Windows Installed Apps
#>
$ErrorActionPreference = "Stop"

$AppName = "DAS CRM"
$AppVersion = "2.0.0"
$Publisher = "DAS CRM"
$InstallDir = "$env:LOCALAPPDATA\Programs\$AppName"
$ExeSource = "$PSScriptRoot\dist\DASCRM.exe"
$IconSource = "$PSScriptRoot\resources\icon.ico"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Installing $AppName v$AppVersion" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Create target directories
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
New-Item -ItemType Directory -Force -Path "$InstallDir\resources" | Out-Null

# 2. Copy Executable and Resources
Write-Host "-> Copying application files..." -ForegroundColor Yellow
Copy-Item -Path $ExeSource -Destination "$InstallDir\DASCRM.exe" -Force
if (Test-Path $IconSource) {
    Copy-Item -Path $IconSource -Destination "$InstallDir\resources\icon.ico" -Force
}

# 3. Create Start Menu & Desktop Shortcuts with official logo icon
$WshShell = New-Object -ComObject WScript.Shell

$StartMenuDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\$AppName"
New-Item -ItemType Directory -Force -Path $StartMenuDir | Out-Null
$StartShortcut = $WshShell.CreateShortcut("$StartMenuDir\$AppName.lnk")
$StartShortcut.TargetPath = "$InstallDir\DASCRM.exe"
$StartShortcut.WorkingDirectory = $InstallDir
$StartShortcut.IconLocation = "$InstallDir\resources\icon.ico, 0"
$StartShortcut.Description = "DAS CRM Enterprise Desktop Client"
$StartShortcut.Save()

$DesktopDir = [System.Environment]::GetFolderPath('Desktop')
$DesktopShortcut = $WshShell.CreateShortcut("$DesktopDir\$AppName.lnk")
$DesktopShortcut.TargetPath = "$InstallDir\DASCRM.exe"
$DesktopShortcut.WorkingDirectory = $InstallDir
$DesktopShortcut.IconLocation = "$InstallDir\resources\icon.ico, 0"
$DesktopShortcut.Description = "DAS CRM Enterprise Desktop Client"
$DesktopShortcut.Save()

# 4. Register in Windows Settings -> Installed Apps
$RegPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$AppName"
New-Item -Path $RegPath -Force | Out-Null
Set-ItemProperty -Path $RegPath -Name "DisplayName" -Value $AppName
Set-ItemProperty -Path $RegPath -Name "DisplayIcon" -Value "$InstallDir\resources\icon.ico"
Set-ItemProperty -Path $RegPath -Name "DisplayVersion" -Value $AppVersion
Set-ItemProperty -Path $RegPath -Name "Publisher" -Value $Publisher
Set-ItemProperty -Path $RegPath -Name "InstallLocation" -Value $InstallDir
Set-ItemProperty -Path $RegPath -Name "UninstallString" -Value "powershell -ExecutionPolicy Bypass -File `"$InstallDir\uninstall.ps1`""

# 5. Create uninstaller script
$UninstallScript = @"
`$InstallDir = "$InstallDir"
`$AppName = "$AppName"
Remove-Item -Recurse -Force -Path "`$InstallDir" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force -Path "`$env:APPDATA\Microsoft\Windows\Start Menu\Programs\`$AppName" -ErrorAction SilentlyContinue
Remove-Item -Force -Path "`$([System.Environment]::GetFolderPath('Desktop'))\`$AppName.lnk" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\`$AppName" -ErrorAction SilentlyContinue
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show("DAS CRM has been successfully uninstalled.", "Uninstalled", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
"@
Set-Content -Path "$InstallDir\uninstall.ps1" -Value $UninstallScript

Write-Host "=========================================" -ForegroundColor Green
Write-Host " [SUCCESS] $AppName installed successfully!" -ForegroundColor Green
Write-Host " Shortcuts created on Desktop & Start Menu with official logo." -ForegroundColor Green
Write-Host " Location: $InstallDir\DASCRM.exe" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

