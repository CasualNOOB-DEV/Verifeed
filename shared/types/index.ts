/**
 * Shared types between extension and backend
 * This is the contract for the API
 */

export type BiasLabel = 'left' | 'center' | 'right';

export interface VerificationRequest {
  text: string;
}

export interface VerificationResponse {
  score: number; // 0-100, higher = more truthful
  bias: BiasLabel;
  biasConfidence: number; // 0-100
  explanation: string;
  sources: string[];
}
