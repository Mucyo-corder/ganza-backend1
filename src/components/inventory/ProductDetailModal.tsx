/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp ProductDetailModal
 * Shows complete wood metrics, movement history, and stock adjustment tools.
 */

import React, { useState } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import { InventoryItem } from '../../types/frontend.ts';
import { useData } from '../../context/DataContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { 
  Layers, 
  MapPin, 
  PlusCircle, 
  TrendingUp, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft,
  CheckCircle2
} from 'lucide-react';

interface ProductDetailModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onQuickSell?: (item: InventoryItem) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onQuickSell,
}) => {
  const { adjustStock, movements } = useData();
  const { showToast } = useToast();

  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustReason, setAdjustReason] = useState('Wongeye stock');

  if (!item) return null;

  const itemMovements = movements[item.id] || [
    {
      id: 'mov_default',
      inventoryId: item.id,
      speciesName: item.species,
      type: 'purchase',
      quantityDelta: item.quantity,
      balanceAfter: item.quantity,
      reason: 'Wongeye stock',
      timestamp: 'Ubu',
    },
  ];

  const handleApplyAdjustment = async () => {
    if (adjustQty === 0) return;
    await adjustStock(item.id, adjustQty, adjustReason);
    showToast(
      `${adjustQty > 0 ? 'Wongeye' : 'Wagabanije'} imbaho ${Math.abs(adjustQty)} muri stock.`,
      'success'
    );
    setIsAdjusting(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.species}
      subtitle={item.name}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Large Wood Image */}
        <div className="relative h-48 sm:h-60 w-full rounded-2xl overflow-hidden bg-[#2B1D16] border border-[#8A5A38]/30">
          <img
            src={
              item.imageUrl ||
              'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=800&auto=format&fit=crop&q=80'
            }
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Status & Dimensions Overlay */}
          <div className="absolute top-3 right-3">
            <StatusBadge status={item.status} />
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 text-sm font-bold text-[#C9A45C]">
              <Layers className="w-4 h-4" />
              <span>{item.dimensions.displayStr || `${item.dimensions.length}m × ${item.dimensions.width}cm × ${item.dimensions.thickness}cm`}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-stone-300 mt-1">
              <MapPin className="w-3.5 h-3.5 text-[#B77A45]" />
              <span>Aho biri: {item.locationArea}</span>
            </div>
          </div>
        </div>

        {/* 4 Essential Numbers Display */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/20 dark:border-[#B77A45]/20">
            <span className="text-xs text-[#75675C] dark:text-stone-400 block font-medium">
              Ingano (Pieces)
            </span>
            <span className="font-display font-extrabold text-2xl sm:text-3xl text-[#241A15] dark:text-white">
              {item.quantity}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/20 dark:border-[#B77A45]/20">
            <span className="text-xs text-[#75675C] dark:text-stone-400 block font-medium">
              Igiciro cyo kugura
            </span>
            <span className="font-display font-bold text-lg sm:text-xl text-[#75675C] dark:text-[#E2B994]">
              {item.costPrice.toLocaleString()} <span className="text-[10px]">RWF</span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/20 dark:border-[#B77A45]/20">
            <span className="text-xs text-[#75675C] dark:text-stone-400 block font-medium">
              Igiciro cyo kugurisha
            </span>
            <span className="font-display font-bold text-lg sm:text-xl text-[#8A5A38] dark:text-[#C9A45C]">
              {item.sellingPrice.toLocaleString()} <span className="text-[10px]">RWF</span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1B120E] border border-[#C9A45C]/40">
            <span className="text-xs text-[#75675C] dark:text-stone-400 block font-medium">
              Agaciro kose
            </span>
            <span className="font-display font-extrabold text-lg sm:text-xl text-[#241A15] dark:text-white">
              {item.totalValue.toLocaleString()} <span className="text-[10px] text-[#C9A45C]">RWF</span>
            </span>
          </div>
        </div>

        {/* Stock Adjustment Drawer */}
        {isAdjusting ? (
          <div className="p-4 rounded-2xl bg-[#EFE6D8]/60 dark:bg-[#1B120E] border border-[#C9A45C]/40 space-y-3 animate-in fade-in">
            <h4 className="font-bold text-sm text-[#241A15] dark:text-white">
              Ongeraho cyangwa gabanya imbaho
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#75675C] dark:text-stone-400 block mb-1">
                  Ingano (+ cyangwa -)
                </label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/30 dark:border-[#B77A45]/30 font-bold text-lg"
                />
              </div>
              <div>
                <label className="text-xs text-[#75675C] dark:text-stone-400 block mb-1">
                  Impamvu
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/30 dark:border-[#B77A45]/30 text-xs sm:text-sm font-medium"
                >
                  <option value="Wongeye stock">Wongeye stock</option>
                  <option value="Waziguze">Waziguze mu isoko</option>
                  <option value="Ikosa mu kubara">Ikosa mu kubara</option>
                  <option value="Imbaho zangiritse">Imbaho zangiritse</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdjusting(false)}
              >
                Kureka
              </Button>
              <Button
                variant="accent"
                size="sm"
                fullWidth
                onClick={handleApplyAdjustment}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Emeza ibihindutse
              </Button>
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAdjusting(!isAdjusting)}
            icon={<PlusCircle className="w-4 h-4 text-[#C9A45C]" />}
          >
            Ongeraho stock
          </Button>

          <Button
            variant="accent"
            size="md"
            onClick={() => {
              onClose();
              if (onQuickSell) onQuickSell(item);
            }}
            icon={<TrendingUp className="w-4 h-4" />}
          >
            Kugurisha
          </Button>
        </div>

        {/* Amateka y’imbaho (Stock Movements) */}
        <div className="pt-3 border-t border-[#8A5A38]/20 dark:border-[#B77A45]/20 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-bold text-base text-[#241A15] dark:text-white flex items-center gap-1.5">
              <History className="w-4 h-4 text-[#B77A45]" />
              Amateka y’imbaho
            </h4>
            <span className="text-xs text-[#75675C] dark:text-stone-400">
              Ibiheruka
            </span>
          </div>

          <div className="space-y-2">
            {itemMovements.map((mov) => {
              const isPositive = mov.quantityDelta > 0;
              return (
                <div
                  key={mov.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/15 dark:border-[#B77A45]/15 text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isPositive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-[#241A15] dark:text-white block">
                        {isPositive ? `+${mov.quantityDelta}` : mov.quantityDelta} — {mov.reason}
                      </span>
                      <span className="text-[11px] text-[#75675C] dark:text-stone-400">
                        {mov.timestamp}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-semibold text-xs text-[#75675C] dark:text-[#E2B994]">
                    Hasigaye: {mov.balanceAfter}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
