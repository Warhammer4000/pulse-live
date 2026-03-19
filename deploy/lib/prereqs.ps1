function Install-NodeJS {
    Write-Step "Attempting to install Node.js..."

    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Info "Using winget..."
        winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" +
                    [System.Environment]::GetEnvironmentVariable("PATH","User")
        if (Get-Command npm -ErrorAction SilentlyContinue) {
            Write-Success "Node.js installed via winget"; return $true
        }
    }

    if (Get-Command choco -ErrorAction SilentlyContinue) {
        Write-Info "Using Chocolatey..."
        choco install nodejs-lts -y
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" +
                    [System.Environment]::GetEnvironmentVariable("PATH","User")
        if (Get-Command npm -ErrorAction SilentlyContinue) {
            Write-Success "Node.js installed via Chocolatey"; return $true
        }
    }

    Write-Err "Could not auto-install Node.js."
    Write-Info "Please install it manually from https://nodejs.org and re-run this script."
    return $false
}

function Check-Prerequisites {
    Write-Step "Checking prerequisites..."
    Write-Host ""

    # Node / npm
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        Write-Success "npm           v$(npm --version 2>&1)"
    } else {
        Write-Warn "npm / Node.js not found."
        if (Ask-YesNo "Install Node.js LTS now?") {
            if (-not (Install-NodeJS)) { exit 1 }
        } else {
            Write-Err "Node.js is required. Install it from https://nodejs.org and re-run."
            exit 1
        }
    }

    # Supabase CLI
    if (Get-Command supabase -ErrorAction SilentlyContinue) {
        Write-Success "supabase CLI  $(Invoke-Supabase --version 2>&1)"
    } else {
        Write-Warn "supabase CLI not found."
        if (Ask-YesNo "Install supabase CLI now?  (via Scoop)") {
            if (-not (Get-Command scoop -ErrorAction SilentlyContinue)) {
                Write-Step "Scoop not found — installing Scoop first..."
                Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
                Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
                $env:PATH = "$env:USERPROFILE\scoop\shims;" + $env:PATH
            }
            Write-Step "Installing supabase CLI via Scoop..."
            scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
            scoop install supabase
            $env:PATH = "$env:USERPROFILE\scoop\shims;" + $env:PATH
            if (Get-Command supabase -ErrorAction SilentlyContinue) {
                Write-Success "supabase CLI installed"
            } else {
                Write-Err "Installation failed. Try running: scoop install supabase"
                exit 1
            }
        } else {
            Write-Err "supabase CLI is required. Re-run when ready."
            exit 1
        }
    }

    # Netlify CLI
    if (Get-Command netlify -ErrorAction SilentlyContinue) {
        $netlifyVer = (netlify --version 2>&1) -split "`n" | Select-Object -First 1
        Write-Success "netlify CLI   $netlifyVer"
    } else {
        Write-Warn "netlify CLI not found."
        if (Ask-YesNo "Install netlify CLI now?  (npm install -g netlify-cli)") {
            Write-Step "Installing netlify CLI..."
            npm install -g netlify-cli
            $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" +
                        [System.Environment]::GetEnvironmentVariable("PATH","User")
            if (Get-Command netlify -ErrorAction SilentlyContinue) {
                Write-Success "netlify CLI installed"
            } else {
                Write-Err "Installation failed. Try running: npm install -g netlify-cli"
                exit 1
            }
        } else {
            Write-Err "netlify CLI is required. Re-run when ready."
            exit 1
        }
    }
}
