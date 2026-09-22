/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp CustomerDetailModal
 * Complete customer statement, outstanding debt balance, and payment settlement
 */

import React, { useState } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import { Customer } from '../../types/frontend.ts';
import { useData } from '../../context/DataContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { Phone, MapPin, CreditCard, History, CheckCircle2 } from 'lucide-react';

interface CustomerDetailModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  isOpen,
  onClose,
}) => {
  const { recordCustomerPayment, sales } = useData();
  const { showToast } = useToast();

  const [isPaying, setIsPaying] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'momo' | 'cash' | 'bank'>('momo');

  if (!customer) return null;

  const customerSales = sales.filter((s) => s.customerName.toLowerCase() === customer.name.toLowerCase());

  const handleSettleDebt = async () => {
    if (payAmount <= 0) return;
    if (payAmount > customer.remainingDebt) {
      showToast('⚠️ Ntushobora kwakira amafaranga arenze umwenda asigaje!', 'warning');
      return;
    }

    await recordCustomerPayment(customer.id, payAmount, payMethod);
    showToast(`💰 Kwishyura ${payAmount.toLocaleString()} RWF byakiriwe neza kuri ${payMethod.toUpperCase()}.`, 'success');
    setIsPaying(false);
    setPayAmount(0);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer.name}
      subtitle="Amakuru arambuye y'umukiriya n'imyenda"
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Customer Header Details */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/20 dark:border-[#B77A45]/20">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-[#75675C] dark:text-[#E2B994]">
              <Phone className="w-4 h-4 text-[#C9A45C]" />
              <span className="font-semibold">{customer.phone}</span>
            </div>
            {customer.address && (
              <div className="flex items-center gap-2 text-xs text-[#75675C] dark:text-stone-300">
                <MapPin className="w-3.5 h-3.5 text-[#B77A45]" />
                <span>{customer.address}</span>
              </div>
            )}
          </div>
          <StatusBadge status={customer.status} />
        </div>

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/20">
            <span className="text-xs text-[#75675C] dark:text-stone-400 block font-semibold uppercase">
              Yaguze Yose
            </span>
            <span className="font-display font-extrabold text-base sm:text-xl text-[#241A15] dark:text-white">
              {customer.totalPurchases.toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/20">
            <span className="text-xs text-[#75675C] dark:text-stone-400 block font-semibold uppercase">
              Yishyuye
            </span>
            <span className="font-display font-extrabold text-base sm:text-xl text-emerald-700 dark:text-emerald-400">
              {customer.totalPaid.toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1B120E] border border-[#C9A45C]/50">
            <span className="text-xs text-[#75675C] dark:text-stone-400 block font-semibold uppercase">
              Asigaje
            </span>
            <span
              className={`font-display font-extrabold text-base sm:text-xl ${
                customer.remainingDebt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {customer.remainingDebt.toLocaleString()} RWF
            </span>
          </div>
        </div>

        {/* Debt Payment Form */}
        {customer.remainingDebt > 0 && (
          <div className="p-4 rounded-2xl bg-[#EFE6D8]/60 dark:bg-[#1B120E] border border-[#C9A45C]/40 space-y-3">
            {!isPaying ? (
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#241A15] dark:text-white">
                    Uyu mukiriya aracyabereyemo business umwenda
                  </h4>
                  <p className="text-xs text-[#75675C] dark:text-[#E2B994]">
                    Kanda hano wandike amafaranga amaze kwishyura.
                  </p>
                </div>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => {
                    setPayAmount(customer.remainingDebt);
                    setIsPaying(true);
                  }}
                  icon={<CreditCard className="w-4 h-4" />}
                >
                  Kwishyura
                </Button>
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in">
                <h4 className="font-bold text-sm text-[#241A15] dark:text-white">
                  Andika amafaranga yakiriwe
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#75675C] dark:text-stone-400 block mb-1">
                      Amafaranga (RWF)
                    </label>
                    <input
                      type="number"
                      value={payAmount}
                      max={customer.remainingDebt}
                      onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/30 dark:border-[#B77A45]/30 font-bold text-lg text-emerald-700 dark:text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#75675C] dark:text-stone-400 block mb-1">
                      Uburyo yishyuyemo
                    </label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/30 dark:border-[#B77A45]/30 text-xs sm:text-sm font-semibold"
                    >
                      <option value="momo">MoMo (MTN / Airtel)</option>
                      <option value="cash">Amafaranga mu Ntoki (Cash)</option>
                      <option value="bank">Kuri Banki</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setIsPaying(false)}>
                    Kureka
                  </Button>
                  <Button
                    variant="accent"
                    size="sm"
                    fullWidth
                    onClick={handleSettleDebt}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Emeza ko yishyuye {payAmount.toLocaleString()} RWF
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transaction Statement History */}
        <div className="pt-2 border-t border-[#8A5A38]/20 dark:border-[#B77A45]/20 space-y-2.5">
          <h4 className="font-display font-bold text-base text-[#241A15] dark:text-white flex items-center gap-1.5">
            <History className="w-4 h-4 text-[#B77A45]" />
            Ibyo yaguze n'amateka
          </h4>

          <div className="space-y-2">
            {customerSales.length === 0 ? (
              <p className="text-xs text-[#75675C] dark:text-stone-400 italic py-2">
                Nta mateka y'igurisha aheruka ku bubiko.
              </p>
            ) : (
              customerSales.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/15 dark:border-[#B77A45]/15 flex items-center justify-between text-xs sm:text-sm"
                >
                  <div>
                    <span className="font-bold text-[#241A15] dark:text-white block">
                      {s.items.map((i) => `${i.species} (${i.quantity})`).join(', ')}
                    </span>
                    <span className="text-[11px] text-[#75675C] dark:text-stone-400">
                      {s.createdAt} • {s.paymentMethod.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#241A15] dark:text-white block">
                      {s.totalAmount.toLocaleString()} RWF
                    </span>
                    {s.amountRemaining > 0 ? (
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        Haracyabura: {s.amountRemaining.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        Yishyuwe yose
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
