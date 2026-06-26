/**
 * Claim Detection Engine
 * Uses heuristics to identify sentences that look like factual claims
 */

export interface ClaimCandidate {
  text: string;
  confidence: number;
  reasons: string[];
}

export class ClaimDetector {
  // Patterns that indicate factual claims - expanded for better detection
  private static readonly CLAIM_PATTERNS = {
    // Numbers and statistics (high confidence)
    statistics: /\d+\s*%|\d+\s*(percent|million|billion|trillion|thousand|hundred)/i,
    numbers: /\b\d{2,}\b/,  // Any number with 2+ digits
    years: /\b(19|20)\d{2}\b/,  // Years like 1990, 2024
    money: /\$[\d,.]+|\d+\s*(dollars|euros|pounds)/i,
    measurements: /\b\d+\s*(meters?|kilometers?|miles?|feet|inches|pounds|kilograms?|tons?|degrees?|celsius|fahrenheit|kelvin)\b/i,
    
    // Factual language (medium confidence)
    factualVerbs: /\b(is|are|was|were|has|have|had|will|would|can|could|shows?|proves?|demonstrates?|reveals?|confirms?|indicates?|represents?|constitutes?)\b/i,
    causation: /\b(causes?|leads?\s+to|results?\s+in|because|due\s+to|therefore|consequently|thus|hence|leads?\s+to|produces?|creates?)\b/i,
    
    // Authority citations (high confidence)
    authorities: /\b(studies?|research|researchers?|experts?|scientists?|reports?|according\s+to|data|survey|poll|investigation|analysis|evidence|findings?|observed|measured)\b/i,
    organizations: /\b(university|institute|organization|government|administration|agency|department|ministry|commission|foundation|WHO|UN|CDC|FDA|NASA|FBI|CIA|IEEE|association)\b/i,
    
    // Strong claims (medium confidence)
    absolutes: /\b(always|never|all|none|every|no\s+one|everyone|nobody|completely|totally|entirely|absolutely|definitely|certainly|undoubtedly|invariably)\b/i,
    comparatives: /\b(more|less|most|least|better|worse|best|worst|higher|lower|highest|lowest|increased|decreased|growing|declining|faster|slower|larger|smaller|greater|lesser)\b/i,
    
    // Definitive statements (medium confidence)
    definitive: /\b(fact|true|false|proven|confirmed|established|known|discovered|invented|founded|created|built|developed|identified|recognized)\b/i,
    existence: /\b(exists?|existed|contains?|consists?\s+of|made\s+of|composed\s+of|includes?|comprises?|forms?|constitutes?)\b/i,
    
    // Scientific/technical language
    scientific: /\b(species|genus|element|compound|molecule|atom|cell|gene|protein|DNA|RNA|enzyme|bacteria|virus|theory|hypothesis|law\s+of)\b/i,
    process: /\b(occurs?|happens?|takes?\s+place|undergoes?|develops?|evolves?|forms?|grows?|divides?|reacts?|combines?)\b/i,
    
    // Time and history
    temporal: /\b(first|last|oldest|newest|ancient|modern|recently|formerly|originally|historically|traditionally|earliest|latest|began|started|ended|finished)\b/i,
    
    // Location claims
    location: /\b(located|situated|found\s+in|lives?\s+in|based\s+in|native\s+to|from|originates?|inhabits?|resides?)\b/i,
    
    // Properties and characteristics
    properties: /\b(density|mass|weight|volume|temperature|pressure|speed|velocity|energy|force|power|capacity|diameter|radius|circumference)\b/i,
  };

  // Patterns that indicate OPINIONS (should NOT be fact-checked)
  private static readonly OPINION_PATTERNS = {
    // Personal opinions and beliefs
    personalOpinion: /\b(I\s+think|I\s+believe|I\s+feel|in\s+my\s+opinion|personally|I\s+suspect|I\s+guess|I\s+assume|I\s+hope|I\s+wish|I\s+prefer)\b/i,
    
    // Subjective judgments
    subjective: /\b(beautiful|ugly|best|worst|amazing|terrible|awesome|awful|wonderful|horrible|great|bad|good|nice|love|hate|like|dislike|favorite|prefer)\b/i,
    
    // Speculation and uncertainty
    speculation: /\b(maybe|perhaps|probably|possibly|might|could\s+be|seems?\s+like|appears?\s+to|looks?\s+like|I\s+wonder|supposedly)\b/i,
    
    // Questions
    questions: /\?$/,
    
    // Recommendations and advice
    advice: /\b(should|shouldn't|ought|must|need\s+to|have\s+to|recommend|suggest|advise|try\s+to|consider)\b/i,
    
    // Emotional language
    emotional: /\b(love|hate|angry|happy|sad|excited|worried|scared|proud|ashamed|embarrassed|frustrated)\b/i,
    
    // Future predictions (not verifiable)
    futurePredictions: /\b(will\s+be|going\s+to|expect|predict|forecast|anticipate)\b/i,
  };

  // Minimum sentence length to consider
  private static readonly MIN_SENTENCE_LENGTH = 10;  // Lowered to catch more claims
  private static readonly MAX_SENTENCE_LENGTH = 500; // Increased to handle longer claims

  /**
   * Extract sentences from text
   */
  static extractSentences(text: string): string[] {
    // Split on sentence boundaries but preserve the sentence
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => {
        // Must be within length bounds
        if (s.length < this.MIN_SENTENCE_LENGTH || s.length > this.MAX_SENTENCE_LENGTH) {
          return false;
        }
        
        // CRITICAL: Must be a COMPLETE sentence (ends with punctuation)
        // This filters out fragments like "Almost all of the Earth's water is contained in its"
        if (!/[.!?]$/.test(s)) {
          return false;
        }
        
        // Must start with a capital letter (basic sentence structure)
        if (!/^[A-Z]/.test(s)) {
          return false;
        }
        
        return true;
      });
    
    return sentences;
  }

  /**
   * Check if a sentence is an opinion (not fact-checkable)
   */
  static isOpinion(sentence: string): boolean {
    // Check all opinion patterns
    if (this.OPINION_PATTERNS.personalOpinion.test(sentence)) return true;
    if (this.OPINION_PATTERNS.questions.test(sentence)) return true;
    
    // Count subjective indicators
    let opinionScore = 0;
    if (this.OPINION_PATTERNS.subjective.test(sentence)) opinionScore += 2;
    if (this.OPINION_PATTERNS.speculation.test(sentence)) opinionScore += 2;
    if (this.OPINION_PATTERNS.advice.test(sentence)) opinionScore += 2;
    if (this.OPINION_PATTERNS.emotional.test(sentence)) opinionScore += 1;
    if (this.OPINION_PATTERNS.futurePredictions.test(sentence)) opinionScore += 1;
    
    // If multiple opinion indicators, it's likely an opinion
    return opinionScore >= 3;
  }

  /**
   * Analyze if a sentence looks like a factual claim
   */
  static analyzeClaim(sentence: string): ClaimCandidate | null {
    // First, filter out opinions - they can't be fact-checked
    if (this.isOpinion(sentence)) {
      return null;
    }

    const reasons: string[] = [];
    let confidence = 0;

    // High confidence patterns (25-35 points each)
    if (this.CLAIM_PATTERNS.statistics.test(sentence)) {
      reasons.push('contains statistics');
      confidence += 35;
    }

    if (this.CLAIM_PATTERNS.authorities.test(sentence)) {
      reasons.push('cites authorities/research');
      confidence += 30;
    }

    if (this.CLAIM_PATTERNS.organizations.test(sentence)) {
      reasons.push('mentions organizations');
      confidence += 25;
    }

    // Medium confidence patterns (15-20 points each)
    if (this.CLAIM_PATTERNS.numbers.test(sentence)) {
      reasons.push('contains specific numbers');
      confidence += 20;
    }

    if (this.CLAIM_PATTERNS.years.test(sentence)) {
      reasons.push('references specific dates');
      confidence += 15;
    }

    if (this.CLAIM_PATTERNS.money.test(sentence)) {
      reasons.push('mentions monetary values');
      confidence += 20;
    }

    if (this.CLAIM_PATTERNS.factualVerbs.test(sentence)) {
      reasons.push('uses factual language');
      confidence += 15;
    }

    if (this.CLAIM_PATTERNS.causation.test(sentence)) {
      reasons.push('makes causal claims');
      confidence += 20;
    }

    if (this.CLAIM_PATTERNS.absolutes.test(sentence)) {
      reasons.push('makes absolute statement');
      confidence += 18;
    }

    if (this.CLAIM_PATTERNS.comparatives.test(sentence)) {
      reasons.push('makes comparison');
      confidence += 15;
    }

    if (this.CLAIM_PATTERNS.definitive.test(sentence)) {
      reasons.push('makes definitive claim');
      confidence += 18;
    }

    if (this.CLAIM_PATTERNS.existence.test(sentence)) {
      reasons.push('states existence/composition');
      confidence += 12;
    }

    if (this.CLAIM_PATTERNS.temporal.test(sentence)) {
      reasons.push('makes historical claim');
      confidence += 12;
    }

    if (this.CLAIM_PATTERNS.location.test(sentence)) {
      reasons.push('makes location claim');
      confidence += 10;
    }

    if (this.CLAIM_PATTERNS.measurements.test(sentence)) {
      reasons.push('contains measurements');
      confidence += 25;
    }

    if (this.CLAIM_PATTERNS.scientific.test(sentence)) {
      reasons.push('contains scientific terms');
      confidence += 20;
    }

    if (this.CLAIM_PATTERNS.process.test(sentence)) {
      reasons.push('describes a process');
      confidence += 15;
    }

    if (this.CLAIM_PATTERNS.properties.test(sentence)) {
      reasons.push('describes properties');
      confidence += 18;
    }

    // More aggressive detection: accept claims with ANY factual indicator
    // Threshold: confidence >= 15 OR 2+ indicators OR just 1 strong indicator
    const hasStrongIndicator = confidence >= 20;
    const hasMultipleIndicators = reasons.length >= 2;
    const hasAnyIndicator = confidence >= 15;
    
    if (hasStrongIndicator || hasMultipleIndicators || hasAnyIndicator) {
      return {
        text: sentence,
        confidence: Math.min(confidence, 100),
        reasons,
      };
    }

    return null;
  }

  /**
   * Detect all claims in a text block
   */
  static detectClaims(text: string): ClaimCandidate[] {
    const sentences = this.extractSentences(text);
    const claims: ClaimCandidate[] = [];

    for (const sentence of sentences) {
      const claim = this.analyzeClaim(sentence);
      if (claim) {
        claims.push(claim);
      }
    }

    return claims;
  }
}
