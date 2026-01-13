// src/lib/rate-limit.ts
// In-memory rate limiting utility for API endpoints
// Provides IP-based and key-based rate limiting to prevent spam and abuse
// RELEVANT FILES: src/app/api/payments/create-intent/route.ts, src/app/api/testimonials/submit/route.ts

import { NextRequest } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory stores for different rate limit types
const ipRateLimitMap = new Map<string, RateLimitRecord>();
const emailRateLimitMap = new Map<string, RateLimitRecord>();

// Clean up old entries periodically (every 10 minutes)
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

function cleanupOldEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;

  for (const [key, record] of ipRateLimitMap.entries()) {
    if (now > record.resetTime) {
      ipRateLimitMap.delete(key);
    }
  }

  for (const [key, record] of emailRateLimitMap.entries()) {
    if (now > record.resetTime) {
      emailRateLimitMap.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  reason?: string;
}

export interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

// Default configurations
export const RATE_LIMIT_CONFIGS = {
  // Payment endpoints - stricter limits
  paymentByIP: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 5,            // 5 attempts per IP per hour
  },
  paymentByEmail: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 10,               // 10 attempts per email per day
  },
  // General API - more lenient
  generalByIP: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 60,      // 60 requests per minute
  },
} as const;

/**
 * Check rate limit for a given key
 */
function checkRateLimit(
  key: string,
  store: Map<string, RateLimitRecord>,
  config: RateLimitConfig
): RateLimitResult {
  cleanupOldEntries();

  const now = Date.now();
  const record = store.get(key);

  // First request or window expired
  if (!record || now > record.resetTime) {
    store.set(key, { count: 1, resetTime: now + config.windowMs });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Check if limit exceeded
  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      reason: `Rate limit exceeded. Try again in ${Math.ceil((record.resetTime - now) / 60000)} minutes.`,
    };
  }

  // Increment counter
  record.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  // Cloudflare provides the real IP in cf-connecting-ip
  if (cfConnectingIP) return cfConnectingIP;

  // x-forwarded-for can contain multiple IPs, take the first
  if (forwarded) return forwarded.split(',')[0].trim();

  if (realIP) return realIP;

  return 'unknown';
}

/**
 * Check rate limit by IP address
 */
export function checkIPRateLimit(
  ip: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.paymentByIP
): RateLimitResult {
  return checkRateLimit(ip, ipRateLimitMap, config);
}

/**
 * Check rate limit by email address
 */
export function checkEmailRateLimit(
  email: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.paymentByEmail
): RateLimitResult {
  const normalizedEmail = email.toLowerCase().trim();
  return checkRateLimit(normalizedEmail, emailRateLimitMap, config);
}

/**
 * Combined rate limit check for payment endpoints
 * Checks both IP and email limits
 */
export function checkPaymentRateLimit(
  request: NextRequest,
  email: string
): RateLimitResult {
  const ip = getClientIP(request);

  // Check IP limit first
  const ipResult = checkIPRateLimit(ip);
  if (!ipResult.allowed) {
    return {
      ...ipResult,
      reason: 'Too many payment attempts from this location. Please try again later.',
    };
  }

  // Check email limit
  const emailResult = checkEmailRateLimit(email);
  if (!emailResult.allowed) {
    return {
      ...emailResult,
      reason: 'Too many payment attempts with this email. Please try again later.',
    };
  }

  // Return the more restrictive remaining count
  return {
    allowed: true,
    remaining: Math.min(ipResult.remaining, emailResult.remaining),
    resetTime: Math.max(ipResult.resetTime, emailResult.resetTime),
  };
}

/**
 * Reset rate limit for testing purposes
 */
export function resetRateLimits(): void {
  ipRateLimitMap.clear();
  emailRateLimitMap.clear();
}
