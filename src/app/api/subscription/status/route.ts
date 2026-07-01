import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  getUserSubscriptionStatus,
  isPremiumUser,
} from '@/lib/subscription';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Anda harus login terlebih dahulu' },
        { status: 401 },
      );
    }

    const info = await getUserSubscriptionStatus(user.id);

    return NextResponse.json({
      ...info,
      isPremium: isPremiumUser(info),
    });
  } catch (err) {
    console.error('subscription status error:', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 },
    );
  }
}
