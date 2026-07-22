import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { model } from '@/lib/gemini';
import { createRateLimiter, getClientIp } from '@/lib/rate-limit';

const HsCodeSchema = z.object({
  productName: z.string().trim().min(1).max(200),
  category: z.string().trim().max(100).optional().nullable(),
  description: z.string().trim().max(1_000).optional().nullable(),
});

// Rate limit: 5 HS code lookups per minute per client
const rateLimit = createRateLimiter({ endpoint: 'hs-code', maxRequests: 5, windowMs: 60_000 });

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

    const parsed = HsCodeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data produk tidak valid.' }, { status: 400 });
    }
    const { productName, category, description } = parsed.data;

    const prompt = `Kamu adalah ahli klasifikasi kepabeanan Indonesia yang menguasai Harmonized System (HS) Code dan BTKI (Buku Tarif Kepabeanan Indonesia).

Produk yang perlu diklasifikasikan:
- Nama: ${productName}
- Kategori: ${category || 'tidak disebutkan'}
- Deskripsi: ${description || 'tidak disebutkan'}

Berikan maksimal 3 kandidat kode HS yang paling mungkin (format 6 digit dengan titik, contoh: 1905.90).
Jawab HANYA dalam format JSON berikut tanpa teks lain:
{
  "candidates": [
    {
      "code": "kode HS 6 digit dengan titik",
      "title": "deskripsi singkat kategori HS dalam Bahasa Indonesia",
      "confidence": "Tinggi/Sedang/Rendah",
      "reason": "1 kalimat alasan singkat"
    }
  ],
  "note": "1 kalimat pengingat bahwa kode final harus diverifikasi dengan BTKI/bea cukai"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const aiResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!aiResponse?.candidates?.length) {
      throw new Error('Format respon AI tidak valid');
    }

    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error('HS CODE API ERROR:', error);
    return NextResponse.json(
      { error: 'Gagal mencari kode HS. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
