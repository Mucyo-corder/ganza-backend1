/**
 * Testing Repository — TestCase + TestRun persistence
 * Uses Firestore when configured, falls back to in-memory for dev
 */
import { getFirestoreDb } from '../config/firebase.ts';
import { TestCase, TestRun } from '../testing/TestModels.ts';
import { logger } from '../utils/logger.ts';

const MEM = {
  cases: new Map<string, TestCase>(),
  runs: new Map<string, TestRun>(),
};

export const TestingRepository = {
  async saveCase(testCase: TestCase): Promise<TestCase> {
    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('ganza_test_cases').doc(testCase.id).set(testCase);
        return testCase;
      } catch (e) {
        logger.warn('Firestore saveCase failed, using memory:', { error: String(e) });
      }
    }
    MEM.cases.set(testCase.id, testCase);
    return testCase;
  },

  async getCases(businessId?: string): Promise<TestCase[]> {
    const db = getFirestoreDb();
    if (db) {
      try {
        const snap = await db.collection('ganza_test_cases').get();
        const items = snap.docs.map(d => d.data() as TestCase);
        return businessId ? items.filter(c => (c as any).businessId === businessId) : items;
      } catch {}
    }
    return Array.from(MEM.cases.values());
  },

  async getCase(id: string): Promise<TestCase | null> {
    const db = getFirestoreDb();
    if (db) {
      try {
        const doc = await db.collection('ganza_test_cases').doc(id).get();
        if (doc.exists) return doc.data() as TestCase;
      } catch {}
    }
    return MEM.cases.get(id) ?? null;
  },

  async saveRun(run: TestRun): Promise<TestRun> {
    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('ganza_test_runs').doc(run.id).set(run);
        return run;
      } catch (e) {
        logger.warn('Firestore saveRun failed, using memory:', { error: String(e) });
      }
    }
    MEM.runs.set(run.id, run);
    return run;
  },

  async getRuns(testId?: string): Promise<TestRun[]> {
    const db = getFirestoreDb();
    if (db) {
      try {
        const snap = await db.collection('ganza_test_runs').orderBy('startedAt', 'desc').limit(50).get();
        const items = snap.docs.map(d => d.data() as TestRun);
        return testId ? items.filter(r => r.testId === testId) : items;
      } catch {}
    }
    const all = Array.from(MEM.runs.values());
    return testId ? all.filter(r => r.testId === testId) : all;
  },

  async getRun(id: string): Promise<TestRun | null> {
    const db = getFirestoreDb();
    if (db) {
      try {
        const doc = await db.collection('ganza_test_runs').doc(id).get();
        if (doc.exists) return doc.data() as TestRun;
      } catch {}
    }
    return MEM.runs.get(id) ?? null;
  },
};
