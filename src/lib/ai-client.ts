import OpenAI from 'openai';

const baseURL = process.env.AI_PROVIDER_BASE_URL || 'https://router.bynara.id/v1';
const apiKey = process.env.AI_PROVIDER_API_KEY || process.env.GEMINI_API_KEY || '';
const model = process.env.AI_MODEL || 'agnes-2.5-flash';

if (!apiKey) {
  console.warn('AI provider API key is missing. Set AI_PROVIDER_API_KEY or GEMINI_API_KEY.');
}

export const aiClient = new OpenAI({ baseURL, apiKey });

export { model as aiModel };
