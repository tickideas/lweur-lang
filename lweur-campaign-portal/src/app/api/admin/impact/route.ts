// src/app/api/admin/impact/route.ts
// Admin API endpoints for impact story management (CRUD operations)
// Allows admin users to create, read, update, and delete impact testimonials
// RELEVANT FILES: src/app/admin/impact/page.tsx, src/types/impact.ts, prisma/schema.prisma

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createImpactStorySchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  authorName: z.string().min(1, 'Author name is required'),
  location: z.string().optional(),
  email: z.string().email().optional(),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  displayOrder: z.number().int().positive().default(1),
  imageUrl: z.string().url().optional()
});


export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const impactStories = await prisma.impactStory.findMany({
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(impactStories);
  } catch (error) {
    console.error('Error fetching impact stories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createImpactStorySchema.parse(body);

    // If setting as featured, unfeature all others
    if (validatedData.isFeatured) {
      await prisma.impactStory.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false }
      });
    }

    const impactStory = await prisma.impactStory.create({
      data: {
        ...validatedData,
        submissionType: 'ADMIN',
        isApproved: true, // Admin-created stories are automatically approved
      }
    });

    return NextResponse.json(impactStory, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    
    console.error('Error creating impact story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}