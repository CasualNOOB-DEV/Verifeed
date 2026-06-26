/**
 * Backend type definitions
 * Re-exports shared types for use in backend
 */

export type BiasLabel = 'left' | 'center' | 'right';

export interface PageContext {
  url: string;
  title: string;
  siteName?: string;
  surroundingText?: string;
}

export interface VerificationRequest {
  text: string;
  context?: PageContext;
}

export interface VerificationResponse {
  score: number; // 0-100, higher = more truthful
  bias: BiasLabel;
  biasConfidence: number; // 0-100
  explanation: string;
  sources: string[];
}
