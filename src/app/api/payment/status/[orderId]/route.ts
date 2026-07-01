import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
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

    const { data, error } = await supabase
      .from('payment_transactions')
      .select('order_id, status, gross_amount, updated_at')
      .eq('order_id', orderId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('payment status error:', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 },
    );
  }
}
