import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { genAI } from '@/lib/gemini';
import { createClient } from '@/lib/supabase-server';
import { createRateLimiter, getClientIp } from '@/lib/rate-limit';

// Rate limit: 10 chat messages per minute per client
const rateLimit = createRateLimiter({ endpoint: 'chat', maxRequests: 10, windowMs: 60_000 });

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const ChatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().trim().min(1).max(2_000),
    }),
  ).min(1).max(21),
  assessmentId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { limited } = await rateLimit(ip);
    if (limited) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' },
        { status: 429 }
      );
    }

    const parsed = ChatSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Pesan tidak valid.' }, { status: 400 });
    }
    const { messages, assessmentId } = parsed.data;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user' || !lastMessage.content?.trim()) {
      return NextResponse.json({ error: 'Pesan tidak valid.' }, { status: 400 });
    }

    // Build assessment context (RLS-protected: only rows the requester can see)
    let assessmentContext = '';
    if (assessmentId) {
      const supabase = await createClient();
      const { data: assessment } = await supabase
        .from('assessments')
        .select('product_name, category, readiness_score, score_breakdown, ai_result, certifications, target_markets, export_experience')
        .eq('id', assessmentId)
        .maybeSingle();

      if (assessment) {
        assessmentContext = `
KONTEKS HASIL ASSESSMENT PENGGUNA:
- Produk: ${assessment.product_name} (kategori: ${assessment.category})
- Export Readiness Score: ${assessment.readiness_score}/100
- Rincian skor: ${JSON.stringify(assessment.score_breakdown)}
- Sertifikasi dimiliki: ${(assessment.certifications || []).join(', ') || 'belum ada'}
- Target pasar: ${(assessment.target_markets || []).join(', ')}
- Pengalaman ekspor: ${assessment.export_experience}
- Ringkasan AI: ${assessment.ai_result?.summary || '-'}
- Gap yang ditemukan: ${(assessment.ai_result?.gaps || []).join('; ')}
- Rekomendasi negara: ${(assessment.ai_result?.topCountries || []).map((c: { country: string }) => c.country).join(', ')}

Gunakan konteks di atas saat menjawab pertanyaan pengguna.`;
      }
    }

    const systemInstruction = `Kamu adalah "Konsultan AI ExportReady", konsultan ekspor senior Indonesia dengan pengalaman 20 tahun membantu UMKM.
Aturan:
- Jawab SELALU dalam Bahasa Indonesia yang ramah, jelas, dan mudah dipahami pelaku UMKM.
- Berikan jawaban spesifik, actionable, dan realistis. Gunakan poin-poin jika membantu.
- Format jawaban dengan Markdown yang ringkas: paragraf pendek, **tebal** untuk informasi penting, dan daftar untuk langkah atau rekomendasi. Jangan gunakan HTML.
- Fokus pada topik ekspor, sertifikasi (BPOM, Halal, SNI, ISO, HACCP, dll), logistik, dokumen ekspor, pembayaran internasional, dan pengembangan pasar.
- Jika ditanya di luar topik ekspor/bisnis, arahkan kembali dengan sopan ke topik ekspor.
- Jawab ringkas (maksimal ~250 kata) kecuali diminta detail.
${assessmentContext}`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      systemInstruction,
    });

    // Keep history limited to last 20 turns
    const history = messages.slice(-21, -1).map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: m.content }],
    }));
    // Gemini requires history to start with a user turn
    while (history.length > 0 && history[0].role !== 'user') {
      history.shift();
    }

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage.content);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('CHAT API ERROR:', error);
    return NextResponse.json(
      { error: 'Gagal mendapatkan respon dari Konsultan AI. Coba lagi.' },
      { status: 500 }
    );
  }
}
