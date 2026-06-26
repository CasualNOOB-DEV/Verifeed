# Verifeed Backend API

Express.js backend for claim verification.

## Phase 2 - Intelligent Mock Responses

The backend provides:
- REST API for claim verification
- Intelligent mock responses based on text analysis
- Real data flow and error handling
- Foundation for Phase 3 AI integration

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Create a `.env` file (or copy `.env.example`):

```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=3000
NODE_ENV=development
```

### 3. Build

```bash
npm run build
```

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### GET /

Returns API information and available endpoints.

```bash
curl http://localhost:3000/
```

### GET /health

Health check endpoint.

```bash
curl http://localhost:3000/health
```

### POST /verify

Verify a factual claim.

**Request:**
```json
{
  "text": "Studies show that 90% of statistics are made up on the spot."
}
```

**Response:**
```json
{
  "score": 45,
  "bias": "center",
  "biasConfidence": 72,
  "explanation": "This claim appears questionable...",
  "sources": [
    "Academic Research Databases",
    "News Archive Cross-Reference",
    "Snopes Verification"
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/verify \
  -H "Content-Type: application/json" \
  -d '{"text": "Studies show that 90% of statistics are made up."}'
```

## Mock Intelligence (Phase 2)

The verification service analyzes text and adjusts scores based on:

- **Statistics/Numbers**: Lowers score (harder to verify)
- **Absolute Language**: (always, never) Reduces credibility
- **Authority Citations**: (studies, experts) Increases score
- **Sensational Words**: (shocking, unbelievable) Lowers score
- **Qualifiers**: (might, possibly) Increases nuance score
- **Political Keywords**: Influences bias detection
- **Length**: Very long or very short affects scoring

## Project Structure

```
backend/
├── src/
│   ├── server.ts              # Express server setup
│   ├── routes/
│   │   └── verify.ts          # Verification endpoint
│   ├── services/
│   │   ├── verification.ts    # Verification logic
│   │   └── llm/              # (Phase 3) AI integration
│   └── types/
│       └── index.ts           # Type definitions
├── dist/                      # Compiled JavaScript
├── .env                       # Environment variables
└── package.json
```

## Testing

You can test the API using curl, Postman, or the browser extension.

### Test Example Claims

```bash
# Political claim
curl -X POST http://localhost:3000/verify \
  -H "Content-Type: application/json" \
  -d '{"text": "The Senate passed the bill with overwhelming support from both parties."}'

# Health claim
curl -X POST http://localhost:3000/verify \
  -H "Content-Type: application/json" \
  -d '{"text": "Studies show that vaccines are 95% effective against the virus."}'

# Economic claim
curl -X POST http://localhost:3000/verify \
  -H "Content-Type: application/json" \
  -d '{"text": "Unemployment has decreased by 2% over the last year."}'
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `400`: Bad request (invalid input)
- `404`: Endpoint not found
- `500`: Internal server error

## CORS

CORS is enabled for all origins in development mode. For production, update the CORS configuration in `src/server.ts`.

## Next Steps

**Phase 3** will replace mock logic with:
- Real AI integration (OpenAI/Anthropic)
- Actual fact-checking against sources
- Web search and citation verification
- Production-ready responses
