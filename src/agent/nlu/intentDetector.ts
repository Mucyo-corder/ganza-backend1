/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GANZA Kinyarwanda-Native NLU — Step 3: Semantic intent detection
 *
 * Meaning is matched through concepts + Kinyarwanda morphology + fuzzy tolerance.
 * There is deliberately no "translate to English then match keywords" step:
 * "uzibarire", "bara", "barura" and "count them" all reach the COUNT concept.
 */

import { ganzaLexicon, type SemanticLexicon } from './lexicon.js';
import { INTENT_RULES, type IntentRule } from './intents.js';
import { fuzzyEqual, fuzzyTokenEqual } from './normalizer.js';
import type { ConceptHit, IntentCandidate, IntentDetection, IntentId } from './types.js';

const MATCH_WEIGHT: Record<ConceptHit['match'], number> = {
  exact: 1,
  phrase: 1.05,
  stem: 0.95,
  fuzzy: 0.8,
};

/** Collect semantic concept hits from a normalized token stream. */
export function collectConceptHits(
  tokens: string[],
  stems: string[],
  lexicon: SemanticLexicon = ganzaLexicon,
): ConceptHit[] {
  const hits: ConceptHit[] = [];
  const covered: boolean[] = tokens.map(() => false);
  const suppressed = new Set<string>(); // `${tokenIndex}:${concept}`

  // 1. Multi-word phrases first ("bika muri stock", "ongera uvuge", "uyu munsi").
  const maxPhrase = lexicon.maxPhraseLength();
  for (let n = maxPhrase; n >= 2; n--) {
    for (let i = 0; i + n <= tokens.length; i++) {
      if (covered.slice(i, i + n).some(Boolean)) continue;
      const phrase = tokens.slice(i, i + n).join(' ');
      const entries = lexicon.lookupSurface(phrase);
      if (entries.length === 0) continue;
      for (const entry of entries) {
        for (const concept of entry.concepts) {
          hits.push({
            concept,
            token: phrase,
            surface: phrase,
            entry: entry.id,
            weight: (entry.weight ?? 1) * MATCH_WEIGHT.phrase,
            match: 'phrase',
          });
        }
        for (const negated of entry.negates ?? []) suppressed.add(`${i}:${negated}`);
      }
      for (let k = i; k < i + n; k++) covered[k] = true;
    }
  }

  // 2. Single tokens: exact surface → stem root → fuzzy (morphology aware).
  for (let i = 0; i < tokens.length; i++) {
    if (covered[i]) continue;
    const token = tokens[i];
    const stem = stems[i] ?? token;

    const exact = lexicon.lookupSurface(token);
    for (const entry of exact) {
      for (const concept of entry.concepts) {
        hits.push({
          concept,
          token,
          surface: token,
          entry: entry.id,
          weight: (entry.weight ?? 1) * MATCH_WEIGHT.exact,
          match: 'exact',
        });
      }
      for (const negated of entry.negates ?? []) suppressed.add(`${i}:${negated}`);
    }
    if (exact.some(e => e.exclusive)) continue;

    const stemEntries = stem !== token ? lexicon.lookupRoot(stem) : [];
    for (const entry of stemEntries) {
      for (const concept of entry.concepts) {
        hits.push({
          concept,
          token,
          surface: stem,
          entry: entry.id,
          weight: (entry.weight ?? 1) * MATCH_WEIGHT.stem,
          match: 'stem',
        });
      }
      for (const negated of entry.negates ?? []) suppressed.add(`${i}:${negated}`);
    }
    if (stemEntries.length > 0 || exact.length > 0) continue;

    // Fuzzy tolerance for typos and dialectal spelling (strict: see fuzzyTokenEqual).
    const candidates = lexicon.fuzzySurfaceCandidates(token);
    for (const surface of candidates) {
      // Never invent meaning: the typo must be a close, plausible misspelling.
      if (!fuzzyTokenEqual(token, surface)) continue;
      for (const entry of lexicon.lookupSurface(surface)) {
        if (entry.kind === 'filler') continue;
        for (const concept of entry.concepts) {
          hits.push({
            concept,
            token,
            surface,
            entry: entry.id,
            weight: (entry.weight ?? 1) * MATCH_WEIGHT.fuzzy,
            match: 'fuzzy',
          });
        }
      }
    }
  }

  // Drop concepts explicitly negated for the same token position.
  return hits.filter(hit => {
    for (const key of suppressed) {
      const [indexStr, concept] = key.split(':');
      if (hit.concept !== concept) continue;
      if (tokens[Number(indexStr)] === hit.token) return false;
    }
    return true;
  });
}

/** Best weight per concept (used for scoring and entity disambiguation). */
export function conceptWeights(hits: ConceptHit[]): Map<string, number> {
  const weights = new Map<string, number>();
  for (const hit of hits) {
    const current = weights.get(hit.concept) ?? 0;
    if (hit.weight > current) weights.set(hit.concept, hit.weight);
  }
  return weights;
}

export interface DetectIntentOptions {
  /** Minimum score for an intent to be viable (default 1). */
  minScore?: number;
  /** Relative closeness that counts as ambiguous (default 0.85). */
  ambiguityRatio?: number;
  /** Below this confidence the pipeline asks for clarification instead of guessing. */
  minConfidence?: number;
}

interface ViableCandidate extends IntentCandidate {
  rule: IntentRule;
  requiredGroupsMatched: number;
  topicOnly: boolean;
}

function groupScore(group: string[], weights: Map<string, number>): number {
  let best = 0;
  for (const concept of group) best = Math.max(best, weights.get(concept) ?? 0);
  return best;
}

/**
 * Score every intent against the semantic concepts found in the utterance.
 * Returns UNKNOWN (not a guess) when nothing is confidently understood.
 */
export function detectIntent(hits: ConceptHit[], options: DetectIntentOptions = {}): IntentDetection {
  const minScore = options.minScore ?? 1;
  const ambiguityRatio = options.ambiguityRatio ?? 0.85;
  const minConfidence = options.minConfidence ?? 0.35;
  const weights = conceptWeights(hits);
  const viable: ViableCandidate[] = [];
  const rejected: string[] = [];

  for (const rule of INTENT_RULES) {
    if (rule.forbidden?.some(concept => weights.has(concept))) {
      rejected.push(`${rule.id}: forbidden concept`);
      continue;
    }

    const groups = rule.required ?? [];
    const matchedGroups = groups.filter(group => groupScore(group, weights) > 0);
    const requiredScore = matchedGroups.reduce((sum, group) => sum + groupScore(group, weights), 0);

    if (groups.length > 0 && matchedGroups.length === groups.length) {
      let score = requiredScore;
      for (const [concept, weight] of Object.entries(rule.optional ?? {})) {
        if (weights.has(concept)) score += weight;
      }
      for (const boost of rule.boosts ?? []) {
        if (boost.when.every(concept => weights.has(concept))) score += boost.weight;
      }
      const reference = groups.length * 1.2 + Object.values(rule.optional ?? {}).reduce((a, b) => a + b, 0) * 0.5;
      const confidence = Math.min(0.99, Math.max(0.35, 0.4 + 0.58 * (score / Math.max(reference, 0.5))));
      viable.push({
        intent: rule.id,
        score: Number(score.toFixed(3)),
        confidence: Number(confidence.toFixed(3)),
        hits: hits.filter(h => [...groups.flat(), ...Object.keys(rule.optional ?? {})].includes(h.concept)),
        reasoning: `matched [${[...new Set(matchedGroups.flat())].join(', ')}]`,
        rule,
        requiredGroupsMatched: matchedGroups.length,
        topicOnly: false,
      });
      continue;
    }

    // Noun-only queries ("stock", "ifoto y'imbaho") — low confidence, still honest.
    const topic = rule.topicOnly;
    if (topic && topic.concepts.every(group => groupScore(group, weights) > 0)) {
      const score = topic.concepts.reduce((sum, group) => sum + groupScore(group, weights), 0);
      viable.push({
        intent: rule.id,
        score: Number(score.toFixed(3)),
        confidence: topic.confidence,
        hits: hits.filter(h => topic.concepts.flat().includes(h.concept)),
        reasoning: `topic-only match [${[...new Set(topic.concepts.flat())].join(', ')}]`,
        rule,
        requiredGroupsMatched: 0,
        topicOnly: true,
      });
      continue;
    }

    // Natural short forms ("kamera", "imbaho", "ongera", "ni iki?") — the meaning
    // still comes from concepts; scored as a topic match so it can never outrank
    // a full semantic match. This is what makes bare Kinyarwanda words understandable
    // without any keyword table.
    const fallbacks = (rule.topicFallbacks ?? []).filter(fallback =>
      !fallback.forbidden?.some(concept => weights.has(concept)) &&
      fallback.concepts.every(group => groupScore(group, weights) > 0),
    );
    if (fallbacks.length > 0) {
      const best = fallbacks[0];
      const score = best.concepts.reduce((sum, group) => sum + groupScore(group, weights), 0);
      viable.push({
        intent: rule.id,
        score: Number(score.toFixed(3)),
        confidence: best.confidence,
        hits: hits.filter(h => best.concepts.flat().includes(h.concept)),
        reasoning: `topic fallback: ${best.label}`,
        rule,
        requiredGroupsMatched: 0,
        topicOnly: true,
      });
      continue;
    }

    if (groups.length > 0) {
      rejected.push(`${rule.id}: missing [${groups.filter(g => groupScore(g, weights) === 0).map(g => g.join('|')).join(' & ')}]`);
    }
  }

  viable.sort((a, b) =>
    (b.score - a.score) ||
    (b.requiredGroupsMatched - a.requiredGroupsMatched) ||
    (b.rule.priority - a.rule.priority),
  );

  const top = viable[0];
  // Full semantic matches must clear the score threshold; natural short forms
  // (topic-only / fallback matches) are gated by their calibrated confidence instead.
  const topPasses = Boolean(top) && (
    top.topicOnly
      ? top.confidence >= minConfidence
      : top.score >= minScore && top.confidence >= minConfidence
  );
  if (!top || !topPasses) {
    return {
      intent: 'UNKNOWN',
      confidence: top?.confidence ?? 0.2,
      hits,
      candidates: viable.map(candidatePublic),
      ambiguous: false,
      unknown: true,
      reasoning: top
        ? `best candidate ${top.intent} below threshold (score ${top.score}, confidence ${top.confidence})`
        : `no intent matched — rejected: ${rejected.slice(0, 6).join('; ')}`,
    };
  }

  const second = viable[1];
  let ambiguous = false;
  let ambiguity: IntentDetection['ambiguity'];
  if (second && !top.topicOnly && !second.topicOnly) {
    const sameSpecificity = (second.rule.required?.length ?? 0) === (top.rule.required?.length ?? 0);
    const priorityGap = Math.abs(top.rule.priority - second.rule.priority);
    if (second.score >= ambiguityRatio * top.score && sameSpecificity && priorityGap <= 3) {
      ambiguous = true;
      ambiguity = {
        between: [top.intent, second.intent],
        reason: `scores too close: ${top.score} vs ${second.score}`,
      };
    }
  }

  return {
    intent: top.intent,
    confidence: top.confidence,
    hits: top.hits,
    candidates: viable.map(candidatePublic),
    ambiguous,
    ambiguity,
    unknown: false,
    reasoning: top.reasoning,
  };
}

function candidatePublic(candidate: ViableCandidate): IntentCandidate {
  return {
    intent: candidate.intent,
    score: candidate.score,
    confidence: candidate.confidence,
    hits: candidate.hits,
    reasoning: candidate.reasoning,
    topicOnly: candidate.topicOnly,
  };
}

