/**
 * Vercel Serverless Function: /api/verify
 * Handles claim verification requests
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';

// Types
type BiasLabel = 'left' | 'center' | 'right';

interface PageContext {
  url: string;
  title: string;
  siteName?: string;
  surroundingText?: string;
}

interface VerificationRequest {
  text: string;
  context?: PageContext;
}

interface VerificationResponse {
  score: number; // 0-100
  bias: BiasLabel;
  biasConfidence: number;
  explanation: string;
  sources: string[];
}

// Simple in-memory cache (per-instance, resets on cold start)
const cache = new Map<string, { result: VerificationResponse; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

// Simple rate limiting (per IP, per instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute per IP

// Initialize Groq client
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

/**
 * Build the verification prompt
 */
function buildPrompt(claim: string, context?: PageContext): string {
  let contextSection = '';
  
  if (context) {
    contextSection = `
SOURCE CONTEXT:
- Website: ${context.siteName || 'Unknown'}
- Page Title: ${context.title || 'Unknown'}
- URL: ${context.url || 'Unknown'}
${context.surroundingText ? `- Surrounding Text: "${context.surroundingText.substring(0, 300)}..."` : ''}

IMPORTANT: Use this context to better understand the claim.
`;
  }

  return `You are Verifeed, an expert fact-checker. Analyze this claim and assign a truthfulness score using the STRICT rubric below.

CLAIM TO VERIFY:
"${claim}"
${contextSection}
SCORING RUBRIC (follow this exactly, be rigorous):

90-100: VERIFIED TRUE
- Claim matches established scientific/historical facts
- Supported by multiple authoritative sources (NASA, WHO, peer-reviewed research)
- No significant inaccuracies or misleading elements
- Examples: "Earth orbits the Sun", "Water boils at 100°C at sea level"

75-89: MOSTLY ACCURATE
- Core claim is true but lacks important context or nuance
- Minor simplifications that don't fundamentally mislead
- Generally supported by evidence
- Examples: "Vaccines prevent disease" (true but needs specificity about which ones)

50-74: MIXED / NEEDS CONTEXT
- Contains both accurate and inaccurate elements
- Technically true but misleading without context
- Cherry-picks data or ignores key facts
- Examples: "More people die in hospitals than at home" (true but misleading - hospitals treat sick people)

25-49: MOSTLY FALSE
- Core claim contradicts established facts
- Contains a grain of truth but fundamentally misleading
- Misrepresents data or research
- Examples: "COVID vaccines change your DNA" (vaccines exist but don't alter DNA)

0-24: DEMONSTRABLY FALSE
- Directly contradicts verified facts
- No credible evidence supports the claim
- Conflicts with scientific consensus
- Examples: "Earth is flat", "5G causes COVID"

IMPORTANT RULES:
1. DO NOT penalize well-known facts for brevity
2. Score based on ACCURACY, not just completeness
3. Historical/scientific facts should score 90-100 if accurate
4. If you're uncertain, explain why in the explanation
5. Sources must be SPECIFIC (not "various sources")

OUTPUT (JSON only, no markdown):
{
  "score": <0-100, must follow rubric above>,
  "bias": "<left|center|right>",
  "biasConfidence": <0-100>,
  "explanation": "<2-3 sentences explaining WHY you gave this score using the rubric>",
  "sources": ["<specific source 1>", "<specific source 2>", "<specific source 3>"]
}

EXAMPLE:
Claim: "The Earth is the third planet from the Sun"
{
  "score": 95,
  "bias": "center",
  "biasConfidence": 100,
  "explanation": "This is an established astronomical fact verified by centuries of observation and confirmed by modern space exploration. Score: 95 (Verified True) - matches scientific consensus with no inaccuracies.",
  "sources": ["NASA Solar System Overview", "International Astronomical Union", "Planetary science textbooks"]
}`;
}

/**
 * Parse LLM response
 */
function parseResponse(responseText: string): VerificationResponse {
  // Strip markdown code blocks
  let cleaned = responseText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    score: Math.max(0, Math.min(100, Number(parsed.score) || 50)),
    bias: ['left', 'center', 'right'].includes(parsed.bias) ? parsed.bias : 'center',
    biasConfidence: Math.max(0, Math.min(100, Number(parsed.biasConfidence) || 50)),
    explanation: String(parsed.explanation || 'Unable to verify this claim.'),
    sources: Array.isArray(parsed.sources) ? parsed.sources.map(String).slice(0, 5) : [],
  };
}

/**
 * Generate mock response (fallback)
 */
function generateMock(text: string): VerificationResponse {
  return {
    score: 50,
    bias: 'center',
    biasConfidence: 0,
    explanation: 'This claim could not be verified. Our AI service is currently unavailable. Please try again later.',
    sources: ['AI service unavailable - manual verification recommended'],
  };
}

/**
 * Main handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const ipKey = Array.isArray(ip) ? ip[0] : String(ip);
    const now = Date.now();
    
    let rateLimit = rateLimitMap.get(ipKey);
    if (!rateLimit || now > rateLimit.resetTime) {
      rateLimit = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
      rateLimitMap.set(ipKey, rateLimit);
    }
    
    rateLimit.count++;
    
    if (rateLimit.count > RATE_LIMIT_MAX) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please wait a minute.' 
      });
    }

    const { text, context } = req.body as VerificationRequest;

    // Validate
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text field is required' });
    }

    if (text.length < 10 || text.length > 1000) {
      return res.status(400).json({ error: 'Text must be 10-1000 characters' });
    }

    // Check cache
    const cacheKey = context ? `${text}|${context.url}` : text;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.status(200).json(cached.result);
    }

    // Verify with AI
    let result: VerificationResponse;

    if (groq) {
      try {
        const prompt = buildPrompt(text, context);
        const response = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a fact-checker. Respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        });

        const content = response.choices[0]?.message?.content || '';
        result = parseResponse(content);
      } catch (error) {
        console.error('AI Error:', error);
        result = generateMock(text);
      }
    } else {
      result = generateMock(text);
    }

    // Cache result
    cache.set(cacheKey, { result, timestamp: Date.now() });

    // Clean old cache entries periodically
    if (cache.size > 500) {
      const now = Date.now();
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          cache.delete(key);
        }
      }
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
