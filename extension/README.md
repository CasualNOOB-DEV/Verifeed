# Verifeed Chrome Extension

Real-time fact-checking extension for Chrome.

## Phase 1 - Standalone Extension with Mock Data

This phase includes:
- Claim detection using heuristics
- Visual highlighting of claims
- Click-to-verify popup with mock data
- No backend required

## Setup & Installation

### 1. Build the Extension

```bash
cd extension
npm install
npm run build
```

### 2. Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder (the one containing `manifest.json`)
5. The Verifeed extension should now appear in your extensions list

### 3. Test the Extension

1. Visit any news website or blog (try news.ycombinator.com, a Wikipedia article, or any blog)
2. The extension will automatically scan the page
3. Look for yellow-highlighted text (these are detected claims)
4. Click any highlighted claim to see the verification popup
5. The popup will show mock verification data including:
   - Truthfulness score
   - Bias detection
   - Explanation
   - Sources

### Claim Detection Heuristics

The extension detects sentences that:
- Contain statistics or numbers (e.g., "50%", "1 million")
- Use factual language (is, are, was, were)
- Cite authorities (studies, research, experts)
- Make absolute statements (always, never, all)
- Make comparisons (more, less, better, worse)

A sentence needs at least 2 of these indicators to be highlighted.

## Project Structure

```
extension/
├── src/
│   ├── content/
│   │   ├── content.ts          # Main content script
│   │   ├── claim-detector.ts   # Claim detection logic
│   │   ├── highlighter.ts      # DOM manipulation
│   │   └── styles.css          # Highlight styles
│   ├── components/
│   │   └── verification-popup.ts  # Verification UI
│   ├── background/
│   │   └── background.ts       # Service worker
│   └── popup/
│       ├── popup.html          # Extension popup
│       ├── popup.css
│       └── popup.ts
├── dist/                       # Built files (generated)
├── icons/                      # Extension icons
├── manifest.json              # Extension manifest
└── package.json
```

## Development

### Watch Mode

For development with auto-rebuild:

```bash
npm run watch
```

Then reload the extension in Chrome after changes.

### Rebuilding

```bash
npm run build
```

**Note:** The extension uses **esbuild** to bundle TypeScript files into single JavaScript files that Chrome can execute. This is why you don't see import statements in the built files.

## Known Limitations (Phase 1)

- All verification data is mocked
- No real AI analysis
- No backend connection
- Detection heuristics are basic
- May not work on all websites due to DOM complexity

## Next Steps

**Phase 2** will add:
- Backend API server
- Real data flow
- Better mock intelligence

**Phase 3** will add:
- Real AI integration
- Production-ready verification
- Performance optimizations
