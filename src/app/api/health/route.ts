import { NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    ok: true,
    supabase: isSupabaseConfigured(),
    timestamp: new Date().toISOString(),
  })
}
