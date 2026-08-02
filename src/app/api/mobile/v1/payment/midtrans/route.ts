import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, formatApiResponse } from '@/lib/api-auth';
import { getSnapClient } from '@/lib/midtrans';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || user.isGuest) {
    return NextResponse.json(
      formatApiResponse(false, null, {
        code: 'UNAUTHORIZED',
        message: 'Anda harus login untuk membeli paket berlangganan.',
      }),
      { status: 401 }
    );
  }

  try {
    const { planId = 'premium-monthly' } = await req.json();
    const price = 199000;
    const planName = planId === 'premium-yearly' ? 'Premium Tahunan' : 'Premium Bulanan';

    const orderId = `MOBILE-${user.id.slice(0, 8)}-${Date.now()}`;
    const snap = getSnapClient();

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: price,
      },
      credit_card: {
        secure: true,
      },
      customer_details: {
        email: user.email || 'user@exportready.id',
        first_name: 'Pengguna ExportReady',
      },
      item_details: [
        {
          id: planId,
          price: price,
          quantity: 1,
          name: `ExportReadyAI ${planName}`,
        },
      ],
    };

    const snapResult = await snap.createTransaction(parameter);

    const admin = createAdminClient();
    await admin.from('payments').insert({
      order_id: orderId,
      user_id: user.id,
      plan_id: planId,
      amount: price,
      status: 'pending',
      snap_token: snapResult.token,
      redirect_url: snapResult.redirect_url,
    });

    return NextResponse.json(
      formatApiResponse(true, {
        orderId,
        snapToken: snapResult.token,
        redirectUrl: snapResult.redirect_url,
      })
    );
  } catch (err) {
    console.error('Midtrans payment error:', err);
    return NextResponse.json(
      formatApiResponse(false, null, {
        code: 'PAYMENT_CREATION_FAILED',
        message: 'Gagal membuat transaksi pembayaran Midtrans.',
      }),
      { status: 500 }
    );
  }
}
