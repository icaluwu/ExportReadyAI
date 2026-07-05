import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { verifyNotificationSignature } from '@/lib/midtrans';

interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  transaction_id?: string;
  payment_type?: string;
}

function mapTransactionStatus(
  transactionStatus: string,
  fraudStatus?: string,
): string | null {
  if (
    transactionStatus === 'settlement' ||
    (transactionStatus === 'capture' && fraudStatus === 'accept')
  ) {
    return 'settlement';
  }
  if (['expire', 'cancel', 'deny', 'pending'].includes(transactionStatus)) {
    return transactionStatus;
  }
  return null;
}



export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MidtransNotification;
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      transaction_id,
      payment_type,
    } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const isValid = verifyNotificationSignature(
      order_id,
      status_code,
      gross_amount,
      signature_key,
    );

    if (!isValid) {
      console.error('Invalid Midtrans signature for order:', order_id);
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    const admin = createAdminClient();
    const mappedStatus = mapTransactionStatus(transaction_status, fraud_status);

    const updatePayload: Record<string, unknown> = {
      raw_notification: body,
      updated_at: new Date().toISOString(),
    };

    if (transaction_id) {
      updatePayload.midtrans_transaction_id = transaction_id;
    }
    if (payment_type) {
      updatePayload.payment_type = payment_type;
    }
    if (mappedStatus) {
      updatePayload.status = mappedStatus;
    }

    const { data: payment, error: updateError } = await admin
      .from('payment_transactions')
      .update(updatePayload)
      .eq('order_id', order_id)
      .select('id, user_id, plan_id')
      .single();

    if (updateError) {
      console.error('Failed to update payment_transactions:', updateError);
      return NextResponse.json({ ok: true });
    }



    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('notification webhook error:', err);
    return NextResponse.json({ ok: true });
  }
}
