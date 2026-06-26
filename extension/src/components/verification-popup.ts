/**
 * Verification Popup Component
 * Shows verification results when a claim is clicked
 */

import { ApiService } from '../services/api';
import { VerificationResponse, PageContext } from '../types';

interface ClaimDetail {
  id: string;
  text: string;
  element: HTMLElement;
  surroundingText?: string;
  pageContext?: PageContext;
}

export class VerificationPopup {
  private popup: HTMLElement | null = null;
  private currentClaimId: string | null = null;
  private currentElement: HTMLElement | null = null;
  private currentContext: PageContext | null = null;
  private apiService: ApiService;

  constructor() {
    this.apiService = new ApiService();
    this.createPopup();
    this.attachEventListeners();
  }

  /**
   * Create the popup element
   */
  private createPopup() {
    const popup = document.createElement('div');
    popup.id = 'verifeed-popup';
    popup.className = 'verifeed-popup';
    popup.style.display = 'none';

    popup.innerHTML = `
      <div class="verifeed-popup-header">
        <div class="verifeed-popup-title">Verifeed Analysis</div>
        <button class="verifeed-popup-close">&times;</button>
      </div>
      <div class="verifeed-popup-content">
        <div class="verifeed-popup-loading">
          <div class="verifeed-spinner"></div>
          <p>Analyzing claim...</p>
        </div>
        <div class="verifeed-popup-result" style="display: none;">
          <div class="verifeed-claim-text"></div>
          
          <div class="verifeed-score-section">
            <div class="verifeed-score-label">Truthfulness Score</div>
            <div class="verifeed-score-bar">
              <div class="verifeed-score-fill"></div>
              <div class="verifeed-score-value"></div>
            </div>
            <div class="verifeed-score-meaning"></div>
          </div>

          <div class="verifeed-explanation-section">
            <div class="verifeed-explanation-label">Analysis</div>
            <div class="verifeed-explanation-text"></div>
          </div>

          <div class="verifeed-evidence-section">
            <div class="verifeed-evidence-label">Detailed Evidence</div>
            <div class="verifeed-evidence-text"></div>
          </div>

          <div class="verifeed-sources-section">
            <div class="verifeed-sources-label">Sources</div>
            <ul class="verifeed-sources-list"></ul>
          </div>
        </div>
        <div class="verifeed-popup-error" style="display: none;">
          <p class="verifeed-error-message"></p>
        </div>
      </div>
    `;

    document.body.appendChild(popup);
    this.popup = popup;

    // Close button handler
    popup.querySelector('.verifeed-popup-close')?.addEventListener('click', () => {
      this.hide();
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.popup && !this.popup.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.classList.contains('verifeed-claim-highlight')) {
          this.hide();
        }
      }
    });
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners() {
    document.addEventListener('verifeed:claim-clicked', ((e: CustomEvent) => {
      console.log('[Verification Popup] Claim clicked');
      this.handleClaimClick(e.detail);
    }) as EventListener);
  }

  /**
   * Handle claim click
   */
  private async handleClaimClick(detail: ClaimDetail) {
    this.currentClaimId = detail.id;
    this.currentElement = detail.element;
    
    // Build context for AI
    this.currentContext = detail.pageContext ? {
      ...detail.pageContext,
      surroundingText: detail.surroundingText,
    } : null;
    
    this.show(detail.element, detail.text);
    await this.fetchVerification(detail.text, this.currentContext);
  }

  /**
   * Show the popup near the clicked element
   */
  private show(element: HTMLElement, claimText: string) {
    if (!this.popup) return;

    // Show loading state first
    this.showLoading();

    const rect = element.getBoundingClientRect();
    const popup = this.popup;

    // Position below the clicked claim, clamped to the viewport.
    const top = rect.bottom + window.scrollY + 10;
    const left = Math.max(10, rect.left + window.scrollX);

    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
    popup.style.display = 'block';

    // Set claim text
    const claimTextEl = popup.querySelector('.verifeed-claim-text');
    if (claimTextEl) {
      claimTextEl.textContent = `"${claimText}"`;
    }
  }

  /**
   * Hide the popup
   */
  private hide() {
    if (this.popup) {
      this.popup.style.display = 'none';
    }
  }

  /**
   * Show loading state
   */
  private showLoading() {
    if (!this.popup) return;
    this.popup.querySelector('.verifeed-popup-loading')!.setAttribute('style', 'display: block;');
    this.popup.querySelector('.verifeed-popup-result')!.setAttribute('style', 'display: none;');
    this.popup.querySelector('.verifeed-popup-error')!.setAttribute('style', 'display: none;');
  }

  /**
   * Fetch verification for a claim from the API
   */
  private async fetchVerification(text: string, context: PageContext | null) {
    console.log('[Verification Popup] Fetching verification for:', text.substring(0, 50));
    console.log('[Verification Popup] Context:', context?.siteName, context?.title);
    
    try {
      // Call the backend API with a race against timeout
      console.log('[Verification Popup] Calling API service...');
      
      const apiCall = this.apiService.verifyClaim(text, context || undefined);
      const timeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - AI verification took too long')), 15000)
      );
      
      const result = await Promise.race([apiCall, timeout]);
      console.log('[Verification Popup] Received result:', result);
      this.displayResult(result);

    } catch (error) {
      console.error('[Verification Popup] Error fetching verification:', error);
      
      // Use fallback mock if API fails
      console.log('[Verification Popup] Using fallback mock data');
      const mockResult = this.generateFallbackMock(text);
      this.displayResult(mockResult);
    }
  }

  /**
   * Generate fallback mock if API is unavailable
   */
  private generateFallbackMock(text: string): VerificationResponse {
    console.log('[Verification Popup] Generating fallback mock');
    return {
      score: 50,
      explanation: 'This claim could not be verified. The backend service is currently unavailable.',
      sources: ['Fallback Mode - Backend Unavailable'],
      evidence: 'Unable to analyze this claim without backend service. Please make sure the backend is running.',
    };
  }

  /**
   * Display verification result
   */
  private displayResult(result: VerificationResponse) {
    console.log('[Verification Popup] Step 1: Starting displayResult');
    if (!this.popup) {
      console.error('[Verification Popup] ERROR: popup element is null!');
      return;
    }

    console.log('[Verification Popup] Step 2: Toggling visibility');
    // Hide loading, show result
    try {
      this.popup.querySelector('.verifeed-popup-loading')!.setAttribute('style', 'display: none;');
      this.popup.querySelector('.verifeed-popup-result')!.setAttribute('style', 'display: block;');
      console.log('[Verification Popup] Step 3: Visibility toggled');
    } catch (e) {
      console.error('[Verification Popup] ERROR toggling visibility:', e);
      return;
    }

    console.log('[Verification Popup] Step 4: Updating score');
    // Score
    const scoreFill = this.popup.querySelector('.verifeed-score-fill') as HTMLElement;
    const scoreValue = this.popup.querySelector('.verifeed-score-value') as HTMLElement;
    const scoreMeaning = this.popup.querySelector('.verifeed-score-meaning') as HTMLElement;
    if (scoreFill && scoreValue && scoreMeaning) {
      scoreFill.style.width = `${result.score}%`;
      scoreFill.className = `verifeed-score-fill verifeed-score-${this.getScoreClass(result.score)}`;
      scoreValue.textContent = `${result.score}/100`;
      scoreMeaning.textContent = this.getScoreMeaning(result.score);
      console.log('[Verification Popup] Step 5: Score updated');
    }

    console.log('[Verification Popup] Step 6: Updating explanation');
    // Explanation
    const explanation = this.popup.querySelector('.verifeed-explanation-text');
    if (explanation) {
      explanation.textContent = result.explanation;
      console.log('[Verification Popup] Step 7: Explanation updated');
    }

    console.log('[Verification Popup] Step 8: Updating evidence');
    // Evidence
    const evidence = this.popup.querySelector('.verifeed-evidence-text');
    if (evidence) {
      evidence.textContent = result.evidence || 'No detailed evidence available.';
      console.log('[Verification Popup] Step 9: Evidence updated');
    }

    console.log('[Verification Popup] Step 10: Updating sources');
    // Sources
    const sourcesList = this.popup.querySelector('.verifeed-sources-list');
    if (sourcesList) {
      sourcesList.innerHTML = result.sources
        .map((source: string) => `<li>${source}</li>`)
        .join('');
      console.log('[Verification Popup] Step 11: Sources updated');
    }

    // Update highlight color based on score
    this.updateHighlightColor(result.score);

    console.log('[Verification Popup] ✅ Display complete!');
  }

  /**
   * Get human-readable meaning for score
   */
  private getScoreMeaning(score: number): string {
    if (score >= 90) return '✓ Verified True - Matches established facts';
    if (score >= 75) return '✓ Mostly Accurate - Minor issues or lacks context';
    if (score >= 50) return '⚠ Mixed - Contains both accurate and inaccurate elements';
    if (score >= 25) return '✗ Mostly False - Contradicts established facts';
    return '✗ Demonstrably False - No credible evidence';
  }

  /**
   * Update the highlight color based on truthfulness score
   */
  private updateHighlightColor(score: number) {
    if (!this.currentElement) return;

    // Check if element has classList (manual verification might have a mock element)
    if (!this.currentElement.classList) {
      console.log('[Verification Popup] Skip color update for manual verification');
      return;
    }

    // Remove any existing verification classes
    this.currentElement.classList.remove(
      'verifeed-verified-high',
      'verifeed-verified-medium-high',
      'verifeed-verified-medium',
      'verifeed-verified-medium-low',
      'verifeed-verified-low'
    );

    // Add the appropriate class based on score
    const colorClass = this.getHighlightColorClass(score);
    this.currentElement.classList.add(colorClass);
    
    console.log(`[Verification Popup] Highlight color updated to ${colorClass} for score ${score}`);
  }

  /**
   * Get highlight color class based on score
   */
  private getHighlightColorClass(score: number): string {
    if (score >= 90) return 'verifeed-verified-high';        // Dark green (verified true)
    if (score >= 75) return 'verifeed-verified-medium-high'; // Light green (mostly accurate)
    if (score >= 50) return 'verifeed-verified-medium';      // Yellow (mixed)
    if (score >= 25) return 'verifeed-verified-medium-low';  // Orange (mostly false)
    return 'verifeed-verified-low';                          // Red (false)
  }

  /**
   * Get color class based on score (for popup score bar)
   */
  private getScoreClass(score: number): string {
    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  /**
   * Display error
   */
  private displayError(message: string) {
    if (!this.popup) return;

    this.popup.querySelector('.verifeed-popup-loading')!.setAttribute('style', 'display: none;');
    this.popup.querySelector('.verifeed-popup-result')!.setAttribute('style', 'display: none;');
    this.popup.querySelector('.verifeed-popup-error')!.setAttribute('style', 'display: block;');

    const errorMessage = this.popup.querySelector('.verifeed-error-message');
    if (errorMessage) {
      errorMessage.textContent = message;
    }
  }
}
