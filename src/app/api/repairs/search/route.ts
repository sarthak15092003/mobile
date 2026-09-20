import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const serialNumber = searchParams.get('serial_number')?.trim() || '';
    const repairId = searchParams.get('repair_id')?.trim() || '';
    const additionalId = searchParams.get('additional_id')?.trim() || '';

    // If specific parameter is provided or general query
    const terms: string[] = [];
    if (query) terms.push(query);
    if (serialNumber) terms.push(serialNumber);
    if (repairId) terms.push(repairId);
    if (additionalId) terms.push(additionalId);

    if (terms.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Build search conditions
    const orConditions = [];

    if (serialNumber) {
      orConditions.push({ serial_number: { equals: serialNumber, mode: 'insensitive' as const } });
    }
    if (repairId) {
      orConditions.push({ repair_id: { equals: repairId, mode: 'insensitive' as const } });
    }
    if (additionalId) {
      orConditions.push({ additional_id: { equals: additionalId, mode: 'insensitive' as const } });
    }
    if (query) {
      orConditions.push(
        { serial_number: { contains: query, mode: 'insensitive' as const } },
        { repair_id: { contains: query, mode: 'insensitive' as const } },
        { additional_id: { contains: query, mode: 'insensitive' as const } },
        { mobile_name: { contains: query, mode: 'insensitive' as const } },
        { problem: { contains: query, mode: 'insensitive' as const } }
      );
    }

    const results = await prisma.repair.findMany({
      where: { OR: orConditions },
      // Important: Sort newest first to see historical repair trajectory for the same device
      orderBy: [{ repair_date: 'desc' }, { created_at: 'desc' }],
      include: {
        assigned_to: { select: { id: true, name: true, email: true } },
        completed_by: { select: { id: true, name: true, email: true } },
        created_by: { select: { id: true, name: true, email: true } },
        history: {
          orderBy: { changed_at: 'desc' },
          take: 3,
          include: {
            changed_by: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed.' }, { status: 500 });
  }
}
