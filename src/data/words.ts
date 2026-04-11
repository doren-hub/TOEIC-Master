/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TOEIC 単語データ
 *
 * words.json が単語データの唯一の情報源です。
 * 単語を増やしたい場合は以下を実行してください:
 *   node scripts/generate-words.mjs
 */

import wordsData from './words.json';

export interface Word {
  id: string;
  term: string;
  meaning: string;
  example: string;
  level: 600 | 730 | 860 | 990;
  category: string;
}

export const TOEIC_WORDS: Word[] = wordsData as Word[];
