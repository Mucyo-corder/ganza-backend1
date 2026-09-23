/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GANZA Kinyarwanda-Native NLU — HTTP Controller
 *
 * Provides endpoints for:
 *   - POST /api/nlu/understand — Understand a text utterance
 *   - POST /api/nlu/voice — Process voice command hypotheses
 *   - GET /api/nlu/vocabulary — Get current vocabulary snapshot
 *   - POST /api/nlu/vocabulary — Extend vocabulary at runtime
 *   - GET /api/nlu/intents — List all registered intents
 *   - GET /api/nlu/health — NLU health check
 */

import { Request, Response } from 'express';
import {
  understand,
  understandVoice,
  extendVocabulary,
  extendLexicon,
  getRegisteredIntents,
  getAction,
  getSession,
  resetSession,
  ganzaVocabulary,
} from '../agent/nlu/understand.js';
import type { VocabularyTerm } from '../agent/nlu/vocabulary.js';
import type { ConversationContext } from '../agent/nlu/types.js';
import { logger } from '../utils/logger.js';

export const NLUController = {
  /**
   * POST /api/nlu/understand
   * Body: { text: string, context?: ConversationContext, screen?: string }
   * Returns the full understanding pipeline result.
   */
  async understand(req: Request, res: Response) {
    try {
      const { text, context, screen, sessionId, businessId, userId, screenState } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "text" field' });
      }

      const options: ConversationContext = {
        sessionId: sessionId ?? 'default',
        businessId: businessId ?? 'default',
        userId: userId ?? 'anon',
        screen: screen ?? 'default',
        screenState: screenState ?? {},
        language: undefined,
        turns: 0,
        lastEntities: [],
        updatedAt: new Date().toISOString(),
      };

      // Merge provided context if any
      if (context) {
        Object.assign(options, context);
      }

      const understanding = understand(text, { context: options });

      logger.info('NLU understand', {
        utterance: text.substring(0, 50),
        intent: understanding.intent.intent,
        confidence: understanding.confidence,
        language: understanding.language.dominant,
      });

      res.json(understanding);
    } catch (error) {
      logger.error('NLU understand error', { error: String(error) });
      res.status(500).json({ error: 'NLU processing failed', details: String(error) });
    }
  },

  /**
   * POST /api/nlu/voice
   * Body: { hypotheses: string[], context?: ConversationContext }
   * Returns the understanding from the best speech hypothesis.
   */
  async voice(req: Request, res: Response) {
    try {
      const { hypotheses, context, sessionId, businessId } = req.body;

      if (!hypotheses || !Array.isArray(hypotheses) || hypotheses.length === 0) {
        return res.status(400).json({ error: 'Missing or invalid "hypotheses" array' });
      }

      const options: ConversationContext = {
        sessionId: sessionId ?? 'default',
        businessId: businessId ?? 'default',
        userId: 'anon',
        language: undefined,
        turns: 0,
        lastEntities: [],
        updatedAt: new Date().toISOString(),
      };

      if (context) Object.assign(options, context);

      const result = understandVoice(hypotheses, { context: options });

      logger.info('NLU voice', {
        status: result.status,
        transcript: result.transcript?.substring(0, 50),
        intent: result.understanding?.intent.intent,
      });

      res.json(result);
    } catch (error) {
      logger.error('NLU voice error', { error: String(error) });
      res.status(500).json({ error: 'Voice processing failed', details: String(error) });
    }
  },

  /**
   * GET /api/nlu/vocabulary
   * Returns the current GANZA vocabulary snapshot.
   */
  async vocabulary(_req: Request, res: Response) {
    try {
      const snapshot = ganzaVocabulary.snapshot();
      res.json(snapshot);
    } catch (error) {
      logger.error('NLU vocabulary error', { error: String(error) });
      res.status(500).json({ error: 'Failed to get vocabulary', details: String(error) });
    }
  },

  /**
   * POST /api/nlu/vocabulary
   * Body: { terms: VocabularyTerm[] }
   * Extends the vocabulary at runtime.
   */
  async extendVocabulary(req: Request, res: Response) {
    try {
      const { terms } = req.body;

      if (!terms || !Array.isArray(terms)) {
        return res.status(400).json({ error: 'Missing or invalid "terms" array' });
      }

      const count = extendVocabulary(terms);
      res.json({ added: count, total: ganzaVocabulary.size() });
    } catch (error) {
      logger.error('NLU extend vocabulary error', { error: String(error) });
      res.status(500).json({ error: 'Failed to extend vocabulary', details: String(error) });
    }
  },

  /**
   * GET /api/nlu/intents
   * Returns all registered intents and their action mappings.
   */
  async intents(_req: Request, res: Response) {
    try {
      const intentIds = getRegisteredIntents();
      const intents = intentIds.map(id => ({
        id,
        action: getAction(id),
      }));
      res.json({ intents, count: intents.length });
    } catch (error) {
      logger.error('NLU intents error', { error: String(error) });
      res.status(500).json({ error: 'Failed to get intents', details: String(error) });
    }
  },

  /**
   * GET /api/nlu/health
   * Returns NLU health status.
   */
  async health(_req: Request, res: Response) {
    try {
      res.json({
        ok: true,
        version: ganzaVocabulary.snapshot().version,
        vocabularySize: ganzaVocabulary.size(),
        intents: getRegisteredIntents().length,
        primaryLanguage: 'rw (Ikinyarwanda)',
        pipeline: 'Language Detection → Normalization → Intent Detection → Entity Extraction → Context Resolution → Action',
        noTranslationStep: true,
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: String(error) });
    }
  },
};