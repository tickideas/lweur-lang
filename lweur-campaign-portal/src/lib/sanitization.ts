// src/lib/sanitization.ts
// Input sanitization utilities for user-provided text fields
// Prevents XSS attacks and ensures clean data storage
// RELEVANT FILES: checkout-settings/page.tsx, utils/index.ts, api/admin/checkout-settings/route.ts, auth.ts
/* eslint-disable no-control-regex, no-useless-escape */

/**
 * Sanitizes HTML strings by removing potentially dangerous elements and attributes
 * while preserving safe formatting
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers (onclick, onload, etc.)
    .replace(/\s*on\w+\s*=\s*[^>]*/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:[^"']*/gi, '')
    // Remove data: URLs (can be used for XSS)
    .replace(/data:[^"']*/gi, '')
    // Remove style attributes (can contain CSS-based XSS)
    .replace(/\s*style\s*=\s*[^>]*/gi, '')
    // Remove potentially dangerous tags
    .replace(/<(iframe|object|embed|form|input|textarea|button|link|meta)[^>]*>/gi, '')
    .replace(/<\/(iframe|object|embed|form|input|textarea|button|link|meta)>/gi, '');
}

/**
 * Sanitizes plain text input by removing control characters and normalizing whitespace
 * Suitable for titles, names, and general text content
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    // Remove null bytes and other control characters (except newlines and tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize Unicode (prevents homograph attacks)
    .normalize('NFKC')
    // Trim excessive whitespace
    .trim()
    // Replace multiple consecutive whitespace with single space
    .replace(/\s+/g, ' ');
}

/**
 * Sanitizes email addresses by removing dangerous characters
 * and validating basic format
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Remove dangerous characters that could be used for injection
    .replace(/[<>'"`;\\]/g, '')
    // Normalize to lowercase
    .toLowerCase()
    .trim();
}

/**
 * Sanitizes URLs by validating protocol and removing dangerous characters
 * Only allows http, https, and relative URLs
 */
export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') return '';

  const cleaned = input
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();

  // Allow relative URLs
  if (cleaned.startsWith('/') || cleaned.startsWith('./') || cleaned.startsWith('../')) {
    return cleaned;
  }

  // Only allow safe protocols
  const allowedProtocols = ['http:', 'https:'];
  try {
    const url = new URL(cleaned);
    if (!allowedProtocols.includes(url.protocol)) {
      return '';
    }
    return url.toString();
  } catch {
    // Invalid URL format
    return '';
  }
}

/**
 * Sanitizes CSS class names and Tailwind classes
 * Removes potentially dangerous CSS content while preserving valid Tailwind classes
 */
export function sanitizeCssClass(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Remove potentially dangerous CSS expressions
    .replace(/expression\s*\(/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    // Remove CSS comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Keep only valid CSS class characters
    .replace(/[^a-zA-Z0-9\-_\s\[\]#%:.\/]/g, '')
    .trim()
    // Normalize whitespace
    .replace(/\s+/g, ' ');
}

/**
 * Sanitizes numeric input by ensuring it's a valid number
 * and within reasonable bounds
 */
export function sanitizeNumber(input: unknown, min?: number, max?: number): number {
  if (typeof input === 'number' && !isNaN(input)) {
    const num = input;
    if (min !== undefined && num < min) return min;
    if (max !== undefined && num > max) return max;
    return num;
  }

  if (typeof input === 'string') {
    const parsed = parseFloat(input.replace(/[^0-9.-]/g, ''));
    if (!isNaN(parsed)) {
      if (min !== undefined && parsed < min) return min;
      if (max !== undefined && parsed > max) return max;
      return parsed;
    }
  }

  return min || 0;
}

/**
 * Sanitizes array input by filtering out invalid entries
 */
export function sanitizeArray<T>(
  input: unknown,
  sanitizer: (item: unknown) => T | null,
  minLength = 0
): T[] {
  if (!Array.isArray(input)) return [];

  const sanitized = input
    .map(sanitizer)
    .filter((item): item is T => item !== null);

  // Ensure minimum length
  if (sanitized.length < minLength) {
    return [];
  }

  return sanitized;
}

/**
 * Sanitizes boolean input
 */
export function sanitizeBoolean(input: unknown): boolean {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'string') {
    const lower = input.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  if (typeof input === 'number') return input !== 0;
  return false;
}

/**
 * Comprehensive sanitization for checkout settings data
 */
export interface CheckoutSettingsInput {
  availableCurrencies?: unknown;
  defaultCurrency?: unknown;
  adoptLanguageDefaultAmount?: unknown;
  adoptLanguagePresetAmounts?: unknown;
  adoptLanguageMinAmount?: unknown;
  adoptLanguageMaxAmount?: unknown;
  sponsorTranslationDefaultAmount?: unknown;
  sponsorTranslationPresetAmounts?: unknown;
  sponsorTranslationMinAmount?: unknown;
  sponsorTranslationMaxAmount?: unknown;
  generalDonationDefaultAmount?: unknown;
  generalDonationPresetAmounts?: unknown;
  generalDonationMinAmount?: unknown;
  generalDonationMaxAmount?: unknown;
  showOneTimeOption?: unknown;
  requirePhone?: unknown;
  requireOrganization?: unknown;
  hearFromUsOptions?: unknown;
  checkoutTitle?: unknown;
  checkoutSubtitle?: unknown;
  heroEnabled?: unknown;
  heroTitle?: unknown;
  heroSubtitle?: unknown;
  heroBackgroundColor?: unknown;
  heroTextColor?: unknown;
}

export function sanitizeCheckoutSettings(input: CheckoutSettingsInput) {
  return {
    availableCurrencies: sanitizeArray(
      input.availableCurrencies,
      (item) => {
        if (typeof item === 'string') {
          const sanitized = sanitizeText(item).toUpperCase();
          // Only allow known currency codes
          const validCurrencies = ['GBP', 'EUR', 'USD', 'CHF', 'NOK', 'SEK', 'DKK'];
          return validCurrencies.includes(sanitized) ? sanitized : null;
        }
        return null;
      },
      1
    ),
    defaultCurrency: (() => {
      if (typeof input.defaultCurrency === 'string') {
        const sanitized = sanitizeText(input.defaultCurrency).toUpperCase();
        const validCurrencies = ['GBP', 'EUR', 'USD', 'CHF', 'NOK', 'SEK', 'DKK'];
        return validCurrencies.includes(sanitized) ? sanitized : 'GBP';
      }
      return 'GBP';
    })(),
    adoptLanguageDefaultAmount: sanitizeNumber(input.adoptLanguageDefaultAmount, 100, 1000000),
    adoptLanguagePresetAmounts: sanitizeArray(
      input.adoptLanguagePresetAmounts,
      (item) => {
        const num = sanitizeNumber(item, 100, 1000000);
        return num >= 100 ? num : null;
      },
      1
    ),
    adoptLanguageMinAmount: sanitizeNumber(input.adoptLanguageMinAmount, 100, 100000),
    adoptLanguageMaxAmount: sanitizeNumber(input.adoptLanguageMaxAmount, 1000, 10000000),
    sponsorTranslationDefaultAmount: sanitizeNumber(input.sponsorTranslationDefaultAmount, 100, 1000000),
    sponsorTranslationPresetAmounts: sanitizeArray(
      input.sponsorTranslationPresetAmounts,
      (item) => {
        const num = sanitizeNumber(item, 100, 1000000);
        return num >= 100 ? num : null;
      },
      1
    ),
    sponsorTranslationMinAmount: sanitizeNumber(input.sponsorTranslationMinAmount, 100, 100000),
    sponsorTranslationMaxAmount: sanitizeNumber(input.sponsorTranslationMaxAmount, 1000, 10000000),
    generalDonationDefaultAmount: sanitizeNumber(input.generalDonationDefaultAmount, 100, 1000000),
    generalDonationPresetAmounts: sanitizeArray(
      input.generalDonationPresetAmounts,
      (item) => {
        const num = sanitizeNumber(item, 100, 1000000);
        return num >= 100 ? num : null;
      },
      1
    ),
    generalDonationMinAmount: sanitizeNumber(input.generalDonationMinAmount, 100, 100000),
    generalDonationMaxAmount: sanitizeNumber(input.generalDonationMaxAmount, 1000, 10000000),
    showOneTimeOption: sanitizeBoolean(input.showOneTimeOption),
    requirePhone: sanitizeBoolean(input.requirePhone),
    requireOrganization: sanitizeBoolean(input.requireOrganization),
    hearFromUsOptions: sanitizeArray(
      input.hearFromUsOptions,
      (item) => {
        if (typeof item === 'string') {
          const sanitized = sanitizeText(item);
          return sanitized.length > 0 && sanitized.length <= 50 ? sanitized : null;
        }
        return null;
      },
      1
    ),
    checkoutTitle: sanitizeText(String(input.checkoutTitle || '')).substring(0, 200),
    checkoutSubtitle: sanitizeText(String(input.checkoutSubtitle || '')).substring(0, 500),
    heroEnabled: sanitizeBoolean(input.heroEnabled),
    heroTitle: sanitizeText(String(input.heroTitle || '')).substring(0, 100),
    heroSubtitle: sanitizeText(String(input.heroSubtitle || '')).substring(0, 200),
    heroBackgroundColor: sanitizeCssClass(String(input.heroBackgroundColor || '')).substring(0, 100),
    heroTextColor: sanitizeCssClass(String(input.heroTextColor || '')).substring(0, 50),
  };
}