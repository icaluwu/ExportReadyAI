import { NextRequest } from 'next/server';
import { verifyMobileAuth, MobileAuthUser } from './mobile-auth';
import { createClient as createServerClient } from './supabase-server';

export async function getAuthenticatedUser(req: NextRequest): Promise<MobileAuthUser | null> {
  // 1. Check Bearer Authorization token first (Mobile Client)
  const mobileUser = await verifyMobileAuth(req);
  if (mobileUser) {
    return mobileUser;
  }

  // 2. Fallback to Supabase SSR Cookie (Web Client)
  try {
    const supabaseServer = await createServerClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (user) {
      return {
        id: user.id,
        email: user.email,
        isGuest: false,
      };
    }
  } catch {
    // Silent catch for invalid/missing web cookie
  }

  return null;
}

export function formatApiResponse<T>(
  success: boolean,
  data: T | null = null,
  error: { code: string; message: string; fields?: Record<string, string[]> } | null = null,
  requestId?: string
) {
  return {
    success,
    data,
    error,
    meta: {
      requestId: requestId || crypto.randomUUID(),
      apiVersion: 'v1',
      timestamp: new Date().toISOString(),
    },
  };
}
