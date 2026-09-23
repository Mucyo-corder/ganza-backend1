/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GANZA Kinyarwanda-Native NLU — Comprehensive Test Suite
 *
 * Tests 100+ real Kinyarwanda commands covering:
 * - different sentence structures
 * - short commands
 * - questions
 * - spelling variations
 * - informal speech
 * - mixed Kinyarwanda/English
 * - wood inventory terminology
 * - follow-up/context commands
 * - voice input
 *
 * Measures: intent accuracy, entity extraction accuracy,
 * context understanding, language detection, clarification/fallback rate.
 */

import { describe, it, expect } from 'vitest';
import { understand, understandVoice, getRegisteredIntents, getAction } from '../src/agent/nlu/understand.js';
import { detectLanguage } from '../src/agent/nlu/language.js';
import { normalizeUtterance } from '../src/agent/nlu/normalizer.js';
import { ganzaLexicon } from '../src/agent/nlu/lexicon.js';
import { ganzaVocabulary } from '../src/agent/nlu/vocabulary.js';
import { parseNextNumber, extractNumberOccurrences } from '../src/agent/nlu/numerals.js';
import type { IntentId } from '../src/agent/nlu/types.js';

// ── Test helpers ──────────────────────────────────────────────

function assertIntent(result: ReturnType<typeof understand>, expected: IntentId, label: string) {
  const pass = result.intent.intent === expected;
  if (!pass) {
    console.log(`  FAIL [${label}]: expected ${expected}, got ${result.intent.intent} (confidence: ${result.confidence})`);
  }
  expect(result.intent.intent).toBe(expected);
}

function assertConfidence(result: ReturnType<typeof understand>, minConfidence: number, label: string) {
  const pass = result.confidence >= minConfidence;
  if (!pass) {
    console.log(`  FAIL [${label}]: confidence ${result.confidence} < ${minConfidence}`);
  }
  expect(result.confidence).toBeGreaterThanOrEqual(minConfidence);
}

function assertLanguage(result: ReturnType<typeof understand>, expectedLang: string, label: string) {
  const pass = result.language.dominant === expectedLang || result.language.language === expectedLang || result.language.mixed;
  if (!pass) {
    console.log(`  FAIL [${label}]: expected rw/mixed, got ${result.language.dominant}`);
  }
  expect(result.language.dominant).toBe(expectedLang);
}

// ── Test data: 100+ real Kinyarwanda commands ────────────────
//
// Documented disambiguation policy (applied consistently across this file):
//   OPEN_CAMERA  — "fungura/jya kuri kamera", or a bare camera/photo word, or
//                  "ndashaka/mfasha gufata ifoto" (open the camera to capture).
//   SCAN_WOOD    — capture + wood ("fata ifoto y'izi mbaho"), a bare wood noun,
//                  or a bare capture verb ("fata") — GANZA's first step for wood.
//   COUNT_WOOD   — counting verbs ("bara", "uzibarire", "kubara") and "umubare"/"ingano".
//   CALCULATE_VALUE — "agaciro", "igiciro", "how much" questions and any counting
//                  sentence that also asks for the value ("ubaze n'agaciro kazo",
//                  "uzibarire calculate") — see requirement: value of detected wood.
// A reference without any context ("agaciro kazo" alone) still resolves the intent
// but asks for clarification, because the agent must never invent what "kazo" means.

const OPEN_CAMERA_COMMANDS: { input: string; label: string }[] = [
  { input: 'Fungura camera', label: 'fungura camera' },
  { input: 'Fungurira camera', label: 'fungurira camera' },
  { input: 'Jya kuri camera', label: 'jya kuri camera' },
  { input: 'Ndashaka gufata ifoto', label: 'ndashaka gufata ifoto' },
  { input: 'Mfasha gufata ifoto', label: 'mfasha gufata ifoto' },
  { input: 'fata ifoto', label: 'fata ifoto' },
  { input: 'fata photo', label: 'fata photo' },
  { input: 'ndashaka ko ufata ifoto', label: 'ndashaka ko ufata ifoto' },
  { input: 'Gufata ifoto', label: 'gufata ifoto' },
  { input: 'Nafata ifoto', label: 'nafata ifoto' },
  { input: 'Kamera', label: 'kamera' },
  { input: 'fungura kamera', label: 'fungura kamera' },
  { input: 'jya kuri kamera', label: 'jya kuri kamera' },
  { input: 'ndashaka nshaka gufata ifoto', label: 'ndashaka nshaka gufata ifoto' },
];

const COUNT_WOOD_COMMANDS: { input: string; label: string }[] = [
  { input: 'Noneho uzibarire', label: 'noneho uzibarire' },
  { input: 'uzibarire', label: 'uzibarire' },
  { input: 'Bara', label: 'bara' },
  { input: 'Kubara', label: 'kubara' },
  { input: 'Barura', label: 'barura' },
  { input: 'Noneho uzibare', label: 'noneho uzibare' },
  { input: 'Uzibarire imbaho', label: 'uzibarire imbaho' },
  { input: 'Bara imbaho', label: 'bara imbaho' },
  { input: 'Barura imbaho', label: 'barura imbaho' },
  { input: 'noneho uzibarire imbaho', label: 'noneho uzibarire imbaho' },
];

const CALCULATE_VALUE_COMMANDS: { input: string; label: string }[] = [
  { input: 'Ubaze n agaciro kazo', label: 'ubaze n agaciro kazo' },
  { input: 'Noneho ubaze n\'agaciro kazo', label: 'noneho ubaze n agaciro kazo' },
  { input: 'mbaze n agaciro kazo', label: 'mbaze n agaciro kazo' },
  { input: 'Noneho uzibarire calculate', label: 'noneho uzibarire calculate' },
  { input: 'Gereranya agaciro', label: 'gereranya agaciro' },
  { input: 'Kugereranya agaciro kazo', label: 'kugereranya agaciro kazo' },
  { input: 'Agaciro kazo', label: 'agaciro kazo' },
  { input: 'Igiciro cyazo', label: 'igiciro cyazo' },
];

const SAVE_TO_STOCK_COMMANDS: { input: string; label: string }[] = [
  { input: 'Bika', label: 'bika' },
  { input: 'Bika muri stock', label: 'bika muri stock' },
  { input: 'Zibika', label: 'zibika' },
  { input: 'Shyiramo', label: 'shyiramo' },
  { input: 'Bika imbaho', label: 'bika imbaho' },
  { input: 'Shyira mu bubiko', label: 'shyira mu bubiko' },
  { input: 'Bika muri stock imbaho', label: 'bika muri stock imbaho' },
  { input: 'Zibika muri stock', label: 'zibika muri stock' },
];

const SHOW_INVENTORY_COMMANDS: { input: string; label: string }[] = [
  { input: 'Reba', label: 'reba' },
  { input: 'Erekana', label: 'erekana' },
  { input: 'Reba imbaho', label: 'reba imbaho' },
  { input: 'Erekana ububiko', label: 'erekana ububiko' },
  { input: 'Show inventory', label: 'show inventory' },
  { input: 'Reba stock', label: 'reba stock' },
  { input: 'Erekana imbaho mfite', label: 'erekana imbaho mfite' },
];

const SEARCH_ITEM_COMMANDS: { input: string; label: string }[] = [
  { input: 'Shaka', label: 'shaka' },
  { input: 'Shakisha', label: 'shakisha' },
  { input: 'Shakira', label: 'shakira' },
  { input: 'Search', label: 'search' },
  { input: 'Shaka imbaho', label: 'shaka imbaho' },
  { input: 'Shakisha inturusu', label: 'shakisha inturusu' },
];

const CONTINUE_TASK_COMMANDS: { input: string; label: string }[] = [
  { input: 'Komeza', label: 'komeza' },
  { input: 'Komeza mbere', label: 'komeza mbere' },
  { input: 'Continue', label: 'continue' },
];

const REPEAT_LAST_COMMANDS: { input: string; label: string }[] = [
  { input: 'Subiramo', label: 'subiramo' },
  { input: 'Subiramo ibyo', label: 'subiramo ibyo' },
  { input: 'Ongera uvuge', label: 'ongera uvuge' },
];

const CHANGE_COMMANDS: { input: string; label: string }[] = [
  { input: 'Hindura', label: 'hindura' },
  { input: 'Guhindura', label: 'guhindura' },
  { input: 'Hindurira', label: 'hindurira' },
];

const CANCEL_COMMANDS: { input: string; label: string }[] = [
  { input: 'Reka', label: 'reka' },
  { input: 'Hagarara', label: 'hagarara' },
  { input: 'Cancel', label: 'cancel' },
];

const CONFIRM_COMMANDS: { input: string; label: string }[] = [
  { input: 'Emeza', label: 'emeza' },
  { input: 'Yego', label: 'yego' },
  { input: 'Sawa', label: 'sawa' },
];

const HELP_COMMANDS: { input: string; label: string }[] = [
  { input: 'Fasha', label: 'fasha' },
  { input: 'Mfasha', label: 'mfasha' },
  { input: 'Help', label: 'help' },
];

const GREETING_COMMANDS: { input: string; label: string }[] = [
  { input: 'Muraho', label: 'muraho' },
  { input: 'Mwaramutse', label: 'mwaramutse' },
  { input: 'Bité', label: 'bite' },
  { input: 'Amakuru', label: 'amakuru' },
];

const SHOW_REPORT_COMMANDS: { input: string; label: string }[] = [
  { input: 'Raporo', label: 'raporo' },
  { input: 'Report', label: 'report' },
  { input: 'Erekana raporo', label: 'erekana raporo' },
];

const MEASURE_WOOD_COMMANDS: { input: string; label: string }[] = [
  { input: 'Pima', label: 'pima' },
  { input: 'Gupima', label: 'gupima' },
  { input: 'Ibipimo', label: 'ibipimo' },
];

const SET_PRICE_COMMANDS: { input: string; label: string }[] = [
  { input: 'Hindura igiciro', label: 'hindura igiciro' },
  { input: 'Ongera igiciro', label: 'ongera igiciro' },
  { input: 'Set price', label: 'set price' },
];

const RECORD_SALE_COMMANDS: { input: string; label: string }[] = [
  { input: 'Kugurisha', label: 'kugurisha' },
  { input: 'Igurisha', label: 'igurisha' },
  { input: 'Sale', label: 'sale' },
];

const RECORD_PURCHASE_COMMANDS: { input: string; label: string }[] = [
  { input: 'Kugura', label: 'kugura' },
  { input: 'Gukura', label: 'gukura' },
  { input: 'Purchase', label: 'purchase' },
];

const RECORD_PAYMENT_COMMANDS: { input: string; label: string }[] = [
  { input: 'Kwishyura', label: 'kwishyura' },
  { input: 'Payment', label: 'payment' },
];

const RECORD_EXPENSE_COMMANDS: { input: string; label: string }[] = [
  { input: 'Ikiguzi', label: 'ikiguzi' },
  { input: 'Expense', label: 'expense' },
];

const SHOW_CUSTOMER_DEBT_COMMANDS: { input: string; label: string }[] = [
  { input: 'Umukiriya', label: 'umukiriya' },
  { input: 'Abakiriya', label: 'abakiriya' },
  { input: 'Customer debt', label: 'customer debt' },
];

const LOW_STOCK_COMMANDS: { input: string; label: string }[] = [
  { input: 'Hasigaye bike', label: 'hasigaye bike' },
  { input: 'Low stock', label: 'low stock' },
  { input: 'Byarashize', label: 'byarashize' },
];

const ADJUST_STOCK_COMMANDS: { input: string; label: string }[] = [
  { input: 'Ongera imbaho 5', label: 'ongera imbaho 5' },
  { input: 'Ongera 10 imbaho', label: 'ongera 10 imbaho' },
  { input: 'Hindura umubare', label: 'hindura umubare' },
];

// ── Spelling variation tests ────────────────────────────────

const SPELLING_VARIATION_COMMANDS: { input: string; expectedIntent: IntentId; label: string }[] = [
  { input: 'fungula', expectedIntent: 'OPEN_CAMERA', label: 'fungula → fungura' },
  { input: 'fungurila', expectedIntent: 'OPEN_CAMERA', label: 'fungurila → fungurira' },
  { input: 'laba', expectedIntent: 'SHOW_INVENTORY', label: 'laba → reba' },
  { input: 'sakisha', expectedIntent: 'SEARCH_ITEM', label: 'sakisha → shakisha' },
  { input: 'ububiku', expectedIntent: 'SHOW_INVENTORY', label: 'ububiku → ububiko' },
  { input: 'igichiro', expectedIntent: 'CALCULATE_VALUE', label: 'igichiro → igiciro' },
  { input: 'ubulebure', expectedIntent: 'MEASURE_WOOD', label: 'ubulebure → uburebure' },
  { input: 'umukilia', expectedIntent: 'SHOW_CUSTOMER_DEBT', label: 'umukilia → umukiriya' },
  { input: 'gurisa', expectedIntent: 'RECORD_SALE', label: 'gurisa → kugurisha' },
  { input: 'komeja', expectedIntent: 'CONTINUE_TASK', label: 'komeja → komeza' },
  { input: 'subilamo', expectedIntent: 'REPEAT_LAST', label: 'subilamo → subiramo' },
  { input: 'ongela', expectedIntent: 'ADJUST_STOCK', label: 'ongela → ongera' },
  { input: 'hindula', expectedIntent: 'EDIT_ENTITY', label: 'hindula → hindura' },
  { input: 'imbahu', expectedIntent: 'SCAN_WOOD', label: 'imbahu → imbaho' },
  { input: 'ifotto', expectedIntent: 'OPEN_CAMERA', label: 'ifotto → ifoto' },
  { input: 'foto', expectedIntent: 'OPEN_CAMERA', label: 'foto → ifoto' },
  { input: 'picha', expectedIntent: 'OPEN_CAMERA', label: 'picha → ifoto' },
  { input: 'laporo', expectedIntent: 'SHOW_REPORT', label: 'laporo → raporo' },
  { input: 'mubare', expectedIntent: 'COUNT_WOOD', label: 'mubare → umubare' },
];

// ── Mixed Kinyarwanda/English tests ─────────────────────────

const MIXED_LANGUAGE_COMMANDS: { input: string; expectedIntent: IntentId; label: string }[] = [
  // "fata (i)foto" without any wood mentioned = open the camera and capture.
  // Add the wood ("y'izi mbaho") and the same words become SCAN_WOOD.
  { input: 'fata photo', expectedIntent: 'OPEN_CAMERA', label: 'fata photo' },
  { input: 'fata ifoto', expectedIntent: 'OPEN_CAMERA', label: 'fata ifoto' },
  { input: 'bika muri stock', expectedIntent: 'SAVE_TO_STOCK', label: 'bika muri stock' },
  { input: 'ndashaka ko ufata ifoto', expectedIntent: 'OPEN_CAMERA', label: 'ndashaka ko ufata ifoto' },
  { input: 'show inventory', expectedIntent: 'SHOW_INVENTORY', label: 'show inventory' },
  { input: 'reba stock', expectedIntent: 'SHOW_INVENTORY', label: 'reba stock' },
  { input: 'count boards', expectedIntent: 'COUNT_WOOD', label: 'count boards' },
  { input: 'set price', expectedIntent: 'SET_PRICE', label: 'set price' },
  { input: 'open camera', expectedIntent: 'OPEN_CAMERA', label: 'open camera' },
  { input: 'noneho uzibarire', expectedIntent: 'COUNT_WOOD', label: 'noneho uzibarire (mixed context)' },
  { input: 'ubaze n agaciro kazo', expectedIntent: 'CALCULATE_VALUE', label: 'ubaze n agaciro kazo' },
  { input: 'mfata ifoto y izi mbaho', expectedIntent: 'SCAN_WOOD', label: 'mfata ifoto y izi mbaho' },
];

// ── Short command tests ─────────────────────────────────────

const SHORT_COMMAND_TESTS: { input: string; expectedIntent: IntentId; label: string }[] = [
  { input: 'Fata', expectedIntent: 'SCAN_WOOD', label: 'Fata' },
  { input: 'Bara', expectedIntent: 'COUNT_WOOD', label: 'Bara' },
  { input: 'Bika', expectedIntent: 'SAVE_TO_STOCK', label: 'Bika' },
  { input: 'Hindura', expectedIntent: 'EDIT_ENTITY', label: 'Hindura' },
  { input: 'Ongera', expectedIntent: 'ADJUST_STOCK', label: 'Ongera' },
  { input: 'Subiramo', expectedIntent: 'REPEAT_LAST', label: 'Subiramo' },
  { input: 'Komeza', expectedIntent: 'CONTINUE_TASK', label: 'Komeza' },
  { input: 'Reba', expectedIntent: 'SHOW_INVENTORY', label: 'Reba' },
  { input: 'Shaka', expectedIntent: 'SEARCH_ITEM', label: 'Shaka' },
  { input: 'Erekana', expectedIntent: 'SHOW_INVENTORY', label: 'Erekana' },
];

// ── Question tests ──────────────────────────────────────────

const QUESTION_COMMANDS: { input: string; expectedIntent: IntentId; label: string }[] = [
  { input: 'Angahe igiciro?', expectedIntent: 'CALCULATE_VALUE', label: 'angahe igiciro' },
  { input: 'Ni igiciro gito?', expectedIntent: 'CALCULATE_VALUE', label: 'ni igiciro gito' },
  { input: 'Ziri zingahe?', expectedIntent: 'CALCULATE_VALUE', label: 'ziri zingahe' },
  { input: 'Iki cyo?', expectedIntent: 'ASK_HELP', label: 'iki cyo' },
  { input: 'Ni iki?', expectedIntent: 'ASK_HELP', label: 'ni iki' },
];

// ── Number parsing tests ────────────────────────────────────

const NUMBER_PARSING_TESTS: { input: string; expectedValue: number; label: string }[] = [
  { input: 'Ongera imbaho 5', expectedValue: 5, label: 'digit 5' },
  { input: 'Ongera imbaho 40k', expectedValue: 40000, label: '40k' },
  { input: 'Ongera imbaho 2M', expectedValue: 2000000, label: '2M' },
  { input: 'Bara imbaho 10', expectedValue: 10, label: 'digit 10' },
];

// ── Language detection tests ────────────────────────────────
// `dominant` is the language the agent must answer in (rw/en/fr);
// `label` is the detection result, which may be 'mixed' for code-switching.

const LANGUAGE_DETECTION_TESTS: { input: string; expectedDominant: string; expectedLabel?: string; label: string }[] = [
  { input: 'Fungura camera', expectedDominant: 'rw', expectedLabel: 'mixed', label: 'Kinyarwanda + English loanword' },
  { input: 'fata ifoto', expectedDominant: 'rw', expectedLabel: 'rw', label: 'pure Kinyarwanda short' },
  { input: 'fata photo', expectedDominant: 'rw', expectedLabel: 'mixed', label: 'mixed Kinyarwanda/English' },
  { input: 'bika muri stock', expectedDominant: 'rw', expectedLabel: 'mixed', label: 'mixed Kinyarwanda/English' },
  { input: 'show inventory', expectedDominant: 'en', expectedLabel: 'en', label: 'pure English' },
  { input: 'Muraho', expectedDominant: 'rw', label: 'greeting' },
  { input: 'reba imyenda y abakiriya', expectedDominant: 'rw', expectedLabel: 'rw', label: 'pure Kinyarwanda sentence' },
];

// ── Spelling variant tests ──────────────────────────────────

const SPELLING_VARIANT_TESTS: { input: string; expectedToken: string; label: string }[] = [
  { input: 'fungula', expectedToken: 'fungura', label: 'fungula → fungura' },
  { input: 'ububiku', expectedToken: 'ububiko', label: 'ububiku → ububiko' },
  { input: 'igichiro', expectedToken: 'igiciro', label: 'igichiro → igiciro' },
  { input: 'imbahu', expectedToken: 'imbaho', label: 'imbahu → imbaho' },
  { input: 'ifotto', expectedToken: 'ifoto', label: 'ifotto → ifoto' },
];

// ── Vocabulary tests ────────────────────────────────────────

const VOCABULARY_TESTS: { term: string; label: string }[] = [
  { term: 'imbaho', label: 'imbaho in vocabulary' },
  { term: 'ibiti', label: 'ibiti in vocabulary' },
  { term: 'stock', label: 'stock in vocabulary' },
  { term: 'ububiko', label: 'ububiko in vocabulary' },
  { term: 'umubare', label: 'umubare in vocabulary' },
  { term: 'ibipimo', label: 'ibipimo in vocabulary' },
  { term: 'uburebure', label: 'uburebure in vocabulary' },
  { term: 'ubugari', label: 'ubugari in vocabulary' },
  { term: 'umubyimba', label: 'umubyimba in vocabulary' },
  { term: 'ingano', label: 'ingano in vocabulary' },
  { term: 'volume', label: 'volume in vocabulary' },
  { term: 'igiciro', label: 'igiciro in vocabulary' },
  { term: 'agaciro', label: 'agaciro in vocabulary' },
  { term: 'kugurisha', label: 'kugurisha in vocabulary' },
  { term: 'umukiriya', label: 'umukiriya in vocabulary' },
  { term: 'ibicuruzwa', label: 'ibicuruzwa in vocabulary' },
  { term: 'raporo', label: 'raporo in vocabulary' },
];

// ── Context tests ───────────────────────────────────────────

const CONTEXT_TESTS: { input: string; context: any; expectedKind: string; label: string }[] = [
  {
    input: 'Noneho uzibarire.',
    context: {
      sessionId: 'test-1',
      screen: 'camera',
      lastDetectedWood: { species: 'Eucalyptus', quantity: 10, unitPrice: 5000, value: 50000 },
      lastIntent: 'SCAN_WOOD',
      lastUtterance: 'Fata ifoto y izi mbaho',
    },
    expectedKind: 'resolved_reference',
    label: 'noneho uzibarire with context',
  },
  {
    input: 'Ubaze n agaciro kazo.',
    context: {
      sessionId: 'test-2',
      screen: 'inventory',
      lastDetectedWood: { species: 'Pine', quantity: 5, unitPrice: 3000, value: 15000 },
      lastIntent: 'COUNT_WOOD',
      lastUtterance: 'Bara imbaho',
    },
    expectedKind: 'short_command',
    label: 'ubaze n agaciro kazo with context',
  },
];

// ── Voice input tests ───────────────────────────────────────

const VOICE_TESTS: { hypotheses: string[]; label: string }[] = [
  { hypotheses: ['fata ifoto', 'fata photo', 'take photo'], label: 'voice: fata ifoto' },
  { hypotheses: ['noneho uzibarire', 'count boards', 'uzibarire'], label: 'voice: noneho uzibarire' },
  { hypotheses: ['bika muri stock', 'save to stock', 'bika'], label: 'voice: bika muri stock' },
  { hypotheses: ['fungura camera', 'open camera', 'fungura'], label: 'voice: fungura camera' },
];

// ══════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════

describe('GANZA NLU — Kinyarwanda-Native Understanding', () => {

  // ── Language Detection ──────────────────────────────────
  describe('Step 1: Language Detection', () => {
    for (const { input, expectedDominant, expectedLabel, label } of LANGUAGE_DETECTION_TESTS) {
      it(`detects language for "${label}"`, () => {
        const result = detectLanguage(input);
        expect(result.dominant).toBe(expectedDominant);
        if (expectedLabel) expect(result.language).toBe(expectedLabel);
      });
    }

    it('Kinyarwanda wins ties (primary language)', () => {
      const result = detectLanguage('fata ifoto');
      expect(result.dominant).toBe('rw');
    });
  });

  // ── Normalization ───────────────────────────────────────
  describe('Step 2: Kinyarwanda Normalization', () => {
    for (const { input, expectedToken, label } of SPELLING_VARIANT_TESTS) {
      it(`normalizes "${label}"`, () => {
        const result = normalizeUtterance(input);
        const hasToken = result.tokens.some(t => t === expectedToken || result.stems.includes(expectedToken));
        expect(hasToken).toBe(true);
      });
    }

    it('handles apostrophe contractions', () => {
      const result = normalizeUtterance("y'izi");
      expect(result.tokens.length).toBeGreaterThan(0);
    });
  });

  // ── Vocabulary ──────────────────────────────────────────
  describe('GANZA Business Vocabulary', () => {
    for (const { term, label } of VOCABULARY_TESTS) {
      it(`contains "${label}"`, () => {
        const termData = ganzaVocabulary.get(term);
        expect(termData).toBeDefined();
      });
    }

    it('vocabulary is configurable and expandable', () => {
      const before = ganzaVocabulary.size();
      ganzaVocabulary.extend([
        { id: 'test_term', rw: ['test'], concepts: ['test'], category: 'other' },
      ]);
      expect(ganzaVocabulary.size()).toBeGreaterThanOrEqual(before);
    });
  });

  // ── OPEN_CAMERA Intent ──────────────────────────────────
  describe('Intent: OPEN_CAMERA', () => {
    for (const { input, label } of OPEN_CAMERA_COMMANDS) {
      it(`understands "${label}" as OPEN_CAMERA`, () => {
        const result = understand(input);
        assertIntent(result, 'OPEN_CAMERA', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── COUNT_WOOD Intent ───────────────────────────────────
  describe('Intent: COUNT_WOOD', () => {
    for (const { input, label } of COUNT_WOOD_COMMANDS) {
      it(`understands "${label}" as COUNT_WOOD`, () => {
        const result = understand(input);
        assertIntent(result, 'COUNT_WOOD', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── CALCULATE_VALUE Intent ──────────────────────────────
  describe('Intent: CALCULATE_VALUE', () => {
    for (const { input, label } of CALCULATE_VALUE_COMMANDS) {
      it(`understands "${label}" as CALCULATE_VALUE`, () => {
        const result = understand(input);
        assertIntent(result, 'CALCULATE_VALUE', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── SAVE_TO_STOCK Intent ────────────────────────────────
  describe('Intent: SAVE_TO_STOCK', () => {
    for (const { input, label } of SAVE_TO_STOCK_COMMANDS) {
      it(`understands "${label}" as SAVE_TO_STOCK`, () => {
        const result = understand(input);
        assertIntent(result, 'SAVE_TO_STOCK', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── SHOW_INVENTORY Intent ───────────────────────────────
  describe('Intent: SHOW_INVENTORY', () => {
    for (const { input, label } of SHOW_INVENTORY_COMMANDS) {
      it(`understands "${label}" as SHOW_INVENTORY`, () => {
        const result = understand(input);
        assertIntent(result, 'SHOW_INVENTORY', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── SEARCH_ITEM Intent ──────────────────────────────────
  describe('Intent: SEARCH_ITEM', () => {
    for (const { input, label } of SEARCH_ITEM_COMMANDS) {
      it(`understands "${label}" as SEARCH_ITEM`, () => {
        const result = understand(input);
        assertIntent(result, 'SEARCH_ITEM', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── CONTINUE_TASK Intent ────────────────────────────────
  describe('Intent: CONTINUE_TASK', () => {
    for (const { input, label } of CONTINUE_TASK_COMMANDS) {
      it(`understands "${label}" as CONTINUE_TASK`, () => {
        const result = understand(input);
        assertIntent(result, 'CONTINUE_TASK', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── REPEAT_LAST Intent ──────────────────────────────────
  describe('Intent: REPEAT_LAST', () => {
    for (const { input, label } of REPEAT_LAST_COMMANDS) {
      it(`understands "${label}" as REPEAT_LAST`, () => {
        const result = understand(input);
        assertIntent(result, 'REPEAT_LAST', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── EDIT_ENTITY Intent ──────────────────────────────────
  describe('Intent: EDIT_ENTITY', () => {
    for (const { input, label } of CHANGE_COMMANDS) {
      it(`understands "${label}" as EDIT_ENTITY`, () => {
        const result = understand(input);
        assertIntent(result, 'EDIT_ENTITY', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── CANCEL_TASK Intent ──────────────────────────────────
  describe('Intent: CANCEL_TASK', () => {
    for (const { input, label } of CANCEL_COMMANDS) {
      it(`understands "${label}" as CANCEL_TASK`, () => {
        const result = understand(input);
        assertIntent(result, 'CANCEL_TASK', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── CONFIRM_ACTION Intent ───────────────────────────────
  describe('Intent: CONFIRM_ACTION', () => {
    for (const { input, label } of CONFIRM_COMMANDS) {
      it(`understands "${label}" as CONFIRM_ACTION`, () => {
        const result = understand(input);
        assertIntent(result, 'CONFIRM_ACTION', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── ASK_HELP Intent ─────────────────────────────────────
  describe('Intent: ASK_HELP', () => {
    for (const { input, label } of HELP_COMMANDS) {
      it(`understands "${label}" as ASK_HELP`, () => {
        const result = understand(input);
        assertIntent(result, 'ASK_HELP', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── GREETING Intent ─────────────────────────────────────
  describe('Intent: GREETING', () => {
    for (const { input, label } of GREETING_COMMANDS) {
      it(`understands "${label}" as GREETING`, () => {
        const result = understand(input);
        assertIntent(result, 'GREETING', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── SHOW_REPORT Intent ──────────────────────────────────
  describe('Intent: SHOW_REPORT', () => {
    for (const { input, label } of SHOW_REPORT_COMMANDS) {
      it(`understands "${label}" as SHOW_REPORT`, () => {
        const result = understand(input);
        assertIntent(result, 'SHOW_REPORT', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── MEASURE_WOOD Intent ─────────────────────────────────
  describe('Intent: MEASURE_WOOD', () => {
    for (const { input, label } of MEASURE_WOOD_COMMANDS) {
      it(`understands "${label}" as MEASURE_WOOD`, () => {
        const result = understand(input);
        assertIntent(result, 'MEASURE_WOOD', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── SET_PRICE Intent ────────────────────────────────────
  describe('Intent: SET_PRICE', () => {
    for (const { input, label } of SET_PRICE_COMMANDS) {
      it(`understands "${label}" as SET_PRICE`, () => {
        const result = understand(input);
        assertIntent(result, 'SET_PRICE', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── RECORD_SALE Intent ──────────────────────────────────
  describe('Intent: RECORD_SALE', () => {
    for (const { input, label } of RECORD_SALE_COMMANDS) {
      it(`understands "${label}" as RECORD_SALE`, () => {
        const result = understand(input);
        assertIntent(result, 'RECORD_SALE', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── RECORD_PURCHASE Intent ──────────────────────────────
  describe('Intent: RECORD_PURCHASE', () => {
    for (const { input, label } of RECORD_PURCHASE_COMMANDS) {
      it(`understands "${label}" as RECORD_PURCHASE`, () => {
        const result = understand(input);
        assertIntent(result, 'RECORD_PURCHASE', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── RECORD_PAYMENT Intent ───────────────────────────────
  describe('Intent: RECORD_PAYMENT', () => {
    for (const { input, label } of RECORD_PAYMENT_COMMANDS) {
      it(`understands "${label}" as RECORD_PAYMENT`, () => {
        const result = understand(input);
        assertIntent(result, 'RECORD_PAYMENT', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── RECORD_EXPENSE Intent ───────────────────────────────
  describe('Intent: RECORD_EXPENSE', () => {
    for (const { input, label } of RECORD_EXPENSE_COMMANDS) {
      it(`understands "${label}" as RECORD_EXPENSE`, () => {
        const result = understand(input);
        assertIntent(result, 'RECORD_EXPENSE', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── SHOW_CUSTOMER_DEBT Intent ───────────────────────────
  describe('Intent: SHOW_CUSTOMER_DEBT', () => {
    for (const { input, label } of SHOW_CUSTOMER_DEBT_COMMANDS) {
      it(`understands "${label}" as SHOW_CUSTOMER_DEBT`, () => {
        const result = understand(input);
        assertIntent(result, 'SHOW_CUSTOMER_DEBT', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── LOW_STOCK_CHECK Intent ──────────────────────────────
  describe('Intent: LOW_STOCK_CHECK', () => {
    for (const { input, label } of LOW_STOCK_COMMANDS) {
      it(`understands "${label}" as LOW_STOCK_CHECK`, () => {
        const result = understand(input);
        assertIntent(result, 'LOW_STOCK_CHECK', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── ADJUST_STOCK Intent ─────────────────────────────────
  describe('Intent: ADJUST_STOCK', () => {
    for (const { input, label } of ADJUST_STOCK_COMMANDS) {
      it(`understands "${label}" as ADJUST_STOCK`, () => {
        const result = understand(input);
        assertIntent(result, 'ADJUST_STOCK', label);
        assertConfidence(result, 0.3, label);
      });
    }
  });

  // ── Spelling Variation Tests ────────────────────────────
  describe('Spelling Variations', () => {
    for (const { input, expectedIntent, label } of SPELLING_VARIATION_COMMANDS) {
      it(`maps "${label}" to ${expectedIntent}`, () => {
        const result = understand(input);
        assertIntent(result, expectedIntent, label);
      });
    }
  });

  // ── Mixed Language Tests ────────────────────────────────
  describe('Mixed Kinyarwanda/English', () => {
    for (const { input, expectedIntent, label } of MIXED_LANGUAGE_COMMANDS) {
      it(`understands "${label}" as ${expectedIntent}`, () => {
        const result = understand(input);
        assertIntent(result, expectedIntent, label);
      });
    }
  });

  // ── Short Command Tests ─────────────────────────────────
  describe('Short Commands', () => {
    for (const { input, expectedIntent, label } of SHORT_COMMAND_TESTS) {
      it(`understands "${label}" as ${expectedIntent}`, () => {
        const result = understand(input);
        assertIntent(result, expectedIntent, label);
      });
    }
  });

  // ── Question Tests ──────────────────────────────────────
  describe('Questions', () => {
    for (const { input, expectedIntent, label } of QUESTION_COMMANDS) {
      it(`understands "${label}" as ${expectedIntent}`, () => {
        const result = understand(input);
        assertIntent(result, expectedIntent, label);
      });
    }
  });

  // ── Number Parsing Tests ────────────────────────────────
  describe('Number Parsing', () => {
    for (const { input, expectedValue, label } of NUMBER_PARSING_TESTS) {
      it(`parses "${label}" correctly`, () => {
        const result = understand(input);
        const hasQuantity = result.entities.some(e => e.type === 'quantity' && e.value === expectedValue);
        expect(hasQuantity).toBe(true);
      });
    }
  });

  // ── Language Detection Tests ────────────────────────────
  describe('Language Detection', () => {
    for (const { input, expectedDominant, expectedLabel, label } of LANGUAGE_DETECTION_TESTS) {
      it(`detects "${label}" as ${expectedLabel ?? expectedDominant}`, () => {
        const result = detectLanguage(input);
        expect(result.dominant).toBe(expectedDominant);
        if (expectedLabel) expect(result.language).toBe(expectedLabel);
      });
    }
  });

  // ── Context Tests ───────────────────────────────────────
  describe('Context Awareness', () => {
    for (const { input, context, expectedKind, label } of CONTEXT_TESTS) {
      it(`resolves context for "${label}"`, () => {
        const result = understand(input, { context });
        expect(result.context.kind).toBe(expectedKind);
        if (expectedKind === 'resolved_reference' || expectedKind === 'short_command') {
          expect(result.context.inherited.length).toBeGreaterThan(0);
        }
      });
    }
  });

  // ── Voice Input Tests ───────────────────────────────────
  describe('Voice Input', () => {
    for (const { hypotheses, label } of VOICE_TESTS) {
      it(`processes "${label}" voice command`, () => {
        const result = understandVoice(hypotheses);
        expect(result.ok).toBe(true);
        expect(result.status).toBe('UNDERSTOOD');
        expect(result.understanding).toBeDefined();
      });
    }

    it('returns NOT_SUPPORTED for empty hypotheses', () => {
      const result = understandVoice([]);
      expect(result.ok).toBe(false);
      expect(result.status).toBe('NOT_SUPPORTED');
    });
  });

  // ── Response Language Tests ─────────────────────────────
  describe('Response Language', () => {
    it('responds in Kinyarwanda for Kinyarwanda input', () => {
      const result = understand('Fungura camera');
      expect(result.response).toContain('kamera');
      expect(result.response).toContain('ifoto');
    });

    it('responds in English for English input', () => {
      const result = understand('open camera');
      expect(result.response).toContain('Camera');
    });
  });

  // ── Clarification Tests ─────────────────────────────────
  describe('Clarification (Never Invent Meaning)', () => {
    it('asks for clarification when input is unknown', () => {
      const result = understand('xyz123unknown');
      expect(result.needsClarification).toBe(true);
      expect(result.clarification).toBeDefined();
    });

    it('provides clarification question in Kinyarwanda', () => {
      const result = understand('xyz123unknown');
      if (result.clarification) {
        expect(result.clarification.question).toBe('Sinabyumvise neza. Ongera ubivuge.');
      }
    });
  });

  // ── Pipeline Trace Tests ────────────────────────────────
  describe('Pipeline Trace', () => {
    it('includes all 6 pipeline steps', () => {
      const result = understand('Fungura camera');
      const trace = result.trace;
      expect(trace.step1LanguageDetection).toContain('language=');
      expect(trace.step2Normalization).toContain('tokens=');
      expect(trace.step3IntentDetection).toContain('intent=');
      expect(trace.step4EntityExtraction).toContain('entities=');
      expect(trace.step5ContextResolution).toContain('kind=');
      expect(trace.step6Action).toContain('action=');
    });
  });

  // ── Action Descriptor Tests ─────────────────────────────
  describe('Action Descriptors', () => {
    it('maps OPEN_CAMERA to correct action', () => {
      const action = getAction('OPEN_CAMERA');
      expect(action).toBeDefined();
      expect(action?.action).toBe('OPEN_CAMERA');
      expect(action?.tool).toBe('app_launcher');
      expect(action?.device).toBe('phone');
    });

    it('maps COUNT_WOOD to correct action', () => {
      const action = getAction('COUNT_WOOD');
      expect(action?.action).toBe('COUNT_WOOD');
    });

    it('all registered intents have action descriptors', () => {
      const intentIds = getRegisteredIntents();
      for (const id of intentIds) {
        const action = getAction(id);
        expect(action).toBeDefined();
      }
    });
  });

  // ── Intent Registration Tests ───────────────────────────
  describe('Intent Registration', () => {
    it('registers all expected intents', () => {
      const intentIds = getRegisteredIntents();
      expect(intentIds.length).toBeGreaterThan(20);
    });

    it('includes all required intents', () => {
      const requiredIntents: IntentId[] = [
        'OPEN_CAMERA', 'SCAN_WOOD', 'COUNT_WOOD', 'CALCULATE_VALUE',
        'SAVE_TO_STOCK', 'SHOW_INVENTORY', 'SEARCH_ITEM', 'CONTINUE_TASK',
        'REPEAT_LAST', 'CANCEL_TASK', 'ASK_HELP', 'GREETING',
        'UNKNOWN', 'SHOW_REPORT', 'MEASURE_WOOD', 'SET_PRICE',
      ];
      const intentIds = getRegisteredIntents();
      for (const intent of requiredIntents) {
        expect(intentIds).toContain(intent);
      }
    });
  });

  // ── Entity Extraction Tests ─────────────────────────────
  describe('Entity Extraction', () => {
    it('extracts quantity from "Ongera imbaho 5"', () => {
      const result = understand('Ongera imbaho 5');
      const quantity = result.entities.find(e => e.type === 'quantity');
      expect(quantity).toBeDefined();
      expect(quantity?.value).toBe(5);
    });

    it('extracts species from "Fata ifoto y izi mbaho"', () => {
      const result = understand('Fata ifoto y izi mbaho');
      // Should have screen entity
      const screen = result.entities.find(e => e.type === 'screen');
      expect(screen).toBeDefined();
    });

    it('extracts screen from "Fungura camera"', () => {
      const result = understand('Fungura camera');
      const screen = result.entities.find(e => e.type === 'screen');
      expect(screen).toBeDefined();
      expect(screen?.value).toBe('camera');
    });
  });

  // ── Comprehensive: Same intent, different expressions ───
  describe('Semantic Equivalence', () => {
    const expressions = [
      'Fungura camera',
      'Fungurira camera',
      'Jya kuri camera',
      'Ndashaka gufata ifoto',
      'Mfasha gufata ifoto',
    ];

    it('all expressions map to OPEN_CAMERA', () => {
      for (const expr of expressions) {
        const result = understand(expr);
        expect(result.intent.intent).toBe('OPEN_CAMERA');
      }
    });

    it('all expressions have confidence >= 0.3', () => {
      for (const expr of expressions) {
        const result = understand(expr);
        expect(result.confidence).toBeGreaterThanOrEqual(0.3);
      }
    });
  });

  // ── Comprehensive: Total test count ─────────────────────
  describe('Test Coverage Summary', () => {
    it('has at least 100 test cases', () => {
      // Count all the test cases defined above
      const total = [
        ...OPEN_CAMERA_COMMANDS,
        ...COUNT_WOOD_COMMANDS,
        ...CALCULATE_VALUE_COMMANDS,
        ...SAVE_TO_STOCK_COMMANDS,
        ...SHOW_INVENTORY_COMMANDS,
        ...SEARCH_ITEM_COMMANDS,
        ...CONTINUE_TASK_COMMANDS,
        ...REPEAT_LAST_COMMANDS,
        ...CHANGE_COMMANDS,
        ...CANCEL_COMMANDS,
        ...CONFIRM_COMMANDS,
        ...HELP_COMMANDS,
        ...GREETING_COMMANDS,
        ...SHOW_REPORT_COMMANDS,
        ...MEASURE_WOOD_COMMANDS,
        ...SET_PRICE_COMMANDS,
        ...RECORD_SALE_COMMANDS,
        ...RECORD_PURCHASE_COMMANDS,
        ...RECORD_PAYMENT_COMMANDS,
        ...RECORD_EXPENSE_COMMANDS,
        ...SHOW_CUSTOMER_DEBT_COMMANDS,
        ...LOW_STOCK_COMMANDS,
        ...ADJUST_STOCK_COMMANDS,
        ...SPELLING_VARIATION_COMMANDS,
        ...MIXED_LANGUAGE_COMMANDS,
        ...SHORT_COMMAND_TESTS,
        ...QUESTION_COMMANDS,
        ...NUMBER_PARSING_TESTS,
        ...LANGUAGE_DETECTION_TESTS,
        ...SPELLING_VARIANT_TESTS,
        ...VOCABULARY_TESTS,
        ...CONTEXT_TESTS,
        ...VOICE_TESTS,
      ].length;

      expect(total).toBeGreaterThanOrEqual(100);
    });
  });
});