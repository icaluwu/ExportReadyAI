import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase-admin';
import { maskFreeAiResult } from '@/lib/ai-result';

const ParamsSchema = z.string().uuid();
const TokenSchema = z.string().uuid();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const parsedId = ParamsSchema.safeParse((await params).id);
    if (!parsedId.success) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const { createClient } = await import('@/lib/supabase-server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let data: Record<string, unknown> | null = null;
    if (user?.id) {
      const result = await supabase
        .from('assessments')
        .select('*')
        .eq('id', parsedId.data)
        .eq('user_id', user.id)
        .maybeSingle();
      data = result.data;
    } else {
      const parsedToken = TokenSchema.safeParse(req.nextUrl.searchParams.get('token'));
      if (!parsedToken.success) {
        return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
      }

      const result = await createAdminClient()
        .from('assessments')
        .select('*')
        .eq('id', parsedId.data)
        .is('user_id', null)
        .eq('share_token', parsedToken.data)
        .gt('share_token_expires_at', new Date().toISOString())
        .maybeSingle();
      data = result.data;
    }

    if (!data) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }

    let isPremium = false;
    if (user?.id) {
      const { getUserSubscriptionStatus, isPremiumUser } = await import('@/lib/subscription');
      isPremium = isPremiumUser(await getUserSubscriptionStatus(user.id));
    }

    if (!isPremium && data.ai_result && typeof data.ai_result === 'object') {
      data = {
        ...data,
        ai_result: maskFreeAiResult(data.ai_result),
      };
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server.' },
      { status: 500 },
    );
  }
}