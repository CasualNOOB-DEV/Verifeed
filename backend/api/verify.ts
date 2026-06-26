/**
 * Vercel Serverless Function: /api/verify
 * Handles claim verification requests
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';

// Types
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
  explanation: string;
  sources: string[];
  evidence: string;
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

  return `You are Verifeed, an expert fact-checker with access to comprehensive knowledge from encyclopedias, scientific databases, historical records, and reliable sources. Your task is to thoroughly research and verify this claim.

CLAIM TO VERIFY:
"${claim}"
${contextSection}

YOUR RESEARCH PROCESS:
1. ANALYZE the claim - identify specific factual assertions
2. SEARCH your knowledge base for relevant facts, studies, and historical data
3. CROSS-REFERENCE multiple sources to verify accuracy
4. EXAMINE context and potential misleading aspects
5. PROVIDE specific evidence and data points
6. CITE authoritative sources from your knowledge

SCORING RUBRIC (be rigorous and detailed):

90-100: VERIFIED TRUE
- Claim directly matches established scientific/historical facts
- Supported by multiple authoritative sources (NASA, WHO, peer-reviewed journals)
- All specific details are accurate
- Example: "Earth orbits the Sun" - confirmed by astronomy, physics, direct observation

75-89: MOSTLY ACCURATE  
- Core claim is factually correct
- Minor simplifications or missing nuance
- Generally well-supported by evidence
- Example: "Vaccines prevent disease" - true but lacks specificity about which vaccines/diseases

50-74: PARTIALLY TRUE
- Contains some accurate information
- Missing critical context or cherry-picks data
- Technically correct but potentially misleading
- Example: "Most car accidents happen close to home" - statistically true but misleading context

25-49: MOSTLY FALSE
- Core claim contradicts established facts
- Misrepresents data or research findings
- Contains grain of truth buried in misinformation
- Example: "COVID vaccines alter DNA" - vaccines exist but mechanism is completely wrong

0-24: FALSE
- Directly contradicts verified scientific/historical facts
- No credible evidence whatsoever
- Conflicts with expert consensus
- Example: "Earth is flat" - contradicts physics, satellite imagery, centuries of data

CRITICAL REQUIREMENTS:
1. Search your knowledge thoroughly - cite SPECIFIC studies, data, historical events
2. Provide DETAILED evidence in the "evidence" field - actual numbers, dates, findings
3. Name SPECIFIC sources - not "scientists say" but "2019 WHO report showed..."
4. Explain your reasoning clearly - why this score, what evidence supports it
5. If uncertain, explain what's unclear and why

OUTPUT (valid JSON only, no markdown):
{
  "score": <0-100>,
  "explanation": "<Clear 2-3 sentence verdict with specific reasoning>",
  "evidence": "<Detailed paragraph with specific data, studies, facts from your knowledge that prove/disprove the claim. Include actual numbers, dates, and findings.>",
  "sources": ["<specific source 1>", "<specific source 2>", "<specific source 3>"]
}

EXAMPLE:
Claim: "The Earth is the third planet from the Sun"
{
  "score": 98,
  "explanation": "This claim is astronomically accurate and verified by centuries of observation, modern space missions, and planetary science. The ordering is: Mercury (1st), Venus (2nd), Earth (3rd), Mars (4th).",
  "evidence": "NASA's planetary science division confirms Earth's position as the third planet at an average distance of 149.6 million km (1 AU) from the Sun. This was established through Copernican heliocentrism (1543), refined by Kepler's laws (1609-1619), and directly confirmed by space missions including Voyager (1977), Cassini, and modern telescopes. The order has been independently verified through gravitational calculations, orbital mechanics, and direct observation.",
  "sources": ["NASA Solar System Exploration Database", "International Astronomical Union planetary definitions", "Copernicus 'De revolutionibus orbium coelestium' (1543)"]
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
    explanation: String(parsed.explanation || 'Unable to verify this claim.'),
    sources: Array.isArray(parsed.sources) ? parsed.sources.map(String).slice(0, 5) : [],
    evidence: String(parsed.evidence || 'No detailed evidence available.'),
  };
}

/**
 * Generate mock response (fallback)
 */
function generateMock(text: string): VerificationResponse {
  return {
    score: 50,
    explanation: 'This claim could not be verified. Our AI service is currently unavailable. Please try again later.',
    sources: ['AI service unavailable - manual verification recommended'],
    evidence: 'Unable to analyze this claim without AI service. Please check backend configuration.',
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
