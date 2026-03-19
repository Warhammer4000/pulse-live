function Invoke-NetlifyCli {
    param([string[]]$argList, [switch]$CaptureOutput)
    if ($IsWindows) {
        $cmdArgs = @("/c", "netlify") + $argList
        if ($CaptureOutput) {
            return (cmd /c netlify @argList 2>&1)
        } else {
            Start-Process -FilePath "cmd.exe" -ArgumentList $cmdArgs -NoNewWindow -PassThru -Wait | Out-Null
        }
    } else {
        $netlifyBin = (Get-Command netlify -ErrorAction SilentlyContinue)?.Source
        if ($CaptureOutput) {
            return (& $netlifyBin @argList 2>&1)
        } else {
            Start-Process -FilePath $netlifyBin -ArgumentList $argList -NoNewWindow -PassThru -Wait | Out-Null
        }
    }
}

function Get-NetlifyStatus {
    return (Invoke-NetlifyCli @("status") -CaptureOutput) -join "`n"
}

function Step-Netlify([string]$supabaseUrl, [string]$anonKey) {
    Write-Host ""
    Write-Host "  ┌─ NETLIFY DEPLOY ───────────────────────────────────────────┐" -ForegroundColor DarkMagenta
    Write-Host ""

    # Login check
    $statusText = Get-NetlifyStatus
    if ($statusText -match "Not logged in|not authenticated") {
        Write-Warn "Not logged in to Netlify."
        Write-Step "Opening Netlify login..."
        Invoke-NetlifyCli @("login")
        $statusText = Get-NetlifyStatus
    } else {
        $userLine = ($statusText -split "`n" | Select-String "Email").Line
        Write-Success "Logged in to Netlify  $userLine"
    }

    # Site link check — a site is truly linked only if netlify status shows a real project name (not "undefined")
    $isLinked = $statusText -match "Current (?:site|project):\s*(?!undefined)\S+"

    if (-not $isLinked) {
        # Clear any stale state.json before presenting options
        $stateFile = Join-Path $PSScriptRoot "../../.netlify/state.json"
        if (Test-Path $stateFile) {
            Remove-Item $stateFile -Force
            Write-Info "Cleared stale site link."
        }

        $idx = Show-Menu "No site linked. What would you like to do?" @(
            "Link to an existing Netlify site",
            "Create a new Netlify site"
        )

        if ($idx -eq 0) {
            Invoke-NetlifyLink
        } else {
            Invoke-NetlifyCreate
        }
    }

    # Display linked site name
    Start-Sleep -Milliseconds 500
    $statusText = Get-NetlifyStatus
    $siteLine = if ($statusText -match "Current (?:site|project):\s*(.+)") { $Matches[1].Trim() } else { "" }
    if ($siteLine -and $siteLine -ne "undefined") {
        Write-Success "Site linked: $siteLine"
    } else {
        Write-Success "Site linked"
    }

    # Set env vars via netlify env:set (must go through cmd /c on Windows)
    Write-Step "Setting Supabase environment variables on Netlify..."
    $envOk = $true
    $r1 = Invoke-NetlifyCli @("env:set", "VITE_SUPABASE_URL", $supabaseUrl, "--force") -CaptureOutput
    if ($r1 -match "Error|error") { $envOk = $false }
    $r2 = Invoke-NetlifyCli @("env:set", "VITE_SUPABASE_PUBLISHABLE_KEY", $anonKey, "--force") -CaptureOutput
    if ($r2 -match "Error|error") { $envOk = $false }

    if ($envOk) {
        Write-Success "Environment variables set"
    } else {
        Write-Warn "Could not set env vars automatically — set them manually in the Netlify dashboard."
        Write-Info "  VITE_SUPABASE_URL=$supabaseUrl"
        Write-Info "  VITE_SUPABASE_PUBLISHABLE_KEY=$anonKey"
    }

    # Deploy
    Write-Host ""
    $isProd = Ask-YesNo "Deploy to production?  (No = draft preview)"
    Write-Host ""
    Write-Step "Handing off to netlify deploy..."
    Write-Info "netlify will handle the build, site setup, and upload."
    Write-Host ""

    # Capture deploy output so we can extract the production URL
    $deployArgs = if ($isProd) { @("deploy", "--build", "--prod") } else { @("deploy", "--build") }
    $deployOutput = Invoke-NetlifyCli $deployArgs -CaptureOutput
    # Print it so the user sees progress
    $deployOutput | ForEach-Object { Write-Host $_ }

    # Extract production URL from deploy output
    $script:NetlifySiteUrl = ""
    foreach ($line in $deployOutput) {
        if ($line -match "Deployed to production URL:\s*(https://\S+)") {
            $script:NetlifySiteUrl = $Matches[1].Trim().TrimEnd('│').Trim()
            break
        }
        if ($line -match "Website URL:\s*(https://\S+)") {
            $script:NetlifySiteUrl = $Matches[1].Trim()
            break
        }
        if ($line -match "URL:\s*(https://[a-z0-9\-]+\.netlify\.app)") {
            if (-not $script:NetlifySiteUrl) {
                $script:NetlifySiteUrl = $Matches[1].Trim()
            }
        }
    }

    # Fallback: read from netlify status
    if (-not $script:NetlifySiteUrl) {
        $postStatus = Get-NetlifyStatus
        if ($postStatus -match "(?:Project URL|Site url|URL):\s*(https://[a-z0-9\-]+\.netlify\.app)") {
            $script:NetlifySiteUrl = $Matches[1].Trim()
        }
    }

    Write-Success "Deploy complete"
}

function Invoke-NetlifyLink {
    Write-Step "Linking to existing site..."
    Invoke-NetlifyCli @("link")

    $siteStatusText = Get-NetlifyStatus
    if ($siteStatusText -notmatch "Current (?:site|project):\s*(?!undefined)\S+") {
        Write-Err "Site linking failed or was cancelled."
        exit 1
    }
}

function Invoke-NetlifyCreate {
    Write-Step "Creating a new site and linking..."

    $accountSlug = Get-NetlifyAccountSlug

    Write-Host "  Site name [$script:DefaultProjectName]: " -ForegroundColor White -NoNewline
    $nameInput = Read-Host
    $siteName = if ($nameInput.Trim() -ne "") { $nameInput.Trim() } else { $script:DefaultProjectName }

    $createArgs = @("sites:create")
    if ($accountSlug) { $createArgs += @("--account-slug", $accountSlug) }
    if ($siteName)    { $createArgs += @("--name", $siteName) }

    Invoke-NetlifyCli $createArgs
    # sites:create auto-links — no further action needed
}

function Get-NetlifyAccountSlug {
    try {
        $raw = (Invoke-NetlifyCli @("api", "listAccountsForUser") -CaptureOutput) -join "`n"
        $teams = $raw | ConvertFrom-Json
        if ($teams.Count -eq 1) {
            Write-Success "Team: $($teams[0].name)"
            return $teams[0].slug
        } elseif ($teams.Count -gt 1) {
            $teamIdx = Show-Menu "Select a Netlify team:" @($teams | ForEach-Object { "$($_.name)  ($($_.slug))" })
            return $teams[$teamIdx].slug
        }
    } catch {
        Write-Warn "Could not fetch teams — netlify will prompt interactively."
    }
    return $null
}
