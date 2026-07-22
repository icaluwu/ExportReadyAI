export interface AiResultShape {
  summary?: string;
  topCountries?: Array<Record<string, unknown>>;
  gaps?: string[];
  roadmap?: Record<string, string[]>;
  motivationalNote?: string;
  regulationSources?: string[];
  [key: string]: unknown;
}

export function maskFreeAiResult(result: unknown): AiResultShape {
  const safeResult = result && typeof result === 'object' ? result as AiResultShape : {};
  const countries = safeResult.topCountries ?? [];
  const visibleCountries = countries.length
    ? [
        countries[0],
        {
          country: 'Negara Premium',
          flag: '\u{1F512}',
          demandLevel: 'Premium',
          reason: 'Buka paket Premium untuk melihat rekomendasi lainnya.',
        },
      ]
    : [];

  return {
    ...safeResult,
    topCountries: visibleCountries,
    roadmap: safeResult.roadmap
      ? {
          ...safeResult.roadmap,
          fase3: ['Langkah premium dikunci.'],
          fase4: ['Langkah premium dikunci.'],
        }
      : undefined,
  };
}