import { NextRequest } from 'next/server';
import { createAdminClient } from './supabase-admin';

export interface MobileAuthUser {
  id: string;
  email?: string;
  isGuest: boolean;
  guestId?: string;
}

export async function verifyMobileAuth(req: NextRequest): Promise<MobileAuthUser | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7).trim();
  if (!token) return null;

  // Handle Guest Token prefix if guest
  if (token.startsWith('guest_')) {
    return {
      id: token,
      isGuest: true,
      guestId: token,
    };
  }

  try {
    const admin = createAdminClient();
    const { data: { user }, error } = await admin.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      isGuest: false,
    };
  } catch (err) {
    console.error('Mobile Bearer auth verification error:', err);
    return null;
  }
}
