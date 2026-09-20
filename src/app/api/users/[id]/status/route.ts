import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoles } from '@/lib/session';
import { Role } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRoles([Role.ADMIN]);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await params;

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Prevent admin from disabling themselves
    if (existing.id === auth.user.userId) {
      return NextResponse.json(
        { error: 'You cannot disable your own administrator account.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const newActiveState = typeof body.active === 'boolean' ? body.active : !existing.active;

    const updated = await prisma.user.update({
      where: { id },
      data: { active: newActiveState },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User account has been ${newActiveState ? 'activated' : 'deactivated'}.`,
      user: updated,
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json({ error: 'Failed to update user status.' }, { status: 500 });
  }
}
