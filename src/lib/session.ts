import { NextResponse } from 'next/server';
import { getSession, SessionPayload } from './auth';
import { prisma } from './prisma';
import { Role } from '@prisma/client';

export type AuthResult = 
  | { user: SessionPayload; errorResponse?: never }
  | { user?: never; errorResponse: NextResponse };

/**
 * Requires a valid active logged-in user.
 * Verifies both session token and active status in PostgreSQL database.
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getSession();
  if (!session) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      ),
    };
  }

  // Double-check with active status in database
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, active: true },
  });

  if (!user || !user.active) {
    return {
      errorResponse: NextResponse.json(
        { error: 'User account is inactive or not found.' },
        { status: 403 }
      ),
    };
  }

  return {
    user: {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

/**
 * Requires specific allowed roles (e.g. ['ADMIN'] or ['ADMIN', 'TECHNICIAN']).
 */
export async function requireRoles(allowedRoles: Role[]): Promise<AuthResult> {
  const auth = await requireAuth();
  if (auth.errorResponse) return auth;

  if (!allowedRoles.includes(auth.user.role)) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Forbidden. You do not have permission to perform this action.' },
        { status: 403 }
      ),
    };
  }

  return auth;
}
