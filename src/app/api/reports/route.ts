import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { RepairStatus, Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get('date_from')?.trim();
    const dateTo = searchParams.get('date_to')?.trim();
    const technicianId = searchParams.get('technician_id')?.trim();
    const createdById = searchParams.get('created_by_id')?.trim();
    const status = searchParams.get('status')?.trim() as RepairStatus | undefined;

    const where: Prisma.RepairWhereInput = {};

    if (status && Object.values(RepairStatus).includes(status)) {
      where.status = status;
    }

    if (technicianId) {
      where.assigned_to_id = technicianId;
    }

    if (createdById) {
      where.created_by_id = createdById;
    }

    if (dateFrom || dateTo) {
      where.repair_date = {};
      if (dateFrom) {
        where.repair_date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        where.repair_date.lte = to;
      }
    }

    // Parallel aggregate queries directly in PostgreSQL
    const [
      totalCount,
      pendingCount,
      inProcessCount,
      completedCount,
      cancelledCount,
      recentRepairs,
      technicianBreakdown,
    ] = await Promise.all([
      prisma.repair.count({ where }),
      prisma.repair.count({ where: { ...where, status: RepairStatus.PENDING } }),
      prisma.repair.count({ where: { ...where, status: RepairStatus.IN_PROCESS } }),
      prisma.repair.count({ where: { ...where, status: RepairStatus.COMPLETED } }),
      prisma.repair.count({ where: { ...where, status: RepairStatus.CANCELLED } }),
      prisma.repair.findMany({
        where,
        take: 10,
        orderBy: { created_at: 'desc' },
        include: {
          assigned_to: { select: { id: true, name: true } },
          completed_by: { select: { id: true, name: true } },
          created_by: { select: { id: true, name: true } },
        },
      }),
      prisma.repair.groupBy({
        by: ['assigned_to_id'],
        where: { ...where, assigned_to_id: { not: null } },
        _count: { id: true },
      }),
    ]);

    // Fetch names for technician breakdown
    const techIds = technicianBreakdown
      .map((t) => t.assigned_to_id)
      .filter((id): id is string => Boolean(id));

    const techUsers = await prisma.user.findMany({
      where: { id: { in: techIds } },
      select: { id: true, name: true },
    });

    const techMap = new Map(techUsers.map((u) => [u.id, u.name]));

    const formattedTechBreakdown = technicianBreakdown.map((t) => ({
      technicianId: t.assigned_to_id,
      name: t.assigned_to_id ? techMap.get(t.assigned_to_id) || 'Unknown' : 'Unassigned',
      count: t._count.id,
    }));

    return NextResponse.json({
      summary: {
        total: totalCount,
        pending: pendingCount,
        inProcess: inProcessCount,
        completed: completedCount,
        cancelled: cancelledCount,
      },
      technicianBreakdown: formattedTechBreakdown,
      recentRepairs,
    });
  } catch (error) {
    console.error('Error computing reports:', error);
    return NextResponse.json({ error: 'Failed to generate report metrics.' }, { status: 500 });
  }
}
