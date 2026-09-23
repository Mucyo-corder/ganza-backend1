/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GANZA Kinyarwanda-Native NLU — Intent catalogue
 *
 * Intents are defined semantically:
 *   required: AND over groups / OR inside a group → the meaning must be present
 *   optional: extra concepts that raise confidence
 *   forbidden: concepts that rule the intent out ("bara agaciro" is NOT counting)
 *   topicOnly: noun-only queries ("stock") that still map to an intent
 *
 * No English keyword list is consulted: "Fungura camera", "Fungurira camera",
 * "Jya kuri camera", "Ndashaka gufata ifoto" and "Mfasha gufata ifoto" all satisfy
 * OPEN_CAMERA because they express the same meaning.
 */

import type { ConceptId, IntentId } from './types.js';

export interface IntentRule {
  id: IntentId;
  description: string;
  /** AND over groups, OR inside each group. */
  required?: ConceptId[][];
  /** Optional concept weights (added to the score when present). */
  optional?: Record<ConceptId, number>;
  /** Bonus when all concepts of a group co-occur (e.g. "bika" + "stock"). */
  boosts?: { when: ConceptId[]; weight: number; label: string }[];
  /** Strong negative signal — intent is rejected when any of these is present. */
  forbidden?: ConceptId[];
  /** Topic-only fallback (noun phrases without a verb), e.g. "stock y'imbaho". */
  topicOnly?: { concepts: ConceptId[][]; confidence: number };
  /**
   * Alternative meanings when the full rule did not match — natural short forms.
   * Each fallback is AND over its groups (OR inside a group), exactly like `required`,
   * but scored as a topic-only match so it can never outrank a full semantic match.
   *
   * This is how the agent understands bare nouns and bare verbs the way Rwandan
   * traders speak them ("kamera", "imbaho", "reba", "ongera", "umukiriya") without
   * a keyword table: the meaning still comes from concepts.
   */
  topicFallbacks?: { concepts: ConceptId[][]; confidence: number; label: string; forbidden?: ConceptId[] }[];
  /** Tie-breaker: higher wins; also expresses specificity order. */
  priority: number;
  /** Informational intents never create a device task. */
  informational?: boolean;
}

export const INTENT_RULES: IntentRule[] = [
  {
    id: 'SCAN_WOOD',
    description: 'Take a photo of wood so the agent can see/detect the boards (wood + capture).',
    required: [['capture', 'scan'], ['wood']],
    optional: { ref_group: 0.3, quantity: 0.2, species: 0.4, photo: 0.3 },
    topicOnly: { concepts: [['wood'], ['photo', 'camera']], confidence: 0.5 },
    // "imbaho" on its own: GANZA's default first step for a wood mention is to look
    // at the boards (scan), because count/value/save all start with a photo.
    topicFallbacks: [
      { concepts: [['wood', 'log']], confidence: 0.5, label: 'bare wood noun (default first step: scan the boards)', forbidden: ['value', 'price', 'money', 'sell', 'buy'] },
      { concepts: [['capture']], confidence: 0.6, label: 'bare capture verb ("fata")' },
    ],
    priority: 60,
  },
  {
    id: 'OPEN_CAMERA',
    description: 'Open the camera / take a picture — "fungura camera", "jya kuri camera", "ndashaka gufata ifoto".',
    required: [['open', 'goto', 'capture'], ['camera', 'photo', 'screen_camera']],
    optional: { want: 0.3, help: 0.2, open: 0.3 },
    forbidden: ['wood'],
    topicFallbacks: [
      { concepts: [['camera', 'photo', 'screen_camera']], confidence: 0.7, label: 'bare camera/photo noun ("kamera", "ifoto", "picha")' },
      { concepts: [['open', 'goto']], confidence: 0.55, label: 'bare open/navigate verb ("fungura", "jya") — camera is GANZA\'s default device' },
    ],
    priority: 50,
  },
  {
    id: 'CALCULATE_VALUE',
    description: 'Compute how much the wood is worth (count/value, price questions).',
    required: [['count', 'calculate', 'ask_amount', 'ask'], ['value', 'price', 'money', 'total', 'calculate']],
    optional: { wood: 0.5, ref_group: 0.4, ref_of_them: 0.6, quantity: 0.5, species: 0.3, per_unit: 0.2 },
    topicFallbacks: [
      { concepts: [['value', 'price', 'money', 'total']], confidence: 0.68, label: 'bare value/price noun ("agaciro", "igiciro")' },
      { concepts: [['ask_amount']], confidence: 0.55, label: 'bare "how much/how many" question' },
    ],
    priority: 55,
  },
  {
    id: 'SET_PRICE',
    description: 'Change or set the price of wood/stock.',
    required: [['change', 'add'], ['price']],
    optional: { wood: 0.4, species: 0.3, money: 0.4, quantity: 0.3, per_unit: 0.3 },
    priority: 48,
  },
  {
    id: 'RECORD_SALE',
    description: 'Record a sale of boards.',
    required: [['sell']],
    optional: { wood: 0.6, quantity: 0.7, customer: 0.5, species: 0.4, money: 0.4, total: 0.3, per_unit: 0.3, ref_group: 0.3 },
    priority: 47,
  },
  {
    id: 'RECORD_PURCHASE',
    description: 'Record a purchase of boards.',
    required: [['buy']],
    optional: { wood: 0.6, quantity: 0.7, supplier: 0.5, species: 0.4, money: 0.4, total: 0.3, per_unit: 0.3 },
    priority: 47,
  },
  {
    id: 'RECORD_PAYMENT',
    description: 'Record a customer payment / settle a debt.',
    required: [['pay']],
    optional: { money: 0.5, customer: 0.5, debt: 0.4, quantity: 0.2 },
    priority: 47,
  },
  {
    id: 'LOW_STOCK_CHECK',
    description: 'Check what is running low or finished.',
    required: [['low_stock', 'out_of_stock']],
    optional: { stock: 0.6, wood: 0.5, species: 0.3 },
    priority: 46,
  },
  {
    id: 'RECORD_EXPENSE',
    description: 'Record a business expense.',
    required: [['expense']],
    optional: { money: 0.5, dateRange: 0.3, profit: 0.2 },
    priority: 45,
  },
  {
    id: 'SAVE_TO_STOCK',
    description: 'Save the counted boards into stock ("bika", "bika muri stock", "shyira mu bubiko").',
    required: [['save']],
    optional: { stock: 1, wood: 0.5, quantity: 0.6, ref_group: 0.5, ref_of_them: 0.5, species: 0.3 },
    priority: 45,
  },
  {
    id: 'ADJUST_STOCK',
    description: 'Add or change a stock quantity ("ongeraho imbaho 5", "hindura umubare").',
    required: [['add', 'change'], ['quantity', 'stock', 'wood']],
    optional: { species: 0.4, ref_group: 0.3, location: 0.2 },
    // bare "ongera" (add) → increase the stock quantity.
    topicFallbacks: [{ concepts: [['add']], confidence: 0.55, label: 'bare add verb ("ongera", "ongeraho")' }],
    priority: 44,
  },
  {
    id: 'SHOW_REPORT',
    description: 'Generate or show a business report.',
    required: [['report']],
    optional: { dateRange: 0.4, sell: 0.3, pay: 0.3, expense: 0.3, stock: 0.3, show: 0.3 },
    topicOnly: { concepts: [['report']], confidence: 0.6 },
    priority: 44,
  },
  {
    id: 'SHOW_CUSTOMER_DEBT',
    description: 'Show what customers owe.',
    required: [['debt'], ['customer', 'ask', 'show']],
    optional: { money: 0.4, dateRange: 0.2 },
    // bare "umukiriya" / "abakiriya" → what customers owe.
    topicFallbacks: [{ concepts: [['customer']], confidence: 0.55, label: 'bare customer noun ("umukiriya", "abakiriya")' }],
    priority: 43,
  },
  {
    id: 'MEASURE_WOOD',
    description: 'Measure boards: length, width, thickness, volume.',
    required: [['measure', 'length', 'width', 'thickness', 'volume']],
    optional: { wood: 0.5, ref_group: 0.4, ref_item: 0.3, ask_amount: 0.3 },
    priority: 41,
  },
  {
    id: 'COUNT_WOOD',
    description: 'Count the boards ("bara", "bara imbaho", "uzibarire").',
    required: [['count']],
    optional: { wood: 1, quantity: 0.6, ref_group: 0.6, ref_of_them: 0.6, filter: 0.3, species: 0.5 },
    forbidden: ['value', 'price', 'money', 'total', 'ask_amount'],
    // "umubare" / "ingano" (the number, the quantity) → show the count.
    topicFallbacks: [{ concepts: [['quantity']], confidence: 0.55, label: 'bare number/quantity noun ("umubare", "ingano")' }],
    priority: 40,
  },
  {
    id: 'SEARCH_ITEM',
    description: 'Search for boards / a species in stock.',
    required: [['search']],
    optional: { wood: 0.6, species: 0.9, quantity: 0.4, type: 0.4, filter: 0.3 },
    topicOnly: { concepts: [['species']], confidence: 0.5 },
    priority: 38,
  },
  {
    id: 'EDIT_ENTITY',
    description: 'Change something previously entered ("hindura", "kosora").',
    required: [['change']],
    optional: { ref_group: 0.5, ref_item: 0.5, quantity: 0.4, customer: 0.3, wood: 0.3 },
    forbidden: ['price', 'stock'],
    priority: 36,
  },
  {
    id: 'SHOW_INVENTORY',
    description: 'Show what is in stock / the inventory list.',
    required: [['show', 'ask'], ['stock', 'screen_inventory', 'wood', 'product']],
    optional: { filter: 0.4, species: 0.3, all: 0.2, quantity: 0.2 },
    topicOnly: { concepts: [['stock', 'screen_inventory']], confidence: 0.55 },
    // bare "reba" / "erekana" (show) → show me the stock.
    topicFallbacks: [{ concepts: [['show']], confidence: 0.55, label: 'bare show verb ("reba", "erekana")' }],
    priority: 35,
  },
  {
    id: 'SHOW_LAST_RESULT',
    description: 'Show the previous result again ("erekana izo", "reba iyi").',
    required: [['show'], ['ref_group', 'ref_item', 'ref_of_them']],
    optional: { wood: 0.3 },
    priority: 34,
  },
  {
    id: 'CONTINUE_TASK',
    description: 'Continue with the current task ("komeza").',
    required: [['continue']],
    optional: { ref_group: 0.2 },
    priority: 33,
  },
  {
    id: 'REPEAT_LAST',
    description: 'Repeat what was just done ("subiramo", "ongera uvuge").',
    required: [['repeat']],
    optional: { ref_group: 0.2 },
    priority: 33,
  },
  {
    id: 'ASK_HELP',
    description: 'Ask what the agent can do.',
    required: [['help']],
    optional: { ask: 0.3, want: 0.2 },
    // bare question words ("ni iki?", "iki cyo?") → the user is asking the agent what it can do.
    topicFallbacks: [{ concepts: [['ask']], confidence: 0.45, label: 'bare question ("ni iki?", "iki cyo?")' }],
    priority: 32,
  },
  {
    id: 'GREETING',
    description: 'Greeting / courtesy.',
    required: [['greeting']],
    optional: { thanks: 0.3 },
    informational: true,
    priority: 31,
  },
  {
    id: 'CANCEL_TASK',
    description: 'Cancel / stop ("reka", "hagarara").',
    required: [['cancel']],
    priority: 37,
  },
  {
    id: 'CONFIRM_ACTION',
    description: 'Confirm the pending action ("emeza", "yego").',
    required: [['confirm']],
    priority: 37,
  },
  {
    id: 'OPEN_SCREEN',
    description: 'Navigate to another screen ("jya kuri raporo", "fungura ububiko").',
    required: [['goto', 'open'], ['screen']],
    optional: { want: 0.2, show: 0.2 },
    forbidden: ['camera', 'photo'],
    priority: 30,
  },
];

export const INTENT_IDS: IntentId[] = [...INTENT_RULES.map(r => r.id), 'CORRECT_ENTITY', 'UNKNOWN'];

export function getIntentRule(intent: IntentId): IntentRule | undefined {
  return INTENT_RULES.find(r => r.id === intent);
}

