import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { model } from '@/lib/gemini';
import { formatApiResponse } from '@/lib/api-auth';

const HsCodeSchema = z.object({
  productName: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = HsCodeSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        formatApiResponse(false, null, {
          code: 'INVALID_INPUT',
          message: 'Nama atau deskripsi produk wajib diisi.',
        }),
        { status: 400 }
      );
    }

    const { productName, category, description } = parsed.data;

    const prompt = `Berikan rekomendasi Kode HS (Harmonized System Code) 6 digit untuk produk ekspor Indonesia berikut:
Produk: ${productName}
Kategori: ${category}
Deskripsi: ${description || '-'}

Kembalikan respon DALAM FORMAT JSON SAJA:
{
  "recommendations": [
    {
      "code": "1234.56",
      "description": "Deskripsi resmi HS Code",
      "confidence": "Sangat Tinggi / Tinggi / Sedang",
      "note": "Catatan teknis singkat"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsedJson = jsonMatch ? JSON.parse(jsonMatch[0]) : { recommendations: [] };

    return NextResponse.json(formatApiResponse(true, parsedJson));
  } catch (err) {
    console.error('HS Code API Error:', err);
    return NextResponse.json(
      formatApiResponse(false, null, {
        code: 'HS_CODE_ERROR',
        message: 'Gagal mendapatkan rekomendasi HS Code dari AI.',
      }),
      { status: 500 }
    );
  }
}
