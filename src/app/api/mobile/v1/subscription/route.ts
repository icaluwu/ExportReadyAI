import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, formatApiResponse } from '@/lib/api-auth';
import { getUserSubscriptionStatus, isPremiumUser } from '@/lib/subscription';

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || user.isGuest) {
    return NextResponse.json(
      formatApiResponse(true, {
        isPremium: false,
        status: 'free',
        plan: 'Gratis',
        expiresAt: null,
      })
    );
  }

  try {
    const statusData = await getUserSubscriptionStatus(user.id);
    const isPremium = isPremiumUser(statusData);

    return NextResponse.json(
      formatApiResponse(true, {
        isPremium,
        status: statusData.status,
        plan: isPremium ? 'Premium' : 'Gratis',
        expiresAt: statusData.expiresAt || null,
      })
    );
  } catch (err) {
    console.error('Subscription API Error:', err);
    return NextResponse.json(
      formatApiResponse(false, null, {
        code: 'SUBSCRIPTION_FETCH_ERROR',
        message: 'Gagal mengambil informasi berlangganan.',
      }),
      { status: 500 }
    );
  }
}
