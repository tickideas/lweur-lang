import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await prisma.partner.findMany({
      select: { country: true },
      distinct: ['country'],
      orderBy: { country: 'asc' },
    });

    // Filter out empty/invalid entries, just in case
    const countries = rows.map((r) => r.country).filter(Boolean);
    return NextResponse.json({ countries });
  } catch (err) {
    console.error('Countries API error', err);
    return NextResponse.json({ error: 'Failed to load countries' }, { status: 500 });
  }
}

