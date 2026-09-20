import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoles } from '@/lib/session';
import { hashPassword } from '@/lib/auth';
import { Role } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRoles([Role.ADMIN]);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const { new_password } = body;

    if (!new_password || String(new_password).trim().length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const passwordHash = await hashPassword(String(new_password).trim());

    await prisma.user.update({
      where: { id },
      data: { password_hash: passwordHash },
    });

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for ${existing.name}.`,
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'Failed to reset password.' }, { status: 500 });
  }
}
