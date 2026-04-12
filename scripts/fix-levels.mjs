/**
 * TOEIC Level Corrector
 *
 * Gemini によるレベル割り当てミスを修正します。
 * クラウド環境・ローカル環境（BSL/TSL import済み）の両方に対応。
 *
 * 使い方:
 *   node scripts/fix-levels.mjs [--dry-run]
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = dirname(__dirname);
const WORDS_JSON = join(ROOT, 'src', 'data', 'words.json');
const DRY_RUN = process.argv.includes('--dry-run');

// ── レベル修正マップ ─────────────────────────────────────────────────────────
// キー: 単語 (小文字), 値: 正しいレベル
// ※ 現在のレベルと同じ場合は何もしない（重複適用しても安全）
const LEVEL_FIXES = {

  // ════════════════════════════════════════════════════════════════════════
  // L860 → L600: 超基本語・日常語
  // ════════════════════════════════════════════════════════════════════════
  acid:      600,  // 酸（基礎科学語）
  alas:      600,  // ああ/残念（基本感嘆詞）
  atom:      600,  // 原子（基礎科学語）
  bail:      600,  // 保釈（日常法律語）
  balloon:   600,  // 気球（基本名詞）
  beef:      600,  // 牛肉（基本食物語）
  biology:   600,  // 生物学（学科名）
  blast:     600,  // 爆発（基本語）
  bust:      600,  // 破産/壊す（口語・基本語）
  chemistry: 600,  // 化学（学科名）
  clone:     600,  // クローン（基本技術語）
  con:       600,  // 詐欺/反対（口語・基本語）
  dub:       600,  // 呼ぶ/吹き替え（基本語）
  drum:      600,  // ドラム（基本名詞）
  dump:      600,  // 捨てる（基本語）
  gang:      600,  // ギャング（基本語）
  grave:     600,  // 墓/深刻な（基本語）
  grim:      600,  // 険しい（基本形容詞）
  hydrogen:  600,  // 水素（基礎科学語）
  item:      600,  // 項目（超基本語）
  job:       600,  // 仕事（超基本語）
  label:     600,  // ラベル（基本語）
  macro:     600,  // マクロ（基本語）
  major:     600,  // 主要な（基本語）
  mar:       600,  // 傷つける（基本語）
  media:     600,  // メディア（基本語）
  military:  600,  // 軍の（基本語）
  mold:      600,  // 型/カビ（基本語）
  molecule:  600,  // 分子（基礎科学語）
  myth:      600,  // 神話（基本語）
  nasty:     600,  // 不快な（基本口語）
  node:      600,  // ノード（基本技術語）
  null:      600,  // ヌル（基本技術語）
  pepper:    600,  // コショウ（基本名詞）
  pit:       600,  // 穴（基本語）
  plague:    600,  // 疫病（基本語）
  prop:      600,  // 支持/小道具（基本語）
  raid:      600,  // 急襲（基本語）
  riot:      600,  // 暴動（基本語）
  suicide:   600,  // 自殺（基本語）
  torture:   600,  // 拷問（基本語）
  tribal:    600,  // 部族の（基本語）
  tribe:     600,  // 部族（基本語）
  tumble:    600,  // 転落する（基本語）
  uranium:   600,  // ウラン（基礎科学語）
  woe:       600,  // 悲嘆（基本語）

  // ════════════════════════════════════════════════════════════════════════
  // L860 → L730: 中級ビジネス語（L860は上級すぎる）
  // ════════════════════════════════════════════════════════════════════════
  absorption:    730,  // 吸収/M&A
  accrual:       730,  // 発生主義（会計）
  allegedly:     730,  // 申し立てによれば
  annuity:       730,  // 年金/定期支払い
  annum:         730,  // 年（per annum）
  appetite:      730,  // 意欲/リスク選好度
  arguably:      730,  // おそらく/主張できる
  autonomous:    730,  // 自律的な
  autonomy:      730,  // 自律性/自治
  beneficiary:   730,  // 受益者
  bilateral:     730,  // 二国間の
  boycott:       730,  // ボイコット
  bribe:         730,  // 賄賂
  cartel:        730,  // カルテル
  cite:          730,  // 引用する
  clause:        730,  // 条項
  coalition:     730,  // 連立/連合
  collateral:    730,  // 担保
  compulsory:    730,  // 義務的な
  creditor:      730,  // 債権者
  debtor:        730,  // 債務者
  decentralize:  730,  // 分散化する
  deployment:    730,  // 展開/配備
  differential:  730,  // 差額/格差
  differentiation: 730, // 差別化
  discretion:    730,  // 裁量
  enforcement:   730,  // 施行/取り締まり
  entrant:       730,  // 参入者
  fraudulent:    730,  // 不正な
  fringe:        730,  // 周辺/付加給付
  globalization: 730,  // グローバル化
  governance:    730,  // ガバナンス
  guarantee:     730,  // 保証する
  inclusion:     730,  // 包括性/参加
  incorporation: 730,  // 法人設立
  index:         730,  // 指数/索引
  initial:       730,  // 最初の
  instance:      730,  // 場合/例
  internal:      730,  // 内部の
  issuance:      730,  // 発行
  issuer:        730,  // 発行者
  issue:         730,  // 問題/発行する
  journal:       730,  // 専門誌/日誌
  judicial:      730,  // 司法の
  labor:         730,  // 労働
  layer:         730,  // 層/レイヤー
  lecture:       730,  // 講演/講義
  legal:         730,  // 法的な
  legislative:   730,  // 立法の
  legislature:   730,  // 立法府
  legitimacy:    730,  // 正当性
  lessee:        730,  // 賃借人
  lessor:        730,  // 貸主
  leverage:      730,  // 活用する/レバレッジ
  license:       730,  // 免許/ライセンス
  likewise:      730,  // 同様に
  linear:        730,  // 線形の
  link:          730,  // リンク/つなぐ
  location:      730,  // 場所/立地
  logic:         730,  // 論理
  lucrative:     730,  // 収益性の高い
  lure:          730,  // 引き寄せる
  maintain:      730,  // 維持する
  mandate:       730,  // 指令/義務付ける
  maneuver:      730,  // 戦略/機動する
  manual:        730,  // マニュアル/手動の
  marginal:      730,  // 限界の/わずかな
  margin:        730,  // 利益率/余白
  materially:    730,  // 実質的に
  mature:        730,  // 成熟した
  medical:       730,  // 医療の
  medium:        730,  // 中間/媒体
  mental:        730,  // 精神的な
  method:        730,  // 方法
  methodology:   730,  // 方法論
  migrate:       730,  // 移行する
  migrant:       730,  // 移民/移動者
  migration:     730,  // 移住/移行
  niche:         730,  // ニッチ
  nominate:      730,  // 指名する
  offset:        730,  // 相殺する
  optimization:  730,  // 最適化
  optimum:       730,  // 最適の
  outflow:       730,  // 流出
  outlay:        730,  // 支出
  outrage:       730,  // 激怒させる
  outright:      730,  // 完全な/全面的な
  outweigh:      730,  // 上回る
  overhaul:      730,  // 大改修/再検討
  oversight:     730,  // 監督/見落とし
  par:           730,  // 同等/額面価値
  parameter:     730,  // パラメータ
  parity:        730,  // 平等/平価
  peg:           730,  // 固定する
  populist:      730,  // ポピュリストの
  precedent:     730,  // 前例
  predetermine:  730,  // 事前に決定する
  predictor:     730,  // 予測因子
  premier:       730,  // 首相/最高の
  presidency:    730,  // 大統領職/会長職
  privatization: 730,  // 民営化
  privatize:     730,  // 民営化する
  probe:         730,  // 調査する
  proportional:  730,  // 比例した
  prosecute:     730,  // 起訴する
  prosecution:   730,  // 起訴
  prosecutor:    730,  // 検察官
  provincial:    730,  // 地方の
  provoke:       730,  // 引き起こす
  proxy:         730,  // 代理人/委任状
  qualitative:   730,  // 定性的な
  quantify:      730,  // 定量化する
  quantitative:  730,  // 定量的な
  ratify:        730,  // 批准する
  ration:        730,  // 配給する
  realizable:    730,  // 実現可能な
  rebel:         730,  // 反乱者/反抗する
  referendum:    730,  // 国民投票
  reformer:      730,  // 改革者
  reformist:     730,  // 改革派の
  regime:        730,  // 体制/政権
  regression:    730,  // 回帰/後退
  rein:          730,  // 制御する/手綱
  render:        730,  // 与える/処理する
  repertoire:    730,  // レパートリー
  restrain:      730,  // 抑制する
  restraint:     730,  // 抑制
  revaluation:   730,  // 再評価
  rig:           730,  // 不正に操作する
  royalty:       730,  // ロイヤリティ
  salvage:       730,  // 救助/再利用する
  scorecard:     730,  // スコアカード
  segmentation:  730,  // セグメンテーション
  sentiment:     730,  // 感情/市場心理
  shortfall:     730,  // 不足/赤字
  simulate:      730,  // シミュレートする
  simulation:    730,  // シミュレーション
  skeptical:     730,  // 懐疑的な
  slack:         730,  // 余裕/緩んだ
  slash:         730,  // 大幅削減する
  slump:         730,  // 急落/不況
  speculate:     730,  // 投機する/推測する
  speculation:   730,  // 投機/推測
  speculative:   730,  // 投機的な
  spur:          730,  // 刺激する
  statute:       730,  // 法令
  statutory:     730,  // 法定の
  subordinate:   730,  // 部下/従属する
  subsidy:       730,  // 補助金
  succession:    730,  // 継承/後継
  suppress:      730,  // 抑圧する/抑制する
  surge:         730,  // 急増する
  surrender:     730,  // 降伏する/放棄する
  synergy:       730,  // 相乗効果
  tariff:        730,  // 関税
  tenure:        730,  // 在職期間
  terrorism:     730,  // テロリズム
  testify:       730,  // 証言する
  testimony:     730,  // 証言
  thereafter:    730,  // その後
  thereby:       730,  // それによって
  threshold:     730,  // 閾値/基準値
  tolerance:     730,  // 忍耐/許容度
  transformation: 730, // 変革
  treaty:        730,  // 条約
  tribunal:      730,  // 裁判所/法廷
  trustee:       730,  // 受託者
  turmoil:       730,  // 混乱
  undermine:     730,  // 損なう
  underpin:      730,  // 下支えする
  unprecedented: 730,  // 前例のない
  valuation:     730,  // 評価額/バリュエーション
  variability:   730,  // 変動性
  variance:      730,  // 分散/相違
  verdict:       730,  // 評決/判断
  vest:          730,  // 権利を与える
  veto:          730,  // 拒否権
  void:          730,  // 無効にする
  volatile:      730,  // 変動しやすい
  volatility:    730,  // 変動性
  warrant:       730,  // 保証する/令状
  whereby:       730,  // それによって
  withhold:      730,  // 差し控える

  // ════════════════════════════════════════════════════════════════════════
  // L730 → L600: 日常語・基礎語
  // ════════════════════════════════════════════════════════════════════════
  allergy:    600,  // アレルギー（日常語）
  footwear:   600,  // 履物（日常語）
  homework:   600,  // 宿題（日常語）
  newsletter: 600,  // ニュースレター（基本語）
  pottery:    600,  // 陶芸（基本語）
  runner:     600,  // 走る人（基本語）
  sleepy:     600,  // 眠い（基本語）

  // ════════════════════════════════════════════════════════════════════════
  // L990 → L600: 超基本語・口語
  // ════════════════════════════════════════════════════════════════════════
  alpha:    600,  // アルファ（基本文字/用語）
  elephant: 600,  // 象（超基本語）
  killer:   600,  // 殺人者（超基本語）
  molecule: 600,  // 分子（基礎科学語）
  neo:      600,  // ネオ（基本接頭語）
  novice:   600,  // 初心者（基本語）

  // ════════════════════════════════════════════════════════════════════════
  // L990 → L730: 中級語
  // ════════════════════════════════════════════════════════════════════════
  albeit:    730,  // 〜にもかかわらず（接続詞）
  nominal:   730,  // 名目上の
  refurbish: 730,  // 改装する

  // ════════════════════════════════════════════════════════════════════════
  // L990 → L860: 難語だが TOEIC ビジネスに特化しない語
  // 政治・軍事・犯罪・感情・文学語 → L860 に格下げ
  // ════════════════════════════════════════════════════════════════════════
  amiable:      860,  // 友好的な（性格語）
  asylum:       860,  // 亡命/庇護（政治語）
  bomber:       860,  // 爆撃機（軍事語）
  brazen:       860,  // 厚かましい（性格語）
  brusque:      860,  // ぶっきらぼうな（性格語）
  candor:       860,  // 率直さ（人格語）
  chide:        860,  // 叱る（感情語）
  cleric:       860,  // 聖職者（非ビジネス語）
  colonial:     860,  // 植民地の（歴史・政治語）
  communism:    860,  // 共産主義（政治語）
  communist:    860,  // 共産主義者（政治語）
  deride:       860,  // 嘲笑する（感情語）
  despot:       860,  // 専制者（政治語）
  dissident:    860,  // 反体制者（政治語）
  doctrine:     860,  // 教義/主義（政治・宗教語）
  elated:       860,  // 有頂天の（感情語）
  empathy:      860,  // 共感（人格語）
  enmity:       860,  // 敵意（感情語）
  exile:        860,  // 亡命/追放（政治語）
  extremist:    860,  // 過激派（政治語）
  extol:        860,  // 称賛する（文学語）
  feral:        860,  // 野生の（非ビジネス語）
  flabbergasted: 860, // 仰天した（口語・感情語）
  forsake:      860,  // 見捨てる（文学語）
  fractious:    860,  // 手に負えない（性格語）
  furtive:      860,  // こっそりとした（性格語）
  genocide:     860,  // 大量虐殺（政治語）
  gluttony:     860,  // 暴食（非ビジネス語）
  haughty:      860,  // 傲慢な（性格語）
  insurgency:   860,  // 反乱（軍事・政治語）
  insurgent:    860,  // 反乱者（軍事語）
  jubilant:     860,  // 大喜びの（感情語）
  kidnap:       860,  // 誘拐する（犯罪語）
  knell:        860,  // 弔いの鐘（文学語）
  lithe:        860,  // しなやかな（非ビジネス語）
  lurid:        860,  // センセーショナルな（文学語）
  militant:     860,  // 過激派（政治語）
  militia:      860,  // 民兵組織（軍事語）
  missile:      860,  // ミサイル（軍事語）
  morose:       860,  // 不機嫌な（性格語）
  mosque:       860,  // モスク（宗教語）
  nationalism:  860,  // ナショナリズム（政治語）
  nationalist:  860,  // ナショナリスト（政治語）
  nationalize:  860,  // 国有化する（政治・経済語）
  obsequious:   860,  // こびへつらう（性格語）
  paramilitary: 860,  // 準軍事的な（軍事語）
  parody:       860,  // パロディ（文学語）
  peacekeeping: 860,  // 平和維持（政治語）
  quaint:       860,  // 趣のある（文学語）
  rape:         860,  // 強制性交（犯罪語）
  reactor:      860,  // 原子炉（技術語）
  secular:      860,  // 世俗的な（宗教・政治語）
  separatist:   860,  // 分離主義者（政治語）
  serendipity:  860,  // 幸運な偶然（文学語）
  smuggle:      860,  // 密輸する（犯罪語）
  socialist:    860,  // 社会主義者（政治語）
  sovereign:    860,  // 主権/君主（政治語）
  sovereignty:  860,  // 主権（政治語）
  staid:        860,  // 落ち着いた（性格語）
  taciturn:     860,  // 無口な（性格語）
};

// ── メイン処理 ─────────────────────────────────────────────────────────────
function main() {
  const words = JSON.parse(readFileSync(WORDS_JSON, 'utf8'));
  const stats = {};

  let fixedCount = 0;
  for (const word of words) {
    const key = word.term.toLowerCase().trim();
    if (Object.prototype.hasOwnProperty.call(LEVEL_FIXES, key)) {
      const oldLevel = word.level;
      const newLevel = LEVEL_FIXES[key];
      if (oldLevel !== newLevel) {
        const label = `${oldLevel}→${newLevel}`;
        if (!stats[label]) stats[label] = [];
        stats[label].push(word.term);
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

  if (fixedCount === 0) {
    console.log('  （修正対象なし — すでに正しいレベルが割り当てられています）');
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
