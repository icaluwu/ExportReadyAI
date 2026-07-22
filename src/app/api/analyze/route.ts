import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { model } from '@/lib/gemini';
import { calculateReadinessScore } from '@/lib/scoring';
import {
  searchRegulations,
  formatRegulationContext,
  extractSourceTitles,
} from '@/lib/rag';
import { createRateLimiter, getClientIp } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase-admin';
import { maskFreeAiResult } from '@/lib/ai-result';

// Rate limit: 5 assessments per minute per client (this is the most expensive endpoint)
const rateLimit = createRateLimiter({ endpoint: 'analyze', maxRequests: 5, windowMs: 60_000 });

// Input validation schema — guards against crashes (e.g. undefined.certifications.join)
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
  meetsInternationalStandards: z.boolean().optional().nullable(),
  hasTrademark: z.boolean().optional().nullable(),
  targetMarkets: z.array(z.string().max(100)).default([]),
  exportMotivation: z.string().max(1000).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  privacyAccepted: z.literal(true),
});

export async function POST(req: NextRequest) {
  // ── Rate limit ──────────────────────────────────────────────
  const ip = getClientIp(req);
  const { limited } = await rateLimit(ip);
  if (limited) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' },
      { status: 429 },
    );
  }

  try {
    const raw = await req.json();

    // ── Validate input ────────────────────────────────────────
    const parsed = AnalyzeSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data input tidak valid.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const data = parsed.data;

    // Calculate score
    const scoreBreakdown = calculateReadinessScore({
      productName: data.productName,
      category: data.category,
      capacity: data.capacity,
      capacityUnit: data.capacityUnit,
      price: data.price,
      certifications: data.certifications,
      exportExperience: data.exportExperience,
    });

    // RAG: retrieve relevant regulation chunks
    const ragQuery = `Produk: ${data.productName}, kategori: ${data.category}, target pasar: ${data.targetMarkets.join(', ')}`;
    const regulationChunks = await searchRegulations(ragQuery, 5);
    const regulationContext = formatRegulationContext(regulationChunks);
    const regulationSources = extractSourceTitles(regulationChunks);

    // Gemini Prompt
    let systemPrompt = `Kamu adalah konsultan ekspor senior Indonesia dengan pengalaman 20 tahun.
    Berikan analisis ekspor dalam Bahasa Indonesia yang profesional namun
    mudah dipahami oleh pelaku UMKM. Selalu berikan rekomendasi yang
    spesifik, actionable, dan realistis.`;

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
        {"country": "nama negara", "flag": "emoji bendera",
         "demandLevel": "Tinggi/Sedang/Rendah",
         "reason": "1 kalimat alasan spesifik"}
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

    // Call Gemini
    let aiResult = null;
    try {
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response (handling potential markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      aiResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (!aiResult) {
        console.error('Gemini returned invalid format:', text);
        throw new Error('Format respon AI tidak valid');
      }

      if (regulationSources.length > 0) {
        aiResult.regulationSources = regulationSources;
      }
    } catch (aiError) {
      console.error('Gemini API Error Detail:', aiError);
      // Sanitized: do not leak internal error detail to client
      return NextResponse.json(
        { error: 'Gagal mendapatkan respon dari AI. Silakan coba lagi.' },
        { status: 502 },
      );
    }

    const { createClient: createServerClient } = await import('@/lib/supabase-server');
    const supabaseServer = await createServerClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    let isPremium = false;
    if (user?.id) {
      const { getUserSubscriptionStatus, isPremiumUser } = await import('@/lib/subscription');
      isPremium = isPremiumUser(await getUserSubscriptionStatus(user.id));
    }

    const accessToken = user ? null : randomUUID();
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
        user_id: user?.id ?? null,
        share_token: accessToken,
        share_token_expires_at: accessToken
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          : null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('SUPABASE INSERT ERROR:', {
        message: error.message,
        code: error.code,
        tableName: 'assessments',
      });
      return NextResponse.json(
        { error: 'Terjadi kendala saat menyimpan hasil assessment. Silakan coba lagi.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      score: scoreBreakdown.totalScore,
      breakdown: scoreBreakdown,
      aiResult: isPremium ? aiResult : maskFreeAiResult(aiResult),
      assessmentId: assessment.id,
      accessToken,
    });
  } catch (error) {
    console.error('CRITICAL API ERROR:', error);
    // Generic sanitized message — never leak internals
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses data. Silakan coba lagi dalam beberapa saat.' },
      { status: 500 },
    );
  }
}
