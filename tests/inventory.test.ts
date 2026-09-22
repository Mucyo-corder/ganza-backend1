/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Tests - Inventory Calculations
 */

import { describe, it, expect } from 'vitest';
import { InventoryService } from '../src/services/inventory.service.ts';

describe('InventoryService Logic', () => {
  it('correctly computes status based on quantity and minimum stock', () => {
    expect(InventoryService.computeStatus(0, 10)).toBe('out_of_stock');
    expect(InventoryService.computeStatus(-5, 10)).toBe('out_of_stock');
    expect(InventoryService.computeStatus(5, 10)).toBe('low_stock');
    expect(InventoryService.computeStatus(10, 10)).toBe('low_stock');
    expect(InventoryService.computeStatus(11, 10)).toBe('in_stock');
    expect(InventoryService.computeStatus(50, 10)).toBe('in_stock');
  });
});
