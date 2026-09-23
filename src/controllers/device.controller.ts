import { Request, Response } from 'express';
import { DeviceRegistry, DeviceInfo } from '../devices/DeviceRegistry.ts';

const registry = new DeviceRegistry();

export const DeviceController = {
  async register(req: Request, res: Response) {
    const body = req.body as Partial<DeviceInfo>;
    if (!body.deviceId || !body.type) {
      return res.status(400).json({ error: 'deviceId and type required' });
    }
    const info: DeviceInfo = {
      deviceId: body.deviceId,
      type: body.type,
      label: body.label ?? body.deviceId,
      online: body.online ?? true,
      capabilities: body.capabilities ?? [],
      permissions: body.permissions ?? {},
      agentVersion: body.agentVersion,
      lastSeen: new Date().toISOString(),
      health: body.health ?? 'healthy',
    };
    registry.register(info);
    res.status(201).json(info);
  },

  async list(_req: Request, res: Response) {
    res.json(registry.getAll());
  },

  async get(req: Request, res: Response) {
    const d = registry.get(req.params.id);
    if (!d) return res.status(404).json({ error: 'Device not found' });
    res.json(d);
  },

  async heartbeat(req: Request, res: Response) {
    const id = req.params.id;
    const patch = req.body;
    registry.heartbeat(id, patch);
    const updated = registry.get(id);
    if (!updated) return res.status(404).json({ error: 'Device not found' });
    res.json(updated);
  },
};

export { registry as deviceRegistrySingleton };
