import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const { createClient: createServerClient } = await import('@/lib/supabase-server');
    const supabaseServer = await createServerClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    // If user is logged in, only allow access to their own assessments.
    // If user is logged out, only allow access to guest assessments (user_id is null).
    let query = supabaseServer.from('assessments').select('*').eq('id', id);
    if (user?.id) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.is('user_id', null);
    }

    const { data, error } = await query.single();

    if (error) {
      // If the row doesn't match filters, treat as not found (avoid leaking existence).
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
