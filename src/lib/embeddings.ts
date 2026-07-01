import { genAI } from './gemini';

const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSION = 768;

export async function embedText(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  const values = result.embedding.values;

  if (values.length !== EMBEDDING_DIMENSION) {
    console.warn(
      `Embedding dimension ${values.length} != expected ${EMBEDDING_DIMENSION}`,
    );
  }

  return values;
}

export { EMBEDDING_DIMENSION };
