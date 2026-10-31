; DAS CRM Inno Setup Installer Script
; Build this with: iscc installer.iss
; Download Inno Setup: https://jrsoftware.org/isdl.php

#define MyAppName "DAS CRM"
#define MyAppVersion "2.0.0"
#define MyAppPublisher "DAS CRM"
#define MyAppURL "https://dascrm.com"
#define MyAppExeName "DASCRM.exe"

[Setup]
; Application info
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

; Install locations
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes

; Output
OutputDir=installer
OutputBaseFilename=DASCRM_Setup_v{#MyAppVersion}
SetupIconFile=resources\icon.ico

; Compression
Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes

; Privileges
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog

; UI
WizardStyle=modern
WizardSizePercent=100

; Misc
DisableProgramGroupPage=yes
LicenseFile=
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkedonce
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode

[Files]
Source: "dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "resources\*"; DestDir: "{app}\resources"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\resources\icon.ico"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"; IconFilename: "{app}\resources\icon.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\resources\icon.ico"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\resources\icon.ico"; Tasks: quicklaunchicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Uninstall\{#MyAppName}"; ValueType: string; ValueName: "DisplayName"; ValueData: "{#MyAppName}"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Uninstall\{#MyAppName}"; ValueType: string; ValueName: "DisplayIcon"; ValueData: "{app}\resources\icon.ico"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Uninstall\{#MyAppName}"; ValueType: string; ValueName: "DisplayVersion"; ValueData: "{#MyAppVersion}"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Uninstall\{#MyAppName}"; ValueType: string; ValueName: "Publisher"; ValueData: "{#MyAppPublisher}"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Uninstall\{#MyAppName}"; ValueType: string; ValueName: "InstallLocation"; ValueData: "{app}"; Flags: uninsdeletekey

[UninstallDelete]
Type: filesandordirs; Name: "{localappdata}\{#MyAppName}"
Type: filesandordirs; Name: "{userappdata}\{#MyAppName}"
