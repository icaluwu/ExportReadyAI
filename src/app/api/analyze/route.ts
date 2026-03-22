import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { model } from '@/lib/gemini';
import { calculateReadinessScore } from '@/lib/scoring';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

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

    // Gemini Prompt
    const systemPrompt = `Kamu adalah konsultan ekspor senior Indonesia dengan pengalaman 20 tahun. 
    Berikan analisis ekspor dalam Bahasa Indonesia yang profesional namun 
    mudah dipahami oleh pelaku UMKM. Selalu berikan rekomendasi yang 
    spesifik, actionable, dan realistis.`;

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
    } catch (aiError) {
      console.error('Gemini API Error Detail:', aiError);
      const errorMessage = aiError instanceof Error ? aiError.message : 'Gagal menghasilkan analisis';
      throw new Error(`AI Error: ${errorMessage}`);
    }

    // Get user session for ownership
    const { createClient: createServerClient } = await import('@/lib/supabase-server');
    const supabaseServer = await createServerClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    // Save to Supabase
    const { data: assessment, error } = await supabaseServer
      .from('assessments')
      .insert([
        {
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
          user_id: user?.id || null, // Associate with user if logged in
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('SUPABASE INSERT ERROR:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        tableName: 'assessments',
        dataKeys: Object.keys(data)
      });
      throw new Error(`Database Error: ${error.message} - Check if all columns exist in 'assessments' table.`);
    }

    return NextResponse.json({
      score: scoreBreakdown.totalScore,
      breakdown: scoreBreakdown,
      aiResult: aiResult,
      assessmentId: assessment.id,
    });
  } catch (error) {
    console.error('CRITICAL API ERROR:', error);
    
    // Provide a more helpful error message based on the type of error
    let userMessage = 'Terjadi kesalahan saat memproses data. ';
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan pada server';
    
    if (errorMessage.includes('Database Error')) {
      userMessage += 'Terjadi kendala pada database (Supabase). Pastikan tabel sudah dibuat.';
    } else if (errorMessage.includes('AI')) {
      userMessage += 'Gagal mendapatkan respon dari AI. Periksa API Key Anda.';
    } else {
      userMessage += 'Silakan coba lagi dalam beberapa saat.';
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        userMessage: userMessage
      },
      { status: 500 }
    );
  }
}
