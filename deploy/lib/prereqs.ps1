function Install-NodeJS {
    Write-Step "Attempting to install Node.js..."

    # ── Windows ──────────────────────────────────────────────────────────────
    if ($IsWindows) {
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

        if (Get-Command scoop -ErrorAction SilentlyContinue) {
            Write-Info "Using Scoop..."
            scoop install nodejs-lts
            $env:PATH = "$env:USERPROFILE\scoop\shims;" + $env:PATH
            if (Get-Command npm -ErrorAction SilentlyContinue) {
                Write-Success "Node.js installed via Scoop"; return $true
            }
        }

        Write-Err "Could not auto-install Node.js."
        Write-Info "Please install it manually from https://nodejs.org and re-run this script."
        return $false
    }

    # ── macOS ─────────────────────────────────────────────────────────────────
    if ($IsMacOS) {
        if (Get-Command brew -ErrorAction SilentlyContinue) {
            Write-Info "Using Homebrew..."
            brew install node@lts
            # Homebrew may not link by default
            $brewPrefix = (brew --prefix) 2>&1
            $env:PATH = "$brewPrefix/bin:" + $env:PATH
            if (Get-Command npm -ErrorAction SilentlyContinue) {
                Write-Success "Node.js installed via Homebrew"; return $true
            }
        }

        # Fall back to nvm
        Write-Info "Homebrew not found — trying nvm..."
        $nvmScript = "$HOME/.nvm/nvm.sh"
        if (-not (Test-Path $nvmScript)) {
            Write-Info "Installing nvm..."
            bash -c "curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/HEAD/install.sh | bash"
        }
        if (Test-Path $nvmScript) {
            bash -c "source $nvmScript && nvm install --lts && nvm use --lts"
            # Expose the newly installed node to this session
            $nvmNodePath = bash -c "source $nvmScript && nvm which current 2>/dev/null" 2>&1
            if ($nvmNodePath) {
                $env:PATH = (Split-Path $nvmNodePath) + ":" + $env:PATH
            }
            if (Get-Command npm -ErrorAction SilentlyContinue) {
                Write-Success "Node.js installed via nvm"; return $true
            }
        }

        Write-Err "Could not auto-install Node.js."
        Write-Info "Install Homebrew (https://brew.sh) or Node.js directly from https://nodejs.org"
        return $false
    }

    # ── Linux ─────────────────────────────────────────────────────────────────
    if ($IsLinux) {
        # Detect package manager and install
        $installed = $false

        if (Get-Command apt-get -ErrorAction SilentlyContinue) {
            Write-Info "Using apt (NodeSource LTS)..."
            bash -c "curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs"
            $installed = $true
        } elseif (Get-Command dnf -ErrorAction SilentlyContinue) {
            Write-Info "Using dnf (NodeSource LTS)..."
            bash -c "curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash - && sudo dnf install -y nodejs"
            $installed = $true
        } elseif (Get-Command yum -ErrorAction SilentlyContinue) {
            Write-Info "Using yum (NodeSource LTS)..."
            bash -c "curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash - && sudo yum install -y nodejs"
            $installed = $true
        } elseif (Get-Command pacman -ErrorAction SilentlyContinue) {
            Write-Info "Using pacman..."
            bash -c "sudo pacman -Sy --noconfirm nodejs npm"
            $installed = $true
        } elseif (Get-Command zypper -ErrorAction SilentlyContinue) {
            Write-Info "Using zypper..."
            bash -c "sudo zypper install -y nodejs npm"
            $installed = $true
        } elseif (Get-Command snap -ErrorAction SilentlyContinue) {
            Write-Info "Using snap..."
            bash -c "sudo snap install node --classic --channel=lts/stable"
            $installed = $true
        }

        if ($installed) {
            $env:PATH = "/usr/local/bin:/usr/bin:" + $env:PATH
            if (Get-Command npm -ErrorAction SilentlyContinue) {
                Write-Success "Node.js installed"; return $true
            }
        }

        # Fall back to nvm on Linux too
        Write-Info "Trying nvm as fallback..."
        $nvmScript = "$HOME/.nvm/nvm.sh"
        if (-not (Test-Path $nvmScript)) {
            bash -c "curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/HEAD/install.sh | bash"
        }
        if (Test-Path $nvmScript) {
            bash -c "source $nvmScript && nvm install --lts && nvm use --lts"
            $nvmNodePath = bash -c "source $nvmScript && nvm which current 2>/dev/null" 2>&1
            if ($nvmNodePath) {
                $env:PATH = (Split-Path $nvmNodePath) + ":" + $env:PATH
            }
            if (Get-Command npm -ErrorAction SilentlyContinue) {
                Write-Success "Node.js installed via nvm"; return $true
            }
        }

        Write-Err "Could not auto-install Node.js."
        Write-Info "Please install it manually from https://nodejs.org and re-run this script."
        return $false
    }

    Write-Err "Unsupported OS. Install Node.js from https://nodejs.org and re-run."
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
        $installHint = if ($IsWindows) { "via Scoop" } else { "via Homebrew" }
        if (Ask-YesNo "Install supabase CLI now?  ($installHint)") {
            if ($IsWindows) {
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
            } else {
                if (-not (Get-Command brew -ErrorAction SilentlyContinue)) {
                    Write-Err "Homebrew not found. Install it from https://brew.sh then re-run."
                    exit 1
                }
                Write-Step "Installing supabase CLI via Homebrew..."
                brew install supabase/tap/supabase
            }
            if (Get-Command supabase -ErrorAction SilentlyContinue) {
                Write-Success "supabase CLI installed"
            } else {
                Write-Err "Installation failed."
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
