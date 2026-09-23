export interface DeviceInfo {
  deviceId: string;
  type: 'phone' | 'desktop' | 'cloud';
  label: string;
  online: boolean;
  capabilities: string[];
  permissions: Record<string, boolean>;
  agentVersion?: string;
  lastSeen: string;
  health: 'healthy' | 'degraded' | 'offline';
}

export class DeviceRegistry {
  private devices: Map<string, DeviceInfo> = new Map();

  register(info: DeviceInfo) {
    this.devices.set(info.deviceId, { ...info, lastSeen: new Date().toISOString() });
  }

  heartbeat(deviceId: string, patch: Partial<DeviceInfo>) {
    const cur = this.devices.get(deviceId);
    if (!cur) return;
    this.devices.set(deviceId, { ...cur, ...patch, lastSeen: new Date().toISOString() });
  }

  get(deviceId: string): DeviceInfo | undefined {
    return this.devices.get(deviceId);
  }

  getAll(): DeviceInfo[] {
    return Array.from(this.devices.values());
  }

  getOnline(): DeviceInfo[] {
    return this.getAll().filter(d => d.online && d.health !== 'offline');
  }

  remove(deviceId: string) {
    this.devices.delete(deviceId);
  }
}
