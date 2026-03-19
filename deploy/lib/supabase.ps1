function Get-SupabasePath {
    $cmd = Get-Command supabase -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $shimExe = "$env:USERPROFILE\scoop\shims\supabase.exe"
    if (Test-Path $shimExe) { return $shimExe }
    throw "supabase CLI not found"
}

function Invoke-Supabase {
    $exe = Get-SupabasePath
    & $exe @args
}

function ConvertFrom-SupabaseJson([string]$raw) {
    $jsonLines = ($raw -split "`n") | Where-Object { $_ -match '^\s*[\[\]{},":0-9tfn]' }
    return ($jsonLines -join "`n") | ConvertFrom-Json
}

function Step-Supabase {
    Write-Host ""
    Write-Host "  ┌─ SUPABASE SETUP ──────────────────────────────────────────┐" -ForegroundColor DarkMagenta
    Write-Host ""

    # Login check
    $loginStatus = Invoke-Supabase projects list 2>&1
    $notLoggedIn = ($LASTEXITCODE -ne 0) -or ($loginStatus -match "Access token not provided|not logged in|Login required")
    if ($notLoggedIn) {
        Write-Warn "Not logged in to Supabase."
        Write-Step "Opening browser for Supabase login..."
        $exe = Get-SupabasePath
        $proc = Start-Process -FilePath $exe -ArgumentList "login" -NoNewWindow -PassThru -Wait
        if ($proc.ExitCode -ne 0) { Write-Err "Login failed or was cancelled."; exit 1 }
        Write-Success "Logged in to Supabase"
    } else {
        Write-Success "Already logged in to Supabase"
    }

    # Project selection
    Write-Host ""
    Write-Step "Fetching your Supabase projects..."
    $projectsRaw = (Invoke-Supabase projects list --output json 2>&1) -join "`n"
    $projects = @()
    try {
        $parsed = ConvertFrom-SupabaseJson $projectsRaw
        if ($parsed) { $projects = @($parsed) }
    } catch { }

    $idx = -1
    if ($projects.Count -gt 0) {
        $options = @($projects | ForEach-Object { "$($_.name)  ($($_.id))" }) + "[ Create a new project ]"
        $idx = Show-Menu "Select a Supabase project:" $options
    }

    if ($idx -eq -1 -or $idx -eq $projects.Count) {
        if ($projects.Count -eq 0) { Write-Info "No existing projects found — creating a new one." }
        $project = New-SupabaseProject
    } else {
        $project = $projects[$idx]
    }

    $projectRef = $project.id
    Write-Success "Using project: $($project.name)  [$projectRef]"

    # Link
    Write-Host ""
    Write-Step "Linking local repo to project '$($project.name)'..."
    Write-Warn "You will be prompted for your database password."
    $exe = Get-SupabasePath
    Start-Process -FilePath $exe -ArgumentList "link", "--project-ref", $projectRef -NoNewWindow -PassThru -Wait | Out-Null

    # Migrations
    Invoke-MigrationCheck -exe $exe -projectRef $projectRef

    # API keys
    Write-Step "Fetching API credentials..."
    $keys = ConvertFrom-SupabaseJson ((Invoke-Supabase projects api-keys --project-ref $projectRef --output json 2>&1) -join "`n")
    $anonKey = ($keys | Where-Object { $_.name -eq "anon" }).api_key
    $supabaseUrl = "https://$projectRef.supabase.co"

    Write-Success "Supabase URL:  $supabaseUrl"
    Write-Success "Anon key:      $($anonKey.Substring(0,24))..."

    $script:SupabaseCreds = @{ Url = $supabaseUrl; AnonKey = $anonKey }
    $script:SupabaseProjectRef = $projectRef
}

function Update-SupabaseAuthUrls([string]$projectRef, [string]$siteUrl) {
    Write-Host ""
    Write-Host "  ┌─ SUPABASE AUTH CONFIGURATION ─────────────────────────────┐" -ForegroundColor DarkMagenta
    Write-Host ""
    Write-Step "Action required: set your site URL in Supabase."
    Write-Host ""
    Write-Info "  Open this URL in your browser:"
    Write-Host "  https://supabase.com/dashboard/project/$projectRef/auth/url-configuration" -ForegroundColor Cyan
    Write-Host ""
    Write-Info "  Set 'Site URL' to:"
    Write-Host "  $siteUrl" -ForegroundColor White
    Write-Host ""
    Write-Info "  Also add to 'Redirect URLs':"
    Write-Host "  $siteUrl/**" -ForegroundColor White
    Write-Host ""
    Pause-ForKey "Press any key once you've saved the changes..."
    Write-Success "Auth URL configuration done"
}

function New-SupabaseProject {
    Write-Host ""
    Write-Step "Fetching your organisations..."
    $orgs = ConvertFrom-SupabaseJson ((Invoke-Supabase orgs list --output json 2>&1) -join "`n")
    $orgIdx = Show-Menu "Select an organisation:" @($orgs | ForEach-Object { "$($_.name)  ($($_.id))" })
    $orgId = $orgs[$orgIdx].id

    Write-Host ""
    Write-Host "  Project name [$script:DefaultProjectName]: " -ForegroundColor White -NoNewline
    $input = Read-Host
    $projName = if ($input.Trim() -ne "") { $input.Trim() } else { $script:DefaultProjectName }

    $regions = @(
        "us-east-1","us-west-1","us-west-2",
        "eu-west-1","eu-west-2","eu-west-3","eu-central-1",
        "ap-southeast-1","ap-southeast-2","ap-northeast-1","ap-northeast-2",
        "sa-east-1","ca-central-1"
    )
    $region = $regions[(Show-Menu "Select a region:" $regions)]

    Write-Host ""
    Write-Host "  DB password: " -ForegroundColor White -NoNewline
    $dbPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR((Read-Host -AsSecureString)))

    Write-Step "Creating project '$projName'..."
    Invoke-Supabase projects create $projName --org-id $orgId --db-password $dbPassPlain --region $region | Out-Null
    Write-Success "Project created. Re-fetching list..."

    $projects = ConvertFrom-SupabaseJson ((Invoke-Supabase projects list --output json 2>&1) -join "`n")
    return $projects | Where-Object { $_.name -eq $projName } | Select-Object -First 1
}

function Invoke-MigrationCheck([string]$exe, [string]$projectRef) {
    Write-Host ""
    $migrationsPath = Join-Path $PSScriptRoot "../supabase/migrations"
    $migrationFiles = @()
    if (Test-Path $migrationsPath) {
        $migrationFiles = Get-ChildItem -Path $migrationsPath -Filter "*.sql" -ErrorAction SilentlyContinue
    }

    if ($migrationFiles.Count -eq 0) {
        Write-Info "No migration files found — skipping db push."
        return
    }

    Write-Step "Checking migration status..."
    $migListText = (Invoke-Supabase migration list --project-ref $projectRef 2>&1) -join "`n"
    $pendingCount = ([regex]::Matches($migListText, '│\s+│')).Count

    if ($pendingCount -eq 0) {
        Write-Success "All migrations already applied — skipping db push."
    } elseif (Ask-YesNo "$pendingCount pending migration(s) found. Apply them now?") {
        Write-Step "Pushing migrations..."
        Start-Process -FilePath $exe -ArgumentList "db", "push" -NoNewWindow -PassThru -Wait | Out-Null
        Write-Success "Migrations applied"
    }
}
