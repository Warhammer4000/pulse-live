function Invoke-NetlifyInteractive([string[]]$argList) {
    $cmdArgs = @("/c", "netlify") + $argList
    Start-Process -FilePath "cmd.exe" -ArgumentList $cmdArgs -NoNewWindow -PassThru -Wait | Out-Null
}

function Step-Netlify([string]$supabaseUrl, [string]$anonKey) {
    Write-Host ""
    Write-Host "  ┌─ NETLIFY DEPLOY ───────────────────────────────────────────┐" -ForegroundColor DarkMagenta
    Write-Host ""

    # Login check
    $whoami = netlify status 2>&1
    if ($whoami -match "Not logged in|not authenticated") {
        Write-Warn "Not logged in to Netlify."
        Write-Step "Opening Netlify login..."
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "netlify", "login" -NoNewWindow -PassThru -Wait | Out-Null
    } else {
        $userLine = ($whoami | Select-String "Email").Line
        Write-Success "Logged in to Netlify  $userLine"
    }

    # Site link check — state.json presence + netlify status text
    $stateFile = Join-Path $PSScriptRoot "../.netlify/state.json"
    $siteStatusText = (netlify status 2>&1) -join "`n"
    $stateHasSite = (Test-Path $stateFile) -and ((Get-Content $stateFile -Raw) -match '"siteId"\s*:\s*"[a-f0-9\-]+"')
    $isLinked = $stateHasSite -or ($siteStatusText -match "Current site:|Current project:|Linked to |Project already linked")

    if (-not $isLinked) {
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
    $siteStatusText = (netlify status 2>&1) -join "`n"
    $siteLine = if ($siteStatusText -match "Current (?:site|project):\s*(.+)") { $Matches[1].Trim() } else { "" }
    if ($siteLine -and $siteLine -ne "undefined") {
        Write-Success "Site linked: $siteLine"
    } else {
        Write-Success "Site linked"
    }

    # Set env vars
    Write-Step "Setting Supabase environment variables on Netlify..."
    netlify env:set VITE_SUPABASE_URL $supabaseUrl --force 2>&1 | Out-Null
    netlify env:set VITE_SUPABASE_PUBLISHABLE_KEY $anonKey --force 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
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

    if ($isProd) {
        Invoke-NetlifyInteractive @("deploy", "--build", "--prod")
    } else {
        Invoke-NetlifyInteractive @("deploy", "--build")
    }

    # Capture the live site URL from netlify status after deploy
    $postStatus = (netlify status 2>&1) -join "`n"
    if ($postStatus -match "Project URL:\s*(https://\S+)") {
        $script:NetlifySiteUrl = $Matches[1].Trim()
    } elseif ($postStatus -match "Site url:\s*(https://\S+)") {
        $script:NetlifySiteUrl = $Matches[1].Trim()
    } else {
        $script:NetlifySiteUrl = ""
    }

    Write-Success "Deploy complete"
}

function Invoke-NetlifyLink {
    Write-Step "Linking to existing site..."
    $stateFile = Join-Path $PSScriptRoot "../.netlify/state.json"
    if (Test-Path $stateFile) { Remove-Item $stateFile -Force }
    Invoke-NetlifyInteractive @("link")

    $siteStatusText = (netlify status 2>&1) -join "`n"
    $stateHasSite = (Test-Path $stateFile) -and ((Get-Content $stateFile -Raw) -match '"siteId"\s*:\s*"[a-f0-9\-]+"')
    if (-not $stateHasSite -and $siteStatusText -notmatch "Current site:|Current project:") {
        Write-Err "Site linking failed or was cancelled."
        exit 1
    }
}

function Invoke-NetlifyCreate {
    Write-Step "Creating a new site and linking..."

    # Clear stale state.json — prevents "already linked to undefined" error
    $stateFile = Join-Path $PSScriptRoot "../.netlify/state.json"
    if (Test-Path $stateFile) {
        Remove-Item $stateFile -Force
        Write-Info "Cleared stale site link."
    }

    # Fetch teams to pass --account-slug, bypassing the broken interactive
    # team picker in netlify CLI (crashes in non-native TTY on Windows)
    $accountSlug = Get-NetlifyAccountSlug

    Write-Host "  Site name (leave blank for random): " -ForegroundColor White -NoNewline
    $siteName = Read-Host

    $createArgs = @("sites:create")
    if ($accountSlug) { $createArgs += @("--account-slug", $accountSlug) }
    if ($siteName)    { $createArgs += @("--name", $siteName) }

    Invoke-NetlifyInteractive $createArgs
    # sites:create auto-links — no further action needed
}

function Get-NetlifyAccountSlug {
    try {
        $teams = (cmd /c netlify api listAccountsForUser 2>&1) -join "`n" | ConvertFrom-Json
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
