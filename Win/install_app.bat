@echo off
title Installing DAS CRM Desktop
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install_app.ps1"
pause

