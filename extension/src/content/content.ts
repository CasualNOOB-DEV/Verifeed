/**
 * Content Script - Main Entry Point
 * Runs on every webpage and orchestrates claim detection and verification
 */

import { Highlighter } from './highlighter';
import { VerificationPopup } from '../components/verification-popup';
import { VerifeedSettings } from '../types';

class VerifeedContent {
  private highlighter: Highlighter | null = null;
  private popup: VerificationPopup | null = null;
  private enabled: boolean = true;
  private initialized: boolean = false;

  constructor() {
    console.log('[Verifeed] Initializing Verifeed content script...');
    this.checkEnabledAndInit();
  }

  /**
   * Check if extension is enabled for this site before initializing
   */
  private async checkEnabledAndInit() {
    try {
      // Ask background script if we should be enabled
      const response = await this.sendMessage({ action: 'checkEnabled' });
      
      if (!response.enabled) {
        console.log('[Verifeed] Extension disabled for this site');
        this.enabled = false;
        return;
      }

      this.enabled = true;
      this.init();
    } catch (error) {
      console.error('[Verifeed] Failed to check enabled status:', error);
      // Default to enabled if we can't check
      this.init();
    }
  }

  /**
   * Send message to background script
   */
  private sendMessage(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Initialize the content script
   */
  private init() {
    if (this.initialized) return;
    this.initialized = true;

    console.log('[Verifeed] Content script initialized');
    console.log('[Verifeed] Page URL:', window.location.href);

    // Create components
    this.highlighter = new Highlighter();
    this.popup = new VerificationPopup();

    // Wait for page to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'settingsUpdated') {
        this.handleSettingsUpdate(message.settings, message.enabled);
        sendResponse({ success: true });
      }
      
      if (message.action === 'verifySelection') {
        console.log('[Verifeed] Received manual verification request:', message.text.substring(0, 50));
        this.handleManualVerification(message.text);
        sendResponse({ success: true });
      }
      
      return true;
    });
  }

  /**
   * Handle settings updates from background
   */
  private handleSettingsUpdate(settings: VerifeedSettings, enabled: boolean) {
    const wasEnabled = this.enabled;
    this.enabled = enabled;

    console.log('[Verifeed] Settings updated, enabled:', enabled);

    if (wasEnabled && !enabled) {
      // Disable: remove all highlights
      this.removeAllHighlights();
    } else if (!wasEnabled && enabled && !this.initialized) {
      // Enable: initialize if not already done
      this.init();
    } else if (!wasEnabled && enabled && this.initialized) {
      // Re-enable: rescan page
      this.start();
    }
  }

  /**
   * Remove all Verifeed highlights from the page
   */
  private removeAllHighlights() {
    const highlights = document.querySelectorAll('.verifeed-claim-highlight');
    highlights.forEach(highlight => {
      const text = highlight.textContent || '';
      const textNode = document.createTextNode(text);
      highlight.parentNode?.replaceChild(textNode, highlight);
    });

    // Remove popup
    const popup = document.getElementById('verifeed-popup');
    popup?.remove();

    console.log('[Verifeed] All highlights removed');
  }

  /**
   * Handle manual verification from context menu
   */
  private handleManualVerification(text: string) {
    if (!this.popup) {
      console.error('[Verifeed] Popup not initialized');
      return;
    }

    // Create a temporary element to position the popup
    const selection = window.getSelection();
    let rect: DOMRect;
    
    if (selection && selection.rangeCount > 0) {
      rect = selection.getRangeAt(0).getBoundingClientRect();
    } else {
      // Fallback to center of screen
      rect = new DOMRect(window.innerWidth / 2, window.innerHeight / 2, 0, 0);
    }

    // Dispatch event to show popup (reuse existing popup component)
    const event = new CustomEvent('verifeed:claim-clicked', {
      detail: {
        id: 'manual-' + Date.now(),
        text: text,
        element: {
          getBoundingClientRect: () => rect
        },
        surroundingText: text, // Use the selected text itself as context
        pageContext: {
          url: window.location.href,
          title: document.title,
          siteName: this.extractSiteName(),
        },
      },
    });
    document.dispatchEvent(event);
  }

  /**
   * Extract site name from meta tags or URL
   */
  private extractSiteName(): string {
    const ogSiteName = document.querySelector('meta[property="og:site_name"]');
    if (ogSiteName) {
      return ogSiteName.getAttribute('content') || '';
    }
    
    const appName = document.querySelector('meta[name="application-name"]');
    if (appName) {
      return appName.getAttribute('content') || '';
    }
    
    return window.location.hostname.replace('www.', '');
  }

  /**
   * Start scanning the page
   */
  private start() {
    if (!this.enabled) {
      console.log('[Verifeed] Extension is disabled, skipping scan');
      return;
    }

    if (!this.highlighter) {
      console.log('[Verifeed] Highlighter not initialized');
      return;
    }

    console.log('[Verifeed] Starting page scan...');
    
    // Small delay to let page settle
    setTimeout(() => {
      console.log('[Verifeed] Beginning claim detection...');
      this.highlighter?.init();
    }, 500);
  }
}

// Initialize when script loads
new VerifeedContent();
