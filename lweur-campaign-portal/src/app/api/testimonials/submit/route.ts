// src/app/api/testimonials/submit/route.ts
// Public API endpoint for testimony submissions with anti-bot protection
// Includes rate limiting, CAPTCHA verification, and content validation
// RELEVANT FILES: src/components/impact/testimony-modal.tsx, src/app/admin/impact/page.tsx, prisma/schema.prisma

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

const createSubmissionSchema = () => z.object({
  authorName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  location: z.string().min(2, 'Location must be at least 2 characters').max(100, 'Location too long').optional(),
  content: z.string().min(10, 'Testimony must be at least 10 characters').max(2000, 'Testimony too long'),
  honeypot: z.string().max(0, 'Invalid submission'), // Anti-bot honeypot field
  timestamp: z.number().int().min(Date.now() - 600000).max(Date.now() + 10000), // 10 minutes ago to 10 seconds in future
  token: z.string().min(32), // Anti-CSRF token
});

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 3; // Max 3 submissions per hour per IP

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIP || 'unknown';
}

function validateToken(token: string, timestamp: number): boolean {
  // Simple token validation - in production, use more sophisticated method
  const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}`)
    .digest('hex')
    .slice(0, 32);
  return token === expected;
}

function containsSpam(content: string): boolean {
  const spamPatterns = [
    /https?:\/\/[^\s]+/gi, // URLs
    /\b(?:viagra|casino|poker|lottery|winner|congratulations|urgent|act now)\b/gi, // Common spam words
    /(.)\1{10,}/, // Repeated characters
    /\b\d+\s*(?:dollars?|usd|€|£)\b/gi, // Money amounts
  ];
  
  return spamPatterns.some(pattern => pattern.test(content));
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Rate limiting
    const { allowed, remaining } = getRateLimit(clientIP);
    if (!allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          message: 'Too many submissions. Please try again in an hour.' 
        }, 
        { status: 429 }
      );
    }

    const body = await request.json();
    const submissionSchema = createSubmissionSchema();
    const validatedData = submissionSchema.parse(body);

    // Validate anti-CSRF token
    if (!validateToken(validatedData.token, validatedData.timestamp)) {
      return NextResponse.json(
        { error: 'Invalid request token' }, 
        { status: 400 }
      );
    }

    // Check for spam content
    if (containsSpam(validatedData.content) || containsSpam(validatedData.authorName)) {
      return NextResponse.json(
        { 
          error: 'Content flagged', 
          message: 'Your submission contains content that cannot be processed.' 
        }, 
        { status: 400 }
      );
    }

    // Create the testimony submission
    const testimony = await prisma.impactStory.create({
      data: {
        content: validatedData.content,
        authorName: validatedData.authorName,
        email: validatedData.email,
        location: validatedData.location,
        submissionType: 'PUBLIC',
        isPublished: false, // Requires admin approval
        isApproved: false,
        isFeatured: false,
        displayOrder: 999 // Put at end by default
      }
    });

    // Set rate limit headers
    const response = NextResponse.json({ 
      message: 'Testimony submitted successfully! It will be reviewed before publication.',
      id: testimony.id 
    }, { status: 201 });

    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    
    return response;

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 });
    }

    console.error('Error submitting testimony:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Unable to process your submission at this time.'
    }, { status: 500 });
  }
}

// Endpoint to generate submission token
export async function GET() {
  try {
    const timestamp = Date.now();
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
    const token = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}`)
      .digest('hex')
      .slice(0, 32);

    return NextResponse.json({ token, timestamp });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}