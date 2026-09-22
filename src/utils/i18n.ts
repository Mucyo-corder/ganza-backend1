/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Internationalization (i18n) Engine
 * Default: Ikinyarwanda (rw), with support for English (en) and Français (fr).
 */

import { LanguageCode, ExpenseCategory, PaymentStatus, StockMovementType, CameraLocation } from '../types/index.ts';

export const TERMS = {
  inventory: { rw: 'Imbaho mfite', en: 'Inventory', fr: 'Stock de bois' },
  revenue: { rw: 'Amafaranga nagurishije', en: 'Revenue', fr: 'Chiffre d’affaires' },
  expense: { rw: 'Amafaranga nakoresheje', en: 'Expenses', fr: 'Dépenses' },
  accountsReceivable: { rw: 'Amafaranga abakiriya batarishyura', en: 'Accounts Receivable', fr: 'Créances clients' },
  accountsPayable: { rw: 'Amafaranga dufitiye abandi', en: 'Accounts Payable', fr: 'Dettes fournisseurs' },
  profit: { rw: 'Inyungu', en: 'Gross Profit', fr: 'Bénéfice brut' },
  reconciliation: { rw: 'Kugenzura amafaranga', en: 'Reconciliation', fr: 'Rapprochement financier' },
  auditLog: { rw: 'Amateka y’ibyakozwe', en: 'Audit Log', fr: 'Journal des opérations' },
  dashboard: { rw: 'Business yanjye', en: 'Dashboard', fr: 'Tableau de bord' },
  sale: { rw: 'Igurisha', en: 'Sale', fr: 'Vente' },
  purchase: { rw: 'Ibyo naguze', en: 'Purchase', fr: 'Achat' },
  payment: { rw: 'Kwishyura', en: 'Payment', fr: 'Paiement' },
  customer: { rw: 'Umukiriya', en: 'Customer', fr: 'Client' },
  supplier: { rw: 'Uwo tugura ho', en: 'Supplier', fr: 'Fournisseur' },
  stock: { rw: 'Imbaho mfite', en: 'Stock', fr: 'Stock' },
  lowStock: { rw: 'Hasigaye bike', en: 'Low Stock', fr: 'Stock faible' },
  outOfStock: { rw: 'Byarashize', en: 'Out of Stock', fr: 'Rupture de stock' },
  paid: { rw: 'Byishyuwe', en: 'Paid', fr: 'Payé' },
  partiallyPaid: { rw: 'Haracyabura', en: 'Partially Paid', fr: 'Partiellement payé' },
  overdue: { rw: 'Byarenze igihe cyo kwishyura', en: 'Overdue', fr: 'En retard' },
  cash: { rw: 'Amafaranga ahari', en: 'Cash', fr: 'Liquidités' },
  report: { rw: 'Raporo', en: 'Report', fr: 'Rapport' },
  notification: { rw: 'Ubutumwa', en: 'Notification', fr: 'Notification' },
  settings: { rw: 'Igenamiterere', en: 'Settings', fr: 'Paramètres' },
  help: { rw: 'Ubufasha', en: 'Help', fr: 'Aide' },
  save: { rw: 'Bika', en: 'Save', fr: 'Enregistrer' },
  cancel: { rw: 'Hagarika', en: 'Cancel', fr: 'Annuler' },
  delete: { rw: 'Siba', en: 'Delete', fr: 'Supprimer' },
  edit: { rw: 'Hindura', en: 'Edit', fr: 'Modifier' },
  confirm: { rw: 'Emeza', en: 'Confirm', fr: 'Confirmer' },
  add: { rw: 'Ongeraho', en: 'Add', fr: 'Ajouter' },
  search: { rw: 'Shakisha', en: 'Search', fr: 'Rechercher' },
  camera: { rw: 'Kamera', en: 'Camera', fr: 'Caméra' },
  liveCamera: { rw: 'Kureba aho akazi kari kuba ubu', en: 'Live Camera', fr: 'Caméra en direct' },
  loading: { rw: 'Gupakira imbaho', en: 'Loading Timber', fr: 'Chargement de bois' },
  workshop: { rw: 'Aho bakorera', en: 'Workshop', fr: 'Atelier' },
  warehouse: { rw: 'Ububiko', en: 'Warehouse', fr: 'Dépôt / Entrepôt' },
};

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { rw: string; en: string; fr: string }> = {
  transport: { rw: 'Ubwikorezi', en: 'Transport', fr: 'Transport' },
  salaries: { rw: 'Imishahara', en: 'Salaries', fr: 'Salaires' },
  rent: { rw: 'Ubukode', en: 'Rent', fr: 'Loyer' },
  electricity: { rw: 'Amashanyarazi', en: 'Electricity', fr: 'Électricité' },
  internet: { rw: 'Interineti', en: 'Internet', fr: 'Internet' },
  repairs: { rw: 'Gusana', en: 'Repairs & Maintenance', fr: 'Réparations' },
  fuel: { rw: 'Lisansi', en: 'Fuel', fr: 'Carburant' },
  materials: { rw: 'Ibikoresho', en: 'Materials & Consumables', fr: 'Matériaux' },
  marketing: { rw: 'Kwamamaza', en: 'Marketing', fr: 'Marketing' },
  other: { rw: 'Ibindi', en: 'Other', fr: 'Autres' },
};

export const CAMERA_LOCATIONS: Record<CameraLocation, { rw: string; en: string; fr: string }> = {
  ububiko: { rw: 'Ububiko', en: 'Warehouse / Store', fr: 'Entrepôt' },
  aho_bakorera: { rw: 'Aho bakorera', en: 'Workshop', fr: 'Atelier' },
  aho_bapakira: { rw: 'Aho bapakira', en: 'Loading Bay', fr: 'Zone de chargement' },
  aho_abakiriya_bakirira: { rw: 'Aho abakiriya bakirira', en: 'Reception / Sales Counter', fr: 'Accueil clients' },
  hanze: { rw: 'Hanze', en: 'Outside / Perimeter', fr: 'Extérieur' },
};

export const ERROR_MESSAGES = {
  UNAUTHORIZED: {
    rw: 'Ntabwo wemerewe gukora iki gikorwa. Banza winjire muri system.',
    en: 'Unauthorized action. Please sign in.',
    fr: 'Action non autorisée. Veuillez vous connecter.'
  },
  FORBIDDEN: {
    rw: 'Ntabwo wemerewe gukora iki gikorwa muri iyi business.',
    en: 'Access forbidden for your role in this business.',
    fr: 'Accès interdit pour votre rôle dans cette entreprise.'
  },
  VALIDATION_ERROR: {
    rw: 'Amakuru watanze ntabwo yuzuye cyangwa ntabwo ari yo.',
    en: 'Validation error: invalid or incomplete data provided.',
    fr: 'Erreur de validation: données invalides ou incomplètes.'
  },
  INSUFFICIENT_STOCK: {
    rw: 'Stock ntabwo ihagije.',
    en: 'Insufficient stock available.',
    fr: 'Stock insuffisant pour cette opération.'
  },
  CUSTOMER_NOT_FOUND: {
    rw: 'Uyu mukiriya ntiyabonetse.',
    en: 'Customer not found.',
    fr: 'Client introuvable.'
  },
  SUPPLIER_NOT_FOUND: {
    rw: 'Uwo muguzi / uwo muguraho ntiyabonetse.',
    en: 'Supplier not found.',
    fr: 'Fournisseur introuvable.'
  },
  INVENTORY_ITEM_NOT_FOUND: {
    rw: 'Ubu bwoko bw’imbaho ntibwabashije kuboneka muri stock.',
    en: 'Inventory item not found.',
    fr: 'Article de bois introuvable en stock.'
  },
  EXCESS_PAYMENT: {
    rw: 'Aya mafaranga arenze ayo umukiriya yari asigaje kwishyura.',
    en: 'Payment amount exceeds outstanding balance.',
    fr: 'Le montant du paiement dépasse le solde dû.'
  },
  DATABASE_ERROR: {
    rw: 'Habaye ikibazo mu kubika aya makuru. Ongera ugerageze.',
    en: 'Database operation failed. Please retry.',
    fr: 'Erreur lors de l’enregistrement des données.'
  },
  FIREBASE_NOT_CONFIGURED: {
    rw: 'Igenamiterere rya Firebase Firestore ntirirangira muri environment variables.',
    en: 'Firebase Firestore configuration is missing in environment variables.',
    fr: 'La configuration de Firebase Firestore est absente.'
  },
  BUSINESS_NOT_FOUND: {
    rw: 'Iyi business ntiyabonetse cyangwa ntiyemerewe.',
    en: 'Business not found.',
    fr: 'Entreprise introuvable.'
  }
};

export function formatRwf(amount: number): string {
  return new Intl.NumberFormat('rw-RW', {
    maximumFractionDigits: 0
  }).format(Math.round(amount)) + ' RWF';
}

export function getExpenseCategoryName(category: ExpenseCategory, lang: LanguageCode = 'rw'): string {
  const cat = EXPENSE_CATEGORIES[category];
  return cat ? cat[lang] || cat.rw : category;
}

export function getPaymentStatusLabel(status: PaymentStatus, lang: LanguageCode = 'rw'): string {
  switch (status) {
    case 'paid':
      return TERMS.paid[lang] || TERMS.paid.rw;
    case 'partially_paid':
      return TERMS.partiallyPaid[lang] || TERMS.partiallyPaid.rw;
    case 'overdue':
      return TERMS.overdue[lang] || TERMS.overdue.rw;
    default:
      return TERMS.partiallyPaid[lang] || TERMS.partiallyPaid.rw;
  }
}

export function buildStockAddedMessage(qty: number, species: string, lang: LanguageCode = 'rw'): string {
  if (lang === 'en') return `Added ${qty} items of ${species} to stock.`;
  if (lang === 'fr') return `Ajouté ${qty} pièces de ${species} au stock.`;
  return `Wongeye imbaho ${qty} za ${species} muri stock.`;
}

export function buildSaleSuccessMessage(qty: number, amount: number, lang: LanguageCode = 'rw'): string {
  const formattedAmount = formatRwf(amount);
  if (lang === 'en') return `Sold ${qty} timber items for ${formattedAmount}.`;
  if (lang === 'fr') return `Vendu ${qty} pièces de bois pour ${formattedAmount}.`;
  return `Wagurishije imbaho ${qty} kuri ${formattedAmount}.`;
}

export function buildPaymentReceivedMessage(amount: number, lang: LanguageCode = 'rw'): string {
  const formattedAmount = formatRwf(amount);
  if (lang === 'en') return `Received ${formattedAmount} for this sale.`;
  if (lang === 'fr') return `Reçu ${formattedAmount} pour cette vente.`;
  return `Wakiriye ${formattedAmount} kuri iri gurisha.`;
}

export function buildCustomerDebtMessage(customerName: string, debtAmount: number, lang: LanguageCode = 'rw'): string {
  const formatted = formatRwf(debtAmount);
  if (lang === 'en') return `${customerName} still owes ${formatted}.`;
  if (lang === 'fr') return `${customerName} doit encore ${formatted}.`;
  return `${customerName} aracyagomba kwishyura ${formatted}.`;
}

export function buildLowStockAlertMessage(species: string, remaining: number, lang: LanguageCode = 'rw'): string {
  if (lang === 'en') return `Timber of ${species} is running low (${remaining} left).`;
  if (lang === 'fr') return `Le bois de ${species} est presque épuisé (${remaining} restants).`;
  return `Imbaho za ${species} zisigaye nke (${remaining} zisigaye).`;
}

export function buildOutOfStockAlertMessage(species: string, lang: LanguageCode = 'rw'): string {
  if (lang === 'en') return `Timber of ${species} is out of stock.`;
  if (lang === 'fr') return `Le bois de ${species} est en rupture de stock.`;
  return `Imbaho za ${species} zarashize.`;
}
