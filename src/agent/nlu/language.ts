/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GANZA Kinyarwanda-Native NLU — Step 1: Language detection
 *
 * Kinyarwanda is the PRIMARY language of the agent. Detection never translates:
 * it classifies the utterance so downstream semantic layers read meaning
 * directly and so the agent can answer in the user's own language.
 *
 * Handles pure Kinyarwanda, Kinyarwanda + English mixed speech, English, French
 * and informal/spoken input without punctuation.
 */

import { GANZA_VOCABULARY } from './vocabulary.js';
import { ganzaLexicon } from './lexicon.js';
import type { DetectedLanguage, LanguageDetection, LanguageToken, NluLanguage } from './types.js';

/** Kinyarwanda function words, verb markers and noun-class prefixes. */
const KINYARWANDA_MARKERS = new Set([
  'na', 'no', 'ni', 'nimu', 'mu', 'ku', 'kuri', 'muri', 'kwa', 'cyane', 'wese', 'yose', 'zose', 'bose', 'byose',
  'nka', 'niba', 'kandi', 'cyangwa', 'ariko', 'kuko', 'ubu', 'noneho', 'ese', 'mbese', 'gute', 'iki', 'hehe',
  'ryari', 'angahe', 'zingahe', 'bingahe', 'cyingahe', 'nyamuneka', 'murakoze', 'urakoze', 'muraho', 'mwaramutse',
  'mwiriwe', 'bite', 'amakuru', 'yego', 'oya', 'ntabwo', 'ahubwo', 'hasi', 'hejuru', 'nanone', 'mbere', 'inyuma',
  'gusa', 'byinshi', 'bike', 'nke', 'nyinshi', 'ose', 'buri', 'hose', 'hari', 'hano', 'ngaho', 'kuki', 'kuba',
  'ndabaza', 'mbwira', 'mfasha', 'ndakwinginze', 'uyu', 'iyi', 'iri', 'aka', 'uko', 'iyo', 'izo', 'izi', 'abo',
  'ziri', 'zira', 'ari', 'kiri', 'biri', 'turi', 'uri', 'ndi', 'tura', 'nzajya', 'njye', 'wowe', 'twebwe',
  'mwebwe', 'cyo', 'byo', 'zo', 'wo', 'ko', 'mo', 'aho', 'aha', 'nta', 'ntacyo', 'ntakintu', 'buriya',
  // request / action markers
  'ndashaka', 'nshaka', 'turashaka', 'bashaka', 'nifuza', 'nkeneye', 'ukeneye', 'shobora', 'ushobora',
  'nshobora', 'nyereka', 'wereka', 'nkwereka', 'ongera', 'subiramo', 'komeza', 'hindura', 'reka', 'hagarara',
  'emeza', 'tangira', 'birangiye', 'uzibarire', 'uzibare', 'mbaze', 'ubaze',
]);

/** English function words / verbs that are NOT used inside Kinyarwanda speech. */
const ENGLISH_MARKERS = new Set([
  'the', 'a', 'an', 'of', 'to', 'for', 'with', 'from', 'and', 'or', 'please', 'my', 'me', 'you', 'your', 'we',
  'open', 'close', 'show', 'take', 'add', 'count', 'save', 'store', 'update', 'change', 'give', 'tell', 'find',
  'search', 'calculate', 'compute', 'generate', 'create', 'print', 'view', 'list', 'check', 'record', 'start',
  'stop', 'cancel', 'repeat', 'continue', 'help', 'want', 'need', 'can', 'could', 'would', 'how', 'many', 'much',
  'what', 'where', 'when', 'which', 'is', 'are', 'do', 'does', 'in', 'into', 'on', 'at', 'all', 'today',
  'yesterday', 'tomorrow', 'week', 'month', 'year', 'boards', 'board', 'wood', 'timber', 'inventory', 'value',
  'worth', 'sales', 'sale', 'purchase', 'payment', 'customer', 'customers', 'supplier', 'expense', 'expenses',
  'price', 'prices', 'picture', 'this', 'that', 'these', 'those', 'them',
  // English words Rwandan traders mix into Kinyarwanda speech (they are English evidence,
  // and the utterance stays understandable in Kinyarwanda — see the mixed-language rules).
  'camera', 'photo', 'report', 'stock', 'volume', 'scan', 'data',
]);

/** French function words. */
const FRENCH_MARKERS = new Set([
  'le', 'la', 'les', 'des', 'du', 'de', 'un', 'une', 'et', 'pour', 'avec', 'dans', 'sur', 'ouvrir', 'fermer',
  'montrer', 'ajouter', 'compter', 'enregistrer', 'combien', 'bois', 'planche', 'planches', 'prix', 'valeur',
  'rapport', 'client', 'clients', 'aujourdhui', 'bonjour', 'merci', 'vous', 'plait', 'je', 'veux', 'besoin',
  'aide', 'tous', 'toutes', 'mon', 'ma', 'mes', 'voir', 'chercher', 'prendre',
]);

/** Loan words with no language vote of their own (used by both languages equally). */
const SHARED_LOANWORDS = new Set([
  'budget', 'file', 'online', 'deal', 'invoice', 'sms', 'airtime', 'phone', 'email', 'app', 'alert', 'system',
]);

const KINYARWANDA_VERB_PREFIX = /^(nd|nk|nz|nku|ndaku|n|ur|uz|uk|um|ut|ar|az|ak|at|tur|tuz|tuk|tug|mur|muz|muk|mwa|bar|baz|bak|bwa|nt|it|ib|ig|iz|kir|git|bit|zit|kub|kug|kum|kuk|kwi|guf|guk|gut|gus|guh|kw|kwish|kugur|kubar)/;
const KINYARWANDA_ENDINGS = /(sha|shya|ra|za|sa|nga|nya|ye|ire|iye|amo|aho|ana|ishije|ishijwe|urwa|irwa|e)$/;

function normalizeToken(token: string): string {
  return token
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[`´]/g, "'")
    .replace(/[^a-z0-9'\-]/g, '');
}

/**
 * Language evidence taken straight from the semantic lexicon / GANZA vocabulary,
 * so detection and understanding can never disagree about what is Kinyarwanda:
 * "kamera" is Kinyarwanda, "camera" is the English word Rwandans mix in.
 * A surface claimed by two languages (e.g. "volume") casts no vote.
 */
function buildLexiconEvidence(): { rw: Set<string>; en: Set<string>; fr: Set<string> } {
  const claims = new Map<string, Set<NluLanguage>>();
  const claim = (surface: string, language: NluLanguage) => {
    const key = normalizeToken(surface);
    if (!key || key.includes(' ')) return;
    const languages = claims.get(key) ?? new Set<NluLanguage>();
    languages.add(language);
    claims.set(key, languages);
  };

  for (const entry of ganzaLexicon.all()) {
    for (const surface of entry.surfaces ?? []) claim(surface, entry.language);
    for (const root of entry.roots ?? []) claim(root, entry.language);
  }

  const rw = new Set<string>();
  const en = new Set<string>();
  const fr = new Set<string>();
  for (const [surface, languages] of claims) {
    if (languages.size !== 1) continue;
    const [language] = [...languages];
    if (language === 'rw') rw.add(surface);
    else if (language === 'en') en.add(surface);
    else fr.add(surface);
  }
  return { rw, en, fr };
}

const LEXICON_EVIDENCE = buildLexiconEvidence();

/** Language of a single token, using markers + lexicon evidence + Kinyarwanda morphology. */
export function classifyToken(rawToken: string): LanguageToken {
  const token = normalizeToken(rawToken);
  if (!token) return { token: rawToken, language: 'other' };
  if (KINYARWANDA_MARKERS.has(token) || LEXICON_EVIDENCE.rw.has(token)) return { token, language: 'rw' };
  if (ENGLISH_MARKERS.has(token) || LEXICON_EVIDENCE.en.has(token)) return { token, language: 'en' };
  if (FRENCH_MARKERS.has(token) || LEXICON_EVIDENCE.fr.has(token)) return { token, language: 'fr' };
  if (SHARED_LOANWORDS.has(token)) return { token, language: 'other' };
  if (KINYARWANDA_VERB_PREFIX.test(token) && KINYARWANDA_ENDINGS.test(token)) {
    return { token, language: 'rw' };
  }
  return { token, language: 'other' };
}

function tokenWeight(token: string, language: NluLanguage | 'other'): number {
  if (language === 'other') return 0;
  // Longer markers are stronger evidence than 2-letter connectors.
  return token.length >= 6 ? 2.2 : token.length >= 4 ? 1.6 : 1;
}


export interface LanguageDetectorOptions {
  /** Kinyarwanda/English evidence ratio to call an utterance "mixed". */
  mixedThreshold?: number;
}

/** Detect the language of an utterance. Kinyarwanda wins ties (primary language). */
export function detectLanguage(text: string, options: LanguageDetectorOptions = {}): LanguageDetection {
  const mixedThreshold = options.mixedThreshold ?? 0.22;
  const rawTokens = String(text ?? '').split(/\s+/).filter(Boolean);
  const tokens = rawTokens.map(classifyToken);

  const scores: Record<NluLanguage, number> = { rw: 0, en: 0, fr: 0 };
  for (const t of tokens) {
    if (t.language === 'other') continue;
    scores[t.language] += tokenWeight(t.token, t.language);
  }

  const total = scores.rw + scores.en + scores.fr;
  const shares: Record<NluLanguage, number> = total > 0
    ? { rw: scores.rw / total, en: scores.en / total, fr: scores.fr / total }
    : { rw: 0, en: 0, fr: 0 };

  // Kinyarwanda + English mixed speech: both must be clearly present.
  const mixed = shares.rw >= mixedThreshold && (shares.en >= mixedThreshold || shares.fr >= mixedThreshold);

  let dominant: NluLanguage;
  if (mixed) {
    dominant = shares.rw >= Math.max(shares.en, shares.fr) ? 'rw' : shares.en >= shares.fr ? 'en' : 'fr';
  } else if (total === 0) {
    // Kinyarwanda-first: unknown speech is still handled by Kinyarwanda rules.
    dominant = 'rw';
  } else if (shares.fr > shares.en && shares.fr > shares.rw) {
    dominant = 'fr';
  } else if (shares.en > shares.rw) {
    dominant = 'en';
  } else {
    dominant = 'rw';
  }

  let language: DetectedLanguage;
  if (total === 0) language = 'unknown';
  else if (mixed) language = 'mixed';
  else language = dominant;

  const topScore = Math.max(scores.rw, scores.en, scores.fr);
  const confidence = total === 0 ? 0.2 : Math.min(0.99, 0.45 + 0.5 * (topScore / total));

  return {
    language,
    dominant,
    confidence: Number(confidence.toFixed(3)),
    scores,
    mixed,
    kinyarwandaRatio: Number(shares.rw.toFixed(3)),
    tokens,
  };
}

/**
 * Voice input: speech-to-text often returns several hypotheses. Language detection
 * runs on the hypotheses directly — Kinyarwanda is never translated before this step.
 */
export function detectSpeechLanguage(hypotheses: string[]): LanguageDetection {
  const list = (hypotheses ?? []).filter(Boolean);
  if (list.length === 0) return detectLanguage('');
  const combined = detectLanguage(list.join(' '));
  const best = list
    .map(detectLanguage)
    .reduce((a, b) => (b.confidence > a.confidence ? b : a));
  return combined.confidence >= best.confidence ? combined : best;
}

/** All language evidence terms the detector knows (used by tests/debug tooling). */
export function languageVocabulary(): { rw: string[]; en: string[]; fr: string[] } {
  const rw = new Set<string>([...KINYARWANDA_MARKERS, ...LEXICON_EVIDENCE.rw]);
  const en = new Set<string>([...ENGLISH_MARKERS, ...LEXICON_EVIDENCE.en]);
  const fr = new Set<string>([...FRENCH_MARKERS, ...LEXICON_EVIDENCE.fr]);
  for (const term of GANZA_VOCABULARY.terms) {
    if (term.rw) term.rw.forEach(t => rw.add(t.toLowerCase()));
    if (term.en) term.en.forEach(t => en.add(t.toLowerCase()));
    if (term.fr) term.fr.forEach(t => fr.add(t.toLowerCase()));
  }
  return { rw: [...rw], en: [...en], fr: [...fr] };
}
