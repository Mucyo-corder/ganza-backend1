/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GANZA Kinyarwanda-Native NLU — GANZA business vocabulary (configurable)
 *
 * Every term maps *surfaces* in Kinyarwanda / English / French to language-neutral
 * semantic concepts. This is how mixed Kinyarwanda/English speech stays understandable
 * without translating the sentence: "fata photo y'izi mbaho" and
 * "fata ifoto y'izi mbaho" hit exactly the same concepts.
 *
 * Expansion paths (no code changes required):
 *  1. `ganzaVocabulary.extend([...])` at runtime
 *  2. `POST /api/agent/nlu/vocabulary`
 *  3. env `GANZA_NLU_VOCAB_JSON` — JSON array of {id, rw, en, fr, concepts}
 */

import type { ConceptId, NluLanguage, NluVocabularySnapshot } from './types.js';

export interface VocabularyTerm {
  /** Stable id, e.g. "imbaho". */
  id: string;
  /** Kinyarwanda surface forms (natural, everyday spelling). */
  rw: string[];
  en?: string[];
  fr?: string[];
  /** Language-neutral concepts this term contributes. */
  concepts: ConceptId[];
  category?: 'wood' | 'inventory' | 'measure' | 'finance' | 'customer' | 'report' | 'device' | 'action' | 'other';
  /** Canonical value to use when this term is extracted as a species entity. */
  speciesValue?: string;
}

export interface GanzaVocabularyConfig {
  version: string;
  terms: VocabularyTerm[];
}

const WOOD_SPECIES: VocabularyTerm[] = [
  { id: 'species_eucalyptus', rw: ['inturusu', 'eucalyptus', 'kalitasi'], en: ['eucalyptus'], fr: ['eucalyptus'], concepts: ['species'], category: 'wood', speciesValue: 'Eucalyptus' },
  { id: 'species_pine', rw: ['pini', 'pinusi', 'pine'], en: ['pine'], fr: ['pin'], concepts: ['species'], category: 'wood', speciesValue: 'Pine' },
  { id: 'species_teak', rw: ['tiki', 'teak'], en: ['teak'], fr: ['teck'], concepts: ['species'], category: 'wood', speciesValue: 'Teak' },
  { id: 'species_cypress', rw: ['icyipure', 'sipurese', 'sipure'], en: ['cypress'], fr: ['cypres'], concepts: ['species'], category: 'wood', speciesValue: 'Cypress' },
  { id: 'species_muvumu', rw: ['umuvumu', 'muvumu'], en: ['ficus', 'muvumu'], concepts: ['species'], category: 'wood', speciesValue: 'Muvumu' },
  { id: 'species_jacaranda', rw: ['jacaranda', 'umujakaranda'], en: ['jacaranda'], concepts: ['species'], category: 'wood', speciesValue: 'Jacaranda' },
  { id: 'species_grevillea', rw: ['gureviliya', 'grevillea'], en: ['grevillea'], concepts: ['species'], category: 'wood', speciesValue: 'Grevillea' },
  { id: 'species_mahogany', rw: ['mahogany', 'umuhogo'], en: ['mahogany'], concepts: ['species'], category: 'wood', speciesValue: 'Mahogany' },
];

/** Core GANZA business vocabulary — the words Rwandan timber traders actually use. */
export const GANZA_VOCABULARY: GanzaVocabularyConfig = {
  version: '1.1.0',
  terms: [
    // ── Wood & stock ────────────────────────────────────────────────────────
    { id: 'imbaho', rw: ['imbaho', 'urubaho', 'mbaho', 'imbau', 'embaho'], en: ['boards', 'board', 'timber', 'lumber', 'planks'], fr: ['planches', 'planche', 'bois'], concepts: ['wood', 'stock_topic'], category: 'wood' },
    { id: 'ibiti', rw: ['ibiti', 'igiti', 'ibicuruzwa'], en: ['logs', 'log'], fr: ['grumes', 'arbre'], concepts: ['wood', 'log', 'stock_topic'], category: 'wood' },
    { id: 'stock', rw: ['stock', 'sitooki', 'ibiri mu bubiko'], en: ['stock', 'inventory'], fr: ['stock', 'inventaire'], concepts: ['stock'], category: 'inventory' },
    { id: 'ububiko', rw: ['ububiko', 'bubiko', 'mu bubiko', 'sitoo'], en: ['warehouse', 'store', 'storage'], fr: ['depot', 'entrepot'], concepts: ['stock', 'location'], category: 'inventory' },
    { id: 'ibicuruzwa', rw: ['ibicuruzwa', 'igicuruzwa'], en: ['goods', 'products', 'items'], fr: ['marchandises', 'produits'], concepts: ['product', 'stock_topic'], category: 'inventory' },
    { id: 'umubare', rw: ['umubare', 'ingano'], en: ['quantity', 'count', 'number'], fr: ['quantite', 'nombre'], concepts: ['quantity'], category: 'measure' },
    { id: 'ingano', rw: ['ingano', 'ubunini'], en: ['size'], fr: ['taille'], concepts: ['quantity'], category: 'measure' },
    // ── Measurements ───────────────────────────────────────────────────────
    { id: 'ibipimo', rw: ['ibipimo', 'gupima', 'pima', 'ipimo'], en: ['measurements', 'measure'], fr: ['mesures', 'mesurer'], concepts: ['measure'], category: 'measure' },
    { id: 'uburebure', rw: ['uburebure', 'burebure'], en: ['length', 'long'], fr: ['longueur'], concepts: ['measure', 'length'], category: 'measure' },
    { id: 'ubugari', rw: ['ubugari', 'bugari'], en: ['width', 'wide'], fr: ['largeur'], concepts: ['measure', 'width'], category: 'measure' },
    { id: 'umubyimba', rw: ['umubyimba', 'mubyimba'], en: ['thickness', 'thick'], fr: ['epaisseur'], concepts: ['measure', 'thickness'], category: 'measure' },
    { id: 'volume', rw: ['volume', 'ubunini'], en: ['volume', 'cubic'], fr: ['volume'], concepts: ['volume', 'measure'], category: 'measure' },
    { id: 'metero', rw: ['metero', 'metre', 'mita'], en: ['meter', 'metre'], fr: ['metre'], concepts: ['unit_length'], category: 'measure' },
    { id: 'santimetero', rw: ['santimetero', 'sentimetero'], en: ['centimeter'], fr: ['centimetre'], concepts: ['unit_length'], category: 'measure' },
    // ── Money ──────────────────────────────────────────────────────────────
    { id: 'igiciro', rw: ['igiciro', 'giciro', 'ibiciro'], en: ['price', 'prices', 'cost'], fr: ['prix'], concepts: ['price'], category: 'finance' },
    { id: 'agaciro', rw: ['agaciro', 'gaciro', 'kagaciro'], en: ['value', 'worth', 'total'], fr: ['valeur'], concepts: ['value'], category: 'finance' },
    { id: 'amafaranga', rw: ['amafaranga', 'mafaranga', 'ifaranga'], en: ['money', 'francs', 'cash', 'rwf', 'frw'], fr: ['argent', 'francs'], concepts: ['money'], category: 'finance' },
    { id: 'umusoro', rw: ['umusoro', 'misoro'], en: ['tax', 'vat'], fr: ['taxe', 'tva'], concepts: ['tax'], category: 'finance' },
    { id: 'inyungu', rw: ['inyungu'], en: ['profit', 'margin'], fr: ['benefice', 'marge'], concepts: ['profit'], category: 'finance' },
    // ── Trade ──────────────────────────────────────────────────────────────
    { id: 'kugurisha', rw: ['kugurisha', 'gurisha', 'nagurishije', 'gurishije', 'kugurisa', 'igurisha'], en: ['sell', 'sale', 'sales', 'sold'], fr: ['vendre', 'vente'], concepts: ['sell'], category: 'action' },
    { id: 'kugura', rw: ['kugura', 'gura', 'naguze', 'kugula'], en: ['buy', 'purchase', 'bought'], fr: ['acheter', 'achat'], concepts: ['buy'], category: 'action' },
    { id: 'umukiriya', rw: ['umukiriya', 'abakiriya', 'mukiriya', 'umuguzi', 'abaguzi'], en: ['customer', 'customers', 'client'], fr: ['client', 'clients'], concepts: ['customer'], category: 'customer' },
    { id: 'umugemuzi', rw: ['umugemuzi', 'abagemuzi', 'umucuruzi', 'koperative'], en: ['supplier', 'suppliers'], fr: ['fournisseur'], concepts: ['supplier'], category: 'customer' },
    { id: 'kwishyura', rw: ['kwishyura', 'ishyura', 'wishyura', 'yishyuye', 'nishyuye', 'ubwishyu'], en: ['pay', 'payment', 'paid'], fr: ['payer', 'paiement'], concepts: ['pay'], category: 'finance' },
    { id: 'ideni', rw: ['ideni', 'umwenda', 'imyenda', 'ibirarane'], en: ['debt', 'owes', 'credit'], fr: ['dette', 'creance'], concepts: ['debt'], category: 'finance' },
    { id: 'ikiguzi', rw: ['ikiguzi', 'ibyakoreshejwe', 'nakoresheje'], en: ['expense', 'expenses', 'spent'], fr: ['depense', 'depenses'], concepts: ['expense'], category: 'finance' },
    // ── Reports & devices ──────────────────────────────────────────────────
    { id: 'raporo', rw: ['raporo', 'laporo', 'incamake', 'ibisobanuro'], en: ['report', 'reports', 'summary'], fr: ['rapport', 'rapports'], concepts: ['report'], category: 'report' },
    { id: 'ifoto', rw: ['ifoto', 'amafoto', 'foto', 'ifotto', 'picha'], en: ['photo', 'picture', 'image'], fr: ['photo', 'image'], concepts: ['photo'], category: 'device' },
    { id: 'kamera', rw: ['kamera', 'kamara'], en: ['camera'], fr: ['camera'], concepts: ['camera'], category: 'device' },
    { id: 'tefone', rw: ['telefone', 'terefone', 'simu'], en: ['phone', 'device'], fr: ['telephone'], concepts: ['device'], category: 'device' },
    // ── Stock status words used as filters ─────────────────────────────────
    { id: 'nke', rw: ['nke', 'bike', 'hasigaye bike', 'zisigaye nke', 'nkeya'], en: ['low', 'few', 'short'], fr: ['faible', 'peu'], concepts: ['low_stock'], category: 'inventory' },
    { id: 'byarashize', rw: ['byarashize', 'zarashize', 'byashize'], en: ['out of stock', 'finished', 'empty'], fr: ['rupture'], concepts: ['out_of_stock', 'low_stock'], category: 'inventory' },
    { id: 'byinshi', rw: ['byinshi', 'nyinshi', 'nyishi'], en: ['many', 'a lot'], fr: ['beaucoup'], concepts: ['many'], category: 'measure' },
    ...WOOD_SPECIES,
  ],
};

/** Normalize any surface for matching (lowercase, straight apostrophes, single spaces). */
export function normalizeSurface(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[`´’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
/**
 * Configurable GANZA vocabulary. Add terms at runtime — the lexicon, language
 * detector and entity extractor all read from this single source.
 */
export class GanzaVocabulary {
  private terms: Map<string, VocabularyTerm> = new Map();
  private version: string;

  constructor(config: GanzaVocabularyConfig = GANZA_VOCABULARY) {
    this.version = config.version;
    for (const term of config.terms) this.addTerm(term);
  }

  /** Add or merge a term (merging never loses existing surfaces/concepts). */
  addTerm(term: VocabularyTerm): void {
    const existing = this.terms.get(term.id);
    if (existing) {
      existing.rw = [...new Set([...existing.rw, ...(term.rw ?? [])])];
      existing.en = [...new Set([...(existing.en ?? []), ...(term.en ?? [])])];
      existing.fr = [...new Set([...(existing.fr ?? []), ...(term.fr ?? [])])];
      existing.concepts = [...new Set([...existing.concepts, ...(term.concepts ?? [])])];
      if (term.speciesValue) existing.speciesValue = term.speciesValue;
      return;
    }
    this.terms.set(term.id, {
      ...term,
      rw: [...new Set(term.rw ?? [])],
      en: [...new Set(term.en ?? [])],
      fr: [...new Set(term.fr ?? [])],
      concepts: [...new Set(term.concepts ?? [])],
    });
  }

  /** Extend the vocabulary from configuration. Returns the number of accepted terms. */
  extend(terms: VocabularyTerm[]): number {
    let added = 0;
    for (const term of terms ?? []) {
      if (!term?.id || !Array.isArray(term.rw) || !Array.isArray(term.concepts)) continue;
      this.addTerm(term);
      added++;
    }
    return added;
  }

  get(id: string): VocabularyTerm | undefined {
    return this.terms.get(id);
  }

  all(): VocabularyTerm[] {
    return [...this.terms.values()];
  }

  size(): number {
    return this.terms.size;
  }

  surfaces(language: NluLanguage): string[] {
    const out = new Set<string>();
    for (const term of this.terms.values()) {
      const list = language === 'rw' ? term.rw : language === 'en' ? term.en : term.fr;
      (list ?? []).forEach(s => out.add(normalizeSurface(s)));
    }
    return [...out];
  }

  /** Canonical species values known to the business vocabulary. */
  species(): string[] {
    return [...new Set(this.all().map(t => t.speciesValue).filter((s): s is string => Boolean(s)))];
  }

  snapshot(): NluVocabularySnapshot {
    return {
      version: this.version,
      concepts: new Set(this.all().flatMap(t => t.concepts)).size,
      lexiconEntries: this.terms.size,
      intents: [],
      businessTerms: this.all().map(t => ({
        term: t.id,
        concepts: t.concepts,
        languages: [
          ...(t.rw?.length ? (['rw'] as NluLanguage[]) : []),
          ...(t.en?.length ? (['en'] as NluLanguage[]) : []),
          ...(t.fr?.length ? (['fr'] as NluLanguage[]) : []),
        ],
      })),
      species: this.species(),
    };
  }
}

/** Shared vocabulary instance used by the whole NLU stack. */
export const ganzaVocabulary = new GanzaVocabulary();

/**
 * Load extra vocabulary from configuration (no code change required):
 * GANZA_NLU_VOCAB_JSON='[{"id":"amakara","rw":["amakara"],"concepts":["product"]}]'
 */
export function loadVocabularyFromEnv(env: Record<string, string | undefined> = {}): number {
  const raw = env.GANZA_NLU_VOCAB_JSON ?? (typeof process !== 'undefined' ? process.env?.GANZA_NLU_VOCAB_JSON : undefined);
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw);
    const terms: VocabularyTerm[] = Array.isArray(parsed) ? parsed : parsed?.terms;
    if (!Array.isArray(terms)) return 0;
    return ganzaVocabulary.extend(terms);
  } catch {
    return 0;
  }
}



