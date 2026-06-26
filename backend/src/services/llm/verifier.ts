/**
 * LLM-based Fact Verification Service
 * Supports Groq (free), OpenAI, and Anthropic APIs
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import { VerificationResponse, BiasLabel, PageContext } from '../../types';

interface LLMResponse {
  score: number;
  bias: BiasLabel;
  biasConfidence: number;
  explanation: string;
  sources: string[];
  reasoning: string;
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
        bias: parsed.bias,
        biasConfidence: parsed.biasConfidence,
        explanation: parsed.explanation,
        sources: parsed.sources,
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

    return `You are Verifeed, an expert fact-checker with access to comprehensive world knowledge. Your job is to verify factual claims using your training data, which includes encyclopedias, scientific papers, news archives, and reliable sources up to your knowledge cutoff.

CLAIM TO VERIFY:
"${claim}"
${contextSection}
CRITICAL INSTRUCTIONS:
1. DO NOT penalize claims for being short or lacking detail. Use your knowledge to fill in context.
2. If a claim is a well-known fact (e.g., "Water boils at 100°C"), score it highly even if brief.
3. Consider the SOURCE - claims from reputable news sites, scientific journals, or educational institutions should be given appropriate credibility.
4. Use your broad knowledge of history, science, current events, and established facts to verify claims.
5. Only mark claims as false/misleading if they contradict established facts or reliable sources.
6. If a claim is simply an incomplete statement of a larger truth, explain this but still score it reasonably.

SCORING GUIDELINES:
- 85-100: Factually accurate, supported by reliable sources and scientific/historical consensus
- 70-84: Largely accurate with minor simplifications or missing nuance
- 50-69: Partially true but missing important context, or unverifiable but plausible
- 30-49: Misleading, cherry-picked facts, or significant inaccuracies
- 0-29: Demonstrably false, contradicts established facts, or known misinformation

BIAS ASSESSMENT:
- "left": Uses progressive/liberal framing, sources, or talking points
- "center": Neutral presentation, balanced perspective
- "right": Uses conservative framing, sources, or talking points

OUTPUT FORMAT (JSON only, no markdown):
{
  "score": <0-100>,
  "bias": "<left|center|right>",
  "biasConfidence": <0-100>,
  "explanation": "<2-3 sentences explaining your verdict, referencing your knowledge>",
  "sources": ["<relevant source 1>", "<relevant source 2>", "<relevant source 3>"],
  "reasoning": "<brief internal reasoning>"
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
        bias: this.validateBias(parsed.bias),
        biasConfidence: this.clamp(parsed.biasConfidence, 0, 100),
        explanation: String(parsed.explanation || 'No explanation provided'),
        sources: Array.isArray(parsed.sources) ? parsed.sources.map(String) : [],
        reasoning: String(parsed.reasoning || ''),
      };

    } catch (error) {
      console.error('[LLM Verifier] Failed to parse response:', error);
      console.error('[LLM Verifier] Response was:', responseText);
      
      throw new Error('Failed to parse AI response. The model may have returned invalid JSON.');
    }
  }

  /**
   * Validate bias label
   */
  private validateBias(bias: any): BiasLabel {
    const validBiases: BiasLabel[] = ['left', 'center', 'right'];
    const normalized = String(bias).toLowerCase() as BiasLabel;
    
    if (validBiases.includes(normalized)) {
      return normalized;
    }

    return 'center'; // Default to center if invalid
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
