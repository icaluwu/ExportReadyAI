import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, formatApiResponse } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || user.isGuest) {
    return NextResponse.json(
      formatApiResponse(false, null, {
        code: 'UNAUTHORIZED',
        message: 'Pengguna harus login untuk melihat riwayat assessment.',
      }),
      { status: 401 }
    );
  }

  try {
    const admin = createAdminClient();
    const { data: assessments, error } = await admin
      .from('assessments')
      .select('id, product_name, category, readiness_score, created_at, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch assessments error:', error);
      return NextResponse.json(
        formatApiResponse(false, null, {
          code: 'FETCH_ERROR',
          message: 'Gagal mengambil data riwayat assessment.',
        }),
        { status: 500 }
      );
    }

    return NextResponse.json(formatApiResponse(true, { assessments }));
  } catch (err) {
    console.error('Assessments API error:', err);
    return NextResponse.json(
      formatApiResponse(false, null, {
        code: 'INTERNAL_ERROR',
        message: 'Terjadi kesalahan internal server.',
      }),
      { status: 500 }
    );
  }
}
