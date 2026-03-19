#!/usr/bin/env pwsh
# PulseLive Deployment Assistant — entry point
Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

# Ensure Scoop shims are on PATH
$scoopShims = "$env:USERPROFILE\scoop\shims"
if ((Test-Path $scoopShims) -and ($env:PATH -notlike "*$scoopShims*")) {
    $env:PATH = "$scoopShims;" + $env:PATH
}

# Load modules
$lib = Join-Path $PSScriptRoot "lib"
. "$lib/ui.ps1"
. "$lib/supabase.ps1"
. "$lib/prereqs.ps1"
. "$lib/netlify.ps1"
. "$lib/env.ps1"

function Show-Summary([string]$url, [string]$anonKey) {
    Write-Host ""
    Write-Host "  ─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "  All done." -ForegroundColor Green
    Write-Host ""
    Write-Host "  Supabase URL  $url" -ForegroundColor DarkGray
    Write-Host "  Anon key      $($anonKey.Substring(0,24))..." -ForegroundColor DarkGray
    $siteUrl = if ($null -ne $script:NetlifySiteUrl -and $script:NetlifySiteUrl -ne "") { $script:NetlifySiteUrl } else { $null }
    if ($siteUrl) {
        Write-Host "  Site URL      $siteUrl" -ForegroundColor Cyan
    }
    Write-Host ""
    Write-Host "  Next steps:" -ForegroundColor White
    Write-Host "    • Open your Netlify site URL and sign up for the first account" -ForegroundColor DarkGray
    Write-Host "    • Create a presentation and start a live session" -ForegroundColor DarkGray
    Write-Host "    • Share the join code or QR with your audience" -ForegroundColor DarkGray
    Write-Host ""
}

# Shared state set by sub-steps
$script:SupabaseCreds      = $null
$script:SupabaseProjectRef = ""
$script:NetlifySiteUrl     = ""

# Read default project name from package.json
$script:DefaultProjectName = "my-app"
try {
    $pkg = Get-Content (Join-Path $PSScriptRoot "../package.json") -Raw | ConvertFrom-Json
    if ($pkg.name) { $script:DefaultProjectName = $pkg.name -replace "_", "-" }
} catch { }

Write-Header
Check-Prerequisites
Pause-ForKey "Prerequisites OK — press any key to start setup..."

Step-Supabase
Step-WriteEnv -url $script:SupabaseCreds.Url -anonKey $script:SupabaseCreds.AnonKey
Step-Netlify -supabaseUrl $script:SupabaseCreds.Url -anonKey $script:SupabaseCreds.AnonKey

# Prompt user to configure Supabase auth URLs with the real production URL
$resolvedSiteUrl = if ($null -ne $script:NetlifySiteUrl -and $script:NetlifySiteUrl -ne "") {
    $script:NetlifySiteUrl
} else {
    "<your-netlify-site-url>"
}
Update-SupabaseAuthUrls -projectRef $script:SupabaseProjectRef -siteUrl $resolvedSiteUrl

Show-Summary -url $script:SupabaseCreds.Url -anonKey $script:SupabaseCreds.AnonKey
