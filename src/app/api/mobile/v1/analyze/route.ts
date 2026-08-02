import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { model } from '@/lib/gemini';
import { calculateReadinessScore } from '@/lib/scoring';
import { searchRegulations, formatRegulationContext, extractSourceTitles } from '@/lib/rag';
import { createRateLimiter, getClientIp } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase-admin';
import { maskFreeAiResult } from '@/lib/ai-result';
import { getAuthenticatedUser, formatApiResponse } from '@/lib/api-auth';

const rateLimit = createRateLimiter({ endpoint: 'mobile-analyze', maxRequests: 10, windowMs: 60_000 });

const AnalyzeSchema = z.object({
  productName: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  description: z.string().max(2000).optional().nullable(),
  hsCode: z.string().max(50).optional().nullable(),
  capacity: z.coerce.number().nonnegative(),
  capacityUnit: z.string().max(50),
  price: z.coerce.number().nonnegative(),
  hasOnlinePresence: z.boolean().optional().nullable(),
  exportExperience: z.string().max(500),
  certifications: z.array(z.string().max(100)).default([]),
  meetsInternationalStandards: z.string().min(1).max(100),
  hasTrademark: z.boolean().optional().nullable(),
  targetMarkets: z.array(z.string().max(100)).default([]),
  exportMotivation: z.string().max(1000).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  privacyAccepted: z.literal(true),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { limited } = await rateLimit(ip);
  if (limited) {
    return NextResponse.json(
      formatApiResponse(false, null, {
        code: 'RATE_LIMITED',
        message: 'Terlalu banyak permintaan assessment. Coba lagi dalam 1 menit.',
      }),
      { status: 429 }
    );
  }

  try {
    const authUser = await getAuthenticatedUser(req);
    const raw = await req.json();
    const parsed = AnalyzeSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        formatApiResponse(false, null, {
          code: 'INVALID_INPUT',
          message: 'Data input assessment tidak valid.',
        }),
        { status: 400 }
      );
    }
    const data = parsed.data;

    const scoreBreakdown = calculateReadinessScore({
      productName: data.productName,
      category: data.category,
      capacity: data.capacity,
      capacityUnit: data.capacityUnit,
      price: data.price,
      certifications: data.certifications,
      exportExperience: data.exportExperience,
    });

    const ragQuery = `Produk: ${data.productName}, kategori: ${data.category}, target pasar: ${data.targetMarkets.join(', ')}`;
    const regulationChunks = await searchRegulations(ragQuery, 5);
    const regulationContext = formatRegulationContext(regulationChunks);
    const regulationSources = extractSourceTitles(regulationChunks);

    let systemPrompt = `Kamu adalah konsultan ekspor senior Indonesia dengan pengalaman 20 tahun.
Berikan analisis ekspor dalam Bahasa Indonesia yang profesional namun mudah dipahami oleh pelaku UMKM.`;

    if (regulationContext) {
      systemPrompt += `\n\n${regulationContext}`;
    }

    const userPrompt = `Berdasarkan data UMKM berikut:
- Produk: ${data.productName} (kategori: ${data.category})
- Kapasitas produksi: ${data.capacity} ${data.capacityUnit}/bulan
- Harga: Rp ${data.price}/unit
- Sertifikasi dimiliki: ${data.certifications.join(', ')}
- Pengalaman ekspor: ${data.exportExperience}
- Target pasar diminati: ${data.targetMarkets.join(', ')}
- Export Readiness Score: ${scoreBreakdown.totalScore}/100

Berikan dalam format JSON:
{
  "summary": "ringkasan 2 kalimat kondisi UMKM ini",
  "topCountries": [
    {"country": "nama negara", "flag": "emoji bendera", "demandLevel": "Tinggi/Sedang/Rendah", "reason": "1 kalimat alasan spesifik"}
  ],
  "gaps": ["gap 1", "gap 2", "gap 3"],
  "roadmap": {
    "fase1": ["aksi 1", "aksi 2"],
    "fase2": ["aksi 1", "aksi 2"],
    "fase3": ["aksi 1", "aksi 2"],
    "fase4": ["aksi 1", "aksi 2"]
  },
  "motivationalNote": "1 kalimat motivasi personal"
}`;

    let aiResult = null;
    try {
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      aiResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (aiResult && regulationSources.length > 0) {
        aiResult.regulationSources = regulationSources;
      }
    } catch (aiError) {
      console.error('Gemini Mobile API Error:', aiError);
      return NextResponse.json(
        formatApiResponse(false, null, {
          code: 'AI_PROCESSING_FAILED',
          message: 'Gagal memproses rekomendasi AI. Silakan coba lagi.',
        }),
        { status: 502 }
      );
    }

    let isPremium = false;
    const userId = authUser && !authUser.isGuest ? authUser.id : null;
    if (userId) {
      const { getUserSubscriptionStatus, isPremiumUser } = await import('@/lib/subscription');
      isPremium = isPremiumUser(await getUserSubscriptionStatus(userId));
    }

    const shareToken = userId ? null : randomUUID();
    const admin = createAdminClient();
    const { data: assessment, error } = await admin
      .from('assessments')
      .insert({
        product_name: data.productName,
        category: data.category,
        description: data.description,
        hs_code: data.hsCode,
        capacity: data.capacity,
        capacity_unit: data.capacityUnit,
        price: data.price,
        has_online_presence: data.hasOnlinePresence,
        export_experience: data.exportExperience,
        certifications: data.certifications,
        meets_international_standards: data.meetsInternationalStandards,
        has_trademark: data.hasTrademark,
        target_markets: data.targetMarkets,
        export_motivation: data.exportMotivation,
        email: data.email,
        readiness_score: scoreBreakdown.totalScore,
        score_breakdown: scoreBreakdown,
        ai_result: aiResult,
        status: 'completed',
        user_id: userId,
        share_token: shareToken,
        share_token_expires_at: shareToken
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          : null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Mobile Assessment Supabase Insert Error:', error);
      return NextResponse.json(
        formatApiResponse(false, null, {
          code: 'DATABASE_ERROR',
          message: 'Terjadi kendala saat menyimpan assessment.',
        }),
        { status: 500 }
      );
    }

    return NextResponse.json(
      formatApiResponse(true, {
        assessmentId: assessment.id,
        score: scoreBreakdown.totalScore,
        breakdown: scoreBreakdown,
        aiResult: isPremium ? aiResult : maskFreeAiResult(aiResult),
        isPremium,
        shareToken,
      })
    );
  } catch (error) {
    console.error('Critical Mobile Analyze Error:', error);
    return NextResponse.json(
      formatApiResponse(false, null, {
        code: 'INTERNAL_ERROR',
        message: 'Terjadi kesalahan sistem saat memproses assessment.',
      }),
      { status: 500 }
    );
  }
}
