// src/lib/anti-bot.ts
// Anti-bot protection utilities for form submissions
// Provides honeypot validation, timestamp checks, and HMAC token generation/validation
// RELEVANT FILES: src/app/api/payments/create-intent/route.ts, src/app/api/testimonials/submit/route.ts

import crypto from 'crypto';
import { z } from 'zod';

// Token expiration time (10 minutes)
const TOKEN_EXPIRY_MS = 10 * 60 * 1000;

// Small future tolerance for clock skew (10 seconds)
const FUTURE_TOLERANCE_MS = 10 * 1000;

/**
 * Get the secret used for HMAC token generation
 */
function getSecret(): string {
  return process.env.NEXTAUTH_SECRET || process.env.ANTI_BOT_SECRET || 'fallback-anti-bot-secret';
}

/**
 * Generate a secure anti-bot token
 * Returns both the token and the timestamp it was generated at
 */
export function generateAntiBotToken(): { token: string; timestamp: number } {
  const timestamp = Date.now();
  const secret = getSecret();

  const token = crypto
    .createHmac('sha256', secret)
    .update(`payment-${timestamp}`)
    .digest('hex')
    .slice(0, 32);

  return { token, timestamp };
}

/**
 * Validate an anti-bot token
 * Checks that the token matches the expected HMAC and is within the valid time window
 */
export function validateAntiBotToken(token: string, timestamp: number): boolean {
  const now = Date.now();

  // Check timestamp is within valid window
  const minTime = now - TOKEN_EXPIRY_MS;
  const maxTime = now + FUTURE_TOLERANCE_MS;

  if (timestamp < minTime || timestamp > maxTime) {
    return false;
  }

  // Regenerate expected token and compare
  const secret = getSecret();
  const expectedToken = crypto
    .createHmac('sha256', secret)
    .update(`payment-${timestamp}`)
    .digest('hex')
    .slice(0, 32);

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(expectedToken)
    );
  } catch {
    // If buffers are different lengths, comparison fails
    return false;
  }
}

/**
 * Validate honeypot field - must be empty
 */
export function validateHoneypot(honeypot: string): boolean {
  return honeypot === '' || honeypot === undefined || honeypot === null;
}

/**
 * Combined anti-bot validation result
 */
export interface AntiBotValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Perform full anti-bot validation
 */
export function validateAntiBot(data: {
  honeypot?: string;
  token?: string;
  timestamp?: number;
}): AntiBotValidationResult {
  // Validate honeypot (if provided, must be empty)
  if (data.honeypot !== undefined && data.honeypot !== '' && data.honeypot !== null) {
    return {
      valid: false,
      error: 'Invalid submission detected',
    };
  }

  // Validate token and timestamp (both required)
  if (!data.token || !data.timestamp) {
    return {
      valid: false,
      error: 'Missing security token',
    };
  }

  if (!validateAntiBotToken(data.token, data.timestamp)) {
    return {
      valid: false,
      error: 'Invalid or expired security token',
    };
  }

  return { valid: true };
}

/**
 * Zod schema additions for anti-bot fields
 * Use these with .extend() on your existing schemas
 */
export const antiBotSchema = z.object({
  honeypot: z.string().max(0, 'Invalid submission').optional().default(''),
  timestamp: z.number().int(),
  token: z.string().min(32),
});

/**
 * Optional anti-bot schema - for backwards compatibility during rollout
 * Accepts requests without anti-bot fields but validates if present
 */
export const optionalAntiBotSchema = z.object({
  honeypot: z.string().max(0, 'Invalid submission').optional(),
  timestamp: z.number().int().optional(),
  token: z.string().min(32).optional(),
});
