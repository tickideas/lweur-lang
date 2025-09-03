// src/app/api/admin/impact/[id]/route.ts
// Admin API endpoints for individual impact story operations (GET, PUT, DELETE)
// Handles single impact story management by ID for admin users
// RELEVANT FILES: src/app/api/admin/impact/route.ts, src/app/admin/impact/page.tsx, prisma/schema.prisma

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateImpactStorySchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required').optional(),
  authorName: z.string().min(1, 'Author name is required').optional(),
  location: z.string().optional(),
  email: z.string().email().optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isApproved: z.boolean().optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().datetime().optional(),
  displayOrder: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional().or(z.literal(''))
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const impactStory = await prisma.impactStory.findUnique({
      where: { id: params.id }
    });

    if (!impactStory) {
      return NextResponse.json({ error: 'Impact story not found' }, { status: 404 });
    }

    return NextResponse.json(impactStory);
  } catch (error) {
    console.error('Error fetching impact story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateImpactStorySchema.parse(body);

    // If setting as featured, unfeature all others
    if (validatedData.isFeatured === true) {
      await prisma.impactStory.updateMany({
        where: { 
          isFeatured: true,
          NOT: { id: params.id }
        },
        data: { isFeatured: false }
      });
    }

    // Handle empty string for imageUrl (convert to null) and date conversion
    const updateData = {
      ...validatedData,
      imageUrl: validatedData.imageUrl === '' ? null : validatedData.imageUrl,
      approvedAt: validatedData.approvedAt ? new Date(validatedData.approvedAt) : undefined
    };

    const impactStory = await prisma.impactStory.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json(impactStory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    console.error('Error updating impact story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'CAMPAIGN_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await prisma.impactStory.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Impact story deleted successfully' });
  } catch (error) {
    console.error('Error deleting impact story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}