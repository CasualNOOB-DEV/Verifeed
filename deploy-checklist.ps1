# Verifeed Deployment Checklist Script
# Run this to verify everything is ready for deployment

Write-Host "🚀 Verifeed Deployment Checklist" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: Backend files
Write-Host "📦 Checking backend files..." -ForegroundColor Yellow
$backendFiles = @(
    "backend\api\verify.ts",
    "backend\api\health.ts",
    "backend\vercel.json",
    "backend\package.json"
)

$allBackendFilesExist = $true
foreach ($file in $backendFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file MISSING!" -ForegroundColor Red
        $allBackendFilesExist = $false
    }
}

# Check 2: Extension files
Write-Host ""
Write-Host "📦 Checking extension files..." -ForegroundColor Yellow
$extensionFiles = @(
    "extension\manifest.json",
    "extension\dist\background\background.js",
    "extension\dist\content\content.js",
    "extension\icons\icon128.png"
)

$allExtensionFilesExist = $true
foreach ($file in $extensionFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file MISSING!" -ForegroundColor Red
        $allExtensionFilesExist = $false
    }
}

# Check 3: Environment variables check
Write-Host ""
Write-Host "🔐 Environment variables to set in Vercel:" -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    $envContent = Get-Content "backend\.env"
    $hasEnableAI = $envContent -match "ENABLE_AI"
    $hasGroqKey = $envContent -match "GROQ_API_KEY"
    
    if ($hasEnableAI) {
        Write-Host "  ✓ ENABLE_AI found in .env" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ ENABLE_AI not found" -ForegroundColor Yellow
    }
    
    if ($hasGroqKey) {
        Write-Host "  ✓ GROQ_API_KEY found in .env" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ GROQ_API_KEY not found" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "  Remember to add these to Vercel dashboard!" -ForegroundColor Cyan
} else {
    Write-Host "  ⚠ backend\.env not found" -ForegroundColor Yellow
}

# Check 4: Git status
Write-Host ""
Write-Host "📝 Git status..." -ForegroundColor Yellow
git status --short
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Git is initialized" -ForegroundColor Green
} else {
    Write-Host "  ✗ Git error" -ForegroundColor Red
}

# Check 5: Version check
Write-Host ""
Write-Host "📌 Version check..." -ForegroundColor Yellow
$manifestPath = "extension\manifest.json"
if (Test-Path $manifestPath) {
    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    Write-Host "  Extension version: $($manifest.version)" -ForegroundColor Cyan
}

# Summary
Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "📊 SUMMARY" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

if ($allBackendFilesExist -and $allExtensionFilesExist) {
    Write-Host "✅ All required files present!" -ForegroundColor Green
} else {
    Write-Host "❌ Some files are missing!" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Deploy backend to Vercel:" -ForegroundColor White
Write-Host "   cd backend && vercel" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Set environment variables in Vercel dashboard:" -ForegroundColor White
Write-Host "   - ENABLE_AI=true" -ForegroundColor Gray
Write-Host "   - GROQ_API_KEY=gsk_..." -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test deployed backend:" -ForegroundColor White
Write-Host "   curl https://YOUR-URL.vercel.app/api/health" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Update extension with production URL" -ForegroundColor White
Write-Host "5. Build and package for Chrome Web Store" -ForegroundColor White
Write-Host ""
Write-Host "📖 See DEPLOY_NOW.md for detailed instructions!" -ForegroundColor Cyan
