/**
 * Verification Service
 * Phase 2: Intelligent mock responses
 * Phase 3: Real AI integration
 */

import { VerificationResponse, PageContext } from '../types';
import { LLMVerifier } from './llm/verifier';
import { VerificationCache } from './cache';

export class VerificationService {
  private llmVerifier: LLMVerifier;
  private cache: VerificationCache;

  constructor() {
    this.llmVerifier = new LLMVerifier();
    this.cache = new VerificationCache();
  }

  /**
   * Verify a claim with optional page context
   */
  async verifyClaim(text: string, context?: PageContext): Promise<VerificationResponse> {
    console.log(`[Verification] Analyzing claim: "${text.substring(0, 50)}..."`);
    if (context) {
      console.log(`[Verification] Context: ${context.siteName} - ${context.title}`);
    }

    // Check cache first (include context in cache key for better accuracy)
    const cacheKey = context ? `${text}|${context.url}` : text;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    let result: VerificationResponse;

    // Try AI verification if available
    if (this.llmVerifier.isAvailable()) {
      try {
        console.log(`[Verification] Using ${this.llmVerifier.getProvider()} for verification`);
        result = await this.llmVerifier.verify(text, context);
      } catch (error) {
        console.error('[Verification] AI verification failed, falling back to mock:', error);
        // Fall back to mock if AI fails
        await this.delay(800 + Math.random() * 700);
        result = this.generateIntelligentMock(text);
      }
    } else {
      // Use intelligent mock
      console.log('[Verification] Using mock verification (no AI configured)');
      await this.delay(800 + Math.random() * 700);
      result = this.generateIntelligentMock(text);
    }

    // Cache the result
    this.cache.set(cacheKey, result);

    return result;
  }

  /**
   * Generate intelligent mock response based on text analysis
   */
  private generateIntelligentMock(text: string): VerificationResponse {
    const analysis = this.analyzeText(text);

    // Calculate score based on text characteristics
    let score = 65; // Base score

    // Adjust score based on characteristics
    if (analysis.hasNumbers) {
      score -= 10; // Numbers are harder to verify, lower initial score
    }

    if (analysis.hasAbsolutes) {
      score -= 15; // Absolute claims are often exaggerated
    }

    if (analysis.hasAuthorities) {
      score += 10; // Citing sources increases credibility
    }

    if (analysis.hasSensationalWords) {
      score -= 12; // Sensational language reduces score
    }

    if (analysis.hasQualifiers) {
      score += 8; // Qualifiers suggest nuance
    }

    if (text.length > 200) {
      score -= 5; // Very long claims are complex
    }

    if (text.length < 30) {
      score += 5; // Short claims are easier to verify
    }

    // Clamp score
    score = Math.max(15, Math.min(88, score));

    // Generate explanation
    const explanation = this.generateExplanation(text, analysis, score);

    // Generate sources
    const sources = this.generateSources(analysis);

    // Generate evidence
    const evidence = 'This is a mock response. Enable AI verification in .env to get detailed evidence-based analysis with specific data, dates, and research findings.';

    return {
      score,
      explanation,
      sources,
      evidence,
    };
  }

  /**
   * Analyze text characteristics
   */
  private analyzeText(text: string) {
    const lowerText = text.toLowerCase();

    return {
      hasNumbers: /\d+/.test(text),
      hasAbsolutes: /(always|never|all|none|every|everyone|no one|completely|totally)/i.test(text),
      hasAuthorities: /(study|studies|research|expert|scientist|report|according to|data shows?)/i.test(text),
      hasSensationalWords: /(shocking|amazing|incredible|unbelievable|devastating|breakthrough|miracle)/i.test(text),
      hasQualifiers: /(might|may|could|possibly|likely|suggests?|indicates?|appears?)/i.test(text),
      hasStatistics: /\d+\s*%|\d+\s*(percent|million|billion|thousand)/i.test(text),
      hasPoliticalKeywords: /(democrat|republican|liberal|conservative|left|right|trump|biden|congress|senate)/i.test(lowerText),
      hasHealthKeywords: /(vaccine|covid|health|disease|treatment|cure|medication)/i.test(lowerText),
      hasEconomicKeywords: /(economy|inflation|unemployment|gdp|market|stock|recession)/i.test(lowerText),
    };
  }

  /**
   * Generate explanation based on analysis
   */
  private generateExplanation(text: string, analysis: any, score: number): string {
    const parts: string[] = [];

    if (score >= 70) {
      parts.push('This claim appears to be largely accurate based on available information.');
    } else if (score >= 50) {
      parts.push('This claim has some factual basis but may require additional context or contain exaggerations.');
    } else {
      parts.push('This claim appears questionable and lacks strong supporting evidence.');
    }

    if (analysis.hasAbsolutes) {
      parts.push('The use of absolute language (always/never) often oversimplifies complex issues.');
    }

    if (analysis.hasAuthorities) {
      parts.push('The claim cites authorities or research, which increases credibility if sources are legitimate.');
    }

    if (analysis.hasSensationalWords) {
      parts.push('Sensational language detected, which may indicate exaggeration or bias.');
    }

    if (analysis.hasStatistics) {
      parts.push('Contains specific statistics that should be verified against primary sources.');
    }

    if (analysis.hasQualifiers) {
      parts.push('Includes qualifying language, suggesting appropriate uncertainty.');
    }

    parts.push('Note: This is an automated analysis. Always verify important claims with multiple sources.');

    return parts.join(' ');
  }

  /**
   * Generate mock sources based on content
   */
  private generateSources(analysis: any): string[] {
    const sources: string[] = [];

    if (analysis.hasHealthKeywords) {
      sources.push('CDC - Centers for Disease Control');
      sources.push('WHO - World Health Organization');
      sources.push('PubMed Medical Research Database');
    } else if (analysis.hasPoliticalKeywords) {
      sources.push('Congressional Research Service');
      sources.push('Politifact Fact-Checking Database');
      sources.push('AP News Archive');
    } else if (analysis.hasEconomicKeywords) {
      sources.push('Bureau of Labor Statistics');
      sources.push('Federal Reserve Economic Data');
      sources.push('World Bank Data');
    } else {
      sources.push('Academic Research Databases');
      sources.push('News Archive Cross-Reference');
      sources.push('Expert Consensus Review');
    }

    // Add 1-2 more general sources
    const generalSources = [
      'Reuters Fact Check',
      'Snopes Verification',
      'FactCheck.org',
      'Wikipedia Citations',
    ];

    sources.push(generalSources[Math.floor(Math.random() * generalSources.length)]);

    return sources;
  }

  /**
   * Simulate async delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
