@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\setup-cloudflare-tunnel.ps1"
pause
