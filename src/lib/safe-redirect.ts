export function getSafeNextPath(
  value: string | null | undefined,
  fallback = '/dashboard',
): string {
  if (!value) return fallback;

  try {
    const base = new URL('https://exportready.invalid');
    const target = new URL(value, base);
    if (target.origin !== base.origin || !value.startsWith('/') || value.startsWith('//')) {
      return fallback;
    }
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}
