#!/usr/bin/env bash
# PulseLive deployment assistant — Mac/Linux entry point
# Requires PowerShell Core (pwsh): https://github.com/PowerShell/PowerShell
if ! command -v pwsh &>/dev/null; then
  echo "PowerShell Core (pwsh) is required."
  echo "Install it from: https://github.com/PowerShell/PowerShell#get-powershell"
  exit 1
fi
pwsh -NoProfile -ExecutionPolicy Bypass -File "$(dirname "$0")/deploy/main.ps1"
