/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Tests - Rwanda Tax Estimation Service
 */

import { describe, it, expect } from 'vitest';
import { TaxService } from '../src/services/tax.service.ts';

describe('TaxService (Rwanda Context)', () => {
  it('computes tax estimate for non-VAT registered micro enterprise', () => {
    const grossSales = 1_000_000;
    const totalExpenses = 400_000;

    const result = TaxService.calculateEstimate(grossSales, totalExpenses, {
      isVatRegistered: false,
    });

    expect(result.currency).toBe('RWF');
    expect(result.grossSales).toBe(1_000_000);
    expect(result.netEstimatedProfit).toBe(600_000);
    expect(result.status).toBe('umusoro_ugereranyijwe');
    expect(result.estimatedVatOutput).toBe(0); // Not VAT registered
    expect(result.estimatedWithholdingTax).toBe(30_000); // 3% WHT
    expect(result.legalDisclaimerRw).toContain('Umusoro ugereranyijwe');
  });

  it('computes VAT and corporate income tax estimate for VAT registered business', () => {
    const grossSales = 2_000_000;
    const totalExpenses = 800_000;

    const result = TaxService.calculateEstimate(grossSales, totalExpenses, {
      isVatRegistered: true,
      vatRatePercent: 18,
      withholdingTaxPercent: 3,
    });

    expect(result.taxRegime).toBe('standard_corporate');
    expect(result.estimatedVatOutput).toBe(360_000); // 18% of 2M
    expect(result.estimatedVatInput).toBe(72_000); // 18% of (800k * 0.5)
    expect(result.estimatedNetVatPayable).toBe(288_000); // 360k - 72k
    expect(result.status).toBe('umusoro_ugereranyijwe');
  });
});
