#!/usr/bin/env powershell
$ErrorActionPreference = 'Continue'
$VerbosePreference = 'Continue'

# Configura git per evitare popup
$env:GIT_ASKPASS = "echo"
$env:GCM_INTERACTIVE = "Never"
$env:GIT_TERMINAL_PROMPT = "0"

# Vai nella cartella del progetto
Set-Location -Path "c:\Users\Anas\Desktop\projecto"

# Configura credential helper
& git config --global credential.helper cache

# Stage
& git add .

# Commit
& git commit -m "fix(backend): auto-create shared dashboard v3 - return direct response"

# Push
& git push origin main

Write-Host "Comandi eseguiti"
