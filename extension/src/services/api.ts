/**
 * API Service
 * Routes API calls through background script (required for cross-origin requests)
 */

import { VerificationResponse, PageContext } from '../types';

export class ApiService {
  /**
   * Verify a claim via the backend API.
   * Routes through background script which has host_permissions for localhost.
   */
  async verifyClaim(text: string, context?: PageContext): Promise<VerificationResponse> {
    return new Promise((resolve, reject) => {
      // Send message to background script which will make the actual API call
      chrome.runtime.sendMessage(
        { action: 'verifyClaim', text, context },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('[API Service] Chrome runtime error:', chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message || 'Extension error'));
            return;
          }

          if (!response) {
            reject(new Error('No response from background script'));
            return;
          }

          if (response.success && response.data) {
            resolve(response.data);
          } else {
            reject(new Error(response.error || 'API request failed'));
          }
        }
      );
    });
  }

  /**
   * Check if API is available
   */
  async healthCheck(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'healthCheck' }, (response) => {
        resolve(response?.success ?? false);
      });
    });
  }
}
