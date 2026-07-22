import fs from 'node:fs';
import path from 'node:path';

const directory = path.join(process.cwd(), 'supabase', 'migrations');
const files = fs.readdirSync(directory).filter((file) => file.endsWith('.sql')).sort();
const versions = new Set();

for (const file of files) {
  const version = file.split('_', 1)[0];
  if (!/^\d{14}$/.test(version)) throw new Error(`Invalid migration timestamp: ${file}`);
  if (versions.has(version)) throw new Error(`Duplicate migration timestamp: ${version}`);
  versions.add(version);

  const sql = fs.readFileSync(path.join(directory, file), 'utf8');
  if (!sql.trim()) throw new Error(`Empty migration: ${file}`);
}

console.log(`[migrations] ${files.length} migration files validated`);
