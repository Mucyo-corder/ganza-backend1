/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GANZA Kinyarwanda-Native NLU — Semantic lexicon
 *
 * Meaning lives in *concepts*, not in keywords. Each entry lists the natural
 * Kinyarwanda surfaces people actually say (including common misspellings),
 * the roots used for morphological matching ("fungurira" → root "fungur"),
 * and the language-neutral concepts they express.
 *
 * Kinyarwanda verbs carry subjects/objects/tenses as affixes, so exact keyword
 * matching can never work: "ndashaka", "uzibarire", "mfata", "zibike" all have
 * to be reduced to their roots before they can be understood.
 */

import { ganzaVocabulary, normalizeSurface, type GanzaVocabulary } from './vocabulary.js';
import type { ConceptId, NluLanguage } from './types.js';

export interface LexiconEntry {
  id: string;
  language: NluLanguage;
  surfaces: string[];
  /** Kinyarwanda roots for morphological matching (stems produced by the normalizer). */
  roots?: string[];
  concepts: ConceptId[];
  weight?: number;
  kind?: 'verb' | 'noun' | 'marker' | 'pronoun' | 'question' | 'filler';
  /** Do not stem/fuzzy match this entry (used for "ndashaka" so it is not read as "shaka"/search). */
  exclusive?: boolean;
  /** Concepts to suppress when this entry matches the same token. */
  negates?: ConceptId[];
}

const ACTIONS: LexiconEntry[] = [
  // ── open / close / navigate ───────────────────────────────────────────────
  { id: 'open', language: 'rw', kind: 'verb', weight: 1.2, surfaces: ['fungura', 'fungurira', 'fungurwa', 'gufungura', 'nfungura', 'funguye', 'fungula', 'fugura', 'kingura', 'gukingura'], roots: ['fungur', 'fung', 'kingur'], concepts: ['open'] },
  { id: 'open_en', language: 'en', kind: 'verb', weight: 1.2, surfaces: ['open', 'launch', 'start'], concepts: ['open'] },
  { id: 'open_fr', language: 'fr', kind: 'verb', weight: 1.2, surfaces: ['ouvrir', 'ouvre', 'lance'], concepts: ['open'] },
  { id: 'close', language: 'rw', kind: 'verb', surfaces: ['funga', 'gufunga', 'fungira', 'fungidwa', 'funga ibara'], roots: ['fung'], concepts: ['close'] },
  { id: 'close_en', language: 'en', kind: 'verb', surfaces: ['close', 'exit'], concepts: ['close'] },
  { id: 'goto', language: 'rw', kind: 'verb', weight: 1.2, surfaces: ['jya', 'kujya', 'jya kuri', 'genda', 'kugenda', 'genda kuri', 'injira', 'kwinjira', 'nzajya', 'jya i', 'kureba'], roots: ['jy', 'gend', 'injir'], concepts: ['goto'] },
  { id: 'goto_en', language: 'en', kind: 'verb', weight: 1.2, surfaces: ['go', 'navigate', 'goto'], concepts: ['goto'] },
  // ── camera / photo / scan ─────────────────────────────────────────────────
  { id: 'capture', language: 'rw', kind: 'verb', weight: 1.2, surfaces: ['fata', 'gufata', 'mfata', 'nafata', 'ifotora', 'kubamba', 'fatafata'], roots: ['fat'], concepts: ['capture'] },
  { id: 'capture_en', language: 'en', kind: 'verb', weight: 1.2, surfaces: ['take', 'capture', 'shoot'], concepts: ['capture'] },
  { id: 'capture_fr', language: 'fr', kind: 'verb', weight: 1.2, surfaces: ['prendre', 'capture', 'capturer'], concepts: ['capture'] },
  { id: 'scan', language: 'rw', kind: 'verb', weight: 1.1, surfaces: ['sikana', 'skana', 'sikan', 'gusikana', 'skani'], roots: ['sikan', 'skan'], concepts: ['scan'] },
  { id: 'scan_en', language: 'en', kind: 'verb', weight: 1.1, surfaces: ['scan'], concepts: ['scan'] },
  // ── counting / computing ─────────────────────────────────────────────────
  { id: 'count', language: 'rw', kind: 'verb', weight: 1.3, surfaces: ['bara', 'kubara', 'barura', 'kubarura', 'ibarura', 'ubarire', 'uzibarire', 'uzibare', 'zibarire', 'babarire', 'muzibarire', 'duzibarire', 'barire', 'ubaze', 'mbaze', 'kubalura', 'ibare'], roots: ['bar', 'barur', 'baz'], concepts: ['count'] },
  { id: 'count_en', language: 'en', kind: 'verb', weight: 1.3, surfaces: ['count', 'tally'], concepts: ['count'] },
  { id: 'count_fr', language: 'fr', kind: 'verb', weight: 1.3, surfaces: ['compter', 'compte'], concepts: ['count'] },
  { id: 'calculate', language: 'rw', kind: 'verb', weight: 1.1, surfaces: ['gereranya', 'kugereranya', 'ibara', 'shyira hamwe'], roots: ['gererany'], concepts: ['calculate'] },
  { id: 'calculate_en', language: 'en', kind: 'verb', weight: 1.1, surfaces: ['calculate', 'compute', 'sum'], concepts: ['calculate'] },
  // ── save / add ───────────────────────────────────────────────────────────
  { id: 'save', language: 'rw', kind: 'verb', weight: 1.3, surfaces: ['bika', 'kubika', 'zibika', 'zibike', 'ubike', 'bibike', 'yibike', 'shyiramo', 'shyira', 'injiza', 'andika', 'kuzibika', 'bikira'], roots: ['bik', 'shyiram', 'injiz', 'andik'], concepts: ['save'] },
  { id: 'save_en', language: 'en', kind: 'verb', weight: 1.3, surfaces: ['save', 'store', 'keep', 'record'], concepts: ['save'] },
  { id: 'save_fr', language: 'fr', kind: 'verb', weight: 1.3, surfaces: ['enregistrer', 'garder', 'sauver'], concepts: ['save'] },
  { id: 'add', language: 'rw', kind: 'verb', weight: 1.1, surfaces: ['ongera', 'kongera', 'ongeraho', 'ongere', 'kongeza', 'ndongere', 'tuongere'], roots: ['onger', 'konger'], concepts: ['add'] },
  { id: 'add_en', language: 'en', kind: 'verb', weight: 1.1, surfaces: ['add', 'append'], concepts: ['add'] },
];


const PERCEPTION_AND_QUERY: LexiconEntry[] = [
  // ── show / view / inform ─────────────────────────────────────────────────
  { id: 'show', language: 'rw', kind: 'verb', weight: 1.2, surfaces: ['erekana', 'wereka', 'nyereka', 'cerekana', 'kwerekana', 'tangaza', 'reba', 'kureba', 'ndebe', 'mbwira', 'ubwira', 'kubwira', 'babwira'], roots: ['erek', 'rek', 'reb', 'bwir', 'tangaz'], concepts: ['show'] },
  { id: 'show_en', language: 'en', kind: 'verb', weight: 1.2, surfaces: ['show', 'display', 'view', 'see', 'look', 'tell'], concepts: ['show'] },
  { id: 'show_fr', language: 'fr', kind: 'verb', weight: 1.2, surfaces: ['montrer', 'voir', 'afficher'], concepts: ['show'] },
  // ── search ───────────────────────────────────────────────────────────────
  { id: 'search', language: 'rw', kind: 'verb', weight: 1.2, surfaces: ['shaka', 'shakisha', 'sakisha', 'shakira', 'shakashaka', 'nshakishe', 'mushakishe', 'kushaka', 'shakira aho'], roots: ['shak', 'shakish', 'sakish'], concepts: ['search'] },
  { id: 'search_en', language: 'en', kind: 'verb', weight: 1.2, surfaces: ['find', 'search', 'look up', 'look for'], concepts: ['search'] },
  { id: 'search_fr', language: 'fr', kind: 'verb', weight: 1.2, surfaces: ['chercher', 'trouver'], concepts: ['search'] },
  // ── "I want" — a request marker, NOT a search verb ───────────────────────
  { id: 'want', language: 'rw', kind: 'marker', weight: 0.4, exclusive: true, negates: ['search'], surfaces: ['ndashaka', 'nshaka', 'turashaka', 'bashaka', 'mushaka', 'nifuza', 'nkeneye', 'ukeneye', 'dukeneye', 'ndashaka ko'], concepts: ['want'] },
  { id: 'want_en', language: 'en', kind: 'marker', weight: 0.4, exclusive: true, negates: ['search'], surfaces: ['want', 'need', 'would like'], concepts: ['want'] },
  // ── help / greeting / courtesy ───────────────────────────────────────────
  { id: 'help', language: 'rw', kind: 'verb', weight: 1.2, surfaces: ['fasha', 'mfasha', 'mfashe', 'gufasha', 'kumfasha', 'ubufasha', 'mfashije', 'nshobora iki', 'ushobora iki'], roots: ['fash', 'ubufash'], concepts: ['help'] },
  { id: 'help_en', language: 'en', kind: 'verb', weight: 1.2, surfaces: ['help', 'assist', 'what can you do'], concepts: ['help'] },
  { id: 'help_fr', language: 'fr', kind: 'verb', weight: 1.2, surfaces: ['aide', 'aider', 'aidez'], concepts: ['help'] },
  { id: 'greeting', language: 'rw', kind: 'marker', weight: 1, surfaces: ['muraho', 'mwaramutse', 'mwiriwe', 'bite', 'bite se', 'amakuru', 'amakuru yanyu', 'nshuti'], concepts: ['greeting'] },
  { id: 'greeting_en', language: 'en', kind: 'marker', weight: 1, surfaces: ['hello', 'hi', 'good morning', 'good afternoon', 'hey'], concepts: ['greeting'] },
  { id: 'greeting_fr', language: 'fr', kind: 'marker', weight: 1, surfaces: ['bonjour', 'salut'], concepts: ['greeting'] },
  { id: 'thanks', language: 'rw', kind: 'marker', weight: 0.6, surfaces: ['murakoze', 'urakoze', 'murakoze cyane'], roots: ['koze'], concepts: ['thanks'] },
];

const DIALOGUE_CONTROL: LexiconEntry[] = [
  { id: 'confirm', language: 'rw', kind: 'verb', weight: 1.2, surfaces: ['emeza', 'kwemeza', 'yemeza', 'emeza rwose', 'nibyo', 'sawa', 'yego'], roots: ['emez'], concepts: ['confirm'] },
  { id: 'confirm_en', language: 'en', kind: 'verb', weight: 1.2, surfaces: ['confirm', 'yes', 'ok', 'okay', 'sure'], concepts: ['confirm'] },
  { id: 'cancel', language: 'rw', kind: 'verb', weight: 1.2, surfaces: ['reka', 'kureka', 'hagarara', 'guhagarara', 'hagarika', 'guhagarika', 'reka aho'], roots: ['rek', 'hagarar', 'hagarik'], concepts: ['cancel'] },
  { id: 'cancel_en', language: 'en', kind: 'verb', weight: 1.2, surfaces: ['cancel', 'stop', 'abort'], concepts: ['cancel'] },
  { id: 'repeat', language: 'rw', kind: 'verb', weight: 1.2, surfaces: ['subiramo', 'subira', 'gusubiramo', 'subizamo', 'ongera uvuge', 'ongera usubire', 'subiramo ibyo'], roots: ['subir', 'subiz'], concepts: ['repeat'] },
  { id: 'repeat_en', language: 'en', kind: 'verb', weight: 1.2, surfaces: ['repeat', 'again', 'once more'], concepts: ['repeat'] },
  { id: 'continue', language: 'rw', kind: 'verb', weight: 1.2, surfaces: ['komeza', 'gukomeza', 'ukomeze', 'komeza mbere'], roots: ['komez'], concepts: ['continue'] },
  { id: 'continue_en', language: 'en', kind: 'verb', weight: 1.2, surfaces: ['continue', 'next', 'go on'], concepts: ['continue'] },
  { id: 'change', language: 'rw', kind: 'verb', weight: 1.2, surfaces: ['hindura', 'guhindura', 'hindurira', 'kosora', 'gukosora', 'vugurura', 'guvugurura', 'simbuza'], roots: ['hindur', 'kosor', 'vugurur', 'simbuz'], concepts: ['change'] },
  { id: 'change_en', language: 'en', kind: 'verb', weight: 1.2, surfaces: ['change', 'edit', 'update', 'modify', 'correct'], concepts: ['change'] },
  { id: 'change_fr', language: 'fr', kind: 'verb', weight: 1.2, surfaces: ['changer', 'modifier', 'corriger'], concepts: ['change'] },
  { id: 'negate', language: 'rw', kind: 'marker', weight: 0.8, surfaces: ['oya', 'ntabwo', 'atari', 'si', 'hasi', 'ntibishoboka'], concepts: ['negate'] },
  { id: 'negate_en', language: 'en', kind: 'marker', weight: 0.8, surfaces: ['no', 'not', 'wrong'], concepts: ['negate'] },
];

const QUESTIONS_AND_MARKERS: LexiconEntry[] = [
  { id: 'ask_amount', language: 'rw', kind: 'question', weight: 1, surfaces: ['angahe', 'zingahe', 'bingahe', 'cyingahe', 'ni angahe', 'ziri zingahe', 'bangahe', 'yangahe'], concepts: ['ask_amount', 'ask'] },
  { id: 'ask_amount_en', language: 'en', kind: 'question', weight: 1, surfaces: ['how much', 'how many'], concepts: ['ask_amount', 'ask'] },
  { id: 'ask_amount_fr', language: 'fr', kind: 'question', weight: 1, surfaces: ['combien'], concepts: ['ask_amount', 'ask'] },
  { id: 'ask', language: 'rw', kind: 'question', weight: 0.7, surfaces: ['iki', 'ni iki', 'gute', 'ni gute', 'hehe', 'ni hehe', 'ese', 'mbese', 'kuki'], concepts: ['ask'] },
  { id: 'ask_en', language: 'en', kind: 'question', weight: 0.7, surfaces: ['what', 'where', 'when', 'which', 'why', 'who'], concepts: ['ask'] },
  { id: 'generate', language: 'en', kind: 'verb', weight: 0.7, surfaces: ['generate', 'print', 'download', 'export', 'create'], concepts: ['show'] },
  { id: 'generate_fr', language: 'fr', kind: 'verb', weight: 0.7, surfaces: ['generer', 'imprimer', 'creer'], concepts: ['show'] },
  { id: 'set_price_en', language: 'en', kind: 'verb', weight: 1, surfaces: ['set', 'assign'], concepts: ['change'] },
  { id: 'per_unit', language: 'rw', kind: 'marker', weight: 0.5, surfaces: ['kuri buri', 'kuri buri mbaho', 'buri', 'ku giciro cya', 'buri kimwe'], concepts: ['per_unit'] },
  { id: 'per_unit_en', language: 'en', kind: 'marker', weight: 0.5, surfaces: ['each', 'per', 'apiece'], concepts: ['per_unit'] },
  { id: 'total_marker', language: 'rw', kind: 'marker', weight: 0.6, surfaces: ['hose hamwe', 'byose hamwe', 'bose hamwe', 'muri rusange', 'agaciro kose'], concepts: ['total'] },
  { id: 'total_marker_en', language: 'en', kind: 'marker', weight: 0.6, surfaces: ['in total', 'overall', 'altogether'], concepts: ['total'] },
  { id: 'all', language: 'rw', kind: 'marker', weight: 0.5, surfaces: ['zose', 'byose', 'bose', 'yose', 'cyose', 'wese'], concepts: ['all'] },
  { id: 'type', language: 'rw', kind: 'noun', weight: 0.6, surfaces: ['ubwoko', 'bwoko', 'species', 'type'], concepts: ['type'] },
  { id: 'followup', language: 'rw', kind: 'marker', weight: 0.5, surfaces: ['noneho', 'ubwo', 'nyuma y ibyo', 'hanyuma', 'nanone'], concepts: ['followup'] },
  { id: 'date_today', language: 'rw', kind: 'noun', weight: 0.6, surfaces: ['uyu munsi', 'none', 'uyu munsi', 'ubu'], concepts: ['date_today', 'date'] },
  { id: 'date_today_en', language: 'en', kind: 'noun', weight: 0.6, surfaces: ['today'], concepts: ['date_today', 'date'] },
  { id: 'date_yesterday', language: 'rw', kind: 'noun', weight: 0.6, surfaces: ['ejo hashize', 'ejo', 'ejo hambere'], concepts: ['date_yesterday', 'date'] },
  { id: 'date_yesterday_en', language: 'en', kind: 'noun', weight: 0.6, surfaces: ['yesterday'], concepts: ['date_yesterday', 'date'] },
  { id: 'date_week', language: 'rw', kind: 'noun', weight: 0.6, surfaces: ['iki cyumweru', 'icyumweru', 'iki cyumweru gishize'], concepts: ['date_week', 'date'] },
  { id: 'date_week_en', language: 'en', kind: 'noun', weight: 0.6, surfaces: ['this week', 'last week', 'weekly'], concepts: ['date_week', 'date'] },
  { id: 'date_month', language: 'rw', kind: 'noun', weight: 0.6, surfaces: ['uku kwezi', 'ukwezi', 'uku kwezi gushize'], concepts: ['date_month', 'date'] },
  { id: 'date_month_en', language: 'en', kind: 'noun', weight: 0.6, surfaces: ['this month', 'monthly'], concepts: ['date_month', 'date'] },
  { id: 'date_year', language: 'rw', kind: 'noun', weight: 0.6, surfaces: ['uyu mwaka', 'umwaka'], concepts: ['date_year', 'date'] },
  { id: 'date_year_en', language: 'en', kind: 'noun', weight: 0.6, surfaces: ['this year', 'yearly'], concepts: ['date_year', 'date'] },
];

const SCREENS: LexiconEntry[] = [
  { id: 'screen_camera', language: 'rw', kind: 'noun', weight: 0.8, surfaces: ['kamera', 'camera', 'ifoto', 'scan', 'sikani'], concepts: ['screen', 'screen_camera'] },
  { id: 'screen_inventory', language: 'rw', kind: 'noun', weight: 0.8, surfaces: ['ububiko', 'stock', 'inventory', 'imbaho mfite', 'ibicuruzwa'], concepts: ['screen', 'screen_inventory'] },
  { id: 'screen_sales', language: 'rw', kind: 'noun', weight: 0.8, surfaces: ['kugurisha', 'igurisha', 'sales', 'ubucuruzi'], concepts: ['screen', 'screen_sales'] },
  { id: 'screen_reports', language: 'rw', kind: 'noun', weight: 0.8, surfaces: ['raporo', 'report', 'reports', 'incamake'], concepts: ['screen', 'screen_reports'] },
  { id: 'screen_dashboard', language: 'rw', kind: 'noun', weight: 0.8, surfaces: ['ahabanza', 'dashboard', 'home', 'imbere', 'paji y imbere'], concepts: ['screen', 'screen_dashboard'] },
  { id: 'screen_customers', language: 'rw', kind: 'noun', weight: 0.8, surfaces: ['abakiriya', 'customers', 'clients'], concepts: ['screen', 'screen_customers'] },
  { id: 'screen_settings', language: 'rw', kind: 'noun', weight: 0.8, surfaces: ['igenamiterere', 'settings', 'parametres'], concepts: ['screen', 'screen_settings'] },
  { id: 'screen_devices', language: 'rw', kind: 'noun', weight: 0.8, surfaces: ['ibikoresho', 'devices'], concepts: ['screen', 'screen_devices'] },
];

/**
 * Reference pronouns / demonstratives that let follow-up commands work:
 *   "Fata ifoto y'izi mbaho." → "Noneho uzibarire."  (uzibarire = count THOSE boards)
 *   "Ubaze n'agaciro kazo."    (kazo = the value OF THEM)
 */
const REFERENCES: LexiconEntry[] = [
  { id: 'ref_them', language: 'rw', kind: 'pronoun', weight: 0.3, surfaces: ['izo', 'izi', 'zo', 'zazo', 'zizo', 'zabo', 'ziriya', 'iziriya', 'ezo'], concepts: ['ref_group'] },
  { id: 'ref_it', language: 'rw', kind: 'pronoun', weight: 0.3, surfaces: ['iyi', 'iyo', 'iyi mbaho', 'urwo', 'uru', 'ako', 'aka', 'cyo', 'byo', 'yo', 'wo', 'ko', 'kiriya'], concepts: ['ref_item'] },
  { id: 'ref_of_them', language: 'rw', kind: 'pronoun', weight: 0.3, surfaces: ['kazo', 'cyazo', 'cyayo', 'byazo', 'yazo', 'wazo', 'kwazo', 'za zo', 'ya zo', 'cya zo', 'bya zo'], concepts: ['ref_of_them'] },
  { id: 'ref_them_en', language: 'en', kind: 'pronoun', weight: 0.3, surfaces: ['them', 'those', 'these'], concepts: ['ref_group'] },
];

const FILLERS: LexiconEntry[] = [
  { id: 'filler_please', language: 'rw', kind: 'filler', weight: 0, surfaces: ['nyamuneka', 'ndakwinginze', 'se', 'sha', 'gusa', 'yoo', 'kandi', 'ngo'], concepts: [] },
  { id: 'filler_please_en', language: 'en', kind: 'filler', weight: 0, surfaces: ['please', 'kindly'], concepts: [] },
  { id: 'filler_fr', language: 'fr', kind: 'filler', weight: 0, surfaces: ['sil', 'plait', 'svp'], concepts: [] },
];

/** Built-in lexicon: Kinyarwanda-first, with English/French surfaces for mixed speech. */
export const BUILTIN_LEXICON: LexiconEntry[] = [
  ...ACTIONS,
  ...PERCEPTION_AND_QUERY,
  ...DIALOGUE_CONTROL,
  ...QUESTIONS_AND_MARKERS,
  ...SCREENS,
  ...REFERENCES,
  ...FILLERS,
];




/**
 * Semantic lexicon with surface + root indexes.
 * Vocabulary terms (configurable business vocabulary) are folded in automatically.
 */
export class SemanticLexicon {
  private entries: LexiconEntry[] = [];
  private surfaceIndex: Map<string, LexiconEntry[]> = new Map();
  private rootIndex: Map<string, LexiconEntry[]> = new Map();
  private allRoots: Set<string> = new Set();
  private fillerSet: Set<string> = new Set();

  constructor(entries: LexiconEntry[] = BUILTIN_LEXICON, vocabulary: GanzaVocabulary = ganzaVocabulary) {
    for (const entry of entries) this.add(entry);
    this.addVocabulary(vocabulary);
  }

  add(entry: LexiconEntry): void {
    this.entries.push(entry);
    for (const surface of entry.surfaces ?? []) {
      const key = normalizeSurface(surface);
      if (!key) continue;
      const list = this.surfaceIndex.get(key) ?? [];
      list.push(entry);
      this.surfaceIndex.set(key, list);
      if (entry.kind === 'filler') this.fillerSet.add(key);
    }
    for (const root of entry.roots ?? []) {
      const key = normalizeSurface(root);
      const list = this.rootIndex.get(key) ?? [];
      list.push(entry);
      this.rootIndex.set(key, list);
      this.allRoots.add(key);
    }
  }

  /** Fold the configurable GANZA business vocabulary into the lexicon. */
  addVocabulary(vocabulary: GanzaVocabulary = ganzaVocabulary): void {
    for (const term of vocabulary.all()) {
      const groups: { language: NluLanguage; values: string[] }[] = [
        { language: 'rw', values: term.rw ?? [] },
        { language: 'en', values: term.en ?? [] },
        { language: 'fr', values: term.fr ?? [] },
      ];
      for (const { language, values } of groups) {
        if (values.length === 0) continue;
        this.add({
          id: `vocab_${term.id}_${language}`,
          language,
          kind: 'noun',
          weight: 1,
          surfaces: values,
          concepts: term.concepts,
        });
      }
    }
  }

  extend(entries: LexiconEntry[]): number {
    let added = 0;
    for (const entry of entries ?? []) {
      if (!entry?.id || !Array.isArray(entry.surfaces) || !Array.isArray(entry.concepts)) continue;
      this.add(entry);
      added++;
    }
    return added;
  }

  lookupSurface(surface: string): LexiconEntry[] {
    return this.surfaceIndex.get(normalizeSurface(surface)) ?? [];
  }

  lookupRoot(root: string): LexiconEntry[] {
    return this.rootIndex.get(normalizeSurface(root)) ?? [];
  }

  /**
   * Candidate surfaces for typo-tolerant matching: same first letter, length ±1.
   * Kept small on purpose — fuzzy matching must never invent meaning.
   */
  fuzzySurfaceCandidates(token: string): string[] {
    if (!token || token.length < 5) return [];
    const out: string[] = [];
    for (const surface of this.surfaceIndex.keys()) {
      if (surface.includes(' ')) continue;
      if (Math.abs(surface.length - token.length) > 1) continue;
      if (surface[0] !== token[0]) continue;
      out.push(surface);
    }
    return out;
  }

  roots(): string[] {
    return [...this.allRoots];
  }

  isFiller(surface: string): boolean {
    return this.fillerSet.has(normalizeSurface(surface));
  }

  all(): LexiconEntry[] {
    return [...this.entries];
  }

  size(): number {
    return this.entries.length;
  }

  conceptCount(): number {
    return new Set(this.entries.flatMap(e => e.concepts)).size;
  }

  /** Longest multi-word surface (in tokens) — used to match phrases like "bika muri stock". */
  maxPhraseLength(): number {
    let max = 1;
    for (const key of this.surfaceIndex.keys()) {
      const parts = key.split(' ').length;
      if (parts > max) max = parts;
    }
    return Math.min(max, 4);
  }
}

/** Shared lexicon instance (vocabulary terms included). */
export const ganzaLexicon = new SemanticLexicon();
