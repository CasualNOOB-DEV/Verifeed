# 🚀 DEPLOY VERIFEED - Step-by-Step Guide

**Goal:** Get Verifeed live on Chrome Web Store TODAY!

---

## 📋 Pre-Flight Checklist

✅ **Backend:**
- [x] AI is working (Groq enabled)
- [x] Local testing works
- [x] Code pushed to GitHub
- [ ] Deployed to Vercel

✅ **Extension:**
- [x] Highlighting works
- [x] Manual verification works
- [x] Right-click context menu works
- [x] Settings page works
- [ ] Updated with production URL
- [ ] Final build created

---

## 🎯 Deployment Steps (30 Minutes Total)

### Step 1: Deploy Backend to Vercel (10 min)

#### Option A: Using Vercel Dashboard (EASIEST)

1. **Go to Vercel:** https://vercel.com
2. **Sign up/Login** with GitHub
3. **Click "Add New..." → "Project"**
4. **Import Git Repository:**
   - Select: `Verifeed`
   - Root Directory: `backend`
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Click "Deploy"**

6. **Wait 2-3 minutes** for deployment

7. **Copy your URL:** Something like `https://verifeed-abc123.vercel.app`

#### Option B: Using Vercel CLI (FASTER)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to backend
cd C:\Users\ayomi\OneDrive\Documents\VS Code Projects\Verifeed\backend

# Deploy (will prompt for login first time)
vercel

# Follow prompts:
# - Set up and deploy? YES
# - Which scope? Your account
# - Link to existing project? NO
# - Project name? verifeed-backend (or your choice)
# - Directory? ./
# - Override settings? NO

# Copy the production URL from output
```

**Your backend URL will look like:**
```
https://verifeed-backend-xyz123.vercel.app
```

**⚠️ SAVE THIS URL - YOU'LL NEED IT!**

---

### Step 2: Set Environment Variables in Vercel (3 min)

#### Via Vercel Dashboard:
1. Go to your project on Vercel
2. Click **"Settings"** tab
3. Click **"Environment Variables"** in sidebar
4. Add these variables:

```
Name: ENABLE_AI
Value: true
Environment: Production, Preview, Development
```

```
Name: GROQ_API_KEY
Value: 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
Environment: Production, Preview, Development
```

```
Name: NODE_ENV
Value: production
Environment: Production
```

5. **Click "Save"**

6. **Redeploy:**
   - Go to "Deployments" tab
   - Click "..." on latest deployment
   - Click "Redeploy"
   - Wait 2 minutes

#### Via Vercel CLI:
```bash
vercel env add ENABLE_AI
# Enter: true
# Select: Production, Preview, Development

vercel env add GROQ_API_KEY
# Enter: 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
# Select: Production, Preview, Development

# Redeploy to apply env vars
vercel --prod
```

---

### Step 3: Test Deployed Backend (2 min)

**Test the health endpoint:**
```bash
# Replace YOUR-URL with your actual Vercel URL
curl https://YOUR-URL.vercel.app/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-06-28T..."
}
```

**Test verification endpoint:**
```powershell
$url = "https://YOUR-URL.vercel.app/api/verify"
$body = @{text="Water is H2O"} | ConvertTo-Json
Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
```

**Expected response:**
```json
{
  "score": 95,
  "explanation": "Water (H2O) is indeed a chemical compound...",
  "evidence": "Water's molecular formula H2O was determined...",
  "sources": ["IUPAC Chemical Nomenclature", ...]
}
```

**✅ If both work, backend is LIVE!**

---

### Step 4: Update Extension with Production URL (5 min)

1. **Open settings file:**
```
C:\Users\ayomi\OneDrive\Documents\VS Code Projects\Verifeed\extension\src\types\index.ts
```

2. **Find line ~48:**
```typescript
export const DEFAULT_SETTINGS: VerifeedSettings = {
  enabled: true,
  apiEndpoint: 'http://localhost:3000', // ← CHANGE THIS
  disabledSites: [],
  highlightOpacity: 30,
  autoVerify: false,
};
```

3. **Replace with YOUR Vercel URL:**
```typescript
export const DEFAULT_SETTINGS: VerifeedSettings = {
  enabled: true,
  apiEndpoint: 'https://YOUR-URL.vercel.app', // ← YOUR ACTUAL URL!
  disabledSites: [],
  highlightOpacity: 30,
  autoVerify: false,
};
```

4. **Update manifest.json permissions:**
```
C:\Users\ayomi\OneDrive\Documents\VS Code Projects\Verifeed\extension\manifest.json
```

Find `host_permissions` and update:
```json
"host_permissions": [
  "https://YOUR-URL.vercel.app/*"
],
```

5. **Rebuild extension:**
```bash
cd extension
npm run build
```

---

### Step 5: Test Extension with Production Backend (3 min)

1. **Reload extension** in Chrome
2. **Go to Wikipedia**
3. **Right-click → Settings**
4. **Verify API Endpoint** shows your Vercel URL
5. **Click "Test Connection"** → Should show ✅
6. **Select text on Wikipedia**
7. **Right-click → "Verify with Verifeed"**
8. **Should get real AI response from production!**

**✅ If it works, you're ready for Chrome Web Store!**

---

### Step 6: Create Chrome Web Store Package (5 min)

#### Create Clean Build:
```bash
cd C:\Users\ayomi\OneDrive\Documents\VS Code Projects\Verifeed\extension

# Make sure it's built
npm run build

# Create submission folder
New-Item -ItemType Directory -Force -Path ../chrome-store-submission
```

#### Copy Required Files:
```powershell
cd C:\Users\ayomi\OneDrive\Documents\VS Code Projects\Verifeed

# Copy manifest
Copy-Item extension/manifest.json chrome-store-submission/

# Copy dist folder
Copy-Item -Recurse extension/dist chrome-store-submission/

# Copy icons
Copy-Item -Recurse extension/icons chrome-store-submission/
```

#### Create ZIP:
```powershell
cd chrome-store-submission
Compress-Archive -Path * -DestinationPath ../verifeed-v1.0.0.zip -Force
cd ..
```

**You now have:** `verifeed-v1.0.0.zip` ready for Chrome Web Store!

---

### Step 7: Submit to Chrome Web Store (10 min)

1. **Go to:** https://chrome.google.com/webstore/devconsole

2. **Pay Developer Fee** (one-time $5 - if first submission)

3. **Click "New Item"**

4. **Upload:** `verifeed-v1.0.0.zip`

5. **Fill in Store Listing:**

**Product Details:**
```
Name: Verifeed
Summary: AI-powered real-time fact-checking for the web

Description:
Verifeed automatically detects and verifies factual claims on any webpage using AI.

FEATURES:
✓ Automatic claim detection and highlighting
✓ AI-powered verification with truthfulness scores
✓ Right-click to verify any selected text
✓ Detailed evidence with specific sources
✓ Works on all websites
✓ Privacy-focused (no tracking)

HOW IT WORKS:
1. Browse any webpage normally
2. Claims are highlighted in gray
3. Click to see AI verification
4. Get instant score, explanation, and sources

PERFECT FOR:
- News readers
- Researchers
- Students
- Fact-checkers
- Anyone who values truth

Privacy: We only analyze claims you click. No browsing history tracking.
AI-powered by Groq (Llama 3.3 70B).
```

**Category:** Productivity

**Language:** English

6. **Privacy:**
   - Single Purpose: Fact-checking claims on webpages
   - Permissions Justification:
     - `storage`: Save user settings
     - `tabs`: Check if enabled on current site
     - `activeTab`: Access page content to detect claims
     - `contextMenus`: Right-click verification option
   - Remote Code: NO
   - Data Collection: NO

7. **Upload Screenshots** (REQUIRED):
   - Take screenshots of extension in action
   - Size: 1280x800 or 640x400
   - Show: Highlighted claims, popup, settings page

8. **Privacy Policy:**
   - Host `PRIVACY.md` on GitHub Pages
   - URL: `https://github.com/CasualNOOB-DEV/Verifeed/blob/main/PRIVACY.md`

9. **Click "Submit for Review"**

**⏳ Review Time:** Usually 1-3 days

---

## 🎬 Quick Deployment Script

**Run everything at once:**

```powershell
# Set your Vercel URL here:
$VERCEL_URL = "https://YOUR-URL-HERE.vercel.app"

# Update extension config
cd C:\Users\ayomi\OneDrive\Documents\VS Code Projects\Verifeed\extension

# Update the API endpoint (do this manually in types/index.ts and manifest.json)
# Then build
npm run build

# Create submission package
cd ..
New-Item -ItemType Directory -Force -Path chrome-store-submission
Copy-Item extension/manifest.json chrome-store-submission/
Copy-Item -Recurse extension/dist chrome-store-submission/
Copy-Item -Recurse extension/icons chrome-store-submission/
cd chrome-store-submission
Compress-Archive -Path * -DestinationPath ../verifeed-v1.0.0.zip -Force
cd ..

Write-Host "✅ Package created: verifeed-v1.0.0.zip"
Write-Host "📦 Ready for Chrome Web Store!"
```

---

## 📊 Deployment Checklist

**Before Submitting:**

- [ ] Backend deployed to Vercel
- [ ] Environment variables set (ENABLE_AI, GROQ_API_KEY)
- [ ] Backend health check works
- [ ] Backend verify endpoint returns AI responses
- [ ] Extension updated with production URL
- [ ] Extension rebuilt with production config
- [ ] Tested extension with production backend
- [ ] Created submission ZIP
- [ ] ZIP is under 100MB
- [ ] All files included (manifest.json, dist/, icons/)

**For Chrome Web Store:**

- [ ] Developer account created ($5 paid)
- [ ] Screenshots prepared (3-5 images)
- [ ] Privacy policy URL ready
- [ ] Description written
- [ ] Permissions justified
- [ ] Categories selected

---

## 🚨 Troubleshooting

### Vercel Deployment Fails

**Error: Build failed**
```bash
# Check vercel.json exists
ls backend/vercel.json

# Verify structure is correct
cat backend/vercel.json
```

**Error: Functions not found**
```bash
# Make sure api/ folder exists
ls backend/api/

# Should contain: verify.ts, health.ts
```

### Extension Can't Connect to Production

**Error: CORS**
- Make sure Vercel functions have CORS headers
- Check `host_permissions` in manifest.json

**Error: 404**
- Verify endpoint paths: `/api/verify` and `/api/health`
- Check Vercel deployment logs

### Chrome Web Store Rejection

**Common reasons:**
- Missing privacy policy
- Unclear permissions justification
- Low-quality screenshots
- Vague description

**Fix:** Address the specific feedback and resubmit

---

## 📞 Support

**Vercel Issues:**
- Docs: https://vercel.com/docs
- Discord: https://vercel.com/discord

**Chrome Web Store:**
- Developer Program Policies: https://developer.chrome.com/docs/webstore/program-policies
- Support: https://support.google.com/chrome_webstore

---

## 🎉 After Approval

**What happens:**
1. Chrome reviews (1-3 days)
2. Email notification when approved/rejected
3. If approved → Extension goes LIVE!
4. Users can install from Chrome Web Store
5. You can track installs, reviews, ratings

**Share your extension:**
- Twitter/X
- Product Hunt
- Hacker News
- Reddit (r/chrome, r/technology)
- LinkedIn

---

## 🏁 Ready to Deploy?

**Start with Step 1:**
1. Deploy backend to Vercel
2. Copy your Vercel URL
3. Come back and tell me the URL
4. I'll help you update the extension config
5. We'll finish the deployment together!

**Let's do this! 🚀**

What's your Vercel URL? Or do you need help with any step?
