# Verifeed - Quick Start Guide

**Get up and running in 5 minutes**

## Step 1: Install Dependencies

```bash
# Extension
cd extension
npm install

# Backend
cd ../backend
npm install
```

## Step 2: Build Extension

```bash
cd extension
npm run build
```

## Step 3: Load Extension in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. Toggle **Developer mode** ON (top right)
4. Click **Load unpacked**
5. Select the `extension` folder
6. ✅ Extension installed!

## Step 4: Start Backend

```bash
cd backend
npm run dev
```

You should see:
```
╔═══════════════════════════════════════╗
║        Verifeed API Server            ║
╚═══════════════════════════════════════╝

🚀 Server running on http://localhost:3000
```

## Step 5: Test It!

1. Visit any news website (try [Wikipedia](https://en.wikipedia.org) or [HackerNews](https://news.ycombinator.com))
2. Wait 1-2 seconds
3. Look for **yellow highlights** on text
4. **Click any highlight** to see verification

## Step 6 (Optional): Add AI

For real AI fact-checking:

1. Get an API key:
   - **OpenAI**: https://platform.openai.com/api-keys
   - **Anthropic**: https://console.anthropic.com/

2. Create `backend/.env`:
   ```bash
   OPENAI_API_KEY=sk-your-key-here
   # OR
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

3. Restart backend:
   ```bash
   cd backend
   npm run dev
   ```

## Troubleshooting

**No highlights?**
- Refresh the page
- Check browser console (F12) for errors
- Make sure extension is enabled

**Can't connect to API?**
- Make sure backend is running
- Check `http://localhost:3000/health` in browser
- Look for errors in backend terminal

**Extension not loading?**
- Make sure you ran `npm run build` in extension folder
- Check for build errors
- Reload extension in chrome://extensions/

## Next Steps

- Read the main [README.md](./README.md) for full documentation
- Customize claim detection in `extension/src/content/claim-detector.ts`
- Modify the AI prompt in `backend/src/services/llm/verifier.ts`
- Style the popup in `extension/src/content/styles.css`

## Test Commands

```bash
# Test backend health
curl http://localhost:3000/health

# Test verification API
curl -X POST http://localhost:3000/verify \
  -H "Content-Type: application/json" \
  -d '{"text": "Studies show that 90% of people believe statistics without checking sources."}'

# Rebuild extension after changes
cd extension && npm run build

# Watch extension for auto-rebuild
cd extension && npm run watch
```

## You're Done!

You now have a working fact-checking extension. Visit a news site and start verifying claims!
