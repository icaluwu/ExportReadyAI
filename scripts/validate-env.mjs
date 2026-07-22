import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const skip = process.env.SKIP_ENV_VALIDATION === 'true';
if (skip) {
  console.warn('[validate-env] SKIP_ENV_VALIDATION=true - skipping checks');
  process.exit(0);
}

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'GEMINI_API_KEY',
];

const productionPayments =
  process.env.VERCEL_ENV === 'production' ||
  process.env.REQUIRE_PRODUCTION_PAYMENTS === 'true';

if (productionPayments) {
  required.push(
    'SUPABASE_SERVICE_ROLE_KEY',
    'MIDTRANS_SERVER_KEY',
    'MIDTRANS_CLIENT_KEY',
    'NEXT_PUBLIC_MIDTRANS_CLIENT_KEY',
  );
}

const missing = required.filter((key) => !process.env[key]?.trim());
if (missing.length > 0) {
  console.error(
    '[validate-env] Missing required environment variables:\n' +
      missing.map((key) => '  - ' + key).join('\n'),
  );
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl?.startsWith('https://') || !supabaseUrl.includes('supabase')) {
  console.error('[validate-env] NEXT_PUBLIC_SUPABASE_URL is invalid');
  process.exit(1);
}

if (productionPayments) {
  if (
    process.env.MIDTRANS_IS_PRODUCTION !== 'true' ||
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION !== 'true'
  ) {
    console.error(
      '[validate-env] Production deployments require both Midtrans production flags to be true',
    );
    process.exit(1);
  }

  if (process.env.MIDTRANS_CLIENT_KEY !== process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY) {
    console.error('[validate-env] Server and public Midtrans client keys do not match');
    process.exit(1);
  }
}

console.log('[validate-env] OK');