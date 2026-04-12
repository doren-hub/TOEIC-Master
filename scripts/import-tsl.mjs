/**
 * TSL (TOEIC Service List) Importer
 *
 * TSLの単語リストに日本語訳・例文・カテゴリ・TOEICレベルを付与して
 * src/data/words.json に追加します。
 *
 * 使い方:
 *   GEMINI_API_KEY=<key> node scripts/import-tsl.mjs [input-words-file]
 *   input-words-file: 1行1単語のテキストファイル（省略時: /tmp/tsl_new_words.txt）
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = dirname(__dirname);

// .env.local / .env 読み込み
for (const envFile of ['.env.local', '.env']) {
  const envPath = join(ROOT, envFile);
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    }
    break;
  }
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY || GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
  console.error('❌ GEMINI_API_KEY が設定されていません。');
  process.exit(1);
}

const WORDS_JSON   = join(ROOT, 'src', 'data', 'words.json');
const INPUT_FILE   = process.argv[2] ?? '/tmp/tsl_new_words.txt';
const BATCH_SIZE   = 40;
const DELAY_MS     = 1500;
const CATEGORIES   = ['Business','Finance','Marketing','Office','General','Technology','HR','Legal','Travel','Management'];

const sleep = ms => new Promise(r => setTimeout(r, ms));

function loadWords()        { return existsSync(WORDS_JSON) ? JSON.parse(readFileSync(WORDS_JSON,'utf8')) : []; }
function saveWords(words)   { writeFileSync(WORDS_JSON, JSON.stringify(words, null, 2), 'utf8'); }

let _ai = null;
async function getAI() {
  if (_ai) return _ai;
  const { GoogleGenAI } = await import('@google/genai');
  _ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  return _ai;
}

async function enrichBatch(terms) {
  const ai = await getAI();
  const prompt = `あなたは TOEIC 語彙の専門家です。
以下の英単語それぞれについて、TOEICビジネス文脈での情報を返してください。

単語リスト:
${terms.join('\n')}

各単語について以下の JSON オブジェクトを生成してください:
- "term": 入力した英単語（そのまま）
- "meaning": 日本語の意味（簡潔に、TOEICで最もよく使われる意味）
- "example": 自然なビジネス英語の例文（1文、TOEICらしい文脈）
- "category": 次のいずれか: ${CATEGORIES.join(', ')}
- "level": TOEICスコアレベル（600, 730, 860, 990 のいずれか整数）
  ※ 基本的なビジネス語=600, 中級=730, 上級=860, 専門的・難解=990

マークダウンや説明文を一切含めず、以下の形式の JSON 配列のみを返すこと:
[{"term":"...","meaning":"...","example":"...","category":"...","level":600},...]

必ず ${terms.length} 件すべて返すこと。`;

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { temperature: 0.3, maxOutputTokens: 8192 },
      });
      let text = (response.text ?? '').trim()
        .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const data = JSON.parse(text);
      if (Array.isArray(data) && data.length > 0) return data;
      throw new Error(`空または配列でない (attempt ${attempt})`);
    } catch (err) {
      const wait = 2000 * attempt;
      if (attempt < 4) {
        console.warn(`  ⚠ attempt ${attempt}/4 失敗 (${err.message}) → ${wait/1000}s 後リトライ`);
        await sleep(wait);
      } else {
        console.error(`  ✗ バッチ失敗: ${err.message}`);
      }
    }
  }
  return [];
}

async function main() {
  console.log('🚀 TSL Importer\n');

  if (!existsSync(INPUT_FILE)) {
    console.error(`❌ 入力ファイルが見つかりません: ${INPUT_FILE}`);
    process.exit(1);
  }

  const inputTerms = readFileSync(INPUT_FILE, 'utf8')
    .split('\n').map(w => w.trim()).filter(Boolean);

  const words       = loadWords();
  const existing    = new Set(words.map(w => w.term.toLowerCase().trim()));
  const toProcess   = inputTerms.filter(t => !existing.has(t.toLowerCase().trim()));

  console.log(`入力単語数: ${inputTerms.length}`);
  console.log(`既存DB単語数: ${words.length}`);
  console.log(`追加対象: ${toProcess.length} 語\n`);

  let nextId   = words.length > 0 ? Math.max(...words.map(w => parseInt(w.id) || 0)) + 1 : 1;
  let added    = 0;
  const total  = toProcess.length;
  const batches = Math.ceil(total / BATCH_SIZE);

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batchNum  = Math.floor(i / BATCH_SIZE) + 1;
    const chunk     = toProcess.slice(i, i + BATCH_SIZE);
    process.stdout.write(`[${batchNum}/${batches}] ${chunk.length}語を処理中... `);

    const enriched = await enrichBatch(chunk);
    let batchAdded = 0;

    for (const entry of enriched) {
      if (!entry?.term?.trim() || !entry?.meaning?.trim() || !entry?.example?.trim()) continue;
      const key = entry.term.toLowerCase().trim();
      if (existing.has(key)) continue;

      const level = [600, 730, 860, 990].includes(entry.level) ? entry.level : 600;
      existing.add(key);
      words.push({
        id:       String(nextId++),
        term:     entry.term.trim(),
        meaning:  entry.meaning.trim(),
        example:  entry.example.trim(),
        level,
        category: CATEGORIES.includes(entry.category) ? entry.category : 'General',
      });
      batchAdded++;
      added++;
    }

    console.log(`+${batchAdded}語 → 合計 ${words.length}語`);
    saveWords(words);

    if (i + BATCH_SIZE < total) await sleep(DELAY_MS);
  }

  const dist = words.reduce((acc, w) => { acc[w.level] = (acc[w.level]||0)+1; return acc; }, {});
  console.log(`\n✅ 完了! TSLから ${added} 語を追加しました`);
  console.log('レベル別:', dist);
  console.log(`総単語数: ${words.length}`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
