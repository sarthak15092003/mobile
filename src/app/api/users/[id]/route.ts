import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoles } from '@/lib/session';
import { Role } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRoles([Role.ADMIN]);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, email, role } = body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (email) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const conflict = await prisma.user.findFirst({
        where: { email: normalizedEmail, NOT: { id } },
      });
      if (conflict) {
        return NextResponse.json({ error: 'Email is already in use by another user.' }, { status: 400 });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(email && { email: String(email).trim().toLowerCase() }),
        ...(role && Object.values(Role).includes(role) && { role }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        updated_at: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }
}
