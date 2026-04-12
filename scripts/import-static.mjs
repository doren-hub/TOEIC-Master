/**
 * Static TOEIC Vocabulary Importer
 *
 * APIを一切使わずに、事前に翻訳済みの単語データを words.json に追加します。
 * 90語（L730: 53語、L860: 20語、L990: 17語）を追加します。
 *
 * 使い方:
 *   node scripts/import-static.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = dirname(__dirname);
const WORDS_JSON = join(ROOT, 'src', 'data', 'words.json');

function loadWords() { return existsSync(WORDS_JSON) ? JSON.parse(readFileSync(WORDS_JSON, 'utf8')) : []; }
function saveWords(words) { writeFileSync(WORDS_JSON, JSON.stringify(words, null, 2), 'utf8'); }

// ── 事前翻訳済み単語データ ─────────────────────────────────────────────────
const STATIC_WORDS = [
  // ── L730: ビジネス中級語彙 ──────────────────────────────────────────────
  { term: "allocation", meaning: "配分／割り当て", example: "The budget allocation for the marketing department was increased by 20% this year.", category: "Finance", level: 730 },
  { term: "bilateral", meaning: "二国間の", example: "The two governments signed a bilateral trade agreement to boost economic cooperation.", category: "Business", level: 730 },
  { term: "breakeven", meaning: "損益分岐点", example: "The startup is projected to reach its breakeven point within the next 18 months.", category: "Finance", level: 730 },
  { term: "cashflow", meaning: "キャッシュフロー／資金の流れ", example: "Maintaining positive cash flow is essential for the company's day-to-day operations.", category: "Finance", level: 730 },
  { term: "collateral", meaning: "担保", example: "The bank required collateral before approving the company's business expansion loan.", category: "Finance", level: 730 },
  { term: "concise", meaning: "簡潔な", example: "Please provide a concise summary of the quarterly results for the executive meeting.", category: "Business", level: 730 },
  { term: "condense", meaning: "要約する／凝縮する", example: "Could you condense this 30-page report into a two-page executive summary?", category: "Business", level: 730 },
  { term: "consortium", meaning: "コンソーシアム／企業連合", example: "A consortium of technology companies collaborated to develop the new industry standard.", category: "Business", level: 730 },
  { term: "credential", meaning: "資格証明書／認証情報", example: "All applicants must submit their academic credentials along with their application.", category: "HR", level: 730 },
  { term: "demographics", meaning: "人口統計／デモグラフィクス", example: "The marketing team analyzed customer demographics to better target their advertising campaigns.", category: "Marketing", level: 730 },
  { term: "diversify", meaning: "多様化する", example: "The company plans to diversify its revenue streams to reduce dependence on a single market.", category: "Business", level: 730 },
  { term: "downside", meaning: "不利な面／マイナス面", example: "The downside of rapid expansion is the increased strain on existing company resources.", category: "Business", level: 730 },
  { term: "empower", meaning: "権限を与える／意欲を高める", example: "The new system will empower frontline employees to resolve customer issues independently.", category: "HR", level: 730 },
  { term: "escalate", meaning: "エスカレートする／段階的に引き渡す", example: "If the complaint cannot be resolved at the counter, please escalate it to the manager.", category: "Business", level: 730 },
  { term: "execution", meaning: "実行／遂行", example: "Flawless execution of the marketing strategy resulted in a 25% increase in quarterly sales.", category: "Management", level: 730 },
  { term: "feasibility", meaning: "実現可能性", example: "A thorough feasibility study was conducted before committing to the construction project.", category: "Business", level: 730 },
  { term: "fulfillment", meaning: "履行／注文処理", example: "The company improved its order fulfillment process to reduce shipping times by 30%.", category: "Business", level: 730 },
  { term: "governance", meaning: "ガバナンス／統治", example: "Strong corporate governance is essential for maintaining the trust of investors and stakeholders.", category: "Management", level: 730 },
  { term: "headcount", meaning: "従業員数／人員", example: "The department reduced its headcount by 15% to cut costs during the economic downturn.", category: "HR", level: 730 },
  { term: "hierarchy", meaning: "階層制度／組織構造", example: "The company adopted a flat hierarchy to encourage more direct communication across teams.", category: "Management", level: 730 },
  { term: "implementation", meaning: "実施／導入", example: "The implementation of the new HR software was completed two weeks ahead of schedule.", category: "Management", level: 730 },
  { term: "incentivize", meaning: "動機付ける／インセンティブを与える", example: "The commission structure was redesigned to incentivize employees to exceed their sales targets.", category: "HR", level: 730 },
  { term: "intranet", meaning: "イントラネット", example: "Company policies and internal announcements are published on the corporate intranet.", category: "Technology", level: 730 },
  { term: "leverage", meaning: "活用する／てこ入れ", example: "The company will leverage its global distribution network to enter new international markets.", category: "Business", level: 730 },
  { term: "liability", meaning: "負債／法的責任", example: "The company's financial statements must clearly disclose all outstanding liabilities.", category: "Finance", level: 730 },
  { term: "mandate", meaning: "指令／義務付ける", example: "New safety regulations mandate that all employees complete annual health and safety training.", category: "Legal", level: 730 },
  { term: "marketplace", meaning: "市場／マーケットプレイス", example: "The online marketplace has revolutionized how consumers discover and purchase goods.", category: "Business", level: 730 },
  { term: "mitigation", meaning: "軽減／緩和", example: "Effective risk mitigation strategies are essential for managing uncertainty in global markets.", category: "Management", level: 730 },
  { term: "modernize", meaning: "現代化する／刷新する", example: "The company invested heavily to modernize its aging production facilities.", category: "Business", level: 730 },
  { term: "monitoring", meaning: "監視／モニタリング", example: "Continuous monitoring of key performance indicators helps management track business progress.", category: "Management", level: 730 },
  { term: "monopoly", meaning: "独占", example: "Antitrust laws are designed to prevent any single company from holding a market monopoly.", category: "Business", level: 730 },
  { term: "networking", meaning: "ネットワーキング／人脈形成", example: "Industry conferences provide excellent opportunities for networking with potential business partners.", category: "Business", level: 730 },
  { term: "niche", meaning: "ニッチ／特定の市場分野", example: "The startup carved out a profitable niche by offering premium organic office supplies.", category: "Marketing", level: 730 },
  { term: "outsource", meaning: "外注する／アウトソーシングする", example: "The company decided to outsource its customer support operations to a specialized firm.", category: "Business", level: 730 },
  { term: "proactive", meaning: "積極的な／先を見越した", example: "A proactive approach to addressing customer concerns prevents issues from escalating.", category: "Business", level: 730 },
  { term: "profile", meaning: "プロフィール／概要", example: "The sales team prepared a detailed client profile before the first business meeting.", category: "Business", level: 730 },
  { term: "provision", meaning: "規定／条項／供給", example: "The contract includes a provision for automatic renewal unless either party provides notice.", category: "Legal", level: 730 },
  { term: "renegotiate", meaning: "再交渉する", example: "Both parties agreed to renegotiate the contract terms in light of changing market conditions.", category: "Business", level: 730 },
  { term: "roadmap", meaning: "ロードマップ／計画", example: "The product roadmap for the next fiscal year was presented to the board of directors.", category: "Management", level: 730 },
  { term: "safeguard", meaning: "保護手段／守る", example: "Several data safeguards were put in place to protect confidential customer information.", category: "Business", level: 730 },
  { term: "scalability", meaning: "拡張性／スケーラビリティ", example: "The platform's scalability allows the company to accommodate rapid growth without disruption.", category: "Technology", level: 730 },
  { term: "scorecard", meaning: "スコアカード／業績評価表", example: "The balanced scorecard measures performance across financial, customer, and operational dimensions.", category: "Management", level: 730 },
  { term: "shortfall", meaning: "不足／欠如", example: "The revenue shortfall in Q3 prompted management to revise the annual financial forecast.", category: "Finance", level: 730 },
  { term: "staffing", meaning: "人員配置／採用", example: "The recruitment agency provides tailored staffing solutions for the hospitality industry.", category: "HR", level: 730 },
  { term: "subsidy", meaning: "補助金", example: "The government provides a generous subsidy to companies that invest in renewable energy.", category: "Finance", level: 730 },
  { term: "succession", meaning: "継承／後継", example: "A comprehensive succession plan ensures leadership continuity during executive transitions.", category: "Management", level: 730 },
  { term: "synergy", meaning: "相乗効果／シナジー", example: "The merger was expected to create operational synergies that would reduce costs by 15%.", category: "Business", level: 730 },
  { term: "talent", meaning: "人材／才能", example: "Attracting and retaining top talent remains the company's most critical strategic priority.", category: "HR", level: 730 },
  { term: "taxonomy", meaning: "分類体系／タクソノミー", example: "The IT team developed a content taxonomy to systematically organize the company's digital assets.", category: "Technology", level: 730 },
  { term: "threshold", meaning: "閾値／基準値", example: "All expenditures above the defined threshold require written approval from a senior director.", category: "Finance", level: 730 },
  { term: "treasury", meaning: "財務部門／資金管理", example: "The treasury department is responsible for managing the company's cash reserves and investments.", category: "Finance", level: 730 },
  { term: "utilization", meaning: "利用率／稼働率", example: "Improving equipment utilization across all production lines helped reduce manufacturing costs.", category: "Management", level: 730 },
  { term: "sustainability", meaning: "持続可能性", example: "The company committed to improving sustainability by reducing its carbon footprint by 2030.", category: "Business", level: 730 },

  // ── L860: ビジネス上級語彙 ──────────────────────────────────────────────
  { term: "acumen", meaning: "洞察力／明敏さ", example: "Her business acumen helped the startup navigate a competitive market and secure key investments.", category: "Business", level: 860 },
  { term: "assessment", meaning: "評価／査定／アセスメント", example: "A comprehensive financial assessment was conducted before the board approved the acquisition.", category: "Business", level: 860 },
  { term: "catalyst", meaning: "触媒／起爆剤", example: "The new CEO's bold strategy acted as a catalyst for the company's transformation.", category: "Management", level: 860 },
  { term: "centralization", meaning: "集権化／一元化", example: "The centralization of procurement processes helped reduce costs and strengthen supplier relationships.", category: "Management", level: 860 },
  { term: "divestiture", meaning: "事業売却／資産処分", example: "The board approved the divestiture of the underperforming retail division to focus on core operations.", category: "Finance", level: 860 },
  { term: "equilibrium", meaning: "均衡／平衡状態", example: "The currency market gradually returned to equilibrium after months of volatility.", category: "Finance", level: 860 },
  { term: "exacerbate", meaning: "悪化させる／深刻化させる", example: "The unexpected production delays exacerbated the existing supply shortage in the market.", category: "Business", level: 860 },
  { term: "forecasting", meaning: "予測／需要予測", example: "Accurate demand forecasting enables the company to manage inventory levels more efficiently.", category: "Finance", level: 860 },
  { term: "harmonize", meaning: "調和させる／統一する", example: "The merger required both companies to harmonize their financial reporting standards.", category: "Management", level: 860 },
  { term: "impasse", meaning: "行き詰まり／膠着状態", example: "Contract negotiations reached an impasse when neither party would agree on the payment terms.", category: "Business", level: 860 },
  { term: "jurisdiction", meaning: "管轄権／裁判権", example: "All disputes arising from this contract fall under the exclusive jurisdiction of the Tokyo courts.", category: "Legal", level: 860 },
  { term: "monetize", meaning: "収益化する／マネタイズする", example: "The company is exploring new ways to monetize its vast repository of consumer data.", category: "Business", level: 860 },
  { term: "paradigm", meaning: "パラダイム／典型", example: "Remote work has created a fundamental paradigm shift in how organizations manage their workforce.", category: "Management", level: 860 },
  { term: "rationale", meaning: "論拠／根拠", example: "The CFO presented a clear rationale for the proposed budget increase to the board.", category: "Management", level: 860 },
  { term: "reconcile", meaning: "調整する／一致させる", example: "The accounting team worked overtime to reconcile the discrepancies in the quarterly reports.", category: "Finance", level: 860 },
  { term: "restructure", meaning: "再構築する／組織改編する", example: "The company announced plans to restructure its global operations to improve profitability.", category: "Management", level: 860 },
  { term: "scenario", meaning: "シナリオ／想定事例", example: "The risk team developed three scenarios to help prepare for various economic conditions.", category: "Management", level: 860 },
  { term: "systemic", meaning: "組織全体にわたる／体系的な", example: "The external audit revealed systemic weaknesses in the company's internal financial controls.", category: "Business", level: 860 },
  { term: "ameliorate", meaning: "改善する／緩和する", example: "The revised benefits package was designed to ameliorate working conditions for frontline staff.", category: "HR", level: 860 },
  { term: "diligence", meaning: "勤勉さ／デューデリジェンス", example: "The due diligence process uncovered several critical risks before the acquisition was finalized.", category: "Business", level: 860 },

  // ── L990: 高度な専門語彙 ──────────────────────────────────────────────
  { term: "arbitrage", meaning: "裁定取引／アービトラージ", example: "The hedge fund generated consistent returns by exploiting currency arbitrage opportunities.", category: "Finance", level: 990 },
  { term: "bureaucracy", meaning: "官僚制度／煩雑な手続き", example: "Reforming the bureaucracy was seen as essential to attracting foreign investment.", category: "Business", level: 990 },
  { term: "codification", meaning: "成文化／体系化", example: "The codification of internal procedures significantly reduced inconsistencies across departments.", category: "Legal", level: 990 },
  { term: "commensurate", meaning: "釣り合った／相応の", example: "The job offer includes a salary package commensurate with the candidate's level of expertise.", category: "HR", level: 990 },
  { term: "convoluted", meaning: "複雑な／入り組んだ", example: "The convoluted approval process was identified as a major barrier to operational efficiency.", category: "Management", level: 990 },
  { term: "disparity", meaning: "格差／不均衡", example: "The annual report highlighted the growing disparity in compensation between executives and staff.", category: "HR", level: 990 },
  { term: "exigency", meaning: "緊急事態／差し迫った必要性", example: "The company's financial exigency led the board to authorize immediate emergency cost-cutting measures.", category: "Finance", level: 990 },
  { term: "fiduciary", meaning: "受託の／信任の", example: "Board members have a fiduciary duty to prioritize the long-term interests of shareholders.", category: "Legal", level: 990 },
  { term: "indemnify", meaning: "補償する／免責にする", example: "The supplier agreed to indemnify the retailer against all liability arising from product defects.", category: "Legal", level: 990 },
  { term: "insolvent", meaning: "支払い不能の／破産した", example: "The firm was declared insolvent after failing to service its debt obligations for several months.", category: "Finance", level: 990 },
  { term: "jurisprudence", meaning: "法学／法理学", example: "A deep knowledge of commercial jurisprudence is indispensable for this senior corporate counsel role.", category: "Legal", level: 990 },
  { term: "liquidate", meaning: "清算する／現金化する", example: "The board voted to liquidate the company's non-core assets to repay outstanding creditors.", category: "Finance", level: 990 },
  { term: "malfeasance", meaning: "不正行為／職権乱用", example: "The executive was dismissed following an investigation into allegations of financial malfeasance.", category: "Legal", level: 990 },
  { term: "obsolescence", meaning: "陳腐化／旧式化", example: "Planned obsolescence has drawn criticism from consumers and environmental advocates alike.", category: "Business", level: 990 },
  { term: "pecuniary", meaning: "金銭的な／財政上の", example: "The settlement included substantial pecuniary compensation for all parties affected by the fraud.", category: "Legal", level: 990 },
  { term: "prerogative", meaning: "特権／専権事項", example: "Setting the annual executive remuneration packages is the prerogative of the compensation committee.", category: "Management", level: 990 },
  { term: "sequester", meaning: "隔離する／差し押さえる", example: "The disputed assets were sequestered by court order pending the final judgment.", category: "Legal", level: 990 },
];

// ── メイン処理 ─────────────────────────────────────────────────────────────
async function main() {
  console.log('📚 Static Vocabulary Importer\n');

  const words    = loadWords();
  const existing = new Set(words.map(w => w.term.toLowerCase().trim()));

  const toAdd = STATIC_WORDS.filter(e => !existing.has(e.term.toLowerCase().trim()));
  console.log(`入力単語数: ${STATIC_WORDS.length}`);
  console.log(`既存DB単語数: ${words.length}`);
  console.log(`追加対象: ${toAdd.length} 語\n`);

  let nextId = words.length > 0 ? Math.max(...words.map(w => parseInt(w.id) || 0)) + 1 : 1;

  for (const entry of toAdd) {
    words.push({
      id:       String(nextId++),
      term:     entry.term.trim(),
      meaning:  entry.meaning.trim(),
      example:  entry.example.trim(),
      level:    entry.level,
      category: entry.category,
    });
  }

  saveWords(words);

  const dist = words.reduce((acc, w) => { acc[w.level] = (acc[w.level] || 0) + 1; return acc; }, {});
  console.log(`✅ ${toAdd.length} 語を追加しました`);
  console.log('レベル別:', dist);
  console.log(`総単語数: ${words.length}`);
  console.log(`\n💾 ${WORDS_JSON} に保存しました`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
