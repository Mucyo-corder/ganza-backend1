/**
 * WorldState — Current reality model
 * Ganza observes via Perception and updates this state before planning.
 */

export interface DeviceState {
  deviceId: string;
  type: 'phone' | 'desktop' | 'cloud';
  online: boolean;
  screenWidth?: number;
  screenHeight?: number;
  currentApp?: string;
  permissions: Record<string, boolean>;
  lastSeen: string;
}

export interface UIState {
  screenshot?: string;
  uiTree?: unknown;
  ocrText?: string;
  domSnapshot?: unknown;
  timestamp: string;
}

export interface WorldStateSnapshot {
  timestamp: string;
  devices: DeviceState[];
  uiStates: Record<string, UIState>;
  events: unknown[];
  context: Record<string, unknown>;
}

export class WorldState {
  private state: WorldStateSnapshot = {
    timestamp: new Date().toISOString(),
    devices: [],
    uiStates: {},
    events: [],
    context: {},
  };

  update(partial: Partial<WorldStateSnapshot>) {
    this.state = {
      ...this.state,
      ...partial,
      timestamp: new Date().toISOString(),
    };
  }

  get(): WorldStateSnapshot {
    return { ...this.state };
  }

  setDeviceState(device: DeviceState) {
    const idx = this.state.devices.findIndex(d => d.deviceId === device.deviceId);
    if (idx >= 0) this.state.devices[idx] = device;
    else this.state.devices.push(device);
    this.state.timestamp = new Date().toISOString();
  }

  setUIState(deviceId: string, ui: UIState) {
    this.state.uiStates[deviceId] = ui;
    this.state.timestamp = new Date().toISOString();
  }

  isDeviceOnline(deviceId: string): boolean {
    return this.state.devices.find(d => d.deviceId === deviceId)?.online ?? false;
  }

  hasPermission(deviceId: string, permission: string): boolean {
    const dev = this.state.devices.find(d => d.deviceId === deviceId);
    return dev?.permissions[permission] ?? false;
  }
}
