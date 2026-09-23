/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GANZA Kinyarwanda-Native NLU — Central Understanding Pipeline
 *
 * Pipeline (hard requirement — no Kinyarwanda → English translation step):
 *   User input
 *   → Language detection
 *   → Kinyarwanda normalization
 *   → Intent detection (semantics)
 *   → Entity extraction
 *   → Context resolution
 *   → Action
 *
 * Kinyarwanda is understood directly through its own semantics,
 * never translated to English before intent detection.
 */

import { detectLanguage, detectSpeechLanguage } from './language.js';
import { normalizeUtterance, stemToken, repairToken, fuzzyEqual } from './normalizer.js';
import { SemanticLexicon, BUILTIN_LEXICON, ganzaLexicon } from './lexicon.js';
import { ganzaVocabulary, type GanzaVocabulary, type VocabularyTerm } from './vocabulary.js';
import { parseNextNumber, extractNumberOccurrences, type NumberOccurrence } from './numerals.js';
import { detectIntent as detectIntentFromRules, collectConceptHits } from './intentDetector.js';
import { INTENT_RULES, INTENT_IDS } from './intents.js';
import type {
  Understanding,
  IntentDetection,
  IntentCandidate,
  ConceptHit,
  Entity,
  EntityType,
  ContextResolution,
  ContextResolutionKind,
  ConversationContext,
  ActionDescriptor,
  LanguageDetection,
  NormalizedUtterance,
  IntentId,
  UnderstandOptions,
  VoiceCommandResult,
  Clarification,
  PipelineTrace,
} from './types.js';

// ── Intent → Action mapping ────────────────────────────────────────

const INTENT_TO_ACTION: Record<IntentId, ActionDescriptor> = {
  OPEN_CAMERA: {
    intent: 'OPEN_CAMERA', action: 'OPEN_CAMERA', tool: 'app_launcher', target: 'camera',
    device: 'phone', riskLevel: 'low', requiresConfirmation: false,
    informational: false, canonicalGoal: 'Open the camera application',
    expectedResult: 'Camera is open and ready to capture',
    verificationStrategy: 'ui_state',
  },
  SCAN_WOOD: {
    intent: 'SCAN_WOOD', action: 'SCAN_WOOD', tool: 'app_launcher', target: 'camera',
    device: 'phone', riskLevel: 'low', requiresConfirmation: false,
    informational: false, canonicalGoal: 'Scan wood using camera',
    expectedResult: 'Wood detection initiated',
    verificationStrategy: 'ui_state',
  },
  COUNT_WOOD: {
    intent: 'COUNT_WOOD', action: 'COUNT_WOOD', tool: 'generic', target: 'inventory',
    device: 'any', riskLevel: 'low', requiresConfirmation: false,
    informational: false, canonicalGoal: 'Count the wood boards',
    expectedResult: 'Wood count completed',
    verificationStrategy: 'tool_result',
  },
  CALCULATE_VALUE: {
    intent: 'CALCULATE_VALUE', action: 'CALCULATE_VALUE', tool: 'generic', target: 'inventory',
    device: 'any', riskLevel: 'low', requiresConfirmation: false,
    informational: false, canonicalGoal: 'Calculate the value of detected wood',
    expectedResult: 'Value calculation completed',
    verificationStrategy: 'tool_result',
  },
  SAVE_TO_STOCK: {
    intent: 'SAVE_TO_STOCK', action: 'SAVE_TO_STOCK', tool: 'generic', target: 'inventory',
    device: 'any', riskLevel: 'medium', requiresConfirmation: true,
    informational: false, canonicalGoal: 'Save detected wood to stock',
    expectedResult: 'Wood saved to stock',
    verificationStrategy: 'tool_result',
  },
  ADJUST_STOCK: {
    intent: 'ADJUST_STOCK', action: 'ADJUST_STOCK', tool: 'generic', target: 'inventory',
    device: 'any', riskLevel: 'medium', requiresConfirmation: true,
    informational: false, canonicalGoal: 'Adjust stock quantities',
    expectedResult: 'Stock adjusted',
    verificationStrategy: 'tool_result',
  },
  SHOW_INVENTORY: {
    intent: 'SHOW_INVENTORY', action: 'SHOW_INVENTORY', tool: 'generic', target: 'inventory',
    device: 'any', riskLevel: 'low', requiresConfirmation: false,
    informational: false, canonicalGoal: 'Show current inventory',
    expectedResult: 'Inventory displayed',
    verificationStrategy: 'ui_state',
  },
  LOW_STOCK_CHECK: {
    intent: 'LOW_STOCK_CHECK', action: 'LOW_STOCK_CHECK', tool: 'generic', target: 'inventory',
    device: 'any', riskLevel: 'low', requiresConfirmation: false,
    informational: false, canonicalGoal: 'Check low stock items',
    expectedResult: 'Low stock report displayed',
    verificationStrategy: 'tool_result',
  },
  SEARCH_ITEM: {
    intent: 'SEARCH_ITEM', action: 'SEARCH_ITEM', tool: 'generic', target: 'inventory',
    device: 'any', riskLevel: 'low', requiresConfirmation: false,
    informational: false, canonicalGoal: 'Search for an item',
    expectedResult: 'Search results displayed',
    verificationStrategy: 'ui_state',
  },
  SHOW_REPORT: {
    intent: 'SHOW_REPORT', action: 'SHOW_REPORT', tool: 'generic', target: 'reports',
    device: 'any', riskLevel: 'low', requiresConfirmation: false,
    informational: false, canonicalGoal: 'Show a report',
    expectedResult: 'Report displayed',
    verificationStrategy: 'ui_state',
  },
  RECORD_SALE: {
    intent: 'RECORD_SALE', action: 'RECORD_SALE', tool: 'generic', target: 'sales',
    device: 'any', riskLevel: 'medium', requiresConfirmation: true,
    informational: false, canonicalGoal: 'Record a sale',
    expectedResult: 'Sale recorded',
    verificationStrategy: 'tool_result',
  },
  RECORD_PURCHASE: {
    intent: 'RECORD_PURCHASE', action: 'RECORD_PURCHASE', tool: 'generic', target: 'purchases',
    device: 'any', riskLevel: 'medium', requiresConfirmation: true,
    informational: false, canonicalGoal: 'Record a purchase',
    expectedResult: 'Purchase recorded',
    verificationStrategy: 'tool_result',
  },
  RECORD_PAYMENT: {
    intent: 'RECORD_PAYMENT', action: 'RECORD_PAYMENT', tool: 'generic', target: 'payments',
    device: 'any', riskLevel: 'medium', requiresConfirmation: true,
    informational: false, canonicalGoal: 'Record a payment',
    expectedResult: 'Payment recorded',
    verificationStrategy: 'tool_result',
  },
  RECORD_EXPENSE: {
    intent: 'RECORD_EXPENSE', action: 'RECORD_EXPENSE', tool: 'generic', target: 'expenses',
    device: 'any', riskLevel: 'medium', requiresConfirmation: true,
    informational: false, canonicalGoal: 'Record an expense',
    expectedResult: 'Expense recorded',
    verificationStrategy: 'tool_result',
  },
  SHOW_CUSTOMER_DEBT: {
    intent: 'SHOW_CUSTOMER_DEBT', action: 'SHOW_CUSTOMER_DEBT', tool: 'generic', target: 'customers',
    device: 'any', riskLevel: 'low', requiresConfirmation: false,
    informational: false, canonicalGoal: 'Show customer debt',
    expectedResult: 'Customer debt displayed',
    verificationStrategy: 'tool_result',
  },
  MEASURE_WOOD: {
    intent: 'MEASURE_WOOD', action: 'MEASURE_WOOD', tool: 'generic', target: 'inventory',
    device: 'any', riskLevel: 'low', requiresConfirmation: false,
    informational: false, canonicalGoal: 'Measure wood dimensions',
    expectedResult: 'Wood measurements recorded',
    verificationStrategy: 'tool_result',
  },
  SET_PRICE: {
    intent: 'SET_PRICE', action: 'SET_PRICE', tool: 'generic', target: 'inventory',
    device: 'any', riskLevel: 'medium', requiresConfirmation: true,
    informational: false, canonicalGoal: 'Set the price of wood',
    expectedResult: 'Price set',
    verificationStrategy: 'tool_result',
  },
  OPEN_SCREEN: {
    intent: 'OPEN_SCREEN', action: 'OPEN_SCREEN', tool: 'generic', target: 'screen',
    device: 'any', riskLevel: 'low', requiresConfirmation: false,
    informational: false, canonicalGoal: 'Open a screen',
    expectedResult: 'Screen opened',
    verificationStrategy: 'ui_state',
  },
  EDIT_ENTITY: {
    intent: 'EDIT_ENTITY', action: 'EDIT_ENTITY', tool: 'generic', target: 'entity',
    device: 'any', riskLevel: 'medium', requiresConfirmation: true,
    informational: false, canonicalGoal: 'Edit an entity',
    expectedResult: 'Entity edited',
    verificationStrategy: 'tool_result',
  },
  CONTINUE_TASK: {
    intent: 'CONTINUE_TASK', action: 'CONTINUE_TASK', tool: 'generic', target: 'task',
    device: 'any', riskLevel: 'low', requiresConfirmation: false,
    informational: false, canonicalGoal: 'Continue the current task',
    expectedResult: 'Task continued',
    verificationStrategy: 'ui_state',
  },
  REPEAT_LAST: {
    intent: 'REPEAT_LAST', action: 'REPEAT_LAST', tool: 'generic', target: 'last',
    device: 'any', riskLevel: 'low', requiresConfirmation: false,
    informational: false, canonicalGoal: 'Repeat the last action',
    expectedResult: 'Last action repeated',
    verificationStrategy: 'ui_state',
  },
  CANCEL_TASK: {
    intent: 'CANCEL_TASK', action: 'CANCEL_TASK', tool: 'generic', target: 'task',
    device: 'any', riskLevel: 'low', requiresConfirmation: false,
    informational: false, canonicalGoal: 'Cancel the current task',
    expectedResult: 'Task cancelled',
    verificationStrategy: 'ui_state',
  },
  CONFIRM_ACTION: {
    intent: 'CONFIRM_ACTION', action: 'CONFIRM_ACTION', tool: 'generic', target: 'confirm',
    device: 'any', riskLevel: 'low', requiresConfirmation: false,
    informational: false, canonicalGoal: 'Confirm the current action',
    expectedResult: 'Action confirmed',
    verificationStrategy: 'ui_state',
  },
  SHOW_LAST_RESULT: {
    intent: 'SHOW_LAST_RESULT', action: 'SHOW_LAST_RESULT', tool: 'generic', target: 'result',
    device: 'any', riskLevel: 'low', requiresConfirmation: false,
    informational: false, canonicalGoal: 'Show the last result',
    expectedResult: 'Last result displayed',
    verificationStrategy: 'ui_state',
  },
  ASK_HELP: {
    intent: 'ASK_HELP', action: 'ASK_HELP', tool: 'generic', target: 'help',
    device: 'any', riskLevel: 'low', requiresConfirmation: false,
    informational: true, canonicalGoal: 'Provide help information',
    expectedResult: 'Help information displayed',
    verificationStrategy: 'ui_state',
  },
  GREETING: {
    intent: 'GREETING', action: 'GREETING', tool: 'generic', target: 'greeting',
    device: 'any', riskLevel: 'low', requiresConfirmation: false,
    informational: true, canonicalGoal: 'Respond to a greeting',
    expectedResult: 'Greeting response',
    verificationStrategy: 'ui_state',
  },
  CORRECT_ENTITY: {
    intent: 'CORRECT_ENTITY', action: 'CORRECT_ENTITY', tool: 'generic', target: 'correction',
    device: 'any', riskLevel: 'low', requiresConfirmation: false,
    informational: false, canonicalGoal: 'Correct an entity',
    expectedResult: 'Entity corrected',
    verificationStrategy: 'tool_result',
  },
  UNKNOWN: {
    intent: 'UNKNOWN', action: 'UNKNOWN', tool: 'generic', target: 'unknown',
    device: 'any', riskLevel: 'low', requiresConfirmation: false,
    informational: true, canonicalGoal: 'Unknown intent — request clarification',
    expectedResult: 'Clarification requested',
    verificationStrategy: 'ui_state',
  },
};

// ── Conversation session store (requirement: context awareness) ────
//
// The agent must remember the current task so the user never repeats the whole
// command:
//   "Fata ifoto y'izi mbaho."  → scan the wood
//   "Noneho uzibarire."        → count the boards from that scan
//   "Ubaze n'agaciro kazo."    → value of the wood detected in that scan
//
// Sessions are keyed by sessionId, expire after SESSION_TTL_MS of inactivity and
// can also be supplied explicitly (stateless callers / tests pass `options.context`).

export const SESSION_TTL_MS = 30 * 60 * 1000;

export class ConversationSessionStore {
  private sessions = new Map<string, ConversationContext>();
  private ttlMs: number;

  constructor(ttlMs: number = SESSION_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  /** Get (or open) the conversation context, refreshing its metadata. */
  get(sessionId = 'default', seed: Partial<ConversationContext> = {}): ConversationContext {
    const existing = this.peek(sessionId);
    if (existing) {
      Object.assign(existing, seed, { updatedAt: new Date().toISOString() });
      return existing;
    }
    const fresh: ConversationContext = {
      sessionId,
      turns: 0,
      lastEntities: [],
      ...seed,
      updatedAt: new Date().toISOString(),
    };
    this.sessions.set(sessionId, fresh);
    return fresh;
  }

  peek(sessionId = 'default'): ConversationContext | undefined {
    const existing = this.sessions.get(sessionId);
    if (!existing) return undefined;
    if (Date.now() - Date.parse(existing.updatedAt) >= this.ttlMs) {
      this.sessions.delete(sessionId);
      return undefined;
    }
    return existing;
  }

  set(context: ConversationContext): void {
    this.sessions.set(context.sessionId, context);
  }

  reset(sessionId = 'default'): void {
    this.sessions.delete(sessionId);
  }

  /** Drop expired sessions, returns how many were removed. */
  prune(): number {
    let removed = 0;
    for (const sessionId of [...this.sessions.keys()]) {
      if (!this.peek(sessionId)) removed++;
    }
    return removed;
  }

  size(): number {
    return this.sessions.size;
  }
}

/** Shared session store used by the NLU pipeline and the HTTP layer. */
export const sessionStore = new ConversationSessionStore();

/** Read a conversation session without understanding an utterance. */
export function getSession(sessionId = 'default', seed: Partial<ConversationContext> = {}): ConversationContext {
  return sessionStore.get(sessionId, seed);
}

/** Forget everything about a conversation (new task / privacy reset). */
export function resetSession(sessionId = 'default'): void {
  sessionStore.reset(sessionId);
}

// ── Entity extraction patterns ─────────────────────────────────────

const SPECIES_PATTERNS: Record<string, string> = {
  inturusu: 'Eucalyptus', eucalyptus: 'Eucalyptus', kalitasi: 'Eucalyptus',
  pini: 'Pine', pinusi: 'Pine', pine: 'Pine',
  tiki: 'Teak', teak: 'Teak',
  icyipure: 'Cypress', sipurese: 'Cypress', sipure: 'Cypress',
  umuvumu: 'Muvumu', muvumu: 'Muvumu',
  jacaranda: 'Jacaranda', umujakaranda: 'Jacaranda',
  gureviliya: 'Grevillea', grevillea: 'Grevillea',
  mahogany: 'Mahogany', umuhogo: 'Mahogany',
  ibiti: 'Logs', imbaho: 'Boards', mbaho: 'Boards',
};

const SCREEN_MAP: Record<string, string> = {
  kamera: 'camera', camera: 'camera', ifoto: 'camera',
  ububiko: 'inventory', stock: 'inventory', imbaho: 'inventory',
  kugurisha: 'sales', sales: 'sales',
  raporo: 'reports', report: 'reports',
  ahabanza: 'dashboard', dashboard: 'dashboard',
  abakiriya: 'customers', customers: 'customers',
};

/** Words that turn a number into a unit price ("igiciro", "kuri buri", "each"). */
const PRICE_ROLE_WORDS = new Set(['igiciro', 'ibiciro', 'giciro', 'price', 'prices', 'buri', 'kimwe', 'each', 'per', 'apiece']);
/** Words that turn a number into a total value ("agaciro", "total", "hamwe"). */
const VALUE_ROLE_WORDS = new Set(['agaciro', 'gaciro', 'value', 'worth', 'total', 'hamwe', 'hose', 'byose', 'rwf', 'frw', 'amafaranga', 'ifaranga']);

/** Role of a number in the sentence — decided by the surrounding Kinyarwanda words. */
function numberRole(tokens: string[], occurrence: NumberOccurrence): 'quantity' | 'unitPrice' | 'totalValue' {
  const window = [
    ...tokens.slice(Math.max(0, occurrence.index - 3), occurrence.index),
    ...tokens.slice(occurrence.endIndex + 1, occurrence.endIndex + 3),
  ];
  if (window.some(token => PRICE_ROLE_WORDS.has(token))) return 'unitPrice';
  if (window.some(token => VALUE_ROLE_WORDS.has(token))) return 'totalValue';
  return 'quantity';
}

const mentionsPrice = (text: string): boolean => /igiciro|ibiciro|price|kuri buri|each|per/.test(text);
const mentionsValue = (text: string): boolean => /agaciro|value|worth|total|hose hamwe/.test(text);

/**
 * Extract entities from normalized tokens and stems.
 */
function extractEntities(
  tokens: string[],
  stems: string[],
  rawText: string,
): Entity[] {
  const entities: Entity[] = [];
  const numberOccurrences = extractNumberOccurrences(tokens);

  // Numbers get a role from the words around them: quantity, unit price or total value.
  for (const num of numberOccurrences) {
    const role = numberRole(tokens, num);
    if (role === 'unitPrice') {
      entities.push({ type: 'unitPrice', value: num.value, raw: num.raw, confidence: 0.9, origin: 'utterance' });
      continue;
    }
    if (role === 'totalValue') {
      entities.push({ type: 'totalValue', value: num.value, raw: num.raw, confidence: 0.9, origin: 'utterance' });
      continue;
    }
    entities.push({
      type: 'quantity',
      value: num.value,
      raw: num.raw,
      confidence: 0.95,
      origin: 'utterance',
    });
  }

  for (const token of tokens) {
    const species = SPECIES_PATTERNS[token];
    if (species) {
      entities.push({
        type: 'species',
        value: species,
        raw: token,
        confidence: 0.9,
        origin: 'utterance',
      });
    }

    const screen = SCREEN_MAP[token];
    if (screen) {
      entities.push({
        type: 'screen',
        value: screen,
        raw: token,
        confidence: 0.9,
        origin: 'utterance',
      });
    }
  }

  // Money
  const moneyPatterns = rawText.match(/(\d+(?:[.,]\d+)?)\s*(FRW|RWF|rwf|amafaranga|ifaranga)/i);
  if (moneyPatterns) {
    entities.push({
      type: 'money',
      value: Number(moneyPatterns[1].replace(/,/g, '')),
      raw: moneyPatterns[0],
      confidence: 0.9,
      origin: 'utterance',
    });
  }

  // Price/value mentions without an explicit number were already handled above.
  if (mentionsPrice(rawText) && !entities.some(e => e.type === 'unitPrice')) {
    entities.push({
      type: 'unitPrice',
      value: null,
      raw: rawText,
      confidence: 0.7,
      origin: 'utterance',
    });
  }

  if (mentionsValue(rawText) && !entities.some(e => e.type === 'totalValue')) {
    entities.push({
      type: 'totalValue',
      value: null,
      raw: rawText,
      confidence: 0.7,
      origin: 'utterance',
    });
  }

  // Volume/dimensions
  if (/\bvolume\b|\bubunini\b|\bubugari\b|\buburebure\b/.test(rawText)) {
    entities.push({
      type: 'volume',
      value: null,
      raw: rawText,
      confidence: 0.7,
      origin: 'utterance',
    });
  }

  // Customer
  if (/\bumukiriya\b|\babakiriya\b|\bcustomer\b/.test(rawText)) {
    entities.push({
      type: 'customerName',
      value: null,
      raw: rawText,
      confidence: 0.7,
      origin: 'utterance',
    });
  }

  // Filter
  if (/\bhasigaye\b|\bnyinshi\b|\bbyinshi\b|\ball\b|\bzose\b|\bbyose\b/.test(rawText)) {
    entities.push({
      type: 'filter',
      value: 'all_or_many',
      raw: rawText,
      confidence: 0.7,
      origin: 'utterance',
    });
  }

  // Percent
  const percentMatch = rawText.match(/(\d+)\s*ku\s*ijana/);
  if (percentMatch) {
    entities.push({
      type: 'percent',
      value: Number(percentMatch[1]),
      raw: percentMatch[0],
      confidence: 0.9,
      origin: 'utterance',
    });
  }

  return entities;
}

// ── Context markers (what real follow-up Kinyarwanda looks like) ────

/** Follow-up markers: "nothing else? then…" continuation of the previous task. */
const FOLLOWUP_MARKERS = ['noneho', 'ubwo', 'hanyuma', 'nanone', 'nyuma', 'kandi'];

/** Reference words pointing at the previous result ("kazo", "izi", "izo", "cyazo"). */
const REFERENCE_MARKERS = [
  'kazo', 'cyazo', 'byazo', 'yazo', 'wazo', 'zazo', 'zo', 'izo', 'izi', 'iyi', 'iyo', 'kiri', 'ziri', 'waho', 'aho',
];

/** Short commands that only make sense together with the previous result. */
const SHORT_COMMAND_STEMS = [
  'uzibarire', 'uzibare', 'zibarire', 'ubaze', 'mbaze', 'bara', 'bar', 'barur', 'kubar',
  'agaciro', 'gaciro', 'igiciro', 'giciro', 'umubare', 'bik', 'onger', 'hindur', 'komez', 'subir', 'erek',
];

/** Carry the previously detected wood into this turn (never invented — copied). */
function inheritDetectedWood(context: ConversationContext, resolution: ContextResolution): void {
  for (const [key, value] of Object.entries(context.lastDetectedWood ?? {})) {
    if (value === undefined || value === null) continue;
    resolution.inherited.push({
      type: key as EntityType,
      value,
      raw: String(value),
      confidence: 0.95,
      origin: 'context',
    });
  }
}

/**
 * Resolve context: carry over entities from conversation, resolve references.
 */
function resolveContext(
  entities: Entity[],
  context: ConversationContext | undefined,
  tokens: string[],
  stems: string[],
): ContextResolution {
  const resolution: ContextResolution = {
    kind: 'none',
    sessionId: context?.sessionId ?? '',
    notes: [],
    inherited: [],
    unresolved: [],
  };

  if (!context) return resolution;

  const hasFollowup = tokens.some(t => FOLLOWUP_MARKERS.includes(t));
  const hasReference = tokens.some(t => REFERENCE_MARKERS.includes(t));
  const isShortCommand = stems.some(s => SHORT_COMMAND_STEMS.includes(s)) || tokens.some(t => SHORT_COMMAND_STEMS.includes(t));
  const hasWood = Boolean(context.lastDetectedWood);
  const hasAnyContext = hasWood || (context.lastEntities?.length ?? 0) > 0 || Boolean(context.lastIntent);

  // "Noneho uzibarire" — the user continues the previous task.
  if (hasWood && hasFollowup) {
    resolution.kind = 'resolved_reference';
    resolution.notes.push('Follow-up on the previous task — inheriting the detected wood');
    inheritDetectedWood(context, resolution);
  // "Ubaze n'agaciro kazo" — a short command pointing at the previous result.
  } else if (hasWood && (hasReference || isShortCommand)) {
    resolution.kind = 'short_command';
    resolution.notes.push('Short command referring to the previous result — inheriting the detected wood');
    inheritDetectedWood(context, resolution);
  // The task continues, but only older entities are available.
  } else if (hasAnyContext && isShortCommand) {
    resolution.kind = 'carried_over_entities';
    resolution.notes.push('Continuing the current task with the previous context');
    for (const entity of context.lastEntities ?? []) {
      resolution.inherited.push({ ...entity, origin: 'context' });
    }
  // "Agaciro kazo" with nothing to point at — ask instead of guessing.
  } else if (!hasAnyContext && (hasReference || isShortCommand)) {
    resolution.kind = 'unresolved_reference';
    resolution.unresolved.push('reference');
    resolution.notes.push('Reference without a previous result — asking for clarification');
  }

  // Fill null values from context
  for (const entity of entities) {
    if (entity.origin === 'context') continue;
    if (entity.value === null || entity.value === undefined) {
      const contextMatch = resolution.inherited.find(e => e.type === entity.type);
      if (contextMatch) {
        entity.value = contextMatch.value;
        entity.origin = 'context';
        resolution.notes.push(`Filled ${entity.type} from context`);
      }
    }
  }

  if (tokens.includes('simbuza') || tokens.includes('kosora') || tokens.includes('hindura')) {
    resolution.notes.push('Correction detected');
    if (resolution.kind === 'none') resolution.kind = 'correction';
  }

  return resolution;
}

/**
 * Detect intent using the existing intent detector and rules.
 */
function detectIntent(
  tokens: string[],
  stems: string[],
  lexicon: SemanticLexicon,
): IntentDetection {
  // Meaning comes from concepts only — no keyword tables, no English translation.
  const hits = collectConceptHits(tokens, stems, lexicon);

  // Score every intent rule against those concepts.
  const detection = detectIntentFromRules(hits, { minConfidence: 0.35 });

  return detection;
}

/** Which intents make sense on which screen — used to disambiguate weak matches. */
const SCREEN_INTENT_AFFINITY: Record<string, IntentId[]> = {
  camera: ['SCAN_WOOD', 'OPEN_CAMERA'],
  inventory: ['SHOW_INVENTORY', 'ADJUST_STOCK', 'LOW_STOCK_CHECK', 'SEARCH_ITEM'],
  sales: ['RECORD_SALE', 'RECORD_PAYMENT', 'SHOW_CUSTOMER_DEBT'],
  customers: ['SHOW_CUSTOMER_DEBT', 'RECORD_PAYMENT'],
  reports: ['SHOW_REPORT'],
  dashboard: ['SHOW_REPORT', 'LOW_STOCK_CHECK', 'CALCULATE_VALUE'],
};

/**
 * Use the current screen to pick the intended action — requirement: "use the current
 * screen and conversation context to determine the intended action" for short commands.
 * Only weak (topic-level) interpretations are re-ranked: a full semantic match always wins.
 */
function applyScreenContext(detection: IntentDetection, context?: ConversationContext): IntentDetection {
  const screen = context?.screen;
  const affinity = screen ? SCREEN_INTENT_AFFINITY[screen] : undefined;
  if (!affinity || detection.intent === 'UNKNOWN') return detection;

  const top = detection.candidates[0];
  if (!top?.topicOnly) return detection;

  const preferred = detection.candidates.find(c => c.topicOnly && affinity.includes(c.intent));
  if (!preferred || preferred.intent === detection.intent) return detection;

  return {
    ...detection,
    intent: preferred.intent,
    confidence: preferred.confidence,
    hits: preferred.hits,
    candidates: [preferred, ...detection.candidates.filter(c => c !== preferred)],
    ambiguous: false,
    ambiguity: undefined,
    reasoning: `${preferred.reasoning} (screen context: ${screen})`,
  };
}

/**
 * Base response templates (used when the agent has no computed numbers to speak).
 */
function baseResponse(intentId: IntentId, dominant: NluLanguage): string {
  const responses: Record<string, Record<string, string>> = {
    OPEN_CAMERA: {
      rw: 'Nimaze kamera. Ndiyo duka gufata ifoto.',
      en: 'Camera is open. You can now take a photo.',
      fr: 'La caméra est ouverte.',
    },
    SCAN_WOOD: {
      rw: 'Ndiyo duka gusikana imbaho.',
      en: 'Scanning wood now.',
      fr: 'Scan du bois en cours.',
    },
    COUNT_WOOD: {
      rw: 'Nbarira imbaho.',
      en: 'Counting the wood boards.',
      fr: 'Comptage des planches.',
    },
    CALCULATE_VALUE: {
      rw: 'Nagereranya agaciro kazo.',
      en: 'Calculating the value.',
      fr: 'Calcul de la valeur.',
    },
    SAVE_TO_STOCK: {
      rw: 'Bika imbaho muri stock.',
      en: 'Saving wood to stock.',
      fr: 'Sauvegarde du bois.',
    },
    SHOW_INVENTORY: {
      rw: 'Erekana imbaho mfite mu bubiko.',
      en: 'Showing inventory.',
      fr: 'Affichage de l\'inventaire.',
    },
    SEARCH_ITEM: {
      rw: 'Shakisha item.',
      en: 'Searching for the item.',
      fr: 'Recherche de l\'article.',
    },
    CONTINUE_TASK: {
      rw: 'Komeza ukora.',
      en: 'Continuing the task.',
      fr: 'Suite de la tâche.',
    },
    REPEAT_LAST: {
      rw: 'Subiramo ibyo twakoze.',
      en: 'Repeating the last action.',
      fr: 'Répétition de la dernière action.',
    },
    CANCEL_TASK: {
      rw: 'Reka aho.',
      en: 'Cancelling the task.',
      fr: 'Annulation de la tâche.',
    },
    ASK_HELP: {
      rw: 'Sinabyumvise neza. Ongera ubivuge.',
      en: 'I didn\'t understand well. Please say more.',
      fr: 'Je n\'ai pas bien compris.',
    },
    GREETING: {
      rw: 'Muraho! Ndimaze kumenya amakuru yawe.',
      en: 'Hello! I see your message.',
      fr: 'Bonjour!',
    },
    UNKNOWN: {
      rw: 'Sinabyumvise neza. Ongera ubivuge.',
      en: 'I didn\'t understand well. Please say more.',
      fr: 'Je n\'ai pas bien compris.',
    },
  };

  const intentResponses = responses[intentId];
  if (intentResponses) return intentResponses[dominant] ?? intentResponses.rw;

  if (dominant === 'rw') return 'Ndiyo, ndi umaze kumenya.';
  if (dominant === 'fr') return 'Oui, j\'ai compris.';
  return 'Yes, I understood.';
}

/** Small translation helper for the fixed agent phrases (kept explicit, no MT). */
function phrase(dominant: NluLanguage, rw: string, en: string, fr: string): string {
  if (dominant === 'en') return en;
  if (dominant === 'fr') return fr;
  return rw;
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/** Last numeric value of an entity type (utterance values win over inherited ones). */
function numberEntity(entities: Entity[], type: EntityType): number | undefined {
  const values = entities
    .filter(e => e.type === type)
    .map(e => Number(e.value))
    .filter(v => Number.isFinite(v));
  return values.length > 0 ? values[values.length - 1] : undefined;
}

/**
 * Response in the user's own language, using the entities the agent actually has
 * (from this utterance or from the remembered context). Numbers the agent can
 * compute are spoken back, so "Noneho uzibarire" / "Ubaze n'agaciro kazo" feel
 * like a conversation instead of a command echo.
 */
function generateResponse(intentId: IntentId, dominant: NluLanguage, entities: Entity[] = []): string {
  const quantity = numberEntity(entities, 'quantity');
  const unitPrice = numberEntity(entities, 'unitPrice');
  const totalValue = numberEntity(entities, 'totalValue');

  if (intentId === 'CALCULATE_VALUE' && (totalValue !== undefined || (quantity !== undefined && unitPrice !== undefined))) {
    const computed = totalValue ?? (quantity as number) * (unitPrice as number);
    if (quantity !== undefined && unitPrice !== undefined) {
      return phrase(
        dominant,
        `Imbaho ${quantity} × ${formatNumber(unitPrice)} = ${formatNumber(computed)} FRW.`,
        `${quantity} boards × ${formatNumber(unitPrice)} = ${formatNumber(computed)} RWF.`,
        `${quantity} planches × ${formatNumber(unitPrice)} = ${formatNumber(computed)} FRW.`,
      );
    }
    return phrase(
      dominant,
      `Agaciro kose ni ${formatNumber(computed)} FRW.`,
      `The total value is ${formatNumber(computed)} RWF.`,
      `La valeur totale est ${formatNumber(computed)} FRW.`,
    );
  }

  if (intentId === 'COUNT_WOOD' && quantity !== undefined) {
    return phrase(
      dominant,
      `Hari imbaho ${quantity}.`,
      `There are ${quantity} boards.`,
      `Il y a ${quantity} planches.`,
    );
  }

  return baseResponse(intentId, dominant);
}

/** Meaning of each intent in the user's language — used to offer real choices. */
const INTENT_PHRASES: Partial<Record<IntentId, { rw: string; en: string }>> = {
  SCAN_WOOD: { rw: 'gufata ifoto y\'imbaho', en: 'scan the boards' },
  OPEN_CAMERA: { rw: 'kufungura kamera', en: 'open the camera' },
  COUNT_WOOD: { rw: 'kubara imbaho', en: 'count the boards' },
  CALCULATE_VALUE: { rw: 'kubara agaciro kazo', en: 'calculate their value' },
  SAVE_TO_STOCK: { rw: 'kubika muri stock', en: 'save to stock' },
  ADJUST_STOCK: { rw: 'kongera umubare', en: 'change the quantity' },
  EDIT_ENTITY: { rw: 'guhindura ibyanditswe', en: 'change what was entered' },
  SHOW_INVENTORY: { rw: 'kureba ibiri mu bubiko', en: 'show the stock' },
  SEARCH_ITEM: { rw: 'gushakisha igicuruzwa', en: 'search for an item' },
  SHOW_REPORT: { rw: 'kureba raporo', en: 'show the report' },
  MEASURE_WOOD: { rw: 'gupima imbaho', en: 'measure the boards' },
  SET_PRICE: { rw: 'kugena igiciro', en: 'set the price' },
  RECORD_SALE: { rw: 'kwandika igurisha', en: 'record a sale' },
  RECORD_PURCHASE: { rw: 'kwandika kugura', en: 'record a purchase' },
  RECORD_PAYMENT: { rw: 'kwandika ubwishyu', en: 'record a payment' },
  SHOW_CUSTOMER_DEBT: { rw: 'kureba imyenda y\'abakiriya', en: 'show customer debts' },
};

function choiceQuestion(dominant: NluLanguage, options: string[]): string {
  const [first, second] = options;
  return phrase(
    dominant,
    `Urashaka ${first} cyangwa ${second}?`,
    `Do you want to ${first} or ${second}?`,
    `Voulez-vous ${first} ou ${second} ?`,
  );
}

/**
 * Generate clarification question when intent is uncertain — the agent asks
 * instead of guessing (requirement: "never invent meaning").
 */
function generateClarification(
  intent: IntentDetection,
  dominant: NluLanguage = 'rw',
  unresolved: EntityType[] = [],
): Clarification {
  if (intent.intent === 'UNKNOWN') {
    return {
      question: phrase(
        dominant,
        'Sinabyumvise neza. Ongera ubivuge.',
        'I didn\'t understand well. Please say it again.',
        'Je n\'ai pas bien compris. Répétez s\'il vous plaît.',
      ),
      reason: 'unknown_intent',
    };
  }

  if (unresolved.includes('reference')) {
    return {
      question: phrase(
        dominant,
        'Sinazi imbaho uvuga. Fata ifoto y\'imbaho mbere, hanyuma ubaze umubare cyangwa agaciro.',
        'I don\'t know which boards you mean. Scan the boards first, then ask for the count or the value.',
        'Je ne sais pas de quelles planches vous parlez. Scannez d\'abord.',
      ),
      reason: 'unresolved_reference',
    };
  }

  const optionIds = intent.candidates.slice(0, 2).map(c => c.intent);
  const labels = optionIds.map(id => INTENT_PHRASES[id]?.[dominant === 'en' ? 'en' : 'rw'] ?? id);

  if (labels.length >= 2) {
    return { question: choiceQuestion(dominant, labels), options: optionIds as string[], reason: intent.ambiguous ? 'ambiguous_intent' : 'low_confidence' };
  }

  return {
    question: phrase(
      dominant,
      'Sinabyumvise neza. Ongera ubivuge.',
      'I didn\'t understand well. Please say it again.',
      'Je n\'ai pas bien compris. Répétez s\'il vous plaît.',
    ),
    options: optionIds as string[],
    reason: intent.ambiguous ? 'ambiguous_intent' : 'low_confidence',
  };
}

/**
 * Build the pipeline trace for debugging and testing.
 */
function buildTrace(
  language: LanguageDetection,
  normalization: NormalizedUtterance,
  intent: IntentDetection,
  entities: Entity[],
  context: ContextResolution,
  action: ActionDescriptor | null,
): PipelineTrace {
  return {
    step1LanguageDetection: `language=${language.language}, dominant=${language.dominant}, confidence=${language.confidence}, mixed=${language.mixed}`,
    step2Normalization: `tokens=${normalization.tokens.join(',')}, stems=${normalization.stems.join(',')}, repairs=${normalization.repairs.length}`,
    step3IntentDetection: `intent=${intent.intent}, confidence=${intent.confidence}, candidates=${intent.candidates.length}, ambiguous=${intent.ambiguous}`,
    step4EntityExtraction: `entities=${entities.length}, types=${entities.map(e => e.type).join(',')}`,
    step5ContextResolution: `kind=${context.kind}, inherited=${context.inherited.length}, notes=${context.notes.join(';')}`,
    step6Action: action ? `action=${action.action}, tool=${action.tool}, target=${action.target}` : 'no_action',
  };
}

/**
 * Main NLU pipeline: understand a user utterance.
 *
 * Pipeline (no Kinyarwanda → English translation):
 *   User input → Language detection → Kinyarwanda normalization →
 *   Intent detection → Entity extraction → Context resolution → Action
 */
export function understand(
  rawInput: string,
  options: UnderstandOptions = {},
): Understanding {
  const lexicon = new SemanticLexicon(BUILTIN_LEXICON, ganzaVocabulary);

  // Conversation context: explicit (stateless callers/tests) or the remembered session.
  const context = options.context ?? (options.ephemeral
    ? undefined
    : sessionStore.get(options.sessionId ?? 'default', {
      ...(options.businessId ? { businessId: options.businessId } : {}),
      ...(options.userId ? { userId: options.userId } : {}),
      ...(options.screen ? { screen: options.screen } : {}),
      ...(options.screenState ? { screenState: options.screenState } : {}),
    }));

  // Step 1: Language detection (never translation)
  const language = detectLanguage(rawInput);

  // Step 2: Kinyarwanda normalization
  const normalized = normalizeUtterance(rawInput, lexicon);

  // Step 3: Intent detection (semantics) — then screen context may disambiguate
  // a weak/short command ("fata" on the camera screen means scan the wood).
  const intent = applyScreenContext(detectIntent(normalized.tokens, normalized.stems, lexicon), context);

  // Step 4: Entity extraction
  const entities = extractEntities(normalized.tokens, normalized.stems, normalized.normalized);

  // Step 5: Context resolution — carry over / resolve references
  const contextResolution = resolveContext(entities, context, normalized.tokens, normalized.stems);

  // Everything the agent knows for this turn: spoken now + remembered.
  const resolvedEntities = withInheritedEntities(entities, contextResolution);

  // Compute the value when quantity and unit price are both known.
  if (intent.intent === 'CALCULATE_VALUE' || intent.intent === 'COUNT_WOOD') {
    const totalValue = deriveTotalValue(resolvedEntities);
    if (totalValue && numberEntity(resolvedEntities, 'totalValue') === undefined) resolvedEntities.push(totalValue);
  }

  // Step 6: Action mapping
  const action = INTENT_TO_ACTION[intent.intent] ?? null;

  // Never invent meaning: unknown, ambiguous, low confidence or an unresolvable reference.
  const needsClarification =
    intent.intent === 'UNKNOWN' ||
    intent.ambiguous ||
    intent.confidence < 0.3 ||
    contextResolution.kind === 'unresolved_reference';

  const clarification = needsClarification
    ? generateClarification(intent, language.dominant, contextResolution.unresolved)
    : undefined;

  // Respond in the user's language (Kinyarwanda in, Kinyarwanda out).
  const response = needsClarification && clarification
    ? clarification.question
    : generateResponse(intent.intent, language.dominant, resolvedEntities);

  // Build trace
  const trace = buildTrace(language, normalized, intent, resolvedEntities, contextResolution, action);

  const confidence = needsClarification
    ? Math.min(intent.confidence, 0.3)
    : intent.confidence;

  const understanding: Understanding = {
    utterance: rawInput,
    language,
    normalization: normalized,
    intent,
    entities: resolvedEntities,
    context: contextResolution,
    action,
    needsClarification,
    clarification,
    response,
    confidence: Number(confidence.toFixed(3)),
    trace,
  };

  // Remember this turn so the next command can be short ("Noneho uzibarire").
  if (context && !options.ephemeral) {
    rememberTurn(context, understanding, rawInput);
    sessionStore.set(context);
  }

  return understanding;
}

/** Utterance entities merged with the inherited ones (what was said wins). */
function withInheritedEntities(entities: Entity[], resolution: ContextResolution): Entity[] {
  const merged = [...entities];
  for (const inherited of resolution.inherited) {
    if (merged.some(e => e.type === inherited.type)) continue;
    merged.push({ ...inherited, origin: 'context' });
  }
  return merged;
}

/** quantity × unit price — only when both numbers are actually known. */
function deriveTotalValue(entities: Entity[]): Entity | undefined {
  const quantity = numberEntity(entities, 'quantity');
  const unitPrice = numberEntity(entities, 'unitPrice');
  if (quantity === undefined || unitPrice === undefined) return undefined;
  return {
    type: 'totalValue',
    value: quantity * unitPrice,
    raw: `${quantity} × ${unitPrice}`,
    confidence: 0.9,
    origin: 'context',
  };
}

/** What the agent now knows about the wood in front of the user. */
function woodFromEntities(entities: Entity[]): ConversationContext['lastDetectedWood'] | undefined {
  const quantity = numberEntity(entities, 'quantity');
  const unitPrice = numberEntity(entities, 'unitPrice');
  const value = numberEntity(entities, 'totalValue');
  const species = entities.find(e => e.type === 'species')?.value;
  const wood = {
    ...(quantity !== undefined ? { quantity } : {}),
    ...(unitPrice !== undefined ? { unitPrice } : {}),
    ...(value !== undefined ? { value } : {}),
    ...(species ? { species: String(species) } : {}),
  };
  return Object.keys(wood).length > 0 ? wood : undefined;
}

/** Persist the turn: intent, entities, the detected wood and any pending question. */
function rememberTurn(context: ConversationContext, understanding: Understanding, raw: string): void {
  const wood = woodFromEntities(understanding.entities);
  context.turns += 1;
  context.lastIntent = understanding.intent.intent;
  context.lastEntities = understanding.entities;
  context.lastAction = understanding.action?.action;
  context.lastUtterance = raw;
  context.language = understanding.language.dominant;
  context.pendingClarification = understanding.clarification;
  if (wood) context.lastDetectedWood = { ...(context.lastDetectedWood ?? {}), ...wood };
  context.updatedAt = new Date().toISOString();
}

/**
 * Voice command pipeline: speech-to-text hypotheses → understanding.
 *
 * Microphone → speech-to-text → Kinyarwanda language detection → Kinyarwanda
 * understanding → intent → action. Kinyarwanda is understood directly from the
 * hypotheses; it is never translated to English first. When speech-to-text returns
 * several candidates, the agent picks the one it actually understands, preferring
 * the Kinyarwanda hypothesis (Rwandan pronunciation + mixed Kinyarwanda/English).
 */
export function understandVoice(
  hypotheses: string[],
  options: UnderstandOptions = {},
): VoiceCommandResult {
  const candidates = (hypotheses ?? []).map(h => String(h ?? '').trim()).filter(Boolean);
  if (candidates.length === 0) {
    return { ok: false, status: 'NOT_SUPPORTED', error: 'No speech hypotheses provided' };
  }

  // Language detection on the hypotheses themselves (no translation step).
  const language = detectSpeechLanguage(candidates);

  // Understand every hypothesis, then keep the best interpretation.
  const evaluated = candidates.map(text => ({
    text,
    understanding: understand(text, { ...options, ephemeral: true }),
    detection: detectLanguage(text),
  }));

  evaluated.sort((a, b) => {
    const understoodA = a.understanding.intent.intent !== 'UNKNOWN' ? 1 : 0;
    const understoodB = b.understanding.intent.intent !== 'UNKNOWN' ? 1 : 0;
    if (understoodA !== understoodB) return understoodB - understoodA;
    if (b.understanding.language.kinyarwandaRatio !== a.understanding.language.kinyarwandaRatio) {
      return b.understanding.language.kinyarwandaRatio - a.understanding.language.kinyarwandaRatio;
    }
    if (b.understanding.confidence !== a.understanding.confidence) {
      return b.understanding.confidence - a.understanding.confidence;
    }
    return b.detection.confidence - a.detection.confidence;
  });

  const best = evaluated[0];

  // Re-run the winner so the conversation session is updated exactly once.
  const understanding = options.ephemeral
    ? best.understanding
    : understand(best.text, options);

  return {
    ok: true,
    status: understanding.needsClarification ? 'CLARIFICATION_REQUIRED' : 'UNDERSTOOD',
    transcript: best.text,
    language,
    understanding,
  };
}

/**
 * Extend the GANZA business vocabulary at runtime (no code changes, no retraining).
 * New terms immediately participate in normalization, language detection,
 * intent detection and entity extraction.
 */
export function extendVocabulary(terms: VocabularyTerm[]): number {
  const accepted = ganzaVocabulary.extend(terms ?? []);
  if (accepted > 0) ganzaLexicon.addVocabulary(ganzaVocabulary);
  return accepted;
}

/** Extend the semantic lexicon with new entries (surfaces, roots, concepts). */
export function extendLexicon(entries: Parameters<SemanticLexicon['extend']>[0]): number {
  return ganzaLexicon.extend(entries ?? []);
}

/**
 * Get the action descriptor for an intent.
 */
export function getAction(intentId: IntentId): ActionDescriptor | undefined {
  return INTENT_TO_ACTION[intentId];
}

/**
 * Get all registered intents.
 */
export function getRegisteredIntents(): IntentId[] {
  return INTENT_IDS;
}

// Re-export for convenience
export type { Understanding, IntentDetection, Entity, ContextResolution, ActionDescriptor, LanguageDetection, VoiceCommandResult, Clarification };
export { detectLanguage, detectSpeechLanguage };
export { normalizeUtterance, stemToken, repairToken, fuzzyEqual } from './normalizer.js';
export { SemanticLexicon, BUILTIN_LEXICON, ganzaLexicon } from './lexicon.js';
export { ganzaVocabulary } from './vocabulary.js';
export { parseNextNumber, extractNumberOccurrences } from './numerals.js';
export { detectIntent as detectIntentFromRules, collectConceptHits } from './intentDetector.js';
export { INTENT_RULES, INTENT_IDS } from './intents.js';
export type { IntentId, ConceptId, NluLanguage, DetectedLanguage } from './types.js';