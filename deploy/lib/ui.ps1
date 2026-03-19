function Write-Header {
    Clear-Host
    Write-Host ""
    Write-Host "  ██████╗ ██╗   ██╗██╗     ███████╗███████╗    ██╗     ██╗██╗   ██╗███████╗" -ForegroundColor DarkMagenta
    Write-Host "  ██╔══██╗██║   ██║██║     ██╔════╝██╔════╝    ██║     ██║██║   ██║██╔════╝" -ForegroundColor DarkMagenta
    Write-Host "  ██████╔╝██║   ██║██║     ███████╗█████╗      ██║     ██║██║   ██║█████╗  " -ForegroundColor Magenta
    Write-Host "  ██╔═══╝ ██║   ██║██║     ╚════██║██╔══╝      ██║     ██║╚██╗ ██╔╝██╔══╝  " -ForegroundColor Magenta
    Write-Host "  ██║     ╚██████╔╝███████╗███████║███████╗    ███████╗██║ ╚████╔╝ ███████╗" -ForegroundColor White
    Write-Host "  ╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝    ╚══════╝╚═╝  ╚═══╝  ╚══════╝" -ForegroundColor White
    Write-Host ""
    Write-Host "  Deployment Assistant" -ForegroundColor DarkGray
    Write-Host "  ─────────────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host ""
}

function Write-Step([string]$msg)    { Write-Host "  ▸ $msg" -ForegroundColor Cyan }
function Write-Success([string]$msg) { Write-Host "  ✔ $msg" -ForegroundColor Green }
function Write-Warn([string]$msg)    { Write-Host "  ⚠ $msg" -ForegroundColor Yellow }
function Write-Err([string]$msg)     { Write-Host "  ✖ $msg" -ForegroundColor Red }
function Write-Info([string]$msg)    { Write-Host "  $msg" -ForegroundColor DarkGray }

function Pause-ForKey([string]$prompt = "Press any key to continue...") {
    Write-Host ""
    Write-Host "  $prompt" -ForegroundColor DarkGray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Ask-YesNo([string]$question) {
    Write-Host ""
    Write-Host "  $question [Y/n] " -ForegroundColor White -NoNewline
    $key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Write-Host $key.Character
    return ($key.Character -ne 'n' -and $key.Character -ne 'N')
}

function Show-Menu([string]$title, [string[]]$options) {
    Write-Host ""
    Write-Host "  $title" -ForegroundColor White
    Write-Host ""
    for ($i = 0; $i -lt $options.Count; $i++) {
        Write-Host "    [$($i+1)] $($options[$i])" -ForegroundColor Cyan
    }
    Write-Host ""
    Write-Host "  Choice: " -ForegroundColor DarkGray -NoNewline
    $choice = Read-Host
    return [int]$choice - 1
}
