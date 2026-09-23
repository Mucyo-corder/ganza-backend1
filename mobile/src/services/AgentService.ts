/**
 * AgentService — JS bridge to backend /api/agent and native AgentBridge
 * Hard rule: never return fake success
 */
import { NativeModules, Platform } from 'react-native';
import { getAuth } from 'firebase/auth';

const { GanzaAgent } = NativeModules as any;

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function authHeaders(): Promise<HeadersInit> {
  // Try Firebase auth token if available, else anonymous
  try {
    const auth: any = getAuth();
    const token = await auth.currentUser?.getIdToken?.();
    if (token) return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  } catch {}
  return { 'Content-Type': 'application/json' };
}

export const AgentService = {
  async getCapabilities(): Promise<{ accessibilityEnabled: boolean; notificationEnabled: boolean; status: string }> {
    if (Platform.OS !== 'android' || !GanzaAgent) {
      return { accessibilityEnabled: false, notificationEnabled: false, status: 'NOT_SUPPORTED' };
    }
    try {
      const res = await GanzaAgent.getCapabilityStatus();
      return { accessibilityEnabled: res.accessibilityEnabled, notificationEnabled: res.notificationEnabled, status: res.accessibilityStatus };
    } catch (e) {
      return { accessibilityEnabled: false, notificationEnabled: false, status: `WAITING_PERMISSION: ${String(e)}` };
    }
  },

  async createTask(task: { goal: { description: string; expectedResult: string; verificationStrategy?: string; maxSteps?: number; timeoutMs?: number }; device?: string; target?: string; policy?: any }): Promise<any> {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE}/api/agent/tasks`, { method: 'POST', headers, body: JSON.stringify(task) });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Agent createTask failed ${res.status}: ${txt}`);
    }
    return res.json();
  },

  async getTask(id: string): Promise<any> {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE}/api/agent/tasks/${id}`, { headers });
    if (!res.ok) throw new Error(`getTask ${res.status}`);
    return res.json();
  },

  async getEvidence(id: string): Promise<any> {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE}/api/agent/tasks/${id}/evidence`, { headers });
    if (!res.ok) throw new Error(`getEvidence ${res.status}`);
    return res.json();
  },
};

export const TestingService = {
  async createCase(data: any): Promise<any> {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE}/api/testing/cases`, { method: 'POST', headers, body: JSON.stringify(data) });
    if (!res.ok) throw new Error(`createCase ${res.status}: ${await res.text()}`);
    return res.json();
  },
  async listCases(): Promise<any[]> {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE}/api/testing/cases`, { headers });
    if (!res.ok) throw new Error(`listCases ${res.status}`);
    return res.json();
  },
  async runCase(id: string): Promise<any> {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE}/api/testing/cases/${id}/run`, { method: 'POST', headers });
    if (!res.ok) throw new Error(`runCase ${res.status}: ${await res.text()}`);
    return res.json();
  },
  async getRun(id: string): Promise<any> {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE}/api/testing/runs/${id}`, { headers });
    if (!res.ok) throw new Error(`getRun ${res.status}`);
    return res.json();
  },
  async listRuns(testId?: string): Promise<any[]> {
    const headers = await authHeaders();
    const url = testId ? `${API_BASE}/api/testing/runs?testId=${testId}` : `${API_BASE}/api/testing/runs`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`listRuns ${res.status}`);
    return res.json();
  },
};
