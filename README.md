# Verifeed 🔍

**AI-Powered Real-Time Fact-Checking Chrome Extension**

Verifeed automatically detects and verifies factual claims on any webpage using AI. Get instant truthfulness scores, explanations, and sources for claims you encounter while browsing.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/CasualNOOB-DEV/Verifeed)

---

## ✨ Features

### 🎯 Automatic Claim Detection
- Scans webpages for factual claims
- Highlights claims in gray (before verification)
- Detects statistics, measurements, scientific facts, and more
- Filters out opinions, speculation, and subjective statements

### 🤖 AI-Powered Verification
- Uses Groq AI (Llama 3.3 70B) for fact-checking
- Scores claims 0-100 based on truthfulness
- Provides clear explanations with sources
- Bias detection (left/center/right)

### 🖱️ Manual Verification
- Right-click any text → "Verify with Verifeed"
- Works on text that wasn't auto-detected
- Same verification interface as auto-detected claims

### 🎨 Color-Coded Results
- 🟢 **90-100**: Verified True - Matches established facts
- 🟢 **75-89**: Mostly Accurate - Minor issues or lacks context
- 🟡 **50-74**: Mixed - Contains both accurate and inaccurate elements
- 🟠 **25-49**: Mostly False - Contradicts established facts
- 🔴 **0-24**: Demonstrably False - No credible evidence

### ⚙️ Customizable Settings
- Global enable/disable toggle
- Per-site blocklist
- API endpoint configuration
- Highlight opacity adjustment

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Chrome browser
- Groq API key (free tier available at [console.groq.com](https://console.groq.com))

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/CasualNOOB-DEV/Verifeed.git
cd Verifeed
```

#### 2. Setup Backend
```bash
cd backend
npm install

# Create .env file
echo "GROQ_API_KEY=your_api_key_here" > .env

# Start the server
npm run dev
```

Server runs at: http://localhost:3000

#### 3. Setup Extension
```bash
cd ../extension
npm install
npm run build
```

#### 4. Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the `extension` folder
5. Extension icon should appear in toolbar ✓

---

## 📖 Usage

### Automatic Detection
1. Browse any webpage (e.g., Wikipedia, news sites)
2. Wait 1-2 seconds for claims to be highlighted in gray
3. Click any highlight to verify
4. See score, explanation, and sources in popup

### Manual Verification
1. Select any text on a webpage
2. Right-click → "Verify with Verifeed"
3. Popup shows verification results

### Settings
- Right-click extension icon → Options
- Configure API endpoint, blocklist, and display settings

---

## 🏗️ Project Structure

```
Verifeed/
├── extension/              # Chrome extension
│   ├── src/
│   │   ├── background/    # Service worker
│   │   ├── content/       # Content scripts (detection & highlighting)
│   │   ├── components/    # Verification popup
│   │   ├── popup/         # Extension popup UI
│   │   ├── options/       # Settings page
│   │   └── services/      # API service
│   ├── icons/             # Extension icons
│   └── manifest.json      # Extension manifest
│
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── services/      # Verification logic
│   │   └── types/         # TypeScript types
│   ├── api/               # Vercel serverless functions
│   └── vercel.json        # Vercel deployment config
│
└── docs/                  # Documentation
    ├── QUICKSTART.md
    ├── TESTING_GUIDE.md
    ├── LAUNCH_CHECKLIST.md
    └── NEW_FEATURES.md
```

---

## 🧪 Testing

### Test the Backend
```bash
# Health check
curl http://localhost:3000/health

# Verify a claim
curl -X POST http://localhost:3000/verify \
  -H "Content-Type: application/json" \
  -d '{"text":"The Earth is the third planet from the Sun."}'
```

### Test the Extension
1. Go to: https://en.wikipedia.org/wiki/Water
2. See gray highlights on factual claims
3. Click a highlight → verify it shows score
4. Select text → right-click → "Verify with Verifeed"

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed testing instructions.

---

## 🚢 Deployment

### Deploy Backend to Vercel
```bash
cd backend
vercel

# Set environment variable
vercel env add GROQ_API_KEY
```

### Package Extension for Chrome Web Store
1. Update `extension/src/types/index.ts` with production API URL
2. Build: `npm run build`
3. Zip the extension folder
4. Submit to Chrome Web Store

See [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) for complete deployment guide.

---

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev          # Start dev server
npm run build        # Build for production
npm run vercel-dev   # Test Vercel functions locally
```

### Extension Development
```bash
cd extension
npm run build        # Build extension
npm run watch        # Watch mode (rebuilds on changes)
```

### Tech Stack

**Extension:**
- TypeScript
- Chrome Extension Manifest V3
- esbuild (bundler)
- Chrome APIs (tabs, storage, contextMenus)

**Backend:**
- Node.js + Express
- TypeScript
- Groq SDK (AI)
- Vercel (serverless deployment)

**AI Model:**
- Llama 3.3 70B (via Groq)
- Free tier: ~14,000 requests/day

---

## 📊 Claim Detection

Verifeed detects claims using pattern matching and heuristics:

**Detected patterns:**
- Statistics: "50%", "10 million users"
- Measurements: "100 meters", "50 kg", "100°C"
- Scientific terms: "DNA", "molecule", "species"
- Authority citations: "according to NASA", "studies show"
- Definitive statements: "is", "was", "proven", "discovered"
- Comparatives: "higher than", "faster than", "most"

**Filtered out:**
- Personal opinions: "I think", "I believe"
- Speculation: "maybe", "perhaps", "might"
- Subjective judgments: "beautiful", "best", "amazing"
- Questions
- Future predictions

---

## 🔐 Privacy

- **No tracking**: Verifeed doesn't track your browsing history
- **No data collection**: Only verified claims are sent to the API
- **Local processing**: Claim detection happens in your browser
- **Open source**: All code is available for inspection

See [PRIVACY.md](PRIVACY.md) for full privacy policy.

---

## 🤝 Contributing

Contributions are welcome! Here's how to help:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Keep commits atomic and well-described

---

## 📝 Documentation

- [Quick Start](QUICKSTART.md) - Get up and running in 5 minutes
- [Testing Guide](TESTING_GUIDE.md) - How to test the extension
- [Launch Checklist](LAUNCH_CHECKLIST.md) - Deploy to production
- [New Features](NEW_FEATURES.md) - Latest feature documentation
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and fixes

---

## 🐛 Known Issues

- Context menu appears even when extension is disabled on a site (Chrome MV3 limitation)
- Claim detection is English-only
- No support for claims in images/videos (yet)
- Backend requires GROQ_API_KEY to be set

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- [Groq](https://groq.com) for fast AI inference
- [Llama 3.3](https://llama.meta.com) by Meta AI
- Inspired by fact-checking sites like PolitiFact and Snopes

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/CasualNOOB-DEV/Verifeed/issues)
- **Discussions**: [GitHub Discussions](https://github.com/CasualNOOB-DEV/Verifeed/discussions)

---

## 🗺️ Roadmap

**v1.1** (Coming Soon)
- [ ] Firefox support
- [ ] Edge support
- [ ] Keyboard shortcuts
- [ ] Claim history page

**v2.0** (Future)
- [ ] Multiple AI providers
- [ ] Offline mode
- [ ] Multi-language support
- [ ] Browser extension for mobile

---

**Built with ❤️ by [CasualNOOB-DEV](https://github.com/CasualNOOB-DEV)**

⭐ Star this repo if you find it useful!
