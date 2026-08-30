import { readdirSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "supabase", "migrations");
const tsRe = /^(\d{14})_/;

let files;
try {
  files = readdirSync(dir).filter((f) => f.endsWith(".sql"));
} catch (err) {
  console.error(`[migrations] Cannot read directory: ${dir}`);
  console.error(err.message);
  process.exit(1);
}

if (files.length === 0) {
  console.error("[migrations] No migration files found.");
  process.exit(1);
}

const rows = files.map((file) => ({ file, ts: file.match(tsRe)?.[1] ?? null }));
const missing = rows.filter((r) => r.ts === null);
if (missing.length > 0) {
  console.error("[migrations] Files missing a 14-digit timestamp prefix (YYYYMMDDHHMMSS_):");
  for (const r of missing) console.error(`  - ${r.file}`);
  process.exit(1);
}

const sorted = [...rows].sort((a, b) => a.ts.localeCompare(b.ts));
for (let i = 1; i < sorted.length; i++) {
  if (sorted[i].ts === sorted[i - 1].ts) {
    console.error(`[migrations] Duplicate timestamp "${sorted[i].ts}":`);
    console.error(`  - ${sorted[i - 1].file}`);
    console.error(`  - ${sorted[i].file}`);
    process.exit(1);
  }
  if (sorted[i].ts < sorted[i - 1].ts) {
    console.error(`[migrations] Timestamps out of order:`);
    console.error(`  - ${sorted[i - 1].file}`);
    console.error(`  - ${sorted[i].file}`);
    process.exit(1);
  }
}

console.log(`[migrations] OK: ${sorted.length} migrations, timestamps strictly ordered.`);