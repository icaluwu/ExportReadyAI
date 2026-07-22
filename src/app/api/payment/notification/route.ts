import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase-admin';
import { verifyNotificationSignature } from '@/lib/midtrans';

const NotificationSchema = z.object({
  order_id: z.string().min(1).max(100),
  status_code: z.string().regex(/^\d{3}$/),
  gross_amount: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  signature_key: z.string().length(128),
  transaction_status: z.string().min(1).max(50),
  fraud_status: z.string().max(50).optional(),
  transaction_id: z.string().max(100).optional(),
  payment_type: z.string().max(50).optional(),
}).passthrough();

function mapTransactionStatus(transactionStatus: string, fraudStatus?: string): string | null {
  if (
    transactionStatus === 'settlement' ||
    (transactionStatus === 'capture' && fraudStatus === 'accept')
  ) {
    return 'settlement';
  }
  return ['expire', 'cancel', 'deny', 'pending'].includes(transactionStatus)
    ? transactionStatus
    : null;
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > 64 * 1024) {
      return NextResponse.json({ ok: false }, { status: 413 });
    }

    const parsed = NotificationSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const body = parsed.data;

    if (!verifyNotificationSignature(
      body.order_id,
      body.status_code,
      body.gross_amount,
      body.signature_key,
    )) {
      console.error('Invalid Midtrans signature for order:', body.order_id);
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    const mappedStatus = mapTransactionStatus(body.transaction_status, body.fraud_status);
    const updatePayload: Record<string, unknown> = {
      raw_notification: body,
      updated_at: new Date().toISOString(),
    };
    if (body.transaction_id) updatePayload.midtrans_transaction_id = body.transaction_id;
    if (body.payment_type) updatePayload.payment_type = body.payment_type;
    if (mappedStatus) updatePayload.status = mappedStatus;

    const grossAmount = Number(body.gross_amount);
    if (!Number.isSafeInteger(grossAmount)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const { data: payment, error } = await createAdminClient()
      .from('payment_transactions')
      .update(updatePayload)
      .eq('order_id', body.order_id)
      .eq('gross_amount', grossAmount)
      .select('id')
      .single();

    if (error || !payment) {
      console.error('Failed to update payment transaction:', {
        code: error?.code,
        orderId: body.order_id,
      });
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('notification webhook error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}