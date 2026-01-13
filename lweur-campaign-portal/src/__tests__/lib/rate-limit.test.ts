// src/__tests__/lib/rate-limit.test.ts
// Tests for rate limiting utility functions
// Ensures IP and email-based rate limiting works correctly
// RELEVANT FILES: src/lib/rate-limit.ts, src/app/api/payments/create-intent/route.ts

import {
  checkIPRateLimit,
  checkEmailRateLimit,
  checkPaymentRateLimit,
  resetRateLimits,
  RATE_LIMIT_CONFIGS,
} from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Reset rate limits before each test
    resetRateLimits();
  });

  describe('checkIPRateLimit', () => {
    it('should allow requests within the limit', () => {
      const ip = '192.168.1.1';
      const config = { windowMs: 60000, maxRequests: 3 };

      // First request should be allowed
      const result1 = checkIPRateLimit(ip, config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(2);

      // Second request should be allowed
      const result2 = checkIPRateLimit(ip, config);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(1);

      // Third request should be allowed
      const result3 = checkIPRateLimit(ip, config);
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it('should block requests exceeding the limit', () => {
      const ip = '192.168.1.2';
      const config = { windowMs: 60000, maxRequests: 2 };

      // Use up the limit
      checkIPRateLimit(ip, config);
      checkIPRateLimit(ip, config);

      // Next request should be blocked
      const result = checkIPRateLimit(ip, config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.reason).toBeDefined();
    });

    it('should track different IPs separately', () => {
      const ip1 = '192.168.1.3';
      const ip2 = '192.168.1.4';
      const config = { windowMs: 60000, maxRequests: 1 };

      // Use up limit for ip1
      checkIPRateLimit(ip1, config);

      // ip2 should still have quota
      const result = checkIPRateLimit(ip2, config);
      expect(result.allowed).toBe(true);

      // ip1 should be blocked
      const result2 = checkIPRateLimit(ip1, config);
      expect(result2.allowed).toBe(false);
    });
  });

  describe('checkEmailRateLimit', () => {
    it('should allow requests within the limit', () => {
      const email = 'test@example.com';
      const config = { windowMs: 60000, maxRequests: 2 };

      const result1 = checkEmailRateLimit(email, config);
      expect(result1.allowed).toBe(true);

      const result2 = checkEmailRateLimit(email, config);
      expect(result2.allowed).toBe(true);
    });

    it('should block requests exceeding the limit', () => {
      const email = 'blocked@example.com';
      const config = { windowMs: 60000, maxRequests: 1 };

      checkEmailRateLimit(email, config);

      const result = checkEmailRateLimit(email, config);
      expect(result.allowed).toBe(false);
    });

    it('should normalize email addresses (case insensitive)', () => {
      const email1 = 'Test@Example.COM';
      const email2 = 'test@example.com';
      const config = { windowMs: 60000, maxRequests: 1 };

      checkEmailRateLimit(email1, config);

      // Same email with different case should be blocked
      const result = checkEmailRateLimit(email2, config);
      expect(result.allowed).toBe(false);
    });
  });

  describe('Default Configurations', () => {
    it('should have appropriate payment rate limits', () => {
      expect(RATE_LIMIT_CONFIGS.paymentByIP.maxRequests).toBe(5);
      expect(RATE_LIMIT_CONFIGS.paymentByIP.windowMs).toBe(60 * 60 * 1000); // 1 hour

      expect(RATE_LIMIT_CONFIGS.paymentByEmail.maxRequests).toBe(10);
      expect(RATE_LIMIT_CONFIGS.paymentByEmail.windowMs).toBe(24 * 60 * 60 * 1000); // 24 hours
    });
  });
});
