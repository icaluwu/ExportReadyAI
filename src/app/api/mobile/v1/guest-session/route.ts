import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { formatApiResponse } from '@/lib/api-auth';

export async function POST() {
  const guestToken = `guest_${randomUUID()}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return NextResponse.json(
    formatApiResponse(true, {
      guestToken,
      expiresAt,
    })
  );
}
