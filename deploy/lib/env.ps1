function Step-WriteEnv([string]$url, [string]$anonKey) {
    Write-Host ""
    Write-Host "  ┌─ ENVIRONMENT FILE ────────────────────────────────────────┐" -ForegroundColor DarkMagenta
    Write-Host ""

    $envPath = Join-Path $PSScriptRoot "../.env"
    $envContent = @"
VITE_SUPABASE_URL=$url
VITE_SUPABASE_PUBLISHABLE_KEY=$anonKey
"@

    if (Test-Path $envPath) {
        $existing = Get-Content $envPath -Raw
        if ($existing.Trim() -eq $envContent.Trim()) {
            Write-Success ".env already up to date — skipped"
            return
        }
        Write-Warn ".env already exists with different values."
        if (-not (Ask-YesNo "Overwrite it?")) {
            Write-Info "Skipped — keeping existing .env"
            return
        }
    }

    Set-Content -Path $envPath -Value $envContent -Encoding UTF8
    Write-Success ".env written"
}
