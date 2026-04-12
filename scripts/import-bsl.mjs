/**
 * BSL (Business Service List) Importer
 *
 * BSLの単語リストに日本語訳・例文・カテゴリ・TOEICレベルを付与して
 * src/data/words.json に追加します。
 *
 * 使い方:
 *   node scripts/import-bsl.mjs
 *   （.env.local に GEMINI_API_KEY を設定して実行）
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = dirname(__dirname);

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

const WORDS_JSON = join(ROOT, 'src', 'data', 'words.json');
const BATCH_SIZE = 40;
const DELAY_MS   = 1500;
const CATEGORIES = ['Business','Finance','Marketing','Office','General','Technology','HR','Legal','Travel','Management'];

const sleep = ms => new Promise(r => setTimeout(r, ms));
function loadWords()      { return existsSync(WORDS_JSON) ? JSON.parse(readFileSync(WORDS_JSON,'utf8')) : []; }
function saveWords(words) { writeFileSync(WORDS_JSON, JSON.stringify(words, null, 2), 'utf8'); }

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
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0.3, maxOutputTokens: 8192, thinkingConfig: { thinkingBudget: 0 } },
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

// BSL新規単語1000語（既存DBと重複なし）
const BSL_WORDS = `abolish
absorption
accordance
accountable
accrual
accumulation
accusation
acid
acre
activist
adequately
adoption
adverse
agriculture
alas
algorithm
align
allegation
allegedly
alliance
allocation
alpha
aluminum
amid
amongst
amortize
analytic
analytical
annualize
annuity
annum
anti
antitrust
appetite
appropriately
approximation
arbitrage
arguably
array
artificial
assault
assert
asylum
atom
attributable
audio
autonomous
autonomy
averse
aversion
aviation
awkward
axis
backward
bail
ballot
barrel
baseline
batch
beam
beef
behavioral
beneficiary
beta
bidder
bilateral
bitter
blank
blast
blend
boast
bold
bolster
bomber
bondholder
borrower
bounce
boycott
bracket
brave
breach
bribe
brick
brokerage
brutal
bubble
buffer
builder
bull
bullet
bully
bureaucracy
bureaucrat
bureaucratic
bust
capita
capitalism
capitalist
capitalization
carmaker
cartel
casino
casualty
catastrophe
cattle
ceasefire
census
centralize
certainty
chancellor
chaos
charter
cheaply
cheat
cheque
chunk
citation
citizenship
clash
classroom
cleric
clever
clone
clout
coalition
coefficient
cognitive
collar
collateral
collective
colonial
combat
commander
commentator
commissioner
communism
communist
comparable
comparative
compel
competent
competitiveness
composite
compulsory
computation
computerize
con
conceal
concede
conceptual
condemn
conditional
confront
confrontation
conglomerate
congressional
congressman
conjunction
conscious
conservation
consistency
consortium
conspiracy
constituency
constituent
constitution
constitutional
constructive
consultancy
contemplate
contend
continent
contingent
continually
continuity
continuously
contributor
controller
converge
convergence
conversion
convertible
convict
conviction
copper
corn
corrective
correlate
correlation
correspondent
corrupt
corruption
cotton
counterparty
coup
covariance
covenant
credential
credible
creditor
crude
crunch
crush
cure
cyclical
dash
debenture
debtor
decent
decentralize
decimal
declaration
decree
deed
deem
defendant
defensive
deficiency
deflation
defy
deliberate
deliberately
delta
demise
demographic
denominate
denounce
dependency
depict
deployment
depositor
deprive
deputy
deregulation
derivative
detection
deter
determinant
devaluation
devise
diary
dictate
dictator
dictatorship
differential
differentiate
differentiation
digit
dilemma
diligence
dilute
dioxide
dip
diplomacy
diplomat
diplomatic
directive
disability
disadvantage
disastrous
discharge
discourage
discretion
discrimination
disguise
dismal
dismantle
disposable
disposition
dissent
dissident
dissolution
dissolve
distinctive
distress
diversify
divert
doctrine
dominance
donor
doom
dot
doubtful
downside
downward
drain
drift
dual
dub
duly
dump
echo
elaborate
elastic
elasticity
electoral
electorate
elite
embody
emergence
emission
empower
empowerment
enact
encompass
encyclopedia
endless
endorse
endowment
endure
enforceable
enforcement
enhancement
enlarge
enlargement
enrich
entail
entrant
entrepreneurial
equality
equate
equilibrium
essence
essentially
estimation
ethanol
exaggerate
exclusion
execution
exert
exile
expectancy
explicitly
explode
exploration
explosion
explosive
exporter
externality
extremist
faction
fairness
fate
fiber
fiduciary
fierce
fighter
financially
flee
flotation
flourish
follower
forecaster
foreigner
forge
formerly
formulation
fraction
fragile
franc
fraudulent
freely
fret
fringe
frontier
frustration
gamble
gang
gauge
generalize
genocide
genuinely
geographic
geographical
geography
globalization
globally
globe
gloomy
governance
governmental
grasp
grave
greenhouse
grid
grim
grip
gross
guerrilla
halt
handful
handset
harsh
harvest
haul
headline
hedge
heir
helicopter
hierarchy
histogram
historically
hitherto
horizon
horizontal
horror
hostile
hostility
hugely
hurdle
hydrogen
hypothetical
ideological
ideology
idle
imbalance
immune
impair
impairment
importantly
importer
inability
inadequate
incline
inclusion
inconsistent
incorporation
incorrect
incumbent
independently
indifference
indirectly
induce
ineffective
inefficiency
inequality
inevitably
infect
inflationary
inflow
info
inherit
injection
insider
instability
instant
instinct
insurer
insurgency
insurgent
intangible
integrity
intelligent
intensify
intensive
intent
inter
interact
intercept
interference
intermediary
internally
intervene
intrigue
invade
invasion
investigator
isolation
issuance
issuer
jointly
judicial
jurisdiction
justification
kidnap
killer
lag
laser
launder
lawsuit
legacy
legislative
legislature
legitimacy
lender
lessee
lesser
lessor
leverage
liberalization
liberalize
liberty
likelihood
linear
liquidate
litigation
loom
loop
loser
lucrative
lump
lure
macro
macroeconomic
macroeconomics
magnetic
magnitude
mainland
mainstream
mandate
maneuver
manipulation
mar
marginal
marketable
marketer
marketplace
materially
mathematical
matrix
maximization
methodology
micro
mid
migrant
migration
militant
militia
mill
ministry
minus
missile
misunderstand
mitigate
mobility
modest
mold
molecule
monopolist
monopoly
mosque
motive
multi
multinational
multiplier
multiply
municipal
mutually
myth
namely
nasty
nationalism
nationalist
nationalize
negligence
negotiable
negotiator
neo
newcomer
niche
node
non
nonetheless
norm
notably
null
numerical
obituary
objection
obscure
observer
occasional
odds
offensive
offset
openly
operative
optimism
optimization
optimum
oral
ordinate
organ
orient
originate
ounce
oust
outbreak
outflow
outgoing
outlay
outrage
outright
outsider
outsource
outweigh
overhaul
oversight
overstate
overwhelm
pact
painful
par
parameter
paramilitary
parity
parliament
parliamentary
particle
passive
payback
payoff
payout
peaceful
peacekeeping
peg
pending
pensioner
periodic
perpetual
persist
persistent
peso
petrol
petty
physically
pin
pioneer
pit
plague
plainly
plaintiff
plead
pledge
plunge
poison
policeman
policyholder
policymaker
politically
populist
portray
positively
practitioner
pre
precedent
precious
precision
predetermine
predictable
predictor
prejudice
premier
prepayment
presidency
presume
prevail
prevention
privacy
privately
privatization
privatize
probe
processor
proclaim
prod
progressive
proliferation
prolong
prone
pronounce
prop
proportional
proposition
proprietary
proprietorship
prosecute
prosecution
prosecutor
prosper
prosperity
prosperous
protester
provincial
provoke
proxy
prudent
psychology
publicly
punish
punishment
purely
pursuant
pursuit
qualitative
quantify
quantitative
quasi
queue
quotation
rage
raid
rally
randomly
rape
ratify
ration
rational
rationale
reactor
readily
realizable
realization
reap
rebel
rebound
rebuild
receiver
reconcile
reconstruction
redeem
redemption
referendum
refinance
refine
reformer
reformist
refusal
regain
regime
regression
regulator
rein
reinforcement
reinvest
reinvestment
rejection
relational
relevance
reliance
reluctance
remarkably
remedy
render
renewable
reorganization
repay
repayment
repertoire
replicate
reportedly
reprint
republic
repurchase
resale
respective
restate
restrain
restraint
restrictive
restructure
revaluation
reversal
revival
revive
revolutionary
rhetoric
rig
rightly
rigid
rigorous
riot
risky
robot
robust
rocket
routinely
royalty
ruler
sack
sacrifice
sadly
safeguard
salvage
saver
scandal
scarce
scatter
scenario
scorecard
scrap
scratch
script
scrutiny
secular
seemingly
segmentation
seize
selective
semi
senator
sensible
sensitivity
sensor
sentiment
separation
separatist
severely
shed
sheer
shield
shortfall
shrink
simplicity
simulate
simulation
simultaneously
skeptic
skeptical
slack
slash
slim
slowdown
slump
smuggle
socialist
socially
sole
solely
sophisticate
sovereign
sovereignty
span
spark
specialization
spectacular
spectrum
speculate
speculation
speculative
speculator
spokesman
sponsorship
spur
spy
squeeze
stabilize
stance
standardize
static
statistical
statistically
statute
statutory
steam
steep
sterling
stochastic
stockmarket
strive
sub
subjective
subordinate
subprime
subsection
subsidy
substitution
subtle
succession
successive
successor
sufficiently
suicide
summit
super
supervision
supervisory
supposedly
suppress
surge
surrender
surveillance
suspicion
swap
swell
swiftly
sympathy
syndicate
synergy
synthetic
tactical
tangible
tariff
taxable
taxation
taxpayer
technically
technological
telecom
tenure
terror
terrorism
testify
testimony
textile
thereafter
thereby
threshold
thrive
thumb
tick
tide
tier
tighten
timber
tobacco
tolerance
tolerate
tonne
tort
torture
trader
trait
tranche
transformation
treasury
treaty
tribal
tribe
tribunal
tricky
trim
triple
triumph
trustee
tumble
tuple
turmoil
ultimate
unauthorized
uncertain
unchanged
uncover
underestimate
undermine
underpin
undervalue
underwrite
underwriter
undoubtedly
unexpectedly
unfair
unfavorable
unify
unity
unpopular
unprecedented
unpredictable
unrelated
unsecured
unveil
unwilling
upward
uranium
utilization
vaccine
vague
validity
valuation
variability
variance
vector
verdict
vertical
vest
veto
viewer
virtue
void
volatile
volatility
vow
vulnerable
warrant
wary
weaken
wheat
whereby
wholesale
wholesaler
wholly
widen
widespread
wisdom
withhold
woe
worksheet
worsen
worthy
yuan`.trim();

async function main() {
  console.log('🚀 BSL Importer\n');
  const inputTerms = BSL_WORDS.split('\n').map(w => w.trim()).filter(Boolean);
  const words    = loadWords();
  const existing = new Set(words.map(w => w.term.toLowerCase().trim()));
  const toProcess = inputTerms.filter(t => !existing.has(t.toLowerCase().trim()));

  console.log(`入力単語数: ${inputTerms.length}`);
  console.log(`既存DB単語数: ${words.length}`);
  console.log(`追加対象: ${toProcess.length} 語\n`);

  let nextId  = words.length > 0 ? Math.max(...words.map(w => parseInt(w.id)||0)) + 1 : 1;
  let added   = 0;
  const total   = toProcess.length;
  const batches = Math.ceil(total / BATCH_SIZE);

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const chunk    = toProcess.slice(i, i + BATCH_SIZE);
    process.stdout.write(`[${batchNum}/${batches}] ${chunk.length}語を処理中... `);

    const enriched = await enrichBatch(chunk);
    let batchAdded = 0;

    for (const entry of enriched) {
      if (!entry?.term?.trim() || !entry?.meaning?.trim() || !entry?.example?.trim()) continue;
      const key = entry.term.toLowerCase().trim();
      if (existing.has(key)) continue;
      const level = [600,730,860,990].includes(entry.level) ? entry.level : 730;
      existing.add(key);
      words.push({
        id:       String(nextId++),
        term:     entry.term.trim(),
        meaning:  entry.meaning.trim(),
        example:  entry.example.trim(),
        level,
        category: CATEGORIES.includes(entry.category) ? entry.category : 'Business',
      });
      batchAdded++;
      added++;
    }
    console.log(`+${batchAdded}語 → 合計 ${words.length}語`);
    saveWords(words);
    if (i + BATCH_SIZE < total) await sleep(DELAY_MS);
  }

  const dist = words.reduce((acc,w) => { acc[w.level]=(acc[w.level]||0)+1; return acc; }, {});
  console.log(`\n✅ 完了! BSLから ${added} 語を追加しました`);
  console.log('レベル別:', dist);
  console.log(`総単語数: ${words.length}`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
