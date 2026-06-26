# 🧪 How to Test Verifeed

## ✅ The Fix

The `file://` URL security error is now fixed! The test page is served through the backend.

---

## 🚀 Step-by-Step Testing

### 1. Make Sure Backend is Running

If it's not already running:

```bash
cd backend
npm run dev
```

Wait for:
```
🚀 Server running on http://localhost:3000
```

### 2. Open the Test Page

**IMPORTANT:** Don't open the HTML file directly. Use this URL instead:

```
http://localhost:3000/test-page.html
```

Copy and paste that into your Chrome address bar.

### 3. Open DevTools

Press **F12** → Click **Console** tab

### 4. Wait 2-3 Seconds

You should see:
```
[Verifeed] Content script initialized successfully
[Verifeed] Found 8 claims on page
[Test Page] ✅ Verifeed is working!
```

### 5. Look for Yellow Highlights

These sentences should be highlighted in **yellow**:
- "Studies show that global temperatures have risen by 1.1 degrees Celsius..."
- "Research indicates that renewable energy capacity has increased by 45%..."
- "Data from the International Energy Agency shows that carbon emissions decreased by 5.8%..."

### 6. Click a Highlight

**Click directly on the yellow text** (NOT right-click!)

You should see:
1. A popup appears near the clicked text
2. Loading spinner (briefly)
3. Then the verification results:
   - **Score bar** (green/yellow/red)
   - **Bias indicator** (left/center/right)
   - **Explanation** text
   - **Sources** list

### 7. Click Another Highlight

This time it should be **instant** (cached response)!

---

## ✅ Success Looks Like

### Console Messages:
```
[Verifeed] Content script initialized successfully
[Verifeed] Found 8 claims on page
[Test Page] Found 8 Verifeed highlights
[Test Page] ✅ Verifeed is working!
```

When you click a highlight:
```
[API Service] Sending request to verify claim
[Verification Popup] Displaying results
```

### Visual:
- 8 sentences highlighted in yellow
- Clicking shows beautiful popup with animated score bar
- Second click is instant (cached)

---

## 🌐 Test on Real Websites

After the test page works, try these:

### Wikipedia (Great for testing!)
```
https://en.wikipedia.org/wiki/Climate_change
```
Many factual claims with statistics.

### Hacker News
```
https://news.ycombinator.com
```
Comments often have claims worth checking.

### Any News Site
- CNN.com
- BBC.com
- NYTimes.com

---

## 🐛 If Something Goes Wrong

### "Cannot connect to API"
Backend isn't running. Start it:
```bash
cd backend
npm run dev
```

### No highlights appear
1. Reload extension in `chrome://extensions/`
2. Refresh the test page
3. Check console for `[Verifeed]` messages

### Popup doesn't show
1. Check backend console for errors
2. Make sure you're clicking the yellow highlight (not right-clicking)
3. Check browser console for errors

### Wrong URL in popup
If you see `file://` URLs, you opened the HTML file directly.
Use `http://localhost:3000/test-page.html` instead.

---

## 🎯 Quick Checklist

- ✅ Backend running on port 3000
- ✅ Extension loaded and enabled in Chrome
- ✅ Visiting `http://localhost:3000/test-page.html` (NOT file://)
- ✅ Console open (F12)
- ✅ Yellow highlights visible
- ✅ Clicking highlights shows popup

---

## 💡 Pro Tips

1. **Use http://localhost URLs** - Never open HTML files directly
2. **Check console first** - Look for `[Verifeed]` messages
3. **Wait 2 seconds** - Give the extension time to scan
4. **Click yellow text** - Not right-click, just regular click
5. **Second clicks are instant** - Caching works!

---

## 🎉 You're Done When...

You can:
1. Open `http://localhost:3000/test-page.html`
2. See yellow highlights automatically
3. Click a highlight
4. See a popup with verification results
5. Click another highlight and it's instant

**That's it! The extension is fully working!**
