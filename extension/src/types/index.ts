/**
 * Extension type definitions
 * Includes shared API types
 */

export type BiasLabel = 'left' | 'center' | 'right';

export interface PageContext {
  url: string;
  title: string;
  siteName?: string;
  surroundingText?: string; // Text before and after the claim
}

export interface VerificationRequest {
  text: string;
  context?: PageContext;
}

export interface VerificationResponse {
  score: number; // 0-100 truthfulness score with clear rubric
  bias: BiasLabel;
  biasConfidence: number; // 0-100
  explanation: string;
  sources: string[];
}

/**
 * Extension Settings
 */
export interface VerifeedSettings {
  // Global settings
  enabled: boolean;
  apiEndpoint: string;
  
  // Site-specific settings
  disabledSites: string[];  // Sites where extension is disabled (blocklist)
  
  // Display settings
  highlightOpacity: number; // 0-100
  autoVerify: boolean;      // Auto-verify on highlight (vs click to verify)
}

export const DEFAULT_SETTINGS: VerifeedSettings = {
  enabled: true,
  apiEndpoint: 'http://localhost:3000', // Change to your Vercel URL after deployment
  disabledSites: [],
  highlightOpacity: 30,
  autoVerify: false,
};
