import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRoles } from '@/lib/session';
import { Role } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await params;

  try {
    const repair = await prisma.repair.findFirst({
      where: {
        OR: [{ id: id }, { repair_id: id }],
      },
      include: {
        assigned_to: { select: { id: true, name: true, email: true, role: true } },
        completed_by: { select: { id: true, name: true, email: true, role: true } },
        created_by: { select: { id: true, name: true, email: true, role: true } },
        history: {
          orderBy: { changed_at: 'desc' },
          include: {
            changed_by: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });

    if (!repair) {
      return NextResponse.json({ error: 'Repair not found.' }, { status: 404 });
    }

    return NextResponse.json({ repair });
  } catch (error) {
    console.error('Error fetching repair details:', error);
    return NextResponse.json({ error: 'Failed to retrieve repair details.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await params;

  try {
    const existing = await prisma.repair.findFirst({
      where: { OR: [{ id }, { repair_id: id }] },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Repair not found.' }, { status: 404 });
    }

    // Role check: technicians cannot edit core device info unless admin/user
    if (auth.user.role === Role.TECHNICIAN && existing.assigned_to_id !== auth.user.userId) {
      return NextResponse.json({ error: 'Technicians can only edit assigned repairs.' }, { status: 403 });
    }

    const body = await req.json();
    const { serial_number, mobile_name, problem, repair_date, additional_id, notes, assigned_to_id } = body;

    const updated = await prisma.repair.update({
      where: { id: existing.id },
      data: {
        ...(serial_number && { serial_number: String(serial_number).trim() }),
        ...(mobile_name && { mobile_name: String(mobile_name).trim() }),
        ...(problem && { problem: String(problem).trim() }),
        ...(repair_date && { repair_date: new Date(repair_date) }),
        ...(additional_id !== undefined && { additional_id: additional_id ? String(additional_id).trim() : null }),
        ...(notes !== undefined && { notes: notes ? String(notes).trim() : null }),
        ...(assigned_to_id !== undefined && { assigned_to_id: assigned_to_id || null }),
      },
      include: {
        assigned_to: { select: { id: true, name: true, email: true } },
        completed_by: { select: { id: true, name: true, email: true } },
        created_by: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, repair: updated });
  } catch (error) {
    console.error('Error updating repair:', error);
    return NextResponse.json({ error: 'Failed to update repair.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRoles([Role.ADMIN]);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await params;

  try {
    const existing = await prisma.repair.findFirst({
      where: { OR: [{ id }, { repair_id: id }] },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Repair not found.' }, { status: 404 });
    }

    await prisma.repair.delete({ where: { id: existing.id } });

    return NextResponse.json({ success: true, message: 'Repair deleted successfully.' });
  } catch (error) {
    console.error('Error deleting repair:', error);
    return NextResponse.json({ error: 'Failed to delete repair.' }, { status: 500 });
  }
}
