/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Sales Screen (KUGURISHA)
 * Rapid checkout, partial debt management, and real-time ledger sync.
 */

import React, { useState } from 'react';
import { useData } from '../context/DataContext.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { InventoryItem } from '../types/frontend.ts';
import { useToast } from '../context/ToastContext.tsx';
import {
  TrendingUp,
  Plus,
  User,
  CreditCard,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowDownLeft,
} from 'lucide-react';

export const SalesScreen: React.FC = () => {
  const { sales, inventory, customers, addSale } = useData();
  const { showToast } = useToast();

  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const [selectedItemId, setSelectedItemId] = useState(inventory[0]?.id || '');
  const [quantity, setQuantity] = useState(10);
  const [customUnitPrice, setCustomUnitPrice] = useState<number | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'cash' | 'bank' | 'credit'>('momo');
  const [amountPaid, setAmountPaid] = useState<number>(0);

  const currentItem = inventory.find((i) => i.id === selectedItemId) || inventory[0];
  const unitPrice = customUnitPrice !== null ? customUnitPrice : (currentItem?.sellingPrice || 30000);
  const totalAmount = quantity * unitPrice;
  const remaining = Math.max(0, totalAmount - amountPaid);

  const handleOpenSaleModal = (preselectedItem?: InventoryItem) => {
    if (preselectedItem) {
      setSelectedItemId(preselectedItem.id);
      setCustomUnitPrice(preselectedItem.sellingPrice);
      const tot = 10 * preselectedItem.sellingPrice;
      setAmountPaid(tot);
    } else if (currentItem) {
      setCustomUnitPrice(currentItem.sellingPrice);
      const tot = 10 * currentItem.sellingPrice;
      setAmountPaid(tot);
    }
    setIsNewSaleOpen(true);
  };

  const handleConfirmSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) {
      showToast('⚠️ Nta mbaho zihari zo kugurisha!', 'warning');
      return;
    }

    if (quantity > currentItem.quantity) {
      showToast(
        `⚠️ Umubare usabye (${quantity}) urenze imbaho ziri mu bubiko (${currentItem.quantity})!`,
        'warning'
      );
      return;
    }

    let customerName = newCustomerName;
    let customerPhone = newCustomerPhone;

    if (selectedCustomerId) {
      const existing = customers.find((c) => c.id === selectedCustomerId);
      if (existing) {
        customerName = existing.name;
        customerPhone = existing.phone;
      }
    }

    if (!customerName) {
      customerName = 'Umukiriya usanzwe';
    }

    await addSale({
      customerName,
      customerId: selectedCustomerId || undefined,
      inventoryId: currentItem.id,
      quantity,
      unitPrice,
      amountPaid: paymentMethod === 'credit' ? 0 : amountPaid,
      paymentMethod,
    });

    showToast(`💰 Igurisha rya ${totalAmount.toLocaleString()} RWF ryabitswe neza!`, 'success');
    setIsNewSaleOpen(false);
  };

  const totalSalesVolume = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalPaidVolume = sales.reduce((acc, s) => acc + s.amountPaid, 0);
  const totalDebtVolume = sales.reduce((acc, s) => acc + s.amountRemaining, 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#241A15] dark:text-white">
            KUGURISHA (SALES)
          </h1>
          <p className="text-xs sm:text-sm text-[#75675C] dark:text-[#E2B994] mt-1">
            Andika ibicuruzwa bisohotse, kwakira amafaranga no gukurikirana imyenda
          </p>
        </div>

        <Button
          variant="accent"
          size="md"
          onClick={() => handleOpenSaleModal()}
          icon={<Plus className="w-5 h-5" />}
        >
          + Ongeraho igurisha
        </Button>
      </div>

      {/* Financial Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 dark:border-[#B77A45]/20 shadow-sm">
          <span className="text-xs text-[#75675C] dark:text-stone-400 font-semibold block uppercase">
            Ibyagurishijwe byose
          </span>
          <span className="font-display font-extrabold text-2xl text-[#241A15] dark:text-white">
            {totalSalesVolume.toLocaleString()} <span className="text-xs text-[#C9A45C]">RWF</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 dark:border-[#B77A45]/20 shadow-sm">
          <span className="text-xs text-[#75675C] dark:text-stone-400 font-semibold block uppercase">
            Amafaranga yakiriwe
          </span>
          <span className="font-display font-extrabold text-2xl text-emerald-700 dark:text-emerald-400">
            {totalPaidVolume.toLocaleString()} <span className="text-xs">RWF</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#C9A45C]/40 shadow-sm">
          <span className="text-xs text-[#75675C] dark:text-stone-400 font-semibold block uppercase">
            Imyenda isigaye hanze
          </span>
          <span className="font-display font-extrabold text-2xl text-amber-600 dark:text-amber-400">
            {totalDebtVolume.toLocaleString()} <span className="text-xs">RWF</span>
          </span>
        </div>
      </div>

      {/* Recent Sales List */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 dark:border-[#B77A45]/20 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#8A5A38]/15 dark:border-[#B77A45]/20">
          <h3 className="font-display font-bold text-base sm:text-lg text-[#241A15] dark:text-white">
            Ibyagurishijwe biheruka
          </h3>
          <span className="text-xs text-[#75675C] dark:text-[#E2B994]">
            {sales.length} amagurisha
          </span>
        </div>

        <div className="space-y-3">
          {sales.map((sale) => (
            <div
              key={sale.id}
              className="p-4 rounded-2xl bg-[#F7F2EA]/50 dark:bg-[#1B120E] border border-[#8A5A38]/15 dark:border-[#B77A45]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#C9A45C] transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-base text-[#241A15] dark:text-white">
                    {sale.customerName}
                  </span>
                  <StatusBadge status={sale.status} />
                </div>
                <div className="text-xs text-[#75675C] dark:text-stone-400 flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-[#8A5A38] dark:text-[#E2B994]">
                    {sale.items.map((i) => `${i.species} (${i.quantity} pcs)`).join(', ')}
                  </span>
                  <span>•</span>
                  <span>{sale.createdAt}</span>
                  <span>•</span>
                  <span className="font-bold uppercase">{sale.paymentMethod}</span>
                </div>
              </div>

              <div className="text-right flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-0 pt-2 sm:pt-0">
                <div>
                  <span className="font-display font-extrabold text-base sm:text-lg text-[#241A15] dark:text-white">
                    {sale.totalAmount.toLocaleString()} RWF
                  </span>
                </div>
                {sale.amountRemaining > 0 ? (
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    Asigaje: {sale.amountRemaining.toLocaleString()} RWF
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Yishyuwe yose
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Sale Modal */}
      <Modal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        title="Ongeraho Igurisha Rishya"
        subtitle="Hitamo imbaho, umukiriya n'uburyo bwo kwishyura"
        maxWidth="lg"
      >
        <form onSubmit={handleConfirmSale} className="space-y-4">
          {/* Customer Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block">
              Hitamo umukiriya
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 dark:border-[#B77A45]/30 text-sm font-semibold"
            >
              <option value="">-- Andika umukiriya mushya hasi --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) - {c.remainingDebt > 0 ? `Umwenda: ${c.remainingDebt.toLocaleString()} RWF` : 'Nta mwenda'}
                </option>
              ))}
            </select>

            {!selectedCustomerId && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <input
                  type="text"
                  placeholder="Izina ry'umukiriya"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 text-xs sm:text-sm font-medium"
                />
                <input
                  type="tel"
                  placeholder="Telefone (+250...)"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 text-xs sm:text-sm font-medium"
                />
              </div>
            )}
          </div>

          {/* Timber Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block">
              Hitamo imbaho agura
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                const found = inventory.find((i) => i.id === e.target.value);
                if (found) {
                  setCustomUnitPrice(found.sellingPrice);
                  setAmountPaid(quantity * found.sellingPrice);
                }
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 dark:border-[#B77A45]/30 text-sm font-semibold"
            >
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — Hasigaye {item.quantity} pcs ({item.sellingPrice.toLocaleString()} RWF/pc)
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Unit Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
                Ingano agura (Pieces)
              </label>
              <input
                type="number"
                min="1"
                max={currentItem?.quantity || 100}
                value={quantity}
                onChange={(e) => {
                  const q = Number(e.target.value) || 0;
                  setQuantity(q);
                  setAmountPaid(q * unitPrice);
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 font-display font-bold text-lg"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
                Igiciro cy'igiti kimwe (RWF)
              </label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => {
                  const p = Number(e.target.value) || 0;
                  setCustomUnitPrice(p);
                  setAmountPaid(quantity * p);
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 font-bold text-base text-[#8A5A38] dark:text-[#C9A45C]"
                required
              />
            </div>
          </div>

          {/* Payment Method & Partial Debt */}
          <div className="p-4 rounded-2xl bg-[#EFE6D8]/60 dark:bg-[#1B120E]/70 border border-[#8A5A38]/20 space-y-3">
            <div className="flex items-center justify-between font-bold text-sm">
              <span className="text-[#75675C] dark:text-stone-400">Igiciro cyose:</span>
              <span className="font-display font-extrabold text-xl text-[#241A15] dark:text-white">
                {totalAmount.toLocaleString()} RWF
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
                  Uburyo bwo kwishyura
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    const m = e.target.value as any;
                    setPaymentMethod(m);
                    if (m === 'credit') {
                      setAmountPaid(0);
                    } else if (amountPaid === 0) {
                      setAmountPaid(totalAmount);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/30 text-xs sm:text-sm font-semibold"
                >
                  <option value="momo">MoMo (MTN / Airtel)</option>
                  <option value="cash">Cash (Amafaranga mu ntoki)</option>
                  <option value="bank">Bank</option>
                  <option value="credit">Umwenda (Credit)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
                  Yishyuye angahe?
                </label>
                <input
                  type="number"
                  disabled={paymentMethod === 'credit'}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/30 font-bold text-base text-emerald-700 dark:text-emerald-400"
                />
              </div>
            </div>

            {remaining > 0 && paymentMethod !== 'credit' && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center justify-between">
                <span>Asigaye kwishyura:</span>
                <span className="font-bold">{remaining.toLocaleString()} RWF (Bikwa nk'umwenda)</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsNewSaleOpen(false)}
            >
              Kureka
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="md"
              fullWidth
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Emeza igurisha
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
