# TOEIC Master

TOEIC の目標スコア（600 / 730 / 860 / 990）に合わせて英単語を学習する、ブラウザで動く単語学習アプリです。React + Vite で作られており、学習データはブラウザの `localStorage` に保存されます。

## 主な機能

- **プロフィール（複数ユーザー）**: 名前を入力してプロフィールを作成・切り替え・削除できます。プロフィールが 1 つもない場合は、最初にプロフィール作成画面が表示されます。
- **目標スコアの設定**: 600 / 730 / 860 / 990 から選べます（Settings 画面、またはダッシュボードの「Learning Paths」のカード）。出題範囲は「目標スコア以下のレベルの単語」です。
- **5 語ずつの学習セット**: 目標範囲のうち未習得の単語から 5 語をランダムに選んでセットにします。「New Set」でセットを作り直し、セット内の単語は 1 語ずつ差し替えられます。セットをすべて習得すると「Get Next Set」が表示されます。
- **4 形式のクイズ**（「Start Learning」）
  - 意味から英単語を選ぶ（multiple_choice）
  - 英単語のスペルを入力する（spelling）
  - 英単語から日本語の意味を選ぶ（meaning）
  - 音声を聞いて意味を選ぶ（listening、ブラウザの音声合成 `speechSynthesis` を使用）
  
  1 つの単語について 4 形式すべてに正解すると「習得済み」として扱われます。
- **復習**: 間違えたことのある単語（誤答回数が多い順に最大 5 語）で復習セットを作ります（ダッシュボードの「Review」、または Analysis 画面）。
- **分析（Analysis）**: 苦手な単語の一覧、習得数、正答率などを表示します。

収録単語は `src/data/words.json` にあります（本 README 作成時点で 4,128 語。レベル別: 600 が 3,260 語、730 が 531 語、860 が 235 語、990 が 102 語）。

## 動作環境

- Node.js と npm（`package-lock.json` があります）。Node.js 22 で `npm ci` / `npm run lint` / `npm run build` / `npm run dev` が通ることを確認しています。
- 学習データの保存に `localStorage`、リスニング問題に Web Speech API（`speechSynthesis`）を使うため、これらに対応したブラウザが必要です。
- アプリ本体の実行に Gemini API キーは不要です。キーが必要なのは単語生成スクリプト（後述）だけです。

## セットアップと起動

```bash
npm install
```

```bash
npm run dev
```

開発サーバーはポート 5173 で起動します（`--host=0.0.0.0` 指定のため、同じネットワーク内の他の端末からもアクセスできます）。ブラウザで `http://localhost:5173/` を開いてください。

その他のスクリプト（`package.json` より）:

| コマンド | 内容 |
| --- | --- |
| `npm run build` | 本番用ビルドを `dist/` に出力 |
| `npm run preview` | ビルド結果をローカルで確認 |
| `npm run lint` | TypeScript の型チェック（`tsc --noEmit`） |
| `npm run clean` | `dist/` を削除 |
| `npm run generate-words` | Gemini API で単語データを生成（後述） |

## 使い方

1. 初回はプロフィール作成画面が出るので、名前を入力して「Add」を押します。
2. 必要に応じて Settings 画面か「Learning Paths」で目標スコアを選びます（変更すると学習セットが作り直されます）。
3. ダッシュボードで今回の 5 語を確認し、「Start Learning」でクイズを始めます。
4. 間違えた単語があると「Review (件数)」ボタンが出るので、そこから復習できます。
5. 進捗は Analysis 画面で確認できます。

### 単語の登録方法

アプリの画面から単語を追加する機能はありません。単語は `src/data/words.json` に直接追加します。各単語の形式は次のとおりです（`src/data/words.ts` の `Word` 型）。

```json
{
  "id": "1",
  "term": "approve",
  "meaning": "承認する",
  "example": "The budget proposal was approved by the board.",
  "level": 600,
  "category": "Business"
}
```

`level` は `600` / `730` / `860` / `990` のいずれかです。追加には次のスクリプトが使えます。

#### 1. JSON ファイルからまとめて追加（API キー不要）

`id` を除いた形式（`term`, `meaning`, `example`, `level`, `category`）の配列を JSON ファイルに書き、次を実行します。

```bash
node scripts/add-batch.mjs scripts/batches/600-01.json
```

- `term` が既存の単語と（大文字・小文字・前後の空白を無視して）重複するものはスキップされます。
- `id` は既存の最大値の続きの番号が自動で振られます。
- `scripts/batches/` に、これまでに追加したバッチファイルの例があります。

#### 2. Gemini API で生成して追加（API キーが必要）

プロジェクト直下の `.env.local`（なければ `.env`）に `GEMINI_API_KEY` を設定してから実行します。設定項目は `.env.example` を参照してください。`.env*` は `.gitignore` 対象です（`.env.example` を除く）。

```bash
npm run generate-words
```

- 各レベルの目標語数まで、Gemini API で単語・意味・例文を生成して `src/data/words.json` に追加します。
- 環境変数 `BATCH_SIZE`（1 回の生成数、既定 100）と `DELAY_MS`（API 呼び出し間隔、既定 1200 ms）で調整できます。

```bash
node scripts/import-tsl.mjs
```

- スクリプトに埋め込まれた TSL（TOEIC Service List）の単語に、Gemini API で日本語訳・例文・カテゴリ・レベルを付けて `src/data/words.json` に追加します。

追加した単語は、アプリを再ビルド（開発サーバーなら再読み込み）すると反映されます。

## 既知の制約・不具合

- 学習データ（プロフィール・進捗）はブラウザの `localStorage` のみに保存されます。別のブラウザや端末とは共有されず、ブラウザのデータを消すと失われます。サーバー側の保存やログイン機能はありません。
- アプリ画面から単語を追加・編集する機能はありません（上記のスクリプトか JSON の直接編集が必要です）。
- Analysis 画面の「Learning Streak」は常に「1 Day」と表示されます（固定値です）。
- 収録単語数はレベルによって大きく偏っています（600 レベルが大半）。
- リスニング問題の音声はブラウザの音声合成に依存するため、ブラウザや OS によって音声が出ない・品質が異なる場合があります。
- 画面の表示は英語です（単語の意味は日本語）。
- `npm run build` 時に、JS バンドルが 500 kB を超えるという Vite の警告が出ます（ビルド自体は成功します）。

## ライセンス

ソースファイルの先頭に `SPDX-License-Identifier: Apache-2.0` の記載があります。リポジトリに LICENSE ファイルはありません。
