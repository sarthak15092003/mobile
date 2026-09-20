import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { generateNextRepairId } from '@/lib/repair-id';
import { RepairStatus, Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status')?.trim() as RepairStatus | undefined;
    const assignedToId = searchParams.get('assigned_to')?.trim();
    const createdById = searchParams.get('created_by')?.trim();
    const dateFrom = searchParams.get('date_from')?.trim();
    const dateTo = searchParams.get('date_to')?.trim();
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const where: Prisma.RepairWhereInput = {};

    // Role-based scoping: Technicians default to assigned repairs if specified or can view assigned
    if (auth.user.role === 'TECHNICIAN' && searchParams.get('assigned_only') === 'true') {
      where.assigned_to_id = auth.user.userId;
    }

    if (status && Object.values(RepairStatus).includes(status)) {
      where.status = status;
    }

    if (assignedToId) {
      where.assigned_to_id = assignedToId;
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
        // End of the day
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        where.repair_date.lte = to;
      }
    }

    if (search) {
      where.OR = [
        { repair_id: { contains: search, mode: 'insensitive' } },
        { serial_number: { contains: search, mode: 'insensitive' } },
        { additional_id: { contains: search, mode: 'insensitive' } },
        { mobile_name: { contains: search, mode: 'insensitive' } },
        { problem: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, repairs] = await Promise.all([
      prisma.repair.count({ where }),
      prisma.repair.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          assigned_to: { select: { id: true, name: true, email: true } },
          completed_by: { select: { id: true, name: true, email: true } },
          created_by: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return NextResponse.json({
      data: repairs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching repairs:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve repair records from database.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const {
      serial_number,
      mobile_name,
      problem,
      repair_date,
      additional_id,
      notes,
      status,
      assigned_to_id,
    } = body;

    // Strict validation
    if (!serial_number || !String(serial_number).trim()) {
      return NextResponse.json({ error: 'Serial Number is required.' }, { status: 400 });
    }
    if (!mobile_name || !String(mobile_name).trim()) {
      return NextResponse.json({ error: 'Mobile Name is required.' }, { status: 400 });
    }
    if (!problem || !String(problem).trim()) {
      return NextResponse.json({ error: 'Problem description is required.' }, { status: 400 });
    }

    const initialStatus = (status && Object.values(RepairStatus).includes(status))
      ? status
      : RepairStatus.PENDING;

    const parsedDate = repair_date ? new Date(repair_date) : new Date();

    // Concurrency-safe atomic transaction
    const newRepair = await prisma.$transaction(async (tx) => {
      const generatedRepairId = await generateNextRepairId(tx);

      const repair = await tx.repair.create({
        data: {
          repair_id: generatedRepairId,
          serial_number: String(serial_number).trim(),
          mobile_name: String(mobile_name).trim(),
          problem: String(problem).trim(),
          repair_date: parsedDate,
          additional_id: additional_id ? String(additional_id).trim() : null,
          status: initialStatus,
          assigned_to_id: assigned_to_id || null,
          notes: notes ? String(notes).trim() : null,
          created_by_id: auth.user.userId,
        },
        include: {
          assigned_to: { select: { id: true, name: true, email: true } },
          created_by: { select: { id: true, name: true, email: true } },
        },
      });

      // Audit trail: create initial history
      await tx.repairHistory.create({
        data: {
          repair_id: repair.id,
          old_status: null,
          new_status: initialStatus,
          changed_by_id: auth.user.userId,
          notes: 'Repair record created',
        },
      });

      return repair;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Repair created successfully.',
        repair: newRepair,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating repair:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the repair record.' },
      { status: 500 }
    );
  }
}
