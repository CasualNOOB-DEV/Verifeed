# Verifeed Troubleshooting Guide

## ✅ Quick Checklist

Before diving into specific issues, verify these basics:

1. ✅ Backend server is running on http://localhost:3000
2. ✅ Extension is built (`npm run build` in extension folder)
3. ✅ Extension is loaded in Chrome at chrome://extensions/
4. ✅ Extension is enabled (toggle switch is ON)
5. ✅ You've refreshed the test page after loading the extension

---

## 🔧 Problem 1: Backend Server Issues

### Issue: Wrong website appears at localhost:3000

**Cause:** Another server is still running on port 3000

**Solution:**
```bash
# Find and kill processes on port 3000
netstat -ano | findstr :3000

# Kill each process (replace XXXX with actual PID)
taskkill /F /PID XXXX

# Start Verifeed backend
cd backend
npm run dev
```

**Verify it's working:**
Visit http://localhost:3000 in your browser. You should see:
```json
{
  "name": "Verifeed API",
  "version": "0.1.0",
  "phase": 2,
  "description": "Real-time fact-checking backend"
}
```

---

## 🔧 Problem 2: Extension Not Highlighting

### Step 1: Check Extension is Loaded

1. Open Chrome and go to `chrome://extensions/`
2. Find **Verifeed** in the list
3. Make sure the toggle is **ON** (blue)
4. Click **Details** and check:
   - "Site access" should be "On all sites"
   - No errors shown

**If you see errors**, click **Errors** button to see details.

### Step 2: Reload Extension

After any code changes:
1. Go to `chrome://extensions/`
2. Click the **reload icon** (circular arrow) on the Verifeed card
3. Refresh your test page

### Step 3: Check Console Logs

1. Open your test page (see test-page.html)
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Look for messages starting with `[Verifeed]`

**What you should see:**
```
[Verifeed] Initializing Verifeed content script...
[Verifeed] Content script initialized successfully
[Verifeed] Page URL: file:///...
[Verifeed] Document ready state: complete
[Verifeed] DOM already ready, starting immediately
[Verifeed] Starting page scan in 500ms...
[Verifeed] Beginning claim detection...
[Verifeed] Found X claims on page
```

**If you see nothing:** Extension content script isn't loading.

### Step 4: Check Extension Permissions

The extension needs permission to run on all sites.

1. Go to `chrome://extensions/`
2. Click **Details** on Verifeed
3. Scroll to "Site access"
4. Select **"On all sites"**

### Step 5: Test with Test Page

1. Open `test-page.html` in Chrome:
   ```
   file:///C:/Users/ayomi/OneDrive/Documents/VS Code Projects/Verifeed/test-page.html
   ```

2. Wait 3 seconds

3. You should see:
   - Yellow highlights on sentences with statistics
   - Console message showing number of highlights found

**If still no highlights**, continue to next steps.

### Step 6: Rebuild Extension

```bash
cd extension
npm run build
```

Then:
1. Go to `chrome://extensions/`
2. Click reload icon on Verifeed
3. Refresh your test page

### Step 7: Check for Build Errors

```bash
cd extension
npm run build
```

Look for TypeScript errors. Should end with:
```
Build preparation complete. Run TypeScript compiler next.
```

**If you see errors**, they need to be fixed before the extension will work.

---

## 🔧 Problem 3: Highlights Appear but Clicking Does Nothing

### Check Console for API Errors

1. Click a highlight
2. Check console (F12)
3. Look for error messages

**Common errors:**

**"Cannot connect to Verifeed API"**
- Backend isn't running
- Start it with: `cd backend && npm run dev`

**CORS errors**
- Backend CORS should allow all origins in development
- Check `backend/src/server.ts` has `origin: '*'`

**Network errors**
- Check backend console for incoming requests
- Should see: `[POST] /verify`

---

## 🔧 Problem 4: Extension Only Works on Some Sites

### Chrome Extension Restrictions

Extensions **CANNOT** run on:
- `chrome://` pages (like chrome://extensions/)
- `chrome-extension://` pages
- Chrome Web Store pages
- `about:` pages

Extensions **WILL** work on:
- Regular websites (http/https)
- Local HTML files (`file://`)
- Most web apps

### Test on These Sites

Known to work well:
- http://localhost:3000 (your test page)
- file:/// (test-page.html)
- https://en.wikipedia.org
- https://news.ycombinator.com
- Any news website

---

## 🔧 Problem 5: No Claims Detected

### Understanding Claim Detection

The extension looks for sentences with **at least 2** of these indicators:

1. **Statistics**: Contains numbers (50%, 2 million, etc.)
2. **Factual verbs**: is, are, was, were, has, have
3. **Authorities**: studies, research, experts, scientists
4. **Absolutes**: always, never, all, none, everyone
5. **Comparatives**: more, less, better, worse

### Try the Test Page

Open `test-page.html` - it has sentences specifically designed to trigger detection:

**Example sentences that SHOULD be highlighted:**
- "Studies show that global temperatures have risen by 1.1 degrees Celsius"
- "Research indicates that renewable energy capacity has increased by 45%"
- "Data from the International Energy Agency shows that carbon emissions decreased by 5.8%"

**If these aren't highlighted**, there's an issue with the extension.

### Adjust Detection Sensitivity

Edit `extension/src/content/claim-detector.ts`:

```typescript
// Lower the threshold to catch more claims
if (reasons.length >= 1 && confidence >= 20) {  // Changed from 2 and 40
```

Then rebuild: `cd extension && npm run build`

---

## 🔧 Problem 6: Right-Click Menu Doesn't Appear

**This is not a bug!** The extension doesn't use right-click menus.

### How Verifeed Actually Works:

1. **Automatic highlighting**: Claims are highlighted in yellow automatically
2. **Direct click**: Click directly on the yellow highlight
3. **Popup appears**: Verification popup shows near the highlight

**You do NOT:**
- Right-click on text
- Use context menus
- Need to select text first

**You DO:**
- Wait for automatic highlighting (1-2 seconds)
- Click directly on yellow highlights
- Read the popup that appears

---

## 🔧 Problem 7: Backend API Errors

### Check Backend is Running

Visit http://localhost:3000/health

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-...",
  "uptime": 123.456
}
```

### Test Verification Endpoint

```bash
curl -X POST http://localhost:3000/verify \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Studies show that 90% of statistics need sources.\"}"
```

Should return JSON with score, bias, explanation, sources.

### Check Backend Logs

Backend console should show:
```
[Verification] Analyzing claim: "..."
[LLM Verifier] Using openai/anthropic/mock for verification
```

---

## 🔧 Problem 8: AI Not Working

### Without API Key

If you don't have OPENAI_API_KEY or ANTHROPIC_API_KEY in `.env`:
- Extension still works
- Uses intelligent mock responses
- This is expected and fine for testing

### With API Key

Check `backend/.env`:
```bash
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...
```

Backend console should show:
```
[LLM Verifier] Using OpenAI for verification
# OR
[LLM Verifier] Using Anthropic for verification
```

If it says "mock mode", API key isn't configured.

---

## 📝 Complete Test Sequence

Follow these steps exactly:

### 1. Start Backend
```bash
cd backend
npm run dev
```

Wait for:
```
🚀 Server running on http://localhost:3000
```

### 2. Test Backend
Open browser: http://localhost:3000

Should see Verifeed API info (NOT La Taqueria).

### 3. Build Extension
```bash
cd extension
npm run build
```

Should complete without errors.

### 4. Load Extension
1. Chrome → `chrome://extensions/`
2. Developer mode ON
3. Load unpacked → select `extension` folder
4. Extension appears in list

### 5. Test Extension
1. Open `test-page.html` in Chrome
2. Open DevTools (F12) → Console tab
3. Wait 3 seconds
4. Look for `[Verifeed]` messages
5. Look for yellow highlights
6. Click a highlight
7. Popup should appear

---

## 🆘 Still Not Working?

### Check Everything:

```bash
# 1. Check backend is running
curl http://localhost:3000/health

# 2. Check extension is built
ls extension/dist/content/content.js

# 3. Rebuild extension
cd extension
npm run build

# 4. Check for errors in build output
```

### Look at Console Logs:

1. Backend console (where you ran `npm run dev`)
2. Browser console (F12 on test page)
3. Extension console:
   - Go to `chrome://extensions/`
   - Click "service worker" link under Verifeed
   - Check for errors

### Common Solutions:

1. **Restart everything:**
   - Kill backend (Ctrl+C)
   - Restart backend (`npm run dev`)
   - Reload extension in Chrome
   - Refresh test page

2. **Clean rebuild:**
   ```bash
   cd extension
   npm run clean
   npm run build
   ```

3. **Check file permissions:**
   - Make sure files aren't locked
   - Close other editors/processes

4. **Try a different browser tab:**
   - Open new tab
   - Try test page again
   - Some tabs may have cached old extension

---

## ✅ Working Correctly Looks Like:

### Backend Console:
```
🚀 Server running on http://localhost:3000
[2024-...] GET /health
[2024-...] POST /verify
[Verification] Analyzing claim: "..."
[Cache] Stored result for: "..."
```

### Browser Console:
```
[Verifeed] Content script initialized successfully
[Verifeed] Found 8 claims on page
[Test Page] Found 8 Verifeed highlights
[Test Page] ✅ Verifeed is working!
```

### Visual Result:
- Yellow highlights on claim text
- Clicking highlight shows popup with:
  - Loading spinner (briefly)
  - Score bar (animated)
  - Bias indicator
  - Explanation text
  - Source list

---

## 📧 Getting More Help

If still stuck:

1. Check all console messages (backend + browser)
2. Look for error messages
3. Verify files exist:
   - `extension/dist/content/content.js`
   - `backend/dist/server.js`
4. Check the main README.md
5. Review the code comments

The extension IS working in development - these steps will help you debug your specific issue!
