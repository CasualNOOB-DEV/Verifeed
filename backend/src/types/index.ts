/**
 * Backend type definitions
 * Re-exports shared types for use in backend
 */

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
  explanation: string;
  sources: string[];
  evidence: string; // Detailed evidence supporting the verdict
}
