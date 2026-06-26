/**
 * Verify Route
 * POST /verify - Verify a factual claim
 */

import { Router, Request, Response } from 'express';
import { VerificationService } from '../services/verification';
import { VerificationRequest, VerificationResponse } from '../types';

const router = Router();
const verificationService = new VerificationService();

/**
 * POST /verify
 * Verify a claim and return analysis
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { text, context } = req.body as VerificationRequest;

    // Validate input
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Text field is required and must be a string',
      });
    }

    if (text.length < 10) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Text must be at least 10 characters',
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Text must be less than 1000 characters',
      });
    }

    // Verify the claim with optional context
    const result: VerificationResponse = await verificationService.verifyClaim(text, context);

    console.log('[Verify Route] Sending response:', JSON.stringify(result));
    
    // Return result with explicit headers and end
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', Buffer.byteLength(JSON.stringify(result)));
    res.status(200).send(result);
    console.log('[Verify Route] Response sent and ended');

  } catch (error) {
    console.error('[Verify Route] Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process verification request',
    });
  }
});

/**
 * GET /verify (for testing)
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Verifeed API - Verification endpoint',
    usage: 'POST /verify with { "text": "claim to verify" }',
    version: '0.1.0',
    phase: 2,
  });
});

export default router;
