import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getSnapClient } from '@/lib/midtrans';
import { calculatePaymentTotal } from '@/lib/pricing';

const TransactionSchema = z.object({
  plan_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Anda harus login terlebih dahulu' },
        { status: 401 },
      );
    }

    const parsed = TransactionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Paket tidak valid' }, { status: 400 });
    }

    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
      return NextResponse.json(
        { error: 'Pembayaran sedang tidak tersedia.' },
        { status: 503 },
      );
    }

    const admin = createAdminClient();
    const { data: plan, error: planError } = await admin
      .from('subscription_plans')
      .select('id, name, price_idr')
      .eq('id', parsed.data.plan_id)
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

    const orderId = 'EXPRDY-' + user.id.slice(0, 8) + '-' + Date.now();
    const amount = calculatePaymentTotal(plan.price_idr);
    const customerName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split('@')[0] ||
      'Pelanggan';
    const customerPhone =
      (user.user_metadata?.phone as string | undefined) || undefined;

    const snap = getSnapClient();
    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: amount.total,
      },
      customer_details: {
        first_name: customerName,
        email: user.email || '',
        ...(customerPhone ? { phone: customerPhone } : {}),
      },
      item_details: [
        {
          id: plan.id,
          price: amount.subtotal,
          quantity: 1,
          name: 'ExportReady ' + (plan.name === 'premium_monthly' ? 'Premium Bulanan' : 'Premium Tahunan'),
        },
        {
          id: plan.id + '-tax',
          price: amount.tax,
          quantity: 1,
          name: 'Pajak',
        },
      ],
    });

    const { error: insertError } = await admin.from('payment_transactions').insert({
      user_id: user.id,
      plan_id: plan.id,
      order_id: orderId,
      gross_amount: amount.total,
      status: 'pending',
      payment_type: 'midtrans',
    });

    if (insertError) {
      console.error('Failed to insert payment transaction:', {
        code: insertError.code,
        orderId,
      });
      return NextResponse.json(
        { error: 'Gagal menyimpan transaksi' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: orderId,
      amount,
    });
  } catch (error) {
    console.error('create-transaction error:', error);
    return NextResponse.json(
      { error: 'Gagal membuat transaksi pembayaran.' },
      { status: 500 },
    );
  }
}