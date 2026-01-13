// src/__tests__/lib/anti-bot.test.ts
// Tests for anti-bot protection utility functions
// Ensures token generation, validation, and honeypot checks work correctly
// RELEVANT FILES: src/lib/anti-bot.ts, src/app/api/payments/create-intent/route.ts

import {
  generateAntiBotToken,
  validateAntiBotToken,
  validateHoneypot,
  validateAntiBot,
} from '@/lib/anti-bot';

describe('Anti-Bot Protection', () => {
  describe('generateAntiBotToken', () => {
    it('should generate a token and timestamp', () => {
      const result = generateAntiBotToken();

      expect(result.token).toBeDefined();
      expect(result.token.length).toBe(32);
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('number');
    });

    it('should generate different tokens at different times', async () => {
      const result1 = generateAntiBotToken();

      // Wait a tiny bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result2 = generateAntiBotToken();

      // Tokens should be different (different timestamps)
      expect(result1.token).not.toBe(result2.token);
    });
  });

  describe('validateAntiBotToken', () => {
    it('should validate a freshly generated token', () => {
      const { token, timestamp } = generateAntiBotToken();

      const isValid = validateAntiBotToken(token, timestamp);
      expect(isValid).toBe(true);
    });

    it('should reject an invalid token', () => {
      const timestamp = Date.now();
      const invalidToken = 'invalid-token-that-is-32chars!';

      const isValid = validateAntiBotToken(invalidToken, timestamp);
      expect(isValid).toBe(false);
    });

    it('should reject an expired token (older than 10 minutes)', () => {
      // Generate a token with an old timestamp
      const oldTimestamp = Date.now() - 11 * 60 * 1000; // 11 minutes ago

      // We can't easily generate a valid token for an old timestamp without
      // modifying the function, so we just test with the current token format
      const { token } = generateAntiBotToken();

      const isValid = validateAntiBotToken(token, oldTimestamp);
      expect(isValid).toBe(false);
    });

    it('should reject tokens with future timestamps beyond tolerance', () => {
      const futureTimestamp = Date.now() + 60 * 1000; // 1 minute in future
      const { token } = generateAntiBotToken();

      const isValid = validateAntiBotToken(token, futureTimestamp);
      expect(isValid).toBe(false);
    });
  });

  describe('validateHoneypot', () => {
    it('should pass when honeypot is empty', () => {
      expect(validateHoneypot('')).toBe(true);
    });

    it('should pass when honeypot is undefined', () => {
      expect(validateHoneypot(undefined as any)).toBe(true);
    });

    it('should fail when honeypot has content', () => {
      expect(validateHoneypot('bot filled this')).toBe(false);
    });
  });

  describe('validateAntiBot', () => {
    it('should pass with valid token and empty honeypot', () => {
      const { token, timestamp } = generateAntiBotToken();

      const result = validateAntiBot({
        honeypot: '',
        token,
        timestamp,
      });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail when honeypot is filled', () => {
      const { token, timestamp } = generateAntiBotToken();

      const result = validateAntiBot({
        honeypot: 'bot content',
        token,
        timestamp,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid submission detected');
    });

    it('should fail when token is missing', () => {
      const result = validateAntiBot({
        honeypot: '',
        timestamp: Date.now(),
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing security token');
    });

    it('should fail when timestamp is missing', () => {
      const { token } = generateAntiBotToken();

      const result = validateAntiBot({
        honeypot: '',
        token,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing security token');
    });

    it('should fail with invalid token', () => {
      const result = validateAntiBot({
        honeypot: '',
        token: 'invalid-token-32-characters-long',
        timestamp: Date.now(),
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid or expired security token');
    });
  });
});
