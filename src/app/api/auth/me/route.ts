import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';

export async function GET() {
  const auth = await requireAuth();
  if (auth.errorResponse) return auth.errorResponse;

  return NextResponse.json({
    user: auth.user,
  });
}
