// src/app/api/impact/route.ts
// Public API endpoint for fetching published impact stories
// Returns only published impact stories for display on public pages
// RELEVANT FILES: src/app/impact/page.tsx, src/app/page.tsx, src/components/impact/impact-card.tsx

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const impactStories = await prisma.impactStory.findMany({
      where: { 
        isPublished: true,
        isApproved: true // Only show approved stories
      },
      orderBy: [
        { isFeatured: 'desc' }, // Featured stories first
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        content: true,
        authorName: true,
        location: true,
        isFeatured: true,
        imageUrl: true,
        createdAt: true
      }
    });

    return NextResponse.json(impactStories);
  } catch (error) {
    console.error('Error fetching published impact stories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}