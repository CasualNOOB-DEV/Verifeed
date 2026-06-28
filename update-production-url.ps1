# Update Extension with Production Vercel URL
# Usage: .\update-production-url.ps1 -VercelUrl "https://your-url.vercel.app"

param(
    [Parameter(Mandatory=$true)]
    [string]$VercelUrl
)

Write-Host "🔧 Updating Verifeed Extension with Production URL" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Production URL: $VercelUrl" -ForegroundColor Yellow
Write-Host ""

# Validate URL
if ($VercelUrl -notmatch '^https://.*\.vercel\.app$') {
    Write-Host "⚠️  Warning: URL doesn't look like a Vercel URL" -ForegroundColor Yellow
    Write-Host "Expected format: https://your-project.vercel.app" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        Write-Host "Aborted." -ForegroundColor Red
        exit
    }
}

# Update types/index.ts
Write-Host "📝 Updating extension/src/types/index.ts..." -ForegroundColor Yellow
$typesPath = "extension\src\types\index.ts"
if (Test-Path $typesPath) {
    $content = Get-Content $typesPath -Raw
    $updated = $content -replace "apiEndpoint: 'http://localhost:3000'", "apiEndpoint: '$VercelUrl'"
    $updated | Set-Content $typesPath
    Write-Host "  ✓ Updated DEFAULT_SETTINGS.apiEndpoint" -ForegroundColor Green
} else {
    Write-Host "  ✗ File not found!" -ForegroundColor Red
}

# Update manifest.json
Write-Host ""
Write-Host "📝 Updating extension/manifest.json..." -ForegroundColor Yellow
$manifestPath = "extension\manifest.json"
if (Test-Path $manifestPath) {
    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    
    # Update host_permissions
    $manifest.host_permissions = @("$VercelUrl/*")
    
    # Save back to file with proper formatting
    $manifest | ConvertTo-Json -Depth 10 | Set-Content $manifestPath
    Write-Host "  ✓ Updated host_permissions" -ForegroundColor Green
} else {
    Write-Host "  ✗ File not found!" -ForegroundColor Red
}

# Rebuild extension
Write-Host ""
Write-Host "🔨 Rebuilding extension..." -ForegroundColor Yellow
Push-Location "extension"
npm run build | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Extension rebuilt successfully" -ForegroundColor Green
} else {
    Write-Host "  ✗ Build failed!" -ForegroundColor Red
}
Pop-Location

# Create submission package
Write-Host ""
Write-Host "📦 Creating Chrome Web Store package..." -ForegroundColor Yellow

# Create submission folder
$submissionPath = "chrome-store-submission"
if (Test-Path $submissionPath) {
    Remove-Item $submissionPath -Recurse -Force
}
New-Item -ItemType Directory -Path $submissionPath | Out-Null

# Copy files
Copy-Item "extension\manifest.json" "$submissionPath\"
Copy-Item "extension\dist" "$submissionPath\" -Recurse
Copy-Item "extension\icons" "$submissionPath\" -Recurse

# Create ZIP
$zipPath = "verifeed-v1.0.0.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path "$submissionPath\*" -DestinationPath $zipPath -Force

$zipSize = (Get-Item $zipPath).Length / 1MB
Write-Host "  ✓ Created $zipPath ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "✅ DONE! Extension updated for production" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Chrome Web Store package ready:" -ForegroundColor Yellow
Write-Host "   File: $zipPath" -ForegroundColor White
Write-Host "   Size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test it locally:" -ForegroundColor Yellow
Write-Host "   1. Go to chrome://extensions/" -ForegroundColor White
Write-Host "   2. Reload Verifeed extension" -ForegroundColor White
Write-Host "   3. Right-click extension icon → Options" -ForegroundColor White
Write-Host "   4. Verify API Endpoint shows: $VercelUrl" -ForegroundColor White
Write-Host "   5. Click 'Test Connection' - should show ✓" -ForegroundColor White
Write-Host "   6. Try verifying a claim on Wikipedia" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ready to submit to Chrome Web Store!" -ForegroundColor Green
Write-Host "   Upload: $zipPath" -ForegroundColor White
Write-Host ""
