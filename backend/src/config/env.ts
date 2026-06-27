/**
 * Environment Configuration
 * MUST be imported first before any other modules that use env vars
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load .env from backend root
const envPath = join(__dirname, '..', '..', '.env');
const result = config({ path: envPath });

if (result.error) {
  console.error('[ENV] ❌ Failed to load .env:', result.error.message);
} else {
  console.log('[ENV] ✓ Loaded .env from:', envPath);
}

// Log critical env vars for debugging
console.log('[ENV] ENABLE_AI =', process.env.ENABLE_AI);
console.log('[ENV] GROQ_API_KEY =', process.env.GROQ_API_KEY ? '***SET***' : 'MISSING');
console.log('[ENV] PORT =', process.env.PORT || '3000');

// Export for verification
export const ENV_LOADED = true;
