import { describe, it, expect } from 'vitest';
import {
  assessImageQuality,
  calculateWoodVolume,
  verifyFinancialCalculation,
  buildBossReport,
  deliverBossReport,
} from '../src/services/woodDetection.ts';
import { ReportService } from '../src/services/report.service.ts';
import { FirestoreRepository } from '../src/repositories/firestore.repository.ts';
import type { Business, Sale } from '../src/types/index.ts';

describe('wood verification safeguards', () => {
  it('rejects low-quality wood capture before financial calculation', () => {
    const result = assessImageQuality({
      size: 65000,
      width: 320,
      height: 240,
      mimeType: 'image/jpeg',
      blurScore: 0.9,
      darknessScore: 0.95,
      glareScore: 0.88,
      occluded: true,
    });

    expect(result.isReliable).toBe(false);
    expect(result.issues.some((issue) => issue.toLowerCase().includes('ongere'))).toBe(true);
  });

  it('calculates volume deterministically using the configured units', () => {
    const volume = calculateWoodVolume({
      quantity: 12,
      length: 4,
      width: 0.2,
      thickness: 0.05,
      unit: 'm',
    });

    expect(volume).toBeCloseTo(0.48, 6);
  });

  it('blocks saving when a second independent calculation disagrees', () => {
    const result = verifyFinancialCalculation({
      quantity: 8,
      length: 3,
      width: 0.2,
      thickness: 0.05,
      unit: 'm',
      pricePerVolumeUnit: 120000,
      expectedVolume: 0.25,
      expectedTotal: 30000,
    });

    expect(result.isVerified).toBe(false);
    expect(result.errors[0]).toMatch(/Habaye ikibazo/);
  });

  it('builds a professional boss report with explicit delivery status', () => {
    const report = buildBossReport({
      date: '2026-09-24',
      totalPiecesScanned: 85,
      addedPieces: 32,
      soldPieces: 18,
      stockValue: 1500000,
      soldValue: 640000,
      warnings: ['2 records zasabaga manual confirmation.'],
      calculatedVolume: 12.4,
    });

    expect(report.text).toContain('GANZA STOCK REPORT');
    expect(report.text).toContain('Raporo');
    expect(report.deliveryStatus).toBe('not_available');
  });

  it('persists one daily report per business and saves it to the database-backed repository', async () => {
    const businessRepo = new FirestoreRepository<Business>('businesses');
    const saleRepo = new FirestoreRepository<Sale>('sales');

    const businessId = `biz_daily_${Date.now()}`;
    await businessRepo.create({
      id: businessId,
      name: 'Kigali Timber Yard',
      ownerId: 'owner-1',
      phone: '+250788000001',
      currency: 'RWF',
      address: { district: 'Kigali', description: 'Nyabugogo' },
      settings: {
        language: 'rw',
        lowStockThresholdDefault: 10,
        vatRatePercent: 18,
        withholdingTaxRatePercent: 3,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await saleRepo.create({
      id: `sale_${Date.now()}`,
      businessId,
      customerId: 'customer-1',
      customerName: 'Test Customer',
      items: [],
      subtotal: 100000,
      discount: 0,
      total: 100000,
      totalCost: 60000,
      profit: 40000,
      amountPaid: 100000,
      amountDue: 0,
      paymentStatus: 'paid',
      saleDate: new Date().toISOString(),
      createdBy: 'owner-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const first = await ReportService.generateDailyReport(businessId);
    const second = await ReportService.generateDailyReport(businessId);

    expect(first.businessId).toBe(businessId);
    expect(second.id).toBe(first.id);
    expect(first.salesTotal).toBeGreaterThanOrEqual(100000);
  });
});
