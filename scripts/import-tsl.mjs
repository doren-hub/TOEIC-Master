/**
 * TSL (TOEIC Service List) Importer
 *
 * TSLの単語リストに日本語訳・例文・カテゴリ・TOEICレベルを付与して
 * src/data/words.json に追加します。
 *
 * 使い方:
 *   node scripts/import-tsl.mjs
 *   （TSL単語912語がスクリプトに埋め込み済み。.env.local に GEMINI_API_KEY を設定して実行）
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
        model: 'gemini-2.5-flash',
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

// TSL単語リスト（既存DBに存在しない912語を埋め込み済み）
const TSL_WORDS = `acceptance
actress
additionally
advertiser
afterward
anyhow
anytime
artistic
baggage
banker
beginner
born
bye
caller
careless
cleaner
cleanliness
collector
colorful
comfortably
cooler
costly
dealership
definite
delicious
dependable
dislike
enjoyable
explanatory
fitness
flyer
fortunately
gardener
generalization
heater
homeless
honestly
hourly
hungry
icy
incomplete
indoor
inexpensive
inexperience
lately
locally
loudly
machinery
managerial
mileage
mislead
mister
neat
noisy
outdoor
painter
partial
partially
photographer
photography
poorly
postage
postal
pottery
presenter
probable
programmer
protective
quarterly
rainy
realistic
reconsider
renew
renewal
rental
reopen
rewrite
rider
rose
runner
safely
sender
shopper
shorten
sleepy
snowy
sometime
spacious
specially
specialty
sticker
sunny
sunshine
tablecloth
taker
tasty
thirsty
timer
trainee
trainer
traveler
uncomfortable
unemployed
unexpected
unhappy
unload
unnecessary
unreal
unsure
unused
unusually
whoever
willingness
windy
yearly
accent
adapter
advisable
advisor
amuse
announcer
annoy
apple
appreciation
asleep
attendant
attendee
automatic
bake
baker
basket
bean
blanket
brake
bug
butter
cage
calculator
captain
casual
centimeter
cheer
clip
cloth
cloudy
clue
commerce
complication
conditioner
container
copier
correctly
creativity
decorate
decoration
departmental
desperate
developer
dine
diner
disappointment
disgust
dive
drawer
drum
economical
economically
economist
economize
editorial
electrical
electrician
elephant
energetic
environmentally
excellence
familiarity
familiarize
faulty
frustrate
fry
grocery
guidance
handy
harmful
hesitation
hobby
identification
individually
influential
instruct
instructor
intently
interrupt
introductory
invaluable
irregular
jam
jeans
juice
kilometer
lab
lawn
librarian
lighter
lightweight
mask
memorize
microwave
mower
nail
occurrence
organizational
organizer
oven
pan
performer
periodical
periodically
pet
pie
plug
polish
pollute
popularity
professionally
purchaser
quit
ray
rearrange
reassure
redecorate
relaxation
reliability
relocate
relocation
removal
repeatedly
repetition
salad
sandwich
scenery
seasonal
seeker
separately
sew
similarity
smoothly
sock
soup
spray
steadily
steak
suspicious
tech
tempt
tomato
towel
traditionally
tray
unattended
unavailable
unfamiliar
unpleasant
unplug
unreliable
wisely
wool
accurately
administrator
admission
affirmative
alternatively
apology
architect
architectural
athletic
auditor
bacteria
bargain
bench
cabinet
chairperson
chilly
clinic
conductor
considerably
consumption
contestant
continental
contradiction
convey
coordinator
counselor
cruise
dedication
descriptive
designate
devastate
disable
disagreement
disposal
disrupt
disruption
distributor
donate
donation
dose
drill
eager
effectiveness
electronically
elevate
enthusiasm
enthusiast
enthusiastic
enthusiastically
exceptional
excessive
exclusively
explorer
fabric
faculty
flavor
flexibility
formally
foster
founder
generous
goods
graduation
graphic
graphics
hazard
hazardous
highway
ideally
illogical
inappropriate
inefficient
inflate
inquire
insert
inspiration
installation
insufficient
interactive
interfere
interpreter
invention
irrelevant
jet
leak
lecturer
loyal
loyalty
mechanic
mechanical
mild
nominate
nomination
obligate
oblige
occupant
occupation
orientation
overlook
pad
pepper
precede
prediction
profitable
prohibit
prominent
promotional
promptly
prospective
puzzle
recession
recruiter
reinforce
relieve
reluctant
reproduce
resemble
residence
residential
respondent
resume
retreat
reviewer
revolutionize
rumor
satellite
sculpture
shortly
silently
spill
statistics
subsidize
substantially
superior
supervise
tactic
temporarily
thoroughly
thrill
ton
translation
translator
transmission
transmit
tremendous
unspecified
violate
violation
withdrawal
aboard
absent
accountant
accustom
adhere
alike
alternate
amateur
ambassador
ambitious
anniversary
antique
attorney
authentic
auto
automobile
await
balloon
bankrupt
bankruptcy
baseball
basement
bicycle
biography
biology
bulb
cab
cabin
campus
cater
caterer
celebrity
certification
chemistry
chronic
cinema
clerk
commute
commuter
compact
comprehension
congratulate
congratulation
contrary
convenience
conveniently
cord
cordless
costume
courtesy
deduct
deduction
defective
delicate
depart
dependence
destination
detach
diagnose
dial
diamond
discard
distract
distraction
dock
documentary
dull
elegant
embassy
enclose
enroll
entrepreneur
escort
ethics
evacuate
evenly
exemption
exit
exotic
fax
flaw
flour
fog
forbid
fork
forum
gallon
generic
genre
glove
gossip
graph
grill
helmet
hurricane
immigration
impatient
inconvenience
indirect
infer
inference
informal
ink
integral
irritate
jazz
jewelry
kit
landlord
leisure
meantime
merchant
merit
mineral
monument
necessity
omit
opt
optimistic
orchestra
outfit
outlook
overnight
packet
parade
patience
patron
petition
physician
physics
pill
pillow
prescribe
prescription
prestigious
publicity
questionnaire
recipient
recreational
recur
recycle
refinery
refresh
refreshment
rehearsal
rehearse
retrieve
rubber
rug
satisfactory
scholarship
seldom
sincerely
sketch
sleeve
soap
soar
soccer
solar
spouse
stack
stadium
statue
steer
stimulus
stripe
subscribe
subscriber
subscription
superb
tag
telecommunication
tenant
theft
tile
tropical
validate
venue
vitamin
waiter
waitress
ward
whale
accessory
allergy
ample
arc
balcony
basketball
bulletin
candy
charitable
circus
clap
comb
compartment
compliment
congestion
cosmetic
cushion
delete
dentist
diagnostic
dissatisfy
drastically
drought
earthquake
embed
erase
expire
factual
farewell
fasten
fatigue
flu
fluctuate
fountain
freighter
garment
generator
gram
gum
gymnasium
hacker
hamburger
hike
hiker
imperative
incur
intersection
jog
journalism
junk
logo
mall
massage
medication
messenger
microscope
modem
mosquito
noon
oval
parcel
pasta
pastry
pedestrian
pharmaceutical
picnic
pizza
plausible
plow
plumber
portable
publicize
purse
query
referee
remainder
renovate
renown
reunion
salon
scarf
serial
shuttle
signify
skate
sofa
spectator
spite
stereo
submission
surf
sweater
tailor
technician
teen
terrific
tidy
toll
tow
transit
umbrella
underline
vacant
vase
violin
wallet
worthwhile
wrinkle
zoo
acclaim
audition
banquet
barbecue
beforehand
briefcase
browse
carpenter
cartridge
contraction
demolish
dental
diploma
disconnect
drawback
euro
excursion
firefighter
firework
fluent
freelance
garbage
handbook
hesitant
humidity
hygiene
inclusive
induction
informative
intern
kilogram
liter
memorandum
mentor
mini
nap
necklace
overcrowd
pamphlet
pant
pharmacist
pharmacy
preview
reflexive
refundable
reimburse
sewer
skim
staple
streamline
trash
tuition
tuna
waive
yen
auditorium
broom
carton
culinary
discontinue
extinguisher
foreman
habitual
intonation
luncheon
misplace
needy
penalize
personalize
photocopier
proficiency
redesign
subtract
teller
vanilla
anew
apprehensive
attire
automotive
cookie
donut
gasoline
paraphrase
remodel
restatement
stationery
stockbroker
upcoming
vacate
yoga
considerate
malfunction
sauna
volleyball
brainstorm
condominium
deluxe
expedite
hereby
punctual
sedan
semester
spam
vend
cellphone
overpay
realtor
toiletry
overcharge
outage
paralegal
purser
login
flextime
sue
airplane
airport
backpack
ballroom
bathroom
birthday
boardroom
bookcase
bookstore
businessman
businessperson
cheeseburger
classmate
cookbook
countryside
daytime
desktop
dishwasher
doorman
downsize
downstairs
downtown
downturn
footwear
fundraise
getaway
hardworking
headache
headphone
healthcare
homemade
homeowner
homework
housekeeper
incoming
layoff
letterhead
lifeguard
lifestyle
lifetime
lunchtime
midnight
motorcycle
newsletter
newsstand
paperback
paperwork
popcorn
postcard
proofread
railway
raincoat
rainfall
salesman
salespeople
salesperson
seafood
seaside
sidewalk
sightsee
skateboard
someday
spokesperson
storeroom
suitcase
sunscreen
supermarket
takeover
textbook
thunderstorm
underground
upstairs
videoconference
webpage
weekday
wheelchair
wildlife
workbook
worldwide
wristwatch
pole
coworker
headquarter
sharply
checkup
healthful
renter
bound`.trim();

async function main() {
  console.log('🚀 TSL Importer\n');

  const inputTerms = TSL_WORDS.split('\n').map(w => w.trim()).filter(Boolean);

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
