import { createAdminClient } from './supabase-admin';
import { embedText } from './embeddings';

export interface RegulationChunk {
  id: string;
  source_title: string;
  source_url: string | null;
  chunk_text: string;
  similarity: number;
}

export async function searchRegulations(
  query: string,
  topK = 5,
): Promise<RegulationChunk[]> {
  try {
    const embedding = await embedText(query);
    const admin = createAdminClient();

    const { data, error } = await admin.rpc('match_regulation_chunks', {
      query_embedding: embedding,
      match_count: topK,
    });

    if (error) {
      console.error('searchRegulations RPC error:', error);
      return [];
    }

    return (data ?? []) as RegulationChunk[];
  } catch (err) {
    console.error('searchRegulations error:', err);
    return [];
  }
}

export function formatRegulationContext(chunks: RegulationChunk[]): string {
  if (chunks.length === 0) return '';

  const lines = chunks.map(
    (chunk, i) =>
      `[${i + 1}] ${chunk.source_title}: ${chunk.chunk_text}`,
  );

  return `Berikut kutipan regulasi yang relevan:\n${lines.join('\n\n')}\n\nJika informasi regulasi di atas tidak cukup untuk menjawab, katakan dengan jujur bahwa user perlu verifikasi ke sumber resmi/Kemendag, jangan mengarang.`;
}

export function extractSourceTitles(chunks: RegulationChunk[]): string[] {
  const titles = new Set<string>();
  for (const chunk of chunks) {
    if (chunk.source_title) titles.add(chunk.source_title);
  }
  return Array.from(titles);
}
