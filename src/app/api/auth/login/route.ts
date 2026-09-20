import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Query user in PostgreSQL
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact an administrator.' },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Set secure HTTP-only cookie
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    console.error('Login error:', error);
    const err = error as { code?: string; message?: string };
    if (
      err?.code === 'P1001' ||
      err?.code === 'P1000' ||
      err?.message?.includes("Can't reach database") ||
      err?.message?.includes('connect ECONNREFUSED')
    ) {
      return NextResponse.json(
        {
          error:
            'Cannot connect to PostgreSQL. Please ensure your database is running and DATABASE_URL is configured in .env, then run "npm run db:push" and "npm run db:seed".',
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: err?.message || 'An unexpected error occurred during login.' },
      { status: 500 }
    );
  }
}
