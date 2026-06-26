/**
 * Shared types between extension and backend
 * This is the contract for the API
 */
export type BiasLabel = 'left' | 'center' | 'right';
export interface VerificationRequest {
    text: string;
}
export interface VerificationResponse {
    score: number;
    bias: BiasLabel;
    biasConfidence: number;
    explanation: string;
    sources: string[];
}
//# sourceMappingURL=index.d.ts.map