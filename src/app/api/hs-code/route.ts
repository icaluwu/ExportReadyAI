import { NextRequest, NextResponse } from 'next/server';
import { model } from '@/lib/gemini';

// Simple in-memory rate limit (per serverless instance)
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const windowHits = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (windowHits.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(key, windowHits);
    return true;
  }
  windowHits.push(now);
  hits.set(key, windowHits);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' },
        { status: 429 }
      );
    }

    const { productName, category, description } = await req.json();

    if (!productName || typeof productName !== 'string') {
      return NextResponse.json({ error: 'Nama produk wajib diisi.' }, { status: 400 });
    }

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
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!parsed?.candidates?.length) {
      throw new Error('Format respon AI tidak valid');
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('HS CODE API ERROR:', error);
    return NextResponse.json(
      { error: 'Gagal mencari kode HS. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
