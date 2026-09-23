/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GANZA Kinyarwanda-Native NLU — Kinyarwanda numerals & amounts
 *
 * Needed because traders speak numbers: "magana ane" (400), "makumyabiri"
 * (20), "ibihumbi bibiri na magana atatu" (2300), "40k", "2M", "40.000".
 */

export interface ParsedNumber {
  value: number;
  /** Tokens consumed from the input (1 for digits, more for number phrases). */
  consumed: number;
  kind: 'digit' | 'word' | 'fraction';
  unitSuffix?: 'm' | 'cm' | 'mm';
}

/** Cardinal words (all noun-class variants Rwandans use in speech). */
const CARDINALS: Record<string, number> = {
  zeru: 0, ubusa: 0,
  rimwe: 1, mwe: 1, kimwe: 1, imwe: 1, umwe: 1, emwe: 1,
  kabiri: 2, bibiri: 2, ebiri: 2, ebyiri: 2, biri: 2, abiri: 2,
  gatatu: 3, bitatu: 3, eshatu: 3, esatu: 3, atatu: 3, tatu: 3,
  kane: 4, bine: 4, enye: 4, ine: 4, ane: 4, zine: 4,
  gatanu: 5, bitanu: 5, eshanu: 5, esanu: 5, atanu: 5, tanu: 5, zitanu: 5,
  gatandatu: 6, bitandatu: 6, esheshatu: 6, eshashatu: 6, atandatu: 6, tandatu: 6,
  karindwi: 7, birindwi: 7, esirindwi: 7, arindwi: 7, irindwi: 7,
  umunani: 8, munani: 8, umunane: 8, inani: 8,
  icyenda: 9, cyenda: 9, eshyenda: 9,
  icumi: 10, cumi: 10, kumi: 10, ikumi: 10,
  makumyabiri: 20,
  ijana: 100, igana: 100,
  igihumbi: 1000, gihumbi: 1000,
  miriyoni: 1000000, miliyoni: 1000000,
  miriyari: 1000000000,
};

/** Plural / multiplier words that combine with a cardinal. */
const MULTIPLIERS: Record<string, number> = {
  magana: 100, amajana: 100,
  ibihumbi: 1000, bihumbi: 1000,
};

const TENS_MULTIPLIER = 'mirongo';
const CONNECTORS = new Set(['na', 'no', 'ni']);

const FRACTIONS: { words: string[]; value: number }[] = [
  { words: ['kimwe cya kabiri', 'igice', 'hafu'], value: 0.5 },
  { words: ['kimwe cya gatatu'], value: 1 / 3 },
  { words: ['kimwe cya kane'], value: 0.25 },
  { words: ['bibiri bya gatatu'], value: 2 / 3 },
];

/** Parse a digit token: "40000", "40,000", "40.000", "40k", "2M", "3m", "1.5". */
export function parseDigitToken(token: string): ParsedNumber | null {
  if (!/^-?\d/.test(token)) return null;
  const raw = token.replace(/,/g, '');
  // Thousands separator written with a dot: 40.000 → 40000 (but keep 1.5 as decimal)
  const dotThousands = raw.match(/^(\d{1,3})\.(\d{3})$/);
  const numeric = dotThousands ? `${dotThousands[1]}${dotThousands[2]}` : raw;

  let unitSuffix: ParsedNumber['unitSuffix'];
  const suffix = numeric.match(/^(\d+(?:\.\d+)?)(k|K|M|m|cm|mm)$/);
  let value: number;
  if (suffix) {
    const base = Number(suffix[1]);
    const unit = suffix[2];
    if (unit === 'k' || unit === 'K') value = base * 1000;
    else if (unit === 'M') value = base * 1000000;
    else if (unit === 'cm' || unit === 'mm') { value = base; unitSuffix = unit; }
    else { value = base; unitSuffix = 'm'; } // lowercase m = meters in this business
  } else {
    value = Number(numeric);
  }
  if (!Number.isFinite(value)) return null;
  return { value, consumed: 1, kind: 'digit', unitSuffix };
}

/** Parse a Kinyarwanda number starting at tokens[index] (handles compounds). */
export function parseKinyarwandaNumber(tokens: string[], index: number): ParsedNumber | null {
  const total = parseNumberWords(tokens, index);
  if (!total) return null;
  return { value: total.value, consumed: total.consumed, kind: 'word' };
}

function parseNumberWords(tokens: string[], start: number): { value: number; consumed: number } | null {
  let total = 0;
  let j = start;
  let matched = false;

  while (j < tokens.length) {
    const token = tokens[j];

    if (token === TENS_MULTIPLIER) {
      const card = CARDINALS[tokens[j + 1]];
      if (card !== undefined && card >= 1 && card <= 9) {
        total += 10 * card;
        j += 2;
        matched = true;
        continue;
      }
      break;
    }

    if (MULTIPLIERS[token] !== undefined) {
      const scale = MULTIPLIERS[token];
      const card = CARDINALS[tokens[j + 1]];
      if (card !== undefined && card > 0) {
        total += scale * card;
        j += 2;
        matched = true;
        continue;
      }
      total += scale;
      j += 1;
      matched = true;
      continue;
    }

    const card = CARDINALS[token];
    if (card !== undefined) {
      const nextScale = MULTIPLIERS[tokens[j + 1]];
      // "bibiri" + "ibihumbi" → 2000
      if (nextScale !== undefined && card > 0 && card <= 9) {
        total += card * nextScale;
        j += 2;
        matched = true;
        continue;
      }
      total += card;
      j += 1;
      matched = true;
      continue;
    }

    if (CONNECTORS.has(token) && matched) {
      j += 1;
      continue;
    }

    break;
  }

  return matched ? { value: total, consumed: j - start } : null;
}


/** Parse a fraction word starting at tokens[index] ("kimwe cya kabiri" → 0.5). */
export function parseKinyarwandaFraction(tokens: string[], index: number): ParsedNumber | null {
  for (const f of FRACTIONS) {
    for (const words of f.words) {
      const parts = words.split(' ');
      if (parts.every((p, k) => tokens[index + k] === p)) {
        return { value: f.value, consumed: parts.length, kind: 'fraction' };
      }
    }
  }
  return null;
}

/** Parse the next number in a token stream (digits, Kinyarwanda compounds or fractions). */
export function parseNextNumber(tokens: string[], index: number): ParsedNumber | null {
  const digit = parseDigitToken(tokens[index]);
  if (digit) return digit;
  const fraction = parseKinyarwandaFraction(tokens, index);
  if (fraction) return fraction;
  return parseKinyarwandaNumber(tokens, index);
}

export interface NumberOccurrence {
  value: number;
  kind: ParsedNumber['kind'];
  index: number;
  endIndex: number;
  /** Raw text span as spoken. */
  raw: string;
  unitSuffix?: ParsedNumber['unitSuffix'];
}

/** Find every number occurrence in a token stream, in order. */
export function extractNumberOccurrences(tokens: string[]): NumberOccurrence[] {
  const out: NumberOccurrence[] = [];
  let i = 0;
  while (i < tokens.length) {
    const parsed = parseNextNumber(tokens, i);
    if (parsed) {
      const endIndex = i + parsed.consumed - 1;
      out.push({
        value: parsed.value,
        kind: parsed.kind,
        index: i,
        endIndex,
        raw: tokens.slice(i, endIndex + 1).join(' '),
        unitSuffix: parsed.unitSuffix,
      });
      i = endIndex + 1;
      continue;
    }
    i += 1;
  }
  return out;
}

/** Kinyarwanda number word → digits, used by the normalizer for token-level repair. */
export function numberWordToDigit(token: string): number | null {
  const value = CARDINALS[token];
  return value === undefined ? null : value;
}

/** Percentage reading: "18 ku ijana" → 18 */
export function parsePercent(tokens: string[]): number | null {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (tokens[i + 1] === 'ku' && tokens[i + 2] === 'ijana') {
      const value = parseDigitToken(tokens[i]) ?? parseKinyarwandaNumber(tokens, i);
      if (value) return value.value;
    }
  }
  return null;
}

export const NUMBER_WORDS: string[] = Object.keys(CARDINALS);
export const NUMBER_MULTIPLIERS: string[] = [...Object.keys(MULTIPLIERS), TENS_MULTIPLIER];
