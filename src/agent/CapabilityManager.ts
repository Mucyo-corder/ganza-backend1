export interface Capability {
  id: string;
  name: string;
  deviceType: 'phone' | 'desktop' | 'cloud' | 'any';
  requiredPermission?: string;
  supported: boolean;
  reason?: string;
  testCaseId?: string;
}

export class CapabilityManager {
  private capabilities: Map<string, Capability> = new Map();

  register(cap: Capability) {
    this.capabilities.set(cap.id, cap);
  }

  get(id: string): Capability | undefined {
    return this.capabilities.get(id);
  }

  list(): Capability[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * Hard rule: Do not promise universal control.
   * Each capability must be tested before claiming.
   */
  isSupported(id: string): { supported: boolean; reason: string } {
    const cap = this.capabilities.get(id);
    if (!cap) return { supported: false, reason: `NOT_SUPPORTED: capability "${id}" not registered` };
    if (!cap.supported) return { supported: false, reason: cap.reason ?? 'NOT_SUPPORTED' };
    if (cap.requiredPermission) return { supported: false, reason: `WAITING_PERMISSION: ${cap.requiredPermission} required — not yet tested` };
    return { supported: true, reason: 'Supported and tested' };
  }

  markTested(id: string, supported: boolean, testCaseId: string, reason?: string) {
    const cap = this.capabilities.get(id);
    if (!cap) return;
    cap.supported = supported;
    cap.testCaseId = testCaseId;
    cap.reason = reason;
  }
}
