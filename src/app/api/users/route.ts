import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRoles } from '@/lib/session';
import { hashPassword } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get('role');
    const activeOnly = searchParams.get('active_only') === 'true';

    // If non-admin user is fetching technicians for assignment dropdowns, allow technicians list
    if (auth.user.role !== Role.ADMIN) {
      // Non-admins can only list active technicians/users for dropdown assignments
      const assignees = await prisma.user.findMany({
        where: {
          active: true,
          ...(roleParam && { role: roleParam as Role }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json({ users: assignees });
    }

    // Admin can view all users
    const users = await prisma.user.findMany({
      where: {
        ...(roleParam && { role: roleParam as Role }),
        ...(activeOnly && { active: true }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            repairs_assigned: true,
            repairs_created: true,
            repairs_completed: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to retrieve users.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRoles([Role.ADMIN]);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email address already exists.' },
        { status: 400 }
      );
    }

    const assignedRole = (role && Object.values(Role).includes(role)) ? role : Role.USER;
    const passwordHash = await hashPassword(String(password).trim());

    const newUser = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        password_hash: passwordHash,
        role: assignedRole,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      { success: true, message: 'User created successfully.', user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
  }
}
