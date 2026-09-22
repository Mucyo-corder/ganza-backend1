/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Purchases Screen (KUGURA)
 * Timber Procurement, Auto-Stock Elevation, and Supplier Debt Accounting.
 */

import React, { useState } from 'react';
import { useData } from '../context/DataContext.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { WoodSpecies } from '../types/frontend.ts';
import { useToast } from '../context/ToastContext.tsx';
import { ShoppingCart, Plus, Truck, CheckCircle2, PackageCheck } from 'lucide-react';

export const PurchasesScreen: React.FC = () => {
  const { purchases, addPurchase, suppliers } = useData();
  const { showToast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');

  const [species, setSpecies] = useState<WoodSpecies>('Eucalyptus');
  const [dimensionsStr, setDimensionsStr] = useState('3m × 15cm × 5cm');
  const [quantity, setQuantity] = useState(50);
  const [unitCost, setUnitCost] = useState(20000);
  const [amountPaid, setAmountPaid] = useState(1000000);

  const totalCost = quantity * unitCost;
  const remainingDebt = Math.max(0, totalCost - amountPaid);

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalSupplier = newSupplierName;
    if (selectedSupplierId) {
      const found = suppliers.find((s) => s.id === selectedSupplierId);
      if (found) finalSupplier = found.name;
    }
    if (!finalSupplier) finalSupplier = 'Uruganda rwa Gicumbi';

    await addPurchase({
      supplierName: finalSupplier,
      species,
      dimensionsStr,
      quantity,
      unitCost,
      amountPaid,
    });

    showToast(
      `🛒 Waguze imbaho ${quantity} za ${species} kuri ${totalCost.toLocaleString()} RWF. Zongerewe muri stock!`,
      'success'
    );
    setIsAddOpen(false);
  };

  const totalPurchasesVolume = purchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const totalPaidVolume = purchases.reduce((acc, p) => acc + p.amountPaid, 0);
  const totalOwedVolume = purchases.reduce((acc, p) => acc + p.amountRemaining, 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#241A15] dark:text-white">
            KUGURA IMBAHO (PURCHASES)
          </h1>
          <p className="text-xs sm:text-sm text-[#75675C] dark:text-[#E2B994] mt-1">
            Kwinjiza imbaho nshya mu bubiko no gucunga amafaranga wishyuye abasaruzi
          </p>
        </div>

        <Button
          variant="accent"
          size="md"
          onClick={() => {
            setAmountPaid(quantity * unitCost);
            setIsAddOpen(true);
          }}
          icon={<Plus className="w-5 h-5" />}
        >
          + Ongeraho ibyo naguze
        </Button>
      </div>

      {/* Financial Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 dark:border-[#B77A45]/20 shadow-sm">
          <span className="text-xs text-[#75675C] dark:text-stone-400 font-semibold block uppercase">
            Ibyaguzwe byose
          </span>
          <span className="font-display font-extrabold text-2xl text-[#241A15] dark:text-white">
            {totalPurchasesVolume.toLocaleString()} <span className="text-xs text-[#C9A45C]">RWF</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 dark:border-[#B77A45]/20 shadow-sm">
          <span className="text-xs text-[#75675C] dark:text-stone-400 font-semibold block uppercase">
            Amafaranga wishyuye
          </span>
          <span className="font-display font-extrabold text-2xl text-emerald-700 dark:text-emerald-400">
            {totalPaidVolume.toLocaleString()} <span className="text-xs">RWF</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#C9A45C]/40 shadow-sm">
          <span className="text-xs text-[#75675C] dark:text-stone-400 font-semibold block uppercase">
            Imyenda ubereyemo abandi
          </span>
          <span className="font-display font-extrabold text-2xl text-amber-600 dark:text-amber-400">
            {totalOwedVolume.toLocaleString()} <span className="text-xs">RWF</span>
          </span>
        </div>
      </div>

      {/* Recent Purchases List */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 dark:border-[#B77A45]/20 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#8A5A38]/15 dark:border-[#B77A45]/20">
          <h3 className="font-display font-bold text-base sm:text-lg text-[#241A15] dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#8A5A38] dark:text-[#C9A45C]" />
            Ibyaguzwe biheruka kwinjira
          </h3>
          <span className="text-xs text-[#75675C] dark:text-[#E2B994]">
            {purchases.length} deliveries
          </span>
        </div>

        <div className="space-y-3">
          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              className="p-4 rounded-2xl bg-[#F7F2EA]/50 dark:bg-[#1B120E] border border-[#8A5A38]/15 dark:border-[#B77A45]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#C9A45C] transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-base text-[#241A15] dark:text-white">
                    {purchase.supplierName}
                  </span>
                  <StatusBadge status={purchase.amountRemaining === 0 ? 'paid' : purchase.amountPaid === 0 ? 'credit' : 'partial'} />
                </div>
                <div className="text-xs text-[#75675C] dark:text-stone-400 flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#8A5A38] dark:text-[#E2B994]">
                    {purchase.items?.[0]?.species || 'Imbaho'} ({purchase.items?.[0]?.quantity || 0} pcs • {purchase.items?.[0]?.dimensionsStr || ''})
                  </span>
                  <span>•</span>
                  <span>{purchase.createdAt}</span>
                </div>
              </div>

              <div className="text-right flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-0 pt-2 sm:pt-0">
                <div>
                  <span className="font-display font-extrabold text-base sm:text-lg text-[#241A15] dark:text-white">
                    {purchase.totalAmount.toLocaleString()} RWF
                  </span>
                </div>
                {purchase.amountRemaining > 0 ? (
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    Umusigarije: {purchase.amountRemaining.toLocaleString()} RWF
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Wishyuye yose
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Purchase Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Ongeraho Ibyo Waguze"
        subtitle="Imbaho winjije zihita zongerwa muri stock mu buryo bwikora"
        maxWidth="lg"
      >
        <form onSubmit={handleConfirmPurchase} className="space-y-4">
          {/* Supplier */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block">
              Aho waziguze (Supplier / Koperative)
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 dark:border-[#B77A45]/30 text-sm font-semibold"
            >
              <option value="">-- Andika aho waziguze hasi --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.location})
                </option>
              ))}
            </select>

            {!selectedSupplierId && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <input
                  type="text"
                  placeholder="Izina ry'uwo waziguzeho"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 text-xs sm:text-sm font-medium"
                />
                <input
                  type="tel"
                  placeholder="Telefone (+250...)"
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 text-xs sm:text-sm font-medium"
                />
              </div>
            )}
          </div>

          {/* Timber Species & Dimensions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
                Ubwoko bw'igiti
              </label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value as WoodSpecies)}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 dark:border-[#B77A45]/30 text-sm font-semibold"
              >
                <option value="Eucalyptus">Eucalyptus</option>
                <option value="Pine">Pine</option>
                <option value="Teak">Teak</option>
                <option value="Cypress">Cypress</option>
                <option value="Mahogany">Mahogany</option>
                <option value="Grevillea">Grevillea</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
                Ubunini (Dimensions)
              </label>
              <input
                type="text"
                value={dimensionsStr}
                onChange={(e) => setDimensionsStr(e.target.value)}
                placeholder="3m × 15cm × 5cm"
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 dark:border-[#B77A45]/30 text-sm font-semibold"
                required
              />
            </div>
          </div>

          {/* Quantity & Unit Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
                Ingano waguze (Pieces)
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => {
                  const q = Number(e.target.value) || 0;
                  setQuantity(q);
                  setAmountPaid(q * unitCost);
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 font-display font-bold text-lg"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
                Igiciro waguzeho kimwe (RWF)
              </label>
              <input
                type="number"
                value={unitCost}
                onChange={(e) => {
                  const c = Number(e.target.value) || 0;
                  setUnitCost(c);
                  setAmountPaid(quantity * c);
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 font-bold text-base text-[#8A5A38] dark:text-[#C9A45C]"
                required
              />
            </div>
          </div>

          {/* Settlement & Auto stock indicator */}
          <div className="p-4 rounded-2xl bg-[#EFE6D8]/60 dark:bg-[#1B120E]/70 border border-[#8A5A38]/20 space-y-3">
            <div className="flex items-center justify-between font-bold text-sm">
              <span className="text-[#75675C] dark:text-stone-400">Amafaranga yose hamwe:</span>
              <span className="font-display font-extrabold text-xl text-[#241A15] dark:text-white">
                {totalCost.toLocaleString()} RWF
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
                Wishyuye angahe ubu? (RWF)
              </label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/30 font-bold text-base text-emerald-700 dark:text-emerald-400"
              />
            </div>

            {remainingDebt > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center justify-between">
                <span>Umusigarije:</span>
                <span className="font-bold">{remainingDebt.toLocaleString()} RWF</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-[#8A5A38] dark:text-[#C9A45C] font-semibold pt-1">
              <PackageCheck className="w-4 h-4" />
              <span>Imbaho {quantity} zizahita zishyirwa muri stock y'ububiko ako kanya.</span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsAddOpen(false)}
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
              Emeza ibyo waguze
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
