/**
 * Ingest regulation text files into regulation_chunks with Gemini embeddings.
 * Usage: npx tsx scripts/ingest-regulations.ts
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SOURCE_DIR = path.join(process.cwd(), 'regulations-source');
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const EMBEDDING_MODEL = 'text-embedding-004';

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function chunkText(text: string): string[] {
  const sentences = splitIntoSentences(text);
  const chunks: string[] = [];
  let current = '';
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    if (currentTokens + sentenceTokens > CHUNK_SIZE && current) {
      chunks.push(current.trim());
      const words = current.split(/\s+/);
      const overlapWords = words.slice(-Math.floor(CHUNK_OVERLAP * 1.3));
      current = overlapWords.join(' ') + ' ' + sentence;
      currentTokens = estimateTokens(current);
    } else {
      current += (current ? ' ' : '') + sentence;
      currentTokens += sentenceTokens;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function deriveSourceTitle(filename: string, chunkText: string, index: number): string {
  const base = filename.replace(/\.(txt|md)$/i, '').replace(/[-_]/g, ' ');
  const pasalMatch = chunkText.match(/Pasal\s+\d+[A-Za-z]*/i);
  if (pasalMatch) {
    return `${base} — ${pasalMatch[0]}`;
  }
  return `${base} (bagian ${index + 1})`;
}

async function embedText(genAI: GoogleGenerativeAI, text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!supabaseUrl || !serviceKey || !geminiKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or GEMINI_API_KEY');
    process.exit(1);
  }

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Folder tidak ditemukan: ${SOURCE_DIR}`);
    console.error('Buat folder regulations-source/ dan taruh file .txt atau .md di dalamnya.');
    process.exit(1);
  }

  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => /\.(txt|md)$/i.test(f));

  if (files.length === 0) {
    console.error('Tidak ada file .txt atau .md di regulations-source/');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const genAI = new GoogleGenerativeAI(geminiKey);

  console.log(`Memproses ${files.length} file...\n`);

  for (const file of files) {
    const filePath = path.join(SOURCE_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const chunks = chunkText(content);

    console.log(`📄 ${file} — ${chunks.length} chunk`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const sourceTitle = deriveSourceTitle(file, chunk, i);

      try {
        const embedding = await embedText(genAI, chunk);

        const { error } = await supabase.from('regulation_chunks').insert({
          source_title: sourceTitle,
          source_url: null,
          chunk_text: chunk,
          chunk_index: i,
          embedding,
        });

        if (error) {
          console.error(`  ✗ chunk ${i + 1}/${chunks.length}: ${error.message}`);
        } else {
          console.log(`  ✓ ${file} — chunk ${i + 1}/${chunks.length} inserted`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ✗ chunk ${i + 1}/${chunks.length}: ${msg}`);
      }

      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log('\nSelesai.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
