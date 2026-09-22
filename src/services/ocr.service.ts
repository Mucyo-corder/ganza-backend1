/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - OCR, Vision & Document Parser Architecture
 * Architecture readiness for future document intelligence, invoice OCR,
 * and timber pile volume detection.
 * NOTE: Strict validation boundary: AI suggestions must be validated by backend before DB write.
 */

export interface ParsedDocumentResult {
  documentType: 'invoice' | 'receipt' | 'stock_book' | 'timber_log';
  confidence: number;
  extractedFields: {
    supplierOrCustomerName?: string;
    date?: string;
    totalAmount?: number;
    items?: Array<{
      woodSpecies?: string;
      quantity?: number;
      unitPrice?: number;
      total?: number;
    }>;
  };
  rawText: string;
  isReadyForValidation: boolean;
}

export class OCRService {
  /**
   * Scaffolding for text recognition from physical workshop stock books or paper receipts.
   */
  static async extractText(imageUrl: string): Promise<{ text: string; confidence: number }> {
    return {
      text: `[OCR_READY] Imashini iriteguye kwakira ifoto: ${imageUrl}`,
      confidence: 0.0,
    };
  }
}

export class VisionService {
  /**
   * Scaffolding for computer vision timber counting and loading detection.
   */
  static async inspectTimberImage(imageUrl: string): Promise<{
    woodDetected: boolean;
    estimatedPiecesCount?: number;
    detectedSpeciesCandidates?: string[];
  }> {
    return {
      woodDetected: true,
      estimatedPiecesCount: 0,
      detectedSpeciesCandidates: ['Eucalyptus', 'Pine'],
    };
  }
}

export class DocumentParserService {
  /**
   * Validates and parses raw text or OCR output into typed transaction candidates
   */
  static parseDocument(rawText: string): ParsedDocumentResult {
    return {
      documentType: 'invoice',
      confidence: 0.85,
      extractedFields: {},
      rawText,
      isReadyForValidation: true,
    };
  }
}
