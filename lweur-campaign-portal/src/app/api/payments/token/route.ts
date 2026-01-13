// src/app/api/payments/token/route.ts
// API endpoint to generate anti-bot tokens for payment forms
// Returns a secure HMAC token and timestamp for form submission validation
// RELEVANT FILES: src/lib/anti-bot.ts, src/app/api/payments/create-intent/route.ts

import { NextResponse } from 'next/server';
import { generateAntiBotToken } from '@/lib/anti-bot';

/**
 * GET /api/payments/token
 * Generates a secure anti-bot token for payment form submissions
 */
export async function GET() {
  try {
    const { token, timestamp } = generateAntiBotToken();

    return NextResponse.json({
      token,
      timestamp,
      expiresIn: 600, // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Error generating payment token:', error);
    return NextResponse.json(
      { error: 'Failed to generate security token' },
      { status: 500 }
    );
  }
}
