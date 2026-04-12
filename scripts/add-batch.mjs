/**
 * バッチ追加ユーティリティ
 * 使い方: node scripts/add-batch.mjs <batch-file.json>
 * batch-file.json: [{ term, meaning, example, level, category }, ...]
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const WORDS_JSON = join(ROOT, 'src', 'data', 'words.json');

const batchFile = process.argv[2];
if (!batchFile) { console.error('Usage: node add-batch.mjs <batch.json>'); process.exit(1); }

const newWords = JSON.parse(readFileSync(batchFile, 'utf8'));
const existing = JSON.parse(readFileSync(WORDS_JSON, 'utf8'));
const existingTerms = new Set(existing.map(w => w.term.toLowerCase().trim()));
let nextId = Math.max(...existing.map(w => parseInt(w.id) || 0)) + 1;

let added = 0;
for (const w of newWords) {
  const key = (w.term || '').toLowerCase().trim();
  if (!key || existingTerms.has(key)) continue;
  existingTerms.add(key);
  existing.push({ id: String(nextId++), term: w.term.trim(), meaning: w.meaning.trim(), example: w.example.trim(), level: w.level, category: w.category });
  added++;
}

writeFileSync(WORDS_JSON, JSON.stringify(existing, null, 2), 'utf8');
const dist = existing.reduce((a, w) => { a[w.level] = (a[w.level]||0)+1; return a; }, {});
console.log(`✅ +${added} words added. Total: ${existing.length} | ${JSON.stringify(dist)}`);
