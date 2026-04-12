/**
 * TOEIC Level Corrector
 *
 * Gemini によるレベル割り当てミスを修正します。
 * - L860 に混入した基本語/中級語を L600/L730 に移動
 * - L730 に混入した基本語を L600 に移動
 * - L990 の非ビジネス語を L860 以下に移動
 *
 * 使い方:
 *   node scripts/fix-levels.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = dirname(__dirname);
const WORDS_JSON = join(ROOT, 'src', 'data', 'words.json');
const DRY_RUN = process.argv.includes('--dry-run');

// ── レベル修正マップ ─────────────────────────────────────────────────────────
/**
 * キー: 単語 (小文字)
 * 値: 新しいレベル
 */
const LEVEL_FIXES = {
  // ── L860 → L600: 超基本語が誤って L860 に割り当てられた ────────────────
  balloon:   600,  // 気球（基本名詞）
  biology:   600,  // 生物学（学科名、基本語）
  chemistry: 600,  // 化学（学科名、基本語）
  drum:      600,  // ドラム（基本名詞）
  item:      600,  // 項目（超基本語）
  job:       600,  // 仕事（超基本語）
  label:     600,  // ラベル（基本語）
  major:     600,  // 主要な/専攻（基本語）
  media:     600,  // メディア（基本語）
  military:  600,  // 軍の（基本語）
  pepper:    600,  // コショウ（基本名詞）

  // ── L860 → L730: 中級ビジネス語が誤って L860 に ────────────────────────
  cite:      730,  // 引用する
  clause:    730,  // 条項
  guarantee: 730,  // 保証する
  index:     730,  // 指数/索引
  initial:   730,  // 最初の
  instance:  730,  // 場合/例
  internal:  730,  // 内部の
  issue:     730,  // 問題/発行する
  journal:   730,  // 専門誌/日誌
  labor:     730,  // 労働
  layer:     730,  // 層/レイヤー
  lecture:   730,  // 講演/講義
  legal:     730,  // 法的な
  license:   730,  // 免許/ライセンス
  likewise:  730,  // 同様に
  link:      730,  // リンク/つなぐ
  location:  730,  // 場所/立地
  logic:     730,  // 論理
  maintain:  730,  // 維持する
  manual:    730,  // マニュアル/手動の
  mature:    730,  // 成熟した
  medical:   730,  // 医療の
  medium:    730,  // 中間/媒体
  mental:    730,  // 精神的な
  method:    730,  // 方法
  migrate:   730,  // 移行する/移住する
  margin:    730,  // 利益率/余白
  nominate:  730,  // 指名する

  // ── L730 → L600: 基礎語が誤って L730 に ────────────────────────────────
  allergy:      600,  // アレルギー（日常語）
  footwear:     600,  // 履物（日常語）
  homework:     600,  // 宿題（日常語）
  newsletter:   600,  // ニュースレター（基本語）
  pottery:      600,  // 陶芸（基本語）
  runner:       600,  // 走る人（基本語）
  sleepy:       600,  // 眠い（基本語）

  // ── L990 → L600: 超基本語が誤って L990 に ──────────────────────────────
  elephant: 600,   // 象（超基本語）
  novice:   600,   // 初心者（基本語）

  // ── L990 → L730: 中級語が誤って L990 に ────────────────────────────────
  albeit:   730,   // 〜にもかかわらず（接続詞、中級）
  nominal:  730,   // 名目上の（ビジネス中級）
  refurbish: 730,  // 改装する（ビジネス中級）

  // ── L990 → L860: 難語だが TOEIC ビジネスに特化しない語 ─────────────────
  // （文学的・感情的・人格描写語 → L860 に格下げ）
  amiable:      860,  // 友好的な
  brazen:       860,  // 厚かましい
  brusque:      860,  // ぶっきらぼうな
  candor:       860,  // 率直さ
  chide:        860,  // 叱る
  deride:       860,  // 嘲笑する
  despot:       860,  // 専制者
  elated:       860,  // 有頂天の
  empathy:      860,  // 共感
  enmity:       860,  // 敵意
  extol:        860,  // 称賛する
  feral:        860,  // 野生の
  flabbergasted: 860, // 仰天した
  forsake:      860,  // 見捨てる
  fractious:    860,  // 手に負えない
  furtive:      860,  // こっそりとした
  gluttony:     860,  // 暴食
  haughty:      860,  // 傲慢な
  jubilant:     860,  // 大喜びの
  knell:        860,  // 弔いの鐘
  lithe:        860,  // しなやかな
  lurid:        860,  // センセーショナルな
  morose:       860,  // 不機嫌な
  obsequious:   860,  // こびへつらう
  parody:       860,  // パロディ
  quaint:       860,  // 趣のある
  serendipity:  860,  // 幸運な偶然
  staid:        860,  // 落ち着いた
  taciturn:     860,  // 無口な
};

// ── メイン処理 ─────────────────────────────────────────────────────────────
function main() {
  const words = JSON.parse(readFileSync(WORDS_JSON, 'utf8'));
  const stats = {};

  let fixedCount = 0;
  for (const word of words) {
    const key = word.term.toLowerCase().trim();
    if (LEVEL_FIXES.hasOwnProperty(key)) {
      const oldLevel = word.level;
      const newLevel = LEVEL_FIXES[key];
      if (oldLevel !== newLevel) {
        if (!stats[`${oldLevel}→${newLevel}`]) stats[`${oldLevel}→${newLevel}`] = [];
        stats[`${oldLevel}→${newLevel}`].push(word.term);
        if (!DRY_RUN) word.level = newLevel;
        fixedCount++;
      }
    }
  }

  console.log(`\n📊 レベル修正結果 (${DRY_RUN ? 'ドライラン' : '適用'})\n`);
  for (const [transition, terms] of Object.entries(stats).sort()) {
    console.log(`  ${transition}: ${terms.length}語`);
    console.log(`    → ${terms.join(', ')}`);
  }

  console.log(`\n修正合計: ${fixedCount} 語`);

  if (!DRY_RUN) {
    writeFileSync(WORDS_JSON, JSON.stringify(words, null, 2), 'utf8');
    const dist = words.reduce((a, w) => { a[w.level] = (a[w.level] || 0) + 1; return a; }, {});
    console.log('\n修正後レベル別:', dist);
    console.log(`✅ ${WORDS_JSON} を更新しました`);
  } else {
    console.log('\n（--dry-run モード: ファイルは変更されていません）');
    console.log('適用するには: node scripts/fix-levels.mjs');
  }
}

main();
