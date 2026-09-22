/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Rwanda Tax Estimation Service (RRA Context)
 * Strictly separates:
 * 1. "Umusoro ugereranyijwe" (Estimated Tax)
 * 2. "Umusoro watanzwe / watangajwe ku buryo bwemewe" (Official Declared Tax)
 */

export interface TaxConfig {
  vatRatePercent: number;           // Standard Rwanda TVA/VAT: 18%
  withholdingTaxPercent: number;    // Rwanda WHT: 3% (or 5% / 15% where applicable)
  microEnterpriseFlatPercent: number; // Lump-sum micro regime (e.g. 3% of turnover)
  isVatRegistered: boolean;
}

export interface TaxEstimateResult {
  currency: string;
  grossSales: number;
  totalDeductibleExpenses: number;
  netEstimatedProfit: number;
  
  // Umusoro ugereranyijwe (Estimated)
  estimatedVatOutput: number;        // TVA ku bicuruzwa
  estimatedVatInput: number;         // TVA ku byaguzwe
  estimatedNetVatPayable: number;    // TVA isabwa kwishyurwa
  estimatedWithholdingTax: number;   // Umusoro ufatanwa (WHT)
  estimatedIncomeTax: number;        // Umusoro ku nyungu ugereranyijwe

  // Classification & Metadata
  taxRegime: 'standard_corporate' | 'micro_lump_sum' | 'vat_exempt';
  legalDisclaimerRw: string;
  legalDisclaimerEn: string;
  status: 'umusoro_ugereranyijwe';   // Explicit separation from declared tax
}

export class TaxService {
  /**
   * Calculates an unbinding estimate based on Rwandan tax provisions
   */
  static calculateEstimate(
    grossSales: number,
    totalExpenses: number,
    config: Partial<TaxConfig> = {}
  ): TaxEstimateResult {
    const isVatRegistered = config.isVatRegistered ?? false;
    const vatRate = (config.vatRatePercent ?? 18) / 100;
    const whtRate = (config.withholdingTaxPercent ?? 3) / 100;

    const netProfit = Math.max(0, grossSales - totalExpenses);

    let estimatedVatOutput = 0;
    let estimatedVatInput = 0;
    let estimatedNetVatPayable = 0;

    if (isVatRegistered) {
      // Assuming gross sales are VAT-exclusive for computation
      estimatedVatOutput = grossSales * vatRate;
      estimatedVatInput = totalExpenses * vatRate * 0.5; // Estimating 50% eligible VAT inputs
      estimatedNetVatPayable = Math.max(0, estimatedVatOutput - estimatedVatInput);
    }

    const estimatedWithholdingTax = grossSales * whtRate;
    // Standard corporate/business profit rate estimate in Rwanda (standard 30% of net taxable income or 3% lump sum for turnover)
    const estimatedIncomeTax = isVatRegistered 
      ? netProfit * 0.30 
      : grossSales * 0.03;

    return {
      currency: 'RWF',
      grossSales,
      totalDeductibleExpenses: totalExpenses,
      netEstimatedProfit: netProfit,
      estimatedVatOutput: Math.round(estimatedVatOutput),
      estimatedVatInput: Math.round(estimatedVatInput),
      estimatedNetVatPayable: Math.round(estimatedNetVatPayable),
      estimatedWithholdingTax: Math.round(estimatedWithholdingTax),
      estimatedIncomeTax: Math.round(estimatedIncomeTax),
      taxRegime: isVatRegistered ? 'standard_corporate' : 'micro_lump_sum',
      status: 'umusoro_ugereranyijwe',
      legalDisclaimerRw: 'Ibi ni igipimo kigereranyijwe cy’umusoro (Umusoro ugereranyijwe). Ntibigomba gufatwa nk’umusoro wemewe wamaze gutangazwa muri RRA (Rwanda Revenue Authority). Baza umunyamategeko cyangwa inzobere mu misoro (Tax Advisor / Certified Accountant).',
      legalDisclaimerEn: 'This is an algorithmic tax estimate. It is not an official tax declaration filed with Rwanda Revenue Authority (RRA). Consult a registered tax advisor or accountant.',
    };
  }
}
