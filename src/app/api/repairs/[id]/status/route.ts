import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { RepairStatus, Role } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await params;

  try {
    const existing = await prisma.repair.findFirst({
      where: { OR: [{ id }, { repair_id: id }] },
      include: { assigned_to: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Repair record not found.' }, { status: 404 });
    }

    // Allow authenticated staff (Admin, Technician, User) to advance repair workflow

    const body = await req.json();
    const { status, notes, completed_by_id } = body;

    if (!status || !Object.values(RepairStatus).includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${Object.values(RepairStatus).join(', ')}` },
        { status: 400 }
      );
    }

    const oldStatus = existing.status;
    const newStatus = status as RepairStatus;

    // Database transaction to atomically update repair state and append history audit log
    const updated = await prisma.$transaction(async (tx) => {
      const updateData: {
        status: RepairStatus;
        completed_by_id?: string | null;
        completion_date?: Date | null;
      } = {
        status: newStatus,
      };

      if (newStatus === RepairStatus.COMPLETED) {
        // If completed_by_id was passed, use that; otherwise credit the logged in user/technician
        updateData.completed_by_id = completed_by_id || auth.user.userId || existing.assigned_to_id;
        updateData.completion_date = new Date();
      } else if (oldStatus === RepairStatus.COMPLETED) {
        // Reopened / moved out of completed
        updateData.completion_date = null;
      }

      const repair = await tx.repair.update({
        where: { id: existing.id },
        data: updateData,
        include: {
          assigned_to: { select: { id: true, name: true, email: true } },
          completed_by: { select: { id: true, name: true, email: true } },
          created_by: { select: { id: true, name: true, email: true } },
        },
      });

      // Append to audit trail
      await tx.repairHistory.create({
        data: {
          repair_id: existing.id,
          old_status: oldStatus,
          new_status: newStatus,
          changed_by_id: auth.user.userId,
          notes: notes ? String(notes).trim() : null,
        },
      });

      return repair;
    });

    return NextResponse.json({
      success: true,
      message: `Status updated to ${newStatus}`,
      repair: updated,
    });
  } catch (error) {
    console.error('Error updating repair status:', error);
    return NextResponse.json({ error: 'Failed to update repair status.' }, { status: 500 });
  }
}
