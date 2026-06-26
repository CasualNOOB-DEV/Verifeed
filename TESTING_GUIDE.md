# Verifeed Testing Guide

## Quick Start

### 1. Load Extension in Chrome

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the folder: `C:\Users\ayomi\OneDrive\Documents\VS Code Projects\Verifeed\extension`
5. The Verifeed icon should appear in your toolbar

---

### 2. Start Backend Server

Open a terminal and run:

```bash
cd backend
npm run dev
```

You should see:
```
✓ Server running on http://localhost:3000
✓ Health check: http://localhost:3000/health
```

---

## Test Scenarios

### Test 1: Basic Functionality

**Go to:** https://en.wikipedia.org/wiki/Earth

**Expected behavior:**
1. ✅ Page loads with gray highlights on factual claims
2. ✅ Claims like "Earth is the third planet from the Sun" are highlighted
3. ✅ Click a highlight → popup appears
4. ✅ Loading spinner shows
5. ✅ Rating badge appears (should be GREEN "TRUE" or "MOSTLY TRUE")
6. ✅ Explanation makes sense
7. ✅ Sources are listed
8. ✅ Highlight color changes from gray to green after verification

**What to check:**
- [ ] Highlights appear on page load
- [ ] Popup opens when clicking highlights
- [ ] Rating is a badge (not a score bar)
- [ ] Colors match ratings (green for TRUE)
- [ ] Backend logs show API call

---

### Test 2: Different Rating Types

Try these test pages to see different ratings:

#### TRUE - Should be Dark Green 🟢
**Wikipedia - Scientific Facts**
- URL: https://en.wikipedia.org/wiki/Water
- Claims: "Water is a chemical compound", "Boiling point is 100°C"
- Expected: TRUE rating, dark green

#### MOSTLY_TRUE - Should be Light Green 🟢
**News Articles with Context Needed**
- URL: https://www.bbc.com/news
- Claims: General statements that are mostly accurate but need context
- Expected: MOSTLY_TRUE, light green

#### MIXED - Should be Yellow 🟡
**Complex Claims**
- Look for claims that have both true and false elements
- Expected: MIXED rating, yellow

#### FALSE - Should be Red 🔴
**Conspiracy/Misinformation Sites** (don't actually visit, but claims like:)
- "5G causes COVID"
- "Earth is flat"
- Expected: FALSE rating, red

#### UNVERIFIABLE - Should be Gray ⚪
**Opinion Pieces**
- URL: Any opinion article
- Subjective statements or unprovable claims
- Expected: UNVERIFIABLE, gray

---

### Test 3: Settings Page

1. Right-click extension icon → **Options**
2. Settings page should open

**Test:**
- [ ] Toggle "Enable Verifeed" off → reload page → no highlights
- [ ] Toggle back on → reload page → highlights return
- [ ] Change API endpoint to garbage → Test Connection → should show error
- [ ] Change back to `http://localhost:3000` → Test Connection → should show ✓
- [ ] Add current site to blocklist → reload → no highlights
- [ ] Remove from blocklist → reload → highlights return
- [ ] Opacity slider works (highlights become more/less visible)

---

### Test 4: Popup Functionality

1. Click extension icon (toolbar)
2. Popup should show:
   - Current site status (Enabled/Disabled)
   - Quick disable/enable button
   - Settings button
   - Current version

**Test:**
- [ ] "Disable on this site" → page reloads → no highlights
- [ ] "Enable on this site" → page reloads → highlights return
- [ ] Settings button → opens settings page

---

### Test 5: Classification System

**Test that ratings make sense:**

Go to: https://en.wikipedia.org/wiki/Climate_change

Click on claims and verify:
- Scientific facts → TRUE (green)
- Temperature data → TRUE or MOSTLY_TRUE (green)
- Complex statements → MIXED (yellow)
- No FALSE ratings (Wikipedia is usually accurate)

**What to look for:**
- [ ] Ratings are NOT percentages (85%, etc.)
- [ ] Ratings are words (TRUE, MOSTLY_TRUE, etc.)
- [ ] Badge has colored background
- [ ] Confidence percentage shows below badge
- [ ] Explanation makes sense for the rating
- [ ] Highlight color matches badge color

---

### Test 6: Edge Cases

#### Test: Very Short Claims
- Example: "Water is wet"
- Expected: Should still analyze (not reject for being short)

#### Test: Very Long Claims
- Select a full paragraph
- Expected: Should handle gracefully or reject if >1000 chars

#### Test: Rapid Clicking
- Click multiple highlights quickly
- Expected: Popup switches to new claim each time

#### Test: Backend Offline
1. Stop the backend server (Ctrl+C in terminal)
2. Click a highlight
3. Expected: Shows fallback "UNVERIFIABLE" with message about backend unavailable

#### Test: No Context
- Visit a plain text website
- Expected: Still works, just without rich context

---

## Verification Checklist

### Visual Checks
- [ ] Highlights are visible but not obnoxious
- [ ] Rating badge has clear colors
- [ ] Popup is positioned correctly (not off-screen)
- [ ] Loading spinner animates smoothly
- [ ] Close button (×) works
- [ ] Clicking outside popup closes it

### Rating Accuracy
- [ ] Scientific facts get TRUE
- [ ] Nuanced claims get MOSTLY_TRUE or MIXED
- [ ] No arbitrary percentages shown as ratings
- [ ] Confidence percentage makes sense (usually 60-95%)
- [ ] Explanations justify the rating

### Performance
- [ ] Page load isn't noticeably slower
- [ ] Highlights appear within 1-2 seconds
- [ ] API response within 3-5 seconds
- [ ] No infinite loops or browser freezing
- [ ] Backend cache works (same claim = instant response)

### Error Handling
- [ ] Backend offline → graceful fallback
- [ ] Invalid API endpoint → shows error in settings
- [ ] Network timeout → shows error message
- [ ] Malformed response → fallback to UNVERIFIABLE

---

## Known Issues to Ignore

These are **non-blocking** for v1.0:

- Claim count in popup shows "-" (not implemented)
- No keyboard shortcuts
- No claim history
- Popup may go off-screen on small displays
- No mobile support

---

## Console Debugging

Open DevTools (F12) → Console tab

**Look for:**
```
[Verifeed] Initializing Verifeed content script...
[Verifeed] Content script initialized
[Verifeed] Found 23 potential claims
[Verifeed] Claim detected: "Earth is the third planet..."
[Verification Popup] Fetching verification for: Earth is the third...
[Verification Popup] Received result: {rating: "TRUE", confidence: 95, ...}
```

**Red flags (should NOT see):**
```
❌ Uncaught TypeError...
❌ Failed to fetch...
❌ Maximum call stack size exceeded (infinite loop)
```

---

## Backend Testing

In a separate terminal, test the API directly:

### Health Check
```bash
curl http://localhost:3000/health
```

Expected:
```json
{"status":"healthy","timestamp":"2026-06-25T..."}
```

### Verify Endpoint
```bash
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"The Earth is round\",\"context\":{\"url\":\"https://example.com\",\"title\":\"Test\"}}"
```

Expected:
```json
{
  "rating": "TRUE",
  "confidence": 95,
  "bias": "center",
  "biasConfidence": 90,
  "explanation": "The Earth is an oblate spheroid...",
  "sources": ["NASA", "Scientific consensus", ...]
}
```

---

## Quick Test Script

Want to test everything at once? Run this:

1. Load extension in Chrome
2. Start backend: `cd backend && npm run dev`
3. Visit: https://en.wikipedia.org/wiki/Earth
4. Click 3-5 different highlights
5. Verify all show ratings (not scores)
6. Check settings page works
7. Disable extension, verify highlights disappear
8. Re-enable, verify highlights return

**Time:** ~5 minutes

---

## What Success Looks Like

✅ Wikipedia page loads with gray highlights  
✅ Clicking highlights shows popup with rating badge  
✅ Ratings are words (TRUE, MOSTLY_TRUE, etc.), NOT numbers  
✅ Colors match ratings (green = true, red = false)  
✅ Explanations make sense  
✅ Settings page works  
✅ No console errors  
✅ Backend responds in <5 seconds  

**If all checks pass → READY TO DEPLOY! 🚀**

---

## Troubleshooting

### Issue: No highlights appear
**Fix:** 
- Check console for errors
- Verify backend is running (`npm run dev`)
- Check if site is in blocklist (settings)
- Try reloading the page

### Issue: Popup shows score instead of rating
**Fix:**
- Rebuild extension: `cd extension && npm run build`
- Reload extension in chrome://extensions

### Issue: Backend errors
**Fix:**
- Check `GROQ_API_KEY` in `.env`
- Verify Groq API is working
- Check backend console for errors

### Issue: Ratings seem wrong
**Fix:**
- This is AI - some variance is expected
- Check explanation to understand AI reasoning
- Report specific bad examples for prompt tuning

---

Need help with any test? Let me know what you see!
