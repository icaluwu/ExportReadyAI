import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getSnapClient } from '@/lib/midtrans';

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { plan_id, payment_method } = body;

    if (!plan_id) {
      return NextResponse.json(
        { error: 'plan_id wajib diisi' },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { data: plan, error: planError } = await admin
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Paket tidak ditemukan atau tidak aktif' },
        { status: 404 },
      );
    }

    if (plan.name === 'free') {
      return NextResponse.json(
        { error: 'Paket gratis tidak memerlukan pembayaran' },
        { status: 400 },
      );
    }

    const orderId = `EXPRDY-${user.id.slice(0, 8)}-${Date.now()}`;
    const grossAmount = plan.price_idr;

    const customerName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split('@')[0] ||
      'Pelanggan';
    const customerPhone =
      (user.user_metadata?.phone as string) || '08123456789';

    const isMidtransConfigured =
      !!process.env.MIDTRANS_SERVER_KEY &&
      !!process.env.MIDTRANS_CLIENT_KEY;

    let transactionToken: string | null = null;
    let transactionRedirectUrl: string | null = null;
    let isManual = payment_method === 'manual' || !isMidtransConfigured;

    if (!isManual) {
      try {
        const snap = getSnapClient();
        const transaction = await snap.createTransaction({
          transaction_details: {
            order_id: orderId,
            gross_amount: grossAmount,
          },
          customer_details: {
            first_name: customerName,
            email: user.email || '',
            phone: customerPhone,
          },
          item_details: [
            {
              id: plan.id,
              price: grossAmount,
              quantity: 1,
              name: `ExportReady ${plan.name === 'premium_monthly' ? 'Premium Bulanan' : 'Premium Tahunan'}`,
            },
          ],
        });
        transactionToken = transaction.token;
        transactionRedirectUrl = transaction.redirect_url;
      } catch (err) {
        console.warn('Gagal menginisialisasi Midtrans, beralih ke pembayaran manual:', err);
        isManual = true;
      }
    }

    const { error: insertError } = await admin.from('payment_transactions').insert({
      user_id: user.id,
      plan_id: plan.id,
      order_id: orderId,
      gross_amount: grossAmount,
      status: 'pending',
      payment_type: isManual ? 'manual_bank_transfer' : null,
    });

    if (insertError) {
      console.error('Failed to insert payment_transactions:', insertError);
      return NextResponse.json(
        { error: 'Gagal menyimpan transaksi' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      token: transactionToken,
      redirect_url: transactionRedirectUrl,
      order_id: orderId,
      manual: isManual,
    });
  } catch (err) {
    console.error('create-transaction error:', err);
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
