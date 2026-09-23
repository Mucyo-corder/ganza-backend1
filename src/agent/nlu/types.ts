/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GANZA Kinyarwanda-Native NLU — Core Types
 *
 * Pipeline (hard requirement — no Kinyarwanda → English translation step):
 *   User input
 *   → Language detection
 *   → Kinyarwanda normalization
 *   → Intent detection (semantics)
 *   → Entity extraction
 *   → Context resolution
 *   → Action
 */

/** Languages the agent can understand natively. */
export type NluLanguage = 'rw' | 'en' | 'fr';

/** Language label produced by the detector — includes mixed Kinyarwanda/English speech. */
export type DetectedLanguage = NluLanguage | 'mixed' | 'unknown';

export interface LanguageToken {
  token: string;
  language: NluLanguage | 'other';
}

export interface LanguageDetection {
  /** Detected label, e.g. "rw" or "mixed". */
  language: DetectedLanguage;
  /** Language to answer in (dominant language of the utterance). */
  dominant: NluLanguage;
  /** 0..1 — how sure the detector is. */
  confidence: number;
  /** Per-language token scores. */
  scores: Record<NluLanguage, number>;
  /** True when Kinyarwanda and another language are both significantly present. */
  mixed: boolean;
  kinyarwandaRatio: number;
  tokens: LanguageToken[];
}

/** Semantic concept ids (language independent meaning — NOT English keywords). */
export type ConceptId = string;

export interface NormalizedUtterance {
  raw: string;
  /** Lowercased, apostrophe/diacritic-normalized, contractions expanded. */
  normalized: string;
  /** Content tokens (fillers removed, number words converted to digits). */
  tokens: string[];
  /** Morphological stems per token (Kinyarwanda affixes stripped). */
  stems: string[];
  /** Tokens replaced by normalization: spelling variants, digits, contractions. */
  repairs: NormRepair[];
  language: LanguageDetection;
}

export interface NormRepair {
  from: string;
  to: string;
  reason: 'contraction' | 'spelling_variant' | 'numeral' | 'diacritic' | 'apostrophe' | 'case';
}

/** Canonical intent ids understood by the GANZA agent. */
export type IntentId =
  | 'OPEN_CAMERA'
  | 'SCAN_WOOD'
  | 'COUNT_WOOD'
  | 'CALCULATE_VALUE'
  | 'SAVE_TO_STOCK'
  | 'ADJUST_STOCK'
  | 'SHOW_INVENTORY'
  | 'LOW_STOCK_CHECK'
  | 'SEARCH_ITEM'
  | 'SHOW_REPORT'
  | 'RECORD_SALE'
  | 'RECORD_PURCHASE'
  | 'RECORD_PAYMENT'
  | 'RECORD_EXPENSE'
  | 'SHOW_CUSTOMER_DEBT'
  | 'MEASURE_WOOD'
  | 'SET_PRICE'
  | 'OPEN_SCREEN'
  | 'EDIT_ENTITY'
  | 'CONTINUE_TASK'
  | 'REPEAT_LAST'
  | 'CANCEL_TASK'
  | 'CONFIRM_ACTION'
  | 'SHOW_LAST_RESULT'
  | 'ASK_HELP'
  | 'GREETING'
  | 'CORRECT_ENTITY'
  | 'UNKNOWN';

export interface ConceptHit {
  concept: ConceptId;
  token: string;
  surface: string;
  /** Lexicon entry id that produced the hit (useful for debugging / expansion). */
  entry: string;
  weight: number;
  match: 'exact' | 'stem' | 'fuzzy' | 'phrase';
}

export interface IntentCandidate {
  intent: IntentId;
  score: number;
  confidence: number;
  hits: ConceptHit[];
  /** Human readable reason, used for clarification wording and debugging. */
  reasoning: string;
  /**
   * True when the intent came from a natural short form (topic-only match or a
   * topic fallback) rather than a full semantic match — the agent may re-rank
   * these with screen/conversation context.
   */
  topicOnly?: boolean;
}

export interface IntentDetection {
  intent: IntentId;
  confidence: number;
  hits: ConceptHit[];
  candidates: IntentCandidate[];
  /** True when two intents are too close to choose safely. */
  ambiguous: boolean;
  ambiguity?: { between: IntentId[]; reason: string };
  /** True when the sentence had no actionable semantics. */
  unknown: boolean;
  reasoning: string;
}

export type EntityType =
  | 'quantity'
  | 'unitPrice'
  | 'totalValue'
  | 'money'
  | 'species'
  | 'woodType'
  | 'dimensions'
  | 'length'
  | 'width'
  | 'thickness'
  | 'volume'
  | 'location'
  | 'customerName'
  | 'supplierName'
  | 'dateRange'
  | 'filter'
  | 'unit'
  | 'reference'
  | 'screen'
  | 'correction'
  | 'searchQuery'
  | 'percent';

export interface Entity {
  type: EntityType;
  value: string | number | boolean | Record<string, unknown>;
  raw: string;
  confidence: number;
  /** Where the value came from — utterance text or the running context. */
  origin: 'utterance' | 'context';
}

export type ContextResolutionKind =
  | 'none'
  | 'carried_over_entities'
  | 'resolved_reference'
  | 'short_command'
  | 'correction'
  | 'unresolved_reference';

export interface ContextResolution {
  kind: ContextResolutionKind;
  sessionId: string;
  /** Human readable explanation of what was pulled from context. */
  notes: string[];
  /** Entities inherited from the conversation (never invented). */
  inherited: Entity[];
  /** Entity types that could not be resolved from context. */
  unresolved: EntityType[];
}

export interface Understanding {
  utterance: string;
  language: LanguageDetection;
  normalization: NormalizedUtterance;
  intent: IntentDetection;
  entities: Entity[];
  context: ContextResolution;
  action: ActionDescriptor | null;
  /** True when the agent must ask before acting ("never invent meaning"). */
  needsClarification: boolean;
  clarification?: Clarification;
  /** Response text in the user's language (rw / en / fr). */
  response: string;
  /** Confidence that the whole interpretation is correct. */
  confidence: number;
  /** Step by step pipeline trace — used by tests & telemetry. */
  trace: PipelineTrace;
}

export interface PipelineTrace {
  step1LanguageDetection: string;
  step2Normalization: string;
  step3IntentDetection: string;
  step4EntityExtraction: string;
  step5ContextResolution: string;
  step6Action: string;
}

export interface Clarification {
  question: string;
  options?: string[];
  reason: 'unknown_intent' | 'ambiguous_intent' | 'missing_entity' | 'unresolved_reference' | 'low_confidence';
}

export interface ConversationContext {
  sessionId: string;
  businessId?: string;
  userId?: string;
  /** Screen the user is on: camera, inventory, sales, reports, dashboard... */
  screen?: string;
  language?: NluLanguage;
  turns: number;
  lastIntent?: IntentId;
  lastEntities: Entity[];
  lastAction?: string;
  lastUtterance?: string;
  /** Entities the user explicitly confirmed / saved (e.g. after a scan). */
  lastDetectedWood?: {
    species?: string;
    quantity?: number;
    unitPrice?: number;
    value?: number;
    dimensions?: Record<string, number>;
  };
  pendingClarification?: Clarification;
  /** Free-form app state the caller may attach (selected item, open modal...). */
  screenState?: Record<string, unknown>;
  updatedAt: string;
}

export interface UnderstandOptions {
  sessionId?: string;
  businessId?: string;
  userId?: string;
  screen?: string;
  screenState?: Record<string, unknown>;
  /** Explicit session context (bypasses the store, used by tests / stateless calls). */
  context?: ConversationContext;
  /** Do not write session updates (read-only understanding). */
  ephemeral?: boolean;
}

export interface NluVocabularySnapshot {
  version: string;
  concepts: number;
  lexiconEntries: number;
  intents: IntentId[];
  businessTerms: { term: string; concepts: ConceptId[]; languages: NluLanguage[] }[];
  species: string[];
}

export interface NluHealth {
  ok: boolean;
  version: string;
  supportedLanguages: NluLanguage[];
  supportedIntents: IntentId[];
  vocabularySize: number;
  lexiconSize: number;
  metrics: Record<string, number>;
}

export interface VoiceCommandResult {
  ok: boolean;
  /** Honest status when speech-to-text is not configured for this deployment. */
  status: 'UNDERSTOOD' | 'NOT_SUPPORTED' | 'CLARIFICATION_REQUIRED';
  transcript?: string;
  /** Language detected on the speech hypotheses (Kinyarwanda is never translated first). */
  language?: LanguageDetection;
  understanding?: Understanding;
  error?: string;
}

/** Action descriptor: intent → GANZA action (device/tool/planning contract). */
export interface ActionDescriptor {
  intent: IntentId;
  /** Canonical machine action name, e.g. OPEN_CAMERA. */
  action: string;
  tool: string;
  target: string;
  device: 'phone' | 'desktop' | 'cloud' | 'any';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresConfirmation: boolean;
  /** Informational actions (help / greeting / clarification) never create a device task. */
  informational: boolean;
  /** Canonical, language-neutral goal the planner can decompose. */
  canonicalGoal: string;
  expectedResult: string;
  verificationStrategy: 'ui_state' | 'ocr' | 'dom' | 'file_exists' | 'tool_result' | 'notification' | 'manual';
}
