# Verifeed Launch Checklist

## Pre-Launch Steps

### 1. Deploy Backend to Vercel (5 minutes)

**Option A: Using Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd backend
vercel

# Follow prompts, link to your Vercel account
# Copy the deployment URL (e.g., https://verifeed-api.vercel.app)
```

**Option B: Using Vercel Dashboard**
1. Go to https://vercel.com
2. Sign up/login with GitHub
3. Click "Add New..." → "Project"
4. Click "Import" and select the `backend` folder
5. Deploy!

**Set Environment Variable:**
1. In Vercel dashboard, go to Settings → Environment Variables
2. Add: `GROQ_API_KEY` = `YOUR_GROQ_API_KEY_HERE`
3. Redeploy if needed

**Test your deployment:**
```bash
curl https://YOUR-PROJECT.vercel.app/health
# Should return: {"status":"healthy",...}
```

---

### 2. Update Extension with Production URL (2 minutes)

1. Open `extension/src/types/index.ts`
2. Change line 48:
   ```typescript
   apiEndpoint: 'https://YOUR-PROJECT.vercel.app',
   ```
3. Rebuild:
   ```bash
   cd extension
   npm run build
   ```

---

### 3. Prepare Chrome Web Store Assets (10 minutes)

**Required Screenshots** (capture these):
- 1280x800 or 640x400
- At least 1 screenshot showing:
  - Extension highlighting claims on a website
  - Popup showing verification result
  - Settings page

**Promotional Images** (optional but recommended):
- Small: 440x280
- Large: 920x680  
- Marquee: 1400x560

**Description** (use this):
```
Verifeed - AI-Powered Fact Checking

Instantly verify factual claims on any website with AI-powered analysis.

FEATURES:
• Real-time claim detection on any webpage
• AI verification using Llama 3.3 70B
• Color-coded truthfulness scores (red = false, green = true)
• Bias detection (left/center/right)
• Source citations
• Context-aware analysis
• Per-site enable/disable
• Privacy-focused (no tracking)

HOW IT WORKS:
1. Browse any website normally
2. Factual claims are automatically highlighted
3. Click any highlight to see AI verification
4. Get instant truthfulness score, explanation, and sources

PRIVACY:
- Only verifies claims you click
- No browsing history tracking
- No personal data collection
- Open source

Perfect for:
- News readers
- Researchers
- Fact-checkers
- Anyone who values truth
```

---

### 4. Chrome Web Store Submission (15 minutes)

1. Go to: https://chrome.google.com/webstore/devconsole
2. Pay one-time $5 developer fee (if first time)
3. Click "New Item"
4. Upload: `extension.zip` (create by zipping the `extension/dist` folder + `manifest.json` + `icons` folder)
5. Fill in:
   - **Item Name**: Verifeed
   - **Summary**: AI-powered fact-checking for the web
   - **Description**: (paste from above)
   - **Category**: Productivity
   - **Language**: English
   - **Icon**: Upload `extension/icons/icon128.png`
   - **Screenshots**: Upload your screenshots
   - **Privacy Policy URL**: Upload PRIVACY.md to GitHub Pages or paste content
   - **Permissions Justification**:
     - `storage`: Save user settings and preferences
     - `tabs`: Check if extension should run on current tab
     - `activeTab`: Access page content to detect claims
6. Submit for review!

**Review time:** Usually 1-3 days for first submission

---

### 5. Create ZIP for Chrome Web Store

```bash
cd extension
# Make sure it's built
npm run build

# Create a submission folder
mkdir -p ../verifeed-submission
cp manifest.json ../verifeed-submission/
cp -r dist ../verifeed-submission/
cp -r icons ../verifeed-submission/

# Zip it
cd ../verifeed-submission
zip -r ../verifeed-extension-v1.0.0.zip .
```

Or manually:
1. Copy `manifest.json`, `dist/`, and `icons/` to a new folder
2. Right-click folder → "Compress to ZIP"

---

## Post-Launch

### Monitor Usage
- Check Vercel Analytics dashboard
- Watch for error rates
- Monitor Groq API usage

### Update Settings Default
After Vercel deploy, update all instances:
1. Extension default in `types/index.ts`
2. Settings page default value
3. README documentation

### Share!
- Twitter/X
- Product Hunt
- Hacker News
- Reddit (r/chrome, r/programming, r/technology)

---

## Troubleshooting

**Extension won't load:**
- Check `chrome://extensions` for errors
- Make sure all files are in `dist/` folder
- Verify manifest.json is valid

**API not working:**
- Check Vercel deployment logs
- Verify GROQ_API_KEY is set
- Test with: `curl https://YOUR-URL.vercel.app/health`

**Claims not highlighting:**
- Open DevTools Console, check for errors
- Verify content script is running
- Check if site is in disabled list

**Rate limit errors:**
- Default: 30 requests/minute per IP
- Increase in `api/verify.ts` if needed
- Consider upgrading to paid tier for higher limits

---

## Useful Links

- Chrome Developer Dashboard: https://chrome.google.com/webstore/devconsole
- Vercel Dashboard: https://vercel.com/dashboard
- Groq Console: https://console.groq.com
- Extension testing: Load unpacked from `chrome://extensions`

---

## Quick Test Before Submission

1. Load extension in Chrome (unpacked)
2. Go to https://en.wikipedia.org/wiki/Earth
3. See claims highlighted in gray
4. Click one, should show popup with AI verification
5. Open Settings, test API connection
6. Try disabling on current site
7. Reload page, highlights should be gone
8. Re-enable, reload, highlights return

If all works → READY TO SUBMIT! 🚀
