/**
 * LLM-based Fact Verification Service
 * Supports Groq (free), OpenAI, and Anthropic APIs
 */

// CRITICAL: Load env config FIRST before using process.env!
import '../../config/env';

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import { VerificationResponse, PageContext } from '../../types';

interface LLMResponse {
  score: number;
  explanation: string;
  sources: string[];
  evidence: string;
}

export class LLMVerifier {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private groq: Groq | null = null;
  private provider: 'groq' | 'openai' | 'anthropic' | 'mock';

  constructor() {
    const enableAI = process.env.ENABLE_AI === 'true';
    
    if (!enableAI) {
      this.provider = 'mock';
      console.log('[LLM Verifier] MOCK MODE ENABLED (AI disabled)');
      console.log('[LLM Verifier] Set ENABLE_AI=true in .env to enable AI');
      return;
    }

    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // Groq is preferred (free tier)
    if (groqKey) {
      this.groq = new Groq({ apiKey: groqKey });
      this.provider = 'groq';
      console.log('[LLM Verifier] Using Groq (Llama 3.3 70B) for verification - FREE');
    } else if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
      this.provider = 'openai';
      console.log('[LLM Verifier] Using OpenAI for verification');
    } else if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
      this.provider = 'anthropic';
      console.log('[LLM Verifier] Using Anthropic for verification');
    } else {
      this.provider = 'mock';
      console.log('[LLM Verifier] No API keys found, using mock mode');
      console.log('[LLM Verifier] Set GROQ_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY in .env');
    }
  }

  /**
   * Verify a claim using AI
   */
  async verify(claim: string, context?: PageContext): Promise<VerificationResponse> {
    if (this.provider === 'mock') {
      throw new Error('No AI API keys configured. Add GROQ_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY to .env file.');
    }

    try {
      const prompt = this.buildPrompt(claim, context);
      
      let responseText: string;

      if (this.provider === 'groq' && this.groq) {
        responseText = await this.callGroq(prompt);
      } else if (this.provider === 'openai' && this.openai) {
        responseText = await this.callOpenAI(prompt);
      } else if (this.provider === 'anthropic' && this.anthropic) {
        responseText = await this.callAnthropic(prompt);
      } else {
        throw new Error('LLM provider not properly initialized');
      }

      // Parse the structured response
      const parsed = this.parseResponse(responseText);
      
      return {
        score: parsed.score,
        explanation: parsed.explanation,
        sources: parsed.sources,
        evidence: parsed.evidence,
      };

    } catch (error) {
      console.error('[LLM Verifier] Error:', error);
      throw error;
    }
  }

  /**
   * Build the verification prompt with context
   */
  private buildPrompt(claim: string, context?: PageContext): string {
    let contextSection = '';
    
    if (context) {
      contextSection = `
SOURCE CONTEXT:
- Website: ${context.siteName || 'Unknown'}
- Page Title: ${context.title || 'Unknown'}
- URL: ${context.url || 'Unknown'}
${context.surroundingText ? `- Surrounding Text: "${context.surroundingText.substring(0, 300)}..."` : ''}

IMPORTANT: Use this context to better understand the claim. The source website may provide credibility signals (e.g., a scientific journal vs a blog). The surrounding text helps understand what the claim is referring to.
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
}

Return ONLY valid JSON, no other text.`;
  }

  /**
   * Call Groq API (free tier with Llama 3.3 70B)
   */
  private async callGroq(prompt: string): Promise<string> {
    if (!this.groq) throw new Error('Groq not initialized');

    const response = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Free, fast, and capable
      messages: [
        {
          role: 'system',
          content: 'You are a fact-checking assistant. Always respond with valid JSON only. No markdown, no code blocks, just raw JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || '';
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.openai) throw new Error('OpenAI not initialized');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a fact-checking assistant. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    return response.choices[0]?.message?.content || '';
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(prompt: string): Promise<string> {
    if (!this.anthropic) throw new Error('Anthropic not initialized');

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // Updated model name
      max_tokens: 800,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    throw new Error('Unexpected response format from Anthropic');
  }

  /**
   * Parse LLM response into structured format
   */
  private parseResponse(responseText: string): LLMResponse {
    try {
      // Strip markdown code blocks if present (```json ... ```)
      let cleanedText = responseText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      // Extract JSON from response (in case there's extra text)
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and sanitize
      return {
        score: this.clamp(parsed.score, 0, 100),
        explanation: String(parsed.explanation || 'No explanation provided'),
        sources: Array.isArray(parsed.sources) ? parsed.sources.map(String).slice(0, 5) : [],
        evidence: String(parsed.evidence || 'No detailed evidence provided'),
      };

    } catch (error) {
      console.error('[LLM Verifier] Failed to parse response:', error);
      console.error('[LLM Verifier] Response was:', responseText);
      
      throw new Error('Failed to parse AI response. The model may have returned invalid JSON.');
    }
  }

  /**
   * Clamp number to range
   */
  private clamp(value: any, min: number, max: number): number {
    const num = Number(value);
    if (isNaN(num)) return min;
    return Math.max(min, Math.min(max, num));
  }

  /**
   * Check if AI is available
   */
  isAvailable(): boolean {
    return this.provider !== 'mock';
  }

  /**
   * Get current provider
   */
  getProvider(): string {
    return this.provider;
  }
}
