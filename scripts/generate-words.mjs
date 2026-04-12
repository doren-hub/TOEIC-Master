/**
 * TOEIC Word Generator
 *
 * Gemini API を使って TOEIC 単語を 13,000〜15,000 語生成し
 * src/data/words.json に保存します。
 *
 * 使い方:
 *   GEMINI_API_KEY=<your-key> node scripts/generate-words.mjs
 *   または .env.local に GEMINI_API_KEY=<your-key> を記載して実行:
 *   node scripts/generate-words.mjs
 *
 * オプション環境変数:
 *   BATCH_SIZE=100     1回のAPIコールで生成する単語数 (デフォルト: 100)
 *   DELAY_MS=1200      APIコール間の待機時間ms (デフォルト: 1200)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = dirname(__dirname);

// ── .env.local / .env からAPIキーを読み込む ──────────────────────────────
for (const envFile of ['.env.local', '.env']) {
  const envPath = join(ROOT, envFile);
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    }
    console.log(`Loaded env from ${envFile}`);
    break;
  }
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY || GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
  console.error('❌ GEMINI_API_KEY が設定されていません。');
  console.error('   .env.local に GEMINI_API_KEY=<your-key> を記載するか、');
  console.error('   環境変数として設定してください。');
  process.exit(1);
}

// ── 設定 ─────────────────────────────────────────────────────────────────
/** 各レベルの目標単語数 (合計: 14,000) */
const TARGETS = { 600: 3500, 730: 3500, 860: 3500, 990: 3500 };

const BATCH_SIZE  = parseInt(process.env.BATCH_SIZE  ?? '50', 10);
const DELAY_MS    = parseInt(process.env.DELAY_MS    ?? '1500', 10);

const CATEGORIES = [
  'Business', 'Finance', 'Marketing', 'Office', 'General',
  'Technology', 'HR', 'Legal', 'Travel', 'Management',
];

const LEVEL_DESCRIPTIONS = {
  600:  'TOEIC 600 点レベル — 日常ビジネス場面でよく使われる基本的な動詞・名詞・形容詞',
  730:  'TOEIC 730 点レベル — 職場でのやり取りや業務運営に関わる中級の語彙',
  860:  'TOEIC 860 点レベル — ビジネス・学術的文脈で使われる上級語彙と専門用語',
  990:  'TOEIC 990 点レベル — 高度に洗練された、技術的・専門的・ニュアンスが豊かな語彙',
};

const WORDS_JSON = join(ROOT, 'src', 'data', 'words.json');

// ── ユーティリティ ────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function loadWords() {
  if (!existsSync(WORDS_JSON)) return [];
  return JSON.parse(readFileSync(WORDS_JSON, 'utf8'));
}

function saveWords(words) {
  writeFileSync(WORDS_JSON, JSON.stringify(words, null, 2), 'utf8');
}

// ── Gemini API でバッチ生成 ────────────────────────────────────────────────
let _ai = null;
async function getAI() {
  if (_ai) return _ai;
  const { GoogleGenAI } = await import('@google/genai');
  _ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  return _ai;
}

async function generateBatch(level, count, usedTerms) {
  const ai = await getAI();

  // 重複回避サンプル（最大200語をランダムに提示）
  const sample = [...usedTerms]
    .sort(() => Math.random() - 0.5)
    .slice(0, 200)
    .join(', ');

  const prompt = `あなたは TOEIC 語彙の専門家です。
以下の条件で英語単語を正確に ${count} 個生成してください。

【レベル】${LEVEL_DESCRIPTIONS[level]}

【ルール】
1. 次の既存単語を絶対に含めないこと: ${sample}
2. 動詞・名詞・形容詞・副詞をバランスよく混ぜること
3. 日本語の意味は正確かつ簡潔にすること
4. 例文は自然なビジネス英語で 1〜2 文にすること
5. カテゴリは以下から選ぶこと: ${CATEGORIES.join(', ')}

【出力形式】
マークダウンや説明文を一切含めず、以下の JSON 配列のみを返すこと:
[{"term":"英単語","meaning":"日本語の意味","example":"Example sentence.","category":"Category"}]

正確に ${count} 件生成すること。`;

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0.85, maxOutputTokens: 8192 },
      });

      let text = (response.text ?? '').trim()
        .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

      const data = JSON.parse(text);
      if (Array.isArray(data) && data.length > 0) return data;
      throw new Error(`配列ではない、または空 (attempt ${attempt})`);
    } catch (err) {
      const wait = 2000 * attempt;
      if (attempt < 4) {
        console.warn(`    ⚠ attempt ${attempt}/4 失敗 (${err.message}) → ${wait / 1000}s 後にリトライ`);
        await sleep(wait);
      } else {
        console.error(`    ✗ バッチ生成失敗 (4回): ${err.message}`);
      }
    }
  }
  return [];
}

// ── メイン ────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 TOEIC Word Generator\n');
  console.log(`設定: BATCH_SIZE=${BATCH_SIZE}, DELAY_MS=${DELAY_MS}ms`);
  console.log(`目標: ${JSON.stringify(TARGETS)} (合計 ${Object.values(TARGETS).reduce((a, b) => a + b, 0)})\n`);

  const words    = loadWords();
  const usedTerms = new Set(words.map(w => w.term.toLowerCase().trim()));

  const countByLevel = words.reduce((acc, w) => {
    acc[w.level] = (acc[w.level] || 0) + 1;
    return acc;
  }, {});

  console.log('現在の単語数:', countByLevel, `(合計 ${words.length})`);
  console.log('');

  let nextId = words.length > 0
    ? Math.max(...words.map(w => parseInt(w.id) || 0)) + 1
    : 1;

  for (const level of [600, 730, 860, 990]) {
    const have   = countByLevel[level] || 0;
    const needed = TARGETS[level] - have;

    if (needed <= 0) {
      console.log(`✅ Level ${level}: ${have} 語 (目標達成済み)`);
      continue;
    }

    console.log(`\n📚 Level ${level}: ${needed} 語を追加生成 (${have} → ${TARGETS[level]})`);

    let added = 0;
    let batchNum = 0;

    while (added < needed) {
      batchNum++;
      const toGet = Math.min(BATCH_SIZE, needed - added);
      process.stdout.write(`  [Batch ${batchNum}] ${toGet} 語を生成中... `);

      const batch = await generateBatch(level, toGet, usedTerms);
      let batchAdded = 0;

      for (const entry of batch) {
        if (!entry?.term?.trim() || !entry?.meaning?.trim() || !entry?.example?.trim()) continue;
        const key = entry.term.toLowerCase().trim();
        if (usedTerms.has(key)) continue;

        usedTerms.add(key);
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

      const total = have + added;
      const pct   = Math.round((total / TARGETS[level]) * 100);
      console.log(`+${batchAdded} 語 → ${total}/${TARGETS[level]} (${pct}%)`);

      // バッチごとに中間保存
      saveWords(words);

      if (added < needed) await sleep(DELAY_MS);
    }

    console.log(`✅ Level ${level}: 完了!`);
  }

  const finalDist = words.reduce((acc, w) => {
    acc[w.level] = (acc[w.level] || 0) + 1;
    return acc;
  }, {});

  console.log('\n🎉 生成完了!');
  console.log('総単語数:', words.length);
  console.log('レベル別:', finalDist);

  saveWords(words);
  console.log(`\n✅ ${WORDS_JSON} に保存しました`);
}

main().catch(e => {
  console.error('❌ 予期しないエラー:', e);
  process.exit(1);
});
