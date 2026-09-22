/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Payments Service (Kwishyura)
 * Reduces customer receivables or supplier payables, records audit log and double-entry.
 */

import { FirestoreRepository } from '../repositories/firestore.repository.ts';
import { Payment, PaymentMethod, Sale, Purchase } from '../types/index.ts';
import { CustomerService } from './customer.service.ts';
import { SupplierService } from './supplier.service.ts';
import { AccountingService } from './accounting.service.ts';
import { AuditService } from './audit.service.ts';
import { NotificationService } from './notification.service.ts';
import { ERROR_MESSAGES, buildPaymentReceivedMessage } from '../utils/i18n.ts';

const paymentRepo = new FirestoreRepository<Payment>('payments');
const saleRepo = new FirestoreRepository<Sale>('sales');
const purchaseRepo = new FirestoreRepository<Purchase>('purchases');

export class PaymentService {
  static async createPayment(
    businessId: string,
    userId: string,
    data: {
      type: 'customer_payment' | 'supplier_payment';
      customerId?: string;
      supplierId?: string;
      saleId?: string;
      purchaseId?: string;
      amount: number;
      method: PaymentMethod;
      reference?: string;
      notes?: string;
    }
  ): Promise<Payment> {
    if (data.amount <= 0) {
      throw new Error('Amafaranga yo kwishyura agomba kurenza 0.');
    }

    if (data.type === 'customer_payment') {
      if (!data.customerId) {
        throw new Error(ERROR_MESSAGES.CUSTOMER_NOT_FOUND.rw);
      }
      const customer = await CustomerService.getById(data.customerId, businessId);
      if (!customer) {
        throw new Error(ERROR_MESSAGES.CUSTOMER_NOT_FOUND.rw);
      }

      if (data.amount > customer.outstandingBalance && customer.outstandingBalance > 0) {
        throw new Error(ERROR_MESSAGES.EXCESS_PAYMENT.rw);
      }

      // Update Customer Debt
      await CustomerService.adjustBalance(businessId, customer.id, 0, data.amount);

      // If specific sale referenced, update it
      if (data.saleId) {
        const sale = await saleRepo.findById(data.saleId, businessId);
        if (sale) {
          const newPaid = sale.amountPaid + data.amount;
          const newDue = Math.max(0, sale.total - newPaid);
          const newStatus = newDue === 0 ? 'paid' : 'partially_paid';
          await saleRepo.update(data.saleId, businessId, {
            amountPaid: newPaid,
            amountDue: newDue,
            paymentStatus: newStatus,
          });
        }
      }

      const payment = await paymentRepo.create({
        businessId,
        type: data.type,
        customerId: customer.id,
        saleId: data.saleId,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
        notes: data.notes,
        createdBy: userId,
        createdAt: new Date().toISOString(),
      });

      // Double-entry accounting
      await AccountingService.recordCustomerPayment({
        businessId,
        paymentId: payment.id,
        amount: data.amount,
        paymentMethod: data.method,
        customerName: customer.name,
      });

      // Audit log
      await AuditService.log({
        businessId,
        userId,
        action: 'PAYMENT_CREATED',
        entityType: 'payment',
        entityId: payment.id,
        after: {
          amount: data.amount,
          method: data.method,
          customerId: customer.id,
          type: data.type,
        },
      });

      // Notification
      await NotificationService.create({
        businessId,
        userId,
        type: 'payment_received',
        title: 'Kwishyura kwakiriwe',
        message: buildPaymentReceivedMessage(data.amount),
      });

      return payment;
    } else {
      // Supplier payment
      if (!data.supplierId) {
        throw new Error(ERROR_MESSAGES.SUPPLIER_NOT_FOUND.rw);
      }
      const supplier = await SupplierService.getById(data.supplierId, businessId);
      if (!supplier) {
        throw new Error(ERROR_MESSAGES.SUPPLIER_NOT_FOUND.rw);
      }

      // Update Supplier Balance
      await SupplierService.adjustBalance(businessId, supplier.id, 0, data.amount);

      if (data.purchaseId) {
        const purchase = await purchaseRepo.findById(data.purchaseId, businessId);
        if (purchase) {
          const newPaid = purchase.amountPaid + data.amount;
          const newDue = Math.max(0, purchase.total - newPaid);
          const newStatus = newDue === 0 ? 'paid' : 'partially_paid';
          await purchaseRepo.update(data.purchaseId, businessId, {
            amountPaid: newPaid,
            amountDue: newDue,
            paymentStatus: newStatus,
          });
        }
      }

      const payment = await paymentRepo.create({
        businessId,
        type: data.type,
        supplierId: supplier.id,
        purchaseId: data.purchaseId,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
        notes: data.notes,
        createdBy: userId,
        createdAt: new Date().toISOString(),
      });

      // Accounting
      const isBank = data.method === 'bank' || data.method === 'mobile_money';
      await AccountingService.recordEntries({
        businessId,
        type: 'payment_made',
        referenceType: 'payments',
        referenceId: payment.id,
        entries: [
          {
            account: 'accounts_payable',
            debit: data.amount,
            credit: 0,
            description: `Kwishyura uwo twaguzeho (${supplier.name})`,
          },
          {
            account: isBank ? 'bank' : 'cash',
            debit: 0,
            credit: data.amount,
            description: `Amafaranga yasohotse yishyuwe uwo twaguzeho (${supplier.name})`,
          },
        ],
      });

      await AuditService.log({
        businessId,
        userId,
        action: 'SUPPLIER_PAYMENT_CREATED',
        entityType: 'payment',
        entityId: payment.id,
        after: {
          amount: data.amount,
          supplierId: supplier.id,
          method: data.method,
        },
      });

      return payment;
    }
  }

  static async getPayments(businessId: string, limit = 100): Promise<Payment[]> {
    return paymentRepo.findByBusiness(businessId, limit, 'createdAt', 'desc');
  }
}
