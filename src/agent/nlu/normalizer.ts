/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GANZA Kinyarwanda-Native NLU — Step 2: Kinyarwanda normalization
 *
 * Handles what real Kinyarwanda input looks like:
 *  - apostrophe contractions written every possible way: y'izi, y’izi, y`izi
 *  - spelling variations (l ↔ r, sh ↔ s, missing aspiration, doubled vowels)
 *  - joined or spaced words, mixed Kinyarwanda/English, digits and money shorthand
 *  - Kinyarwanda verb morphology (subject/tense prefixes + aspect suffixes)
 */

import { ganzaLexicon, type SemanticLexicon } from './lexicon.js';
import { detectLanguage } from './language.js';
import type { NormalizedUtterance, NormRepair } from './types.js';

/** Explicit spelling variant map — everyday Rwandan spelling of key words. */
export const SPELLING_VARIANTS: Record<string, string> = {
  bala: 'bara', balura: 'barura', kubala: 'kubara', kubalura: 'kubarura', ibalura: 'ibarura',
  fungula: 'fungura', fungurila: 'fungurira', gufungula: 'gufungura',
  laba: 'reba', ndalaba: 'ndareba',
  sakisha: 'shakisha', saka: 'shaka', sakira: 'shakira', shakiza: 'shakisha',
  ububiku: 'ububiko', sitooki: 'stock', stocki: 'stock',
  igichiro: 'igiciro', agachiro: 'agaciro', igicilo: 'igiciro',
  ubulebure: 'uburebure', uburebule: 'uburebure',
  umukilia: 'umukiriya', umukiliya: 'umukiriya', abakiliya: 'abakiriya',
  gurisa: 'gurisha', kugurisa: 'kugurisha', nagurisije: 'nagurishije',
  gukura: 'kugura', gukula: 'kugura', kugula: 'kugura', nagula: 'naguze',
  komeja: 'komeza', subilamo: 'subiramo', ongela: 'ongera', hindula: 'hindura',
  kamara: 'kamera', kamela: 'kamera', imbahu: 'imbaho', embaho: 'imbaho',
  ifotto: 'ifoto', foto: 'ifoto', photo: 'ifoto', picha: 'ifoto',
  santimita: 'santimetero', mitari: 'metero',
  laporo: 'raporo', lapolo: 'raporo', rapolo: 'raporo',
  mubare: 'umubare', umubale: 'umubare',
  mudasobwa: 'mudasobwa',
};

/** Apostrophe contractions → spaced words (Kinyarwanda linking). */
const CONTRACTIONS: [RegExp, string][] = [
  [/\bn'(\w)/g, 'na $1'],
  [/\by'(\w)/g, 'ya $1'],
  [/\bw'(\w)/g, 'wa $1'],
  [/\bk'(\w)/g, 'ka $1'],
  [/\bb'(\w)/g, 'ba $1'],
  [/\bm'(\w)/g, 'ma $1'],
  [/\br'(\w)/g, 'ra $1'],
  [/\bz'(\w)/g, 'za $1'],
  [/\bg'(\w)/g, 'ga $1'],
  [/\bcy'(\w)/g, 'cya $1'],
];

/** Kinyarwanda subject / tense / object prefixes (longest first). */
const VERB_PREFIXES = [
  'ndakwi', 'ndaku', 'nkwi', 'ndak', 'nkub', 'nziba', 'baziba', 'duku', 'duzi',
  'ndi', 'nda', 'nku', 'nka', 'nki', 'nza', 'nze', 'nta', 'nzi',
  'ura', 'uzi', 'uze', 'uk', 'um', 'ut', 'ush', 'ugi', 'ugu',
  'ara', 'aza', 'azi', 'ak', 'am', 'at', 'ash', 'agi', 'agu',
  'tura', 'tuz', 'tuk', 'tum', 'tut', 'twa', 'twi',
  'mura', 'muz', 'muk', 'mum', 'mut', 'mwa', 'mwi',
  'bara', 'baz', 'bak', 'bam', 'bat', 'bwa', 'bwi', 'baku',
  'kuba', 'kubu', 'kub', 'ku', 'kug', 'kum', 'kuk', 'kwi', 'kw', 'kwish',
  'guk', 'gut', 'gus', 'guh', 'guf', 'gu',
  'nk', 'nd', 'nz', 'nt', 'mb', 'mp', 'mw', 'ny', 'nj',
  'bi', 'by', 'cy', 'ki', 'zi', 'za', 'ze', 'ru', 'bu', 'ba', 'ka', 'ga', 'ha', 'mu', 'ma', 'wa', 'ya', 'ra', 're', 'ro',
  'ni', 'no', 'na', 'i', 'u', 'a', 'n', 'm', 'y', 'w', 'k', 'b',
];

/** Aspect / derivational suffixes (longest first). */
const VERB_SUFFIXES = [
  'ishiriza', 'ishirizwa', 'ishisha', 'ishijwe', 'ishije', 'iriza', 'irizwa', 'urwa', 'irwa',
  'ijwe', 'itswe', 'itse', 'nye', 'ishya', 'isha', 'ana', 'aho', 'amo', 'ire', 'iye', 'eye',
  'zemo', 'zamo', 'mwo', 'mo', 'ho', 'yo', 'ko', 'wo', 'ye', 'ra', 'za', 'sa', 'nya', 'a', 'e', 'i', 'u',
];

/** Normalize text: case, diacritics, apostrophes and word contractions. */
export function normalizeText(raw: string): { text: string; repairs: NormRepair[] } {
  const repairs: NormRepair[] = [];
  let text = String(raw ?? '')
    .replace(/[\u2018\u2019\u201B`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  // Money shorthand: "2M" = 2,000,000 and "40K" = 40,000 (case sensitive, before lowercasing).
  text = text
    .replace(/(\d+(?:[.,]\d+)?)\s*M\b/g, (_m, n: string) => String(Number(n.replace(/,/g, '')) * 1000000))
    .replace(/(\d+(?:[.,]\d+)?)\s*K\b/g, (_m, n: string) => String(Number(n.replace(/,/g, '')) * 1000))
    .toLowerCase();

  for (const [pattern, replacement] of CONTRACTIONS) {
    const before = text;
    text = text.replace(pattern, replacement);
    if (before !== text) {
      repairs.push({ from: before.match(pattern)?.[0] ?? '', to: replacement, reason: 'contraction' });
    }
  }

  // Diacritics are uncommon in Kinyarwanda but appear in copy/pasted text.
  const withoutDiacritics = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC');
  if (withoutDiacritics !== text) repairs.push({ from: text, to: withoutDiacritics, reason: 'diacritic' });
  text = withoutDiacritics;

  return { text, repairs };
}

/** Split normalized text into raw tokens (keeps "1,000", "40k", "3m" intact). */
export function tokenize(raw: string): string[] {
  const { text } = normalizeText(raw);
  return text.split(/[^a-z0-9',.\-]+/).filter(Boolean);
}

/** Apply the explicit spelling-variant map (and l↔r / doubled-vowel repair). */
export function repairToken(token: string, lexicon: SemanticLexicon = ganzaLexicon): { token: string; repair?: NormRepair } {
  if (!token) return { token };
  // Explicit spelling variants / everyday spellings are repaired first, so that a
  // misspelling written the way people actually type it ("fungula", "imbahu",
  // "ifotto") is normalized to the canonical Kinyarwanda surface before matching.
  const direct = SPELLING_VARIANTS[token];
  if (direct) return { token: direct, repair: { from: token, to: direct, reason: 'spelling_variant' } };
  if (lexicon.lookupSurface(token).length > 0) return { token };

  // Variants applied only when they unlock a lexicon hit (never corrupt unknown words).
  const variants = new Set<string>([
    token.replace(/l/g, 'r'),
    token.replace(/r/g, 'l'),
    token.replace(/sh/g, 's'),
    token.replace(/s/g, 'sh'),
    token.replace(/(.)\1+/g, '$1'),
    token.replace(/h/g, ''),
  ]);

  for (const candidate of variants) {
    if (candidate === token || candidate.length < 3) continue;
    if (lexicon.lookupSurface(candidate).length > 0) {
      return { token: candidate, repair: { from: token, to: candidate, reason: 'spelling_variant' } };
    }
  }
  return { token };
}

/** Strip Kinyarwanda verb affixes and return the best known root ("uzibarire" → "bar"). */
export function stemToken(token: string, lexicon: SemanticLexicon = ganzaLexicon): string {
  if (lexicon.lookupSurface(token).length > 0) return token;

  const candidates = stemCandidates(token);
  // Longest candidate first: the least aggressive stripping that is still a known root.
  for (const candidate of candidates) {
    if (lexicon.lookupRoot(candidate).length > 0) return candidate;
  }
  const stripped = candidates[0];
  return stripped && stripped.length >= 3 ? stripped : token;
}

/** All plausible stems for a token (prefix stripping × suffix stripping). */
export function stemCandidates(token: string): string[] {
  const out = new Set<string>();
  let frontier = [token];

  for (let depth = 0; depth < 3; depth++) {
    const next: string[] = [];
    for (const word of frontier) {
      for (const prefix of VERB_PREFIXES) {
        if (word.startsWith(prefix) && word.length - prefix.length >= 3) {
          next.push(word.slice(prefix.length));
        }
      }
    }
    for (const w of next) out.add(w);
    frontier = next;
    if (next.length === 0) break;
  }

  const bases = [token, ...out];
  for (const base of bases) {
    for (const suffix of VERB_SUFFIXES) {
      if (base.endsWith(suffix) && base.length - suffix.length >= 3) {
        out.add(base.slice(0, base.length - suffix.length));
      }
    }
  }
  // Remove noise, longest first.
  return [...out].filter(c => c.length >= 3).sort((a, b) => b.length - a.length);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

export function editDistance(a: string, b: string): number {
  return levenshtein(a, b);
}

/** Allowed edit distance for fuzzy token matching — short words must match exactly. */
export function fuzzyThreshold(length: number): number {
  if (length <= 3) return 0;
  if (length <= 5) return 1;
  return 2;
}

/**
 * Fuzzy equality, tolerant to l/r and doubled-vowel variation (common in Kinyarwanda).
 */
export function fuzzyEqual(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length <= 2 || b.length <= 2) return a === b;
  const dist = levenshtein(a, b);
  return dist <= fuzzyThreshold(Math.max(a.length, b.length));
}

/**
 * Strict typo tolerance used by intent detection. A fuzzy hit must never invent
 * meaning (requirement: "never invent meaning"), so all of these must hold:
 *   - both words are at least 5 characters long
 *   - lengths differ by at most 1
 *   - the first two letters match (Kinyarwanda roots keep their onset)
 *   - at most 1 edit for words up to 6 letters, 2 edits beyond that
 *   - at most 1 edit inside the first 4 letters (rejects "gukura" → "gufata")
 */
export function fuzzyTokenEqual(token: string, surface: string): boolean {
  if (token === surface) return true;
  if (token.length < 5 || surface.length < 5) return false;
  if (Math.abs(token.length - surface.length) > 1) return false;
  if (token.slice(0, 2) !== surface.slice(0, 2)) return false;
  const budget = Math.max(token.length, surface.length) <= 6 ? 1 : 2;
  if (levenshtein(token, surface) > budget) return false;
  return levenshtein(token.slice(0, 4), surface.slice(0, 4)) <= 1;
}

/**
 * Full step 1+2 output: language + normalized tokens/stems + repairs.
 * Content tokens keep number words (the numeral parser needs the compounds).
 */
export function normalizeUtterance(raw: string, lexicon: SemanticLexicon = ganzaLexicon): NormalizedUtterance {
  const { text, repairs } = normalizeText(raw);
  const rawTokens = text.split(/[^a-z0-9',.\-]+/).filter(Boolean);

  const tokens: string[] = [];
  const stems: string[] = [];
  const allRepairs = [...repairs];

  for (const rawToken of rawTokens) {
    const { token, repair } = repairToken(rawToken, lexicon);
    if (repair) allRepairs.push(repair);
    if (lexicon.isFiller(token)) continue;
    tokens.push(token);
    stems.push(stemToken(token, lexicon));
  }

  return {
    raw,
    normalized: text,
    tokens,
    stems,
    repairs: allRepairs,
    language: detectLanguage(raw),
  };
}


