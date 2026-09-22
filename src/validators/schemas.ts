/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Request Validation Schemas (Zod v4 Compatible)
 * Error messages in Ikinyarwanda for end-user clarity.
 */

import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Imeli yanditse nabi.'),
  password: z.string().min(6, 'Ijambo ry’ibanga rigomba kugira inyuguti byibura 6.'),
  name: z.string().min(2, 'Izina rigomba kuba rifite inyuguti byibura 2.'),
  phone: z.string().optional(),
  role: z.enum(['owner', 'boss', 'accountant', 'manager', 'worker']).default('owner'),
  businessName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Imeli yanditse nabi.'),
  password: z.string().min(1, 'Ijambo ry’ibanga rirakenewe.'),
});

export const businessSchema = z.object({
  name: z.string().min(2, 'Izina rya business rigomba kugira inyuguti 2.'),
  phone: z.string().min(9, 'Telefone yanditse nabi.'),
  email: z.string().email().optional(),
  tinNumber: z.string().optional(),
  address: z.object({
    district: z.string().min(1, 'Akarere karakenewe.'),
    sector: z.string().optional(),
    description: z.string().optional(),
  }),
  currency: z.string().default('RWF'),
  settings: z.object({
    language: z.enum(['rw', 'en', 'fr']).default('rw'),
    lowStockThresholdDefault: z.number().nonnegative().default(10),
    vatRatePercent: z.number().nonnegative().default(18),
    withholdingTaxRatePercent: z.number().nonnegative().default(3),
  }).optional(),
});

export const inventoryItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, 'Izina ry’igicuruzwa rirakenewe.'),
  woodType: z.string().min(1, 'Ubwoko bw’imbaho burakenewe.'),
  species: z.string().min(1, 'Species y’igiti irakenewe (urugero: Eucalyptus, Pine, Teak, Cypress).'),
  dimensions: z.object({
    length: z.number().positive('Uburebure bugomba kuba hejuru ya 0.'),
    width: z.number().positive('Ubugari bugomba kuba hejuru ya 0.'),
    thickness: z.number().positive('Umubyimba ugomba kuba hejuru ya 0.'),
    dimensionUnit: z.enum(['cm', 'mm', 'm']).default('cm'),
  }),
  quantity: z.number().int().nonnegative('Ingano y’imbaho igomba kuba umubare mwiza.'),
  unit: z.enum(['piece', 'board', 'plank', 'sheet', 'cubic_meter', 'square_meter', 'meter', 'kg']).default('piece'),
  buyingPrice: z.number().nonnegative('Igiciro cyo kugura kigomba kuba hejuru cyangwa kingana na 0.'),
  sellingPrice: z.number().positive('Igiciro cyo kugurisha kigomba kuba hejuru ya 0.'),
  minimumStock: z.number().nonnegative().default(10),
  location: z.string().min(1, 'Aho bibitswe harakenewe (urugero: Ububiko A).'),
});

export const adjustStockSchema = z.object({
  quantityChange: z.number(),
  type: z.enum(['adjustment', 'damaged', 'transfer', 'return', 'manual_add', 'manual_remove']),
  reason: z.string().min(3, 'Sobanura impamvu neza.'),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Izina ry’igicuruzwa rirakenewe.'),
  woodType: z.string().min(1, 'Ubwoko bw’imbaho burakenewe.'),
  species: z.string().min(1, 'Species irakenewe.'),
  description: z.string().optional(),
  unit: z.enum(['piece', 'board', 'plank', 'sheet', 'cubic_meter', 'square_meter', 'meter', 'kg']).default('piece'),
  defaultBuyingPrice: z.number().nonnegative().default(0),
  defaultSellingPrice: z.number().nonnegative().default(0),
  minimumStock: z.number().nonnegative().default(10),
});

export const saleItemInputSchema = z.object({
  inventoryId: z.string().min(1, 'Urubaho rugurishwa rugomba kugaragazwa (inventoryId).'),
  quantity: z.number().int().positive('Ingano igurishwa igomba kuba byibura 1.'),
  unitPrice: z.number().positive('Igiciro cy’urubaho rumwe kigomba kurenza 0.'),
});

export const saleSchema = z.object({
  customerId: z.string().min(1, 'Umukiriya arakenewe.'),
  items: z.array(saleItemInputSchema).min(1, 'Hagomba kugurishwa byibura urubaho rumwe.'),
  discount: z.number().nonnegative().default(0),
  amountPaid: z.number().nonnegative('Amafaranga yishyuwe agomba kuba 0 cyangwa arenzeho.').default(0),
  paymentMethod: z.enum(['cash', 'mobile_money', 'bank', 'card', 'other']).default('cash'),
  saleDate: z.string().optional(),
  notes: z.string().optional(),
});

export const purchaseItemInputSchema = z.object({
  inventoryId: z.string().optional(),
  productName: z.string().min(1, 'Izina ry’imbaho ziguzwe rirakenewe.'),
  woodType: z.string().min(1, 'Ubwoko bw’imbaho burakenewe.'),
  species: z.string().min(1, 'Species irakenewe.'),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    thickness: z.number().positive(),
    dimensionUnit: z.enum(['cm', 'mm', 'm']).default('cm'),
  }),
  quantity: z.number().int().positive('Ingano igomba kuba byibura 1.'),
  unit: z.enum(['piece', 'board', 'plank', 'sheet', 'cubic_meter', 'square_meter', 'meter', 'kg']).default('piece'),
  unitCost: z.number().positive('Igiciro cyo kugura urubaho rumwe kigomba kurenza 0.'),
  sellingPrice: z.number().positive('Igiciro cyo kugurisha kigomba kurenza 0.'),
  location: z.string().default('Ububiko'),
});

export const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Uwo muguraho arakenewe.'),
  items: z.array(purchaseItemInputSchema).min(1, 'Hagomba kwandikwa byibura ibintu 1 byaguzwe.'),
  discount: z.number().nonnegative().default(0),
  amountPaid: z.number().nonnegative('Amafaranga yishyuwe agomba kuba 0 cyangwa arenzeho.').default(0),
  paymentMethod: z.enum(['cash', 'mobile_money', 'bank', 'card', 'other']).default('cash'),
  purchaseDate: z.string().optional(),
  notes: z.string().optional(),
});

export const paymentSchema = z.object({
  type: z.enum(['customer_payment', 'supplier_payment']),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  saleId: z.string().optional(),
  purchaseId: z.string().optional(),
  amount: z.number().positive('Amafaranga yo kwishyura agomba kurenza 0.'),
  method: z.enum(['cash', 'mobile_money', 'bank', 'card', 'other']).default('cash'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const expenseSchema = z.object({
  category: z.enum(['transport', 'salaries', 'rent', 'electricity', 'internet', 'repairs', 'fuel', 'materials', 'marketing', 'other']),
  description: z.string().min(2, 'Sobanura neza icyo yakoreshejwe.'),
  amount: z.number().positive('Amafaranga yakoreshejwe agomba kurenza 0.'),
  paymentMethod: z.enum(['cash', 'mobile_money', 'bank', 'card', 'other']).default('cash'),
  date: z.string().optional(),
});

export const customerSchema = z.object({
  name: z.string().min(2, 'Izina rigomba kugira inyuguti byibura 2.'),
  phone: z.string().min(9, 'Nimero ya telefone yanditse nabi.'),
  email: z.string().email('Imeli yanditse nabi.').optional(),
  address: z.string().optional(),
});

export const supplierSchema = z.object({
  name: z.string().min(2, 'Izina rigomba kugira inyuguti byibura 2.'),
  phone: z.string().min(9, 'Nimero ya telefone yanditse nabi.'),
  email: z.string().email('Imeli yanditse nabi.').optional(),
  address: z.string().optional(),
});

export const cameraSchema = z.object({
  name: z.string().min(2, 'Izina rigomba kugira inyuguti byibura 2.'),
  location: z.enum(['ububiko', 'aho_bakorera', 'aho_bapakira', 'aho_abakiriya_bakirira', 'hanze']),
  provider: z.string().default('RTSP / Cloud Gateway'),
  streamUrl: z.string().url('URL ya stream yanditse nabi.').or(z.string().min(5)),
  snapshotUrl: z.string().url().optional(),
  enabled: z.boolean().default(true),
});

export const cameraEventSchema = z.object({
  cameraId: z.string().min(1, 'Id ya camera irakenewe.'),
  eventType: z.enum([
    'person_detected',
    'loading_started',
    'loading_finished',
    'stock_movement_detected',
    'customer_detected',
    'unusual_activity',
    'camera_offline'
  ]),
  timestamp: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0.9),
  metadata: z.record(z.string(), z.unknown()).optional(),
  snapshotUrl: z.string().url().optional(),
});

// Backward-compatible schema aliases for route bindings
export const createBusinessSchema = businessSchema;
export const createInventorySchema = inventoryItemSchema;
export const createProductSchema = productSchema;
export const createCustomerSchema = customerSchema;
export const createSupplierSchema = supplierSchema;
export const createSaleSchema = saleSchema;
export const createPurchaseSchema = purchaseSchema;
export const createPaymentSchema = paymentSchema;
export const createExpenseSchema = expenseSchema;
export const createCameraSchema = cameraSchema;
export const createCameraEventSchema = cameraEventSchema;
export const logCameraEventSchema = cameraEventSchema;
